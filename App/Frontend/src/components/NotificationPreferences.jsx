import React, { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5001/api/notifications";
const PREF_KEY = "PHANTOM_SOUL_NOTIFICATION_PREFERENCES";
const REVIEWED_KEY = "PHANTOM_SOUL_REVIEWED_NOTIFICATIONS";

const DEFAULT_PREFERENCES = {
  inApp: true,
  email: false,
  criticalOnly: false,
};

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const getId = (notification, index) =>
  String(
    notification.id ??
    notification._id ??
    `${notification.symbol ?? "ALERT"}-${notification.timestamp ?? index}-${index}`
  );

const severityColor = (type) => {
  switch (String(type).toUpperCase()) {
    case "CRITICAL":
    case "HIGH":
      return "#ef4444";
    case "MEDIUM":
    case "WARNING":
      return "#f59e0b";
    default:
      return "#34d399";
  }
};

const panelStyle = {
  border: "1px solid #0f3822",
  backgroundColor: "#080d0a",
  padding: "16px",
  color: "#10b981",
  fontFamily: "monospace",
};

const buttonStyle = {
  border: "1px solid #10b981",
  background: "#02180e",
  color: "#10b981",
  padding: "7px 10px",
  fontFamily: "monospace",
  fontSize: "0.7rem",
  cursor: "pointer",
};

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState(() =>
    readStorage(PREF_KEY, DEFAULT_PREFERENCES)
  );
  const [reviewed, setReviewed] = useState(() =>
    readStorage(REVIEWED_KEY, [])
  );
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadNotifications = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();
      const data = Array.isArray(result)
        ? result
        : result.data;

      if (!Array.isArray(data)) {
        throw new Error("Unexpected notification response format");
      }

      setNotifications(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("[PHANTOMSOUL NOTIFICATIONS]", err);
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem(REVIEWED_KEY, JSON.stringify(reviewed));
  }, [reviewed]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const togglePreference = (key) => {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const toggleReviewed = (id) => {
    setReviewed((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const visibleNotifications = notifications
    .map((notification, index) => ({
      ...notification,
      _displayId: getId(notification, index),
    }))
    .filter((notification) => {
      if (!preferences.inApp) return false;

      if (
        preferences.criticalOnly &&
        !["CRITICAL", "HIGH"].includes(
          String(notification.type ?? notification.severity).toUpperCase()
        )
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const aReviewed = reviewed.includes(a._displayId);
      const bReviewed = reviewed.includes(b._displayId);
      return Number(aReviewed) - Number(bReviewed);
    });

  const unreviewedCount = visibleNotifications.filter(
    (notification) => !reviewed.includes(notification._displayId)
  ).length;

  const toggleStyle = (enabled) => ({
    width: 42,
    height: 22,
    borderRadius: 12,
    border: "1px solid #10b981",
    backgroundColor: enabled ? "#10b981" : "#02180e",
    position: "relative",
    cursor: "pointer",
    padding: 0,
  });

  return (
    <section style={panelStyle}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ color: "#047857", fontSize: "0.75rem" }}>
            [03] PHANTOMSOUL // ALERT CENTER
          </div>
          <h2 style={{ margin: "8px 0 0", fontSize: "1.1rem" }}>
            Decision Integrity Monitor
          </h2>
        </div>

        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            setLoading(true);
            loadNotifications();
          }}
        >
          ↻ REFRESH
        </button>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {[
          ["TOTAL", notifications.length],
          ["NEEDS REVIEW", notifications.filter(
            (n, i) => !reviewed.includes(getId(n, i))
          ).length],
          ["HIGH PRIORITY", notifications.filter(
            (n) => ["CRITICAL", "HIGH"].includes(
              String(n.type ?? n.severity).toUpperCase()
            )
          ).length],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              border: "1px solid #0f3822",
              background: "#02180e",
              padding: 12,
            }}
          >
            <div style={{ color: "#047857", fontSize: "0.65rem" }}>
              {label}
            </div>
            <div style={{ fontSize: "1.4rem", marginTop: 5 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ color: "#047857", fontSize: "0.7rem", marginBottom: 8 }}>
          NOTIFICATION PREFERENCES
        </div>

        {[
          ["inApp", "IN-APP ALERTS"],
          ["email", "EMAIL PREFERENCE"],
          ["criticalOnly", "HIGH PRIORITY ONLY"],
        ].map(([key, label]) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: 9,
              marginBottom: 6,
              border: "1px solid #0f3822",
              background: "#02180e",
            }}
          >
            <span style={{ fontSize: "0.75rem" }}>{label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={preferences[key]}
              aria-label={`Toggle ${label}`}
              onClick={() => togglePreference(key)}
              style={toggleStyle(preferences[key])}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: preferences[key] ? 21 : 3,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: preferences[key] ? "#000" : "#047857",
                  transition: "left 0.15s ease",
                }}
              />
            </button>
          </div>
        ))}

        <div style={{ color: "#047857", fontSize: "0.62rem", lineHeight: 1.5 }}>
          Preferences are stored in this browser. Email delivery is not
          connected yet.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: "0.75rem" }}>ACTIVE ALERT STREAM</div>
        <div style={{ color: "#047857", fontSize: "0.65rem" }}>
          {unreviewedCount} NEEDS REVIEW
        </div>
      </div>

      {loading && (
        <p style={{ color: "#047857", fontSize: "0.75rem" }}>
          LOADING ALERTS...
        </p>
      )}

      {error && (
        <div
          role="alert"
          style={{
            border: "1px solid #ef4444",
            color: "#fca5a5",
            background: "#1c0909",
            padding: 12,
            fontSize: "0.75rem",
            lineHeight: 1.5,
          }}
        >
          ALERT SERVICE UNAVAILABLE: {error}
          <div style={{ marginTop: 8 }}>
            Check that the Express backend is running and that
            /api/notifications is available.
          </div>
        </div>
      )}

      {!loading && !error && visibleNotifications.length === 0 && (
        <div
          style={{
            padding: 14,
            border: "1px solid #0f3822",
            background: "#02180e",
            fontSize: "0.75rem",
            color: "#047857",
          }}
        >
          {preferences.inApp
            ? "NO ALERTS MATCH YOUR FILTERS."
            : "IN-APP ALERTS ARE TURNED OFF."}
        </div>
      )}

      {!loading && !error && visibleNotifications.map((notification) => {
        const id = notification._displayId;
        const isReviewed = reviewed.includes(id);
        const type = String(
          notification.type ?? notification.severity ?? "INFO"
        ).toUpperCase();

        return (
          <article
            key={id}
            style={{
              padding: 12,
              marginBottom: 9,
              border: `1px solid ${isReviewed ? "#17452e" : severityColor(type)}`,
              background: "#02180e",
              opacity: isReviewed ? 0.7 : 1,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              <strong style={{ fontSize: "0.8rem" }}>
                {notification.symbol ?? notification.title ?? "PHANTOMSOUL ALERT"}
              </strong>
              <span
                style={{
                  color: severityColor(type),
                  fontSize: "0.65rem",
                  fontWeight: "bold",
                }}
              >
                {type} {isReviewed ? " / REVIEWED" : ""}
              </span>
            </div>

            <div style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
              {notification.message ?? notification.content ?? "Review the underlying evidence."}
            </div>

            {notification.explanation && (
              <div
                style={{
                  marginTop: 8,
                  color: "#a7f3d0",
                  fontSize: "0.7rem",
                  lineHeight: 1.5,
                }}
              >
                WHY IT MATTERS: {notification.explanation}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 12,
              }}
            >
              <span style={{ color: "#047857", fontSize: "0.62rem" }}>
                {notification.timestamp
                  ? new Date(notification.timestamp).toLocaleString()
                  : notification.createdAt
                    ? new Date(notification.createdAt).toLocaleString()
                    : "Timestamp unavailable"}
              </span>

              <button
                type="button"
                style={buttonStyle}
                onClick={() => toggleReviewed(id)}
              >
                {isReviewed ? "REOPEN REVIEW" : "MARK REVIEWED"}
              </button>
            </div>
          </article>
        );
      })}

      <footer
        style={{
          borderTop: "1px solid #0f3822",
          marginTop: 16,
          paddingTop: 10,
          color: "#047857",
          fontSize: "0.62rem",
        }}
      >
        {lastUpdated
          ? `LAST SYNC: ${lastUpdated.toLocaleTimeString()}`
          : "WAITING FOR FIRST SYNC"}
        {" // "}REVIEW FLAGS ARE LOCAL TO THIS BROWSER
      </footer>
    </section>
  );
}
