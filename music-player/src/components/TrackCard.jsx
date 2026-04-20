import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, MoreVertical, Plus, FastForward, Heart, Download, Check } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { saveTrackOffline } from '../services/OfflineManager';
import './TrackCard.css';

const TrackCard = ({ track, contextQueue }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, queueNext, playlists, setPlaylists, likedSongs, toggleLiked } = usePlayer();
  const [showMenu, setShowMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    const success = await saveTrackOffline(track);
    setIsDownloading(false);
    if (success) setIsDownloaded(true);
    setShowMenu(false);
  };
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeAction, setSwipeAction] = useState(null); // 'queue' when swiped right
  const menuRef = useRef(null);
  const touchStartX = useRef(null);

  const isCurrentTrack = currentTrack?.id === track.id;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleClick = (e) => {
    // Don't play if clicking the menu
    if (e.target.closest('.track-menu-container')) return;
    // Don't trigger play if it was a swipe
    if (Math.abs(swipeOffset) > 10) return;
    
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, contextQueue);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipeOffset(0);
    setSwipeAction(null);
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    // Only allow right swipe (positive diff), cap at 100px
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 100));
      if (diff > 60) setSwipeAction('queue');
      else setSwipeAction(null);
    }
  };

  const handleTouchEnd = () => {
    if (swipeAction === 'queue') {
      queueNext(track);
    }
    // Animate back
    setSwipeOffset(0);
    setSwipeAction(null);
    touchStartX.current = null;
  };

  const handlePlayNext = (e) => {
    e.stopPropagation();
    queueNext(track);
    setShowMenu(false);
  };

  const handleAddToPlaylist = (e, playlistId) => {
    e.stopPropagation();
    const updated = playlists.map(p => {
      if (p.id === playlistId && !p.tracks.find(t => t.id === track.id)) {
        return { ...p, tracks: [...p.tracks, track] };
      }
      return p;
    });
    setPlaylists(updated);
    setShowMenu(false);
  };

  return (
    <div
      className={`track-card panel ${isCurrentTrack ? 'active' : ''} ${swipeAction === 'queue' ? 'swiping-queue' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
      title={`Play ${track.title}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${swipeOffset}px)`, transition: swipeOffset === 0 ? 'transform 0.3s ease' : 'none' }}
    >
      {/* Swipe hint label */}
      {swipeOffset > 20 && (
        <div className="swipe-indicator" style={{ opacity: swipeOffset / 100 }}>
          <FastForward size={18} /> Play Next
        </div>
      )}
      <div className="card-image-container">
        <img src={track.coverUrl} alt={track.title} loading="lazy" />
        <div className="card-play-btn">
          {isCurrentTrack && isPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
          )}
        </div>
      </div>
      <div className="card-info-row">
        <div className="card-info">
          <h4 className="truncate" title={track.title}>{track.title}</h4>
          <p className="truncate text-muted" title={track.artist}>{track.artist}</p>
        </div>
        
        <div className="track-menu-container" ref={menuRef}>
          <button 
            className="menu-toggle-btn" 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            title="More Options"
          >
            <MoreVertical size={20} />
          </button>
          
          {showMenu && (
            <div className="track-dropdown-menu glass animate-fade-in">
              <button className="menu-item" onClick={(e) => { e.stopPropagation(); toggleLiked(track); setShowMenu(false); }}>
                <Heart size={16} fill={likedSongs.find(t => t.id === track.id) ? '#ff4b4b' : 'none'} color={likedSongs.find(t => t.id === track.id) ? '#ff4b4b' : 'currentColor'} /> 
                {likedSongs.find(t => t.id === track.id) ? 'Unlike' : 'Like'}
              </button>
              <button className="menu-item" onClick={handlePlayNext}>
                <FastForward size={16} /> Play Next
              </button>
              <button className="menu-item" onClick={handleDownload} disabled={isDownloading || isDownloaded}>
                {isDownloading ? (
                  <> <div className="spinner-mini"></div> Downloading...</>
                ) : isDownloaded ? (
                  <> <Check size={16} color="var(--primary)" /> Downloaded</>
                ) : (
                  <> <Download size={16} /> Download Offline</>
                )}
              </button>
              
              <div className="menu-divider"></div>
              <div className="menu-subtitle">Add to Playlist</div>
              
              {playlists.length === 0 ? (
                <div className="menu-item disabled">No playlists yet</div>
              ) : (
                playlists.map(p => (
                  <button key={p.id} className="menu-item" onClick={(e) => handleAddToPlaylist(e, p.id)}>
                    <Plus size={16} /> {p.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackCard;
