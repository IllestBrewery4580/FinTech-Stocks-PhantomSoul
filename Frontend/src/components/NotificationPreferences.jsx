import React, { useEffect, useState } from "react";

const STORAGE_KEY = "PHANTOM_SOUL_NOTIFICATION_PREFERENCES";

const DEFAULT_PREFERENCES = {
  inApp: true,
  email: false,
  criticalOnly: false,
};

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_PREFERENCES;
    }

    try {
      return {
        ...DEFAULT_PREFERENCES,
        ...JSON.parse(saved),
      };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(preferences)
    );
  }, [preferences]);

  useEffect(() => {
    async function loadNotifications() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5001/api/notifications"
        );

        if (!response.ok) {
          throw new Error(
            `Notification request failed with status ${response.status}`
          );
        }

        const result = await response.json();

        setNotifications(
          Array.isArray(result.data) ? result.data : []
        );
      } catch (err) {
        console.error("[NOTIFICATION ERROR]", err);
        setError("Unable to load notifications.");
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const togglePreference = (key) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const visibleNotifications = preferences.criticalOnly
    ? notifications.filter(
        (notification) => notification.type === "CRITICAL"
      )
    : notifications;

  const toggleStyle = (enabled) => ({
    width: "42px",
    height: "22px",
    borderRadius: "12px",
    border: "1px solid #10b981",
    backgroundColor: enabled ? "#10b981" : "#02180e",
    position: "relative",
    cursor: "pointer",
    padding: 0,
  });

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
        [03] NOTIFICATION CONTROL
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {[
          ["inApp", "IN-APP ALERTS"],
          ["email", "EMAIL ALERTS"],
          ["criticalOnly", "CRITICAL ONLY"],
        ].map(([key, label]) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px",
              backgroundColor: "#02180e",
              border: "1px solid #0f3822",
            }}
          >
            <span style={{ fontSize: "0.75rem" }}>
              {label}
            </span>

            <button
              type="button"
              aria-label={`Toggle ${label}`}
              onClick={() => togglePreference(key)}
              style={toggleStyle(preferences[key])}
            >
              <span
                style={{
                  position: "absolute",
                  top: "3px",
                  left: preferences[key] ? "21px" : "3px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: preferences[key]
                    ? "#000"
                    : "#047857",
                  transition: "left 0.15s ease",
                }}
              />
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          color: "#047857",
          fontSize: "0.7rem",
          marginBottom: "8px",
        }}
      >
        ACTIVE ALERT STREAM
      </div>

      {loading && (
        <div
          style={{
            fontSize: "0.7rem",
            color: "#047857",
          }}
        >
          LOADING NOTIFICATIONS...
        </div>
      )}

      {error && (
        <div
          style={{
            fontSize: "0.7rem",
            color: "#ef4444",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && visibleNotifications.length === 0 && (
        <div
          style={{
            padding: "10px",
            border: "1px solid #0f3822",
            backgroundColor: "#02180e",
            fontSize: "0.7rem",
            color: "#047857",
          }}
        >
          NO ACTIVE NOTIFICATIONS.
        </div>
      )}

      {!loading &&
        !error &&
        visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              padding: "10px",
              marginBottom: "8px",
              border: "1px solid #0f3822",
              backgroundColor: "#02180e",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "5px",
              }}
            >
              <strong style={{ fontSize: "0.75rem" }}>
                {notification.symbol}
              </strong>

              <span
                style={{
                  fontSize: "0.65rem",
                  color:
                    notification.type === "CRITICAL"
                      ? "#ef4444"
                      : "#34d399",
                }}
              >
                {notification.type}
              </span>
            </div>

            <div
              style={{
                fontSize: "0.7rem",
                color: "#10b981",
                lineHeight: 1.5,
              }}
            >
              {notification.message}
            </div>

            <div
              style={{
                marginTop: "6px",
                fontSize: "0.6rem",
                color: "#047857",
              }}
            >
              {notification.timestamp}
            </div>
          </div>
        ))}
    </div>
  );
}
