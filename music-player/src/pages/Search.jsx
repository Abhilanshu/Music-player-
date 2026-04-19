import React, { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { searchMusic } from '../services/api';
import TrackCard from '../components/TrackCard';
import './Search.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute search
  useEffect(() => {
    const doSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      setHasSearched(true);
      const data = await searchMusic(debouncedQuery);
      setResults(data);
      setLoading(false);
    };

    doSearch();
  }, [debouncedQuery]);

  return (
    <div className="search-page animate-fade-in">
      <div className="search-header">
        <div className="search-bar glass">
          <SearchIcon size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search for artists, songs, or albums..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="search-results">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="empty-state">
            <h3>No results found for "{debouncedQuery}"</h3>
            <p>Make sure your words are spelled correctly or use less or different keywords.</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <h2 className="section-title">Top Results</h2>
            <div className="tracks-grid">
              {results.map(track => (
                <TrackCard key={track.id} track={track} contextQueue={results} />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="search-placeholder">
              <SearchIcon size={48} opacity={0.2} />
              <h3>Find your next favorite song</h3>
              <p>Type in the search bar to explore millions of tracks.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
