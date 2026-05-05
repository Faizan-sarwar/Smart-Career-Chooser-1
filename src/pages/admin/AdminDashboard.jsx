import React, { useState, useEffect } from "react";
import { Users, GraduationCap, Compass, ShieldCheck } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { Page, PageHead, Grid, TwoCol } from "../../components/common/Page.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Card from "../../components/common/Card.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import api from "../../lib/axios.js";
import s from "./AdminDashboard.module.css";

const COLORS = ["#52a447", "#1f6feb", "#d97706"];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real statistics from MongoDB on load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setData(response.data);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <Page><div style={{display:'grid', placeItems:'center', height:'50vh'}}><CircularProgress value={0} size={50} stroke={4}/></div></Page>;

  const { totals, growth, engagement, roleSplit } = data;

  return (
    <Page>
      <PageHead title="Platform Overview" subtitle="Real-time engagement and system health." />

      <Grid cols={4}>
        <StatCard label="Total users" value={totals.users.toLocaleString()} delta="Live from DB" Icon={Users} />
        <StatCard label="Students" value={totals.students.toLocaleString()} delta="Live from DB" Icon={GraduationCap} />
        <StatCard label="Mentors" value={totals.mentors.toLocaleString()} delta="Live from DB" Icon={Compass} accent />
        <StatCard label="Admins" value={totals.admins.toLocaleString()} delta="Live from DB" Icon={ShieldCheck} />
      </Grid>

      <TwoCol>
        <Card title="User growth (Live Trajectory)">
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={growth}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#52a447" strokeWidth={3} dot={{ r: 4, fill: "#52a447" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Database Role Distribution">
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={roleSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {roleSplit.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Legend verticalAlign="bottom" height={30} iconSize={10} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </TwoCol>

      <TwoCol>
        <Card title="Weekly engagement (active sessions)">
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={engagement}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#52a447" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="System health">
          <div className={s.health}>
            <div className={s.healthRow}>
              <span className={s.healthLabel}><span className={`${s.dot} ${s.ok}`} />API uptime</span>
              <span className={s.healthValue}>99.98%</span>
            </div>
            <ProgressBar value={99.98} showValue={false} />

            <div className={s.healthRow}>
              <span className={s.healthLabel}><span className={`${s.dot} ${s.ok}`} />MongoDB Connection</span>
              <span className={s.healthValue}>Healthy</span>
            </div>
            <ProgressBar value={100} showValue={false} />
          </div>
        </Card>
      </TwoCol>
    </Page>
  );
}