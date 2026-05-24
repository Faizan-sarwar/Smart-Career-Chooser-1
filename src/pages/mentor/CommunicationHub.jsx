// src/pages/mentor/CommunicationHub.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, AlertCircle, RefreshCw, Paperclip, MoreVertical, Edit2, Trash2, X, Image as ImageIcon, CheckCheck } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./CommunicationHub.module.css";
import { useSocket } from "../../context/SocketContext.jsx";

function getStatusText(updatedAt) {
  if (!updatedAt) return "Offline";
  const diffMins = (new Date() - new Date(updatedAt)) / (1000 * 60);
  if (diffMins < 15) return "🟢 Active now";
  const d = new Date(updatedAt);
  const isToday = new Date().toDateString() === d.toDateString();
  if (isToday) return `Last active today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return `Last active ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

function ChatView() {
  const { socket, onlineUsers } = useSocket(); // 🚨 SOCKET INJECTED

  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { data } = await api.get("/messages/contacts");
        setContacts(data);
        if (data.length > 0) setActiveId(data[0]._id);
        else setLoading(false);
      } catch (err) { setLoading(false); }
    };
    fetchContacts();
  }, []);

  const fetchThread = useCallback(async () => {
    if (!activeId) return;
    try {
      const { data } = await api.get(`/messages/${activeId}`);
      setContact(data.contact);
      setMessages(data.messages);
      setLoading(false);
    } catch (err) { }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    setLoading(true); setMessages([]); setDraft(""); setMediaFile(null); setEditingMsg(null);
    fetchThread();
  }, [activeId, fetchThread]);

  // 🚨 REAL-TIME MESSAGE LISTENER 🚨
  useEffect(() => {
    if (!socket || !activeId) return;

    const handleNewMessage = (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, activeId]);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if ((!text && !mediaFile) || sending || !activeId) return;

    if (editingMsg) {
      setSending(true);
      try {
        await api.put(`/messages/${editingMsg._id}/edit`, { text });
        setMessages(m => m.map(msg => msg._id === editingMsg._id ? { ...msg, text, isEdited: true } : msg));
        setDraft(""); setEditingMsg(null);
      } catch (err) { alert("Failed to edit message"); }
      finally { setSending(false); }
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      if (text) formData.append("text", text);
      if (mediaFile) formData.append("media", mediaFile);

      const { data } = await api.post(`/messages/${activeId}`, formData);
      setMessages((m) => [...m, data]);
      setDraft(""); setMediaFile(null);
    } catch (err) { alert("Failed to send message"); }
    finally { setSending(false); }
  };

  const handleDelete = async (msgId) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    try {
      await api.delete(`/messages/${msgId}/delete`);
      setMessages(m => m.map(msg => msg._id === msgId ? { ...msg, isDeleted: true, text: "", mediaUrl: null } : msg));
    } catch (err) { alert("Failed to delete"); }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  if (contacts.length === 0 && !loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)' }}>No mentees in your network yet.</div>;

  return (
    <div className={s.chat} style={{ display: 'flex', height: '650px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>

      {/* Thread List Sidebar */}
      <div className={s.threadList} style={{ width: '300px', borderRight: '1px solid var(--color-border)', overflowY: 'auto', background: 'var(--color-bg)' }}>
        {contacts.map((c) => {
          const isOnline = onlineUsers.includes(c._id);
          return (
            <div key={c._id} onClick={() => setActiveId(c._id)} style={{ padding: '16px', display: 'flex', gap: '12px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', background: activeId === c._id ? 'var(--color-primary-faint)' : 'transparent', transition: 'background 0.2s' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                {c.avatar && c.avatar.length > 10 ? <img src={c.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.avatar || "👋")}
                {isOnline && <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, backgroundColor: 'var(--color-success)', borderRadius: '50%', border: '1px solid var(--color-surface)' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', textTransform: 'capitalize' }}>{c.role}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Messages Area */}
      {activeId && (
        <div className={s.messages} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div className={s.msgHeader} style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-surface)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', display: 'grid', placeItems: 'center', background: 'var(--color-bg)' }}>
              {contact?.avatar && contact.avatar.length > 10 ? <img src={contact.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (contact?.avatar || "👋")}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)' }}>{contact?.name || "Select a contact"}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                {onlineUsers.includes(activeId) ? (
                  <span style={{ color: "var(--color-success)", fontWeight: "600" }}>🟢 Active now</span>
                ) : (
                  loading ? "Connecting…" : getStatusText(contact?.updatedAt)
                )}
              </div>
            </div>
          </div>

          {/* Message List */}
          <div className={s.msgList} ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-bg)' }}>
            {messages.map((m) => (
              <MessageBubble key={m._id} message={m} onEdit={() => { setEditingMsg(m); setDraft(m.text); }} onDelete={() => handleDelete(m._id)} />
            ))}
          </div>

          {/* Composer */}
          <div style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            {editingMsg && (
              <div style={{ padding: '8px 16px', background: 'var(--color-primary-faint)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary-dark)' }}>
                <span>Editing message...</span>
                <X size={14} style={{ cursor: 'pointer' }} onClick={() => { setEditingMsg(null); setDraft(""); }} />
              </div>
            )}
            {mediaFile && (
              <div style={{ padding: '8px 16px', background: 'var(--color-surface)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={14} color="var(--color-primary)" /> {mediaFile.name}
                <X size={14} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setMediaFile(null)} />
              </div>
            )}
            <div className={s.composer} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={e => setMediaFile(e.target.files[0])} />
              <button onClick={() => fileInputRef.current?.click()} disabled={!!editingMsg} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: '8px' }}>
                <Paperclip size={20} />
              </button>
              <textarea
                placeholder={editingMsg ? "Edit message..." : "Type a message..."}
                value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={handleKeyDown} rows={1}
                style={{ flex: 1, resize: 'none', padding: '12px 16px', borderRadius: '24px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }}
              />
              <button onClick={handleSend} disabled={(!draft.trim() && !mediaFile) || sending} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', border: 'none', display: 'grid', placeItems: 'center', cursor: sending ? 'wait' : 'pointer', opacity: (!draft.trim() && !mediaFile) ? 0.5 : 1 }}>
                {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} style={{ transform: 'translateX(-1px)' }} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🚨 BUBBLE WITH 3-DOT MENU 🚨
function MessageBubble({ message, onEdit, onDelete }) {
  const m = message;
  const isMe = m.from === "me";
  const [showMenu, setShowMenu] = useState(false);

  if (m.isDeleted) {
    return (
      <div style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', opacity: 0.6, fontStyle: 'italic', fontSize: '13px', color: 'var(--color-muted)', padding: '8px 14px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        🚫 This message was deleted.
      </div>
    );
  }

  return (
    <div style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }} onMouseLeave={() => setShowMenu(false)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexDirection: isMe ? 'row-reverse' : 'row' }}>

        <div style={{ background: isMe ? 'var(--color-primary)' : 'var(--color-surface)', color: isMe ? 'white' : 'var(--color-text)', padding: '12px 16px', borderRadius: '16px', borderBottomRightRadius: isMe ? '4px' : '16px', borderBottomLeftRadius: isMe ? '16px' : '4px', border: isMe ? 'none' : '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          {m.mediaUrl && (
            <div style={{ marginBottom: m.text ? '8px' : '0', borderRadius: '8px', overflow: 'hidden', maxWidth: '250px' }}>
              {m.mediaType === 'video' ? <video src={`http://localhost:5000/${m.mediaUrl}`} controls style={{ width: '100%' }} /> : <img src={`http://localhost:5000/${m.mediaUrl}`} alt="Attachment" style={{ width: '100%', display: 'block' }} />}
            </div>
          )}
          {m.text && <div style={{ fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' }}>{m.text}</div>}
        </div>

        {isMe && !m.pending && (
          <div style={{ position: 'relative', alignSelf: 'center' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: '4px' }}>
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div style={{ position: 'absolute', right: '100%', top: '0', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', zIndex: 10, padding: '4px', minWidth: '100px', marginRight: '8px' }}>
                {!m.mediaUrl && (
                  <button onClick={() => { setShowMenu(false); onEdit(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--color-text)', borderRadius: '4px' }}>
                    <Edit2 size={12} /> Edit
                  </button>
                )}
                <button onClick={() => { setShowMenu(false); onDelete(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--color-danger)', borderRadius: '4px' }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '11px', color: 'var(--color-muted)' }}>
        <span>{m.createdAt}</span>
        {m.isEdited && <span>(edited)</span>}
        {isMe && !m.pending && <CheckCheck size={12} color={m.read ? "var(--color-primary)" : "var(--color-muted)"} />}
      </div>
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
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    api.get("/mentor/sessions").then(res => {
      setSessions(res.data);
      setSessionsLoading(false);
    }).catch(() => setSessionsLoading(false));
  }, []);

  return (
    <Page>
      <PageHead title="Communication Hub" subtitle="Chat securely with mentees and check your schedule." />
      <div>
        <div className={s.tabs} style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--color-border)' }}>
          <button style={{ background: 'none', border: 'none', borderBottom: tab === 'chat' ? '2px solid var(--color-primary)' : '2px solid transparent', padding: '12px 16px', color: tab === 'chat' ? 'var(--color-primary)' : 'var(--color-muted)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setTab("chat")}>Messages</button>
          <button style={{ background: 'none', border: 'none', borderBottom: tab === 'cal' ? '2px solid var(--color-primary)' : '2px solid transparent', padding: '12px 16px', color: tab === 'cal' ? 'var(--color-primary)' : 'var(--color-muted)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setTab("cal")}>Calendar</button>
        </div>

        {tab === "chat" ? <ChatView /> : <CalendarView sessions={sessions} />}
      </div>
    </Page>
  );
}