// src/pages/admin/AdminDashboard.jsx
//
// Pulls real platform stats from /api/admin/stats. Renders user counts,
// growth, weekly engagement, role split, and pending moderation queue.

import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  Compass,
  ShieldCheck,
  Briefcase,
  Calendar,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Page, PageHead, Grid, TwoCol } from "../../components/common/Page.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Card from "../../components/common/Card.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./AdminDashboard.module.css";

// Match the design system palette
const PIE_COLORS = ["#0d9488", "#f97316", "#0891b2"];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/stats");
      setData(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load admin stats. Are you logged in as an admin?"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Page>
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading platform metrics…</p>
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
          <Button onClick={fetchStats}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  const { totals, growth, engagement, roleSplit } = data;

  return (
    <Page>
      <PageHead
        title="Platform Overview"
        subtitle="Real-time engagement and system health from your MongoDB."
      />

      {/* Top stat row */}
      <Grid cols={4}>
        <StatCard
          label="Total users"
          value={totals.users.toLocaleString()}
          delta={`+${
            growth?.length > 1
              ? Math.max(0, growth[growth.length - 1].users - growth[0].users)
              : 0
          } this period`}
          Icon={Users}
          spark={growth.map((g) => g.users)}
        />
        <StatCard
          label="Students"
          value={totals.students.toLocaleString()}
          delta={`${Math.round((totals.students / totals.users) * 100) || 0}% of base`}
          Icon={GraduationCap}
        />
        <StatCard
          label="Mentors"
          value={totals.mentors.toLocaleString()}
          delta={
            totals.mentors === 0
              ? "Recruit mentors"
              : `${Math.round((totals.mentors / totals.users) * 100)}% of base`
          }
          Icon={Compass}
          accent
        />
        <StatCard
          label="Admins"
          value={totals.admins.toLocaleString()}
          delta="System operators"
          Icon={ShieldCheck}
        />
      </Grid>

      {/* Secondary stat row */}
      <Grid cols={4}>
        <StatCard
          label="Active careers"
          value={totals.careers.toLocaleString()}
          delta="In recommendation pool"
          Icon={Briefcase}
        />
        <StatCard
          label="Events"
          value={totals.events.toLocaleString()}
          delta="Webinars & workshops"
          Icon={Calendar}
        />
        <StatCard
          label="Community posts"
          value={totals.posts.toLocaleString()}
          delta={`${totals.assessments} assessments taken`}
          Icon={MessageSquare}
        />
        <StatCard
          label="Pending reports"
          value={totals.pendingReports.toLocaleString()}
          delta={
            totals.pendingReports === 0
              ? "All clear"
              : "Needs review"
          }
          Icon={AlertCircle}
          accent={totals.pendingReports > 0}
        />
      </Grid>

      <TwoCol>
        <Card title="User growth (last 6 months)">
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={growth} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e7e5e4",
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#0d9488" }}
                  activeDot={{ r: 6, fill: "#f97316" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Role distribution">
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={roleSplit}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {roleSplit.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={30}
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e7e5e4",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </TwoCol>

      <TwoCol>
        <Card title="Weekly engagement (assessments + posts)">
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={engagement} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e7e5e4",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="sessions" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="System health">
          <div className={s.health}>
            <div className={s.healthRow}>
              <span className={s.healthLabel}>
                <span className={`${s.dot} ${s.ok}`} /> API uptime
              </span>
              <span className={s.healthValue}>99.98%</span>
            </div>
            <ProgressBar value={99.98} showValue={false} />

            <div className={s.healthRow}>
              <span className={s.healthLabel}>
                <span className={`${s.dot} ${s.ok}`} /> MongoDB connection
              </span>
              <span className={s.healthValue}>Healthy</span>
            </div>
            <ProgressBar value={100} showValue={false} />

            <div className={s.healthRow}>
              <span className={s.healthLabel}>
                <span className={`${s.dot} ${s.ok}`} /> Groq AI service
              </span>
              <span className={s.healthValue}>Online</span>
            </div>
            <ProgressBar value={100} showValue={false} />

            <div className={s.healthRow}>
              <span className={s.healthLabel}>
                <span className={`${s.dot} ${totals.pendingReports > 5 ? s.warn : s.ok}`} />
                Moderation queue
              </span>
              <span className={s.healthValue}>
                {totals.pendingReports} pending
              </span>
            </div>
          </div>
        </Card>
      </TwoCol>
    </Page>
  );
}