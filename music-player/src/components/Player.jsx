import React, { useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import './Player.css';

const Player = () => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    volume, 
    setVolume,
    currentTime,
    duration,
    seek
  } = usePlayer();

  const handleSeek = (e) => {
    seek(Number(e.target.value));
  };

  const handleVolume = (e) => {
    setVolume(Number(e.target.value));
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="player-bar glass">
      <div className="player-layout">
        
        {/* Track Info */}
        <div className="track-info animate-fade-in">
          <img src={currentTrack.coverUrl} alt="Cover" className="track-cover" />
          <div className="track-details">
            <h4 className="truncate">{currentTrack.title}</h4>
            <p className="truncate text-muted">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="player-controls">
          <div className="control-buttons">
            <button className="control-btn" onClick={prevTrack}><SkipBack size={20} /></button>
            <button className="play-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            <button className="control-btn" onClick={nextTrack}><SkipForward size={20} /></button>
          </div>
          
          <div className="progress-container">
            <span className="time">{formatTime(currentTime)}</span>
            <input 
              type="range" 
              className="progress-bar" 
              min={0} 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
            />
            <span className="time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="volume-controls hidden-on-mobile">
          <button className="control-btn" onClick={() => setVolume(volume === 0 ? 1 : 0)}>
            {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input 
            type="range" 
            className="volume-bar" 
            min={0} 
            max={1} 
            step={0.01} 
            value={volume} 
            onChange={handleVolume}
          />
        </div>

      </div>
      
      {/* Mobile continuous progress bar at absolute top */}
      <div className="mobile-progress md-hidden" style={{ width: `${(currentTime/(duration||30))*100}%` }}></div>
    </div>
  );
};

export default Player;
