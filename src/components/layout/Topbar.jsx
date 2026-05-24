// src/components/layout/Topbar.jsx
//
// REWIRED — no more local fetching/polling. Reads from NotificationContext
// which lives at the app root and only fetches ONCE. Topbar may remount
// across routes, but state survives because it's held in context.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Bell, Menu, LogOut, User, Settings,
  Sparkles, Calendar, MessageSquare, CheckCircle, AlertTriangle, Info,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotifications } from "../../context/NotificationContext.jsx";
import s from "./Topbar.module.css";

const TYPE_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  milestone: Sparkles,
  event: Calendar,
  message: MessageSquare,
};

const TYPE_COLORS = {
  info: "var(--color-primary)",
  success: "var(--color-success, #16a34a)",
  warning: "var(--color-warning, #eab308)",
  milestone: "var(--color-accent, #f97316)",
  event: "var(--color-accent, #f97316)",
  message: "var(--color-primary)",
};

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead, refresh } = useNotifications();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const role = (user?.role || "student").toLowerCase();
  const initials = (user?.name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const handleLogout = () => { logout(); navigate("/login"); };
  const closeMenus = () => { setUserMenuOpen(false); setNotifMenuOpen(false); };

  const handleNotifClick = async (n) => {
    if (n.unread) await markAsRead(n._id);
    closeMenus();
    if (n.link) navigate(n.link);
  };

  const renderAvatarFace = () => {
    if (user?.avatar && user.avatar.length > 10) {
      return <img src={user.avatar} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />;
    }
    return <span style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>{initials}</span>;
  };

  return (
    <header className={s.bar} style={{ overflow: "visible", zIndex: 50, position: "relative" }}>
      {(userMenuOpen || notifMenuOpen) && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={closeMenus} />
      )}

      <button className={s.menu} onClick={onMenuClick} aria-label="Open menu"><Menu size={20} /></button>

      <div className={s.search}>
        <Search size={16} />
        <input placeholder="Search careers, skills, mentors…" />
      </div>

      <div className={s.spacer} />

      <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative", overflow: "visible" }}>

        {/* NOTIFICATIONS */}
        <button
          className={s.iconBtn}
          aria-label={`Notifications (${unreadCount} unread)`}
          onClick={() => {
            const next = !notifMenuOpen;
            setNotifMenuOpen(next);
            setUserMenuOpen(false);
            if (next) refresh(); // pull latest when dropdown opens
          }}
          style={{ position: "relative", zIndex: 50 }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: 4, right: 4,
              minWidth: 18, height: 18, padding: "0 5px",
              borderRadius: 9, background: "var(--color-accent, #f97316)",
              color: "white", fontSize: 10, fontWeight: 800,
              display: "grid", placeItems: "center",
              border: "2px solid var(--color-surface, white)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {notifMenuOpen && (
          <div style={{
            position: "absolute", top: "45px", right: "100px", width: "360px",
            backgroundColor: "var(--color-surface, #fff)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)",
            zIndex: 100, overflow: "hidden", maxHeight: "480px",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "14px 16px", borderBottom: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: "var(--color-muted)", fontWeight: 600 }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--color-muted)", fontSize: 13 }}>
                  <Bell size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>You're all caught up.</div>
                  <div style={{ marginTop: 4, fontSize: 12 }}>New notifications will appear here.</div>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Info;
                  const color = TYPE_COLORS[n.type] || "var(--color-primary)";
                  return (
                    <div
                      key={n._id}
                      onClick={() => handleNotifClick(n)}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--color-border)",
                        backgroundColor: n.unread ? "var(--color-primary-faint, rgba(13,148,136,0.06))" : "transparent",
                        cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-bg)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.unread ? "var(--color-primary-faint, rgba(13,148,136,0.06))" : "transparent"}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: `${color}1a`, color,
                        display: "grid", placeItems: "center", flexShrink: 0,
                      }}>
                        <Icon size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: n.unread ? 600 : 500, color: "var(--color-text)", lineHeight: 1.4 }}>
                          {n.text || n.body}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
                          {n.timeAgo}
                        </div>
                      </div>
                      {n.unread && (
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: "var(--color-accent)", flexShrink: 0, marginTop: 8,
                        }} />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && unreadCount > 0 && (
              <div
                onClick={markAllRead}
                style={{
                  padding: "11px", textAlign: "center", fontSize: "13px",
                  color: "var(--color-primary)", cursor: "pointer", fontWeight: "600",
                  borderTop: "1px solid var(--color-border)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-bg)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                Mark all as read
              </div>
            )}
          </div>
        )}

        {/* PROFILE BLOCK */}
        <div
          className={s.profile}
          style={{ cursor: "pointer", position: "relative", zIndex: 50, display: "flex", alignItems: "center", gap: "10px" }}
          onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifMenuOpen(false); }}
        >
          <div className={s.who}>
            <div className={s.name}>{user?.name}</div>
            <div className={s.role}>{role}</div>
          </div>
          <div className={s.avatar} style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, backgroundColor: "var(--color-primary)" }}>
            {renderAvatarFace()}
          </div>
        </div>

        {userMenuOpen && (
          <div style={{
            position: "absolute", top: "45px", right: "0", minWidth: "220px",
            backgroundColor: "var(--color-surface, #fff)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)",
            zIndex: 100, overflow: "hidden", padding: "8px 0",
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", marginBottom: "4px" }}>
              <div style={{ fontWeight: "600", fontSize: "14px" }}>{user?.name}</div>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>{user?.email}</div>
            </div>

            <div onClick={() => { closeMenus(); navigate(`/${role}/profile`); }}
              style={menuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
              <User size={16} /> Profile
            </div>

            <div onClick={() => { closeMenus(); navigate(`/${role}/settings`); }}
              style={menuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
              <Settings size={16} /> Settings
            </div>

            <div style={{ height: "1px", backgroundColor: "var(--color-border)", margin: "4px 0" }}></div>

            <div onClick={handleLogout}
              style={{ ...menuItemStyle, color: "var(--color-danger)" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-danger-soft, #fee2e2)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
              <LogOut size={16} /> Log out
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

const menuItemStyle = {
  padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px",
  fontSize: "14px", cursor: "pointer", transition: "background 0.2s",
};