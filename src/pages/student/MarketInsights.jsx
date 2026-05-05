import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";
import { TrendingUp, Briefcase, Globe2, DollarSign } from "lucide-react";
import { Page, PageHead, Grid } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import api from "../../lib/axios.js"; // IMPORT YOUR API
import s from "./MarketInsights.module.css";

export default function MarketInsights() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await api.get('/market/insights');
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch market data:", err);
        setError("Could not load real-time market data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMarketData();
  }, []);

  if (isLoading) {
    return (
      <Page>
        <div style={{ display: 'grid', placeItems: 'center', height: '50vh', color: 'var(--color-muted)' }}>
          <CircularProgress value={0} size={60} stroke={4} />
          <p style={{ marginTop: "16px" }}>Analyzing global labor market data...</p>
        </div>
      </Page>
    );
  }

  if (error) return <Page><div style={{ color: "red", padding: "20px" }}>{error}</div></Page>;

  return (
    <Page>
      <PageHead title="Labor Market Insights" subtitle="Real-time signals from the global hiring market." />

      <div className={s.tickerWrap}>
        <div className={s.tickerInner}>
          {[...data.ticker, ...data.ticker].map((t, i) => <span key={i} className={s.tickerItem}>{t}</span>)}
        </div>
      </div>

      <Grid cols={4}>
        <StatCard label="Open roles" value={data.stats.openRoles} delta="+12%" Icon={Briefcase} spark={[12,14,15,18,22,28,35]} />
        <StatCard label="Avg. salary" value={data.stats.avgSalary} delta="+6%" Icon={DollarSign} spark={[78,82,90,98,108,118]} />
        <StatCard label="Remote share" value={data.stats.remoteShare} delta="+4%" Icon={Globe2} spark={[22,26,29,33,37,41]} accent />
        <StatCard label="Top growth" value={data.stats.topGrowthField} delta="+48%" Icon={TrendingUp} spark={[8,12,18,28,36,48]} />
      </Grid>

      <Card title="Salary trends — 5 year view (in $k)">
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={data.salaryYears} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Software" stroke="#52a447" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Data" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Design" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Cyber" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Cloud" stroke="#0891b2" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className={s.twoCol}>
        <Card title="Top in-demand skills">
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={data.topSkills} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                <YAxis dataKey="skill" type="category" stroke="#64748b" width={70} />
                <Tooltip />
                <Bar dataKey="demand" fill="#52a447" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Trending careers">
          <div className={s.trendList}>
            {data.trendingCareers.map((c) => (
              <div key={c.title} className={s.trendCard} style={{ borderLeftColor: c.color }}>
                <div className={s.trendPulse} style={{ background: c.color }} />
                <div>
                  <div className={s.trendTitle}>{c.title}</div>
                  <div className={s.trendGrowth}>{c.growth} growth</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}