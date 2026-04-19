import React, { useEffect, useState, useCallback } from 'react';
import { getLiveTrending, getPlaylistSongs } from '../services/api';
import TrackCard from '../components/TrackCard';
import { usePlayer } from '../context/PlayerContext';
import { Play, Loader } from 'lucide-react';
import './Home.css';

const PlaylistCard = ({ item, onPlay }) => {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    await onPlay(item.id);
    setLoading(false);
  };

  return (
    <div className="chart-card" onClick={handleClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}>
      <div className="chart-cover-wrapper">
        <img src={item.coverUrl} alt={item.title} className="chart-cover" loading="lazy" />
        <div className={`chart-overlay ${loading ? 'loading' : ''}`}>
          {loading
            ? <Loader size={28} className="spin-icon" />
            : <Play size={28} fill="white" />
          }
        </div>
      </div>
      <span className="chart-title">{item.title}</span>
    </div>
  );
};

const ShelfRow = ({ title, items, isTrackCard, playerQueue, onPlaylistClick }) => {
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
              <PlaylistCard item={item} onPlay={onPlaylistClick} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Home = () => {
  const [data, setData] = useState({ trending: [], charts: [], playlists: [] });
  const [loading, setLoading] = useState(true);
  const { playTrack, setQueue } = usePlayer();

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      const modules = await getLiveTrending();
      if (modules) {
        setData(modules);
      }
      setLoading(false);
    };
    
    fetchHomeData();
  }, []);

  const playTopTrack = () => {
    if (data.trending && data.trending.length > 0) {
      playTrack(data.trending[0], data.trending);
    }
  };

  // Called when user clicks a Chart or Playlist card — lazy fetch, cached
  const handlePlaylistClick = useCallback(async (playlistId) => {
    const songs = await getPlaylistSongs(playlistId);
    if (songs && songs.length > 0) {
      playTrack(songs[0], songs);
    }
  }, [playTrack]);

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
          <ShelfRow title="Top Internet Charts" items={data.charts} isTrackCard={false} onPlaylistClick={handlePlaylistClick} />
          <ShelfRow title="Curated Playlists" items={data.playlists} isTrackCard={false} onPlaylistClick={handlePlaylistClick} />
        </div>
      )}
    </div>
  );
};

export default Home;
