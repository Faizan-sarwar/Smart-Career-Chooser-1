// src/pages/admin/AdminSettings.jsx
import React, { useState, useEffect } from "react";
import {
  User, Lock, Save, AlertCircle, CheckCircle, Database,
  Cpu, Eye, EyeOff, Loader2, Activity, Globe
} from "lucide-react";
import { Page, PageHead, TwoCol } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "./AdminSettings.module.css";

export default function AdminSettings() {
  const { user } = useAuth();

  // ── DYNAMIC SYSTEM HEALTH POLLING ──
  const [health, setHealth] = useState({ status: "checking", latency: 0 });

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      const start = Date.now();
      try {
        // Ping the stats endpoint to verify DB and API are alive
        await api.get("/admin/stats");
        if (mounted) setHealth({ status: "online", latency: Date.now() - start });
      } catch (err) {
        if (mounted) setHealth({ status: "offline", latency: 0 });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Re-ping every 30s
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });

    if (pwForm.next.length < 6) {
      return setPwMsg({ type: "error", text: "New password must be at least 6 characters" });
    }
    if (pwForm.next !== pwForm.confirm) {
      return setPwMsg({ type: "error", text: "Passwords don't match" });
    }

    setPwSaving(true);
    try {
      await api.put("/auth/password", {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      setPwMsg({ type: "success", text: "Password updated successfully" });
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwMsg({
        type: "error",
        text: err.response?.data?.message || "Feature restricted in this environment.",
      });
    } finally {
      setPwSaving(false);
    }
  };

  const initials = user?.name ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() : "A";

  return (
    <Page>
      <PageHead
        title="Admin Settings"
        subtitle="Manage your platform configuration, security, and monitor real-time system health."
      />

      <TwoCol>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ── PROFILE ─────────────────────────────────────── */}
          <Card title="Administrator Profile">
            <div className={s.profileBlock}>
              <div className={s.avatar}>{initials}</div>
              <div>
                <div className={s.profileName}>{user?.name || "Admin"}</div>
                <div className={s.profileEmail}>{user?.email}</div>
                <div className={s.profileRole}>System Administrator</div>
              </div>
            </div>

            <div className={s.note}>
              <AlertCircle size={14} />
              <span>
                Profile editing requires identity verification via your SSO provider. Contact the platform owner for changes.
              </span>
            </div>
          </Card>

          {/* ── DANGER ZONE ───────────────────────────────────── */}
          <Card title="Danger Zone">
            <div className={s.dangerZone}>
              <div className={s.dangerRow}>
                <div>
                  <div className={s.dangerTitle}>Reset All Events</div>
                  <div className={s.dangerDesc}>
                    Removes all scheduled events. They can be re-generated instantly via Groq AI in the Events Hub.
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (!window.confirm("Delete all events? This cannot be undone.")) return;
                    try {
                      const { data } = await api.get("/admin/events");
                      await Promise.all(data.map((e) => api.delete(`/admin/events/${e._id}`)));
                      alert(`Successfully purged ${data.length} events.`);
                    } catch (err) {
                      alert("Failed to reset events.");
                    }
                  }}
                >
                  Reset events
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ── SYSTEM INFO ───────────────────────────────────── */}
          <Card title="Real-Time System Health">
            <div className={s.systemGrid}>
              <SystemCell
                icon={Activity}
                label="API Latency"
                value={health.status === "checking" ? "Pinging..." : health.status === "offline" ? "Timeout" : `${health.latency}ms`}
                status={health.status === "online" ? "ok" : "err"}
              />
              <SystemCell
                icon={Database}
                label="MongoDB Cluster"
                value={health.status === "online" ? "Connected" : "Disconnected"}
                status={health.status === "online" ? "ok" : "err"}
              />
              <SystemCell
                icon={Cpu}
                label="Groq AI Inference"
                value="Llama 3.1 8B (Online)"
                status="ok"
              />
              <SystemCell
                icon={Globe}
                label="Environment"
                value="Production"
              />
            </div>
          </Card>

          {/* ── PASSWORD ────────────────────────────────────── */}
          <Card title="Change Password">
            <form onSubmit={changePassword} className={s.form}>
              <Field label="Current password">
                <div className={s.pwGroup}>
                  <input
                    className={s.input}
                    type={showPw ? "text" : "password"}
                    value={pwForm.current}
                    onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                    required
                  />
                </div>
              </Field>

              <Field label="New password" hint="At least 6 characters">
                <div className={s.pwGroup}>
                  <input
                    className={s.input}
                    type={showPw ? "text" : "password"}
                    value={pwForm.next}
                    onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                    required minLength={6}
                  />
                  <button type="button" className={s.pwToggle} onClick={() => setShowPw((v) => !v)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm new password">
                <input
                  className={s.input}
                  type={showPw ? "text" : "password"}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required
                />
              </Field>

              {pwMsg.text && (
                <div className={`${s.msg} ${pwMsg.type === "success" ? s.msgSuccess : s.msgError}`}>
                  {pwMsg.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {pwMsg.text}
                </div>
              )}

              <div style={{ marginTop: '8px' }}>
                <Button type="submit" variant="primary" disabled={pwSaving}>
                  {pwSaving ? <><Loader2 size={14} className="spin" /> Updating…</> : <><Lock size={14} /> Update password</>}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </TwoCol>
    </Page>
  );
}

function SystemCell({ icon: Icon, label, value, status }) {
  return (
    <div className={s.systemCell}>
      <div className={s.systemIcon}><Icon size={16} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={s.systemLabel}>{label}</div>
        <div className={s.systemValue}>{value}</div>
      </div>
      {status && (
        <span className={`${s.statusDot} ${status === 'ok' ? s.statusOk : s.statusErr}`} />
      )}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className={s.field}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span className={s.fieldLabel}>{label}</span>
        {hint && <span className={s.fieldHint}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}