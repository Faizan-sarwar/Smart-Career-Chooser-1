// src/pages/student/SettingsPage.jsx
import { useTheme } from "../../context/ThemeContext.jsx";
import React, { useState, useEffect } from "react";
import { Bell, Lock, Palette, Globe, Trash2, Save, Loader2, AlertCircle } from "lucide-react";
import { Page } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import { Field, Input, Select } from "../../components/common/Field.jsx";
import Button from "../../components/common/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "./SettingsPage.module.css";

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

export default function SettingsPage() {
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [prefs, setPrefs] = useState({
    emailNotif: true,
    pushNotif: false,
    weeklyDigest: true,
    mentorMessages: true,
    theme: "system",
    language: "en",
  });

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const [prefsSaved, setPrefsSaved] = useState(false);

  // Fetch user preferences on mount
  useEffect(() => {
    if (user?.preferences) {
      setPrefs(prev => ({ ...prev, ...user.preferences }));
    }
  }, [user]);

  const set = (k) => (v) => setPrefs((p) => ({ ...p, [k]: v }));

  const savePrefs = async (e) => {
    e.preventDefault();
    try {
      await api.put("/users/settings", prefs);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save preferences");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);

    if (pwd.next !== pwd.confirm) {
      setPwdError("New passwords do not match.");
      return;
    }

    setPwdLoading(true);
    try {
      await api.put("/users/password", {
        currentPassword: pwd.current,
        newPassword: pwd.next
      });
      setPwdSuccess(true);
      setPwd({ current: "", next: "", confirm: "" }); // Reset form
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err) {
      setPwdError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <Page>
      <div className={s.head}>
        <h2>Settings</h2>
        <p>Manage notifications, security, and appearance.</p>
      </div>

      <Card title={<span className={s.cardTitle}><Bell size={16} /> Notifications</span>}>
        <form className={s.stack} onSubmit={savePrefs}>
          <Toggle label="Email notifications" hint="Receive important updates by email" checked={prefs.emailNotif} onChange={set("emailNotif")} />
          <Toggle label="Push notifications" hint="Get real-time alerts in the browser" checked={prefs.pushNotif} onChange={set("pushNotif")} />
          <Toggle label="Weekly digest" hint="A summary of your progress every Monday" checked={prefs.weeklyDigest} onChange={set("weeklyDigest")} />
          <Toggle label="Mentor messages" hint="Notify me when a mentor replies" checked={prefs.mentorMessages} onChange={set("mentorMessages")} />
          <div className={s.actions}>
            <Button type="submit"><Save size={16} style={{ marginRight: 6 }} />Save preferences</Button>
            {prefsSaved && <span className={s.saved}>Saved ✓</span>}
          </div>
        </form>
      </Card>

      <Card title={<span className={s.cardTitle}><Palette size={16} /> Appearance & language</span>}>
        <div className={s.grid}>
          <Field label="Theme">
            {/* 🚨 UPDATE THIS SELECT MENU 🚨 */}
            <Select
              value={theme} // Use the global theme state
              onChange={(e) => {
                setTheme(e.target.value); // Instantly changes the screen!
                set("theme")(e.target.value); // Saves it to the backend state
                savePrefs(e); // Sends to database
              }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
          <Field label={<span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Globe size={14} /> Language</span>}>
            <Select value={prefs.language} onChange={(e) => { set("language")(e.target.value); savePrefs(e); }}>
              <option value="en">English</option>
              <option value="ur">Urdu (اردو)</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card title={<span className={s.cardTitle}><Lock size={16} /> Security</span>}>
        <form className={s.grid} onSubmit={handlePasswordUpdate}>
          <Field label="Current password" required>
            <Input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder="••••••••" required />
          </Field>
          <Field label="New password" required>
            <Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} placeholder="At least 6 characters" minLength={6} required />
          </Field>
          <Field label="Confirm new password" required>
            <Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} placeholder="Repeat password" minLength={6} required />
          </Field>

          {pwdError && <div style={{ color: "var(--color-danger)", fontSize: "13px", gridColumn: "1 / -1" }}><AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {pwdError}</div>}
          {pwdSuccess && <div style={{ color: "var(--color-success)", fontSize: "13px", gridColumn: "1 / -1" }}>Password updated successfully!</div>}

          <div className={s.actions} style={{ gridColumn: "1 / -1" }}>
            <Button variant="primary" type="submit" disabled={pwdLoading || !pwd.current || !pwd.next || !pwd.confirm}>
              {pwdLoading ? <Loader2 size={16} className="spin" style={{ marginRight: 6 }} /> : null}
              {pwdLoading ? "Updating..." : "Update password"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title={<span className={s.cardTitle} style={{ color: "var(--color-danger)" }}><Trash2 size={16} /> Danger zone</span>}>
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