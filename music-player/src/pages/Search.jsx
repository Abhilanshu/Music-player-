import React, { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, ListMusic, Disc, Music, Play, Loader, X } from 'lucide-react';
import { searchAll, getPlaylistSongs } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import TrackCard from '../components/TrackCard';
import './Search.css';

import TrackRow from '../components/TrackRow';

const TABS = ['All', 'Songs', 'Playlists', 'Albums'];

// A row for a playlist or album result (like Spotify)
const CollectionRow = ({ item, onOpen }) => (
  <div className="collection-row" onClick={() => onOpen(item)} role="button" tabIndex={0}>
    <img src={item.coverUrl} alt={item.title} className="collection-thumb" />
    <div className="collection-info">
      <div className="collection-title">{item.title}</div>
      <div className="collection-subtitle text-muted">
        {item.type === 'playlist' ? 'Playlist' : 'Album'}
        {item.subtitle ? ` · ${item.subtitle}` : ''}
      </div>
    </div>
    <button className="collection-play-btn">
      <Play size={18} fill="currentColor" />
    </button>
  </div>
);

// Playlist detail slide-in panel (like Spotify's playlist view)
const PlaylistPanel = ({ collection, songs, loading, onClose, onPlay }) => (
  <div className="playlist-panel animate-fade-in">
    <div className="panel-header glass">
      <button className="icon-btn" onClick={onClose}><X size={22} /></button>
      <h2 className="truncate">{collection.title}</h2>
      {songs.length > 0 && (
        <button className="play-all-btn" onClick={() => onPlay(songs[0], songs)}>
          <Play size={18} fill="currentColor" /> Play All
        </button>
      )}
    </div>

    <div className="panel-cover">
      <img src={collection.coverUrl} alt={collection.title} />
      <div className="panel-cover-info">
        <h1>{collection.title}</h1>
        <p className="text-muted">{collection.subtitle}</p>
        <p className="text-muted">{songs.length} songs</p>
      </div>
    </div>

    <div className="panel-tracks">
      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : songs.length === 0 ? (
        <div className="empty-state"><p>No songs found in this collection.</p></div>
      ) : (
        songs.map((track, i) => (
          <TrackRow 
            key={`${track.id}-${i}`} 
            track={track} 
            index={i} 
            contextQueue={songs} 
          />
        ))
      )}
    </div>
  </div>
);

const Search = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState({ songs: [], playlists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [openCollection, setOpenCollection] = useState(null); // { item, songs, loading }

  const { playTrack } = usePlayer();

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ songs: [], playlists: [], albums: [] });
      setHasSearched(false);
      return;
    }
    const doSearch = async () => {
      setLoading(true);
      setHasSearched(true);
      setActiveTab('All');
      const data = await searchAll(debouncedQuery);
      setResults(data);
      setLoading(false);
    };
    doSearch();
  }, [debouncedQuery]);

  const handleOpenCollection = useCallback(async (item) => {
    setOpenCollection({ item, songs: [], loading: true });
    const songs = await getPlaylistSongs(item.id);
    setOpenCollection({ item, songs: songs || [], loading: false });
  }, []);

  const totalResults = results.songs.length + results.playlists.length + results.albums.length;
  const hasResults = totalResults > 0;

  const visibleSongs = activeTab === 'All' || activeTab === 'Songs' ? results.songs : [];
  const visiblePlaylists = activeTab === 'All' || activeTab === 'Playlists' ? results.playlists : [];
  const visibleAlbums = activeTab === 'All' || activeTab === 'Albums' ? results.albums : [];

  return (
    <div className="search-page animate-fade-in">
      {/* Search Bar */}
      <div className="search-header">
        <div className="search-bar glass">
          <SearchIcon size={20} className="search-icon" />
          <input
            type="text"
            placeholder="What do you want to play? Songs, playlists, albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')}><X size={18} /></button>
          )}
        </div>

        {/* Category Tabs (show after searching) */}
        {hasSearched && hasResults && (
          <div className="search-tabs">
            {TABS.map(tab => (
              <button
                key={tab}
                className={`search-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab !== 'All' && (
                  <span className="tab-count">
                    {tab === 'Songs' ? results.songs.length :
                     tab === 'Playlists' ? results.playlists.length :
                     results.albums.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="search-results">
        {loading ? (
          <div className="loading-state"><div className="spinner" /></div>
        ) : hasSearched && !hasResults ? (
          <div className="empty-state">
            <h3>No results for "{debouncedQuery}"</h3>
            <p>Try different keywords or check spelling.</p>
          </div>
        ) : hasResults ? (
          <div className="search-results-body">

            {/* Playlists Section */}
            {visiblePlaylists.length > 0 && (
              <section className="results-section">
                <h2 className="results-section-title">
                  <ListMusic size={20} /> Playlists
                </h2>
                <div className="collections-list">
                  {visiblePlaylists.map(item => (
                    <CollectionRow key={item.id} item={item} onOpen={handleOpenCollection} />
                  ))}
                </div>
              </section>
            )}

            {/* Albums Section */}
            {visibleAlbums.length > 0 && (
              <section className="results-section">
                <h2 className="results-section-title">
                  <Disc size={20} /> Albums
                </h2>
                <div className="collections-list">
                  {visibleAlbums.map(item => (
                    <CollectionRow key={item.id} item={item} onOpen={handleOpenCollection} />
                  ))}
                </div>
              </section>
            )}

            {/* Songs Section */}
            {visibleSongs.length > 0 && (
              <section className="results-section">
                <h2 className="results-section-title">
                  <Music size={20} /> Songs
                </h2>
                <div className="tracks-grid">
                  {visibleSongs.map(track => (
                    <TrackCard key={track.id} track={track} contextQueue={visibleSongs} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="empty-state search-placeholder">
            <SearchIcon size={52} opacity={0.15} />
            <h3>Find your next favorite</h3>
            <p>Search for songs, playlists, albums or artists</p>
          </div>
        )}
      </div>

      {/* Playlist / Album Side Panel */}
      {openCollection && (
        <>
          <div className="panel-overlay" onClick={() => setOpenCollection(null)} />
          <PlaylistPanel
            collection={openCollection.item}
            songs={openCollection.songs}
            loading={openCollection.loading}
            onClose={() => setOpenCollection(null)}
            onPlay={playTrack}
          />
        </>
      )}
    </div>
  );
};

export default Search;
