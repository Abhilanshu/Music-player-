import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { fetchLyrics } from '../services/api';
import { X, Music } from 'lucide-react';
import './LyricsView.css';

const LyricsView = ({ isOpen, onClose }) => {
  const { currentTrack, currentTime } = usePlayer();
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentTrack) {
      const getLyrics = async () => {
        setLoading(true);
        const data = await fetchLyrics(currentTrack.id);
        setLyrics(data);
        setLoading(false);
      };
      getLyrics();
    }
  }, [isOpen, currentTrack]);

  if (!isOpen) return null;

  return (
    <div className="lyrics-overlay animate-fade-in">
      <div className="lyrics-container glass">
        <div className="lyrics-header">
          <div className="lyrics-track-info">
            <img src={currentTrack?.coverUrl} alt="cover" />
            <div>
              <h3>{currentTrack?.title}</h3>
              <p className="text-muted">{currentTrack?.artist}</p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="lyrics-content" ref={scrollRef}>
          {loading ? (
            <div className="lyrics-loading">
              <div className="spinner"></div>
              <p>Fetching lyrics...</p>
            </div>
          ) : lyrics ? (
            <div 
              className="lyrics-text"
              dangerouslySetInnerHTML={{ __html: lyrics.lyrics }}
            />
          ) : (
            <div className="lyrics-empty">
              <Music size={48} opacity={0.2} />
              <h3>Lyrics not available</h3>
              <p>We couldn't find lyrics for this song.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LyricsView;
