import React, { useState } from "react";

const navigation = [
  {
    label: "WORKSPACE",
    items: [
      { id: "dashboard", icon: "▦", label: "Dashboard" },
      { id: "markets", icon: "⌁", label: "Markets & Watchlist" },
      { id: "portfolio", icon: "▤", label: "Portfolio" },
      { id: "thesis", icon: "◎", label: "Investment Thesis" },
      { id: "notifications", icon: "♧", label: "Notifications" },
    ],
  },
  {
    label: "PERSONAL",
    items: [
      { id: "settings", icon: "⚙", label: "Settings" },
      { id: "account", icon: "♙", label: "My Account" },
    ],
  },
];

export default function Sidebar({
  activePage,
  onNavigate,
  onLogout,
  user,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? 72 : 244;

  return (
    <aside style={{
      position: "fixed",
      inset: "0 auto 0 0",
      width,
      boxSizing: "border-box",
      background: "#080d0a",
      borderRight: "1px solid #123522",
      display: "flex",
      flexDirection: "column",
      zIndex: 100,
      transition: "width 180ms ease",
      overflowX: "hidden",
      overflowY: "auto",
      fontFamily: "monospace",
      color: "#a7f3d0",
    }}>
      <div style={{
        padding: collapsed ? "22px 0" : "22px 18px",
        borderBottom: "1px solid #123522",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        gap: 8,
      }}>
        {!collapsed && (
          <div>
            <div style={{
              color: "#10b981",
              fontSize: 13,
              fontWeight: "bold",
              letterSpacing: 1,
            }}>
              PHANTOM_SOUL
            </div>
            <div style={{ fontSize: 9, color: "#64748b", marginTop: 5 }}>
              OS_v1.0
            </div>
          </div>
        )}
        {collapsed && (
          <span style={{ color: "#10b981", fontWeight: "bold" }}>PS</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          margin: "12px 10px",
          padding: 9,
          background: "#0b1510",
          color: "#10b981",
          border: "1px solid #17452c",
          borderRadius: 5,
          cursor: "pointer",
          textAlign: collapsed ? "center" : "right",
          fontFamily: "monospace",
        }}
      >
        {collapsed ? "»" : "« Collapse"}
      </button>

      <nav style={{ flex: 1, padding: "0 9px" }}>
        {navigation.map((group) => (
          <section key={group.label} style={{ marginBottom: 22 }}>
            {!collapsed && (
              <div style={{
                color: "#557563",
                fontSize: 9,
                letterSpacing: 2,
                padding: "8px 9px",
              }}>
                {group.label}
              </div>
            )}

            {group.items.map((item) => {
              const active = activePage === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap: 12,
                    padding: "12px 10px",
                    margin: "3px 0",
                    borderRadius: 5,
                    border: active
                      ? "1px solid #17633b"
                      : "1px solid transparent",
                    borderLeft: active
                      ? "3px solid #10b981"
                      : "3px solid transparent",
                    background: active ? "#0d2116" : "transparent",
                    color: active ? "#34d399" : "#8da596",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontSize: 11,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ width: 18, textAlign: "center", fontSize: 16 }}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </section>
        ))}
      </nav>

      <div style={{
        borderTop: "1px solid #123522",
        padding: collapsed ? "14px 6px" : "16px 14px",
      }}>
        {!collapsed && (
          <div style={{
            fontSize: 10,
            color: "#a7f3d0",
            overflowWrap: "anywhere",
            marginBottom: 12,
          }}>
            {user?.email || "Authenticated user"}
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Log out" : undefined}
          style={{
            width: "100%",
            padding: 10,
            background: "transparent",
            color: "#f87171",
            border: "1px solid #552626",
            borderRadius: 5,
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: 11,
          }}
        >
          {collapsed ? "↪" : "↪  Log out"}
        </button>
      </div>
    </aside>
  );
}
