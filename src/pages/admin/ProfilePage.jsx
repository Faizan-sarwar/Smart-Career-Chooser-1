import React, { useRef, useState } from "react";
import {
  Mail,
  User as UserIcon,
  ShieldCheck,
  MapPin,
  ImagePlus,
  Save,
  Loader2,
  AlertCircle,
  Lock as LockIcon,
  Globe,
  CalendarDays,
} from "lucide-react";
import { Page } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import { Field, Input, Textarea } from "../../components/common/Field.jsx";
import Button from "../../components/common/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "../student/ProfilePage.module.css";

export default function AdminProfilePage() {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    title: user?.headline || "", // reuse the `headline` field as "title"
    bio: user?.bio || "",
    location: user?.location || "",
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
        const { data } = await api.put("/users/profile", {
          avatar: avatarBase64,
        });
        updateProfile(data);
        setAvatarBroken(false);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to update profile picture",
        );
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
        headline: form.title, // stored under `headline` on the User model
        bio: form.bio,
        location: form.location,
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

  const initials = (form.name || "A")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hasAvatar =
    !!user?.avatar &&
    /^(https?:\/\/|data:image\/)/.test(user.avatar) &&
    !avatarBroken;
  const isGoogleUser = user?.authProvider === "google";

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-PK", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <Page>
      <div className={s.hero}>
        <div className={s.avatarWrap}>
          <div
            className={s.avatar}
            style={{
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <span
                style={{ fontSize: "32px", fontWeight: 700, color: "white" }}
              >
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
            {uploadingAvatar ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <ImagePlus size={16} />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onPickFile}
          />
        </div>
        <div>
          <span className={s.eyebrow}>Administrator profile</span>
          <h2>{form.name || "Your name"}</h2>
          <p>{form.title || form.email}</p>
          {isGoogleUser && (
            <p
              style={{
                fontSize: 12,
                color: "var(--color-muted)",
                marginTop: 4,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Globe size={11} /> Signed in with Google
            </p>
          )}
        </div>
      </div>

      <Card title="Personal information">
        <form className={s.grid} onSubmit={onSave}>
          <Field label="Full name" required>
            <Input
              value={form.name}
              onChange={set("name")}
              placeholder="Admin name"
              required
            />
          </Field>

          <Field
            label={
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                Email <LockIcon size={11} />
              </span>
            }
          >
            <Input
              type="email"
              value={form.email}
              readOnly
              disabled
              style={{ cursor: "not-allowed", opacity: 0.7 }}
              title="Email is your account identifier and can't be changed"
            />
          </Field>

          <div className={s.full}>
            <Field label="Title / Role description">
              <Input
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Platform Administrator, FYP Supervisor"
              />
            </Field>
          </div>

          <Field label="Location">
            <Input
              value={form.location}
              onChange={set("location")}
              placeholder="City, Pakistan"
            />
          </Field>

          <div className={s.full}>
            <Field label="Bio">
              <Textarea
                value={form.bio}
                onChange={set("bio")}
                rows={4}
                placeholder="A short note about your role on the platform..."
              />
            </Field>
          </div>

          {error && (
            <div
              style={{
                color: "var(--color-danger)",
                fontSize: 13,
                gridColumn: "1 / -1",
              }}
            >
              <AlertCircle
                size={14}
                style={{
                  display: "inline",
                  verticalAlign: "text-bottom",
                  marginRight: 4,
                }}
              />
              {error}
            </div>
          )}

          <div className={s.actions}>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2
                  size={16}
                  className="spin"
                  style={{ marginRight: 6 }}
                />
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
            <ShieldCheck size={16} /> <span>Role</span>
            <strong style={{ textTransform: "capitalize" }}>
              {user?.role}
            </strong>
          </li>
          <li>
            <Mail size={16} /> <span>Email</span>
            <strong>{user?.email}</strong>
          </li>
          <li>
            <MapPin size={16} /> <span>Location</span>
            <strong>{user?.location || "—"}</strong>
          </li>
          <li>
            <CalendarDays size={16} /> <span>Member since</span>
            <strong>{memberSince}</strong>
          </li>
        </ul>
      </Card>
    </Page>
  );
}
