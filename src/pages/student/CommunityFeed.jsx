// src/pages/student/CommunityFeed.jsx
//
// Real-time community feed: GET /community/posts, POST new ones,
// like/unlike posts. All persists to MongoDB.

import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, AlertCircle, RefreshCw, Sparkles, Send } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import { Textarea } from "../../components/common/Field.jsx";
import api from "../../lib/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import s from "./CommunityFeed.module.css";

const TAGS = ["Discussion", "Question", "Insight", "Resource", "News", "Career"];

export default function CommunityFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState("");
  const [draftTag, setDraftTag] = useState("Discussion");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [likedPosts, setLikedPosts] = useState({});

  // NEW STATES FOR INTERACTIVITY
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [shareToast, setShareToast] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/community/posts");
      setPosts(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not load community feed. Has the backend been seeded?"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const submit = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post("/community/posts", {
        body: draft.trim(),
        tag: draftTag,
      });
      setPosts((prev) => [data, ...prev]);
      setDraft("");
      setDraftTag("Discussion");
    } catch (err) {
      console.error("Failed to post", err);
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (id) => {
    // Optimistic
    setLikedPosts((m) => ({ ...m, [id]: !m[id] }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, likes: p.likes + (likedPosts[id] ? -1 : 1) }
          : p
      )
    );
    try {
      await api.post(`/community/posts/${id}/like`);
    } catch (err) {
      // Revert on failure
      setLikedPosts((m) => ({ ...m, [id]: !m[id] }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, likes: p.likes + (likedPosts[id] ? 1 : -1) }
            : p
        )
      );
    }
  };
  const handleShare = (postId) => {
    // Copies a fake link to the clipboard
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  const submitComment = async (postId) => {
    if (!commentDraft.trim()) return;
    try {
      const { data } = await api.post(`/community/posts/${postId}/comment`, { text: commentDraft });
      // Update the post with the new comments array from the backend
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comments: data, commentsCount: data.length } : p
      ));
      setCommentDraft("");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Page>
        <PageHead title="Community" />
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading the feed…</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHead title="Community" />
        <div className={s.errorState}>
          <AlertCircle size={28} />
          <h3>Couldn't load community</h3>
          <p>{error}</p>
          <Button onClick={fetchPosts}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Community"
        subtitle="Career news, peer questions, and mentor wisdom — straight from Pakistan's tech community."
      />

      <div className={s.layout}>
        <div>
          {/* Composer */}
          <div className={s.composer}>
            <div className={s.composerHead}>
              <div className={s.composerAvatar} style={{ overflow: 'hidden' }}>
                {user?.avatar && user.avatar.length > 10 ? (
                  <img src={user.avatar} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (user?.name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("")
                )}
              </div>
              <Textarea
                placeholder="Share an update, question, or insight…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={posting}
                rows={3}
              />
            </div>

            <div className={s.composerFoot}>
              <div className={s.tagPicker}>
                {TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`${s.tagBtn} ${draftTag === t ? s.tagBtnActive : ""}`}
                    onClick={() => setDraftTag(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Button
                variant="accent"
                onClick={submit}
                disabled={!draft.trim() || posting}
              >
                <Sparkles size={14} /> {posting ? "Posting…" : "Post"}
              </Button>
            </div>
          </div>

          {/* Feed */}
          {posts.length === 0 ? (
            <div className={s.emptyFeed}>
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            <div className={s.feed}>
              {posts.map((p, i) => (
                <article
                  key={p.id}
                  className={s.post}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className={s.head}>
                    <div className={s.avatar} style={{ overflow: 'hidden' }}>
                      {p.avatar && p.avatar.length > 10 ? (
                        <img src={p.avatar} alt={p.author} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        p.author.split(" ").map((x) => x[0]).slice(0, 2).join("")
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className={s.author}>
                        {p.author}{" "}
                        <Badge tone={p.role === "Mentor" ? "primary" : "default"}>
                          {p.role}
                        </Badge>
                      </div>
                      <div className={s.meta}>{p.time}</div>
                    </div>
                    <Badge tone="accent">{p.tag}</Badge>
                  </div>
                  {p.title && <div className={s.title}>{p.title}</div>}
                  <p className={s.body}>{p.body}</p>
                  <div className={s.actions}>
                    <button
                      // Use real DB hasLiked state!
                      className={`${s.action} ${p.hasLiked || likedPosts[p.id] ? s.actionLiked : ""}`}
                      onClick={() => toggleLike(p.id)}
                    >
                      <Heart
                        size={15}
                        fill={p.hasLiked || likedPosts[p.id] ? "currentColor" : "none"}
                      />{" "}
                      {p.likes}
                    </button>
                    <button
                      className={s.action}
                      onClick={() => setActiveCommentPostId(activeCommentPostId === p.id ? null : p.id)}
                    >
                      <MessageCircle size={15} /> {p.commentsCount}
                    </button>
                    <button className={s.action} onClick={() => handleShare(p.id)}>
                      <Share2 size={15} /> {shareToast ? "Copied!" : "Share"}
                    </button>
                  </div>

                  {/* COMMENTS EXPANDABLE SECTION */}
                  {activeCommentPostId === p.id && (
                    <div className={s.commentsSection}>
                      <div className={s.commentList}>
                        {p.comments?.map(c => (
                          <div key={c.id} className={s.commentItem}>
                            <strong>{c.author}</strong> <span className={s.commentTime}>{c.time}</span>
                            <p>{c.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className={s.commentInputRow}>
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitComment(p.id)}
                        />
                        <button onClick={() => submitComment(p.id)} disabled={!commentDraft.trim()}>
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className={s.side}>
          <Card title="Community guidelines">
            <p style={{ fontSize: 13, color: "var(--color-muted)", lineHeight: 1.6 }}>
              Be respectful, share sources for advice, and keep discussions focused
              on learning and careers. No spam, no self-promotion.
            </p>
          </Card>

          <Card title="Trending tags">
            <div className={s.tagCloud}>
              {TAGS.map((t) => (
                <span key={t} className={s.cloudTag}>
                  #{t}
                </span>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </Page>
  );
}