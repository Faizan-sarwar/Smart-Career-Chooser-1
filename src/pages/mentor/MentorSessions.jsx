// src/pages/mentor/MentorSessions.jsx
//
// Schedule and track 1:1 mentoring sessions.
// Pulls /mentor/sessions, supports create/edit/cancel/complete.

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  X,
  Save,
  CheckCircle,
  Edit3,
  AlertCircle,
  RefreshCw,
  Video,
  Trash2,
} from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import { Select } from "../../components/common/Field.jsx";
import api from "../../lib/axios.js";
import s from "./MentorSessions.module.css";

const EMPTY_SESSION = {
  menteeId: "",
  title: "",
  agenda: "",
  when: "",
  durationMinutes: 30,
  meetingLink: "",
};

export default function MentorSessions() {
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("upcoming");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [sessionsRes, menteesRes] = await Promise.all([
        api.get("/mentor/sessions"),
        api.get("/mentor/mentees"),
      ]);
      setSessions(sessionsRes.data);
      setMentees(menteesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // If navigated here with state from MyMentees ("Schedule a session" button)
  useEffect(() => {
    if (location.state?.menteeId) {
      setEditor({
        ...EMPTY_SESSION,
        menteeId: location.state.menteeId,
        title: `1:1 with ${location.state.menteeName}`,
        when: defaultFutureDate(),
      });
    }
  }, [location.state]);

  const save = async () => {
    if (!editor.menteeId || !editor.title || !editor.when) {
      alert("Mentee, title, and time are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...editor,
        when: new Date(editor.when).toISOString(),
      };

      if (editor.id) {
        const { data } = await api.patch(`/mentor/sessions/${editor.id}`, payload);
        setSessions((ss) => ss.map((s) => (s.id === data.id ? data : s)));
      } else {
        const { data } = await api.post("/mentor/sessions", payload);
        setSessions((ss) => [data, ...ss]);
      }
      setEditor(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save session");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (sessionId, status) => {
    try {
      const { data } = await api.patch(`/mentor/sessions/${sessionId}`, { status });
      setSessions((ss) => ss.map((s) => (s.id === data.id ? data : s)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update");
    }
  };

  const cancel = async (sessionId) => {
    if (!window.confirm("Cancel this session?")) return;
    await updateStatus(sessionId, "cancelled");
  };

  const remove = async (sessionId) => {
    if (!window.confirm("Permanently delete this session?")) return;
    try {
      await api.delete(`/mentor/sessions/${sessionId}`);
      setSessions((ss) => ss.filter((s) => s.id !== sessionId));
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const filtered = sessions.filter((s) => {
    if (filter === "all") return true;
    if (filter === "upcoming")
      return s.status === "scheduled" && new Date(s.when) > new Date();
    if (filter === "past")
      return new Date(s.when) <= new Date() || s.status !== "scheduled";
    return s.status === filter;
  });

  if (loading) {
    return (
      <Page>
        <PageHead title="Sessions" />
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading sessions…</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHead title="Sessions" />
        <div className={s.errorState}>
          <AlertCircle size={28} />
          <h3>Could not load sessions</h3>
          <p>{error}</p>
          <Button onClick={fetchAll}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Mentoring Sessions"
        subtitle={`${filtered.length} ${filter === "upcoming" ? "upcoming" : filter} · 1:1 meetings with your mentees`}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="all">All</option>
            </Select>
            <Button
              variant="accent"
              onClick={() =>
                setEditor({ ...EMPTY_SESSION, when: defaultFutureDate() })
              }
            >
              <Plus size={14} /> Schedule session
            </Button>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <Card>
          <div className={s.empty}>
            <div className={s.emptyIcon}>
              <Calendar size={32} />
            </div>
            <h3>
              {filter === "upcoming"
                ? "No upcoming sessions"
                : "No sessions in this view"}
            </h3>
            <p>
              {filter === "upcoming"
                ? "Schedule your first 1:1 with a mentee to get started."
                : "Try a different filter."}
            </p>
            {filter === "upcoming" && (
              <Button
                variant="accent"
                onClick={() =>
                  setEditor({ ...EMPTY_SESSION, when: defaultFutureDate() })
                }
              >
                <Plus size={14} /> Schedule session
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className={s.sessionList}>
          {filtered.map((sess) => (
            <SessionCard
              key={sess.id}
              session={sess}
              onEdit={() =>
                setEditor({
                  ...sess,
                  menteeId: sess.mentee?.id,
                  when: toDatetimeLocal(sess.when),
                })
              }
              onComplete={() => updateStatus(sess.id, "completed")}
              onCancel={() => cancel(sess.id)}
              onDelete={() => remove(sess.id)}
            />
          ))}
        </div>
      )}

      {editor && (
        <SessionEditor
          session={editor}
          mentees={mentees}
          onChange={setEditor}
          onClose={() => setEditor(null)}
          onSave={save}
          saving={saving}
        />
      )}
    </Page>
  );
}

function SessionCard({ session, onEdit, onComplete, onCancel, onDelete }) {
  const isPast = new Date(session.when) < new Date();
  const isUpcoming = session.status === "scheduled" && !isPast;
  const isToday = new Date(session.when).toDateString() === new Date().toDateString();

  return (
    <div
      className={`${s.session} ${session.status === "cancelled" ? s.sessionCancelled : ""}`}
    >
      <div className={s.dateBlock}>
        <div className={s.dayName}>
          {new Date(session.when).toLocaleDateString("en-PK", { weekday: "short" })}
        </div>
        <div className={s.dayNum}>
          {new Date(session.when).getDate()}
        </div>
        <div className={s.monthName}>
          {new Date(session.when).toLocaleDateString("en-PK", { month: "short" })}
        </div>
      </div>

      <div className={s.sessionBody}>
        <div className={s.sessionHead}>
          <h4 className={s.sessionTitle}>{session.title}</h4>
          <Badge
            tone={
              session.status === "completed"
                ? "success"
                : session.status === "cancelled" || session.status === "no-show"
                ? "danger"
                : isToday
                ? "accent"
                : "primary"
            }
          >
            {isToday && session.status === "scheduled" ? "Today" : session.status}
          </Badge>
        </div>

        {session.mentee && (
          <div className={s.menteeChip}>
            <div className={s.miniAvatar}>
              {session.mentee.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <span>{session.mentee.name}</span>
            <span className={s.muted}>· {session.mentee.email}</span>
          </div>
        )}

        <div className={s.sessionMeta}>
          <span>
            <Clock size={12} />{" "}
            {new Date(session.when).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · {session.durationMinutes} min
          </span>
          {session.meetingLink && (
            <a
              href={session.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className={s.joinLink}
            >
              <Video size={12} /> Join meeting
            </a>
          )}
        </div>

        {session.agenda && <p className={s.agenda}>{session.agenda}</p>}

        {session.notes && (
          <div className={s.notesBox}>
            <strong>Notes:</strong> {session.notes}
          </div>
        )}

        <div className={s.sessionActions}>
          {isUpcoming && (
            <>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit3 size={12} /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={onComplete}>
                <CheckCircle size={12} /> Mark complete
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            </>
          )}
          {session.status === "scheduled" && isPast && (
            <Button variant="primary" size="sm" onClick={onComplete}>
              <CheckCircle size={12} /> Mark complete
            </Button>
          )}
          {(session.status === "completed" || session.status === "cancelled") && (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 size={12} /> Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionEditor({ session, mentees, onChange, onClose, onSave, saving }) {
  const set = (k, v) => onChange({ ...session, [k]: v });
  const isNew = !session.id;

  return (
    <div className={s.scrim} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <button className={s.close} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <h2 className={s.modalTitle}>
          {isNew ? "Schedule new session" : "Edit session"}
        </h2>

        <div className={s.editorBody}>
          <Field label="Mentee" required>
            <Select
              value={session.menteeId}
              onChange={(e) => set("menteeId", e.target.value)}
              disabled={!isNew}
            >
              <option value="">— Choose a mentee —</option>
              {mentees.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Title" required>
            <input
              className={s.input}
              value={session.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Career planning check-in"
            />
          </Field>

          <Field label="Agenda">
            <textarea
              className={s.textarea}
              value={session.agenda}
              onChange={(e) => set("agenda", e.target.value)}
              rows={3}
              placeholder="What will you cover in this session?"
            />
          </Field>

          <div className={s.row2}>
            <Field label="Date & time" required>
              <input
                className={s.input}
                type="datetime-local"
                value={session.when}
                onChange={(e) => set("when", e.target.value)}
              />
            </Field>
            <Field label="Duration (min)">
              <Select
                value={session.durationMinutes}
                onChange={(e) =>
                  set("durationMinutes", parseInt(e.target.value))
                }
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={45}>45</option>
                <option value={60}>60</option>
                <option value={90}>90</option>
              </Select>
            </Field>
          </div>

          <Field label="Meeting link (Google Meet, Zoom, etc.)">
            <input
              className={s.input}
              value={session.meetingLink}
              onChange={(e) => set("meetingLink", e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
            />
          </Field>

          {!isNew && (
            <Field label="Session notes (private to you)">
              <textarea
                className={s.textarea}
                value={session.notes || ""}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                placeholder="What was discussed? Action items?"
              />
            </Field>
          )}
        </div>

        <div className={s.modalActions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            disabled={
              saving || !session.menteeId || !session.title || !session.when
            }
          >
            <Save size={14} />{" "}
            {saving
              ? "Saving…"
              : isNew
              ? "Schedule session"
              : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <label className={s.field}>
      <span className={s.fieldLabel}>
        {label}
        {required && <span className={s.req}> *</span>}
      </span>
      {children}
    </label>
  );
}

function defaultFutureDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(15, 0, 0, 0);
  return toDatetimeLocal(d);
}

function toDatetimeLocal(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}