import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, Loader } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { searchMusic } from '../services/api';
import TrackCard from '../components/TrackCard';
import './Artist.css';

const Artist = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const { playTrack, currentTrack } = usePlayer();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistTracks = async () => {
      setLoading(true);
      try {
        // Search API using the artist name to get their top tracks
        const results = await searchMusic(name, 200);
        const hitsResults = await searchMusic(`${name} hits`, 100);
        const latestResults = await searchMusic(`${name} latest`, 100);
        
        // Combine and deduplicate
        const allTracks = [...results, ...hitsResults, ...latestResults];
        const uniqueTracks = Array.from(new Map(allTracks.map(t => [t.id, t])).values());
        
        const artistTracks = uniqueTracks.filter(t => t.artist.toLowerCase().includes(name.toLowerCase()));
        setTracks(artistTracks.length > 0 ? artistTracks : uniqueTracks);
      } catch (error) {
        console.error('Failed to fetch artist tracks', error);
      } finally {
        setLoading(false);
      }
    };

    if (name) fetchArtistTracks();
  }, [name]);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div className="artist-page animate-fade-in">
      <div className="artist-header-bg">
        {tracks.length > 0 && <img src={tracks[0].coverUrl} alt="bg" />}
        <div className="artist-overlay"></div>
      </div>
      
      <div className="artist-header-content">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="artist-title">{name}</h1>
        <p className="artist-subtitle">{tracks.length} Top Tracks</p>
        
        {tracks.length > 0 && (
          <button className="play-all-btn" onClick={handlePlayAll}>
            <Play size={24} fill="currentColor" /> Play All
          </button>
        )}
      </div>

      <div className="artist-tracks-container">
        <h2 className="section-title">Popular</h2>
        {loading ? (
          <div className="loading-state"><Loader className="spinner" size={32} /></div>
        ) : tracks.length > 0 ? (
          <div className="track-list">
            {tracks.map((track, index) => (
              <TrackCard 
                key={`${track.id}-${index}`} 
                track={track} 
                queue={tracks}
                isActive={currentTrack?.id === track.id}
                onPlay={() => playTrack(track, tracks)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">No tracks found for this artist.</div>
        )}
      </div>
    </div>
  );
};

export default Artist;
