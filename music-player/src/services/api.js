const SAAVN_API_BASES = [
  'https://saavn-api.vercel.app',
  'https://jiosaavn-api-beta.vercel.app',
  'https://jiosaavn-api-2.vercel.app'
];

const requestCache = new Map();

const fetchWithCache = async (endpoint) => {
  if (requestCache.has(endpoint)) {
    return requestCache.get(endpoint);
  }
  
  for (const base of SAAVN_API_BASES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout per API
      
      const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (data && (data.status === 'SUCCESS' || data.success === true || Array.isArray(data))) {
        requestCache.set(endpoint, data);
        return data; // Return on first success
      }
    } catch (e) {
      console.warn(`API ${base} failed for ${endpoint}, trying next...`);
    }
  }
  
  console.error(`All JioSaavn APIs failed for ${endpoint}`);
  return null;
};

const extractResults = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data?.results) return data.data.results;
  if (data.results) return data.results;
  if (Array.isArray(data.data)) return data.data;
  if (data.data?.songs) return data.data.songs;
  if (data.songs) return data.songs;
  if (data.data?.playlists) return data.data.playlists;
  if (data.playlists) return data.playlists;
  if (data.data?.albums) return data.data.albums;
  if (data.albums) return data.albums;
  return [];
};

// Formatter to map raw Saavn JSON structure to our clean Track format
const formatSaavnTrack = (track) => {
  if (!track) return null;
  const downloadLinks = track.downloadUrl || [];
  const audioUrl = downloadLinks.length > 0 ? downloadLinks[downloadLinks.length - 1].link : '';

  const images = track.image || [];
  const coverUrl = images.length > 0 ? images[images.length - 1].link : '';

  // Extract primary artists string properly
  let artistString = 'Unknown Artist';
  if (Array.isArray(track.primaryArtists)) {
    artistString = track.primaryArtists.map(a => a.name).join(', ');
  } else if (typeof track.primaryArtists === 'string') {
    artistString = track.primaryArtists;
  }

  return {
    id: track.id,
    title: track.name?.replace(/&quot;/g, '"')?.replace(/&amp;/g, '&'),
    artist: artistString,
    album: typeof track.album === 'object' ? track.album?.name : track.album,
    coverUrl: coverUrl,
    previewUrl: audioUrl,
    downloadUrls: downloadLinks,
    duration: parseInt(track.duration || '0', 10),
    type: 'song',
  };
};

const formatSaavnPlaylist = (p) => {
  const images = p.image || [];
  const coverUrl = images.length > 0 ? images[images.length - 1].link : '';
  return {
    id: p.id,
    title: p.title || p.name,
    subtitle: p.subtitle || `${p.songCount || '?'} songs`,
    coverUrl,
    type: 'playlist',
  };
};

const formatSaavnAlbum = (a) => {
  const images = a.image || [];
  const coverUrl = images.length > 0 ? images[images.length - 1].link : '';
  return {
    id: a.id,
    title: a.title || a.name,
    subtitle: a.description || a.primaryArtists || '',
    coverUrl,
    type: 'album',
  };
};

// New unified search — returns { songs, playlists, albums }
export const searchAll = async (query) => {
  if (!query) return { songs: [], playlists: [], albums: [] };
  const q = encodeURIComponent(query);
  
  const [songsData, playlistsData, albumsData] = await Promise.all([
    fetchWithCache(`/search/songs?query=${q}&limit=20`),
    fetchWithCache(`/search/playlists?query=${q}&limit=10`),
    fetchWithCache(`/search/albums?query=${q}&limit=8`)
  ]);

  const sRes = extractResults(songsData);
  const songs = sRes.map(formatSaavnTrack).filter(t => t?.previewUrl);

  const pRes = extractResults(playlistsData);
  const playlists = pRes.map(formatSaavnPlaylist);

  const aRes = extractResults(albumsData);
  const albums = aRes.map(formatSaavnAlbum);

  return { songs, playlists, albums };
};



export const searchMusic = async (query, limit = 200) => {
  if (!query) return [];
  const qStr = query.toLowerCase().trim();

  // 1. Semantic Intercept: Playlists
  if (qStr.includes('playlist')) {
    try {
      const cleanQuery = qStr.replace('playlist', '').trim();
      const pUrl = `/search/playlists?query=${encodeURIComponent(cleanQuery)}&limit=5`;
      const pData = await fetchWithCache(pUrl);
      const pResults = extractResults(pData);
      if (pResults.length > 0) {
        // Fetch songs for the best matching playlist
        const topPlaylistId = pResults[0].id;
        return await getPlaylistSongs(topPlaylistId);
      }
    } catch (e) { console.error("Playlist search failed", e); }
  }

  // 2. Semantic Intercept: Language-Specific Trending
  if (qStr.includes('trending')) {
    const languages = ['hindi', 'english', 'punjabi', 'tamil', 'telugu', 'marathi', 'gujarati', 'bengali', 'kannada', 'bhojpuri', 'malayalam', 'urdu'];
    const detectedLang = languages.find(lang => qStr.includes(lang));
    
    if (detectedLang) {
      try {
        const url = `/modules?language=${detectedLang}`;
        const data = await fetchWithCache(url);
        const trendingSongs = data?.data?.trending?.songs || data?.trending?.songs || [];
        if (trendingSongs.length > 0) {
          const songIds = trendingSongs.map(s => s.id).join(',');
          if (songIds) {
             const songsUrl = `/songs?id=${songIds}`;
             const songsData = await fetchWithCache(songsUrl);
             const sResults = extractResults(songsData);
             if (sResults.length > 0) {
               return sResults.map(formatSaavnTrack).filter(t => t.previewUrl);
             }
          }
        }
      } catch (e) { console.error("Language trending failed", e); }
    } else {
      // General trending
      const modules = await getLiveTrending();
      return modules?.trending || [];
    }
  }

  // 3. Default JioSaavn Song Search
  let results = [];
  try {
    const url = `/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`;
    const data = await fetchWithCache(url);
    const searchResults = extractResults(data);
    if (searchResults.length > 0) {
      results = searchResults.map(formatSaavnTrack).filter(t => t.previewUrl);
    }
  } catch (error) {
    console.error('Error searching JioSaavn:', error);
  }

  // 4. iTunes API Fallback (Extremely Reliable)
  if (results.length < 3) {
    try {
      console.log('JioSaavn returned empty, falling back to iTunes API...');
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=15`;
      const itunesRes = await fetch(itunesUrl);
      const itunesData = await itunesRes.json();
      
      if (itunesData.results && itunesData.results.length > 0) {
        const itunesResults = itunesData.results.map(item => ({
          id: item.trackId.toString(),
          title: item.trackName,
          artist: item.artistName || 'Unknown Artist',
          album: item.collectionName || 'Single',
          coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '500x500bb') : '',
          previewUrl: item.previewUrl,
          duration: Math.floor((item.trackTimeMillis || 0) / 1000),
          type: 'song'
        })).filter(t => t.previewUrl); // Ensure it has playable audio
        
        results = [...results, ...itunesResults];
      }
    } catch (e) {
      console.error('iTunes Fallback failed:', e);
    }
  }

  return results;
};

// Microservice: Gets real internet trending from Saavn Charts
export const getLiveTrending = async () => {
  try {
    const url = `/modules?language=hindi,english,punjabi`;
    const data = await fetchWithCache(url);
    if (data) {
      const topData = data.data || data; // v4 returns top level
      const rawTrendingSongs = topData.trending?.songs || [];
      const songIds = rawTrendingSongs.map(s => s.id).join(',');
      
      let fullSongsConfig = [];
      if (songIds) {
         const songsUrl = `/songs?id=${songIds}`;
         const songsData = await fetchWithCache(songsUrl);
         const sResults = extractResults(songsData);
         if (sResults.length > 0) {
           fullSongsConfig = sResults.map(formatSaavnTrack).filter(t => t.previewUrl);
         }
      }

      return {
        trending: fullSongsConfig,
        charts: (topData.charts || []).map(chart => ({
           id: chart.id,
           title: chart.title,
           coverUrl: chart.image && chart.image.length > 0 ? chart.image[chart.image.length - 1].link : ''
        })),
        playlists: (topData.playlists || []).map(p => ({
           id: p.id,
           title: p.title,
           coverUrl: p.image && p.image.length > 0 ? p.image[p.image.length - 1].link : ''
        }))
      };
    }
  } catch (error) {
    console.error('Error fetching live modules:', error);
  }

  // iTunes Fallback for Home Page Trending
  try {
    console.log("Fetching iTunes Fallback for Trending...");
    const fallbackTerms = ['bollywood hits', 'arijit singh', 'hindi trending', 'punjabi hits', 'shreya ghoshal'];
    const randomTerm = fallbackTerms[Math.floor(Math.random() * fallbackTerms.length)];
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(randomTerm)}&media=music&limit=20`;
    const itunesRes = await fetch(itunesUrl);
    const itunesData = await itunesRes.json();

    if (itunesData.results && itunesData.results.length > 0) {
      const fallbackSongs = itunesData.results.map(item => ({
        id: item.trackId.toString(),
        title: item.trackName,
        artist: item.artistName || 'Unknown Artist',
        album: item.collectionName || 'Single',
        coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '500x500bb') : '',
        previewUrl: item.previewUrl,
        duration: Math.floor((item.trackTimeMillis || 0) / 1000),
        type: 'song'
      })).filter(t => t.previewUrl);

      return {
        trending: fallbackSongs,
        charts: [
          { id: 'mock-hindi', title: 'Top Hindi Hits', coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=500&h=500' },
          { id: 'mock-punjabi', title: 'Top Punjabi 50', coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?auto=format&fit=crop&q=80&w=500&h=500' },
          { id: 'mock-english', title: 'Top English Pop', coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=500&h=500' }
        ],
        playlists: [
          { id: 'mock-arijit', title: 'Arijit Singh Best', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=500&h=500' },
          { id: 'mock-party', title: 'Bollywood Party', coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=500&h=500' },
          { id: 'mock-retro', title: 'Retro Romance', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=500&h=500' }
        ]
      };
    }
  } catch (e) {
    console.error('iTunes Fallback for Trending failed:', e);
  }

  return null;
};

// Microservice: Recommendation Engine for Infinite Auto-Play
export const getSongSuggestions = async (songId) => {
  if (!songId) return [];
  try {
    // Fixed URL - ?limit not &limit
    const url = `/songs/${songId}/suggestions?limit=10`;
    const data = await fetchWithCache(url);
    const suggResults = extractResults(data);
    if (suggResults.length > 0) {
      return suggResults.map(formatSaavnTrack).filter(t => t.previewUrl);
    }
    return [];
  } catch (error) {
    console.error('Error fetching suggestions for autoplay:', error);
    return [];
  }
};

// Fetch all playable songs from a chart, playlist, or album by ID
export const getPlaylistSongs = async (id, type = 'playlist') => {
  if (!id) return [];

  // Handle Mocked iTunes Fallback Playlists
  if (id.startsWith('mock-')) {
    const mockQueries = {
      'mock-hindi': 'hindi hits',
      'mock-punjabi': 'punjabi hits',
      'mock-english': 'english pop hits',
      'mock-arijit': 'arijit singh',
      'mock-party': 'bollywood party dance',
      'mock-retro': 'kishore kumar retro hindi'
    };
    const query = mockQueries[id] || 'music';
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=30`;
      const itunesRes = await fetch(itunesUrl);
      const itunesData = await itunesRes.json();
      if (itunesData.results && itunesData.results.length > 0) {
        return itunesData.results.map(item => ({
          id: item.trackId.toString(),
          title: item.trackName,
          artist: item.artistName || 'Unknown Artist',
          album: item.collectionName || 'Single',
          coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '500x500bb') : '',
          previewUrl: item.previewUrl,
          duration: Math.floor((item.trackTimeMillis || 0) / 1000),
          type: 'song'
        })).filter(t => t.previewUrl);
      }
    } catch (e) { console.error('iTunes Fallback Playlist failed:', e); }
    return [];
  }

  try {
    // Try playlist endpoint first, fallback to album if no songs returned
    const playlistUrl = `/playlists?id=${id}`;
    const data = await fetchWithCache(playlistUrl);
    const pSongs = extractResults(data);
    if (pSongs.length > 0) {
      return pSongs.map(formatSaavnTrack).filter(t => t.previewUrl);
    }
    
    // Fallback: try album endpoint
    const albumUrl = `/albums?id=${id}`;
    const albumData = await fetchWithCache(albumUrl);
    const aSongs = extractResults(albumData);
    if (aSongs.length > 0) {
      return aSongs.map(formatSaavnTrack).filter(t => t.previewUrl);
    }

    return [];
  } catch (error) {
    console.error('Error fetching collection songs:', error);
    return [];
  }
};
// Fetch lyrics for a song
export const fetchLyrics = async (songId) => {
  if (!songId) return null;
  try {
    const url = `/songs/${songId}/lyrics`;
    const data = await fetchWithCache(url);
    if (data) {
      return data.data?.lyrics || data.lyrics || data.data || data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return null;
  }
};

// Robust YouTube (Piped API) Fallback for Full-Length Audio
export const fetchFullAudio = async (track) => {
  if (!track) return null;
  const q = encodeURIComponent(`${track.title} ${track.artist}`);
  
  // List of public Piped API instances
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.smnz.de',
    'https://pipedapi.syncpundit.io',
    'https://api.piped.projectsegfau.lt'
  ];
  
  for (const instance of instances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      const searchRes = await fetch(`${instance}/search?q=${q}&filter=music_songs`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();
      
      if (searchData.items && searchData.items.length > 0) {
        const videoId = searchData.items[0].url.split('v=')[1] || searchData.items[0].url.split('/').pop();
        
        const streamController = new AbortController();
        const streamTimeoutId = setTimeout(() => streamController.abort(), 3000);
        const streamRes = await fetch(`${instance}/streams/${videoId}`, { signal: streamController.signal });
        clearTimeout(streamTimeoutId);
        
        if (!streamRes.ok) continue;
        const streamData = await streamRes.json();
        
        const audioStreams = streamData.audioStreams;
        if (audioStreams && audioStreams.length > 0) {
          // Prefer m4a for web compatibility, fallback to first
          const bestStream = audioStreams.find(s => s.mimeType.includes('m4a')) || audioStreams[0];
          return bestStream.url;
        }
      }
    } catch (e) {
      console.warn(`Piped instance ${instance} failed to fetch full audio.`);
    }
  }
  
  return track.previewUrl; // Absolute fallback to 30s preview if YouTube fails completely
};
