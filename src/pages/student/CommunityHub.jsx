import React, { useState } from "react";
import { Calendar, Users, MessageSquare } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import { events } from "../../data/roadmap.js";
import { posts as forum } from "../../data/community.js";
import s from "./CommunityHub.module.css";

export default function CommunityHub() {
  const [rsvp, setRsvp] = useState({});

  return (
    <Page>
      <PageHead title="Community & Events" subtitle="Live webinars, peer Q&A, and expert advice — all in one hub." />

      <section>
        <div className={s.sectionHead}>
          <h3 className={s.sectionTitle}><Calendar size={18} /> Upcoming live webinars</h3>
        </div>
        <div className={s.eventGrid}>
          {events.map((e, i) => (
            <article key={e.id} className={s.event} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={s.eventCover}>
                <span className={s.eventTag}>{e.tag}</span>
                <div className={s.live}><span className={s.liveDot} /> LIVE soon</div>
              </div>
              <div className={s.eventBody}>
                <h4>{e.title}</h4>
                <div className={s.eventMeta}>
                  <span>{e.host}</span>
                  <span>·</span>
                  <span>{e.when}</span>
                </div>
                <div className={s.eventFoot}>
                  <span className={s.attendees}><Users size={14} /> {e.attendees}</span>
                  <Button
                    size="sm"
                    variant={rsvp[e.id] ? "secondary" : "primary"}
                    onClick={() => setRsvp((r) => ({ ...r, [e.id]: !r[e.id] }))}
                  >
                    {rsvp[e.id] ? "RSVP'd ✓" : "RSVP"}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className={s.sectionHead}>
          <h3 className={s.sectionTitle}><MessageSquare size={18} /> Discussion forum</h3>
        </div>
        <div className={s.feed}>
          {forum.map((p, i) => (
            <article key={p.id} className={s.feedItem} style={{ animationDelay: `${i * 0.05}s` }}>
              <div className={s.avatar}>{p.author.split(" ").map((x) => x[0]).slice(0,2).join("")}</div>
              <div style={{ flex: 1 }}>
                <div className={s.feedHead}>
                  <span className={s.feedAuthor}>{p.author}</span>
                  <Badge tone={p.role === "Mentor" ? "info" : "neutral"}>{p.role}</Badge>
                  <span className={s.feedTime}>· {p.time}</span>
                </div>
                <div className={s.feedTitle}>{p.title}</div>
                <p className={s.feedBody}>{p.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Page>
  );
}
