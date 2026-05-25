// src/context/ChatContext.jsx
//
// The brain of the chat system. Mounted once (above any chat UI). Owns:
//   - Contact list with last-message preview + unread counts
//   - Active thread state (messages, hasMore cursor)
//   - Typing indicator state per contact
//   - All socket event subscriptions (single source of truth)
//   - Optimistic-UI helpers (sendMessage exposes a temp message immediately)
//
// Consumers use `useChat()` to get the state + actions.

import React, {
    createContext, useContext, useState, useEffect, useRef, useCallback,
} from 'react';
import api from '../lib/axios.js';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const { user } = useAuth();
    const { socket, onlineUsers } = useSocket();

    const [contacts, setContacts] = useState([]);
    const [activeContactId, setActiveContactId] = useState(null);
    const [thread, setThread] = useState({
        contact: null,
        messages: [],
        hasMore: false,
        oldestCursor: null,
        loading: false,
        loadingMore: false,
    });
    const [typingByUser, setTypingByUser] = useState({}); // { userId: true }

    // Refs for stable callbacks
    const activeContactIdRef = useRef(activeContactId);
    useEffect(() => { activeContactIdRef.current = activeContactId; }, [activeContactId]);

    // ── Fetch contact list ─────────────────────────────────────────
    const refreshContacts = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await api.get('/messages/contacts');
            setContacts(data);
        } catch (err) {
            console.warn('[ChatContext] contacts fetch failed:', err.message);
        }
    }, [user]);

    useEffect(() => {
        refreshContacts();
    }, [refreshContacts]);

    // ── Load thread for active contact ─────────────────────────────
    const loadThread = useCallback(async (contactId) => {
        if (!contactId) return;
        setThread((t) => ({ ...t, loading: true }));
        try {
            const { data } = await api.get(`/messages/${contactId}`);
            setThread({
                contact: data.contact,
                messages: data.messages,
                hasMore: data.hasMore,
                oldestCursor: data.oldestCursor,
                loading: false,
                loadingMore: false,
            });
            // Reset this contact's unread count locally since the server marked them read
            setContacts((cs) =>
                cs.map((c) => (c._id === contactId ? { ...c, unreadCount: 0 } : c))
            );
        } catch (err) {
            console.warn('[ChatContext] thread fetch failed:', err.message);
            setThread((t) => ({ ...t, loading: false }));
        }
    }, []);

    useEffect(() => {
        if (activeContactId) loadThread(activeContactId);
    }, [activeContactId, loadThread]);

    // ── Load older messages (infinite scroll) ──────────────────────
    const loadMoreMessages = useCallback(async () => {
        if (!activeContactId || !thread.hasMore || thread.loadingMore) return;
        setThread((t) => ({ ...t, loadingMore: true }));
        try {
            const { data } = await api.get(
                `/messages/${activeContactId}?before=${encodeURIComponent(thread.oldestCursor)}`
            );
            setThread((t) => ({
                ...t,
                // Prepend older messages
                messages: [...data.messages, ...t.messages],
                hasMore: data.hasMore,
                oldestCursor: data.oldestCursor,
                loadingMore: false,
            }));
        } catch (err) {
            console.warn('[ChatContext] load more failed:', err.message);
            setThread((t) => ({ ...t, loadingMore: false }));
        }
    }, [activeContactId, thread.hasMore, thread.oldestCursor, thread.loadingMore]);

    // ── Send message (optimistic) ──────────────────────────────────
    const sendMessage = useCallback(
        async ({ text, mediaFile, replyTo }) => {
            if (!activeContactId) return;
            if (!text?.trim() && !mediaFile) return;

            const clientId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const optimistic = {
                _id: clientId,
                clientId,
                text: text?.trim() || '',
                mediaUrl: mediaFile ? URL.createObjectURL(mediaFile) : null,
                mediaType: mediaFile
                    ? mediaFile.type.startsWith('video/') ? 'video' : 'image'
                    : null,
                replyTo: replyTo
                    ? {
                        messageId: replyTo._id,
                        preview: replyTo.text || (replyTo.mediaType ? `📷 ${replyTo.mediaType}` : ''),
                        senderName: replyTo.from === 'me' ? user.name : (thread.contact?.name || ''),
                    }
                    : null,
                reactions: [],
                from: 'me',
                status: 'sending',
                createdAt: 'now',
                createdAtISO: new Date().toISOString(),
                pending: true,
            };

            setThread((t) => ({ ...t, messages: [...t.messages, optimistic] }));

            try {
                const formData = new FormData();
                if (text?.trim()) formData.append('text', text.trim());
                if (mediaFile) formData.append('media', mediaFile);
                if (replyTo?._id) formData.append('replyTo', replyTo._id);
                formData.append('clientId', clientId);

                const { data } = await api.post(`/messages/${activeContactId}`, formData);

                // Swap optimistic with real
                setThread((t) => ({
                    ...t,
                    messages: t.messages.map((m) => (m.clientId === clientId ? data : m)),
                }));

                // Update contact list preview
                setContacts((cs) =>
                    [...cs]
                        .map((c) =>
                            c._id === activeContactId
                                ? {
                                    ...c,
                                    lastMessage: {
                                        _id: data._id,
                                        preview: data.text || (data.mediaType ? `📷 ${data.mediaType}` : ''),
                                        fromMe: true,
                                        createdAt: data.createdAtISO,
                                    },
                                }
                                : c
                        )
                        .sort((a, b) => {
                            if (!a.lastMessage && !b.lastMessage) return 0;
                            if (!a.lastMessage) return 1;
                            if (!b.lastMessage) return -1;
                            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
                        })
                );
            } catch (err) {
                // Mark optimistic as failed
                setThread((t) => ({
                    ...t,
                    messages: t.messages.map((m) =>
                        m.clientId === clientId ? { ...m, failed: true, pending: false } : m
                    ),
                }));
            }
        },
        [activeContactId, user, thread.contact]
    );

    // ── React to a message ─────────────────────────────────────────
    const reactToMessage = useCallback(async (messageId, emoji) => {
        try {
            const { data } = await api.post(`/messages/${messageId}/react`, { emoji });
            // Update local
            setThread((t) => ({
                ...t,
                messages: t.messages.map((m) =>
                    m._id === messageId ? { ...m, reactions: data.reactions } : m
                ),
            }));
        } catch (err) {
            console.warn('[ChatContext] react failed:', err.message);
        }
    }, []);

    // ── Edit / delete ──────────────────────────────────────────────
    const editMessage = useCallback(async (messageId, newText) => {
        try {
            await api.put(`/messages/${messageId}/edit`, { text: newText });
            setThread((t) => ({
                ...t,
                messages: t.messages.map((m) =>
                    m._id === messageId ? { ...m, text: newText, isEdited: true } : m
                ),
            }));
        } catch (err) {
            alert('Failed to edit');
        }
    }, []);

    const deleteMessage = useCallback(async (messageId) => {
        try {
            await api.delete(`/messages/${messageId}/delete`);
            setThread((t) => ({
                ...t,
                messages: t.messages.map((m) =>
                    m._id === messageId
                        ? { ...m, isDeleted: true, text: '', mediaUrl: null }
                        : m
                ),
            }));
        } catch (err) {
            alert('Failed to delete');
        }
    }, []);

    // ── Typing ─────────────────────────────────────────────────────
    const typingTimerRef = useRef(null);
    const sendTyping = useCallback(() => {
        if (!socket || !activeContactId) return;
        socket.emit('typing', { to: activeContactId });
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            socket.emit('stopTyping', { to: activeContactId });
        }, 2500);
    }, [socket, activeContactId]);

    // ── Socket listeners (mounted once) ────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const onNewMessage = (msg) => {
            const currentActive = activeContactIdRef.current;
            const fromActive = msg.senderId === currentActive;

            if (fromActive) {
                // Append to thread AND mark as read on the server
                setThread((t) => ({ ...t, messages: [...t.messages, msg] }));
                api.put(`/messages/${msg.senderId}/read`).catch(() => { });
            } else {
                // Not in the active thread — bump that contact's unread count + last-message preview
                setContacts((cs) =>
                    [...cs]
                        .map((c) =>
                            c._id === msg.senderId
                                ? {
                                    ...c,
                                    unreadCount: (c.unreadCount || 0) + 1,
                                    lastMessage: {
                                        _id: msg._id,
                                        preview: msg.text || (msg.mediaType ? `📷 ${msg.mediaType}` : ''),
                                        fromMe: false,
                                        createdAt: msg.createdAtISO,
                                    },
                                }
                                : c
                        )
                        .sort((a, b) => {
                            if (!a.lastMessage && !b.lastMessage) return 0;
                            if (!a.lastMessage) return 1;
                            if (!b.lastMessage) return -1;
                            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
                        })
                );
            }
        };

        const onMessagesRead = ({ messageIds, readAt }) => {
            const idSet = new Set(messageIds);
            setThread((t) => ({
                ...t,
                messages: t.messages.map((m) =>
                    idSet.has(m._id) ? { ...m, status: 'seen', read: true, readAt } : m
                ),
            }));
        };

        const onMessageEdited = ({ messageId, text, isEdited }) => {
            setThread((t) => ({
                ...t,
                messages: t.messages.map((m) =>
                    m._id === messageId ? { ...m, text, isEdited } : m
                ),
            }));
        };

        const onMessageDeleted = ({ messageId }) => {
            setThread((t) => ({
                ...t,
                messages: t.messages.map((m) =>
                    m._id === messageId
                        ? { ...m, isDeleted: true, text: '', mediaUrl: null }
                        : m
                ),
            }));
        };

        const onMessageReacted = ({ messageId, reactions }) => {
            setThread((t) => ({
                ...t,
                messages: t.messages.map((m) =>
                    m._id === messageId ? { ...m, reactions } : m
                ),
            }));
        };

        const onUserTyping = ({ from }) => {
            setTypingByUser((t) => ({ ...t, [from]: true }));
        };

        const onUserStopTyping = ({ from }) => {
            setTypingByUser((t) => {
                const copy = { ...t };
                delete copy[from];
                return copy;
            });
        };

        socket.on('newMessage', onNewMessage);
        socket.on('messagesRead', onMessagesRead);
        socket.on('messageEdited', onMessageEdited);
        socket.on('messageDeleted', onMessageDeleted);
        socket.on('messageReacted', onMessageReacted);
        socket.on('userTyping', onUserTyping);
        socket.on('userStopTyping', onUserStopTyping);

        return () => {
            socket.off('newMessage', onNewMessage);
            socket.off('messagesRead', onMessagesRead);
            socket.off('messageEdited', onMessageEdited);
            socket.off('messageDeleted', onMessageDeleted);
            socket.off('messageReacted', onMessageReacted);
            socket.off('userTyping', onUserTyping);
            socket.off('userStopTyping', onUserStopTyping);
        };
    }, [socket]);

    const value = {
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
        refreshContacts,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
    return ctx;
}