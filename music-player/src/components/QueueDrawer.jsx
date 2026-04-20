import React, { useState } from 'react';
import { X, GripVertical, Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import './QueueDrawer.css';

const QueueDrawer = ({ isOpen, onClose }) => {
  const { queue, setQueue, currentTrack, playTrack } = usePlayer();
  const [draggedIndex, setDraggedIndex] = useState(null);

  if (!isOpen) return null;

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQueue = [...queue];
    const draggedItem = newQueue[draggedIndex];
    newQueue.splice(draggedIndex, 1);
    newQueue.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setQueue(newQueue);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="queue-drawer animate-fade-in">
      <div className="queue-header glass">
        <h2>Up Next</h2>
        <button className="icon-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="queue-content">
        {currentTrack && (
          <div className="now-playing-section">
            <h3 className="section-title text-muted">Now Playing</h3>
            <div className="queue-item active glass">
              <img src={currentTrack.coverUrl} alt="cover" />
              <div className="item-info">
                <h4 className="truncate">{currentTrack.title}</h4>
                <p className="truncate text-muted">{currentTrack.artist}</p>
              </div>
              <div className="playing-indicator">
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
              </div>
            </div>
          </div>
        )}

        <div className="up-next-section">
          <h3 className="section-title text-muted">Next In Queue</h3>
          <div className="queue-list">
            {queue.map((track, index) => {
              if (currentTrack && track.id === currentTrack.id && index <= queue.findIndex(t => t.id === currentTrack.id)) return null;
              
              return (
                <div
                  key={`${track.id}-${index}`}
                  className={`queue-item ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDoubleClick={() => playTrack(track)}
                >
                  <div className="drag-handle text-muted">
                    <GripVertical size={16} />
                  </div>
                  <img src={track.coverUrl} alt="cover" />
                  <div className="item-info">
                    <h4 className="truncate">{track.title}</h4>
                    <p className="truncate text-muted">{track.artist}</p>
                  </div>
                  <button className="play-btn-small icon-btn" onClick={() => playTrack(track)}>
                    <Play size={16} fill="currentColor" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueDrawer;
