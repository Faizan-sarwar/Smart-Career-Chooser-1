// src/components/chat/ChatLayout.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MoreVertical, Edit2, Trash2, X, Image as ImageIcon, Check, CheckCheck, Smile, Reply } from 'lucide-react';
import { useChat } from '../../context/ChatContext.jsx';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import s from './ChatLayout.module.css';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function ChatLayout() {
    const {
        contacts,
        activeContactId,
        setActiveContactId,
        thread,
        onlineUsers,
        typingByUser,
        sendMessage,
        reactToMessage,
        editMessage,
        deleteMessage,
        loadMoreMessages,
        sendTyping,
    } = useChat();

    const [draft, setDraft] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [editingMsg, setEditingMsg] = useState(null);

    const listRef = useRef(null);
    const fileInputRef = useRef(null);
    const prevMessageCount = useRef(0);

    // Auto-scroll logic
    useEffect(() => {
        if (!listRef.current) return;
        // Scroll to bottom only if it's a completely new thread or a newly sent message
        if (thread.messages.length > prevMessageCount.current && !thread.loadingMore) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
        prevMessageCount.current = thread.messages.length;
    }, [thread.messages, thread.loadingMore]);

    // Infinite Scroll Trigger
    const loaderRef = useInfiniteScroll(loadMoreMessages, thread.hasMore, thread.loadingMore);

    const handleSend = async () => {
        if (!draft.trim() && !mediaFile) return;

        if (editingMsg) {
            editMessage(editingMsg._id, draft.trim());
            setEditingMsg(null);
            setDraft('');
            return;
        }

        await sendMessage({ text: draft, mediaFile, replyTo });
        setDraft('');
        setMediaFile(null);
        setReplyTo(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        } else {
            sendTyping();
        }
    };

    const activeContact = thread.contact;
    const isTyping = activeContactId && typingByUser[activeContactId];
    const isOnline = activeContactId && onlineUsers.includes(activeContactId);

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';

    return (
        <div className={s.layout}>
            {/* SIDEBAR */}
            <aside className={s.sidebar}>
                <div className={s.sideTitle}>Conversations</div>
                <div className={s.contactList}>
                    {contacts.map((c) => {
                        const isUserOnline = onlineUsers.includes(c._id);
                        return (
                            <div key={c._id} onClick={() => setActiveContactId(c._id)} className={`${s.contact} ${activeContactId === c._id ? s.contactActive : ''}`}>
                                <div className={s.avatar}>
                                    {c.avatar && c.avatar.length > 10 ? <img src={c.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : getInitials(c.name)}
                                    {isUserOnline && <span className={s.onlineDot} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className={s.contactName}>
                                        {c.name}
                                        {c.unreadCount > 0 && <span className={s.unreadBadge}>{c.unreadCount}</span>}
                                    </div>
                                    <div className={s.contactPreview}>
                                        {typingByUser[c._id] ? <span style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}>typing...</span> : c.lastMessage?.preview || 'Start a conversation'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* CHAT WINDOW */}
            <section className={s.chat}>
                {activeContact ? (
                    <>
                        <header className={s.chatHead}>
                            <div className={s.avatar}>
                                {activeContact.avatar && activeContact.avatar.length > 10 ? <img src={activeContact.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : getInitials(activeContact.name)}
                            </div>
                            <div>
                                <div className={s.headName}>{activeContact.name}</div>
                                <div className={s.headSub}>
                                    {isOnline ? <span className={s.activeText}>🟢 Active now</span> : 'Offline'}
                                </div>
                            </div>
                        </header>

                        <div ref={listRef} className={s.list}>
                            {thread.hasMore && (
                                <div ref={loaderRef} style={{ textAlign: 'center', padding: '10px', color: 'var(--color-muted)', fontSize: '12px' }}>
                                    {thread.loadingMore ? 'Loading older messages...' : 'Scroll up to load more'}
                                </div>
                            )}

                            {thread.messages.map((m) => (
                                <MessageBubble
                                    key={m.clientId || m._id}
                                    message={m}
                                    onReact={(emoji) => reactToMessage(m._id, emoji)}
                                    onReply={() => setReplyTo(m)}
                                    onEdit={() => { setEditingMsg(m); setDraft(m.text); }}
                                    onDelete={() => deleteMessage(m._id)}
                                />
                            ))}

                            {isTyping && (
                                <div className={s.typing}>
                                    <div className={s.dot}></div><div className={s.dot}></div><div className={s.dot}></div>
                                </div>
                            )}
                        </div>

                        <div className={s.composerArea}>
                            {replyTo && (
                                <div className={s.replyContext}>
                                    <span>Replying to {replyTo.from === 'me' ? 'yourself' : activeContact.name}</span>
                                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => setReplyTo(null)} />
                                </div>
                            )}
                            {editingMsg && (
                                <div className={s.replyContext}>
                                    <span>Editing message...</span>
                                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => { setEditingMsg(null); setDraft(''); }} />
                                </div>
                            )}
                            {mediaFile && (
                                <div className={s.mediaContext}>
                                    <ImageIcon size={14} color="var(--color-primary)" /> {mediaFile.name}
                                    <X size={14} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setMediaFile(null)} />
                                </div>
                            )}

                            <div className={s.composer}>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={e => setMediaFile(e.target.files[0])} />
                                <button className={s.attachBtn} onClick={() => fileInputRef.current?.click()} disabled={!!editingMsg}>
                                    <Paperclip size={18} />
                                </button>
                                <textarea
                                    className={s.inputField}
                                    placeholder="Type a message..."
                                    value={draft}
                                    onChange={e => setDraft(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    rows={1}
                                />
                                <button onClick={handleSend} className={s.sendBtn} disabled={(!draft.trim() && !mediaFile)}>
                                    <Send size={16} style={{ transform: 'translateX(-1px)' }} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--color-muted)' }}>
                        Select a conversation to start messaging
                    </div>
                )}
            </section>
        </div>
    );
}

// 🚨 INSTAGRAM-STYLE MESSAGE BUBBLE 🚨
function MessageBubble({ message, onReact, onReply, onEdit, onDelete }) {
    const m = message;
    const isMe = m.from === 'me';
    const [showReactions, setShowReactions] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    if (m.isDeleted) {
        return (
            <div className={`${s.msg} ${isMe ? s.msgMe : s.msgThem}`} style={{ opacity: 0.6 }}>
                <div className={s.bubble} style={{ fontStyle: 'italic', background: 'transparent', border: '1px dashed var(--color-border)' }}>
                    🚫 This message was deleted.
                </div>
            </div>
        );
    }

    return (
        <div className={`${s.msg} ${isMe ? s.msgMe : s.msgThem}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isMe ? 'row-reverse' : 'row' }}>

                {/* The Bubble */}
                <div className={`${s.bubble} ${isMe ? s.bubbleMe : s.bubbleThem}`} onDoubleClick={onReply}>
                    {m.replyTo && (
                        <div className={s.replyPreview}>
                            <strong>{m.replyTo.senderName}</strong><br />
                            {m.replyTo.preview}
                        </div>
                    )}

                    {m.mediaUrl && (
                        <div style={{ marginBottom: m.text ? '8px' : '0', borderRadius: '8px', overflow: 'hidden' }}>
                            {m.mediaType === 'video' ? (
                                <video src={m.mediaUrl.startsWith('blob:') ? m.mediaUrl : `http://localhost:5000/${m.mediaUrl}`} controls style={{ width: '100%', maxWidth: '250px' }} />
                            ) : (
                                <img src={m.mediaUrl.startsWith('blob:') ? m.mediaUrl : `http://localhost:5000/${m.mediaUrl}`} alt="Attachment" style={{ width: '100%', maxWidth: '250px', display: 'block' }} />
                            )}
                        </div>
                    )}

                    {m.text && <div>{m.text}</div>}

                    {/* Render Reactions */}
                    {m.reactions && m.reactions.length > 0 && (
                        <div className={s.reactions}>
                            {m.reactions.map((r, idx) => (
                                <span key={idx}>{r.emoji} {r.count > 1 ? r.count : ''}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons (Hover) */}
                {!m.pending && (
                    <div className={s.msgActions} style={{ flexDirection: isMe ? 'row-reverse' : 'row', position: 'relative' }}>
                        <button className={s.actionBtn} onClick={() => setShowReactions(!showReactions)} title="React"><Smile size={14} /></button>
                        <button className={s.actionBtn} onClick={onReply} title="Reply"><Reply size={14} /></button>
                        {isMe && <button className={s.actionBtn} onClick={() => setShowMenu(!showMenu)} title="More"><MoreVertical size={14} /></button>}

                        {/* Reaction Popover */}
                        {showReactions && (
                            <div className={s.popover} style={{ top: '-40px', right: isMe ? '0' : 'auto', left: isMe ? 'auto' : '0' }}>
                                {EMOJIS.map(emoji => (
                                    <button key={emoji} onClick={() => { onReact(emoji); setShowReactions(false); }} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Menu Popover */}
                        {showMenu && isMe && (
                            <div className={s.popover} style={{ flexDirection: 'column', width: '100px', top: '30px' }}>
                                {!m.mediaUrl && <button className={s.menuItem} onClick={() => { onEdit(); setShowMenu(false); }}><Edit2 size={12} /> Edit</button>}
                                <button className={`${s.menuItem} ${s.menuDanger}`} onClick={() => { onDelete(); setShowMenu(false); }}><Trash2 size={12} /> Delete</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer: Time & Status */}
            <div className={s.msgFoot}>
                <span>{m.createdAt}</span>
                {m.isEdited && <span>(edited)</span>}
                {isMe && (
                    <span className={`${s.statusIcon} ${m.status === 'seen' ? s.statusSeen : ''}`}>
                        {m.status === 'sending' ? '🕒' : m.status === 'sent' ? <Check size={12} /> : <CheckCheck size={12} />}
                    </span>
                )}
            </div>
        </div>
    );
}