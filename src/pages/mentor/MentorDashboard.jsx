import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, CalendarCheck, MessageSquare, Star } from "lucide-react";
import { Page, PageHead, Grid } from "../../components/common/Page.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import { Select } from "../../components/common/Field.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import api from "../../lib/axios.js";
import s from "./MentorDashboard.module.css";

export default function MentorDashboard() {
  const [mentees, setMentees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    const fetchMentees = async () => {
      try {
        const { data } = await api.get('/mentor/mentees');
        setMentees(data);
      } catch (err) {
        console.error("Failed to load mentees", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMentees();
  }, []);

  const filtered = useMemo(() => mentees.filter((m) =>
    (status === "All" || m.status === status) &&
    (m.name.toLowerCase().includes(q.toLowerCase()) || m.program.toLowerCase().includes(q.toLowerCase()))
  ), [mentees, q, status]);

  if (isLoading) return <Page><div style={{display:'grid', placeItems:'center', height:'50vh'}}><CircularProgress value={0} size={50} stroke={4}/></div></Page>;

  return (
    <Page>
      <PageHead title="Mentor Dashboard" subtitle="Your roster of students from the database." />

      <Grid cols={4}>
        <StatCard label="Active mentees" value={mentees.length} delta="Real-time data" Icon={Users} />
        <StatCard label="Sessions this week" value="0" delta="No sessions yet" Icon={CalendarCheck} />
        <StatCard label="Unread messages" value="0" delta="All caught up" Icon={MessageSquare} />
        <StatCard label="Avg rating" value="N/A" delta="Awaiting feedback" Icon={Star} />
      </Grid>

      <Card title="Registered Students" action={
        <div className={s.controls}>
          <input className={s.search} placeholder="Search by name or program…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option><option>Active</option><option>At risk</option>
          </Select>
        </div>
      }>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Name</th><th>Program</th><th>Progress</th><th>Status</th><th>Last active</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className={s.name}>
                      <div className={s.avatar}>{m.name.split(" ").map((x) => x[0]).join("").toUpperCase()}</div>
                      {m.name}
                    </div>
                  </td>
                  <td>{m.program}</td>
                  <td><div className={s.progressWrap}><ProgressBar value={m.progress} /></div></td>
                  <td><Badge tone={m.status === "Active" ? "primary" : "warn"}>{m.status}</Badge></td>
                  <td style={{ color: "var(--color-muted)" }}>{m.lastActive}</td>
                  <td><Link to={`/mentor/mentees/${m.id}`} className={s.linkRow}>View</Link></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{textAlign: "center", padding: 20}}>No students found in the database.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  );
}