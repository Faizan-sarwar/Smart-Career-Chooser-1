import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import { Page, PageHead, TwoCol, Grid } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import { mentees } from "../../data/mentor.js";
import { skillStrength } from "../../data/careers.js";
import s from "./MenteeDetail.module.css";

export default function MenteeDetail() {
  const { id } = useParams();
  const m = mentees.find((x) => x.id === id) || mentees[0];
  const [notes, setNotes] = useState("");

  const gaps = [
    { name: "Communication", value: 60 },
    { name: "Leadership", value: 45 },
    { name: "Project planning", value: 52 },
  ];

  return (
    <Page>
      <PageHead
        title="Mentee Profile"
        subtitle={<Link to="/mentor/dashboard" style={{ color: "var(--color-primary-dark)" }}>← Back to roster</Link>}
        action={<Button>Schedule session</Button>}
      />

      <div className={s.header}>
        <div className={s.avatar}>{m.name.split(" ").map((x) => x[0]).join("")}</div>
        <div className={s.info}>
          <div className={s.name}>{m.name}</div>
          <div className={s.meta}>{m.program} · last active {m.lastActive}</div>
        </div>
        <Badge tone={m.status === "Active" ? "primary" : "warn"}>{m.status}</Badge>
      </div>

      <Grid cols={3}>
        <Card title="Overall progress">
          <ProgressBar value={m.progress} label="Program completion" />
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--color-muted)" }}>On track to finish in 4 weeks.</div>
        </Card>
        <Card title="Top match">
          <div style={{ fontSize: 18, fontWeight: 700 }}>Software Engineer</div>
          <div style={{ color: "var(--color-muted)", fontSize: 13 }}>92% fit</div>
        </Card>
        <Card title="Mentor sessions">
          <div style={{ fontSize: 18, fontWeight: 700 }}>7 completed</div>
          <div style={{ color: "var(--color-muted)", fontSize: 13 }}>Next: Tue, 3:00 PM</div>
        </Card>
      </Grid>

      <TwoCol>
        <Card title="Skill profile">
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <RadarChart data={skillStrength}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Radar dataKey="value" stroke="#52a447" fill="#52a447" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Skill gaps to focus on">
            <div className={s.skills}>
              {gaps.map((g) => <ProgressBar key={g.name} label={g.name} value={g.value} />)}
            </div>
          </Card>
          <Card title="Mentor notes">
            <div className={s.notes}>
              <textarea placeholder="Add private notes about this mentee…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </Card>
        </div>
      </TwoCol>
    </Page>
  );
}
