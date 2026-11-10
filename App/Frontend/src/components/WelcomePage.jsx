import React from "react";

export default function WelcomePage({ onLogin, onSignup }) {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#050706",
      color: "#e5e7eb",
      fontFamily: "monospace",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
    }}>
      <div style={{
        position: "absolute",
        width: 500,
        height: 500,
        top: -250,
        right: -100,
        borderRadius: "50%",
        background: "rgba(16,185,129,0.09)",
        filter: "blur(100px)",
        pointerEvents: "none",
      }} />

      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        padding: "26px 6%",
        borderBottom: "1px solid #123522",
        position: "relative",
      }}>
        <div>
          <div style={{ color: "#10b981", fontWeight: "bold", letterSpacing: 2 }}>
            PHANTOM_SOUL
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 5 }}>
            INVESTMENT INTELLIGENCE // OS_v1.0
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onLogin} style={secondaryButton}>
            Log in
          </button>
          <button onClick={onSignup} style={primaryButton}>
            Create account
          </button>
        </div>
      </header>

      <section style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        padding: "80px 8%",
        position: "relative",
      }}>
        <div style={{ maxWidth: 800 }}>
          <div style={{
            color: "#10b981",
            fontSize: 12,
            letterSpacing: 3,
            marginBottom: 24,
          }}>
            THINK CLEARLY. INVEST DELIBERATELY.
          </div>

          <h1 style={{
            fontSize: "clamp(2.6rem, 7vw, 5.5rem)",
            lineHeight: 1.08,
            letterSpacing: -2,
            margin: "0 0 24px",
            fontWeight: 800,
          }}>
            Intelligence over
            <br />
            <span style={{ color: "#10b981" }}>impulse.</span>
          </h1>

          <p style={{
            maxWidth: 600,
            color: "#9ca3af",
            fontSize: 16,
            lineHeight: 1.9,
          }}>
            A structured investment workspace built to help you monitor
            markets, evaluate portfolio risk, and challenge your investment
            thesis before emotion takes over.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 34 }}>
            <button onClick={onSignup} style={primaryButton}>
              Get started →
            </button>
            <button onClick={onLogin} style={secondaryButton}>
              Access your workspace
            </button>
          </div>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 30,
            marginTop: 64,
            borderTop: "1px solid #123522",
            paddingTop: 24,
          }}>
            {[
              ["01", "MARKET MONITORING"],
              ["02", "PORTFOLIO DISCIPLINE"],
              ["03", "THESIS INTEGRITY"],
            ].map(([number, label]) => (
              <div key={number}>
                <div style={{ color: "#10b981", fontSize: 12 }}>{number}</div>
                <div style={{ color: "#9ca3af", fontSize: 10, marginTop: 8 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{
        padding: "20px 6%",
        borderTop: "1px solid #123522",
        color: "#4b5563",
        fontSize: 10,
      }}>
        PHANTOM_SOUL // DECISION SUPPORT, NOT FINANCIAL ADVICE
      </footer>
    </main>
  );
}

const primaryButton = {
  background: "#10b981",
  color: "#03120a",
  border: "1px solid #10b981",
  borderRadius: 6,
  padding: "12px 18px",
  fontFamily: "monospace",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButton = {
  background: "transparent",
  color: "#d1fae5",
  border: "1px solid #24533a",
  borderRadius: 6,
  padding: "12px 18px",
  fontFamily: "monospace",
  cursor: "pointer",
};
