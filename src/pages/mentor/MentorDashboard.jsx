// src/pages/mentor/MentorDashboard.jsx
//
// Pulls /api/mentor/dashboard for an aggregated payload.
// Shows stats, mentees needing attention, recent assessments, progress chart.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  MessageSquare,
  Star,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Page, PageHead, Grid, TwoCol } from "../../components/common/Page.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import Avatar from "../../components/common/Avatar.jsx";
import api from "../../lib/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import s from "./MentorDashboard.module.css";

export default function MentorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/mentor/dashboard");
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Page>
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading mentor dashboard…</p>
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
          <Button onClick={fetchDashboard}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  const { stats, mentees, recentlyAssessed } = data;
  const firstName = user?.name?.split(" ")[0] || "Mentor";

  // Compute action items
  const needsAttention = mentees.filter(
    (m) =>
      m.status === "onboarding" ||
      m.status === "needs-roadmap" ||
      m.status === "inactive"
  );

  // Progress distribution chart data
  const progressBuckets = [
    { range: "0%", count: mentees.filter((m) => m.progress === 0).length, color: "#dc2626" },
    { range: "1-25%", count: mentees.filter((m) => m.progress > 0 && m.progress <= 25).length, color: "#f97316" },
    { range: "26-50%", count: mentees.filter((m) => m.progress > 25 && m.progress <= 50).length, color: "#eab308" },
    { range: "51-75%", count: mentees.filter((m) => m.progress > 50 && m.progress <= 75).length, color: "#14b8a6" },
    { range: "76-100%", count: mentees.filter((m) => m.progress > 75).length, color: "#0d9488" },
  ];

  return (
    <Page>
      {/* Welcome hero */}
      <div className={s.welcome}>
        <div className={s.welcomeText}>
          <span className={s.eyebrow}>Mentor Portal</span>
          <h2 className={s.welcomeTitle}>
            Hi {firstName} <span className={s.wave}>👋</span>
          </h2>
          <p className={s.welcomeBlurb}>
            You're guiding {stats.activeMentees} {stats.activeMentees === 1 ? "student" : "students"} on their career journey.
            {needsAttention.length > 0 &&
              ` ${needsAttention.length} need your attention today.`}
          </p>
          <div className={s.welcomeActions}>
            <Link to="/mentor/sessions">
              <Button variant="accent" size="lg">
                <Calendar size={16} /> Schedule a session
              </Button>
            </Link>
            <Link to="/mentor/mentees">
              <Button variant="secondary" size="lg">
                View all mentees <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stat row */}
      <Grid cols={4}>
        <StatCard
          label="Active mentees"
          value={stats.activeMentees}
          delta="Real-time"
          Icon={Users}
        />
        <StatCard
          label="Sessions this week"
          value={stats.sessionsThisWeek}
          delta={stats.sessionsThisWeek === 0 ? "None scheduled" : "Upcoming"}
          Icon={Calendar}
          accent
        />
        <StatCard
          label="Unread messages"
          value={stats.unreadMessages}
          delta={stats.unreadMessages === 0 ? "All caught up" : "Needs reply"}
          Icon={MessageSquare}
        />
        <StatCard
          label="Avg rating"
          value={stats.avgRating}
          delta="Awaiting feedback"
          Icon={Star}
        />
      </Grid>

      <TwoCol ratio="2:1">
        {/* Action items */}
        <Card
          title="Mentees needing attention"
          action={
            needsAttention.length > 0 && (
              <Link to="/mentor/insights" className={s.cardLink}>
                See all insights <ArrowRight size={14} />
              </Link>
            )
          }
        >
          {needsAttention.length === 0 ? (
            <div className={s.emptyAction}>
              <div className={s.emptyIcon}>
                <Sparkles size={24} />
              </div>
              <div>
                <strong>You're all caught up.</strong>
                <p>Every mentee is on track. Schedule check-ins via Sessions.</p>
              </div>
            </div>
          ) : (
            <ul className={s.actionList}>
              {needsAttention.slice(0, 5).map((m) => (
                <li key={m.id} className={s.actionItem}>
                  <Avatar src={m.avatar} name={m.name} size={36} fontSize={12} />
                  <div className={s.actionBody}>
                    <div className={s.actionName}>{m.name}</div>
                    <div className={s.actionReason}>
                      {m.status === "onboarding" && "Hasn't taken assessment yet"}
                      {m.status === "needs-roadmap" && "Needs to generate a roadmap"}
                      {m.status === "inactive" && `Inactive for ${m.lastAssessmentDays}+ days`}
                    </div>
                  </div>
                  <Badge
                    tone={
                      m.status === "onboarding"
                        ? "warning"
                        : m.status === "inactive"
                          ? "danger"
                          : "accent"
                    }
                  >
                    {m.statusDisplay}
                  </Badge>
                  <Link to={`/mentor/mentees/${m.id}`}>
                    <Button variant="ghost" size="sm">
                      Open →
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent assessments */}
        <Card title="Recent assessments">
          {recentlyAssessed.length === 0 ? (
            <p className={s.emptyMini}>No recent assessment activity.</p>
          ) : (
            <ul className={s.recentList}>
              {recentlyAssessed.map((m) => (
                <li key={m.id} className={s.recentItem}>
                  <Avatar src={m.avatar} name={m.name} size={36} fontSize={12} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={s.recentName}>{m.name}</div>
                    <div className={s.recentMeta}>
                      {m.hollandCode && (
                        <span className={s.hollandPill}>{m.hollandCode}</span>
                      )}
                      <span>
                        <Clock size={11} /> {m.lastAssessmentDays}d ago
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </TwoCol>

      {/* Progress distribution chart */}
      <Card title="Mentee progress distribution">
        {mentees.length === 0 ? (
          <p className={s.emptyMini}>No mentees yet.</p>
        ) : (
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart
                data={progressBuckets}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 12, fill: "#78716c" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#78716c" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e7e5e4",
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(v) => [`${v} ${v === 1 ? "mentee" : "mentees"}`, "Count"]}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {progressBuckets.map((b, i) => (
                    <Cell key={i} fill={b.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Top mentees teaser */}
      <Card
        title="All registered students"
        action={
          <Link to="/mentor/mentees" className={s.cardLink}>
            View all <ArrowRight size={14} />
          </Link>
        }
      >
        <div className={s.menteeTable}>
          <div className={s.menteeHead}>
            <span>Name</span>
            <span>Program</span>
            <span>Progress</span>
            <span>Status</span>
            <span>Last active</span>
            <span></span>
          </div>
          {mentees.slice(0, 6).map((m) => (
            <div key={m.id} className={s.menteeRow}>
              <span className={s.menteeName}>
                <Avatar src={m.avatar} name={m.name} size={32} fontSize={11} />
                {m.name}
              </span>
              <span className={s.muted}>{m.program}</span>
              <span className={s.progressCell}>
                <div className={s.progressBar}>
                  <div
                    className={s.progressFill}
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
                <span>{m.progressDisplay}</span>
              </span>
              <span>
                <Badge
                  tone={
                    m.status === "excelling"
                      ? "success"
                      : m.status === "active"
                        ? "primary"
                        : m.status === "inactive"
                          ? "danger"
                          : "warning"
                  }
                >
                  {m.statusDisplay}
                </Badge>
              </span>
              <span className={s.muted}>{m.lastActiveLabel}</span>
              <span>
                <Link to={`/mentor/mentees/${m.id}`}>
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              </span>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}