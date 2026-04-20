import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, MoreVertical, Heart, FastForward, Download, Check, Plus } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { saveTrackOffline } from '../services/OfflineManager';
import './TrackRow.css';

const TrackRow = ({ track, index, contextQueue }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, queueNext, playlists, setPlaylists, likedSongs, toggleLiked } = usePlayer();
  const [showMenu, setShowMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const menuRef = useRef(null);

  const isCurrentTrack = currentTrack?.id === track.id;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handlePlay = (e) => {
    if (e.target.closest('.track-menu-container')) return;
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, contextQueue);
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    const success = await saveTrackOffline(track);
    setIsDownloading(false);
    if (success) setIsDownloaded(true);
    setShowMenu(false);
  };

  const handleAddToPlaylist = (e, playlistId) => {
    e.stopPropagation();
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId && !p.tracks.find(t => t.id === track.id)) {
        return { ...p, tracks: [...p.tracks, track] };
      }
      return p;
    }));
    setShowMenu(false);
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={`track-row ${isCurrentTrack ? 'active' : ''}`} onClick={handlePlay}>
      <div className="row-prefix">
        {isCurrentTrack && isPlaying ? (
          <div className="playing-bars">
            <div className="bar"></div><div className="bar"></div><div className="bar"></div>
          </div>
        ) : (
          <span className="row-num text-muted">{index + 1}</span>
        )}
      </div>

      <img src={track.coverUrl} alt={track.title} className="row-thumb" />

      <div className="row-info">
        <div className="row-title truncate">{track.title}</div>
        <div className="row-artist truncate text-muted">{track.artist}</div>
      </div>

      <div className="row-duration text-muted">{formatTime(track.duration)}</div>

      <div className="track-menu-container" ref={menuRef}>
        <button className="row-menu-btn" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
          <MoreVertical size={18} />
        </button>

        {showMenu && (
          <div className="track-dropdown-menu glass animate-fade-in" style={{ top: 'auto', bottom: '100%', right: '0', marginBottom: '8px' }}>
            <button className="menu-item" onClick={(e) => { e.stopPropagation(); toggleLiked(track); setShowMenu(false); }}>
              <Heart size={16} fill={likedSongs.find(t => t.id === track.id) ? '#ff4b4b' : 'none'} color={likedSongs.find(t => t.id === track.id) ? '#ff4b4b' : 'currentColor'} /> 
              {likedSongs.find(t => t.id === track.id) ? 'Unlike' : 'Like'}
            </button>
            <button className="menu-item" onClick={(e) => { e.stopPropagation(); queueNext(track); setShowMenu(false); }}>
              <FastForward size={16} /> Play Next
            </button>
            <button className="menu-item" onClick={handleDownload} disabled={isDownloading || isDownloaded}>
              {isDownloading ? <><div className="spinner-mini"></div> Downloading...</> : isDownloaded ? <><Check size={16} color="var(--primary)" /> Downloaded</> : <><Download size={16} /> Download Offline</>}
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
  );
};

export default TrackRow;
