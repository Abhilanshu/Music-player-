import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, ListMusic, Music } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <>
      {/* Mobile Top Bar (Just for Brand Logo now, no hamburger) */}
      <div className="mobile-top-bar md-hidden glass">
        <div className="logo">
          <Music color="var(--primary)" size={24} />
          <span>Muse</span>
        </div>
      </div>

      {/* Desktop Sidebar OR Mobile Bottom Nav */}
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
