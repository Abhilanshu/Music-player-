import React, { createContext, useContext, useState, useRef, useEffect, useMemo, useCallback } from 'react';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  // Try to load persisted state
  const loadPersistedState = () => {
    try {
      const saved = localStorage.getItem('muse_player_state');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error('Failed to load state', e); }
    return null;
  };

  const persisted = loadPersistedState();

  const [currentTrack, setCurrentTrack] = useState(persisted?.currentTrack || null);
  const [isPlaying, setIsPlaying] = useState(false); // Always start paused on fresh load due to browser policy
  const [queue, setQueue] = useState(persisted?.queue || []);
  const [currentIndex, setCurrentIndex] = useState(persisted?.currentIndex || -1);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Global custom playlists
  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem('muse_playlists');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // User Play History for Smart Recommendations
  const [playHistory, setPlayHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('muse_play_history');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  // Phase 1 Features
  const [likedSongs, setLikedSongs] = useState(() => {
    try {
      const saved = localStorage.getItem('muse_likedSongs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [audioQuality, setAudioQuality] = useState(() => {
    return localStorage.getItem('muse_audioQuality') || '320kbps';
  });
  const [sleepTimer, setSleepTimer] = useState(null);
  const sleepTimerRef = useRef(null);

  // Mock Friends (Phase 3 - simulated real-time activity)
  const MOCK_FRIENDS = [
    { id: 'f1', name: 'Aryan K.', avatar: '🎧', track: { title: 'Kesariya', artist: 'Arijit Singh' } },
    { id: 'f2', name: 'Priya S.', avatar: '🎵', track: { title: 'Lover', artist: 'Taylor Swift' } },
    { id: 'f3', name: 'Rohan M.', avatar: '🔥', track: { title: 'Excuses', artist: 'AP Dhillon' } },
    { id: 'f4', name: 'Meera V.', avatar: '✨', track: { title: 'Tum Se Hi', artist: 'Mohit Chauhan' } },
  ];

  // Save Playlists whenever they change
  useEffect(() => {
    localStorage.setItem('muse_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Save Play History whenever it changes
  useEffect(() => {
    localStorage.setItem('muse_play_history', JSON.stringify(playHistory));
  }, [playHistory]);

  // Save Player State whenever it changes
  useEffect(() => {
    localStorage.setItem('muse_player_state', JSON.stringify({
      currentTrack,
      queue,
      currentIndex
    }));
  }, [currentTrack, queue, currentIndex]);

  // Save Liked Songs
  useEffect(() => {
    localStorage.setItem('muse_likedSongs', JSON.stringify(likedSongs));
  }, [likedSongs]);

  // Save Audio Quality
  useEffect(() => {
    localStorage.setItem('muse_audioQuality', audioQuality);
  }, [audioQuality]);

  // Sleep Timer logic
  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0) {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      
      sleepTimerRef.current = setTimeout(() => {
        setIsPlaying(false);
        setSleepTimer(null);
        alert('Sleep timer completed. Playback paused.');
      }, sleepTimer * 60000); // converting minutes to ms
    } else {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    }
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [sleepTimer]);

  const toggleLiked = (track) => {
    setLikedSongs(prev => {
      const exists = prev.find(t => t.id === track.id);
      if (exists) return prev.filter(t => t.id !== track.id);
      return [track, ...prev]; // add to front
    });
  };

  const startSleepTimer = (minutes) => {
    setSleepTimer(minutes);
  };

  // Phase 4: Crossfade setting (seconds, 0 = off)
  const [crossfadeDuration, setCrossfadeDuration] = useState(() => {
    return parseInt(localStorage.getItem('muse_crossfade') || '0', 10);
  });
  useEffect(() => {
    localStorage.setItem('muse_crossfade', crossfadeDuration.toString());
  }, [crossfadeDuration]);

  // Phase 4: 5-Band EQ gains (in dB)
  const [eqBands, setEqBands] = useState(() => {
    try {
      const saved = localStorage.getItem('muse_eq');
      return saved ? JSON.parse(saved) : [0, 0, 0, 0, 0]; // Sub, Bass, Mid, Presence, Treble
    } catch { return [0, 0, 0, 0, 0]; }
  });
  useEffect(() => {
    localStorage.setItem('muse_eq', JSON.stringify(eqBands));
  }, [eqBands]);

  const crossfadeTimerRef = useRef(null);
  const nextAudioRef = useRef(null); // second audio element for crossfade

  // Phase 4: Web Audio API - 5-Band Equalizer
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const filtersRef = useRef([]);

  const initEQ = (audioElement) => {
    if (sourceRef.current) return; // Already initialized

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    
    try {
      const source = ctx.createMediaElementSource(audioElement);
      sourceRef.current = source;

      // Frequencies: 60Hz, 250Hz, 1kHz, 4kHz, 16kHz
      const frequencies = [60, 250, 1000, 4000, 16000];
      const types = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];
      
      let lastNode = source;
      const newFilters = frequencies.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = types[i];
        filter.frequency.value = freq;
        filter.gain.value = eqBands[i];
        lastNode.connect(filter);
        lastNode = filter;
        return filter;
      });

      lastNode.connect(ctx.destination);
      filtersRef.current = newFilters;
    } catch (err) {
      console.warn('MediaElementSource already created or AudioContext error:', err);
    }
  };

  // Update EQ bands whenever they change
  useEffect(() => {
    filtersRef.current.forEach((filter, i) => {
      if (filter) filter.gain.value = eqBands[i];
    });
  }, [eqBands]);

  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new window.Audio();
      // audioRef.current.crossOrigin = 'anonymous'; // REMOVED: This causes CORS block on JioSaavn CDN
      // Web Audio API EQ disabled because it requires CORS headers from the audio source
      /*
      setTimeout(() => {
        try {
          if (audioRef.current) initEQ(audioRef.current);
        } catch (e) {
          console.warn('Web Audio EQ initialization failed:', e);
        }
      }, 1000);
      */
    }
  }, []);

  // Cleanup audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Track play counts
  const recordPlayHistory = (track) => {
    if (!track) return;
    setPlayHistory(prev => {
      const updated = { ...prev };
      if (updated[track.id]) {
        updated[track.id].count += 1;
        updated[track.id].lastPlayed = Date.now();
      } else {
        updated[track.id] = { track, count: 1, lastPlayed: Date.now() };
      }
      return updated;
    });
  };

  useEffect(() => {
    const audio = audioRef.current;
    
    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);

      // Crossfade Logic (Fade out only to prevent dual-audio bugs on mobile)
      if (crossfadeDuration > 0 && audio.duration > 0 && isPlaying) {
        const remaining = audio.duration - audio.currentTime;
        if (remaining <= crossfadeDuration && remaining > 0) {
          // Fade out current
          const fadeProgress = remaining / crossfadeDuration; // 1 → 0
          audio.volume = Math.max(0, fadeProgress * volume);
        } else if (remaining > crossfadeDuration) {
          audio.volume = volume; // Restore volume if we seeked back
        }
      }
    };

    const handleEnded = async () => {
      // SMART RECOMMENDATION ENGINE (Autoplay)
      if (currentIndex >= queue.length - 1) {
        if (currentTrack) {
          try {
            const { getSongSuggestions } = await import('../services/api');
            const suggestions = await getSongSuggestions(currentTrack.id);
            
            if (suggestions && suggestions.length > 0) {
              // Extract primary artists from current track to match mood/genre
              const seedArtists = currentTrack.artist.split(',').map(a => a.trim().toLowerCase());
              
              // Find user's top played songs that match these artists (Genre/Mood match)
              const userFavorites = Object.values(playHistory)
                .filter(item => item.count > 2) // Must be played more than twice to be a favorite
                .filter(item => {
                  const favArtists = item.track.artist.split(',').map(a => a.trim().toLowerCase());
                  return favArtists.some(a => seedArtists.includes(a));
                })
                .sort((a, b) => b.count - a.count)
                .map(item => item.track);

              // Blend Algorithm with User Favorites
              // We'll insert a top favorite every 3 algorithmic songs if it exists
              let blendedQueue = [];
              let favIndex = 0;
              
              suggestions.forEach((sug, i) => {
                blendedQueue.push(sug);
                // Inject user favorite
                if (i % 2 === 0 && userFavorites[favIndex]) {
                  // Ensure we don't add duplicates
                  if (!blendedQueue.find(t => t.id === userFavorites[favIndex].id)) {
                    blendedQueue.push(userFavorites[favIndex]);
                  }
                  favIndex++;
                }
              });

              setQueue(prevQueue => {
                // Ensure no duplicates from previous queue
                const filteredBlended = blendedQueue.filter(t => !prevQueue.find(pq => pq.id === t.id));
                const newQueue = [...prevQueue, ...filteredBlended];
                
                // If filteredBlended is empty (we've exhausted similar songs), just loop or stop
                if (filteredBlended.length === 0) return prevQueue;

                setCurrentIndex(prevQueue.length); // Play the very first suggested track
                setCurrentTrack(filteredBlended[0]);
                recordPlayHistory(filteredBlended[0]);
                setIsPlaying(true);
                return newQueue;
              });
              return; 
            }
          } catch (e) {
            console.error("Auto-Play Failed", e);
          }
        }
      }
      
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
  }, [currentIndex, queue, currentTrack, playHistory]); 

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (currentTrack) {
      
      // Stop any crossfading audio from leaking when switching tracks manually
      if (nextAudioRef.current) {
        nextAudioRef.current.pause();
        nextAudioRef.current.src = '';
        nextAudioRef.current = null;
      }
      
      const setAudioSourceAndPlay = async () => {
        let selectedUrl = currentTrack.previewUrl;
        
        // Handle JioSaavn Audio Quality (if available and not just a preview link)
        if (currentTrack.downloadUrls && currentTrack.downloadUrls.length > 0) {
          const targetQualityStr = audioQuality || '320kbps';
          const matchedLink = currentTrack.downloadUrls.find(l => l.quality === targetQualityStr);
          if (matchedLink) {
            selectedUrl = matchedLink.link;
          } else if (audioQuality === '12kbps' || audioQuality === '48kbps' || audioQuality === '96kbps') {
            selectedUrl = currentTrack.downloadUrls[0].link;
          } else {
            selectedUrl = currentTrack.downloadUrls[currentTrack.downloadUrls.length - 1].link;
          }
        } else {
          // If no download URLs exist, it means we are using iTunes or a restricted JioSaavn response.
          // In this case, dynamically fetch the FULL audio from YouTube (Piped API)!
          try {
            const { fetchFullAudio } = await import('../services/api');
            const fullUrl = await fetchFullAudio(currentTrack);
            if (fullUrl) selectedUrl = fullUrl;
          } catch (err) {
            console.error("Failed to fetch full audio stream:", err);
          }
        }

        // Apply URL and Play
        if (audio.src !== selectedUrl) {
          audio.src = selectedUrl;
        }
        if (isPlaying) {
          audioCtxRef.current?.resume();
          audio.play().catch(e => console.log('Auto-play prevented by browser policy until user interacts:', e));
        } else {
          audio.pause();
          if (nextAudioRef.current) {
            nextAudioRef.current.pause();
          }
        }
      };

      setAudioSourceAndPlay();

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

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    }
  }, [currentIndex, queue]); 

  const togglePlay = () => {
    if (!currentTrack) return;
    audioCtxRef.current?.resume();
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
    recordPlayHistory(track);
    setIsPlaying(true);
  };

  const queueNext = (track) => {
    setQueue(prevQueue => {
      const newQueue = [...prevQueue];
      // Insert right after current index, or at the end if no index
      const insertAt = currentIndex >= 0 ? currentIndex + 1 : 0;
      newQueue.splice(insertAt, 0, track);
      return newQueue;
    });
    // If nothing was playing, play it now
    if (!currentTrack) {
      playTrack(track);
    }
  };

  const nextTrack = () => {
    if (queue.length === 0) return;
    let nextIdx = currentIndex + 1;
    if (nextIdx >= queue.length) nextIdx = 0; // Loop back
    setCurrentIndex(nextIdx);
    setCurrentTrack(queue[nextIdx]);
    recordPlayHistory(queue[nextIdx]);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (queue.length === 0) return;
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) prevIdx = queue.length - 1;
    setCurrentIndex(prevIdx);
    setCurrentTrack(queue[prevIdx]);
    recordPlayHistory(queue[prevIdx]);
    setIsPlaying(true);
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const sharePlaylist = useCallback((playlistId) => {
    const code = `MUSE-${playlistId.slice(-6).toUpperCase()}`;
    setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, shareCode: code, isCollaborative: true } : p));
    return code;
  }, []);

  const joinCollaborativePlaylist = useCallback((code) => {
    if (!code.startsWith('MUSE-')) return false;
    const newPlaylist = {
      id: `shared-${Date.now()}`,
      name: `Shared Playlist (${code})`,
      tracks: [],
      isCollaborative: true,
      shareCode: code,
      owner: 'Friend'
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    return true;
  }, []);

  const contextValue = useMemo(() => ({
    currentTrack,
    isPlaying,
    togglePlay,
    playTrack,
    queueNext,
    nextTrack,
    prevTrack,
    queue,
    setQueue,
    volume,
    setVolume,
    currentTime,
    duration,
    seek,
    playlists,
    setPlaylists,
    likedSongs,
    toggleLiked,
    audioQuality,
    setAudioQuality,
    sleepTimer,
    startSleepTimer,
    playHistory,
    friends: MOCK_FRIENDS,
    sharePlaylist,
    joinCollaborativePlaylist,
    crossfadeDuration,
    setCrossfadeDuration,
    eqBands,
    setEqBands,
  }), [
    currentTrack, isPlaying, queue, volume, currentTime, duration, playlists, likedSongs, audioQuality, sleepTimer, playHistory, crossfadeDuration, eqBands, sharePlaylist, joinCollaborativePlaylist
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};
