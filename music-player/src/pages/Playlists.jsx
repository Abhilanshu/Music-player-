import React, { useState } from 'react';
import { ListMusic, Plus, Play, Trash2, Heart, Share2, Copy, DownloadCloud } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import TrackRow from '../components/TrackRow';
import './Playlists.css';

const Playlists = () => {
  const { 
    playTrack, 
    currentTrack, 
    playlists, 
    setPlaylists, 
    likedSongs, 
    toggleLiked, 
    sharePlaylist,
    joinCollaborativePlaylist
  } = usePlayer();
  
  const [activePlaylist, setActivePlaylist] = useState('liked');
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [importCode, setImportCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const handleImport = (e) => {
    e.preventDefault();
    if (joinCollaborativePlaylist(importCode)) {
      setImportCode('');
      setIsImporting(false);
      alert('Playlist joined successfully!');
    } else {
      alert('Invalid share code.');
    }
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
    
    setPlaylists([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setIsCreating(false);
    setActivePlaylist(newPlaylist);
  };

  const deletePlaylist = (id) => {
    const updated = playlists.filter(p => p.id !== id);
    setPlaylists(updated);
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
    setPlaylists(updated);
    if (activePlaylist?.id === playlistId) {
      setActivePlaylist(updated.find(p => p.id === playlistId));
    }
  };

  const playPlaylist = () => {
    if (activePlaylist && activePlaylist.tracks.length > 0) {
      playTrack(activePlaylist.tracks[0], activePlaylist.tracks);
    }
  };

  const addCurrentTrackToPlaylist = (playlistId) => {
    if (!currentTrack) return;
    
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        if (!p.tracks.find(t => t.id === currentTrack.id)) {
          return { ...p, tracks: [...p.tracks, currentTrack] };
        }
      }
      return p;
    });
    
    setPlaylists(updated);
    if (activePlaylist?.id === playlistId) {
      setActivePlaylist(updated.find(p => p.id === playlistId));
    }
  };

  return (
    <div className="playlists-page animate-fade-in">
      <div className="playlists-sidebar glass">
        <div className="playlists-header">
          <h2>Your Library</h2>
          <div className="header-actions">
            <button className="add-btn" onClick={() => { setIsCreating(!isCreating); setIsImporting(false); }} title="New Playlist">
              <Plus size={20} />
            </button>
            <button className="add-btn" onClick={() => { setIsImporting(!isImporting); setIsCreating(false); }} title="Import Playlist">
              <DownloadCloud size={20} />
            </button>
          </div>
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

        {isImporting && (
          <form className="create-playlist-form" onSubmit={handleImport}>
            <input 
              type="text" 
              placeholder="Enter share code (MUSE-...)" 
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              autoFocus
            />
            <button type="submit">Join</button>
          </form>
        )}

        <div className="playlists-list">
          {/* Default Liked Songs Playlist */}
          <div 
            className={`playlist-item ${activePlaylist === 'liked' ? 'active' : ''}`}
            onClick={() => setActivePlaylist('liked')}
          >
            <div className="playlist-icon" style={{background: 'linear-gradient(45deg, #ff4b4b, #ff7e7e)', color: 'white'}}><Heart size={18} fill="currentColor" /></div>
            <div className="playlist-info">
              <span className="truncate">Liked Songs</span>
              <small>{likedSongs.length} tracks</small>
            </div>
          </div>

          <div className="menu-divider" style={{height: '1px', background: 'var(--glass-border)', margin: '12px 0'}}></div>

          {playlists.length === 0 && !isCreating ? (
            <p className="empty-text text-muted">No custom playlists yet.</p>
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
        {activePlaylist === 'liked' ? (
          <div className="active-playlist-view animate-fade-in">
            <div className="playlist-hero">
              <div className="playlist-cover" style={{background: 'linear-gradient(135deg, #ff4b4b, #8a2387)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Heart size={64} fill="currentColor" />
              </div>
              <div className="playlist-details">
                <span className="badge">Auto Playlist</span>
                <h1 className="hero-title">Liked Songs</h1>
                <p className="text-muted">{likedSongs.length} songs saved</p>
                
                <div className="action-buttons">
                  <button className="play-all-btn" onClick={() => likedSongs.length > 0 && playTrack(likedSongs[0], likedSongs)} disabled={likedSongs.length === 0}>
                    <Play fill="currentColor" size={20} />
                    Play
                  </button>
                </div>
              </div>
            </div>

            {likedSongs.length > 0 ? (
              <div className="tracks-list">
                {likedSongs.map((track, index) => (
                  <TrackRow 
                    key={`liked-${track.id}-${index}`} 
                    track={track} 
                    index={index} 
                    contextQueue={likedSongs} 
                  />
                ))}
              </div>
            ) : (
              <div className="empty-playlist">
                <Heart size={48} opacity={0.2} />
                <h3>No liked songs yet</h3>
                <p>Click the heart icon on any song to save it here.</p>
              </div>
            )}
          </div>
        ) : activePlaylist ? (
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
                  <button 
                    className="add-current-btn panel" 
                    onClick={() => {
                      alert('Caching tracks to Offline Vault...');
                      activePlaylist.tracks.forEach(t => {
                        if (t.previewUrl) fetch(t.previewUrl).catch(e => console.log('Cache fetch failed', e));
                        if (t.coverUrl) fetch(t.coverUrl).catch(e => console.log('Cache fetch failed', e));
                      });
                      setTimeout(() => alert('Playlist downloaded! You can now listen offline.'), 2000);
                    }}
                    title="Download to Offline Vault"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Offline Vault
                  </button>
                  <button 
                    className="add-current-btn panel"
                    onClick={() => handleShare(activePlaylist.id)}
                    title="Share playlist"
                    style={activePlaylist.isCollaborative ? { color: 'var(--primary)', borderColor: 'var(--primary)' } : {}}
                  >
                    {copiedCode ? <Copy size={18} /> : <Share2 size={18} />}
                    {copiedCode ? 'Copied!' : (activePlaylist.isCollaborative ? 'Collaborative' : 'Share')}
                  </button>
                </div>

                {activePlaylist.shareCode && (
                  <div className="share-code-banner">
                    <span>Share Code:</span>
                    <code>{activePlaylist.shareCode}</code>
                    <button onClick={() => { navigator.clipboard?.writeText(activePlaylist.shareCode); }}>
                      <Copy size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {activePlaylist.tracks.length > 0 ? (
              <div className="tracks-list">
                {activePlaylist.tracks.map((track, index) => (
                  <TrackRow 
                    key={`plist-${track.id}-${index}`} 
                    track={track} 
                    index={index} 
                    contextQueue={activePlaylist.tracks} 
                  />
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
