import React, { useEffect, useRef } from 'react';
import { X, Play, Pause, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import './PlaylistModal.css';

const PlaylistModal = ({ playlist, songs, loading, onClose }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const overlayRef = useRef(null);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handlePlayAll = () => {
    if (songs && songs.length > 0) {
      playTrack(songs[0], songs);
    }
  };

  const handleTrackClick = (track) => {
    const isCurrentTrack = currentTrack?.id === track.id;
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, songs);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-backdrop" ref={overlayRef} onClick={handleBackdropClick}>
      <div className="playlist-modal animate-slide-up">
        {/* Header */}
        <div className="modal-header">
          {playlist?.coverUrl && (
            <img src={playlist.coverUrl} alt={playlist.title} className="modal-cover" />
          )}
          <div className="modal-meta">
            <span className="modal-label">Playlist</span>
            <h2 className="modal-title">{playlist?.title}</h2>
            <p className="modal-subtitle">
              {loading ? 'Loading...' : `${songs?.length || 0} songs`}
            </p>
            {!loading && songs?.length > 0 && (
              <button className="modal-play-all" onClick={handlePlayAll}>
                <Play size={18} fill="white" />
                Play All
              </button>
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* Song List */}
        <div className="modal-track-list">
          {loading ? (
            <div className="modal-loading">
              <div className="spinner" />
              <p>Loading songs...</p>
            </div>
          ) : songs?.length === 0 ? (
            <div className="modal-empty">
              <Music size={48} opacity={0.3} />
              <p>No playable songs found</p>
            </div>
          ) : (
            songs.map((track, index) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`modal-track-row ${isActive ? 'active' : ''}`}
                  onClick={() => handleTrackClick(track)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrackClick(track)}
                >
                  <div className="modal-track-num">
                    {isActive && isPlaying ? (
                      <div className="eq-bars">
                        <span /><span /><span />
                      </div>
                    ) : (
                      <span className="track-num-label">{index + 1}</span>
                    )}
                  </div>
                  <img src={track.coverUrl} alt={track.title} className="modal-track-thumb" loading="lazy" />
                  <div className="modal-track-info">
                    <span className="modal-track-title">{track.title}</span>
                    <span className="modal-track-artist">{track.artist}</span>
                  </div>
                  <span className="modal-track-duration">{formatDuration(track.duration)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistModal;
