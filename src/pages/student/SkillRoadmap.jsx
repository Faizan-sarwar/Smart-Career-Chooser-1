// src/pages/student/SkillRoadmap.jsx
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
  TrendingUp,
} from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./SkillRoadmap.module.css";

const PHASE_ORDER = ["0-3-months", "3-6-months", "6-12-months", "12+ months"];
const PHASE_META = {
  "0-3-months": { label: "Foundations", subtitle: "Months 0–3", color: "primary" },
  "3-6-months": { label: "Building", subtitle: "Months 3–6", color: "primary" },
  "6-12-months": { label: "Specialization", subtitle: "Months 6–12", color: "accent" },
  "12+ months": { label: "Career launch", subtitle: "12+ months", color: "accent" },
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
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading your roadmap…</p>
        </div>
      </Page>
    );
  }

  if (!roadmap) {
    return (
      <Page>
        <PageHead title="Skill Roadmap" />
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <Target size={32} />
          </div>
          <h2>No roadmap yet</h2>
          <p>
            Pick a career from your recommendations to generate a personalized 12-month
            skill roadmap with free Pakistani learning resources.
          </p>
          <Button variant="accent" size="lg" onClick={() => navigate("/student/recommendations")}>
            <Sparkles size={16} /> See recommendations
          </Button>
        </div>
      </Page>
    );
  }

  const total = roadmap.milestones.length;
  const completed = roadmap.milestones.filter((m) => m.done).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const byPhase = PHASE_ORDER.map((phase) => ({
    phase,
    items: roadmap.milestones.filter((m) => m.phase === phase),
  })).filter((g) => g.items.length > 0);

  return (
    <Page>
      <PageHead
        title={`Roadmap: ${roadmap.careerTitle}`}
        subtitle="Your AI-personalized learning journey from where you are to where you're going."
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
        <div className={s.summaryBanner}>
          <div className={s.summaryIcon}>
            <Sparkles size={16} />
          </div>
          <p>{roadmap.summary}</p>
        </div>
      )}

      <div className={s.progressCard}>
        <div className={s.progressLeft}>
          <div className={s.progressLabel}>Roadmap progress</div>
          <div className={s.progressValue}>
            <span className={s.progressBig}>{completed}</span>
            <span className={s.progressSep}>/</span>
            <span className={s.progressTotal}>{total}</span>
            <span className={s.progressUnit}>milestones</span>
          </div>
        </div>
        <div className={s.progressRight}>
          <div className={s.progressPct}>{pct}%</div>
          <div className={s.progressBar}>
            <div className={s.progressFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {byPhase.map((group, gIdx) => {
        const meta = PHASE_META[group.phase];
        return (
          <div key={group.phase} className={s.phaseGroup}>
            <div className={s.phaseHead}>
              <div className={`${s.phaseBadge} ${s[`phase_${meta.color}`]}`}>
                Phase {gIdx + 1}
              </div>
              <div>
                <h3 className={s.phaseTitle}>{meta.label}</h3>
                <div className={s.phaseSubtitle}>{meta.subtitle}</div>
              </div>
            </div>

            <div className={s.timeline}>
              {group.items.map((node, i) => (
                <div
                  key={node._id}
                  className={`${s.node} ${node.done ? s.nodeDone : ""}`}
                  style={{ animationDelay: `${(gIdx * 4 + i) * 0.05}s` }}
                >
                  <button
                    type="button"
                    className={s.bullet}
                    onClick={() => handleToggle(node)}
                    disabled={togglingId === node._id}
                    aria-label={node.done ? "Mark incomplete" : "Mark complete"}
                  >
                    {node.done ? <Check size={18} /> : <Lock size={15} />}
                  </button>

                  <div
                    className={s.nodeBody}
                    onClick={() => setOpenMilestone(node)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={s.nodeTitle}>{node.name}</div>
                    {node.description && (
                      <div className={s.nodeDesc}>{node.description}</div>
                    )}
                    <div className={s.nodeMeta}>
                      {node.done ? (
                        <span className={s.nodeMetaDone}>
                          <Check size={11} /> Completed
                        </span>
                      ) : (
                        <span>
                          <BookOpen size={11} /> {node.courses?.length || 0} resource
                          {node.courses?.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => setOpenMilestone(node)}>
                    View →
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

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
              <div
                className={`${s.modalIcon} ${openMilestone.done ? s.modalIconDone : ""
                  }`}
              >
                {openMilestone.done ? <Check size={20} /> : <TrendingUp size={20} />}
              </div>
              <div>
                <h2>{openMilestone.name}</h2>
                {openMilestone.description && (
                  <p>{openMilestone.description}</p>
                )}
              </div>
            </div>

            {openMilestone.courses?.length > 0 ? (
              <div className={s.courseList}>
                <div className={s.courseHeader}>Suggested resources</div>
                {openMilestone.courses.map((c, i) => (
                  <div key={i} className={s.course}>
                    <div className={s.courseIcon}>
                      <BookOpen size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={s.courseTitle}>{c.title}</div>
                      <div className={s.courseMeta}>
                        <span>{c.provider}</span>
                        {c.hours > 0 && (
                          <>
                            <span className={s.dot}>·</span>
                            <span>
                              <Clock size={11} /> {c.hours}h
                            </span>
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
                        aria-label="Open resource"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={s.noCourses}>
                No specific courses suggested. Build experience through projects.
              </p>
            )}

            <div className={s.modalActions}>
              <Button
                onClick={() => handleToggle(openMilestone)}
                disabled={togglingId === openMilestone._id}
                variant={openMilestone.done ? "secondary" : "accent"}
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