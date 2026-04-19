import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Home from './pages/Home';
import Search from './pages/Search';
import Playlists from './pages/Playlists';

function App() {
  return (
    <PlayerProvider>
      <Router>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Player />
        </div>
      </Router>
    </PlayerProvider>
  );
}

export default App;
