// src/pages/mentor/SettingsPage.jsx
//
// Mentor-specific settings:
//   - Notification toggles (separated: mentee messages, new request alerts,
//     session reminders, weekly digest)
//   - Availability toggle: "Accepting new mentees" master switch
//   - Theme & language
//   - Password (or Google-managed notice)

import { useTheme } from "../../context/ThemeContext.jsx";
import React, { useState, useEffect } from "react";
import {
  Bell, Lock, Palette, Globe, Trash2, Save, Loader2,
  AlertCircle, UserCheck,
} from "lucide-react";
import { Page } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import { Field, Input, Select } from "../../components/common/Field.jsx";
import Button from "../../components/common/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "../student/SettingsPage.module.css"; // reuse styles

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className={s.row}>
      <div>
        <div className={s.rowLabel}>{label}</div>
        {hint && <div className={s.rowHint}>{hint}</div>}
      </div>
      <button
        type="button"
        className={`${s.toggle} ${checked ? s.toggleOn : ""}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span className={s.knob} />
      </button>
    </div>
  );
}

export default function MentorSettingsPage() {
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [prefs, setPrefs] = useState({
    // Notifications
    emailNotif: true,
    pushNotif: false,
    newRequestAlerts: true,
    sessionReminders: true,
    menteeMessages: true,
    weeklyDigest: true,
    // Mentor-only
    acceptingNewMentees: true,
    // Locale
    theme: "system",
    language: "en",
  });

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const [prefsSaved, setPrefsSaved] = useState(false);
  const [prefsError, setPrefsError] = useState("");

  useEffect(() => {
    if (user?.preferences) {
      setPrefs((prev) => ({ ...prev, ...user.preferences }));
    }
  }, [user]);

  const savePrefs = async (override) => {
    const toSave = override ? { ...prefs, ...override } : prefs;
    setPrefsError("");
    try {
      await api.put("/users/settings", toSave);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch (err) {
      setPrefsError(err.response?.data?.message || "Failed to save preferences");
    }
  };

  const setToggle = (key) => (value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    savePrefs({ [key]: value });
  };

  const handleSubmitPrefs = (e) => {
    e.preventDefault();
    savePrefs();
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);

    if (pwd.next !== pwd.confirm) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (pwd.next.length < 6) {
      setPwdError("Password must be at least 6 characters.");
      return;
    }

    setPwdLoading(true);
    try {
      await api.put("/users/password", {
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });
      setPwdSuccess(true);
      setPwd({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err) {
      setPwdError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  };

  const isGoogleUser = user?.authProvider === "google";

  return (
    <Page>
      <div className={s.head}>
        <h2>Settings</h2>
        <p>Manage your availability, notifications, and security.</p>
      </div>

      {/* Mentor availability — top priority for this role */}
      <Card title={<span className={s.cardTitle}><UserCheck size={16} /> Availability</span>}>
        <Toggle
          label="Accepting new mentees"
          hint="When off, your profile is hidden from the 'Find a mentor' picker and you won't receive new requests."
          checked={prefs.acceptingNewMentees}
          onChange={setToggle("acceptingNewMentees")}
        />
      </Card>

      <Card title={<span className={s.cardTitle}><Bell size={16} /> Notifications</span>}>
        <form className={s.stack} onSubmit={handleSubmitPrefs}>
          <Toggle
            label="Email notifications" hint="Receive important updates by email"
            checked={prefs.emailNotif} onChange={setToggle("emailNotif")}
          />
          <Toggle
            label="Push notifications" hint="Get real-time alerts in the browser"
            checked={prefs.pushNotif} onChange={setToggle("pushNotif")}
          />
          <Toggle
            label="New mentor requests"
            hint="Notify me when a student requests me as their mentor"
            checked={prefs.newRequestAlerts} onChange={setToggle("newRequestAlerts")}
          />
          <Toggle
            label="Session reminders"
            hint="Get a heads-up before scheduled mentoring sessions"
            checked={prefs.sessionReminders} onChange={setToggle("sessionReminders")}
          />
          <Toggle
            label="Mentee messages"
            hint="Notify me when a mentee sends a message"
            checked={prefs.menteeMessages} onChange={setToggle("menteeMessages")}
          />
          <Toggle
            label="Weekly digest"
            hint="A summary of your mentees' progress every Monday"
            checked={prefs.weeklyDigest} onChange={setToggle("weeklyDigest")}
          />
          <div className={s.actions}>
            <Button type="submit">
              <Save size={16} style={{ marginRight: 6 }} />Save preferences
            </Button>
            {prefsSaved && <span className={s.saved}>Saved ✓</span>}
            {prefsError && (
              <span style={{ color: "var(--color-danger)", fontSize: 13 }}>
                {prefsError}
              </span>
            )}
          </div>
        </form>
      </Card>

      <Card title={<span className={s.cardTitle}><Palette size={16} /> Appearance & language</span>}>
        <div className={s.grid}>
          <Field label="Theme">
            <Select
              value={theme}
              onChange={(e) => {
                const v = e.target.value;
                setTheme(v);
                setPrefs((p) => ({ ...p, theme: v }));
                savePrefs({ theme: v });
              }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
          <Field label={
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <Globe size={14} /> Language
            </span>
          }>
            <Select
              value={prefs.language}
              onChange={(e) => {
                const v = e.target.value;
                setPrefs((p) => ({ ...p, language: v }));
                savePrefs({ language: v });
              }}
            >
              <option value="en">English</option>
              <option value="ur">Urdu (اردو)</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card title={<span className={s.cardTitle}><Lock size={16} /> Security</span>}>
        {isGoogleUser ? (
          <div style={{
            padding: 14, background: "var(--color-bg)",
            borderRadius: "var(--radius-sm, 8px)",
            border: "1px dashed var(--color-border-strong, var(--color-border))",
            fontSize: 13, color: "var(--color-text-soft, var(--color-muted))",
            lineHeight: 1.55,
          }}>
            <Globe size={14} style={{
              display: "inline", verticalAlign: "text-bottom", marginRight: 6,
              color: "var(--color-primary)",
            }} />
            You signed in with Google. Your password is managed by Google —
            change it from your <a
              href="https://myaccount.google.com/security"
              target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--color-primary)", fontWeight: 600 }}
            >Google Account settings</a>.
          </div>
        ) : (
          <form className={s.grid} onSubmit={handlePasswordUpdate}>
            <Field label="Current password" required>
              <Input
                type="password" value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                placeholder="••••••••" required
              />
            </Field>
            <Field label="New password" required>
              <Input
                type="password" value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                placeholder="At least 6 characters" minLength={6} required
              />
            </Field>
            <Field label="Confirm new password" required>
              <Input
                type="password" value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                placeholder="Repeat password" minLength={6} required
              />
            </Field>

            {pwdError && (
              <div style={{ color: "var(--color-danger)", fontSize: 13, gridColumn: "1 / -1" }}>
                <AlertCircle size={14} style={{
                  display: "inline", verticalAlign: "text-bottom", marginRight: 4,
                }} />
                {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div style={{ color: "var(--color-success)", fontSize: 13, gridColumn: "1 / -1" }}>
                Password updated successfully!
              </div>
            )}

            <div className={s.actions} style={{ gridColumn: "1 / -1" }}>
              <Button
                variant="primary"
                type="submit"
                disabled={pwdLoading || !pwd.current || !pwd.next || !pwd.confirm}
              >
                {pwdLoading ? <Loader2 size={16} className="spin" style={{ marginRight: 6 }} /> : null}
                {pwdLoading ? "Updating..." : "Update password"}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card title={
        <span className={s.cardTitle} style={{ color: "var(--color-danger)" }}>
          <Trash2 size={16} /> Danger zone
        </span>
      }>
        <div className={s.danger}>
          <div>
            <div className={s.rowLabel}>Log out of all sessions</div>
            <div className={s.rowHint}>You'll be signed out from every device.</div>
          </div>
          <Button variant="ghost" onClick={logout}>Log out</Button>
        </div>
      </Card>
    </Page>
  );
}