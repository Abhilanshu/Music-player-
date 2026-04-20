import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import TrackCard from '../components/TrackCard';
import { searchMusic } from '../services/api';
import { Play, Shuffle, RefreshCw } from 'lucide-react';
import './DiscoverWeekly.css';

const GENRE_MIXES = [
  { id: 'mix-1', label: '🔥 Today\'s Top Hits', query: 'top hits 2024', gradient: 'linear-gradient(135deg, #f953c6, #b91d73)' },
  { id: 'mix-2', label: '💛 Bollywood Romance', query: 'bollywood romantic songs', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
  { id: 'mix-3', label: '🎉 Party Anthems', query: 'party songs hindi', gradient: 'linear-gradient(135deg, #1a1a2e, #7b2ff7)' },
  { id: 'mix-4', label: '🎧 Punjabi Bangers', query: 'punjabi top songs 2024', gradient: 'linear-gradient(135deg, #f85032, #e73827)' },
  { id: 'mix-5', label: '🌙 Late Night Vibes', query: 'chill hindi songs night', gradient: 'linear-gradient(135deg, #141e30, #243b55)' },
  { id: 'mix-6', label: '🕉️ Devotional', query: 'bhajan aarti devotional', gradient: 'linear-gradient(135deg, #e0aa3e, #b8780a)' },
  { id: 'mix-7', label: '💔 Heart Break', query: 'sad breakup songs hindi', gradient: 'linear-gradient(135deg, #355c7d, #6c5b7b)' },
];

const MixCard = ({ mix, onPlay, isLoading }) => (
  <div className="mix-card" onClick={() => onPlay(mix)} role="button" tabIndex={0}>
    <div className="mix-cover" style={{ background: mix.gradient }}>
      <div className="mix-icon">🎵</div>
      {isLoading === mix.id && <div className="mix-spinner" />}
    </div>
    <div className="mix-info">
      <h3>{mix.label}</h3>
    </div>
    <div className="mix-play-btn">
      <Play size={24} fill="currentColor" />
    </div>
  </div>
);

const DiscoverWeekly = () => {
  const { playHistory, playTrack } = usePlayer();
  const [activeMix, setActiveMix] = useState(null);
  const [activeSongs, setActiveSongs] = useState([]);
  const [loadingMix, setLoadingMix] = useState(null);
  const [personalMixes, setPersonalMixes] = useState([]);

  // Build personal mixes from play history
  useEffect(() => {
    const historyItems = Object.values(playHistory || {});
    if (historyItems.length > 2) {
      // Group by artist to create personal mixes
      const artistCounts = {};
      historyItems.forEach(item => {
        const artist = item.track?.artist?.split(',')[0]?.trim();
        if (artist) {
          artistCounts[artist] = (artistCounts[artist] || 0) + item.count;
        }
      });

      const topArtists = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([artist], i) => ({
          id: `personal-${i}`,
          label: `Based on ${artist}`,
          query: `${artist} songs`,
          gradient: `linear-gradient(135deg, hsl(${i * 80}, 70%, 40%), hsl(${i * 80 + 40}, 60%, 25%))`,
          isPersonal: true,
        }));

      setPersonalMixes(topArtists);
    }
  }, [playHistory]);

  const handlePlayMix = async (mix) => {
    setLoadingMix(mix.id);
    try {
      const songs = await searchMusic(mix.query, 30);
      if (songs.length > 0) {
        setActiveMix(mix);
        setActiveSongs(songs);
        playTrack(songs[0], songs);
      }
    } catch (e) {
      console.error('Mix load failed', e);
    }
    setLoadingMix(null);
  };

  const allMixes = [...(personalMixes.length > 0 ? personalMixes : []), ...GENRE_MIXES];

  return (
    <div className="discover-page animate-fade-in">
      <div className="discover-hero glass">
        <div className="hero-icon">🎵</div>
        <div className="hero-text">
          <h1>Discover Weekly</h1>
          <p className="text-muted">Algorithmically curated mixes made just for you, refreshed every session.</p>
        </div>
        {activeMix && (
          <div className="now-mix-badge">
            Now Playing: <strong>{activeMix.label}</strong>
          </div>
        )}
      </div>

      {personalMixes.length > 0 && (
        <section className="discover-section">
          <h2 className="section-heading">🧬 Your Personal Mixes</h2>
          <div className="mixes-grid">
            {personalMixes.map(mix => (
              <MixCard key={mix.id} mix={mix} onPlay={handlePlayMix} isLoading={loadingMix} />
            ))}
          </div>
        </section>
      )}

      <section className="discover-section">
        <h2 className="section-heading">🌍 Genre Mixes</h2>
        <div className="mixes-grid">
          {GENRE_MIXES.map(mix => (
            <MixCard key={mix.id} mix={mix} onPlay={handlePlayMix} isLoading={loadingMix} />
          ))}
        </div>
      </section>

      {activeSongs.length > 0 && (
        <section className="discover-section">
          <div className="section-header-row">
            <h2 className="section-heading">Now Playing: {activeMix?.label}</h2>
            <button className="icon-btn text-muted" onClick={() => handlePlayMix(activeMix)}>
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="discover-tracklist">
            {activeSongs.map((track) => (
              <TrackCard key={track.id} track={track} contextQueue={activeSongs} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default DiscoverWeekly;
