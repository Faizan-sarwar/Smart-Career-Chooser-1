// src/pages/student/StudentDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Target, Award, BookOpen, TrendingUp, Check, Sparkles,
  ArrowRight, ClipboardCheck, Map, Trophy, Bell, AlertCircle, CircleDashed, CalendarClock, Video, Users
} from "lucide-react";
import { Page, Grid, TwoCol } from "../../components/common/Page.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Card from "../../components/common/Card.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "./StudentDashboard.module.css";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    api
      .get("/users/dashboard")
      .then(({ data }) => {
        if (mounted) setData(data);
      })
      .catch((err) => {
        if (mounted) {
          setError(err.response?.data?.message || "Failed to load dashboard.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Page>
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading your dashboard…</p>
        </div>
      </Page>
    );
  }

  if (error || !data) {
    return (
      <Page>
        <div className={s.errorState}>
          <AlertCircle size={32} />
          <h3>Could not load dashboard</h3>
          <p>{error}</p>
        </div>
      </Page>
    );
  }

  const { hasAssessment, hasRoadmap, stats, careerTitle, topMatchTitle, notifications, nextSession } = data;
  const firstName = (user && user.name && typeof user.name === 'string') ? user.name.split(" ")[0] : "Student";

  return (
    <Page>
      {/* ── HERO BANNER ── */}
      <div className={s.hero}>
        <div className={s.heroText}>
          <span className={s.heroEyebrow}>Student Portal</span>
          <h2 className={s.heroTitle}>Welcome back, {firstName} <span className={s.wave}>👋</span></h2>
          <p className={s.heroSubtitle}>
            {hasRoadmap
              ? `You're currently working towards becoming a ${careerTitle}. Keep up the great work!`
              : "Let's discover your ideal career path today."}
          </p>

          <div className={s.heroActions}>
            {!hasAssessment ? (
              <Link to="/student/assessment">
                <Button variant="accent" size="lg"><ClipboardCheck size={16} /> Take the Assessment</Button>
              </Link>
            ) : !hasRoadmap ? (
              <Link to="/student/recommendations">
                <Button variant="accent" size="lg"><Sparkles size={16} /> View AI Recommendations</Button>
              </Link>
            ) : (
              <Link to="/student/roadmap">
                <Button variant="accent" size="lg"><Map size={16} /> Continue Roadmap</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 🚨 UPCOMING SESSION WIDGET 🚨 */}
      {nextSession && (
        <div style={{ marginBottom: '24px' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-faint)', color: 'var(--color-primary)', display: 'grid', placeItems: 'center' }}>
                  <CalendarClock size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)' }}>Upcoming 1:1 Session</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginTop: '2px' }}>{nextSession.title}</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '2px' }}>
                    with {nextSession.mentor?.name} · {new Date(nextSession.when).toLocaleString('en-PK', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {nextSession.meetingLink ? (
                  <a href={nextSession.meetingLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <Button variant="primary"><Video size={14} /> Join Meeting</Button>
                  </a>
                ) : (
                  <Button variant="secondary" disabled><Video size={14} /> Link pending</Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── STATS GRID ── */}
      <Grid cols={4}>
        <StatCard
          label="Top Match"
          value={hasAssessment ? `${stats.matchPct}%` : "—"}
          delta={topMatchTitle}
          Icon={Target}
        />
        <StatCard
          label="Milestones Done"
          value={stats.completedMilestones}
          delta={`Out of ${stats.totalMilestones}`}
          Icon={Award}
          accent
        />
        <StatCard
          label="Current Path"
          value={hasRoadmap ? "Active" : "None"}
          delta={careerTitle}
          Icon={BookOpen}
        />
        <StatCard
          label="Trust Score"
          value="98%"
          delta="Top 10% of users"
          Icon={TrendingUp}
        />
      </Grid>

      {/* ── MAIN CONTENT ── */}
      <TwoCol ratio="2:1">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Card title="Current Objective">
            {hasRoadmap ? (
              <div className={s.objectiveBlock}>
                <div className={s.objLeft}>
                  <CircularProgress progress={stats.roadmapProgress} size={80} strokeWidth={6} />
                </div>
                <div className={s.objRight}>
                  <h3>{careerTitle}</h3>
                  <p>You have completed {stats.completedMilestones} out of {stats.totalMilestones} required skills for this career.</p>
                  <Link to="/student/roadmap"><Button size="sm">Resume learning <ArrowRight size={14} /></Button></Link>
                </div>
              </div>
            ) : (
              <EmptyStep icon={Map} title="No active roadmap" text="Take the assessment to get personalized career recommendations and generate a custom learning path." cta="Start assessment" link="/student/assessment" />
            )}
          </Card>

          <Card title="Suggested Mentors">
            <div className={s.mentorList}>
              <div className={s.mentorEmpty}>
                <Users size={24} style={{ opacity: 0.5, marginBottom: 8 }} />
                <p>Complete your first milestone to unlock 1:1 mentor matchmaking.</p>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {hasRoadmap && (
            <Card title="Recent Badges">
              <div className={s.badgeGrid}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={s.badgePlaceholder}><Trophy size={20} /></div>
                ))}
              </div>
            </Card>
          )}

          <Card
            title="Notifications"
            action={notifications.length > 0 && (
              <span className={s.notifBadge}><Bell size={11} /> {notifications.length}</span>
            )}
          >
            {notifications.length === 0 ? (
              <p style={{ color: "var(--color-muted)", fontSize: 13, margin: 0 }}>You're all caught up.</p>
            ) : (
              <div className={s.notes}>
                {notifications.map((n, i) => (
                  <div key={i} className={s.note}>
                    <span className={s.noteDot} style={{ background: n.color }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={s.noteText}>{n.text}</div>
                      <div className={s.noteTime}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </TwoCol>
    </Page>
  );
}

function EmptyStep({ icon: Icon, title, text, cta, link }) {
  return (
    <div className={s.emptyStep}>
      <div className={s.emptyStepIcon}><Icon size={24} /></div>
      <h3 className={s.emptyStepTitle}>{title}</h3>
      <p>{text}</p>
      <Link to={link}><Button variant="accent"><Sparkles size={14} /> {cta}</Button></Link>
    </div>
  );
}