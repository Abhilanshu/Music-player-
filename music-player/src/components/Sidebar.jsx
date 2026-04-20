import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ListMusic, Music, ChevronLeft, Settings as SettingsIcon, X, Moon, Radio, Sparkles, Car, SkipForward } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import CarMode from './CarMode';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  const { 
    audioQuality, 
    setAudioQuality, 
    sleepTimer, 
    startSleepTimer,
    crossfadeDuration,
    setCrossfadeDuration,
    eqBands,
    setEqBands
  } = usePlayer();
  const [showSettings, setShowSettings] = useState(false);
  const [showCarMode, setShowCarMode] = useState(false);

  const handleTimerSelect = (mins) => {
    startSleepTimer(mins);
    alert(`Sleep timer set for ${mins} minutes.`);
    setShowSettings(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar md-hidden glass">
        {!isHome ? (
          <button className="mobile-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <ChevronLeft size={24} />
          </button>
        ) : (
          <div className="back-placeholder" />
        )}
        <div className="logo">
          <Music color="var(--primary)" size={22} />
          <span>Muse</span>
        </div>
        <div className="back-placeholder" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="sidebar glass border-right">
        <div className="logo-container hidden-on-mobile">
          <Music color="var(--primary)" size={32} />
          <h2>Muse</h2>
        </div>

        <nav className="nav-links">
          <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Home size={22} className="nav-icon" />
            <span className="nav-label">Discover</span>
          </NavLink>
          <NavLink to="/search" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Search size={22} className="nav-icon" />
            <span className="nav-label">Search</span>
          </NavLink>
          <NavLink to="/playlists" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <ListMusic size={22} className="nav-icon" />
            <span className="nav-label">Library</span>
          </NavLink>
          <NavLink to="/discover" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Sparkles size={22} className="nav-icon" />
            <span className="nav-label">Discover</span>
          </NavLink>
        </nav>

        {/* Car Mode Button */}
        <button className="settings-trigger" onClick={() => setShowCarMode(true)} style={{ marginBottom: '8px' }}>
          <Car size={20} />
          <span>Car Mode</span>
        </button>

        {/* Settings Button */}
        <button className="settings-trigger" onClick={() => setShowSettings(true)}>
          <SettingsIcon size={20} />
          <span>Settings</span>
        </button>
      </aside>

      <CarMode isOpen={showCarMode} onClose={() => setShowCarMode(false)} />

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay glass animate-fade-in" onClick={() => setShowSettings(false)}>
          <div className="modal-content panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Settings</h2>
              <button className="close-btn" onClick={() => setShowSettings(false)}><X size={24} /></button>
            </div>
            
            <div className="settings-group">
              <div className="settings-title"><Radio size={18} /> Audio Quality</div>
              <div className="quality-selector">
                <button 
                  className={`quality-btn ${audioQuality === '96kbps' ? 'active' : ''}`}
                  onClick={() => setAudioQuality('96kbps')}
                >
                  Data Saver
                </button>
                <button 
                  className={`quality-btn ${audioQuality === '160kbps' ? 'active' : ''}`}
                  onClick={() => setAudioQuality('160kbps')}
                >
                  Normal
                </button>
                <button 
                  className={`quality-btn ${audioQuality === '320kbps' ? 'active' : ''}`}
                  onClick={() => setAudioQuality('320kbps')}
                >
                  High Res
                </button>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-title"><SkipForward size={18} /> Crossfade</div>
              <p className="settings-desc">Smooth transition between tracks ({crossfadeDuration}s)</p>
              <input 
                type="range" 
                min="0" max="12" 
                value={crossfadeDuration} 
                onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                className="settings-slider"
              />
            </div>

            <div className="settings-group">
              <div className="settings-title"><Music size={18} /> 5-Band Equalizer</div>
              <div className="eq-container">
                {['Sub', 'Bass', 'Mid', 'Pres', 'Treb'].map((label, i) => (
                  <div key={label} className="eq-slider-group">
                    <input 
                      type="range" 
                      min="-12" max="12" step="1"
                      orient="vertical"
                      value={eqBands[i]}
                      onChange={(e) => handleEQChange(i, e.target.value)}
                      className="eq-slider"
                    />
                    <span className="eq-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-title"><Moon size={18} /> Sleep Timer</div>
              <p className="settings-desc">
                {sleepTimer ? `Timer active.` : 'Automatically pause playback.'}
              </p>
              <div className="timer-selector">
                {[15, 30, 45, 60].map(mins => (
                  <button key={mins} className="timer-btn" onClick={() => handleTimerSelect(mins)}>
                    {mins}m
                  </button>
                ))}
                {sleepTimer && (
                  <button className="timer-btn cancel" onClick={() => handleTimerSelect(null)}>Off</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
