// src/pages/mentor/ProfilePage.jsx
//
// Mirror of student ProfilePage with mentor-specific fields:
//   - Expertise areas (multi-select chips: Software Engineering, Data
//     Science, Product Management, Business Analysis, etc.)
//   - Years of experience
//   - Professional headline
//   - University now optional, replaced by "Employer / Company" as primary

import React, { useRef, useState } from "react";
import {
  Mail, User as UserIcon, Briefcase, MapPin, ImagePlus,
  Save, Loader2, AlertCircle, Lock as LockIcon, Globe,
  X, Plus,
} from "lucide-react";
import { Page } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import { Field, Input, Textarea, Select } from "../../components/common/Field.jsx";
import Button from "../../components/common/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "../student/ProfilePage.module.css"; // reuse the same CSS

const EXPERTISE_OPTIONS = [
  "Software Engineering",
  "Frontend Development",
  "Backend Development",
  "Full-Stack Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning / AI",
  "DevOps / Cloud",
  "Cybersecurity",
  "Product Management",
  "Business Analysis",
  "UX/UI Design",
  "Quality Assurance",
  "Database Administration",
  "Game Development",
  "Technical Writing",
  "Sales Engineering",
  "Entrepreneurship",
];

const YEARS_BUCKETS = [
  { value: "1-2", label: "1–2 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "6-9", label: "6–9 years" },
  { value: "10-14", label: "10–14 years" },
  { value: "15+", label: "15+ years" },
];

export default function MentorProfilePage() {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    headline: user?.headline || "",
    bio: user?.bio || "",
    employer: user?.employer || "",
    location: user?.location || "",
    yearsExperience: user?.yearsExperience || "",
    expertise: Array.isArray(user?.expertise) ? user.expertise : [],
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addExpertise = (value) => {
    const trimmed = (value || "").trim();
    if (!trimmed || form.expertise.includes(trimmed)) return;
    if (form.expertise.length >= 8) {
      setError("You can list up to 8 expertise areas");
      return;
    }
    setForm((f) => ({ ...f, expertise: [...f.expertise, trimmed] }));
    setExpertiseInput("");
    setError("");
  };

  const removeExpertise = (value) => {
    setForm((f) => ({ ...f, expertise: f.expertise.filter((x) => x !== value) }));
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }
    setError("");
    setUploadingAvatar(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const avatarBase64 = reader.result;
        const { data } = await api.put("/users/profile", { avatar: avatarBase64 });
        updateProfile(data);
        setAvatarBroken(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to update profile picture");
      } finally {
        setUploadingAvatar(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  const onSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        headline: form.headline,
        bio: form.bio,
        employer: form.employer,
        location: form.location,
        yearsExperience: form.yearsExperience,
        expertise: form.expertise,
      };
      const { data } = await api.put("/users/profile", payload);
      updateProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const initials = (form.name || "M")
    .split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const hasAvatar =
    !!user?.avatar &&
    /^(https?:\/\/|data:image\/)/.test(user.avatar) &&
    !avatarBroken;
  const isGoogleUser = user?.authProvider === "google";

  return (
    <Page>
      <div className={s.hero}>
        <div className={s.avatarWrap}>
          <div
            className={s.avatar}
            style={{
              overflow: "hidden", display: "flex",
              alignItems: "center", justifyContent: "center",
              position: "relative",
            }}
          >
            {hasAvatar ? (
              <img
                src={user.avatar}
                alt={user.name || "Profile"}
                referrerPolicy="no-referrer"
                onError={() => setAvatarBroken(true)}
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover", display: "block",
                }}
              />
            ) : (
              <span style={{ fontSize: "32px", fontWeight: 700, color: "white" }}>
                {initials}
              </span>
            )}
          </div>
          <button
            type="button"
            className={s.avatarEdit}
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            aria-label="Change photo"
          >
            {uploadingAvatar ? <Loader2 size={14} className="spin" /> : <ImagePlus size={16} />}
          </button>
          <input
            ref={fileRef} type="file" accept="image/*"
            hidden onChange={onPickFile}
          />
        </div>
        <div>
          <span className={s.eyebrow}>Mentor profile</span>
          <h2>{form.name || "Your name"}</h2>
          <p>{form.headline || form.email}</p>
          {isGoogleUser && (
            <p style={{
              fontSize: 12, color: "var(--color-muted)",
              marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <Globe size={11} /> Signed in with Google
            </p>
          )}
        </div>
      </div>

      <Card title="Personal information">
        <form className={s.grid} onSubmit={onSave}>
          <Field label="Full name" required>
            <Input value={form.name} onChange={set("name")} placeholder="Faizan Sarwar" required />
          </Field>

          <Field label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              Email <LockIcon size={11} />
            </span>
          }>
            <Input
              type="email" value={form.email} readOnly disabled
              style={{ cursor: "not-allowed", opacity: 0.7 }}
              title="Email is your account identifier and can't be changed"
            />
          </Field>

          <div className={s.full}>
            <Field label="Professional headline">
              <Input
                value={form.headline} onChange={set("headline")}
                placeholder="e.g. Senior Software Engineer at Systems Ltd · Ex-10Pearls"
              />
            </Field>
          </div>

          <Field label="Current employer / Company">
            <Input
              value={form.employer} onChange={set("employer")}
              placeholder="e.g. Systems Ltd, 10Pearls, Devsinc, Afiniti"
            />
          </Field>

          <Field label="Location">
            <Input
              value={form.location} onChange={set("location")}
              placeholder="City, Pakistan"
            />
          </Field>

          <Field label="Years of experience">
            <Select value={form.yearsExperience} onChange={set("yearsExperience")}>
              <option value="">Select…</option>
              {YEARS_BUCKETS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </Select>
          </Field>

          <div className={s.full}>
            <Field label="Bio">
              <Textarea
                value={form.bio} onChange={set("bio")} rows={4}
                placeholder="Share your background, mentorship style, and what kind of students you'd love to guide..."
              />
            </Field>
          </div>

          {/* Expertise chips */}
          <div className={s.full}>
            <Field label={`Expertise areas (${form.expertise.length}/8)`}>
              <div style={chipsRowStyle}>
                {form.expertise.map((e) => (
                  <span key={e} style={chipStyle}>
                    {e}
                    <button
                      type="button"
                      onClick={() => removeExpertise(e)}
                      style={chipCloseStyle}
                      aria-label={`Remove ${e}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Select
                  value=""
                  onChange={(ev) => addExpertise(ev.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">+ Add an expertise area…</option>
                  {EXPERTISE_OPTIONS
                    .filter((e) => !form.expertise.includes(e))
                    .map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                </Select>
                <div style={{ display: "flex", gap: 4 }}>
                  <Input
                    value={expertiseInput}
                    onChange={(ev) => setExpertiseInput(ev.target.value)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter") {
                        ev.preventDefault();
                        addExpertise(expertiseInput);
                      }
                    }}
                    placeholder="…or type your own"
                    style={{ minWidth: 180 }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addExpertise(expertiseInput)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </Field>
          </div>

          {error && (
            <div style={{
              color: "var(--color-danger)", fontSize: 13, gridColumn: "1 / -1",
            }}>
              <AlertCircle size={14} style={{
                display: "inline", verticalAlign: "text-bottom", marginRight: 4,
              }} />
              {error}
            </div>
          )}

          <div className={s.actions}>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 size={16} className="spin" style={{ marginRight: 6 }} />
              ) : (
                <Save size={16} style={{ marginRight: 6 }} />
              )}
              {loading ? "Saving..." : "Save changes"}
            </Button>
            {saved && <span className={s.saved}>Saved ✓</span>}
          </div>
        </form>
      </Card>

      <Card title="Account details">
        <ul className={s.meta}>
          <li>
            <UserIcon size={16} /> <span>Role</span>
            <strong style={{ textTransform: "capitalize" }}>{user?.role}</strong>
          </li>
          <li>
            <Mail size={16} /> <span>Email</span>
            <strong>{user?.email}</strong>
          </li>
          <li>
            <Briefcase size={16} /> <span>Employer</span>
            <strong>{user?.employer || "—"}</strong>
          </li>
          <li>
            <MapPin size={16} /> <span>Location</span>
            <strong>{user?.location || "—"}</strong>
          </li>
        </ul>
      </Card>
    </Page>
  );
}

const chipsRowStyle = {
  display: "flex", flexWrap: "wrap", gap: 8, minHeight: 30,
};
const chipStyle = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "5px 10px 5px 12px",
  background: "var(--color-primary-soft)",
  color: "var(--color-primary-darker)",
  borderRadius: 999,
  fontSize: 12, fontWeight: 600,
};
const chipCloseStyle = {
  display: "grid", placeItems: "center",
  width: 18, height: 18, borderRadius: "50%",
  background: "rgba(13,148,136,0.18)",
  color: "var(--color-primary-darker)",
  border: "none", cursor: "pointer", padding: 0,
};