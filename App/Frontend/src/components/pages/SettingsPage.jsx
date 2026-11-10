import React from "react";

export default function SettingsPage({ user, onLogout }) {
  return (
    <section style={pageStyle}>
      <div style={eyebrow}>SYSTEM CONFIGURATION</div>
      <h1 style={heading}>Settings</h1>
      <p style={description}>
        Manage your PhantomSoul account and workspace preferences.
      </p>

      <div style={panel}>
        <h2 style={subheading}>Appearance</h2>
        <div style={rowStyle}>
          <div>
            <div style={label}>Interface theme</div>
            <div style={hint}>PhantomSoul terminal theme</div>
          </div>
          <span style={{ color: "#34d399", fontSize: 12 }}>DARK / GREEN</span>
        </div>
      </div>

      <div style={panel}>
        <h2 style={subheading}>Account</h2>
        <div style={rowStyle}>
          <div>
            <div style={label}>Signed in as</div>
            <div style={hint}>{user?.email || "Account information unavailable"}</div>
          </div>
          <span style={{ color: "#34d399", fontSize: 11 }}>
            {user?.role || "CLIENT"}
          </span>
        </div>
      </div>

      <div style={panel}>
        <h2 style={subheading}>Session</h2>
        <div style={rowStyle}>
          <div>
            <div style={label}>Sign out of PhantomSoul</div>
            <div style={hint}>Return to the login screen on this device.</div>
          </div>
          <button type="button" onClick={onLogout} style={dangerButton}>
            Log out
          </button>
        </div>
      </div>

      <p style={{ color: "#64748b", fontSize: 10, marginTop: 24 }}>
        More preferences can be connected here as notification and account
        settings are implemented.
      </p>
    </section>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "32px",
  background: "#050706",
  color: "#d1fae5",
  fontFamily: "monospace",
  boxSizing: "border-box",
};

const eyebrow = { color: "#10b981", fontSize: 10, letterSpacing: 2 };
const heading = { fontSize: 30, margin: "12px 0", color: "#ecfdf5" };
const description = { color: "#8da596", fontSize: 12, lineHeight: 1.8 };
const panel = {
  marginTop: 22,
  border: "1px solid #17452c",
  background: "#080d0a",
  padding: 20,
  borderRadius: 7,
};
const subheading = {
  fontSize: 12,
  color: "#34d399",
  margin: "0 0 20px",
  letterSpacing: 1,
};
const rowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};
const label = { color: "#d1fae5", fontSize: 12 };
const hint = { color: "#718579", fontSize: 10, marginTop: 7 };
const dangerButton = {
  background: "transparent",
  color: "#f87171",
  border: "1px solid #7f3030",
  borderRadius: 5,
  padding: "9px 14px",
  cursor: "pointer",
  fontFamily: "monospace",
};
