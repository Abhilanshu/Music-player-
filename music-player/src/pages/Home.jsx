import React, { useEffect, useState } from 'react';
import { getLiveTrending } from '../services/api';
import TrackCard from '../components/TrackCard';
import { usePlayer } from '../context/PlayerContext';
import { Play } from 'lucide-react';
import './Home.css';

const ShelfRow = ({ title, items, isTrackCard, playerQueue }) => {
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
              <div className="chart-card">
                <img src={item.coverUrl} alt={item.title} className="chart-cover" />
                <span className="chart-title">{item.title}</span>
              </div>
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
          <ShelfRow title="Top Internet Charts" items={data.charts} isTrackCard={false} />
          <ShelfRow title="Curated Playlists" items={data.playlists} isTrackCard={false} />
        </div>
      )}
    </div>
  );
};

export default Home;
