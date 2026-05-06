// src/pages/student/NotificationsPage.jsx
import React, { useState, useEffect } from "react";
import { Bell, Check, MessageSquare, Sparkles, Calendar, Trophy, AlertCircle, Loader2 } from "lucide-react";
import { Page } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./NotificationsPage.module.css";

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "message", label: "Messages" },
  { key: "match", label: "Matches" },
  { key: "event", label: "Events" },
];

// Helper to map backend string types to React Icons and Colors
const getIconData = (type) => {
  switch (type) {
    case "match": return { Icon: Sparkles, color: "#52a447" };
    case "message": return { Icon: MessageSquare, color: "#1f6feb" };
    case "event": return { Icon: Calendar, color: "#d97706" };
    case "achievement": return { Icon: Trophy, color: "#a855f7" };
    default: return { Icon: Bell, color: "#64748b" };
  }
};

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch from database on load
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get("/notifications");
        setItems(data);
      } catch (err) {
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const visible = items.filter((n) =>
    tab === "all" ? true : tab === "unread" ? n.unread : n.type === tab
  );

  const markAll = async () => {
    // Optimistic UI update
    setItems((xs) => xs.map((x) => ({ ...x, unread: false })));
    try {
      await api.put("/notifications/read-all");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRead = async (id, currentStatus) => {
    // Optimistic UI update
    setItems((xs) => xs.map((x) => x._id === id ? { ...x, unread: !x.unread } : x));
    try {
      await api.put(`/notifications/${id}/read`, { unread: !currentStatus });
    } catch (err) {
      // Revert if failed
      setItems((xs) => xs.map((x) => x._id === id ? { ...x, unread: currentStatus } : x));
    }
  };

  const unreadCount = items.filter((x) => x.unread).length;

  return (
    <Page>
      <div className={s.head}>
        <div>
          <h2><Bell size={22} /> Notifications {unreadCount > 0 && <span className={s.badge}>{unreadCount}</span>}</h2>
          <p>Stay up to date with matches, messages, and events.</p>
        </div>
        <Button variant="ghost" onClick={markAll} disabled={unreadCount === 0}>
          <Check size={16} style={{ marginRight: 6 }} />Mark all read
        </Button>
      </div>

      <div className={s.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${s.tab} ${tab === t.key ? s.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className={s.empty}><Loader2 className="spin" size={24} /> Loading...</div>
        ) : error ? (
          <div className={s.empty}><AlertCircle size={24} color="var(--color-danger)" /> {error}</div>
        ) : visible.length === 0 ? (
          <div className={s.empty}>You're all caught up 🎉</div>
        ) : (
          <ul className={s.list}>
            {visible.map((n) => {
              const { Icon, color } = getIconData(n.type);
              return (
                <li key={n._id} className={`${s.item} ${n.unread ? s.unread : ""}`} onClick={() => toggleRead(n._id, n.unread)}>
                  <div className={s.iconWrap} style={{ background: `${color}1f`, color: color }}>
                    <Icon size={18} />
                  </div>
                  <div className={s.body}>
                    <div className={s.title}>{n.title}</div>
                    <div className={s.text}>{n.body}</div>
                  </div>
                  <div className={s.meta}>
                    <span className={s.time}>{new Date(n.createdAt).toLocaleDateString()}</span>
                    {n.unread && <span className={s.dot} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Page>
  );
}