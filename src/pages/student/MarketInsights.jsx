// src/pages/student/MarketInsights.jsx
//
// Fully dynamic: pulls from /market/insights, renders with recharts.

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  Briefcase,
  Globe2,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Page, PageHead, Grid } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./MarketInsights.module.css";

// Color palette aligned with new design system
const CHART_COLORS = {
  Software: "#0d9488",
  Data: "#7c3aed",
  Design: "#f97316",
  Cyber: "#dc2626",
  Cloud: "#0891b2",
};

export default function MarketInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/market/insights");
      setData(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load market data. Has the backend been seeded?"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Page>
        <PageHead title="Labor Market Insights" />
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Analyzing Pakistan's labor market…</p>
        </div>
      </Page>
    );
  }

  if (error || !data) {
    return (
      <Page>
        <PageHead title="Labor Market Insights" />
        <div className={s.errorState}>
          <AlertCircle size={28} />
          <h3>Could not load market data</h3>
          <p>{error}</p>
          <Button onClick={fetchData}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Labor Market Insights"
        subtitle="Real-time signals from Pakistan's hiring market — salaries in PKR LPA (Lakhs Per Annum)."
      />

      {/* Scrolling ticker */}
      <div className={s.tickerWrap}>
        <div className={s.tickerInner}>
          {[...data.ticker, ...data.ticker].map((t, i) => (
            <span key={i} className={s.tickerItem}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <Grid cols={4}>
        <StatCard
          label="Open roles"
          value={data.stats.openRoles}
          delta="+12% YoY"
          Icon={Briefcase}
          spark={[12, 14, 15, 18, 22, 28, 35]}
        />
        <StatCard
          label="Avg. salary"
          value={data.stats.avgSalary}
          delta="+18% YoY"
          Icon={DollarSign}
          spark={[78, 82, 90, 98, 108, 118]}
        />
        <StatCard
          label="Remote share"
          value={data.stats.remoteShare}
          delta="+4% MoM"
          Icon={Globe2}
          spark={[22, 26, 29, 33, 37, 41]}
          accent
        />
        <StatCard
          label="Top growth"
          value={data.stats.topGrowthField}
          delta="+142%"
          Icon={TrendingUp}
          spark={[8, 12, 18, 28, 36, 48]}
        />
      </Grid>

      {/* Salary trend line chart */}
      <Card title="Salary trends — 5 year view (PKR LPA)">
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart
              data={data.salaryYears}
              margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis dataKey="year" stroke="#78716c" tick={{ fontSize: 12 }} />
              <YAxis stroke="#78716c" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e7e5e4",
                  borderRadius: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
              {Object.entries(CHART_COLORS).map(([key, color]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: color }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two-column: skills + trending */}
      <div className={s.twoCol}>
        <Card title="Top in-demand skills">
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={data.topSkills} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="#78716c"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  dataKey="skill"
                  type="category"
                  stroke="#78716c"
                  width={80}
                  tick={{ fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e7e5e4",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="demand" fill="#0d9488" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Trending careers">
          <div className={s.trendList}>
            {data.trendingCareers.map((c, i) => (
              <div
                key={c.title}
                className={s.trendCard}
                style={{
                  borderLeftColor: c.color,
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <div className={s.trendPulse} style={{ background: c.color, color: c.color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={s.trendTitle}>{c.title}</div>
                  <div className={s.trendGrowth}>{c.growth} growth YoY</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}