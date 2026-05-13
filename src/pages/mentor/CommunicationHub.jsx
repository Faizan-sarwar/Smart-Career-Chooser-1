// src/pages/mentor/CommunicationHub.jsx
import React, { useState, useEffect } from "react";
import { Send, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./CommunicationHub.module.css";

function ChatView({ threads, setThreads }) {
  const [activeId, setActiveId] = useState(threads[0]?.id || null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const active = threads.find((t) => t.id === activeId);

  const send = async () => {
    if (!draft.trim() || !activeId) return;
    setSending(true);
    try {
      const { data } = await api.post(`/mentor/messages/${activeId}/send`, { text: draft });
      // Update local state instantly
      setThreads((ts) => ts.map((t) => t.id === activeId ? {
        ...t,
        messages: [...t.messages, data.message],
        last: draft,
      } : t));
      setDraft("");
    } catch (err) {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (threads.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)' }}>No messages yet.</div>;

  return (
    <div className={s.chat}>
      <div className={s.threadList}>
        {threads.map((t) => (
          <div key={t.id} className={`${s.thread} ${t.id === activeId ? s.threadActive : ""}`} onClick={() => setActiveId(t.id)}>
            <div className={s.threadName}>
              <span>{t.with}</span>
              {t.unread > 0 && <span className={s.unread}>{t.unread}</span>}
            </div>
            <div className={s.threadLast}>{t.last}</div>
          </div>
        ))}
      </div>
      {active && (
        <div className={s.messages}>
          <div className={s.msgHeader}>{active.with}</div>
          <div className={s.msgList}>
            {active.messages.map((m) => (
              <div key={m.id} className={`${s.msg} ${m.from === "me" ? s.msgMe : s.msgThem}`}>
                {m.text}
                <div className={s.msgTime}>{m.at}</div>
              </div>
            ))}
          </div>
          <div className={s.composer}>
            <input
              placeholder="Write a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={sending}
            />
            <button onClick={send} disabled={sending} aria-label="Send"
              style={{ background: "var(--color-primary)", color: "#fff", border: "none", padding: "0 14px", borderRadius: 10, cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.7 : 1 }}>
              {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarView({ sessions }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthName = today.toLocaleString("default", { month: "long" });
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const eventsBy = sessions.reduce((acc, e) => {
    // Assuming backend returns 'when' as ISO string, extract YYYY-MM-DD
    const dateStr = new Date(e.when).toISOString().split('T')[0];
    const dayInt = new Date(e.when).getDate();
    (acc[dayInt] = acc[dayInt] || []).push(e);
    return acc;
  }, {});

  return (
    <div className={s.cal}>
      <div className={s.calHead}>
        <div className={s.calMonth}>{monthName} {year}</div>
        <div style={{ color: "var(--color-muted)", fontSize: 13 }}>{sessions.length} sessions scheduled this month</div>
      </div>
      <div className={s.weekdays}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className={s.weekday}>{d}</div>)}
      </div>
      <div className={s.grid}>
        {cells.map((d, i) => (
          <div key={i} className={`${s.day} ${d === today.getDate() ? s.dayToday : ""}`}>
            {d && <>
              <div className={s.dayNum}>{d}</div>
              {(eventsBy[d] || []).map((e) => (
                <div key={e.id} className={s.event}>
                  {new Date(e.when).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {e.title}
                </div>
              ))}
            </>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CommunicationHub() {
  const [tab, setTab] = useState("chat");
  const [threads, setThreads] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      // Fetch both threads and sessions in parallel
      const [threadsRes, sessionsRes] = await Promise.all([
        api.get("/mentor/messages/threads"),
        api.get("/mentor/sessions")
      ]);
      setThreads(threadsRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load communications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Page><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--color-muted)' }}><Loader2 className="spin" size={40} style={{ marginBottom: 16, color: 'var(--color-primary)' }} /> Loading Hub...</div></Page>;
  if (error) return <Page><div style={{ textAlign: 'center', padding: '50px', color: 'var(--color-danger)' }}><AlertCircle size={32} /><h3>Error</h3><p>{error}</p><Button onClick={fetchData}><RefreshCw size={14} /> Retry</Button></div></Page>;

  return (
    <Page>
      <PageHead title="Communication Hub" subtitle="Chat with mentees and manage your schedule." />
      <div>
        <div className={s.tabs}>
          <button className={`${s.tab} ${tab === "chat" ? s.tabActive : ""}`} onClick={() => setTab("chat")}>Messages</button>
          <button className={`${s.tab} ${tab === "cal" ? s.tabActive : ""}`} onClick={() => setTab("cal")}>Calendar</button>
        </div>
        {tab === "chat" ? <ChatView threads={threads} setThreads={setThreads} /> : <CalendarView sessions={sessions} />}
      </div>
    </Page>
  );
}