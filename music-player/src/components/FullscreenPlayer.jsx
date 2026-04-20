import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Heart, ListMusic, Volume2 } from 'lucide-react';
import './FullscreenPlayer.css';

const FullscreenPlayer = ({ isOpen, onClose }) => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    currentTime, 
    duration, 
    seek,
    likedSongs,
    toggleLiked,
    volume,
    setVolume
  } = usePlayer();

  if (!isOpen || !currentTrack) return null;

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fullscreen-overlay animate-fade-in">
      {/* Dynamic Animated Background */}
      <div className="dynamic-bg" style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}>
        <div className="bg-overlay" />
      </div>

      <div className="fullscreen-content">
        <button className="fs-close-btn" onClick={onClose}>
          <ChevronDown size={32} />
        </button>

        <div className="fs-main-area">
          <div className="fs-cover-container">
            <img src={currentTrack.coverUrl} alt="cover" className="fs-cover animate-pulse-subtle" />
          </div>

          <div className="fs-track-info">
            <div className="fs-text-group">
              <h1 className="fs-title">{currentTrack.title}</h1>
              <h2 className="fs-artist text-muted">{currentTrack.artist}</h2>
            </div>
            <button 
              className="fs-like-btn" 
              onClick={() => toggleLiked(currentTrack)}
              style={{ color: likedSongs.find(t => t.id === currentTrack.id) ? '#ff4b4b' : '' }}
            >
              <Heart size={32} fill={likedSongs.find(t => t.id === currentTrack.id) ? '#ff4b4b' : 'none'} />
            </button>
          </div>

          <div className="fs-progress-area">
            <div className="fs-time-row">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input 
              type="range" 
              className="fs-progress-bar" 
              min={0} 
              max={duration || 100} 
              value={currentTime} 
              onChange={(e) => seek(Number(e.target.value))}
            />
          </div>

          <div className="fs-controls">
            <button className="fs-control-btn" onClick={prevTrack}><SkipBack size={32} /></button>
            <button className="fs-play-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
            </button>
            <button className="fs-control-btn" onClick={nextTrack}><SkipForward size={32} /></button>
          </div>
        </div>

        <div className="fs-footer">
          <div className="fs-volume-row">
            <Volume2 size={20} className="text-muted" />
            <input 
              type="range" 
              className="fs-volume-bar" 
              min={0} max={1} step={0.01} 
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </div>
          <p className="fs-brand">MUSE PREMIUM</p>
        </div>
      </div>
    </div>
  );
};

export default FullscreenPlayer;
