// src/pages/student/StudentMessages.jsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Send, ShieldCheck, AlertCircle, RotateCw, CheckCheck, Users } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "./StudentMessages.module.css";

const POLL_INTERVAL_MS = 8000;

export default function StudentMessages() {
  const { user } = useAuth();

  // NEW: State to hold all real database users
  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState(null);

  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [retryingId, setRetryingId] = useState(null);

  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const pollTimerRef = useRef(null);
  const initialLoadRef = useRef(true);

  // 1. Fetch all real users on page load
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { data } = await api.get("/messages/contacts");
        setContacts(data);
        // Automatically select the first user if they exist
        if (data.length > 0) {
          setActiveContactId(data[0]._id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError("Failed to load contacts.");
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  // 2. Fetch the specific chat thread for the selected user
  const fetchThread = useCallback(async ({ silent = false } = {}) => {
    if (!activeContactId) return;

    try {
      const { data } = await api.get(`/messages/${activeContactId}`);
      setContact(data.contact);
      setMessages((prev) => {
        const tempMessages = prev.filter((m) => String(m._id).startsWith("temp-"));
        return [...data.messages, ...tempMessages];
      });
      if (!silent) setError("");
    } catch (err) {
      if (!silent) setError("Could not load messages.");
    } finally {
      if (initialLoadRef.current) {
        setLoading(false);
        initialLoadRef.current = false;
      }
    }
  }, [activeContactId]);

  // 3. Polling lifecycle (resets when you switch users)
  useEffect(() => {
    if (!activeContactId) return;

    initialLoadRef.current = true;
    setLoading(true);
    setMessages([]);
    fetchThread();

    const startPolling = () => {
      if (pollTimerRef.current) return;
      pollTimerRef.current = setInterval(() => fetchThread({ silent: true }), POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) stopPolling();
      else {
        fetchThread({ silent: true });
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [activeContactId, fetchThread]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 80;
  };

  useEffect(() => {
    if (!listRef.current) return;
    if (isAtBottomRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending || !activeContactId) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const nowDate = new Date();
    const optimistic = {
      _id: tempId,
      text,
      from: "me",
      createdAt: formatTime(nowDate),
      createdAtISO: nowDate.toISOString(),
      pending: true,
    };

    setMessages((m) => [...m, optimistic]);
    setDraft("");
    isAtBottomRef.current = true;

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const { data } = await api.post(`/messages/${activeContactId}`, { text });
      setMessages((m) => m.map((msg) => (msg._id === tempId ? data : msg)));
    } catch (err) {
      setMessages((m) =>
        m.map((msg) => (msg._id === tempId ? { ...msg, failed: true, pending: false } : msg))
      );
    } finally {
      setSending(false);
    }
  };

  const retry = async (failedMsg) => {
    setRetryingId(failedMsg._id);
    try {
      const { data } = await api.post(`/messages/${activeContactId}`, { text: failedMsg.text });
      setMessages((m) => m.map((msg) => (msg._id === failedMsg._id ? data : msg)));
    } catch (err) { }
    finally { setRetryingId(null); }
  };

  const handleDraftChange = (e) => {
    setDraft(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const canSend = !loading && !sending && !error && draft.trim().length > 0 && activeContactId;
  const groupedMessages = groupByDay(messages);

  return (
    <Page>
      <PageHead
        title="Messages"
        subtitle="Connect with mentors and peers in your network."
      />

      <div className={s.notice}>
        <Users size={14} />
        <span>Select a user from your allowed contacts to start chatting securely.</span>
      </div>

      <div className={s.layout}>
        {/* DYNAMIC SIDEBAR LISTING REAL DB USERS */}
        <aside className={s.sidebar}>
          <div className={s.sideTitle}>Allowed contacts</div>
          {contacts.length === 0 && !loading ? (
            <div className={s.lockedNote}>No other users registered yet.</div>
          ) : (
            contacts.map((c) => (
              <div
                key={c._id}
                onClick={() => setActiveContactId(c._id)}
                className={`${s.contact} ${activeContactId === c._id ? s.contactActive : ""}`}
                style={{ cursor: 'pointer' }}
              >
                <div className={s.avatar} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c.avatar && c.avatar.length > 10 ? (
                    <img src={c.avatar} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    c.avatar || "👋"
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={s.contactName}>
                    {c.name}
                    {c.role === 'mentor' && <ShieldCheck size={14} className={s.verified} />}
                  </div>
                  <div className={s.contactRole} style={{ textTransform: 'capitalize' }}>
                    {c.role}
                  </div>
                </div>
              </div>
            ))
          )}
        </aside>

        {/* CHAT WINDOW */}
        <section className={s.chat}>
          <header className={s.chatHead}>
            <div className={s.avatar}>{contact?.avatar || "👋"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={s.headName}>{contact?.name || "Select a contact"}</div>
              <div className={s.headSub}>
                {error ? "Connection error" : loading ? "Connecting…" : "Active now"}
              </div>
            </div>
          </header>

          <div ref={listRef} className={s.list} onScroll={handleScroll}>
            {loading ? (
              <div className={s.empty}><div className={s.miniRing} /></div>
            ) : error ? (
              <div className={s.empty}>
                <AlertCircle size={28} color="var(--color-danger)" />
                <p style={{ marginTop: 12 }}>{error}</p>
                <button className={s.retryFetchBtn} onClick={() => fetchThread()}>
                  <RotateCw size={14} /> Retry
                </button>
              </div>
            ) : !activeContactId ? (
              <div className={s.empty}>
                <div className={s.emptyEmoji}>👋</div>
                <p>Select a contact from the left to start messaging.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className={s.empty}>
                <div className={s.emptyEmoji}>👋</div>
                <p>Say hello to {contact?.name}!</p>
              </div>
            ) : (
              groupedMessages.map((group) => (
                <React.Fragment key={group.label}>
                  <div className={s.daySep}><span>{group.label}</span></div>
                  {group.items.map((m) => (
                    <MessageBubble
                      key={m._id}
                      message={m}
                      onRetry={() => retry(m)}
                      retrying={retryingId === m._id}
                    />
                  ))}
                </React.Fragment>
              ))
            )}
          </div>

          <div className={s.composer}>
            <textarea
              ref={textareaRef}
              placeholder={`Message ${contact?.name || "..."}`}
              value={draft}
              onChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              disabled={loading || !!error || !activeContactId}
              autoComplete="off"
              rows={1}
            />
            <button onClick={send} className={s.sendBtn} disabled={!canSend}>
              <Send size={16} />
            </button>
          </div>
        </section>
      </div>
    </Page>
  );
}

function MessageBubble({ message, onRetry, retrying }) {
  const m = message;
  const isMe = m.from === "me";

  return (
    <div className={`${s.msg} ${isMe ? s.msgMe : s.msgThem} ${m.failed ? s.msgFailed : ""} ${m.pending ? s.msgPending : ""}`}>
      <div className={s.msgText}>{m.text}</div>
      <div className={s.msgFoot}>
        <span className={s.time}>{m.createdAt} {m.failed && " · failed"}</span>
        {isMe && !m.failed && !m.pending && (
          <CheckCheck size={12} className={`${s.readMark} ${m.read ? s.readMarkSeen : ""}`} />
        )}
        {m.failed && (
          <button className={s.retryBtn} onClick={onRetry} disabled={retrying}>
            <RotateCw size={11} className={retrying ? s.spin : ""} /> Retry
          </button>
        )}
      </div>
    </div>
  );
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function groupByDay(messages) {
  if (!messages.length) return [];
  const groups = [];
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const m of messages) {
    const d = m.createdAtISO ? new Date(m.createdAtISO) : new Date();
    const day = startOfDay(d);
    let label;
    if (day.getTime() === today.getTime()) label = "Today";
    else if (day.getTime() === yesterday.getTime()) label = "Yesterday";
    else label = d.toLocaleDateString("en-PK", { weekday: "long", month: "short", day: "numeric" });

    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(m);
    else groups.push({ label, items: [m] });
  }
  return groups;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}