// src/pages/student/ProfilePage.jsx
import React, { useRef, useState } from "react";
import { Mail, User as UserIcon, GraduationCap, MapPin, ImagePlus, Save, Loader2, AlertCircle } from "lucide-react";
import { Page } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import { Field, Input, Textarea } from "../../components/common/Field.jsx";
import Button from "../../components/common/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "./ProfilePage.module.css";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef(null);
  
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    university: user?.university || "",
    location: user?.location || "",
  });
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Converts image to Base64 and updates database instantly
  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const avatarBase64 = reader.result;
        // Optimistic UI update
        updateProfile({ avatar: avatarBase64 });
        // Save to database
        await api.put("/users/profile", { avatar: avatarBase64 });
      } catch (err) {
        setError("Failed to update profile picture");
      }
    };
    reader.readAsDataURL(file);
  };

  const onSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Send dynamic update to backend
      const { data } = await api.put("/users/profile", form);
      // Update global context
      updateProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const initials = (form.name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Page>
      <div className={s.hero}>
        <div className={s.avatarWrap}>
          <div
            className={s.avatar}
            style={user?.avatar && user.avatar.length > 10 ? { backgroundImage: `url(${user.avatar})`, backgroundSize: "cover", color: "transparent" } : {}}
          >
            {!(user?.avatar && user.avatar.length > 10) && initials}
          </div>
          <button type="button" className={s.avatarEdit} onClick={() => fileRef.current?.click()} aria-label="Change photo">
            <ImagePlus size={16} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
        </div>
        <div>
          <span className={s.eyebrow}>{user?.role || "Student"} profile</span>
          <h2>{form.name || "Your name"}</h2>
          <p>{form.email}</p>
        </div>
      </div>

      <Card title="Personal information">
        <form className={s.grid} onSubmit={onSave}>
          <Field label="Full name">
            <Input value={form.name} onChange={set("name")} placeholder="Jane Doe" required />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
          </Field>
          <Field label="University / Institution">
            <Input value={form.university} onChange={set("university")} placeholder="e.g. UOG" />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={set("location")} placeholder="City, Pakistan" />
          </Field>
          <div className={s.full}>
            <Field label="Bio">
              <Textarea value={form.bio} onChange={set("bio")} rows={4} placeholder="Tell us about your career goals..." />
            </Field>
          </div>
          
          {error && <div style={{ color: "var(--color-danger)", fontSize: "13px", gridColumn: "1 / -1" }}><AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {error}</div>}
          
          <div className={s.actions}>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" style={{ marginRight: 6 }} /> : <Save size={16} style={{ marginRight: 6 }} />}
              {loading ? "Saving..." : "Save changes"}
            </Button>
            {saved && <span className={s.saved}>Saved ✓</span>}
          </div>
        </form>
      </Card>

      <Card title="Account details">
        <ul className={s.meta}>
          <li><UserIcon size={16} /> <span>Role</span><strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong></li>
          <li><Mail size={16} /> <span>Email</span><strong>{user?.email}</strong></li>
          <li><GraduationCap size={16} /> <span>University</span><strong>{user?.university || "—"}</strong></li>
          <li><MapPin size={16} /> <span>Location</span><strong>{user?.location || "—"}</strong></li>
        </ul>
      </Card>
    </Page>
  );
}