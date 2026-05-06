// src/pages/student/StudentMessages.jsx
//
// Real-time chat with the Student Body President.
// GET /messages/president returns the conversation thread + contact info.
// POST /messages/president sends a new message.

import React, { useEffect, useRef, useState } from "react";
import { Send, ShieldCheck, Lock, AlertCircle } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "./StudentMessages.module.css";

export default function StudentMessages() {
  const { user } = useAuth();
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    api
      .get("/messages/president")
      .then(({ data }) => {
        if (mounted) {
          setContact(data.contact);
          setMessages(data.messages || []);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err.response?.data?.message ||
            "Could not load messages. Try again."
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((m) => [
      ...m,
      { _id: tempId, text, from: "me", createdAt: now },
    ]);
    setDraft("");

    try {
      const { data } = await api.post("/messages/president", { text });
      // Replace temp with real
      setMessages((m) => m.map((msg) => (msg._id === tempId ? data : msg)));
    } catch (err) {
      // Mark as failed
      setMessages((m) =>
        m.map((msg) =>
          msg._id === tempId ? { ...msg, failed: true } : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Page>
      <PageHead
        title="Messages"
        subtitle="Direct line to your Student Body President."
      />

      <div className={s.notice}>
        <Lock size={14} />
        <span>
          For your safety, students can only message the <b>President</b>. Mentor
          sessions are scheduled via your assigned mentor.
        </span>
      </div>

      <div className={s.layout}>
        <aside className={s.sidebar}>
          <div className={s.sideTitle}>Allowed contacts</div>
          {contact ? (
            <div className={`${s.contact} ${s.contactActive}`}>
              <div className={s.avatar}>{contact.avatar || "🎓"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={s.contactName}>
                  {contact.name}
                  <ShieldCheck size={14} className={s.verified} />
                </div>
                <div className={s.contactRole}>{contact.title}</div>
              </div>
            </div>
          ) : (
            <div className={s.contactSkeleton} />
          )}
          <div className={s.lockedNote}>
            Other contacts are unavailable for direct messaging.
          </div>
        </aside>

        <section className={s.chat}>
          <header className={s.chatHead}>
            <div className={s.avatar}>{contact?.avatar || "🎓"}</div>
            <div>
              <div className={s.headName}>
                {contact?.name || "Student Body President"}
              </div>
              <div className={s.headSub}>
                {error
                  ? "Connection error"
                  : loading
                    ? "Connecting…"
                    : "Usually replies within a day"}
              </div>
            </div>
          </header>

          <div ref={listRef} className={s.list}>
            {loading ? (
              <div className={s.empty}>
                <div className={s.miniRing} />
              </div>
            ) : error ? (
              <div className={s.empty}>
                <AlertCircle size={28} color="var(--color-danger)" />
                <p style={{ marginTop: 12 }}>{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className={s.empty}>
                <div className={s.emptyEmoji}>👋</div>
                <p>Say hello to the President — share feedback, ideas, or questions.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m._id}
                  className={`${s.msg} ${m.from === "me" ? s.msgMe : s.msgThem
                    } ${m.failed ? s.msgFailed : ""}`}
                >
                  <div>{m.text}</div>
                  <div className={s.time}>
                    {m.createdAt}
                    {m.failed && " · failed to send"}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={s.composer}>
            <input
              placeholder={`Message ${contact?.name || "the President"}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={loading || !!error}
              autoComplete="off"
            />
            <button
              onClick={send}
              aria-label="Send"
              className={s.sendBtn}
              disabled={loading || sending || !draft.trim() || !!error}
            >
              <Send size={16} />
            </button>
          </div>
        </section>
      </div>
    </Page>
  );
}