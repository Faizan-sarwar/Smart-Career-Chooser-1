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

  // ── AI Verification States ──
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyText, setVerifyText] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

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

  // Modifies the database and local state
  const toggleDatabaseStatus = async (milestone) => {
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

  // Triggers either a direct uncheck, or opens the AI Quiz
  const initiateVerification = (milestone) => {
    if (milestone.done) {
      // Allow them to uncheck it easily
      toggleDatabaseStatus(milestone); 
    } else {
      // Force the AI Quiz to mark as complete!
      setVerifyResult(null);
      setVerifyText("");
      setVerifyOpen(true);
    }
  };

  // Submits the quiz to Groq
  const submitVerification = async () => {
    if (!verifyText.trim()) return;
    setVerifyLoading(true);
    try {
      const { data } = await api.post("/roadmap/verify", {
        milestoneName: openMilestone.name,
        studentAnswer: verifyText
      });
      
      setVerifyResult(data);

      if (data.passed) {
        // AI approved! Update the UI and Database
        toggleDatabaseStatus(openMilestone);
        setTimeout(() => {
          setVerifyOpen(false);
          setVerifyResult(null);
          setVerifyText("");
        }, 2500); // Close modal 2.5s after showing success message
      }
    } catch (err) {
      console.error("Verification failed", err);
    } finally {
      setVerifyLoading(false);
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
                  {/* Inline complete button now triggers AI check */}
                  <button
                    type="button"
                    className={s.bullet}
                    onClick={() => initiateVerification(node)}
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

      {/* ── STANDARD MILESTONE MODAL ── */}
      {openMilestone && !verifyOpen && (
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
                {openMilestone.description && <p>{openMilestone.description}</p>}
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
                    <div className={s.courseInfo}>
                      <div className={s.courseTitle}>{c.title}</div>
                      <div className={s.courseMeta}>
                        <span className={s.courseProvider}>{c.provider}</span>
                        {c.hours > 0 && (
                          <>
                            <span className={s.dot}>·</span>
                            <span className={s.courseHours}>
                              <Clock size={11} /> {c.hours}h
                            </span>
                          </>
                        )}
                        {c.isFree && <span className={s.freeTag}>FREE</span>}
                      </div>
                    </div>
                    {c.url ? (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.openLink}
                        aria-label={`Open ${c.title} in a new tab`}
                      >
                        Open <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span className={s.noLinkLabel}>No link</span>
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
                variant="secondary"
                onClick={() => setOpenMilestone(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => initiateVerification(openMilestone)}
                disabled={togglingId === openMilestone._id}
                variant={openMilestone.done ? "ghost" : "accent"}
              >
                {openMilestone.done ? (
                  <>
                    <X size={14} /> Mark incomplete
                  </>
                ) : (
                  <>
                    <Check size={14} /> Mark complete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI KNOWLEDGE VERIFICATION MODAL ── */}
      {verifyOpen && openMilestone && (
        <div className={s.scrim} onClick={() => !verifyLoading && setVerifyOpen(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', zIndex: 100 }}>
            <div className={s.modalHead}>
              <div className={s.modalIcon} style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--color-primary)' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h2>Knowledge Check</h2>
                <p>AI Verification required to unlock this milestone.</p>
              </div>
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              <p style={{ color: 'var(--color-text)', fontSize: '15px', marginBottom: '16px', lineHeight: '1.5' }}>
                Briefly explain the core concept of <strong>{openMilestone.name}</strong> in your own words. What did you learn?
              </p>
              
              <textarea 
                value={verifyText}
                onChange={(e) => setVerifyText(e.target.value)}
                placeholder="I learned that..."
                disabled={verifyLoading || verifyResult?.passed}
                style={{
                  width: '100%', minHeight: '110px', padding: '14px',
                  background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px', color: 'white', resize: 'vertical',
                  fontSize: '14px', fontFamily: 'inherit', outline: 'none'
                }}
              />

              {verifyResult && (
                <div style={{
                  marginTop: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px',
                  background: verifyResult.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: verifyResult.passed ? '#34d399' : '#f87171',
                  border: `1px solid ${verifyResult.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  {verifyResult.passed ? <Check size={16} /> : <X size={16} />} 
                  <span>{verifyResult.feedback}</span>
                </div>
              )}

              <div className={s.modalActions} style={{ marginTop: '24px' }}>
                <Button variant="secondary" onClick={() => { setVerifyOpen(false); setVerifyResult(null); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={submitVerification} 
                  disabled={verifyLoading || !verifyText.trim() || verifyResult?.passed}
                  variant="accent"
                >
                  {verifyLoading ? "Verifying..." : "Submit to AI Coach"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}