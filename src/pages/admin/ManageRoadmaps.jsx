// src/pages/admin/ManageRoadmaps.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Search, Map, Trash2, Eye, AlertCircle, RefreshCw, CheckCircle, Clock, X } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import api from "../../lib/axios.js";
import s from "./ManageRoadmaps.module.css";

export default function ManageRoadmaps() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);
  const [search, setSearch] = useState("");

  const fetchRoadmaps = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/admin/roadmaps");
      setRoadmaps(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load roadmaps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoadmaps(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student's roadmap?")) return;
    try {
      await api.delete(`/admin/roadmaps/${id}`);
      setRoadmaps((rms) => rms.filter((r) => r._id !== id));
      setViewing(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const filtered = useMemo(() => {
    return roadmaps.filter((r) =>
      (r.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.careerTitle || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [roadmaps, search]);

  if (loading) return <Page><div className={s.loadingState}><div className={s.loaderRing} /><p>Loading student roadmaps…</p></div></Page>;
  if (error) return <Page><div className={s.errorState}><AlertCircle size={28} /><h3>Error loading</h3><p>{error}</p><Button onClick={fetchRoadmaps}><RefreshCw size={14} /> Retry</Button></div></Page>;

  return (
    <Page>
      <PageHead
        title="Student Roadmaps"
        subtitle="Monitor AI-generated learning paths and audit student progress across the platform."
      />

      <Card>
        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <Search size={16} className={s.searchIcon} />
            <input
              className={s.search}
              placeholder="Search by student name or career..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Target Career</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const total = r.milestones?.length || 0;
                const completed = r.milestones?.filter(m => m.done).length || 0;
                const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

                return (
                  <tr key={r._id}>
                    <td>
                      <div className={s.userCell}>
                        <div className={s.avatar}>{r.user?.name?.charAt(0) || "U"}</div>
                        <div>
                          <div className={s.userName}>{r.user?.name || "Unknown"}</div>
                          <div className={s.userEmail}>{r.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={s.careerTitle}><Map size={14} style={{ color: 'var(--color-primary)' }} /> {r.careerTitle}</div>
                    </td>
                    <td>
                      <div className={s.progressCell}>
                        <span className={s.pct}>{pct}%</span>
                        <div className={s.miniBar}>
                          <div className={s.miniFill} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone={r.isActive ? (pct === 100 ? "success" : "primary") : "neutral"}>
                        {r.isActive ? (pct === 100 ? "Completed" : "In Progress") : "Inactive"}
                      </Badge>
                    </td>
                    <td>
                      <div className={s.actions}>
                        <button className={s.iconBtn} onClick={() => setViewing(r)}><Eye size={14} /> Audit</button>
                        <button className={`${s.iconBtn} ${s.iconBtnDanger}`} onClick={() => remove(r._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={5} className={s.emptyRow}>No roadmaps found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit Modal */}
      {viewing && (
        <div className={s.scrim} onClick={() => setViewing(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHead}>
              <div>
                <h2>{viewing.user?.name}'s Roadmap</h2>
                <p>Target: <strong>{viewing.careerTitle}</strong></p>
              </div>
              <button className={s.close} onClick={() => setViewing(null)}><X size={18} /></button>
            </div>

            <div className={s.modalBody}>
              <div className={s.summaryBox}>{viewing.summary}</div>

              <h3 className={s.milestoneHeader}>AI-Generated Milestones</h3>
              <div className={s.timeline}>
                {viewing.milestones.map((m, i) => (
                  <div key={m._id} className={`${s.tlItem} ${m.done ? s.tlDone : ''}`}>
                    <div className={s.tlIcon}>{m.done ? <CheckCircle size={16} /> : <Clock size={16} />}</div>
                    <div className={s.tlContent}>
                      <div className={s.tlTitle}>{m.name}</div>
                      <div className={s.tlDesc}>{m.description}</div>
                      <div className={s.tlPhase}>Phase: {m.phase}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}