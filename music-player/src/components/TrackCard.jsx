import React from 'react';
import { Play, Pause } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import './TrackCard.css';

const TrackCard = ({ track, contextQueue }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();

  const isCurrentTrack = currentTrack?.id === track.id;

  const handleClick = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, contextQueue);
    }
  };

  return (
    <div
      className={`track-card panel ${isCurrentTrack ? 'active' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      title={`Play ${track.title}`}
    >
      <div className="card-image-container">
        <img src={track.coverUrl} alt={track.title} loading="lazy" />
        <div className="card-play-btn">
          {isCurrentTrack && isPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
          )}
        </div>
      </div>
      <div className="card-info">
        <h4 className="truncate" title={track.title}>{track.title}</h4>
        <p className="truncate text-muted" title={track.artist}>{track.artist}</p>
      </div>
    </div>
  );
};

export default TrackCard;
