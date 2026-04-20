import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, X, Mic } from 'lucide-react';
import './CarMode.css';

const CarMode = ({ isOpen, onClose }) => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack 
  } = usePlayer();

  if (!isOpen || !currentTrack) return null;

  return (
    <div className="car-mode-overlay animate-fade-in">
      <div className="car-mode-header">
        <div className="car-brand">DRIVE MODE</div>
        <button className="car-close-btn" onClick={onClose}><X size={40} /></button>
      </div>

      <div className="car-track-display">
        <h1 className="car-title">{currentTrack.title}</h1>
        <h2 className="car-artist">{currentTrack.artist}</h2>
      </div>

      <div className="car-controls">
        <button className="car-skip-btn" onClick={prevTrack}><SkipBack size={64} fill="currentColor" /></button>
        <button className="car-play-btn" onClick={togglePlay}>
          {isPlaying ? <Pause size={100} fill="currentColor" /> : <Play size={100} fill="currentColor" />}
        </button>
        <button className="car-skip-btn" onClick={nextTrack}><SkipForward size={64} fill="currentColor" /></button>
      </div>

      <div className="car-footer">
        <button className="car-voice-btn">
          <Mic size={32} />
          <span>Tap to Speak</span>
        </button>
      </div>
    </div>
  );
};

export default CarMode;
