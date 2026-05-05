import React, { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { Page, PageHead, TwoCol } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import api from "../../lib/axios.js";
import s from "./Recommendations.module.css";

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const response = await api.get('/assessment/recommendations');
        setData(response.data);
      } catch (err) {
        console.error("Failed to load recommendations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecs();
  }, []);

  if (isLoading) return <Page><div style={{display:'grid', placeItems:'center', height:'50vh'}}><CircularProgress value={0} size={50} stroke={4}/></div></Page>;

  return (
    <Page>
      <PageHead title="Recommendations & Insights" subtitle="Top career matches based on your assessment." />

      <div className={s.matches}>
        {data.careers.map((c) => (
          <article key={c.id} className={s.match}>
            <div className={s.matchHead}>
              <div className={s.matchTitle}>{c.title}</div>
              <span className={s.pct}>{c.match}% match</span>
            </div>
            <div className={s.meta}>
              <span>💰 {c.salary}</span>
              <span>📈 {c.growth} growth</span>
            </div>
            <div className={s.skills}>
              {c.skills.map((sk) => <span key={sk} className={s.tag}>{sk}</span>)}
            </div>
          </article>
        ))}
      </div>

      <TwoCol>
        <Card title="Salary trend (USD, k)">
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={data.salaryTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="salary" stroke="#52a447" strokeWidth={3} dot={{ r: 4, fill: "#52a447" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Your skill strengths">
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.skillStrength} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#52a447" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </TwoCol>

      <Card title="Recommended job opportunities" action={<Badge tone="info">{data.jobs.length} open</Badge>}>
        <div className={s.jobs}>
          {data.jobs.map((j) => (
            <div key={j.id} className={s.job}>
              <div>
                <div className={s.jobTitle}>{j.title}</div>
                <div className={s.jobMeta}>{j.company} · {j.location}</div>
              </div>
              <Badge>{j.tag}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}