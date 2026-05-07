// src/pages/admin/ManageCareers.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, Trash2, Edit3, X, Save, Briefcase, AlertCircle, RefreshCw, Sparkles
} from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import { Select } from "../../components/common/Field.jsx";
import api from "../../lib/axios.js";
import s from "./ManageCareers.module.css";

const CLUSTERS = [
  "technology", "business", "engineering", "health", "creative",
  "education", "public-service", "science", "finance", "media",
];

const DEMAND_LEVELS = ["low", "moderate", "high", "very-high"];

const EMPTY_CAREER = {
  slug: "", title: "", summary: "", cluster: "technology",
  demand: "moderate", growthOutlook: "",
  riasecFit: { R: 5, I: 5, A: 5, S: 5, E: 5, C: 5 },
  skillWeights: { technical: 5, analytical: 5, creative: 5, communication: 5, leadership: 5, organization: 5 },
  coreSkills: [], educationPaths: [], workSettings: ["hybrid"],
  salaryPKR: { entry: 80000, mid: 200000, senior: 500000 },
  isActive: true,
};

export default function ManageCareers() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const [filter, setFilter] = useState({ cluster: "All", demand: "All", q: "" });

  const fetchCareers = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/admin/careers");
      setCareers(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load careers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCareers(); }, []);

  const filtered = useMemo(() => {
    return careers.filter(
      (c) =>
        (filter.cluster === "All" || c.cluster === filter.cluster) &&
        (filter.demand === "All" || c.demand === filter.demand) &&
        (filter.q === "" ||
          c.title.toLowerCase().includes(filter.q.toLowerCase()) ||
          c.slug.toLowerCase().includes(filter.q.toLowerCase()))
    );
  }, [careers, filter]);

  const save = async () => {
    setSaving(true);
    try {
      if (editor._id) {
        const { data } = await api.put(`/admin/careers/${editor._id}`, editor);
        setCareers((cs) => cs.map((c) => (c._id === data._id ? data : c)));
      } else {
        const { data } = await api.post("/admin/careers", editor);
        setCareers((cs) => [data, ...cs]);
      }
      setEditor(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save career");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/careers/${id}`);
      setCareers((cs) => cs.map((c) => (c._id === id ? { ...c, isActive: false } : c)));
      setConfirm(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <Page>
        <PageHead title="Career Library" />
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading career library…</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHead title="Career Library" />
        <div className={s.errorState}>
          <AlertCircle size={28} />
          <h3>Could not load careers</h3>
          <p>{error}</p>
          <Button onClick={fetchCareers}><RefreshCw size={14} /> Retry</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Career Library"
        subtitle={`${filtered.length} of ${careers.length} careers · Used by the AI recommendation engine`}
        actions={
          <Button variant="accent" onClick={() => setEditor({ ...EMPTY_CAREER })}>
            <Plus size={14} /> Add career
          </Button>
        }
      />

      <Card>
        <div className={s.toolbar}>
          <input
            className={s.search} placeholder="Search by title or slug…"
            value={filter.q} onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
          />
          <Select value={filter.cluster} onChange={(e) => setFilter((f) => ({ ...f, cluster: e.target.value }))}>
            <option>All</option>
            {CLUSTERS.map((c) => (<option key={c} value={c}>{c}</option>))}
          </Select>
          <Select value={filter.demand} onChange={(e) => setFilter((f) => ({ ...f, demand: e.target.value }))}>
            <option>All</option>
            {DEMAND_LEVELS.map((d) => (<option key={d} value={d}>{d}</option>))}
          </Select>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Career</th>
                <th>Cluster</th>
                <th>Demand</th>
                <th>Salary (PKR/mo)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div className={s.careerCell}>
                      <div className={s.careerIcon}><Briefcase size={14} /></div>
                      <div>
                        <div className={s.careerTitle}>{c.title}</div>
                        <div className={s.careerSlug}>{c.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge tone="primary">{c.cluster}</Badge></td>
                  <td>
                    <Badge tone={c.demand === "very-high" ? "accent" : c.demand === "high" ? "success" : c.demand === "moderate" ? "info" : "neutral"}>
                      {c.demand}
                    </Badge>
                  </td>
                  <td className={s.muted}>
                    {c.salaryPKR ? `${formatPKR(c.salaryPKR.entry)} - ${formatPKR(c.salaryPKR.senior)}` : "—"}
                  </td>
                  <td>
                    <Badge tone={c.isActive ? "success" : "danger"}>{c.isActive ? "Active" : "Disabled"}</Badge>
                  </td>
                  <td>
                    <div className={s.actions}>
                      <button className={s.iconBtn} onClick={() => setEditor({ ...c })}>
                        <Edit3 size={12} /> Edit
                      </button>
                      <button className={`${s.iconBtn} ${s.iconBtnDanger}`} onClick={() => setConfirm(c)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className={s.emptyRow}>No careers match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editor && (
        <CareerEditor career={editor} onChange={setEditor} onClose={() => setEditor(null)} onSave={save} saving={saving} />
      )}

      {confirm && (
        <div className={s.scrim} onClick={() => setConfirm(null)}>
          <div className={s.smallModal} onClick={(e) => e.stopPropagation()}>
            <h3>Disable {confirm.title}?</h3>
            <p>This will hide it from new recommendations but keep historical data intact. You can re-enable it later by editing.</p>
            <div className={s.modalActions}>
              <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => remove(confirm._id)}>Disable career</Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

// ── AI Powered Editor modal ───────────────────────────────────────────────────
function CareerEditor({ career, onChange, onClose, onSave, saving }) {
  const [aiLoading, setAiLoading] = useState(false);
  const c = career;
  const set = (k, v) => onChange({ ...c, [k]: v });
  const setNested = (k1, k2, v) => onChange({ ...c, [k1]: { ...c[k1], [k2]: v } });

  const isNew = !c._id;

  // 🚨 THE AI MAGIC HAPPENS HERE 🚨
  const generateWithAI = async () => {
    if (!c.title.trim()) return alert("Please enter a Career Title first!");
    setAiLoading(true);
    try {
      const { data } = await api.post("/admin/careers/generate", { title: c.title });
      // Merge the AI data into the current form state!
      onChange({ ...c, ...data, title: c.title });
    } catch (err) {
      alert("Failed to generate AI data. Check console for details.");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={s.scrim} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <button className={s.close} onClick={onClose} aria-label="Close"><X size={18} /></button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', paddingRight: '36px' }}>
          <h2 className={s.modalTitle} style={{ marginBottom: 0, paddingRight: 0 }}>
            {isNew ? "Add new career" : `Edit: ${c.title}`}
          </h2>
          {/* THE AI BUTTON */}
          <Button variant="accent" onClick={generateWithAI} disabled={aiLoading || !c.title}>
            <Sparkles size={14} /> {aiLoading ? "Generating..." : "Auto-fill with AI"}
          </Button>
        </div>

        <div className={s.editorBody}>
          <Section title="Basics">
            <Field label="Title">
              <input className={s.input} value={c.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Data Scientist" />
            </Field>
            <Field label="Slug (URL-friendly, unique)">
              <input className={s.input} value={c.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="e.g. data-scientist" disabled={!isNew} />
            </Field>
            <Field label="Cluster">
              <Select value={c.cluster} onChange={(e) => set("cluster", e.target.value)}>
                {CLUSTERS.map((cl) => (<option key={cl} value={cl}>{cl}</option>))}
              </Select>
            </Field>
            <Field label="Demand">
              <Select value={c.demand} onChange={(e) => set("demand", e.target.value)}>
                {DEMAND_LEVELS.map((d) => (<option key={d} value={d}>{d}</option>))}
              </Select>
            </Field>
            <Field label="Summary" wide>
              <textarea className={s.textarea} value={c.summary} onChange={(e) => set("summary", e.target.value)} rows={3} placeholder="2-3 sentence description..." />
            </Field>
            <Field label="Growth outlook" wide>
              <input className={s.input} value={c.growthOutlook || ""} onChange={(e) => set("growthOutlook", e.target.value)} placeholder="e.g. +25% over next 5 years" />
            </Field>
          </Section>

          <Section title="Salary (PKR per month)">
            <Field label="Entry"><input className={s.input} type="number" value={c.salaryPKR?.entry || 0} onChange={(e) => setNested("salaryPKR", "entry", Number(e.target.value))} /></Field>
            <Field label="Mid-level"><input className={s.input} type="number" value={c.salaryPKR?.mid || 0} onChange={(e) => setNested("salaryPKR", "mid", Number(e.target.value))} /></Field>
            <Field label="Senior"><input className={s.input} type="number" value={c.salaryPKR?.senior || 0} onChange={(e) => setNested("salaryPKR", "senior", Number(e.target.value))} /></Field>
          </Section>

          <Section title="RIASEC personality fit (0-10)">
            {["R", "I", "A", "S", "E", "C"].map((k) => (
              <Field key={k} label={k}>
                <input className={s.input} type="number" min="0" max="10" value={c.riasecFit?.[k] || 0} onChange={(e) => setNested("riasecFit", k, Number(e.target.value))} />
              </Field>
            ))}
          </Section>

          <Section title="Skill weights (0-10)">
            {["technical", "analytical", "creative", "communication", "leadership", "organization"].map((k) => (
              <Field key={k} label={k}>
                <input className={s.input} type="number" min="0" max="10" value={c.skillWeights?.[k] || 0} onChange={(e) => setNested("skillWeights", k, Number(e.target.value))} />
              </Field>
            ))}
          </Section>

          <Section title="Skills & education">
            <Field label="Core skills (comma-separated)" wide>
              <input className={s.input} value={(c.coreSkills || []).join(", ")} onChange={(e) => set("coreSkills", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} placeholder="e.g. JavaScript, React, Node.js, MongoDB" />
            </Field>
            <Field label="Education paths (comma-separated)" wide>
              <input className={s.input} value={(c.educationPaths || []).join(", ")} onChange={(e) => set("educationPaths", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} placeholder="e.g. BSCS at UoG, FAST, NUST" />
            </Field>
          </Section>
        </div>

        <div className={s.modalActions}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onSave} disabled={saving || !c.title || !c.slug || aiLoading}>
            <Save size={14} /> {saving ? "Saving…" : isNew ? "Create career" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className={s.section}>
      <h3 className={s.sectionTitle}>{title}</h3>
      <div className={s.sectionGrid}>{children}</div>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <label className={`${s.field} ${wide ? s.fieldWide : ""}`}>
      <span className={s.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function formatPKR(n) {
  if (!n) return "0";
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}