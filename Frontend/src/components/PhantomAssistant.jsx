import React, { useState } from "react";

export default function PhantomAssistant({
  symbol = "AAPL",
  currentPrice = 0,
}) {
  const [thesis, setThesis] = useState("");
  const [valuationFloor, setValuationFloor] = useState("");
  const [contextMode, setContextMode] = useState("WEALTH");

  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runAnalysis = async () => {
    if (!thesis.trim()) {
      setError("ENTER A THESIS BEFORE RUNNING THE AUDIT.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnalysis("");

      const response = await fetch(
        "http://localhost:5001/api/analyze-thesis",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symbol,
            thesis,
            currentPrice,
            valuationFloor,
            contextMode,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.details ||
            result.error ||
            `Request failed with status ${response.status}`
        );
      }

      setAnalysis(result.analysis || "NO ANALYSIS RETURNED.");
    } catch (err) {
      console.error("[PHANTOM ASSISTANT ERROR]", err);

      setError(
        err.message ||
          "AI analysis is currently unavailable."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #0f3822",
        backgroundColor: "#080d0a",
        padding: "16px",
        color: "#10b981",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          color: "#047857",
          fontSize: "0.75rem",
          marginBottom: "14px",
        }}
      >
        [04] PHANTOM ASSISTANT // RED TEAM AUDIT
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.65rem",
              color: "#047857",
              marginBottom: "5px",
            }}
          >
            ASSET
          </label>

          <input
            value={symbol}
            readOnly
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px",
              backgroundColor: "#02180e",
              border: "1px solid #0f3822",
              color: "#10b981",
              fontFamily: "monospace",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.65rem",
              color: "#047857",
              marginBottom: "5px",
            }}
          >
            CURRENT VALUE
          </label>

          <input
            value={currentPrice || ""}
            readOnly
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px",
              backgroundColor: "#02180e",
              border: "1px solid #0f3822",
              color: "#10b981",
              fontFamily: "monospace",
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.65rem",
            color: "#047857",
            marginBottom: "5px",
          }}
        >
          CONTEXT
        </label>

        <select
          value={contextMode}
          onChange={(event) =>
            setContextMode(event.target.value)
          }
          style={{
            width: "100%",
            padding: "8px",
            backgroundColor: "#02180e",
            border: "1px solid #10b981",
            color: "#10b981",
            fontFamily: "monospace",
          }}
        >
          <option value="WEALTH">WEALTH MANAGEMENT</option>
          <option value="STRATEGY">CORPORATE STRATEGY</option>
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.65rem",
            color: "#047857",
            marginBottom: "5px",
          }}
        >
          INVESTMENT / STRATEGIC THESIS
        </label>

        <textarea
          value={thesis}
          onChange={(event) =>
            setThesis(event.target.value)
          }
          rows={5}
          placeholder="Enter the thesis you want PhantomSoul to challenge..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px",
            resize: "vertical",
            backgroundColor: "#02180e",
            border: "1px solid #10b981",
            color: "#10b981",
            outline: "none",
            fontFamily: "monospace",
          }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.65rem",
            color: "#047857",
            marginBottom: "5px",
          }}
        >
          VALUATION FLOOR / TARGET
        </label>

        <input
          value={valuationFloor}
          onChange={(event) =>
            setValuationFloor(event.target.value)
          }
          placeholder="e.g. $180 entry target"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px",
            backgroundColor: "#02180e",
            border: "1px solid #0f3822",
            color: "#10b981",
            fontFamily: "monospace",
          }}
        />
      </div>

      <button
        type="button"
        onClick={runAnalysis}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #10b981",
          backgroundColor: loading
            ? "#062919"
            : "#10b981",
          color: loading ? "#10b981" : "#000",
          fontWeight: "bold",
          fontFamily: "monospace",
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading
          ? "RUNNING RED TEAM AUDIT..."
          : "RUN THESIS AUDIT"}
      </button>

      {error && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            border: "1px solid #ef4444",
            color: "#ef4444",
            backgroundColor: "#160606",
            fontSize: "0.7rem",
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {analysis && (
        <div
          style={{
            marginTop: "14px",
            border: "1px solid #0f3822",
            backgroundColor: "#02180e",
            padding: "12px",
          }}
        >
          <div
            style={{
              color: "#047857",
              fontSize: "0.65rem",
              marginBottom: "8px",
            }}
          >
            PHANTOM_SOUL ANALYSIS
          </div>

          <div
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "0.75rem",
              lineHeight: 1.6,
            }}
          >
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
