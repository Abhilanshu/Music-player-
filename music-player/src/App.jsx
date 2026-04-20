import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import QueueDrawer from './components/QueueDrawer';
import InstallBanner from './components/InstallBanner';
import Home from './pages/Home';
import Search from './pages/Search';
import Playlists from './pages/Playlists';
import Auth from './pages/Auth';
import Artist from './pages/Artist';
import DiscoverWeekly from './pages/DiscoverWeekly';
import FriendActivity from './components/FriendActivity';

const AuthenticatedApp = () => {
  const { user, loading } = useAuth();
  const [showQueue, setShowQueue] = useState(false);

  if (loading) return null;

  if (!user) {
    return <Auth />;
  }

  return (
    <PlayerProvider>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/discover" element={<DiscoverWeekly />} />
            <Route path="/artist/:name" element={<Artist />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <FriendActivity />
        <Player toggleQueue={() => setShowQueue(prev => !prev)} />
        <QueueDrawer isOpen={showQueue} onClose={() => setShowQueue(false)} />
        <InstallBanner />
      </div>
    </PlayerProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthenticatedApp />
      </Router>
    </AuthProvider>
  );
}

export default App;
