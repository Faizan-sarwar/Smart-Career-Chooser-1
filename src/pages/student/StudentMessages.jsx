// src/pages/student/StudentMessages.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Send, ShieldCheck, AlertCircle, RotateCw, CheckCheck, Users, Paperclip, MoreVertical, Edit2, Trash2, X, Image as ImageIcon } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "./StudentMessages.module.css";
import { useSocket } from "../../context/SocketContext.jsx";

export default function StudentMessages() {
  const { user } = useAuth();

  // 🚨 WEB SOCKETS 🚨
  const { socket, onlineUsers } = useSocket();

  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState(null);
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const initialLoadRef = useRef(true);

  // 1. Fetch Contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { data } = await api.get("/messages/contacts");
        setContacts(data);
        if (data.length > 0) setActiveContactId(data[0]._id);
        else setLoading(false);
      } catch (err) {
        setError("Failed to load contacts.");
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  // 2. Fetch Thread
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
    } catch (err) { if (!silent) setError("Could not load messages."); }
    finally { if (initialLoadRef.current) { setLoading(false); initialLoadRef.current = false; } }
  }, [activeContactId]);

  // 3. Load thread on contact change
  useEffect(() => {
    if (!activeContactId) return;
    initialLoadRef.current = true; setLoading(true); setMessages([]); setDraft(""); setMediaFile(null); setEditingMsg(null);
    fetchThread();
    // 🚨 Polling removed! WebSockets handle new messages now.
  }, [activeContactId, fetchThread]);

  // 4. Real-time Message Listener
  useEffect(() => {
    if (!socket || !activeContactId) return;

    const handleNewMessage = (newMessage) => {
      // Append the incoming message to the chat
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, activeContactId]);

  // 5. Auto-scroll
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if ((!text && !mediaFile) || sending || !activeContactId) return;

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

      const { data } = await api.post(`/messages/${activeContactId}`, formData);
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

  return (
    <Page>
      <PageHead title="Messages" subtitle="Connect securely with your network." />
      <div className={s.layout}>
        {/* SIDEBAR */}
        <aside className={s.sidebar}>
          <div className={s.sideTitle}>Contacts</div>
          {contacts.map((c) => {
            const isOnline = onlineUsers.includes(c._id);
            return (
              <div key={c._id} onClick={() => setActiveContactId(c._id)} className={`${s.contact} ${activeContactId === c._id ? s.contactActive : ""}`}>
                <div className={s.avatar} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {c.avatar && c.avatar.length > 10 ? <img src={c.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.avatar || "👋")}
                  {isOnline && <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, backgroundColor: 'var(--color-success)', borderRadius: '50%', border: '2px solid var(--color-surface)' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div className={s.contactName}>{c.name}</div>
                  <div className={s.contactRole}>{c.role}</div>
                </div>
              </div>
            );
          })}
        </aside>

        {/* CHAT WINDOW */}
        <section className={s.chat}>
          <header className={s.chatHead}>
            <div className={s.avatar} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {contact?.avatar && contact.avatar.length > 10 ? <img src={contact.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (contact?.avatar || "👋")}
            </div>
            <div>
              <div className={s.headName}>{contact?.name || "Select a contact"}</div>
              <div className={s.headSub}>
                {/* 🚨 WEBSOCKET STATUS 🚨 */}
                {error ? "Connection error" : loading ? "Connecting…" : (
                  onlineUsers.includes(activeContactId) ? (
                    <span style={{ color: "var(--color-success)", fontWeight: "600" }}>🟢 Active now</span>
                  ) : (
                    getStatusText(contact?.updatedAt)
                  )
                )}
              </div>
            </div>
          </header>

          <div ref={listRef} className={s.list}>
            {messages.map((m) => (
              <MessageBubble
                key={m._id}
                message={m}
                onEdit={() => { setEditingMsg(m); setDraft(m.text); }}
                onDelete={() => handleDelete(m._id)}
              />
            ))}
          </div>

          <div className={s.composerArea}>
            {editingMsg && (
              <div style={{ padding: '8px 16px', background: 'var(--color-primary-faint)', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
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

            <div className={s.composer}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={e => setMediaFile(e.target.files[0])} />

              <button className={s.attachBtn} onClick={() => fileInputRef.current?.click()} disabled={!!editingMsg}>
                <Paperclip size={18} />
              </button>

              <textarea placeholder={editingMsg ? "Edit message..." : "Type a message..."} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={handleKeyDown} rows={1} />

              <button onClick={handleSend} className={s.sendBtn} disabled={(!draft.trim() && !mediaFile) || sending}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </Page>
  );
}

// 🚨 BUBBLE WITH 3-DOT MENU 🚨
function MessageBubble({ message, onEdit, onDelete }) {
  const m = message;
  const isMe = m.from === "me";
  const [showMenu, setShowMenu] = useState(false);

  if (m.isDeleted) {
    return (
      <div className={`${s.msg} ${isMe ? s.msgMe : s.msgThem}`} style={{ opacity: 0.6, fontStyle: 'italic' }}>
        <div className={s.msgText}>🚫 This message was deleted.</div>
      </div>
    );
  }

  return (
    <div className={`${s.msg} ${isMe ? s.msgMe : s.msgThem}`} onMouseLeave={() => setShowMenu(false)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {m.mediaUrl && (
            <div style={{ marginBottom: m.text ? '8px' : '0', borderRadius: '8px', overflow: 'hidden', maxWidth: '250px' }}>
              {m.mediaType === 'video' ? (
                <video src={`http://localhost:5000/${m.mediaUrl}`} controls style={{ width: '100%' }} />
              ) : (
                <img src={`http://localhost:5000/${m.mediaUrl}`} alt="Attachment" style={{ width: '100%', display: 'block' }} />
              )}
            </div>
          )}
          {m.text && <div className={s.msgText}>{m.text}</div>}
        </div>

        {isMe && !m.pending && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: '4px' }}>
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', zIndex: 10, padding: '4px', minWidth: '100px' }}>
                {!m.mediaUrl && (
                  <button onClick={() => { setShowMenu(false); onEdit(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--color-text)' }}>
                    <Edit2 size={12} /> Edit
                  </button>
                )}
                <button onClick={() => { setShowMenu(false); onDelete(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--color-danger)' }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={s.msgFoot}>
        <span className={s.time}>{m.createdAt}</span>
        {m.isEdited && <span style={{ fontSize: '10px', color: 'var(--color-muted)', marginLeft: '4px' }}>(edited)</span>}
        {isMe && !m.pending && <CheckCheck size={12} className={`${s.readMark} ${m.read ? s.readMarkSeen : ""}`} />}
      </div>
    </div>
  );
}

function getStatusText(updatedAt) {
  if (!updatedAt) return "Offline";
  const diffMins = (new Date() - new Date(updatedAt)) / (1000 * 60);
  if (diffMins < 15) return "🟢 Active now";
  const d = new Date(updatedAt);
  const isToday = new Date().toDateString() === d.toDateString();
  if (isToday) return `Last active today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return `Last active ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}