import React, { useState, useEffect, useRef } from 'react';

function TypewriterHeader({ text, speed = 40 }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}

export default function App() {
  const [ticker, setTicker] = useState('RELIANCE.NS');
  const [stockDetails, setStockDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [thesisStatus, setThesisStatus] = useState('HEALTHY');
  
  const [watchlist, setWatchlist] = useState([
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', exchange: 'NSE' },
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  ]);

  const searchRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search matches from backend (Debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error('Failed to search tickers:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch live quote for selected active ticker
  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetch(`http://localhost:5000/api/quote/${ticker}`);
        const data = await res.json();
        setStockDetails(data);
      } catch (err) {
        console.error('Failed to fetch quote:', err);
      }
    }
    fetchQuote();
  }, [ticker]);

  const handleSelectTicker = (selectedStock) => {
    setTicker(selectedStock.symbol);

    if (!watchlist.some((item) => item.symbol === selectedStock.symbol)) {
      setWatchlist((prev) => [selectedStock, ...prev]);
    }

    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  return (
    <div style={{ backgroundColor: '#050706', color: '#10b981', minHeight: '100vh', padding: '24px', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #0f3822', paddingBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>
            PHANTOM_SOUL // OS_v1.0
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#047857', margin: 0 }}>
            PERSONAL INVESTMENT DECISION ENGINE // ADVERSARIAL RED TEAM ACTIVE
          </p>
        </div>
        <div style={{ fontSize: '0.75rem', border: '1px solid #10b981', padding: '4px 12px', background: '#02180e' }}>
          SYSTEM: <span style={{ fontWeight: 'bold' }}>ONLINE</span> | GATEWAY: <span style={{ color: '#34d399' }}>PROXY_READY</span>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Search & Watchlist Column */}
        <div style={{ position: 'relative' }} ref={searchRef}>
          <div style={{ border: '1px solid #0f3822', backgroundColor: '#080d0a', padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: '#047857', marginBottom: '8px' }}>
              [01] GLOBAL INSTRUMENT SEARCH
            </div>

            <input
              type="text"
              placeholder="Search ticker or company (e.g. RELIANCE, AAPL)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setIsDropdownOpen(true)}
              style={{
                width: '100%',
                backgroundColor: '#02180e',
                border: '1px solid #10b981',
                color: '#10b981',
                padding: '8px 10px',
                outline: 'none',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />

            {/* Dropdown Overlay */}
            {isDropdownOpen && searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '80px',
                  left: 0,
                  right: 0,
                  backgroundColor: '#080d0a',
                  border: '1px solid #10b981',
                  zIndex: 50,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
                }}
              >
                {searchResults.map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => handleSelectTicker(item)}
                    style={{
                      padding: '10px',
                      borderBottom: '1px solid #0f3822',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#062919'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#10b981' }}>{item.symbol}</div>
                      <div style={{ fontSize: '0.7rem', color: '#047857' }}>{item.name}</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', border: '1px solid #047857', padding: '2px 4px', color: '#34d399' }}>
                      {item.exchange}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Active Watchlist */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {watchlist.map((item) => {
                const isActive = item.symbol === ticker;
                return (
                  <div
                    key={item.symbol}
                    onClick={() => setTicker(item.symbol)}
                    style={{
                      border: isActive ? '1px solid #10b981' : '1px solid #0f3822',
                      backgroundColor: isActive ? '#062919' : '#02180e',
                      padding: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: isActive ? 'bold' : 'normal', color: '#10b981' }}>
                        {item.symbol}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#047857' }}>{item.name}</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', border: '1px solid #047857', padding: '2px 4px', color: '#047857' }}>
                      {item.exchange}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Target Panel */}
        <div style={{ border: '1px solid #0f3822', backgroundColor: '#080d0a', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#047857' }}>ACTIVE TARGET</div>
              <h2 style={{ fontSize: '2rem', margin: '4px 0', color: '#10b981' }}>
                <TypewriterHeader text={ticker} />
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                {stockDetails ? (
                  <>PRICE: ${stockDetails.price} | 50-SMA: ${stockDetails.sma50?.toFixed(2)} \vert{} 200-SMA: ${stockDetails.sma200?.toFixed(2)}</>
                ) : (
                  'FETCHING REAL-TIME TELEMETRY...'
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: '#047857', textAlign: 'right', marginBottom: '4px' }}>
                THESIS STATE
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['HEALTHY', 'REVIEW', 'BROKEN'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setThesisStatus(status)}
                    style={{
                      backgroundColor: thesisStatus === status ? '#10b981' : 'transparent',
                      color: thesisStatus === status ? '#000' : '#047857',
                      border: '1px solid #10b981',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #0f3822', padding: '16px', backgroundColor: '#02180e' }}>
            <div style={{ fontSize: '0.8rem', color: '#047857', marginBottom: '12px' }}>
              [02] ADVERSARIAL RED TEAM LOG // CORE LOGIC PARAMETERS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px', fontSize: '0.8rem', marginBottom: '8px' }}>
              <span style={{ color: '#047857' }}>ORIGINAL THESIS:</span>
              <span>FCF YoY Growth &gt; 12% // Expansion in Retail Segment</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px', fontSize: '0.8rem', marginBottom: '8px' }}>
              <span style={{ color: '#047857' }}>VALUATION FLOOR:</span>
              <span>22.5x P/E Target Entry</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px', fontSize: '0.8rem' }}>
              <span style={{ color: '#047857' }}>BIAS AUDIT (RED TEAM):</span>
              <span style={{ color: '#34d399' }}>NO IMPULSE BUYING DETECTED – LOGIC SOUND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}