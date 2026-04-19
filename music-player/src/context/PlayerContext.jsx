import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Lazy initialize Audio to avoid creating orphaned elements on React double-renders
  const audioRef = useRef(null);
  if (!audioRef.current) {
    audioRef.current = new window.Audio();
  }

  // Cleanup audio completely if the app unmounts (prevents overlapping songs during Vite live-reloads)
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    
    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };
    const setAudioTime = () => setCurrentTime(audio.currentTime);

    const handleEnded = async () => {
      // If we are at the end of the queue, launch Algorithmic Auto-Play Radio!
      if (currentIndex >= queue.length - 1) {
        if (currentTrack) {
          try {
            const { getSongSuggestions } = await import('../services/api');
            const suggestions = await getSongSuggestions(currentTrack.id);
            if (suggestions && suggestions.length > 0) {
              setQueue(prevQueue => {
                const newQueue = [...prevQueue, ...suggestions];
                setCurrentIndex(prevQueue.length); // Play the very first suggested track
                setCurrentTrack(suggestions[0]);
                setIsPlaying(true);
                return newQueue;
              });
              return; // Exit here so we don't loop back to 0
            }
          } catch (e) {
            console.error("Auto-Play Failed", e);
          }
        }
      }
      
      // Normal behavior: next track or loop back to 0
      nextTrack();
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, queue, currentTrack]); // Added currentTrack dependency so handleEnded knows the ID


  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (currentTrack?.previewUrl) {
      if (audio.src !== currentTrack.previewUrl) {
        audio.src = currentTrack.previewUrl;
      }
      if (isPlaying) {
        audio.play().catch(e => console.log('Auto-play prevented:', e));
      } else {
        audio.pause();
      }

      // Media Session API for Car Audio & LockScreen integration
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album || 'Muse Player',
          artwork: [
            { src: currentTrack.coverUrl, sizes: '500x500', type: 'image/jpeg' },
            { src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }
          ]
        });
      }
    }
  }, [currentTrack, isPlaying]);

  // Set up Media Session Action Handlers only once (or update if needed)
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevTrack();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });
    }
  }, [currentIndex, queue]); // Depend on queue/index to closure correct tracks

  const togglePlay = () => {
    if (!currentTrack) return;
    setIsPlaying(!isPlaying);
  };

  const playTrack = (track, newQueue = null) => {
    if (newQueue) {
      setQueue(newQueue);
      const index = newQueue.findIndex(t => t.id === track.id);
      setCurrentIndex(index !== -1 ? index : 0);
    } else if (queue.length === 0) {
      setQueue([track]);
      setCurrentIndex(0);
    }
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const nextTrack = () => {
    if (queue.length === 0) return;
    let nextIdx = currentIndex + 1;
    if (nextIdx >= queue.length) nextIdx = 0; // Loop back
    setCurrentIndex(nextIdx);
    setCurrentTrack(queue[nextIdx]);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (queue.length === 0) return;
    if (currentTime > 3) {
      // If played for more than 3s, restart current track
      audioRef.current.currentTime = 0;
      return;
    }
    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) prevIdx = queue.length - 1;
    setCurrentIndex(prevIdx);
    setCurrentTrack(queue[prevIdx]);
    setIsPlaying(true);
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const contextValue = React.useMemo(() => ({
    currentTrack,
    isPlaying,
    togglePlay,
    playTrack,
    nextTrack,
    prevTrack,
    queue,
    setQueue,
    volume,
    setVolume,
    currentTime,
    duration,
    seek
  }), [
    currentTrack, isPlaying, queue, volume, currentTime, duration
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};
