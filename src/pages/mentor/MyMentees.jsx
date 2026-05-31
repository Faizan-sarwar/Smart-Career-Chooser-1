// src/pages/mentor/MyMentees.jsx
//
// Full mentee roster with filters, search, and a detail drawer
// that shows the mentee's assessment, roadmap, and recent sessions.

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Search,
  X,
  AlertCircle,
  RefreshCw,
  Mail,
  GraduationCap,
  Sparkles,
  Map,
  Calendar,
  CalendarPlus,
  ExternalLink,
  FileText
} from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import Avatar from "../../components/common/Avatar.jsx";
import { Select } from "../../components/common/Field.jsx";
import api from "../../lib/axios.js";
import s from "./MyMentees.module.css";

export default function MyMentees() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();

  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ q: "", status: "All" });
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchMentees = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/mentor/mentees");
      setMentees(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load mentees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentees();
  }, []);

  // If URL has /mentor/mentees/:id, open that detail
  useEffect(() => {
    if (paramId) openDetail(paramId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setDetail({ id, loading: true });
    try {
      const { data } = await api.get(`/mentor/mentees/${id}`);
      setDetail(data);
    } catch (err) {
      setDetail(null);
      alert(err.response?.data?.message || "Failed to load mentee");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    if (paramId) navigate("/mentor/mentees", { replace: true });
  };

  const filtered = useMemo(() => {
    return mentees.filter(
      (m) =>
        (filter.status === "All" || m.status === filter.status) &&
        (filter.q === "" ||
          m.name.toLowerCase().includes(filter.q.toLowerCase()) ||
          m.email.toLowerCase().includes(filter.q.toLowerCase()) ||
          (m.program || "").toLowerCase().includes(filter.q.toLowerCase()))
    );
  }, [mentees, filter]);

  if (loading) {
    return (
      <Page>
        <PageHead title="My Mentees" />
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading roster…</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHead title="My Mentees" />
        <div className={s.errorState}>
          <AlertCircle size={28} />
          <h3>Could not load mentees</h3>
          <p>{error}</p>
          <Button onClick={fetchMentees}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="My Mentees"
        subtitle={`${filtered.length} of ${mentees.length} students · Click any row for full profile`}
      />

      <Card>
        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <Search size={14} className={s.searchIcon} />
            <input
              className={s.search}
              placeholder="Search by name, email, or program…"
              value={filter.q}
              onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
          <Select
            value={filter.status}
            onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="All">All status</option>
            <option value="active">Active</option>
            <option value="excelling">Excelling</option>
            <option value="onboarding">Onboarding</option>
            <option value="needs-roadmap">Needs Roadmap</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Mentee</th>
                <th>Program</th>
                <th>Career goal</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Last active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} onClick={() => openDetail(m.id)} className={s.row}>
                  <td>
                    <div className={s.menteeName}>
                      <Avatar
                        src={m.avatar}
                        name={m.name}
                        size={36}
                      />
                      <div>
                        <div className={s.nameText}>{m.name}</div>
                        <div className={s.emailText}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={s.muted}>{m.program}</td>
                  <td className={s.muted}>{m.careerTitle || "Not set"}</td>
                  <td>
                    <div className={s.progressCell}>
                      <div className={s.progressBar}>
                        <div
                          className={s.progressFill}
                          style={{ width: `${m.progress}%` }}
                        />
                      </div>
                      <span className={s.progressText}>{m.progressDisplay}</span>
                    </div>
                  </td>
                  <td>
                    <Badge
                      tone={
                        m.status === "excelling"
                          ? "success"
                          : m.status === "active"
                            ? "primary"
                            : m.status === "inactive"
                              ? "danger"
                              : "warning"
                      }
                    >
                      {m.statusDisplay}
                    </Badge>
                  </td>
                  <td className={s.muted}>{m.lastActiveLabel}</td>
                  <td>
                    <Button variant="ghost" size="sm">
                      View →
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className={s.emptyRow}>
                    No mentees match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {detail && (
        <MenteeDetailDrawer
          detail={detail}
          loading={detailLoading}
          onClose={closeDetail}
        />
      )}
    </Page>
  );
}

function MenteeDetailDrawer({ detail, loading, onClose }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={s.scrim} onClick={onClose}>
        <div className={s.drawer} onClick={(e) => e.stopPropagation()}>
          <button className={s.close} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
          <div className={s.detailLoading}>
            <div className={s.loaderRing} />
          </div>
        </div>
      </div>
    );
  }

  const m = detail;

  return (
    <div className={s.scrim} onClick={onClose}>
      <div className={s.drawer} onClick={(e) => e.stopPropagation()}>
        <button className={s.close} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <header className={s.detailHead}>
          <Avatar
            src={m.avatar}
            name={m.name}
            size={72}
            fontSize={24}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className={s.detailName}>{m.name}</h2>
            <div className={s.detailMeta}>
              <span>
                <Mail size={12} /> {m.email}
              </span>
              <span>
                <GraduationCap size={12} /> {m.program || "Undeclared"}
              </span>
            </div>
            <div className={s.detailBadges}>
              <Badge
                tone={
                  m.status === "excelling"
                    ? "success"
                    : m.status === "active"
                      ? "primary"
                      : m.status === "inactive"
                        ? "danger"
                        : "warning"
                }
              >
                {m.statusDisplay}
              </Badge>
              {m.hollandCode && (
                <span className={s.hollandPill}>{m.hollandCode}</span>
              )}
            </div>
          </div>
        </header>

        <div className={s.detailBody}>
          {/* 🚨 UPDATED QUICK ACTIONS WITH CV BUTTON 🚨 */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <Button
              variant="accent"
              onClick={() =>
                navigate("/mentor/sessions", {
                  state: { menteeId: m.id, menteeName: m.name },
                })
              }
            >
              <CalendarPlus size={14} /> Schedule a session
            </Button>

            {/* Only show if the student has uploaded a CV. Use authed
                axios → blob → new tab (plain <a> would 401). */}
            {m.hasCv && (
              <Button variant="secondary" onClick={async () => {
                try {
                  const resp = await api.get(`/mentor/mentees/${m.id}/cv`, { responseType: "blob" });
                  const url = window.URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
                  window.open(url, "_blank");
                  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
                } catch (err) {
                  alert(err.response?.data?.message || "Failed to load CV");
                }
              }}>
                <FileText size={14} /> View Resume
              </Button>
            )}
          </div>

          {/* Assessment */}
          <section className={s.detailSection}>
            <h3 className={s.detailSectionTitle}>
              <Sparkles size={14} /> Assessment
            </h3>
            {m.assessment ? (
              <div className={s.detailGrid}>
                <DetailRow label="Holland Code" value={m.assessment.hollandCode} />
                {m.assessment.recommendations?.[0] && (
                  <DetailRow
                    label="Top match"
                    value={`${m.assessment.recommendations[0].title} (${m.assessment.recommendations[0].match}%)`}
                  />
                )}
                {m.assessment.skillStrength?.length > 0 && (
                  <div className={s.detailFull}>
                    <div className={s.subLabel}>Top skills</div>
                    <div className={s.skillList}>
                      {m.assessment.skillStrength.slice(0, 4).map((sk) => (
                        <div key={sk.skill} className={s.skillRow}>
                          <span className={s.skillName}>{sk.skill}</span>
                          <div className={s.skillBar}>
                            <div
                              className={s.skillFill}
                              style={{ width: `${sk.value}%` }}
                            />
                          </div>
                          <span className={s.skillValue}>{sk.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={s.detailEmpty}>
                Hasn't taken the assessment yet.
              </div>
            )}
          </section>

          {/* Roadmap */}
          <section className={s.detailSection}>
            <h3 className={s.detailSectionTitle}>
              <Map size={14} /> Skill Roadmap
            </h3>
            {m.roadmap ? (
              <div>
                <div className={s.roadmapHead}>
                  <strong>{m.roadmap.careerTitle}</strong>
                  <span className={s.muted}>
                    {m.completedMilestones} of {m.totalMilestones} milestones
                  </span>
                </div>
                <div className={s.bigProgressBar}>
                  <div
                    className={s.bigProgressFill}
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
                <ul className={s.milestoneList}>
                  {m.roadmap.milestones.slice(0, 5).map((mm, i) => (
                    <li key={i} className={`${s.milestone} ${mm.done ? s.milestoneDone : ""}`}>
                      <span className={s.milestoneCheck}>{mm.done ? "✓" : "○"}</span>
                      <span className={s.milestoneText}>{mm.name}</span>
                      <span className={s.milestonePhase}>{mm.phase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className={s.detailEmpty}>No roadmap generated yet.</div>
            )}
          </section>

          {/* Recent sessions */}
          <section className={s.detailSection}>
            <h3 className={s.detailSectionTitle}>
              <Calendar size={14} /> Recent sessions
            </h3>
            {m.recentSessions?.length > 0 ? (
              <ul className={s.sessionList}>
                {m.recentSessions.map((s2) => (
                  <li key={s2.id} className={s.sessionItem}>
                    <span>{s2.title}</span>
                    <span className={s.muted}>
                      {new Date(s2.when).toLocaleDateString("en-PK", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <Badge
                      tone={
                        s2.status === "completed"
                          ? "success"
                          : s2.status === "cancelled" || s2.status === "no-show"
                            ? "danger"
                            : "primary"
                      }
                    >
                      {s2.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={s.detailEmpty}>No sessions yet.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div className={s.subLabel}>{label}</div>
      <div className={s.detailValue}>{value || "—"}</div>
    </div>
  );
}