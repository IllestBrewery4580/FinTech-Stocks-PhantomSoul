import React, { useEffect, useState } from 'react';

export default function MarketWatch({
  initialTicker = 'AAPL',
  onTickerChange,
}) {
  const [ticker, setTicker] = useState(initialTicker);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState('');

  const [watchlist, setWatchlist] = useState([
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      exchange: 'NASDAQ',
    },
    {
      symbol: 'RELIANCE.NS',
      name: 'Reliance Industries Ltd.',
      exchange: 'NSE',
    },
  ]);

  /*
   * Search Yahoo Finance instruments through your backend.
   */
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/search?q=${encodeURIComponent(
            search
          )}`
        );

        if (!response.ok) {
          throw new Error('Search request failed');
        }

        const data = await response.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  /*
   * Fetch current quote.
   */
  useEffect(() => {
    fetchQuote(ticker);
  }, [ticker]);

  async function fetchQuote(symbol) {
    setLoadingQuote(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:5000/api/quote/${encodeURIComponent(
          symbol
        )}`
      );

      if (!response.ok) {
        throw new Error('Quote request failed');
      }

      const data = await response.json();

      setQuote(data);

      /*
       * Optional history endpoint.
       * If your backend doesn't have this yet, the component
       * simply leaves the chart area empty.
       */
      try {
        const historyResponse = await fetch(
          `http://localhost:5000/api/history/${encodeURIComponent(
            symbol
          )}`
        );

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistory(
            Array.isArray(historyData) ? historyData : []
          );
        }
      } catch {
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
      setError(
        'Unable to retrieve market data. Check that the backend is running.'
      );
      setQuote(null);
    } finally {
      setLoadingQuote(false);
    }
  }

  /*
   * Ask your backend's OpenAI integration to analyze the
   * currently selected security.
   *
   * IMPORTANT:
   * The OpenAI API key stays on the backend.
   */
  async function runAIAnalysis() {
    setLoadingAnalysis(true);
    setAnalysis(null);

    try {
      const response = await fetch(
        'http://localhost:5000/api/ai/analyze',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol: ticker,
            quote,
            history,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('AI analysis request failed');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);

      /*
       * Fallback so the UI still works while the AI endpoint
       * is being built.
       */
      setAnalysis({
        summary:
          'AI analysis endpoint is not currently available.',
        risks: [
          'Verify that the backend is running.',
          'Verify the /api/ai/analyze endpoint.',
          'Verify that the OpenAI API key is configured server-side.',
        ],
      });
    } finally {
      setLoadingAnalysis(false);
    }
  }

  function selectTicker(stock) {
    setTicker(stock.symbol);
    setSearch('');
    setSearchResults([]);

    if (
      !watchlist.some(
        (item) => item.symbol === stock.symbol
      )
    ) {
      setWatchlist((previous) => [
        stock,
        ...previous,
      ]);
    }

    onTickerChange?.(stock.symbol);
  }

  function selectWatchlist(symbol) {
    setTicker(symbol);
    onTickerChange?.(symbol);
  }

  const price = quote?.price;
  const previousClose = quote?.previousClose;

  const change =
    price != null && previousClose != null
      ? price - previousClose
      : null;

  const changePercent =
    price != null &&
    previousClose != null &&
    previousClose !== 0
      ? (change / previousClose) * 100
      : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050706',
        color: '#10b981',
        padding: '24px',
        fontFamily: 'monospace',
      }}
    >
      {/* HEADER */}

      <header
        style={{
          borderBottom: '1px solid #0f3822',
          paddingBottom: '14px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.25rem',
              letterSpacing: '2px',
            }}
          >
            PHANTOM_SOUL // MARKET_WATCH
          </h1>

          <div
            style={{
              color: '#047857',
              fontSize: '0.7rem',
              marginTop: '5px',
            }}
          >
            YAHOO FINANCE DATA // AI RED TEAM ANALYSIS
          </div>
        </div>

        <div
          style={{
            border: '1px solid #10b981',
            padding: '5px 10px',
            fontSize: '0.7rem',
          }}
        >
          DATA: ONLINE
        </div>
      </header>

      {/* SEARCH */}

      <div
        style={{
          position: 'relative',
          marginBottom: '20px',
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH TICKER OR COMPANY..."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: '#02180e',
            border: '1px solid #10b981',
            color: '#10b981',
            padding: '12px',
            outline: 'none',
            fontFamily: 'monospace',
          }}
        />

        {searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '45px',
              zIndex: 100,
              background: '#080d0a',
              border: '1px solid #10b981',
            }}
          >
            {searchResults.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => selectTicker(stock)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #0f3822',
                  color: '#10b981',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                }}
              >
                <strong>{stock.symbol}</strong>

                <div
                  style={{
                    fontSize: '0.65rem',
                    color: '#047857',
                    marginTop: '3px',
                  }}
                >
                  {stock.name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            border: '1px solid #7f1d1d',
            background: '#180606',
            color: '#f87171',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '0.75rem',
          }}
        >
          {error}
        </div>
      )}

      {/* MAIN GRID */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '20px',
        }}
      >
        {/* WATCHLIST */}

        <aside
          style={{
            border: '1px solid #0f3822',
            background: '#080d0a',
            padding: '16px',
          }}
        >
          <div
            style={{
              color: '#047857',
              fontSize: '0.7rem',
              marginBottom: '12px',
            }}
          >
            [01] WATCHLIST
          </div>

          {watchlist.map((item) => {
            const active = item.symbol === ticker;

            return (
              <button
                key={item.symbol}
                onClick={() =>
                  selectWatchlist(item.symbol)
                }
                style={{
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: '8px',
                  padding: '10px',
                  background: active
                    ? '#062919'
                    : '#02180e',
                  border: active
                    ? '1px solid #10b981'
                    : '1px solid #0f3822',
                  color: '#10b981',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                  }}
                >
                  {item.symbol}
                </div>

                <div
                  style={{
                    color: '#047857',
                    fontSize: '0.65rem',
                    marginTop: '4px',
                  }}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    color: '#047857',
                    fontSize: '0.6rem',
                    marginTop: '4px',
                  }}
                >
                  {item.exchange}
                </div>
              </button>
            );
          })}
        </aside>

        {/* SECURITY PANEL */}

        <main>
          <section
            style={{
              border: '1px solid #0f3822',
              background: '#080d0a',
              padding: '20px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                color: '#047857',
                fontSize: '0.7rem',
              }}
            >
              ACTIVE SECURITY
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginTop: '5px',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '2rem',
                  }}
                >
                  {ticker}
                </h2>

                <div
                  style={{
                    marginTop: '8px',
                    color: '#047857',
                    fontSize: '0.7rem',
                  }}
                >
                  {quote?.name || 'LOADING SECURITY DATA...'}
                </div>
              </div>

              <div
                style={{
                  textAlign: 'right',
                }}
              >
                {loadingQuote ? (
                  <div>FETCHING...</div>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: '1.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {price != null
                        ? `$${Number(price).toFixed(2)}`
                        : '--'}
                    </div>

                    <div
                      style={{
                        fontSize: '0.75rem',
                        color:
                          change >= 0
                            ? '#34d399'
                            : '#f87171',
                      }}
                    >
                      {change != null
                        ? `${change >= 0 ? '+' : ''}${change.toFixed(
                            2
                          )} (${changePercent?.toFixed(
                            2
                          )}%)`
                        : '--'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* METRICS */}

          <section
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(4, 1fr)',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <Metric
              label="50-SMA"
              value={quote?.sma50}
            />

            <Metric
              label="200-SMA"
              value={quote?.sma200}
            />

            <Metric
              label="VOLUME"
              value={quote?.volume}
              integer
            />

            <Metric
              label="MARKET CAP"
              value={quote?.marketCap}
              integer
            />
          </section>

          {/* AI */}

          <section
            style={{
              border: '1px solid #0f3822',
              background: '#080d0a',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
              }}
            >
              <div>
                <div
                  style={{
                    color: '#047857',
                    fontSize: '0.7rem',
                  }}
                >
                  [02] AI ADVERSARIAL RED TEAM
                </div>

                <div
                  style={{
                    marginTop: '5px',
                    fontSize: '0.85rem',
                  }}
                >
                  Thesis stress test
                </div>
              </div>

              <button
                onClick={runAIAnalysis}
                disabled={loadingAnalysis || !quote}
                style={{
                  border: '1px solid #10b981',
                  background:
                    loadingAnalysis || !quote
                      ? '#02180e'
                      : '#10b981',
                  color:
                    loadingAnalysis || !quote
                      ? '#047857'
                      : '#000',
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  cursor:
                    loadingAnalysis || !quote
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {loadingAnalysis
                  ? 'ANALYZING...'
                  : 'RUN RED TEAM'}
              </button>
            </div>

            {!analysis && (
              <div
                style={{
                  border: '1px solid #0f3822',
                  background: '#02180e',
                  padding: '20px',
                  color: '#047857',
                  fontSize: '0.75rem',
                }}
              >
                Select a security and run the AI
                adversarial analysis.
              </div>
            )}

            {analysis && (
              <div
                style={{
                  display: 'grid',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    border: '1px solid #0f3822',
                    padding: '14px',
                    background: '#02180e',
                  }}
                >
                  <div
                    style={{
                      color: '#047857',
                      fontSize: '0.65rem',
                      marginBottom: '8px',
                    }}
                  >
                    AI SUMMARY
                  </div>

                  <div
                    style={{
                      fontSize: '0.8rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {analysis.summary ||
                      analysis.analysis ||
                      'No summary returned.'}
                  </div>
                </div>

                {Array.isArray(analysis.risks) &&
                  analysis.risks.length > 0 && (
                    <div
                      style={{
                        border: '1px solid #0f3822',
                        padding: '14px',
                        background: '#02180e',
                      }}
                    >
                      <div
                        style={{
                          color: '#047857',
                          fontSize: '0.65rem',
                          marginBottom: '8px',
                        }}
                      >
                        RED FLAGS / RISKS
                      </div>

                      {analysis.risks.map(
                        (risk, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '6px 0',
                              fontSize: '0.75rem',
                              borderBottom:
                                '1px solid #0f3822',
                            }}
                          >
                            [{index + 1}] {risk}
                          </div>
                        )
                      )}
                    </div>
                  )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value, integer = false }) {
  let display = '--';

  if (value !== undefined && value !== null) {
    const number = Number(value);

    if (!Number.isNaN(number)) {
      display = integer
        ? number.toLocaleString()
        : number.toFixed(2);
    }
  }

  return (
    <div
      style={{
        border: '1px solid #0f3822',
        background: '#080d0a',
        padding: '12px',
      }}
    >
      <div
        style={{
          color: '#047857',
          fontSize: '0.6rem',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: '0.9rem',
          fontWeight: 'bold',
        }}
      >
        {display}
      </div>
    </div>
  );
}
