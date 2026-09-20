import React, { useState, useEffect, useRef } from 'react';

export default function GlobalInstrumentSearch({ onSelectStock }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced API search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Replace with your endpoint (e.g., Yahoo Finance or custom ticker backend)
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        // Expected format: [{ ticker: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', exchange: 'NSE' }]
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (stock) => {
    onSelectStock(stock); // Adds to active list or sets active target
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="search-container" ref={searchRef}>
      <div className="search-header">[01] GLOBAL INSTRUMENT SEARCH</div>
      
      <input
        type="text"
        className="terminal-input"
        placeholder="Search ticker or company (e.g. RELIANCE, AAPL)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setIsOpen(true)}
      />

      {/* Dynamic Overlay Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="dropdown-overlay">
          {results.map((stock) => (
            <div
              key={stock.ticker}
              className="dropdown-card"
              onClick={() => handleSelect(stock)}
            >
              <div className="card-info">
                <span className="ticker-symbol">{stock.ticker}</span>
                <span className="company-name">{stock.name}</span>
              </div>
              <span className="exchange-badge">{stock.exchange}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}