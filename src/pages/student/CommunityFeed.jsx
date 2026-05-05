import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import { Textarea } from "../../components/common/Field.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import api from "../../lib/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import s from "./CommunityFeed.module.css";

export default function CommunityFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get('/community/feed');
        setPosts(data);
      } catch (err) {
        console.error("Failed to load community feed", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const submit = async () => {
    if (!draft.trim()) return;
    setIsPosting(true);
    try {
      const { data } = await api.post('/community/feed', { body: draft });
      setPosts([data, ...posts]); // Add new post to top of UI
      setDraft("");
    } catch (err) {
      console.error("Failed to post", err);
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading) return <Page><div style={{display:'grid', placeItems:'center', height:'50vh'}}><CircularProgress value={0} size={50} stroke={4}/></div></Page>;

  return (
    <Page>
      <PageHead title="Community" subtitle="Career news, peer questions, and mentor wisdom." />
      <div className={s.layout}>
        <div>
          <div className={s.composer}>
            <Textarea placeholder="Share an update, question, or insight…" value={draft} onChange={(e) => setDraft(e.target.value)} disabled={isPosting} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={submit} disabled={!draft.trim() || isPosting}>
                {isPosting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>

          <div className={s.feed}>
            {posts.map((p) => (
              <article key={p.id} className={s.post}>
                <div className={s.head}>
                  <div className={s.avatar}>{p.author.split(" ").map((x) => x[0]).slice(0,2).join("")}</div>
                  <div style={{ flex: 1 }}>
                    <div className={s.author}>{p.author} <Badge tone={p.role.toLowerCase() === "mentor" ? "info" : "neutral"}>{p.role}</Badge></div>
                    <div className={s.meta}>{p.time}</div>
                  </div>
                  <Badge>{p.tag}</Badge>
                </div>
                <div className={s.title}>{p.title}</div>
                <p className={s.body}>{p.body}</p>
                <div className={s.actions}>
                  <span className={s.action}><Heart size={15} /> {p.likes}</span>
                  <span className={s.action}><MessageCircle size={15} /> {p.comments}</span>
                  <span className={s.action}><Share2 size={15} /> Share</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className={s.side}>
          <Card title="Community guidelines">
            <p style={{ fontSize: 13, color: "var(--color-muted)" }}>
              Be respectful, share sources for advice, and keep discussions focused on learning and careers.
            </p>
          </Card>
        </aside>
      </div>
    </Page>
  );
}