import React, { useEffect, useState } from "react";
import AssetSearch from "./components/AssetSearch";
import NotificationPreferences from "./components/NotificationPreferences";
import PhantomAssistant from "./components/PhantomAssistant";

import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage'; 

function TypewriterHeader({ text, speed = 40 }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index += 1;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}

export default function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [stockDetails, setStockDetails] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [thesisStatus, setThesisStatus] = useState("HEALTHY");
  const [authView, setAuthView] = useState('login');
  const [user, setUser] = useState(null);
  const handleLogin = (result) => {
    setUser(result.data);
  };

  const handleSignup = () => {
    setAuthView('login');
  };

  const [comments, setComments] = useState(() => {
    const saved = localStorage.getItem("PHANTOM_FIRM_COMMENTS");

    return saved
      ? JSON.parse(saved)
      : {
          "AAPL": [
            {
              id: 1,
              author: "ANALYST_01",
              text: "Monitor free cash flow conversion and services growth.",
              timestamp: "10:42:01",
            },
            {
              id: 2,
              author: "RED_TEAM",
              text: "Review valuation assumptions before increasing exposure.",
              timestamp: "11:15:30",
            },
          ],
        };
  });

  const [newCommentText, setNewCommentText] = useState("");

  const [watchlist, setWatchlist] = useState([
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      exchange: "NASDAQ",
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      exchange: "NASDAQ",
    },
    {
      symbol: "RELIANCE.NS",
      name: "Reliance Industries Ltd.",
      exchange: "NSE",
    },
  ]);

  useEffect(() => {
    localStorage.setItem(
      "PHANTOM_FIRM_COMMENTS",
      JSON.stringify(comments)
    );
  }, [comments]);

  useEffect(() => {
    async function fetchQuote() {
      if (!ticker) {
        return;
      }

      try {
        setQuoteLoading(true);
        setQuoteError("");
        setStockDetails(null);

        const response = await fetch(
          `http://localhost:5001/api/quote/${encodeURIComponent(ticker)}`
        );

        if (!response.ok) {
          throw new Error(
            `Quote request failed with status ${response.status}`
          );
        }

        const data = await response.json();
        setStockDetails(data);
      } catch (error) {
        console.error("[QUOTE ERROR]", error);
        setQuoteError("Unable to load market telemetry.");
      } finally {
        setQuoteLoading(false);
      }
    }

    fetchQuote();
  }, [ticker]);

  const handleSelectAsset = (asset) => {
    setTicker(asset.symbol);

    setWatchlist((previous) => {
      const alreadyExists = previous.some(
        (item) => item.symbol === asset.symbol
      );

      if (alreadyExists) {
        return previous;
      }

      return [asset, ...previous];
    });
  };

  const handleRemoveFromWatchlist = (symbol) => {
    setWatchlist((previous) =>
      previous.filter((item) => item.symbol !== symbol)
    );

    if (ticker === symbol) {
      setTicker("AAPL");
    }
  };

  const handleAddComment = () => {
    const text = newCommentText.trim();

    if (!text) {
      return;
    }

    const newComment = {
      id: Date.now(),
      author: "ANALYST_01",
      text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setComments((previous) => ({
      ...previous,
      [ticker]: [...(previous[ticker] || []), newComment],
    }));

    setNewCommentText("");
  };

  const activeComments = comments[ticker] || [];

  return (
    <div
      style={{
        backgroundColor: "#050706",
        color: "#10b981",
        minHeight: "100vh",
        padding: "24px",
        fontFamily: "monospace",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          borderBottom: "1px solid #0f3822",
          paddingBottom: "12px",
          gap: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              margin: 0,
              letterSpacing: "1px",
            }}
          >
            PHANTOM_SOUL // OS_v1.0
          </h1>

          <p
            style={{
              fontSize: "0.75rem",
              color: "#047857",
              margin: 0,
            }}
          >
            PERSONAL INVESTMENT DECISION ENGINE // ADVERSARIAL RED TEAM ACTIVE
          </p>
        </div>

        <div
          style={{
            fontSize: "0.75rem",
            border: "1px solid #10b981",
            padding: "4px 12px",
            background: "#02180e",
            whiteSpace: "nowrap",
          }}
        >
          SYSTEM:{" "}
          <span style={{ fontWeight: "bold" }}>ONLINE</span> | GATEWAY:{" "}
          <span style={{ color: "#34d399" }}>PROXY_READY</span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px minmax(0, 1fr)",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          {/* SEARCH + WATCHLIST */}
          <div
            style={{
              border: "1px solid #0f3822",
              backgroundColor: "#080d0a",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                color: "#047857",
                marginBottom: "8px",
              }}
            >
              [01] GLOBAL INSTRUMENT SEARCH
            </div>

            <AssetSearch
              mode="WEALTH"
              onSelectAsset={handleSelectAsset}
              placeholder="Search ticker or company (e.g. AAPL, NVDA, RELIANCE)"
            />

            {/* WATCHLIST */}
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {watchlist.length === 0 ? (
                <div
                  style={{
                    padding: "10px",
                    border: "1px solid #0f3822",
                    backgroundColor: "#02180e",
                    color: "#047857",
                    fontSize: "0.7rem",
                  }}
                >
                  WATCHLIST EMPTY.
                </div>
              ) : (
                watchlist.map((item) => {
                  const isActive = item.symbol === ticker;

                  return (
                    <div
                      key={item.symbol}
                      onClick={() => setTicker(item.symbol)}
                      style={{
                        border: isActive
                          ? "1px solid #10b981"
                          : "1px solid #0f3822",
                        backgroundColor: isActive
                          ? "#062919"
                          : "#02180e",
                        padding: "10px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: isActive ? "bold" : "normal",
                            color: "#10b981",
                          }}
                        >
                          {item.symbol}
                        </div>

                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "#047857",
                            marginTop: "2px",
                          }}
                        >
                          {item.name}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.65rem",
                            border: "1px solid #047857",
                            padding: "2px 4px",
                            color: "#047857",
                          }}
                        >
                          {item.exchange}
                        </span>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveFromWatchlist(item.symbol);
                          }}
                          style={{
                            backgroundColor: "transparent",
                            border: "1px solid #7f1d1d",
                            color: "#ef4444",
                            padding: "3px 6px",
                            fontSize: "0.6rem",
                            fontFamily: "monospace",
                            cursor: "pointer",
                          }}
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div style={{ marginTop: "20px" }}>
            <NotificationPreferences />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* ACTIVE TARGET */}
          <div
            style={{
              border: "1px solid #0f3822",
              backgroundColor: "#080d0a",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
                gap: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#047857",
                  }}
                >
                  ACTIVE TARGET
                </div>

                <h2
                  style={{
                    fontSize: "2rem",
                    margin: "4px 0",
                    color: "#10b981",
                  }}
                >
                  <TypewriterHeader text={ticker} />
                </h2>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#047857",
                  }}
                >
                  {quoteLoading && "FETCHING REAL-TIME TELEMETRY..."}

                  {!quoteLoading && quoteError && (
                    <span style={{ color: "#ef4444" }}>
                      {quoteError}
                    </span>
                  )}

                  {!quoteLoading && !quoteError && stockDetails && (
                    <>
                      PRICE: $
                      {typeof stockDetails.price === "number"
                        ? stockDetails.price.toFixed(2)
                        : stockDetails.price}
                      {" | "}
                      50-SMA: $
                      {stockDetails.sma50 != null
                        ? Number(stockDetails.sma50).toFixed(2)
                        : "N/A"}
                      {" | "}
                      200-SMA: $
                      {stockDetails.sma200 != null
                        ? Number(stockDetails.sma200).toFixed(2)
                        : "N/A"}
                    </>
                  )}
                </div>
              </div>

              {/* THESIS STATUS */}
              <div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#047857",
                    textAlign: "right",
                    marginBottom: "4px",
                  }}
                >
                  THESIS STATE
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  {["HEALTHY", "REVIEW", "BROKEN"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setThesisStatus(status)}
                      style={{
                        backgroundColor:
                          thesisStatus === status
                            ? "#10b981"
                            : "transparent",
                        color:
                          thesisStatus === status
                            ? "#000"
                            : "#047857",
                        border: "1px solid #10b981",
                        padding: "4px 8px",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontFamily: "monospace",
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RED TEAM LOG */}
            <div
              style={{
                border: "1px solid #0f3822",
                padding: "16px",
                backgroundColor: "#02180e",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#047857",
                  marginBottom: "12px",
                }}
              >
                [02] ADVERSARIAL RED TEAM LOG // CORE LOGIC PARAMETERS
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: "8px",
                  fontSize: "0.8rem",
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "#047857" }}>
                  ORIGINAL THESIS:
                </span>

                <span>
                  FCF YoY Growth &gt; 12% // Expansion in Retail Segment
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: "8px",
                  fontSize: "0.8rem",
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "#047857" }}>
                  VALUATION FLOOR:
                </span>

                <span>22.5x P/E Target Entry</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: "8px",
                  fontSize: "0.8rem",
                }}
              >
                <span style={{ color: "#047857" }}>
                  BIAS AUDIT (RED TEAM):
                </span>

                <span style={{ color: "#34d399" }}>
                  NO IMPULSE BUYING DETECTED – LOGIC SOUND
                </span>
              </div>
            </div>

            {/* COMMENTS */}
            <div
              style={{
                marginTop: "20px",
                border: "1px solid #0f3822",
                backgroundColor: "#02180e",
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#047857",
                  marginBottom: "12px",
                }}
              >
                [03] ANALYST COMMENT LOG
              </div>

              {activeComments.length === 0 ? (
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#047857",
                    marginBottom: "12px",
                  }}
                >
                  NO COMMENTS FOR {ticker}.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  {activeComments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        border: "1px solid #0f3822",
                        padding: "10px",
                        backgroundColor: "#080d0a",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "5px",
                        }}
                      >
                        <strong style={{ fontSize: "0.7rem" }}>
                          {comment.author}
                        </strong>

                        <span
                          style={{
                            fontSize: "0.6rem",
                            color: "#047857",
                          }}
                        >
                          {comment.timestamp}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: "0.7rem",
                          lineHeight: 1.5,
                          color: "#10b981",
                        }}
                      >
                        {comment.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(event) =>
                    setNewCommentText(event.target.value)
                  }
                  placeholder="Add analyst comment..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleAddComment();
                    }
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "#080d0a",
                    border: "1px solid #0f3822",
                    color: "#10b981",
                    padding: "8px",
                    fontFamily: "monospace",
                    outline: "none",
                  }}
                />

                <button
                  type="button"
                  onClick={handleAddComment}
                  style={{
                    backgroundColor: "#10b981",
                    color: "#000",
                    border: "1px solid #10b981",
                    padding: "8px 12px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ADD
                </button>
              </div>
            </div>
          </div>

          {/* PHANTOM ASSISTANT */}
          <div style={{ marginTop: "20px" }}>
            <PhantomAssistant
              symbol={ticker}
              currentPrice={stockDetails?.price || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}