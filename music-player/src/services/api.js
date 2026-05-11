const SAAVN_API_BASE = 'https://jiosaavn-api-privatecvc2.vercel.app';

const requestCache = new Map();

const fetchWithCache = async (url) => {
  if (requestCache.has(url)) {
    return requestCache.get(url);
  }
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === 'SUCCESS') {
    requestCache.set(url, data);
  }
  return data;
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
  
  const [songsRes, playlistsRes, albumsRes] = await Promise.allSettled([
    fetch(`${SAAVN_API_BASE}/search/songs?query=${q}&limit=20`).then(r => r.json()),
    fetch(`${SAAVN_API_BASE}/search/playlists?query=${q}&limit=10`).then(r => r.json()),
    fetch(`${SAAVN_API_BASE}/search/albums?query=${q}&limit=8`).then(r => r.json()),
  ]);

  const songs = songsRes.status === 'fulfilled' && songsRes.value?.data?.results
    ? songsRes.value.data.results.map(formatSaavnTrack).filter(t => t?.previewUrl)
    : [];

  const playlists = playlistsRes.status === 'fulfilled' && playlistsRes.value?.data?.results
    ? playlistsRes.value.data.results.map(formatSaavnPlaylist)
    : [];

  const albums = albumsRes.status === 'fulfilled' && albumsRes.value?.data?.results
    ? albumsRes.value.data.results.map(formatSaavnAlbum)
    : [];

  return { songs, playlists, albums };
};



export const searchMusic = async (query, limit = 200) => {
  if (!query) return [];
  const qStr = query.toLowerCase().trim();

  // 1. Semantic Intercept: Playlists
  if (qStr.includes('playlist')) {
    try {
      const cleanQuery = qStr.replace('playlist', '').trim();
      const pUrl = `${SAAVN_API_BASE}/search/playlists?query=${encodeURIComponent(cleanQuery)}&limit=5`;
      const pData = await fetchWithCache(pUrl);
      if (pData.status === 'SUCCESS' && pData.data?.results?.length > 0) {
        // Fetch songs for the best matching playlist
        const topPlaylistId = pData.data.results[0].id;
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
        const url = `${SAAVN_API_BASE}/modules?language=${detectedLang}`;
        const data = await fetchWithCache(url);
        if (data.status === 'SUCCESS' && data.data?.trending?.songs) {
          const rawTrendingSongs = data.data.trending.songs || [];
          const songIds = rawTrendingSongs.map(s => s.id).join(',');
          if (songIds) {
             const songsUrl = `${SAAVN_API_BASE}/songs?id=${songIds}`;
             const songsData = await fetchWithCache(songsUrl);
             if (songsData.status === 'SUCCESS') {
               return songsData.data.map(formatSaavnTrack).filter(t => t.previewUrl);
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
    const url = `${SAAVN_API_BASE}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`;
    const data = await fetchWithCache(url);
    if (data.status === 'SUCCESS' && data.data?.results) {
      results = data.data.results.map(formatSaavnTrack).filter(t => t.previewUrl);
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
    const url = `${SAAVN_API_BASE}/modules?language=hindi,english,punjabi`;
    const data = await fetchWithCache(url);
    if (data.status === 'SUCCESS' && data.data) {
      
      const rawTrendingSongs = data.data.trending?.songs || [];
      const songIds = rawTrendingSongs.map(s => s.id).join(',');
      
      let fullSongsConfig = [];
      if (songIds) {
         const songsUrl = `${SAAVN_API_BASE}/songs?id=${songIds}`;
         const songsData = await fetchWithCache(songsUrl);
         if (songsData.status === 'SUCCESS') {
           fullSongsConfig = songsData.data.map(formatSaavnTrack).filter(t => t.previewUrl);
         }
      }

      return {
        trending: fullSongsConfig,
        charts: (data.data.charts || []).map(chart => ({
           id: chart.id,
           title: chart.title,
           coverUrl: chart.image && chart.image.length > 0 ? chart.image[chart.image.length - 1].link : ''
        })),
        playlists: (data.data.playlists || []).map(p => ({
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
    const fallbackTerms = ['pop', 'hits', 'arijit', 'weekend'];
    const randomTerm = fallbackTerms[Math.floor(Math.random() * fallbackTerms.length)];
    const itunesUrl = `https://itunes.apple.com/search?term=${randomTerm}&media=music&limit=15`;
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
        charts: [],
        playlists: []
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
    const url = `${SAAVN_API_BASE}/songs/${songId}/suggestions?limit=10`;
    const data = await fetchWithCache(url);
    if (data.status === 'SUCCESS' && data.data) {
      return data.data.map(formatSaavnTrack).filter(t => t.previewUrl);
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
  try {
    // Try playlist endpoint first, fallback to album if no songs returned
    const playlistUrl = `${SAAVN_API_BASE}/playlists?id=${id}`;
    const data = await fetchWithCache(playlistUrl);
    if (data.status === 'SUCCESS' && data.data?.songs) {
      return data.data.songs.map(formatSaavnTrack).filter(t => t.previewUrl);
    }
    
    // Fallback: try album endpoint
    const albumUrl = `${SAAVN_API_BASE}/albums?id=${id}`;
    const albumData = await fetchWithCache(albumUrl);
    if (albumData.status === 'SUCCESS' && albumData.data?.songs) {
      return albumData.data.songs.map(formatSaavnTrack).filter(t => t.previewUrl);
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
    const url = `${SAAVN_API_BASE}/songs/${songId}/lyrics`;
    const data = await fetchWithCache(url);
    if (data.status === 'SUCCESS' && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return null;
  }
};
