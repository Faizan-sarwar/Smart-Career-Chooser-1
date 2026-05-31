// src/components/chat/ConnectPicker.jsx
//
// Modal triggered by the "+" button on the Messages page. Shows the
// opposite role's users (students see mentors; mentors see students).
// Privacy: only name, role, university, avatar. No email/phone/location.

import React, { useState, useEffect, useMemo } from "react";
import {
  X, Search, Send, Check, Clock, GraduationCap, Compass,
  UserPlus, AlertCircle, Loader2, Mail, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";

export default function ConnectPicker({ onClose, onSent }) {
  const { user } = useAuth();
  const myRole = (user?.role || "").toLowerCase();
  const oppositeRole = myRole === "student" ? "mentor" : "student";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [intro, setIntro] = useState("");
  const [sending, setSending] = useState(false);
  const [successId, setSuccessId] = useState(null);

  // Debounced fetch
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const fetchUsers = async (search = "") => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/connections/browse", {
        params: { q: search, role: oppositeRole },
      });
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Group: connectable first, then pending, then accepted, then rejected
  const sortedUsers = useMemo(() => {
    const order = {
      none: 0,
      pending_recv: 1,
      pending_sent: 2,
      accepted: 3,
      rejected_sent: 4,
      rejected_recv: 4,
    };
    return [...users].sort((a, b) => {
      return (order[a.connectionStatus] ?? 99) - (order[b.connectionStatus] ?? 99);
    });
  }, [users]);

  const handleSend = async () => {
    if (!selectedUser) return;
    setSending(true);
    try {
      await api.post("/connections/request", {
        targetId: selectedUser.id,
        intro: intro.trim(),
      });
      setSuccessId(selectedUser.id);
      // Update the user's status in-list
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, connectionStatus: "pending_sent" } : u
        )
      );
      setSelectedUser(null);
      setIntro("");
      if (onSent) onSent();
      setTimeout(() => setSuccessId(null), 2500);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  const RoleIcon = oppositeRole === "mentor" ? Compass : GraduationCap;

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (selectedUser) setSelectedUser(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedUser, onClose]);

  return (
    <div style={scrimStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={iconBadgeStyle}>
              <UserPlus size={20} />
            </div>
            <div>
              <h2 style={titleStyle}>
                Find {oppositeRole === "mentor" ? "a mentor" : "a student"}
              </h2>
              <p style={subtitleStyle}>
                Browse {oppositeRole}s and send a connection request to start chatting.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Privacy notice */}
        <div style={privacyNoticeStyle}>
          <ShieldCheck size={13} />
          <span>
            Only public profile details are shown. Personal contact info is hidden.
          </span>
        </div>

        {/* Search */}
        <div style={searchWrapStyle}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search by name or university…`}
            style={searchInputStyle}
            autoFocus
          />
        </div>

        {/* User list */}
        <div style={listStyle}>
          {loading ? (
            <div style={loadingBoxStyle}>
              <Loader2 size={24} className="spin" />
              <span>Loading {oppositeRole}s…</span>
            </div>
          ) : error ? (
            <div style={errorBoxStyle}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div style={emptyBoxStyle}>
              <RoleIcon size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
              <strong>No {oppositeRole}s found</strong>
              <span style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 4 }}>
                {q ? "Try a different search." : "Check back later."}
              </span>
            </div>
          ) : (
            sortedUsers.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onClick={() => {
                  if (u.connectionStatus === "none") setSelectedUser(u);
                }}
                justSent={successId === u.id}
              />
            ))
          )}
        </div>

      </div>

      {/* Connect modal (second layer) */}
      {selectedUser && (
        <div style={{ ...scrimStyle, zIndex: 110 }} onClick={() => setSelectedUser(null)}>
          <div style={{ ...modalStyle, maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>

            <div style={headerStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <UserAvatar user={selectedUser} size={48} />
                <div>
                  <h2 style={{ ...titleStyle, fontSize: 18 }}>{selectedUser.name}</h2>
                  <p style={subtitleStyle}>
                    {selectedUser.role}{selectedUser.university ? ` · ${selectedUser.university}` : ""}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={closeBtnStyle} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, marginTop: 4 }}>
              Add a short intro (optional)
            </label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value.slice(0, 600))}
              placeholder={
                myRole === "student"
                  ? "Hi! I'm interested in your career path and would love to connect."
                  : "Hi! I'd be happy to share guidance if you're looking for mentorship."
              }
              rows={4}
              style={textareaStyle}
            />
            <div style={charCountStyle}>{intro.length} / 600</div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
              <button onClick={() => setSelectedUser(null)} style={secondaryBtnStyle} disabled={sending}>
                Cancel
              </button>
              <button onClick={handleSend} style={primaryBtnStyle} disabled={sending}>
                {sending ? (
                  <><Loader2 size={14} className="spin" /> Sending…</>
                ) : (
                  <><Send size={14} /> Send request</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ── User row component ───────────────────────────────────────────────
function UserRow({ user, onClick, justSent }) {
  const status = user.connectionStatus;
  const isConnectable = status === "none";

  return (
    <div
      onClick={onClick}
      style={{
        ...rowStyle,
        cursor: isConnectable ? "pointer" : "default",
        opacity: isConnectable ? 1 : 0.85,
      }}
      onMouseEnter={(e) => { if (isConnectable) e.currentTarget.style.background = "var(--color-primary-faint, rgba(13,148,136,0.06))"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <UserAvatar user={user} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>
          {user.name}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
          {user.role}{user.university ? ` · ${user.university}` : ""}
        </div>
      </div>
      <StatusButton status={status} justSent={justSent} />
    </div>
  );
}

// ── Avatar with referrerPolicy ───────────────────────────────────────
function UserAvatar({ user, size = 40 }) {
  const [broken, setBroken] = useState(false);
  const initials = (user.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const hasAvatar = !!user.avatar && /^https?:\/\//.test(user.avatar) && !broken;

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
      color: "white", display: "grid", placeItems: "center",
      fontWeight: 700, fontSize: size * 0.4, flexShrink: 0, overflow: "hidden",
    }}>
      {hasAvatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : initials}
    </div>
  );
}

// ── Per-status button/badge ──────────────────────────────────────────
function StatusButton({ status, justSent }) {
  if (justSent) {
    return (
      <span style={{ ...badgeStyle, background: "var(--color-success-soft, #dcfce7)", color: "var(--color-success, #16a34a)" }}>
        <Check size={11} /> Sent!
      </span>
    );
  }
  switch (status) {
    case "accepted":
      return (
        <span style={{ ...badgeStyle, background: "var(--color-success-soft, #dcfce7)", color: "var(--color-success, #16a34a)" }}>
          <Check size={11} /> Connected
        </span>
      );
    case "pending_sent":
      return (
        <span style={{ ...badgeStyle, background: "var(--color-warning-soft, #fef3c7)", color: "#854d0e" }}>
          <Clock size={11} /> Sent
        </span>
      );
    case "pending_recv":
      return (
        <span style={{ ...badgeStyle, background: "var(--color-accent-soft, #ffedd5)", color: "var(--color-accent, #f97316)" }}>
          <Mail size={11} /> Review in requests
        </span>
      );
    case "rejected_sent":
      return (
        <span style={{ ...badgeStyle, background: "var(--color-bg)", color: "var(--color-muted)" }}>
          Declined
        </span>
      );
    case "rejected_recv":
      return (
        <span style={{ ...badgeStyle, background: "var(--color-bg)", color: "var(--color-muted)" }}>
          Passed
        </span>
      );
    default:
      return (
        <button style={{ ...primaryBtnStyle, padding: "6px 12px", fontSize: 12 }}>
          <UserPlus size={12} /> Connect
        </button>
      );
  }
}

// ── Styles ───────────────────────────────────────────────────────────
const scrimStyle = {
  position: "fixed", inset: 0,
  background: "rgba(28,25,23,0.55)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "grid", placeItems: "center",
  zIndex: 100, padding: 20,
};
const modalStyle = {
  background: "var(--color-surface, #fff)",
  borderRadius: "var(--radius-lg, 16px)",
  padding: 24,
  width: "100%", maxWidth: 600, maxHeight: "85vh",
  display: "flex", flexDirection: "column", gap: 14,
  boxShadow: "0 24px 64px -12px rgba(0,0,0,0.3)",
  animation: "ccPop 0.25s ease",
};
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 };
const iconBadgeStyle = {
  width: 44, height: 44, borderRadius: 12,
  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
  color: "white", display: "grid", placeItems: "center",
  boxShadow: "0 4px 12px -3px rgba(13,148,136,0.4)",
};
const titleStyle = { fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: "var(--color-text)" };
const subtitleStyle = { margin: "4px 0 0", fontSize: 13, color: "var(--color-muted)", lineHeight: 1.5 };
const closeBtnStyle = {
  background: "var(--color-bg)", border: "1px solid var(--color-border)",
  borderRadius: "50%", width: 32, height: 32,
  cursor: "pointer", display: "grid", placeItems: "center",
  color: "var(--color-text-soft, var(--color-muted))",
  flexShrink: 0,
};
const privacyNoticeStyle = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "8px 12px", background: "var(--color-primary-faint, rgba(13,148,136,0.06))",
  border: "1px solid var(--color-primary-soft)",
  borderRadius: "var(--radius-sm, 8px)",
  fontSize: 12, color: "var(--color-primary-darker, var(--color-primary))",
};
const searchWrapStyle = { position: "relative" };
const searchInputStyle = {
  width: "100%", padding: "11px 14px 11px 40px",
  border: "1.5px solid var(--color-border)",
  borderRadius: "var(--radius, 10px)",
  fontSize: 14, fontFamily: "inherit",
  background: "var(--color-surface)", color: "var(--color-text)",
  outline: "none",
};
const listStyle = {
  flex: 1, overflowY: "auto",
  display: "flex", flexDirection: "column", gap: 4,
  marginRight: -8, paddingRight: 8,
};
const rowStyle = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "10px 12px", borderRadius: "var(--radius-sm, 8px)",
  transition: "background 0.15s ease",
  border: "1px solid transparent",
};
const loadingBoxStyle = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
  padding: "40px 20px", color: "var(--color-muted)", fontSize: 13,
};
const errorBoxStyle = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "16px", borderRadius: "var(--radius-sm)",
  background: "var(--color-danger-soft, #fee2e2)", color: "var(--color-danger)",
  fontSize: 13,
};
const emptyBoxStyle = {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: "40px 20px", textAlign: "center",
  color: "var(--color-text-soft, var(--color-muted))",
};
const textareaStyle = {
  width: "100%", padding: "11px 14px",
  border: "1.5px solid var(--color-border)",
  borderRadius: "var(--radius, 10px)",
  fontSize: 14, fontFamily: "inherit",
  background: "var(--color-surface)", color: "var(--color-text)",
  outline: "none", resize: "vertical", minHeight: 80, lineHeight: 1.55,
};
const charCountStyle = {
  fontSize: 11, color: "var(--color-muted)",
  textAlign: "right", marginTop: 4,
  fontVariantNumeric: "tabular-nums",
};
const primaryBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 16px",
  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
  color: "white", border: "none",
  borderRadius: "var(--radius-sm, 8px)",
  fontSize: 13, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit",
};
const secondaryBtnStyle = {
  padding: "9px 16px",
  background: "var(--color-surface)", color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm, 8px)",
  fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit",
};
const badgeStyle = {
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "4px 10px", borderRadius: 999,
  fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
};