import React, { useEffect, useRef, useState } from "react";
import { Send, ShieldCheck, Lock } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import { useAuth } from "../../../src/context/AuthContext.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import api from "../../lib/axios.js";
import s from "./StudentMessages.module.css";

const PRESIDENT = {
  id: "president",
  name: "President Avery Hale",
  title: "Student Body President",
  avatar: "🎓",
};

export default function StudentMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef(null);

  // Fetch chat history from Database
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get('/messages/president');
        setMessages(response.data);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, []);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // Send message to Database
  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    
    // Optimistic UI update (shows instantly on screen)
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const tempMsg = { _id: Date.now(), sender: user.id, text, createdAt: now, from: "me" };
    setMessages((m) => [...m, tempMsg]);
    setDraft("");

    try {
      // Send to backend
      await api.post('/messages/president', { text });
    } catch (err) {
      console.error("Message failed to send:", err);
      // In a real app, you'd show a red "Failed to send" icon next to the message here
    }
  };

  return (
    <Page>
      <PageHead title="Messages" subtitle="Direct line to your Student Body President." />

      <div className={s.notice}>
        <Lock size={14} />
        <span>For your safety, students can only message the <b>President</b>. Mentor sessions are scheduled via your mentor.</span>
      </div>

      <div className={s.layout}>
        <aside className={s.sidebar}>
          <div className={s.sideTitle}>Allowed contacts</div>
          <div className={`${s.contact} ${s.contactActive}`}>
            <div className={s.avatar}>{PRESIDENT.avatar}</div>
            <div style={{ flex: 1 }}>
              <div className={s.contactName}>
                {PRESIDENT.name}
                <ShieldCheck size={14} className={s.verified} />
              </div>
              <div className={s.contactRole}>{PRESIDENT.title}</div>
            </div>
          </div>
          <div className={s.lockedNote}>
            Other contacts are unavailable for direct messaging.
          </div>
        </aside>

        <section className={s.chat}>
          <header className={s.chatHead}>
            <div className={s.avatar}>{PRESIDENT.avatar}</div>
            <div>
              <div className={s.headName}>{PRESIDENT.name}</div>
              <div className={s.headSub}>Usually replies within a day</div>
            </div>
          </header>
          
          <div ref={listRef} className={s.list}>
            {isLoading ? (
               <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}><CircularProgress value={0} size={40} stroke={4} /></div>
            ) : messages.length === 0 ? (
              <div className={s.empty}>
                <div className={s.emptyEmoji}>👋</div>
                Say hello to the President — share feedback, ideas, or questions.
              </div>
            ) : (
              messages.map((m) => (
                <div key={m._id} className={`${s.msg} ${m.from === "me" ? s.msgMe : s.msgThem}`}>
                  <div>{m.text}</div>
                  <div className={s.time}>{m.createdAt}</div>
                </div>
              ))
            )}
          </div>

          <div className={s.composer}>
            <input
              placeholder={`Message ${PRESIDENT.name}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={isLoading}
            />
            <button onClick={send} aria-label="Send" className={s.sendBtn} disabled={isLoading}>
              <Send size={16} />
            </button>
          </div>
        </section>
      </div>
    </Page>
  );
}