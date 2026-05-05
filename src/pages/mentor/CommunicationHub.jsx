import React, { useState } from "react";
import { Send } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import { conversations as seed, sessions } from "../../data/mentor.js";
import s from "./CommunicationHub.module.css";

function ChatView() {
  const [threads, setThreads] = useState(seed);
  const [activeId, setActiveId] = useState(seed[0].id);
  const [draft, setDraft] = useState("");
  const active = threads.find((t) => t.id === activeId);

  const send = () => {
    if (!draft.trim()) return;
    setThreads((ts) => ts.map((t) => t.id === activeId ? {
      ...t,
      messages: [...t.messages, { id: Date.now(), from: "me", text: draft, at: "now" }],
      last: draft,
    } : t));
    setDraft("");
  };

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
          />
          <button onClick={send} aria-label="Send"
            style={{ background: "var(--color-primary)", color: "#fff", border: "none", padding: "0 14px", borderRadius: 10 }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarView() {
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
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  return (
    <div className={s.cal}>
      <div className={s.calHead}>
        <div className={s.calMonth}>{monthName} {year}</div>
        <div style={{ color: "var(--color-muted)", fontSize: 13 }}>{sessions.length} sessions scheduled</div>
      </div>
      <div className={s.weekdays}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className={s.weekday}>{d}</div>)}
      </div>
      <div className={s.grid}>
        {cells.map((d, i) => (
          <div key={i} className={`${s.day} ${d === today.getDate() ? s.dayToday : ""}`}>
            {d && <>
              <div className={s.dayNum}>{d}</div>
              {(eventsBy[d] || []).map((e) => (
                <div key={e.id} className={s.event}>{e.time} · {e.title}</div>
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
  return (
    <Page>
      <PageHead title="Communication Hub" subtitle="Chat with mentees and manage your schedule." />
      <div>
        <div className={s.tabs}>
          <button className={`${s.tab} ${tab === "chat" ? s.tabActive : ""}`} onClick={() => setTab("chat")}>Messages</button>
          <button className={`${s.tab} ${tab === "cal" ? s.tabActive : ""}`} onClick={() => setTab("cal")}>Calendar</button>
        </div>
        {tab === "chat" ? <ChatView /> : <CalendarView />}
      </div>
    </Page>
  );
}
