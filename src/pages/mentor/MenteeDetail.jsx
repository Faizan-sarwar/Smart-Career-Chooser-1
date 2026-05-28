// src/pages/mentor/MenteeDetail.jsx
//
// UPDATED — adds a "View CV" button in the header. Visible only if
// the student has uploaded a CV. Opens the PDF in a new tab.

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Tooltip,
} from "recharts";
import {
  AlertCircle, RefreshCw, Save, Loader2, CalendarPlus, FileText,
} from "lucide-react";
import { Page, PageHead, TwoCol, Grid } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import api from "../../lib/axios.js";
import s from "./MenteeDetail.module.css";

export default function MenteeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mentee, setMentee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchMentee = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get(`/mentor/mentees/${id}`);
      setMentee(data);
      setNotes(data.mentorNotes || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load mentee profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMentee(); }, [id]);

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.patch(`/mentor/mentees/${id}/notes`, { notes });
      alert("Notes saved successfully");
    } catch (err) {
      alert("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // 🚨 Open CV in a new tab. We need to attach the auth token to the
  // request so we use fetch + blob URL instead of a direct link.
  const handleViewCV = async () => {
    try {
      const response = await api.get(`/mentor/mentees/${id}/cv`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      window.open(url, "_blank");
      // Revoke after a delay so the tab has time to load it
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load CV");
    }
  };

  if (loading) {
    return (
      <Page>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--color-muted)' }}>
          <Loader2 className="spin" size={40} style={{ marginBottom: 16, color: 'var(--color-primary)' }} />
          Loading mentee profile...
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--color-danger)' }}>
          <AlertCircle size={32} />
          <h3>Error</h3>
          <p>{error}</p>
          <Button onClick={fetchMentee}><RefreshCw size={14} /> Retry</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Mentee Profile"
        subtitle={<Link to="/mentor/dashboard" style={{ color: "var(--color-primary)", fontWeight: 600 }}>← Back to roster</Link>}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {mentee.hasCv && (
              <Button variant="secondary" onClick={handleViewCV}>
                <FileText size={14} /> View CV
              </Button>
            )}
            <Button variant="accent" onClick={() => navigate("/mentor/sessions", { state: { menteeId: mentee.id, menteeName: mentee.name } })}>
              <CalendarPlus size={14} /> Schedule session
            </Button>
          </div>
        }
      />

      <div className={s.header} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', marginBottom: '24px' }}>
        <div className={s.avatar} style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: 800 }}>
          {mentee.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className={s.info} style={{ flex: 1 }}>
          <div className={s.name} style={{ fontSize: '24px', fontWeight: 800 }}>{mentee.name}</div>
          <div className={s.meta} style={{ color: 'var(--color-muted)', fontSize: '14px' }}>{mentee.program || "Student"} · Last active {mentee.lastActiveLabel || "recently"}</div>

          {/* CV status indicator under the name */}
          {mentee.hasCv ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: 'var(--color-success, #16a34a)', fontWeight: 600 }}>
              <FileText size={12} /> CV uploaded · {mentee.cvFileName}
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>
              <FileText size={12} /> No CV uploaded yet
            </div>
          )}
        </div>
        <Badge tone={mentee.status === "excelling" ? "success" : mentee.status === "inactive" ? "danger" : "primary"}>
          {mentee.statusDisplay || mentee.status}
        </Badge>
      </div>

      <Grid cols={3}>
        <Card title="Overall progress">
          <ProgressBar value={mentee.progress || 0} label="Roadmap completion" />
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--color-muted)" }}>
            Completed {mentee.completedMilestones || 0} of {mentee.totalMilestones || 0} milestones.
          </div>
        </Card>
        <Card title="Target Career">
          <div style={{ fontSize: 18, fontWeight: 700 }}>{mentee.careerTitle || "Not set"}</div>
          {mentee.hollandCode && (
            <div style={{ color: "var(--color-primary)", fontSize: 13, fontWeight: 700, marginTop: '4px' }}>
              Holland Code: {mentee.hollandCode}
            </div>
          )}
        </Card>
        <Card title="Mentor sessions">
          <div style={{ fontSize: 18, fontWeight: 700 }}>{mentee.completedSessions || 0} completed</div>
          <div style={{ color: "var(--color-muted)", fontSize: 13, marginTop: '4px' }}>
            Next: {mentee.nextSession || "None scheduled"}
          </div>
        </Card>
      </Grid>

      <TwoCol>
        <Card title="Skill profile (Assessed vs Required)">
          <div style={{ height: 280 }}>
            {mentee.skillStrength && mentee.skillStrength.length > 0 ? (
              <ResponsiveContainer>
                <RadarChart data={mentee.skillStrength}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                  <PolarRadiusAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                  <Radar dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--color-muted)', fontStyle: 'italic' }}>
                No skill data available.
              </div>
            )}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Skill gaps to focus on">
            <div className={s.skills} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mentee.gaps && mentee.gaps.length > 0 ? (
                mentee.gaps.map((g) => <ProgressBar key={g.name} label={g.name} value={g.value} />)
              ) : (
                <span style={{ color: 'var(--color-muted)' }}>No major skill gaps detected yet.</span>
              )}
            </div>
          </Card>

          <Card
            title="Private Mentor Notes"
            action={<Button size="sm" onClick={saveNotes} disabled={savingNotes}>{savingNotes ? "Saving..." : <><Save size={14} /> Save</>}</Button>}
          >
            <div className={s.notes}>
              <textarea
                style={{ width: '100%', minHeight: '120px', padding: '12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', resize: 'vertical' }}
                placeholder="Add private notes about this mentee's progress, blockers, or goals..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </Card>
        </div>
      </TwoCol>
    </Page>
  );
}