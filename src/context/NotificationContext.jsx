// src/context/NotificationContext.jsx
//
// App-level notification state. Mounted ONCE at the root (above the
// router), so polling continues across all route changes — no more
// "Welcome" reappearing on every nav.
//
// Consumers:
//   const { notifications, unreadCount, markAsRead, markAllRead, refresh } = useNotifications();

import React, {
  createContext, useContext, useState, useEffect, useRef, useCallback,
} from "react";
import api from "../lib/axios.js";
import { useAuth } from "./AuthContext.jsx";

const POLL_MS = 15000;

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAllRead: async () => {},
  refresh: async () => {},
});

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollTimer = useRef(null);
  const mountedRef = useRef(true);

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [listRes, countRes] = await Promise.all([
        api.get("/notifications?limit=30"),
        api.get("/notifications/unread-count"),
      ]);
      if (!mountedRef.current) return;
      setNotifications(listRes.data || []);
      setUnreadCount(countRes.data?.count || 0);
    } catch (err) {
      console.warn("[NotificationContext] fetch failed:", err.message);
    }
  }, [user]);

  // ── Initial load ──────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    fetchAll().finally(() => mountedRef.current && setLoading(false));

    return () => { mountedRef.current = false; };
  }, [user, fetchAll]);

  // ── Polling (pauses when tab hidden) ──────────────────────────────
  useEffect(() => {
    if (!user) return;

    const start = () => {
      if (pollTimer.current) return;
      pollTimer.current = setInterval(fetchAll, POLL_MS);
    };
    const stop = () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
    const onVis = () => {
      if (document.hidden) {
        stop();
      } else {
        fetchAll();
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user, fetchAll]);

  // ── Actions ───────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    // Optimistic
    setNotifications((ns) =>
      ns.map((n) => (n._id === id ? { ...n, unread: false, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await api.put(`/notifications/${id}/read`, { unread: false });
    } catch {
      fetchAll(); // resync on failure
    }
  }, [fetchAll]);

  const markAllRead = useCallback(async () => {
    setNotifications((ns) => ns.map((n) => ({ ...n, unread: false, read: true })));
    setUnreadCount(0);
    try {
      await api.put("/notifications/read-all");
    } catch {
      fetchAll();
    }
  }, [fetchAll]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllRead, refresh: fetchAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}