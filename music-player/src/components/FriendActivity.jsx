import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Users, ChevronDown, ChevronUp, Music } from 'lucide-react';
import './FriendActivity.css';

const FriendActivity = () => {
  const { friends, currentTrack } = usePlayer();
  const [isOpen, setIsOpen] = useState(false);

  // Simulate one friend listening to the same song as current user
  const enrichedFriends = friends.map((f, i) => ({
    ...f,
    track: i === 0 && currentTrack ? { title: currentTrack.title, artist: currentTrack.artist } : f.track,
    isOnline: true,
  }));

  return (
    <div className={`friend-activity-panel ${isOpen ? 'open' : ''}`}>
      <button className="friend-toggle glass" onClick={() => setIsOpen(p => !p)}>
        <Users size={18} />
        <span>Friends</span>
        <div className="online-dot" />
        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {isOpen && (
        <div className="friend-list glass animate-fade-in">
          <h3>Friend Activity</h3>
          {enrichedFriends.map(friend => (
            <div className="friend-item" key={friend.id}>
              <div className="friend-avatar">{friend.avatar}</div>
              <div className="friend-info">
                <div className="friend-name">{friend.name}</div>
                <div className="friend-track text-muted">
                  <Music size={12} /> {friend.track.title} · {friend.track.artist}
                </div>
              </div>
              <div className="friend-status-dot" />
            </div>
          ))}
          <p className="friend-hint text-muted">Simulated friend activity</p>
        </div>
      )}
    </div>
  );
};

export default FriendActivity;
