// src/pages/student/StudentDashboard.jsx
//
// Pulls a single aggregated payload from /users/dashboard.
// Backend assembles latest assessment + active roadmap + notifications
// into one response, so we get a snappy single-request dashboard.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Award,
  BookOpen,
  TrendingUp,
  Check,
  Sparkles,
  ArrowRight,
  ClipboardCheck,
  Map,
  Trophy,
  Bell,
  AlertCircle,
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
          setError(
            err.response?.data?.message || "Could not load your dashboard."
          );
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

  const firstName = user?.name?.split(" ")[0] || "there";

  // ── Pull from API payload ────────────────────────────────────────
  const {
    hasAssessment,
    hasRoadmap,
    assessmentProgress,
    hollandCode,
    topMatch,
    stats,
    milestones,
    milestoneStats,
    skills,
    notifications,
  } = data;

  return (
    <Page>
      {/* ── Hero welcome ─────────────────────────────────────── */}
      <div className={s.welcome}>
        <div className={s.welcomeText}>
          <span className={s.eyebrow}>Student Portal</span>
          <h2 className={s.welcomeTitle}>
            Hi {firstName} <span className={s.wave}>👋</span>
          </h2>
          <p className={s.welcomeBlurb}>
            {!hasAssessment
              ? "Start with a quick career assessment — 63 questions to map your strengths."
              : !hasRoadmap
                ? `You're a great match for ${topMatch?.title}. Generate a roadmap to start building skills.`
                : `You've completed ${milestoneStats.completed} of ${milestoneStats.total} milestones. Keep the momentum going.`}
          </p>
          <div className={s.welcomeActions}>
            {!hasAssessment ? (
              <Link to="/student/assessment">
                <Button variant="accent" size="lg">
                  <ClipboardCheck size={16} /> Start assessment
                </Button>
              </Link>
            ) : !hasRoadmap ? (
              <Link to="/student/recommendations">
                <Button variant="accent" size="lg">
                  <Sparkles size={16} /> See recommendations
                </Button>
              </Link>
            ) : (
              <Link to="/student/roadmap">
                <Button variant="accent" size="lg">
                  <Map size={16} /> Continue roadmap
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className={s.welcomeRight}>
          <div className={s.welcomeRingWrap}>
            <CircularProgress
              value={assessmentProgress}
              size={150}
              stroke={11}
              label="Profile"
            />
          </div>
        </div>
      </div>

      {/* ── Stats grid ───────────────────────────────────────── */}
      <Grid cols={4}>
        <StatCard
          label="Top match"
          value={hasAssessment ? `${stats.match}%` : "—"}
          delta={topMatch?.title || "Take assessment"}
          Icon={Target}
          spark={hasAssessment ? [55, 62, 68, 72, 78, stats.match] : [0, 0, 0, 0, 0, 0]}
        />
        <StatCard
          label="Holland code"
          value={hollandCode || "—"}
          delta={hasAssessment ? "Personality profile" : "Not assessed"}
          Icon={Award}
          accent
        />
        <StatCard
          label="Milestones done"
          value={hasRoadmap ? `${milestoneStats.completed}/${milestoneStats.total}` : "0"}
          delta={hasRoadmap ? `${milestoneStats.pct}% complete` : "No roadmap yet"}
          Icon={BookOpen}
          spark={
            hasRoadmap
              ? [0, 1, 2, milestoneStats.completed, milestoneStats.completed, milestoneStats.completed]
              : [0, 0, 0, 0, 0, 0]
          }
        />
        <StatCard
          label="Profile strength"
          value={`${assessmentProgress}%`}
          delta={assessmentProgress === 100 ? "Complete" : "In progress"}
          Icon={TrendingUp}
          spark={[20, 35, 50, 65, 80, assessmentProgress]}
        />
      </Grid>

      {/* ── Two-column main ──────────────────────────────────── */}
      <TwoCol ratio="2:1">
        <Card
          title={hasRoadmap ? "Your roadmap progress" : "Get started"}
          action={
            hasRoadmap && (
              <Link to="/student/roadmap" className={s.cardLink}>
                View all <ArrowRight size={14} />
              </Link>
            )
          }
        >
          {!hasAssessment ? (
            <EmptyStep
              icon={ClipboardCheck}
              title="Take the career assessment"
              text="63 research-backed questions covering personality (RIASEC), skills, and interests."
              cta="Start assessment"
              link="/student/assessment"
            />
          ) : !hasRoadmap ? (
            <EmptyStep
              icon={Sparkles}
              title="Generate your skill roadmap"
              text={`Pick a career like ${topMatch?.title} and get a personalized 12-month learning plan.`}
              cta="See recommendations"
              link="/student/recommendations"
            />
          ) : (
            <ul className={s.timeline}>
              {milestones.map((m, i) => (
                <li key={i} className={s.tlItem}>
                  <div className={`${s.tlDot} ${m.done ? s.tlDone : ""}`}>
                    {m.done ? <Check size={14} /> : i + 1}
                  </div>
                  <div className={s.tlBody}>
                    <div className={`${s.tlTitle} ${m.done ? s.tlTitleDone : ""}`}>
                      {m.title}
                    </div>
                    <div className={s.tlMeta}>{m.meta}</div>
                  </div>
                  {m.done && (
                    <span className={s.medal} title="Completed">
                      <Trophy size={13} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className={s.sideCol}>
          {skills.length > 0 && (
            <Card title="Your top skills">
              <div className={s.skills}>
                {skills.map((sk) => (
                  <ProgressBar key={sk.name} label={sk.name} value={sk.value} />
                ))}
              </div>
            </Card>
          )}

          <Card
            title="Notifications"
            action={
              notifications.length > 0 && (
                <span className={s.notifBadge}>
                  <Bell size={11} /> {notifications.length}
                </span>
              )
            }
          >
            {notifications.length === 0 ? (
              <p style={{ color: "var(--color-muted)", fontSize: 13, margin: 0 }}>
                You're all caught up.
              </p>
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

      {hasAssessment && topMatch && (
        <Card
          title="Your top career match"
          action={<Badge tone="primary">{stats.match}% match</Badge>}
        >
          <div className={s.matchCard}>
            <div className={s.matchHead}>
              <h3 className={s.matchTitle}>{topMatch.title}</h3>
              <div className={s.matchMeta}>
                {topMatch.cluster && <Badge tone="default">{topMatch.cluster}</Badge>}
                {topMatch.salary && <span>💰 {topMatch.salary}</span>}
              </div>
            </div>
            {topMatch.reasoning && (
              <p className={s.matchReason}>{topMatch.reasoning}</p>
            )}
            <Link to="/student/recommendations">
              <Button variant="secondary" size="sm">
                View full breakdown <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </Page>
  );
}

function EmptyStep({ icon: Icon, title, text, cta, link }) {
  return (
    <div className={s.emptyStep}>
      <div className={s.emptyStepIcon}>
        <Icon size={24} />
      </div>
      <h3 className={s.emptyStepTitle}>{title}</h3>
      <p className={s.emptyStepText}>{text}</p>
      <Link to={link}>
        <Button variant="accent">
          {cta} <ArrowRight size={14} />
        </Button>
      </Link>
    </div>
  );
}