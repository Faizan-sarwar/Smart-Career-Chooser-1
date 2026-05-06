// src/pages/student/CommunityHub.jsx
//
// Fully dynamic: pulls events from /community/events and discussion posts
// from /community/posts. Shows skeleton while loading, empty state if no data.

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import api from "../../lib/axios.js";
import s from "./CommunityHub.module.css";

export default function CommunityHub() {
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rsvpingId, setRsvpingId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [eventsRes, postsRes] = await Promise.all([
        api.get("/community/events"),
        api.get("/community/posts"),
      ]);
      setEvents(eventsRes.data);
      setPosts(postsRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load community data. Has the backend been seeded?"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleRsvp = async (id) => {
    setRsvpingId(id);
    try {
      const { data } = await api.post(`/community/events/${id}/rsvp`);
      setEvents((evs) =>
        evs.map((e) =>
          e.id === id ? { ...e, rsvpd: data.rsvpd, attendees: data.attendees } : e
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setRsvpingId(null);
    }
  };

  if (loading) {
    return (
      <Page>
        <PageHead title="Community & Events" />
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading community…</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHead title="Community & Events" />
        <div className={s.errorState}>
          <div className={s.errorIcon}>
            <AlertCircle size={28} />
          </div>
          <h3>Could not load community</h3>
          <p>{error}</p>
          <Button onClick={fetchAll}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Community & Events"
        subtitle="Live webinars, peer Q&A, and expert advice — all in one hub."
      />

      {/* ── EVENTS ──────────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>
            <span className={s.sectionIcon}>
              <Calendar size={16} />
            </span>
            Upcoming live webinars
          </h2>
          {events.length > 0 && <Badge tone="accent">{events.length} this month</Badge>}
        </div>

        {events.length === 0 ? (
          <div className={s.emptyBlock}>
            <p>No upcoming events scheduled. Check back soon!</p>
          </div>
        ) : (
          <div className={s.eventGrid}>
            {events.map((e, i) => (
              <article
                key={e.id}
                className={s.event}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div
                  className={s.eventCover}
                  style={{
                    background: e.coverColor
                      ? `linear-gradient(135deg, ${e.coverColor} 0%, var(--color-accent) 100%)`
                      : undefined,
                  }}
                >
                  <span className={s.eventTag}>{e.tag}</span>
                  <div className={s.live}>
                    <span className={s.liveDot} />
                    LIVE soon
                  </div>
                </div>
                <div className={s.eventBody}>
                  <h4 className={s.eventTitle}>{e.title}</h4>
                  <div className={s.eventMeta}>
                    <span>{e.host}</span>
                  </div>
                  <div className={s.eventWhen}>{e.when}</div>
                  <div className={s.eventFoot}>
                    <span className={s.attendees}>
                      <Users size={14} /> {e.attendees}
                    </span>
                    <Button
                      size="sm"
                      variant={e.rsvpd ? "secondary" : "primary"}
                      disabled={rsvpingId === e.id}
                      onClick={() => handleRsvp(e.id)}
                    >
                      {e.rsvpd ? "RSVP'd ✓" : "RSVP"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── DISCUSSION FORUM ────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>
            <span className={s.sectionIcon}>
              <MessageSquare size={16} />
            </span>
            Discussion forum
          </h2>
        </div>

        {posts.length === 0 ? (
          <div className={s.emptyBlock}>
            <p>No discussions yet. Head to the Community Feed to start one.</p>
          </div>
        ) : (
          <div className={s.feed}>
            {posts.slice(0, 6).map((p, i) => (
              <article
                key={p.id}
                className={s.feedItem}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={s.avatar}>
                  {p.author
                    .split(" ")
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={s.feedHead}>
                    <span className={s.feedAuthor}>{p.author}</span>
                    <Badge tone={p.role === "Mentor" ? "primary" : "default"}>
                      {p.role}
                    </Badge>
                    <span className={s.feedTime}>· {p.time}</span>
                  </div>
                  {p.title && <div className={s.feedTitle}>{p.title}</div>}
                  <p className={s.feedBody}>{p.body}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}