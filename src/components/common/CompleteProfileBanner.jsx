// src/components/common/CompleteProfileBanner.jsx
//
// Shown on the student/mentor dashboard the first time after a Google
// sign-in if the user's profile is incomplete (no university, no bio,
// no location). Dismissible — once dismissed for a user, stays dismissed
// across sessions (per-user localStorage key).

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, X, UserCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function CompleteProfileBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dismissed banner is sticky per user via localStorage key
  const dismissKey = user ? `cc.completeProfile.dismissed.${user._id || user.id}` : null;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined" || !dismissKey) return true;
    return localStorage.getItem(dismissKey) === "true";
  });

  if (!user || dismissed) return null;

  // Only show for Google users (or anyone with an incomplete profile)
  const isGoogle = user.authProvider === "google";
  const missing = [];
  if (!user.university || user.university.trim() === "") missing.push("university");
  if (!user.bio || user.bio.trim() === "") missing.push("bio");
  if (!user.location || user.location.trim() === "") missing.push("location");

  // Show only if at least 2 fields are missing AND user signed in with Google
  // (avoids nagging users who deliberately left bio blank)
  if (!isGoogle || missing.length < 2) return null;

  const role = (user.role || "student").toLowerCase();
  const handleComplete = () => navigate(`/${role}/profile`);
  const handleDismiss = () => {
    setDismissed(true);
    if (dismissKey) localStorage.setItem(dismissKey, "true");
  };

  return (
    <div style={wrapStyle} role="region" aria-label="Complete your profile">
      <div style={iconStyle}>
        <UserCircle2 size={22} />
      </div>
      <div style={textStyle}>
        <div style={titleStyle}>
          <Sparkles size={14} style={{ color: "var(--color-accent, #f97316)" }} />
          Welcome to Smart Career Chooser!
        </div>
        <div style={bodyStyle}>
          You signed in with Google. Take a minute to complete your profile —
          add your university, bio, and location so mentors can find you.
        </div>
      </div>
      <div style={actionsStyle}>
        <button onClick={handleComplete} style={primaryBtnStyle}>
          Complete profile
          <ArrowRight size={14} />
        </button>
        <button onClick={handleDismiss} style={closeBtnStyle} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

const wrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "14px 18px",
  marginBottom: 18,
  background: "linear-gradient(135deg, var(--color-primary-faint, rgba(13,148,136,0.08)) 0%, var(--color-accent-soft, rgba(249,115,22,0.10)) 100%)",
  border: "1px solid var(--color-primary-soft)",
  borderRadius: "var(--radius-md, 12px)",
  animation: "slideUpFade 0.3s ease both",
};
const iconStyle = {
  width: 40, height: 40, borderRadius: "50%",
  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
  color: "white", display: "grid", placeItems: "center",
  flexShrink: 0,
  boxShadow: "0 4px 10px -3px rgba(13, 148, 136, 0.45)",
};
const textStyle = { flex: 1, minWidth: 0 };
const titleStyle = {
  display: "inline-flex", alignItems: "center", gap: 6,
  fontSize: 14, fontWeight: 800, color: "var(--color-text)",
  letterSpacing: "-0.01em", marginBottom: 2,
};
const bodyStyle = { fontSize: 13, color: "var(--color-text-soft, var(--color-muted))", lineHeight: 1.5 };
const actionsStyle = { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 };
const primaryBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 16px",
  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
  color: "white", border: "none",
  borderRadius: "var(--radius-sm, 8px)",
  fontSize: 13, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit",
  boxShadow: "0 4px 10px -3px rgba(13, 148, 136, 0.4)",
};
const closeBtnStyle = {
  background: "transparent", border: "none",
  width: 32, height: 32, borderRadius: "50%",
  cursor: "pointer", display: "grid", placeItems: "center",
  color: "var(--color-text-soft, var(--color-muted))",
};