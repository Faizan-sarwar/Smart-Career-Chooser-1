// src/pages/mentor/CommunicationHub.jsx
import React, { useState, useEffect } from "react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import ChatLayout from "../../components/chat/ChatLayout.jsx";
import api from "../../lib/axios.js";
import s from "./CommunicationHub.module.css";

// Keeps your existing Calendar UI unchanged
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
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api.get("/mentor/sessions")
      .then(res => setSessions(res.data))
      .catch(() => { });
  }, []);

  return (
    <Page>
      <PageHead title="Communication Hub" subtitle="Chat securely with mentees and check your schedule." />
      <div>
        <div className={s.tabs} style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--color-border)' }}>
          <button style={{ background: 'none', border: 'none', borderBottom: tab === 'chat' ? '2px solid var(--color-primary)' : '2px solid transparent', padding: '12px 16px', color: tab === 'chat' ? 'var(--color-primary)' : 'var(--color-muted)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setTab("chat")}>Messages</button>
          <button style={{ background: 'none', border: 'none', borderBottom: tab === 'cal' ? '2px solid var(--color-primary)' : '2px solid transparent', padding: '12px 16px', color: tab === 'cal' ? 'var(--color-primary)' : 'var(--color-muted)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setTab("cal")}>Calendar</button>
        </div>

        {tab === "chat" ? <ChatLayout /> : <CalendarView sessions={sessions} />}
      </div>
    </Page>
  );
}