import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ListMusic, Music, ChevronLeft } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

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
        <div className="back-placeholder" /> {/* spacer to center logo */}
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
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
