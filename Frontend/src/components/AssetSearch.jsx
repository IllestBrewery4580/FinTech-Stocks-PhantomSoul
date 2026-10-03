import React, { useEffect, useRef, useState } from "react";

export default function AssetSearch({
  onSelectAsset,
  mode = "WEALTH",
  placeholder = "Search ticker or company...",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5001/api/search?q=${encodeURIComponent(
            query
          )}&mode=${encodeURIComponent(mode)}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }

        const data = await response.json();

        setResults(Array.isArray(data) ? data : []);
        setIsOpen(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("[ASSET SEARCH ERROR]", err);
          setResults([]);
          setError("Unable to load search results.");
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, mode]);

  const handleSelect = (asset) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);

    if (onSelectAsset) {
      onSelectAsset(asset);
    }
  };

  return (
    <div
      ref={searchRef}
      style={{
        position: "relative",
        width: "100%",
        fontFamily: "monospace",
      }}
    >
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          if (results.length > 0) {
            setIsOpen(true);
          }
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          backgroundColor: "#02180e",
          border: "1px solid #10b981",
          color: "#10b981",
          outline: "none",
          fontFamily: "monospace",
        }}
      />

      {loading && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "0.7rem",
            color: "#047857",
          }}
        >
          QUERYING MARKET DATA...
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "0.7rem",
            color: "#ef4444",
          }}
        >
          {error}
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            marginTop: "4px",
            backgroundColor: "#080d0a",
            border: "1px solid #10b981",
            maxHeight: "260px",
            overflowY: "auto",
            boxShadow: "0 10px 30px rgba(0,0,0,0.7)",
          }}
        >
          {results.map((asset) => (
            <button
              key={`${asset.symbol}-${asset.exchange}`}
              type="button"
              onClick={() => handleSelect(asset)}
              style={{
                width: "100%",
                textAlign: "left",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: "1px solid #0f3822",
                padding: "10px 12px",
                cursor: "pointer",
                color: "#10b981",
                fontFamily: "monospace",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = "#062919";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                    }}
                  >
                    {asset.symbol}
                  </div>

                  <div
                    style={{
                      marginTop: "3px",
                      fontSize: "0.7rem",
                      color: "#047857",
                    }}
                  >
                    {asset.name}
                  </div>
                </div>

                <div
                  style={{
                    flexShrink: 0,
                    alignSelf: "center",
                    fontSize: "0.65rem",
                    border: "1px solid #047857",
                    padding: "3px 5px",
                    color: "#34d399",
                  }}
                >
                  {asset.exchange || asset.category || "MARKET"}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen &&
        !loading &&
        query.trim() &&
        results.length === 0 &&
        !error && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 100,
              marginTop: "4px",
              padding: "10px",
              backgroundColor: "#080d0a",
              border: "1px solid #0f3822",
              color: "#047857",
              fontSize: "0.7rem",
            }}
          >
            NO MATCHING ASSETS FOUND.
          </div>
        )}
    </div>
  );
}
