import React, { useState, useEffect, useRef } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';

// Fallback multi-region dataset if offline or local testing without API key
const MOCK_GLOBAL_FALLBACK = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', exchange: 'NSE', country: 'IN', currency: 'INR', type: 'Equity' },
  { symbol: 'TCS.BO', name: 'Tata Consultancy Services', exchange: 'BSE', country: 'IN', currency: 'INR', type: 'Equity' },
  { symbol: 'SHEL.L', name: 'Shell plc', exchange: 'LSE', country: 'GB', currency: 'GBP', type: 'Equity' },
  { symbol: '7203.T', name: 'Toyota Motor Corporation', exchange: 'TSE', country: 'JP', currency: 'JPY', type: 'Equity' },
  { symbol: 'SAP.DE', name: 'SAP SE', exchange: 'XETRA', country: 'DE', currency: 'EUR', type: 'Equity' },
  { symbol: 'BHP.AX', name: 'BHP Group Limited', exchange: 'ASX', country: 'AU', currency: 'AUD', type: 'Equity' },
];

export default function GlobalHackerTerminal() {
  const [typedHeader, setTypedHeader] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSMA, setShowSMA] = useState(true);
  
  const [selectedStock, setSelectedStock] = useState({
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    country: 'US',
    currency: 'USD'
  });

  const [marketData, setMarketData] = useState({
    prices: [
      { date: '2026-06-01', price: 210.1, sma50: 205.4, sma200: 192.1 },
      { date: '2026-06-15', price: 214.5, sma50: 207.2, sma200: 193.5 },
      { date: '2026-07-01', price: 212.0, sma50: 208.8, sma200: 195.0 },
      { date: '2026-07-15', price: 218.8, sma50: 210.5, sma200: 196.8 },
      { date: '2026-08-01', price: 222.2, sma50: 212.4, sma200: 198.4 },
      { date: '2026-08-15', price: 220.5, sma50: 214.0, sma200: 200.1 },
      { date: '2026-09-01', price: 228.4, sma50: 216.2, sma200: 202.0 },
      { date: '2026-09-08', price: 234.9, sma50: 218.5, sma200: 203.8 },
    ],
    histogram: [
      { range: '-3% to -2%', count: 2, returnVal: -2.5 },
      { range: '-2% to -1%', count: 5, returnVal: -1.5 },
      { range: '-1% to 0%', count: 12, returnVal: -0.5 },
      { range: '0% to +1%', count: 18, returnVal: 0.5 },
      { range: '+1% to +2%', count: 9, returnVal: 1.5 },
      { range: '+2% to +3%', count: 3, returnVal: 2.5 },
    ]
  });

  const searchContainerRef = useRef(null);
  const bootText = 'GLOBAL_EXCHANGE_GATEWAY // ALL_EXCHANGES_ACTIVE';

  // Typewriter Boot Effect
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < bootText.length) {
        setTypedHeader((prev) => prev + bootText.charAt(index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 25);
    return () => clearInterval(timer);
  }, []);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Multi-Exchange Dynamic Ticker Search (Debounced)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        // Queries your proxy API endpoint which handles global exchanges
        const response = await fetch(`/api/search/global?q=${encodeURIComponent(trimmed)}`);
        
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        if (data && data.results && data.results.length > 0) {
          setResults(data.results);
        } else {
          // Client-side fallback filter across multiple countries
          const filtered = MOCK_GLOBAL_FALLBACK.filter(
            item => item.symbol.toLowerCase().includes(trimmed.toLowerCase()) ||
                    item.name.toLowerCase().includes(trimmed.toLowerCase())
          );
          setResults(filtered);
        }
      } catch (err) {
        // Fallback demo filtering for offline/testing development
        const filtered = MOCK_GLOBAL_FALLBACK.filter(
          item => item.symbol.toLowerCase().includes(trimmed.toLowerCase()) ||
                  item.name.toLowerCase().includes(trimmed.toLowerCase())
        );
        setResults(filtered);
      } finally {
        setLoading(false);
        setIsOpen(true);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (item) => {
    setSelectedStock(item);
    setQuery(item.symbol);
    setIsOpen(false);

    // Fetch real-time price history & SMA metrics for selected global instrument
    try {
      const res = await fetch(`/api/historical?symbol=${encodeURIComponent(item.symbol)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.prices) setMarketData(data);
      }
    } catch (e) {
      // Retain current visual telemetry if backend is not actively serving pricing payload
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#00FF66] font-mono p-6 border-4 border-[#003311] space-y-6">
      
      {/* 1. Terminal Telemetry Header */}
      <div className="border-b border-[#005522] pb-3 text-xs tracking-widest flex justify-between items-center">
        <div>
          <span className="text-[#008833]">&gt; </span>
          <span>{typedHeader}</span>
          <span className="animate-pulse bg-[#00FF66] text-[#050505] px-1 ml-1 inline-block">█</span>
        </div>
        <div className="flex gap-2 text-[10px]">
          <span className="border border-[#00AA44] px-2 py-0.5 bg-[#001100]">
            COUNTRY: {selectedStock.country || 'GLOBAL'}
          </span>
          <span className="border border-[#00AA44] px-2 py-0.5 bg-[#001100]">
            EXCHANGE: {selectedStock.exchange}
          </span>
        </div>
      </div>

      {/* 2. Global Ticker Search Input */}
      <div className="relative max-w-3xl mx-auto" ref={searchContainerRef}>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-[10px] uppercase text-[#00AA44] tracking-widest">
            [GLOBAL_STOCK_SEARCH_GATEWAY // ALL_EXCHANGES]
          </label>
          <span className="text-[10px] text-[#008833]">
            {loading ? 'SEARCHING_GLOBAL_BOOKS...' : 'READY'}
          </span>
        </div>
        
        <div className="relative flex items-center">
          <span className="absolute left-4 text-[#00FF66] font-bold">&gt;</span>
          <input
            type="text"
            className="w-full bg-[#0A0A0A] border-2 border-[#005522] focus:border-[#00FF66] rounded-none px-10 py-3 text-[#00FF66] placeholder-[#004411] outline-none font-mono tracking-widest uppercase text-sm"
            placeholder="SEARCH ANY TICKER OR COMPANY WORLDWIDE (E.G. AAPL, RELIANCE, SHEL)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && setIsOpen(true)}
          />
        </div>

        {/* Dynamic Global Autocomplete Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-[#0A0A0A] border-2 border-[#00FF66] shadow-[0_0_25px_rgba(0,255,102,0.25)] z-50 max-h-72 overflow-y-auto">
            {results.length > 0 ? (
              <ul className="divide-y divide-[#003311]">
                {results.map((item) => (
                  <li
                    key={`${item.symbol}-${item.exchange}`}
                    onClick={() => handleSelect(item)}
                    className="px-4 py-2.5 hover:bg-[#002200] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#00FF66] group-hover:text-[#66FF99] text-sm w-24">
                        {item.symbol}
                      </span>
                      <span className="text-xs text-[#00AA44] truncate max-w-[240px]">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.currency && (
                        <span className="text-[10px] text-[#008833] uppercase">
                          [{item.currency}]
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 border border-[#00AA44] bg-[#001100] text-[#00FF66] font-bold min-w-[60px] text-center">
                        {item.exchange}
                      </span>
                      {item.country && (
                        <span className="text-[10px] px-1.5 py-0.5 border border-[#005522] bg-[#050505] text-[#00AA44]">
                          {item.country}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-xs text-[#008833] text-center">
                NO_GLOBAL_MATCHES_FOUND // VERIFY_SYMBOL_OR_COMPANY
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Active Telemetry Panel & Indicator Toggle */}
      <div className="border border-[#005522] bg-[#080808] p-4 flex justify-between items-center text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[#00AA44]">TARGET: </span>
            <span className="text-[#00FF66] font-bold text-sm tracking-wider">{selectedStock.symbol}</span>
            <span className="text-[#00AA44] ml-2">({selectedStock.name})</span>
          </div>
          <span className="text-[10px] text-[#008833]">
            [CURRENCY: {selectedStock.currency || 'USD'}]
          </span>
        </div>

        <button
          onClick={() => setShowSMA(!showSMA)}
          className={`px-3 py-1 border text-[10px] tracking-widest font-bold transition-colors ${
            showSMA
              ? 'border-[#00FF66] bg-[#002200] text-[#00FF66]'
              : 'border-[#004411] bg-[#050505] text-[#008833]'
          }`}
        >
          [SMA_OVERLAYS: {showSMA ? 'ENABLED' : 'DISABLED'}]
        </button>
      </div>

      {/* 4. Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Price Chart + 50-day / 200-day Moving Averages */}
        <div className="border-2 border-[#003311] bg-[#080808] p-4 space-y-3">
          <div className="text-xs text-[#00AA44] tracking-widest border-b border-[#003311] pb-2 flex justify-between items-center">
            <span>[PRICE_SERIES_WITH_MOVING_AVERAGES]</span>
            <div className="flex gap-3 text-[10px]">
              <span className="text-[#00FF66]">● PRICE</span>
              {showSMA && (
                <>
                  <span className="text-[#00E5FF]">― 50_SMA</span>
                  <span className="text-[#FFB300]">― 200_SMA</span>
                </>
              )}
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={marketData.prices}>
                <defs>
                  <linearGradient id="terminalGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF66" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#00FF66" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#002200" />
                <XAxis dataKey="date" stroke="#00AA44" tick={{ fontSize: 10, fill: '#00AA44' }} />
                <YAxis stroke="#00AA44" tick={{ fontSize: 10, fill: '#00AA44' }} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', borderColor: '#00FF66', color: '#00FF66' }}
                  itemStyle={{ color: '#00FF66' }}
                />
                
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#00FF66" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#terminalGreen)" 
                  name="Price"
                />

                {showSMA && (
                  <Line 
                    type="monotone" 
                    dataKey="sma50" 
                    stroke="#00E5FF" 
                    strokeWidth={1.5} 
                    dot={false}
                    name="50-Day SMA"
                  />
                )}

                {showSMA && (
                  <Line 
                    type="monotone" 
                    dataKey="sma200" 
                    stroke="#FFB300" 
                    strokeWidth={1.5} 
                    dot={false}
                    strokeDasharray="4 4"
                    name="200-Day SMA"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Returns Frequency Histogram */}
        <div className="border-2 border-[#003311] bg-[#080808] p-4 space-y-3">
          <div className="text-xs text-[#00AA44] tracking-widest border-b border-[#003311] pb-2 flex justify-between">
            <span>[DAILY_RETURN_HISTOGRAM]</span>
            <span className="text-[#00FF66]">VOLATILITY_DISTRIBUTION</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketData.histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#002200" />
                <XAxis dataKey="range" stroke="#00AA44" tick={{ fontSize: 9, fill: '#00AA44' }} />
                <YAxis stroke="#00AA44" tick={{ fontSize: 10, fill: '#00AA44' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', borderColor: '#00FF66', color: '#00FF66' }}
                />
                <Bar dataKey="count">
                  {marketData.histogram.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.returnVal < 0 ? '#FF3333' : '#00FF66'} 
                      stroke={entry.returnVal < 0 ? '#990000' : '#00AA44'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 5. Terminal Footer Status */}
      <div className="border border-[#003311] bg-[#050505] p-3 text-[10px] text-[#00AA44] flex justify-between items-center">
        <span>EXCHANGE_COVERAGE: NYSE, NASDAQ, LSE, BSE, NSE, TSE, XETRA, ASX, HKEX + 60 MORE</span>
        <span>STATUS: GLOBAL_FEED_ACTIVE</span>
      </div>

    </div>
  );
}