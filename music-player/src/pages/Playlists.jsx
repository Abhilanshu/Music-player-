import React, { useState, useEffect } from 'react';
import { ListMusic, Plus, Play, Trash2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import TrackCard from '../components/TrackCard';
import './Playlists.css';

const Playlists = () => {
  const { playTrack, currentTrack } = usePlayer();
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Load playlists from local storage
  useEffect(() => {
    const saved = localStorage.getItem('muse_playlists');
    if (saved) {
      setPlaylists(JSON.parse(saved));
    } else {
      // Default empty state
      setPlaylists([]);
    }
  }, []);

  // Save playlists to local storage
  const savePlaylists = (newPlaylists) => {
    setPlaylists(newPlaylists);
    localStorage.setItem('muse_playlists', JSON.stringify(newPlaylists));
  };

  const createPlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    
    const newPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      tracks: [],
      createdAt: new Date().toISOString()
    };
    
    savePlaylists([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setIsCreating(false);
    setActivePlaylist(newPlaylist);
  };

  const deletePlaylist = (id) => {
    const updated = playlists.filter(p => p.id !== id);
    savePlaylists(updated);
    if (activePlaylist?.id === id) {
      setActivePlaylist(null);
    }
  };

  const removeTrackFromPlaylist = (playlistId, trackId) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
      }
      return p;
    });
    savePlaylists(updated);
    if (activePlaylist?.id === playlistId) {
      setActivePlaylist(updated.find(p => p.id === playlistId));
    }
  };

  const playPlaylist = () => {
    if (activePlaylist && activePlaylist.tracks.length > 0) {
      playTrack(activePlaylist.tracks[0], activePlaylist.tracks);
    }
  };

  // Utility to add current track to playlist (for demo purposes)
  const addCurrentTrackToPlaylist = (playlistId) => {
    if (!currentTrack) return;
    
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        // Prevent duplicates
        if (!p.tracks.find(t => t.id === currentTrack.id)) {
          return { ...p, tracks: [...p.tracks, currentTrack] };
        }
      }
      return p;
    });
    
    savePlaylists(updated);
    if (activePlaylist?.id === playlistId) {
      setActivePlaylist(updated.find(p => p.id === playlistId));
    }
  };

  return (
    <div className="playlists-page animate-fade-in">
      <div className="playlists-sidebar glass">
        <div className="playlists-header">
          <h2>Your Library</h2>
          <button className="add-btn" onClick={() => setIsCreating(!isCreating)}>
            <Plus size={20} />
          </button>
        </div>
        
        {isCreating && (
          <form className="create-playlist-form" onSubmit={createPlaylist}>
            <input 
              type="text" 
              placeholder="Playlist name..." 
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              autoFocus
            />
            <button type="submit">Create</button>
          </form>
        )}

        <div className="playlists-list">
          {playlists.length === 0 && !isCreating ? (
            <p className="empty-text text-muted">No playlists yet. Create one!</p>
          ) : (
            playlists.map(playlist => (
              <div 
                key={playlist.id} 
                className={`playlist-item ${activePlaylist?.id === playlist.id ? 'active' : ''}`}
                onClick={() => setActivePlaylist(playlist)}
              >
                <div className="playlist-icon"><ListMusic size={18} /></div>
                <div className="playlist-info">
                  <span className="truncate">{playlist.name}</span>
                  <small>{playlist.tracks.length} tracks</small>
                </div>
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlaylist(playlist.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="playlist-content panel">
        {activePlaylist ? (
          <div className="active-playlist-view animate-fade-in">
            <div className="playlist-hero">
              <div className="playlist-cover glass">
                <ListMusic size={64} opacity={0.5} />
              </div>
              <div className="playlist-details">
                <span className="badge">Playlist</span>
                <h1 className="hero-title">{activePlaylist.name}</h1>
                <p className="text-muted">{activePlaylist.tracks.length} songs</p>
                
                <div className="action-buttons">
                  <button className="play-all-btn" onClick={playPlaylist} disabled={activePlaylist.tracks.length === 0}>
                    <Play fill="currentColor" size={20} />
                    Play
                  </button>
                  {currentTrack && (
                    <button className="add-current-btn panel" onClick={() => addCurrentTrackToPlaylist(activePlaylist.id)}>
                      <Plus size={18} /> Add Current Song
                    </button>
                  )}
                </div>
              </div>
            </div>

            {activePlaylist.tracks.length > 0 ? (
              <div className="tracks-list">
                {activePlaylist.tracks.map((track, index) => (
                  <div className="list-track-item glass" key={`${track.id}-${index}`}>
                    <img src={track.coverUrl} alt="cover" />
                    <div className="track-info">
                      <h4>{track.title}</h4>
                      <p>{track.artist}</p>
                    </div>
                    <button className="icon-btn" onClick={() => playTrack(track, activePlaylist.tracks)}>
                      <Play size={18} fill="currentColor" />
                    </button>
                    <button className="icon-btn remove-btn" onClick={() => removeTrackFromPlaylist(activePlaylist.id, track.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-playlist">
                <ListMusic size={48} opacity={0.2} />
                <h3>It's a bit empty here...</h3>
                <p>Play a song and click "Add Current Song" to build your playlist.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <ListMusic size={48} opacity={0.2} />
            <h3>Select a playlist</h3>
            <p>Or create a new one from the sidebar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlists;
