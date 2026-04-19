import React, { useEffect, useState, useCallback } from 'react';
import { getLiveTrending, getPlaylistSongs } from '../services/api';
import TrackCard from '../components/TrackCard';
import PlaylistModal from '../components/PlaylistModal';
import { usePlayer } from '../context/PlayerContext';
import { Play, Loader } from 'lucide-react';
import './Home.css';

/* ---- Chart/Playlist Card ---- */
const PlaylistCard = ({ item, onOpen }) => (
  <div
    className="chart-card"
    onClick={() => onOpen(item)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}
  >
    <div className="chart-cover-wrapper">
      <img src={item.coverUrl} alt={item.title} className="chart-cover" loading="lazy" />
      <div className="chart-overlay">
        <Play size={28} fill="white" />
      </div>
    </div>
    <span className="chart-title">{item.title}</span>
  </div>
);

/* ---- Horizontal Shelf with nav arrows ---- */
const ShelfRow = ({ title, items, isTrackCard, playerQueue, onOpenPlaylist }) => {
  const scrollRef = React.useRef(null);
  const scroll = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="shelf">
      <div className="section-header">
        <h2>{title}</h2>
        <div className="scroll-arrows">
          <button className="nav-arrow" onClick={() => scroll(-300)}>&lt;</button>
          <button className="nav-arrow" onClick={() => scroll(300)}>&gt;</button>
        </div>
      </div>
      <div className="tracks-scroll-row hide-scrollbar" ref={scrollRef}>
        {items.map((item) => (
          <div className="scroll-item" key={item.id}>
            {isTrackCard ? (
              <TrackCard track={item} contextQueue={playerQueue} />
            ) : (
              <PlaylistCard item={item} onOpen={onOpenPlaylist} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---- Main Home Page ---- */
const Home = () => {
  const [data, setData] = useState({ trending: [], charts: [], playlists: [] });
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modal, setModal] = useState(null); // { playlist: {id, title, coverUrl}, songs: [], loading: true }

  const { playTrack } = usePlayer();

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      const modules = await getLiveTrending();
      if (modules) setData(modules);
      setLoading(false);
    };
    fetchHomeData();
  }, []);

  const playTopTrack = () => {
    if (data.trending && data.trending.length > 0) {
      playTrack(data.trending[0], data.trending);
    }
  };

  // Open modal immediately with loading state, then fetch songs
  const handleOpenPlaylist = useCallback(async (item) => {
    // Show modal right away with spinner
    setModal({ playlist: item, songs: [], loading: true });
    const songs = await getPlaylistSongs(item.id);
    // Update with actual songs
    setModal({ playlist: item, songs: songs || [], loading: false });
  }, []);

  const handleCloseModal = useCallback(() => setModal(null), []);

  return (
    <div className="home-page animate-fade-in">
      <div className="hero-section glass">
        <div className="hero-content">
          <span className="badge">V3 Upgrade: Live Service</span>
          <h1 className="hero-title">Realtime Internet Trends</h1>
          <p className="hero-subtitle">You are now connected to the live Internet Microservice grid. As new songs drop and chart globally, they automatically appear right here.</p>
          <button className="play-all-btn" onClick={playTopTrack} disabled={loading || data.trending.length === 0}>
            <Play fill="currentColor" size={20} />
            Play Global Trending
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Connecting to Live Data Grid...</p>
        </div>
      ) : (
        <div className="shelves-container">
          <ShelfRow title="Live Global Trending" items={data.trending} isTrackCard={true} playerQueue={data.trending} />
          <ShelfRow title="Top Internet Charts" items={data.charts} isTrackCard={false} onOpenPlaylist={handleOpenPlaylist} />
          <ShelfRow title="Curated Playlists" items={data.playlists} isTrackCard={false} onOpenPlaylist={handleOpenPlaylist} />
        </div>
      )}

      {/* Playlist detail modal */}
      {modal && (
        <PlaylistModal
          playlist={modal.playlist}
          songs={modal.songs}
          loading={modal.loading}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Home;
