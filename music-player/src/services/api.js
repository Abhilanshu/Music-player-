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
    duration: parseInt(track.duration || '0', 10),
  };
};

export const searchMusic = async (query, limit = 200) => {
  if (!query) return [];
  // Hardcoded intercept for "trending"
  const qStr = query.toLowerCase().trim();
  if (qStr === 'trending' || qStr === 'trending songs' || qStr === 'top songs') {
    const modules = await getLiveTrending();
    return modules?.trending || [];
  }

  try {
    // We added limit=50 to fetch lots of songs (e.g. Honey Singh)
    const url = `${SAAVN_API_BASE}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`;
    const data = await fetchWithCache(url);
    if (data.status === 'SUCCESS' && data.data?.results) {
      return data.data.results.map(formatSaavnTrack).filter(t => t.previewUrl);
    }
    return [];
  } catch (error) {
    console.error('Error searching JioSaavn:', error);
    return [];
  }
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
    return null;
  } catch (error) {
    console.error('Error fetching live modules:', error);
    return null;
  }
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

// Fetch all playable songs from a chart or playlist by ID
export const getPlaylistSongs = async (playlistId) => {
  if (!playlistId) return [];
  try {
    const url = `${SAAVN_API_BASE}/playlists?id=${playlistId}`;
    const data = await fetchWithCache(url);
    if (data.status === 'SUCCESS' && data.data?.songs) {
      return data.data.songs.map(formatSaavnTrack).filter(t => t.previewUrl);
    }
    return [];
  } catch (error) {
    console.error('Error fetching playlist songs:', error);
    return [];
  }
};
