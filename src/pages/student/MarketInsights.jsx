// src/pages/student/MarketInsights.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar,
} from "recharts";
import { TrendingUp, Briefcase, Globe2, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { Page, PageHead, Grid } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./MarketInsights.module.css";

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
      setError(err.response?.data?.message || "Could not load market data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
          <Button onClick={fetchData}><RefreshCw size={14} style={{ marginRight: 6 }} /> Retry</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead title="Labor Market Insights" subtitle="Real-time signals from Pakistan's hiring market — salaries in PKR LPA." />

      <div className={s.tickerWrap}>
        <div className={s.tickerInner}>
          {[...data.ticker, ...data.ticker].map((t, i) => (
            <span key={i} className={s.tickerItem}>{t}</span>
          ))}
        </div>
      </div>

      <Grid cols={4}>
        {/* 🚨 FULLY DYNAMIC STAT CARDS 🚨 */}
        <StatCard label="Open roles" value={data.stats.openRoles.value} delta={data.stats.openRoles.delta} Icon={Briefcase} spark={data.stats.openRoles.spark} />
        <StatCard label="Avg. salary" value={data.stats.avgSalary.value} delta={data.stats.avgSalary.delta} Icon={DollarSign} spark={data.stats.avgSalary.spark} />
        <StatCard label="Remote share" value={data.stats.remoteShare.value} delta={data.stats.remoteShare.delta} Icon={Globe2} spark={data.stats.remoteShare.spark} accent />
        <StatCard label="Top growth" value={data.stats.topGrowth.value} delta={data.stats.topGrowth.delta} Icon={TrendingUp} spark={data.stats.topGrowth.spark} />
      </Grid>

      <Card title="Salary trends — 5 year view (PKR LPA)">
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={data.salaryYears} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.1)" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10, color: "rgba(255,255,255,0.7)" }} />
              
              {/* 🚨 FULLY DYNAMIC LINE CHART CATEGORIES & COLORS 🚨 */}
              {data.salaryCategories && data.salaryCategories.map((cat) => (
                <Line 
                  key={cat.name} 
                  type="monotone" 
                  dataKey={cat.name} 
                  stroke={cat.color} 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: cat.color }} 
                  activeDot={{ r: 6 }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className={s.twoCol}>
        <Card title="Top in-demand skills">
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={data.topSkills} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.1)" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                <YAxis dataKey="skill" type="category" stroke="rgba(255,255,255,0.1)" width={80} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600 }} />
                <Tooltip />
                <Bar dataKey="demand" fill="var(--color-primary)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Trending careers">
          <div className={s.trendList}>
            {data.trendingCareers && data.trendingCareers.length > 0 ? (
              data.trendingCareers.map((c, i) => (
                <div key={c.title} className={s.trendCard} style={{ borderLeftColor: c.color }}>
                  <div className={s.trendPulse} style={{ background: c.color, color: c.color, boxShadow: `0 0 10px ${c.color}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={s.trendTitle}>{c.title}</div>
                    <div className={s.trendGrowth}>{c.growth} growth YoY</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                No trending data available.
              </div>
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}