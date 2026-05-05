import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Target, Award, BookOpen, TrendingUp, Check, Trophy } from "lucide-react";
import { Page, Grid, TwoCol } from "../../components/common/Page.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Card from "../../components/common/Card.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
// IMPORT YOUR AXIOS API:
import api from "../../lib/axios.js"; 
import s from "./StudentDashboard.module.css";

export default function StudentDashboard() {
  const { user } = useAuth();
  
  // 1. Setup State for our dynamic data
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 2. Fetch the data from the backend when the dashboard loads
  useEffect(() => {
    const fetchDashboardInfo = async () => {
      try {
        // This calls http://localhost:5000/api/users/dashboard
        const response = await api.get('/users/dashboard'); 
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardInfo();
  }, []);

  // 3. Show a loading screen while waiting for the database
  if (isLoading) {
    return (
      <Page>
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-muted)" }}>
          <CircularProgress value={0} size={60} stroke={4} />
          <p style={{ marginTop: "16px" }}>Loading your personalized dashboard, {user?.name?.split(" ")[0]}...</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return <Page><div style={{ color: "red", padding: "20px" }}>{error}</div></Page>;
  }

  // 4. Render the page using the DYNAMIC data from the backend
  return (
    <Page>
      <div className={s.welcome}>
        <div className={s.welcomeText}>
          <span className={s.eyebrow}>Student Portal</span>
          <h2>Hi {user?.name?.split(" ")[0]} {user?.avatar || "👋"}</h2>
          <p>Pick up where you left off — your next step is the career assessment.</p>
          <Link to="/student/assessment"><button className={s.cta}>Continue assessment</button></Link>
        </div>
        <div className={s.welcomeRight}>
          <CircularProgress value={data.assessmentProgress} size={140} stroke={12} label="Profile" />
        </div>
      </div>

      <Grid cols={4}>
        <StatCard label="Career match" value={`${data.stats.match}%`} delta="+4 this week" Icon={Target} spark={[60,68,72,70,78,82,87]} />
        <StatCard label="Assessment" value={`${data.assessmentProgress}%`} delta={data.assessmentProgress === 100 ? "Completed" : "Resume now"} Icon={Award} accent />
        <StatCard label="Courses in progress" value={data.stats.courses} delta="+1 this month" Icon={BookOpen} spark={[1,1,2,2,3,3,3]} />
        <StatCard label="Skill growth" value={data.stats.growth} delta="last 30 days" Icon={TrendingUp} spark={[5,8,10,12,14,16,18]} />
      </Grid>

      <TwoCol>
        <Card title="Your career milestones" action={<span className={s.badgeGold}><Trophy size={12} /> {data.milestones.filter(m => m.done).length} unlocked</span>}>
          <ul className={s.timeline}>
            {data.milestones.map((m, i) => (
              <li key={i} className={s.tlItem}>
                <div className={`${s.tlDot} ${m.done ? s.tlDone : ""}`}>
                  {m.done ? <Check size={14} /> : i + 1}
                </div>
                <div className={s.tlBody}>
                  <div className={s.tlTitle}>{m.title}</div>
                  <div className={s.tlMeta}>{m.meta}</div>
                </div>
                {m.done && <span className={s.medal}><Trophy size={14} /></span>}
              </li>
            ))}
          </ul>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Recent skill progress">
            <div className={s.skills}>
              {data.skills.map((sk) => <ProgressBar key={sk.name} label={sk.name} value={sk.value} />)}
            </div>
          </Card>
          
          <Card title="Notifications">
            <div className={s.notes}>
              {data.notifications.map((n, i) => (
                <div key={i} className={s.note}>
                  <span className={s.noteDot} style={{ background: n.color }} />
                  <div>
                    <div>{n.text}</div>
                    <div className={s.noteTime}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </TwoCol>
    </Page>
  );
}