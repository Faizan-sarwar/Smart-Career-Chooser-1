// src/pages/student/SkillRoadmap.jsx
//
// Displays the user's active roadmap. Milestones are grouped by phase
// (0-3, 3-6, 6-12, 12+ months). Users can toggle milestones complete,
// which persists to the backend.

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Lock,
  X,
  BookOpen,
  Clock,
  ExternalLink,
  Target,
  Sparkles,
} from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import api from "../../lib/axios.js";
import s from "./SkillRoadmap.module.css";

const PHASE_ORDER = ["0-3-months", "3-6-months", "6-12-months", "12+ months"];
const PHASE_LABELS = {
  "0-3-months": "Foundations · Months 0–3",
  "3-6-months": "Building · Months 3–6",
  "6-12-months": "Specialization · Months 6–12",
  "12+ months": "Career launch · 12+ months",
};

export default function SkillRoadmap() {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openMilestone, setOpenMilestone] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .get("/roadmap")
      .then(({ data }) => mounted && setRoadmap(data))
      .catch((err) => console.error(err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggle = async (milestone) => {
    setTogglingId(milestone._id);
    try {
      await api.patch(
        `/roadmap/${roadmap._id}/milestones/${milestone._id}`,
        { done: !milestone.done }
      );
      // Optimistic local update
      setRoadmap((rm) => ({
        ...rm,
        milestones: rm.milestones.map((m) =>
          m._id === milestone._id
            ? { ...m, done: !m.done, doneAt: !m.done ? new Date().toISOString() : null }
            : m
        ),
      }));
      if (openMilestone?._id === milestone._id) {
        setOpenMilestone({ ...openMilestone, done: !openMilestone.done });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <Page>
        <div className={s.loadingBox}>
          <CircularProgress value={0} size={50} stroke={4} />
          <p>Loading your roadmap…</p>
        </div>
      </Page>
    );
  }

  if (!roadmap) {
    return (
      <Page>
        <PageHead title="Skill Roadmap" />
        <Card>
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <Target size={40} color="#9ca3af" />
            <h3 style={{ margin: "16px 0 8px" }}>No roadmap yet</h3>
            <p style={{ color: "#6b7280", marginBottom: 20 }}>
              Pick a career from your recommendations to generate a personalized
              12-month skill roadmap.
            </p>
            <Button onClick={() => navigate("/student/recommendations")}>
              See recommendations
            </Button>
          </div>
        </Card>
      </Page>
    );
  }

  const total = roadmap.milestones.length;
  const completed = roadmap.milestones.filter((m) => m.done).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group by phase
  const byPhase = PHASE_ORDER.map((phase) => ({
    phase,
    items: roadmap.milestones.filter((m) => m.phase === phase),
  })).filter((g) => g.items.length > 0);

  return (
    <Page>
      <PageHead
        title={`Roadmap · ${roadmap.careerTitle}`}
        subtitle="Bridge the gap between where you are and where you're going."
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate("/student/recommendations")}
          >
            Change career
          </Button>
        }
      />

      {roadmap.summary && (
        <div className={s.summaryNotice}>
          <Sparkles size={16} />
          <p>{roadmap.summary}</p>
        </div>
      )}

      <div className={s.summary}>
        <div>
          <div className={s.sumLabel}>Roadmap progress</div>
          <div className={s.sumValue}>
            {completed} / {total} milestones · {pct}%
          </div>
        </div>
        <div className={s.bar}>
          <div className={s.barFill} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {byPhase.map((group) => (
        <div key={group.phase} className={s.phaseGroup}>
          <h3 className={s.phaseTitle}>{PHASE_LABELS[group.phase]}</h3>
          <div className={s.timeline}>
            {group.items.map((node, i) => (
              <div
                key={node._id}
                className={`${s.node} ${node.done ? s.nodeDone : s.nodeLocked}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <button
                  type="button"
                  className={s.bullet}
                  onClick={() => handleToggle(node)}
                  disabled={togglingId === node._id}
                  aria-label={node.done ? "Mark incomplete" : "Mark complete"}
                >
                  {node.done ? <Check size={18} /> : <Lock size={16} />}
                </button>
                <div className={s.nodeBody} onClick={() => setOpenMilestone(node)}>
                  <div className={s.nodeTitle}>{node.name}</div>
                  <div className={s.nodeMeta}>
                    {node.done
                      ? "Completed"
                      : `${node.courses?.length || 0} suggested course${node.courses?.length === 1 ? "" : "s"
                      }`}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setOpenMilestone(node)}>
                  View →
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {openMilestone && (
        <div className={s.scrim} onClick={() => setOpenMilestone(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={s.close}
              onClick={() => setOpenMilestone(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className={s.modalHead}>
              {openMilestone.done ? <Check size={18} /> : <Lock size={18} />}
              <h2>{openMilestone.name}</h2>
            </div>
            {openMilestone.description && (
              <p className={s.modalSub}>{openMilestone.description}</p>
            )}

            {openMilestone.courses?.length > 0 ? (
              <div className={s.courseList}>
                <div className={s.courseHeader}>Suggested resources</div>
                {openMilestone.courses.map((c, i) => (
                  <div key={i} className={s.course}>
                    <BookOpen size={18} />
                    <div style={{ flex: 1 }}>
                      <div className={s.courseTitle}>{c.title}</div>
                      <div className={s.courseMeta}>
                        {c.provider}
                        {c.hours > 0 && (
                          <>
                            {" · "}
                            <Clock size={11} /> {c.hours}h
                          </>
                        )}
                        {c.isFree && <span className={s.freeTag}>FREE</span>}
                      </div>
                    </div>
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.openLink}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#6b7280", fontStyle: "italic" }}>
                No specific courses suggested. Build experience through projects.
              </p>
            )}

            <div className={s.modalActions}>
              <Button
                onClick={() => handleToggle(openMilestone)}
                disabled={togglingId === openMilestone._id}
                variant={openMilestone.done ? "secondary" : "primary"}
              >
                {openMilestone.done ? "Mark incomplete" : "Mark complete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}