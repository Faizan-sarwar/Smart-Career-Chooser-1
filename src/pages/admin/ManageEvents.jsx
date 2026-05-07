// src/pages/admin/ManageEvents.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, Trash2, Edit3, X, Save, Calendar, Users, AlertCircle, RefreshCw, Sparkles
} from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import { Select } from "../../components/common/Field.jsx";
import api from "../../lib/axios.js";
import s from "./ManageEvents.module.css";

const EVENT_TAGS = ["Webinar", "Workshop", "AMA", "Live", "Networking"];

const EMPTY_EVENT = {
  title: "", description: "", host: "", when: "", tag: "Webinar",
  imageUrl: "", link: "", coverColor: "#0d9488",
};

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [filter, setFilter] = useState({ tag: "All", q: "" });

  const fetchEvents = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/admin/events");
      setEvents(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const filtered = useMemo(() => {
    return events.filter(
      (e) =>
        (filter.tag === "All" || e.tag === filter.tag) &&
        (filter.q === "" ||
          e.title.toLowerCase().includes(filter.q.toLowerCase()) ||
          (e.host || "").toLowerCase().includes(filter.q.toLowerCase()))
    );
  }, [events, filter]);

  const openCreate = () => setEditor({ ...EMPTY_EVENT, when: defaultFutureDate() });
  const openEdit = (ev) => setEditor({ ...ev, when: ev.when ? toDatetimeLocal(ev.when) : defaultFutureDate() });

  const save = async () => {
    if (!editor.title || !editor.host || !editor.when) return alert("Title, host, and date are required");
    setSaving(true);
    try {
      const payload = { ...editor, when: new Date(editor.when).toISOString() };
      if (editor._id) {
        const { data } = await api.put(`/admin/events/${editor._id}`, payload);
        setEvents((es) => es.map((e) => (e._id === data._id ? data : e)));
      } else {
        const { data } = await api.post("/admin/events", payload);
        setEvents((es) => [data, ...es]);
      }
      setEditor(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/events/${id}`);
      setEvents((es) => es.filter((e) => e._id !== id));
      setConfirm(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <Page>
        <PageHead title="Events Manager" />
        <div className={s.loadingState}><div className={s.loaderRing} /><p>Loading events…</p></div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHead title="Events Manager" />
        <div className={s.errorState}>
          <AlertCircle size={28} />
          <h3>Could not load events</h3>
          <p>{error}</p>
          <Button onClick={fetchEvents}><RefreshCw size={14} /> Retry</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Events Manager"
        subtitle={`${filtered.length} of ${events.length} events · Live in Events Hub`}
        actions={<Button variant="accent" onClick={openCreate}><Plus size={14} /> Schedule event</Button>}
      />

      <Card>
        <div className={s.toolbar}>
          <input
            className={s.search} placeholder="Search by title or host…"
            value={filter.q} onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
          />
          <Select value={filter.tag} onChange={(e) => setFilter((f) => ({ ...f, tag: e.target.value }))}>
            <option>All</option>
            {EVENT_TAGS.map((t) => (<option key={t} value={t}>{t}</option>))}
          </Select>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Event</th><th>Host</th><th>When</th><th>Tag</th><th>RSVPs</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e._id}>
                  <td>
                    <div className={s.eventCell}>
                      <div
                        className={s.eventThumb}
                        style={{ backgroundImage: e.imageUrl ? `url(${e.imageUrl})` : undefined, backgroundColor: e.coverColor || "#0d9488" }}
                      >
                        {!e.imageUrl && <Calendar size={16} />}
                      </div>
                      <div>
                        <div className={s.eventTitle}>{e.title}</div>
                        {e.description && <div className={s.eventDesc}>{e.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className={s.muted}>{e.host}</td>
                  <td className={s.muted}>{formatDate(e.when)}</td>
                  <td><Badge tone="primary">{e.tag}</Badge></td>
                  <td>
                    <span className={s.rsvpCount}><Users size={12} /> {e.attendees || 0}</span>
                  </td>
                  <td>
                    <div className={s.actions}>
                      <button className={s.iconBtn} onClick={() => openEdit(e)}><Edit3 size={12} /> Edit</button>
                      <button className={`${s.iconBtn} ${s.iconBtnDanger}`} onClick={() => setConfirm(e)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className={s.emptyRow}>No events scheduled. Click "Schedule event" above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editor && <EventEditor event={editor} onChange={setEditor} onClose={() => setEditor(null)} onSave={save} saving={saving} />}

      {confirm && (
        <div className={s.scrim} onClick={() => setConfirm(null)}>
          <div className={s.smallModal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete "{confirm.title}"?</h3>
            <p>This will permanently remove the event and all RSVPs. This cannot be undone.</p>
            <div className={s.modalActions}>
              <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => remove(confirm._id)}>Delete event</Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

// ── AI Powered Editor modal ───────────────────────────────────────────────────
function EventEditor({ event, onChange, onClose, onSave, saving }) {
  const [aiLoading, setAiLoading] = useState(false);
  const e = event;
  const set = (k, v) => onChange({ ...e, [k]: v });
  const isNew = !e._id;

  // 🚨 THE AI MAGIC 🚨
  const generateWithAI = async () => {
    if (!e.title.trim()) return alert("Please type a rough topic in the Title field first (e.g. 'AI Bootcamp')");
    setAiLoading(true);
    try {
      const { data } = await api.post("/admin/events/generate", { topic: e.title });
      onChange({ ...e, ...data });
    } catch (err) {
      alert("Failed to generate AI data.");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={s.scrim} onClick={onClose}>
      <div className={s.modal} onClick={(ev) => ev.stopPropagation()}>
        <button className={s.close} onClick={onClose} aria-label="Close"><X size={18} /></button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', paddingRight: '36px' }}>
          <h2 className={s.modalTitle} style={{ marginBottom: 0, paddingRight: 0 }}>
            {isNew ? "Schedule new event" : `Edit: ${e.title}`}
          </h2>
          <Button variant="accent" onClick={generateWithAI} disabled={aiLoading || !e.title}>
            <Sparkles size={14} /> {aiLoading ? "Generating..." : "Auto-fill with AI"}
          </Button>
        </div>

        <div className={s.editorBody}>
          <Field label="Title / Topic" required>
            <input className={s.input} value={e.title} onChange={(ev) => set("title", ev.target.value)} placeholder="e.g. AI Career Day Pakistan 2026" />
          </Field>
          <Field label="Description">
            <textarea className={s.textarea} value={e.description} onChange={(ev) => set("description", ev.target.value)} rows={2} placeholder="What will attendees learn?" />
          </Field>

          <div className={s.row2}>
            <Field label="Host" required>
              <input className={s.input} value={e.host} onChange={(ev) => set("host", ev.target.value)} placeholder="e.g. Systems Ltd" />
            </Field>
            <Field label="Tag">
              <Select value={e.tag} onChange={(ev) => set("tag", ev.target.value)}>
                {EVENT_TAGS.map((t) => (<option key={t} value={t}>{t}</option>))}
              </Select>
            </Field>
          </div>

          <Field label="Date & time" required>
            <input className={s.input} type="datetime-local" value={e.when} onChange={(ev) => set("when", ev.target.value)} />
          </Field>

          <Field label="Cover image URL">
            <input className={s.input} value={e.imageUrl} onChange={(ev) => set("imageUrl", ev.target.value)} placeholder="https://images.unsplash.com/…" />
          </Field>

          <Field label="Event link (RSVP/registration page)">
            <input className={s.input} value={e.link} onChange={(ev) => set("link", ev.target.value)} placeholder="https://eventbrite.com/… or LinkedIn event URL" />
          </Field>
        </div>

        <div className={s.modalActions}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onSave} disabled={saving || !e.title || !e.host || !e.when}>
            <Save size={14} /> {saving ? "Saving…" : isNew ? "Schedule event" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <label className={s.field}>
      <span className={s.fieldLabel}>{label}{required && <span className={s.req}> *</span>}</span>
      {children}
    </label>
  );
}

// ── Helpers ────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PK", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}
function defaultFutureDate() {
  const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(18, 0, 0, 0); return toDatetimeLocal(d);
}
function toDatetimeLocal(date) {
  const d = new Date(date); const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}