// src/pages/auth/ResetPassword.jsx
//
// Lands here from either route:
//   /reset-password?email=...&token=xyz   (clicked the email link)
//   /reset-password?email=...&otp=123456  (verified the OTP)
//
// User enters new password twice → backend verifies the credential
// against the active reset record and updates the password.

import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  GraduationCap, Lock, AlertCircle, Loader2, Check, Eye, EyeOff,
  ShieldCheck, KeyRound,
} from "lucide-react";
import Button from "../../components/common/Button.jsx";
import { Field, Input } from "../../components/common/Field.jsx";
import api from "../../lib/axios.js";
import s from "./Auth.module.css";

// Same strength rules as your RegisterPage uses
function scorePassword(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(pw)) score++;
  return Math.min(score, 5);
}

const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
const STRENGTH_COLORS = ["#dc2626", "#ea580c", "#eab308", "#16a34a", "#0d9488", "#0d9488"];

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const otp = searchParams.get("otp") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Sanity check on landing
  useEffect(() => {
    if (!email || (!token && !otp)) {
      setError("Invalid or incomplete reset link. Please request a new one.");
    }
  }, [email, token, otp]);

  const strength = useMemo(() => scorePassword(password), [password]);
  const passwordValid = strength >= 2 && password.length >= 6;
  const passwordsMatch = password.length > 0 && password === confirm;
  const formValid = passwordValid && passwordsMatch && email && (token || otp);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValid) return;

    setLoading(true);
    setError("");

    try {
      const payload = { email, newPassword: password };
      if (token) payload.token = token;
      if (otp) payload.otp = otp;

      await api.post("/auth/reset-password", payload);
      setSuccess(true);
      // Redirect to login after 2.5s
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS STATE ────────────────────────────────────────────
  if (success) {
    return (
      <div className={s.shell}>
        <div className={s.brandSide}>
          <div className={s.brandBg}>
            <div className={s.blob1} />
            <div className={s.blob2} />
          </div>
          <div className={s.brandInner}>
            <div className={s.logo}><GraduationCap size={26} /></div>
            <h1 className={s.brandTitle}>You're all set</h1>
            <p className={s.brandSubtitle}>Your password has been updated.</p>
          </div>
        </div>
        <div className={s.formSide}>
          <div className={s.formCard} style={{ textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              color: "white", display: "grid", placeItems: "center",
              margin: "0 auto 20px", boxShadow: "0 10px 24px -8px rgba(22,163,74,0.4)",
            }}>
              <Check size={36} strokeWidth={3} />
            </div>
            <h2 className={s.formTitle}>Password reset!</h2>
            <p className={s.formSubtitle}>
              Redirecting you to login...
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate("/login")} style={{ marginTop: 16 }}>
              Sign in now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.shell}>
      <div className={s.brandSide}>
        <div className={s.brandBg}>
          <div className={s.blob1} />
          <div className={s.blob2} />
        </div>
        <div className={s.brandInner}>
          <div className={s.logo}><GraduationCap size={26} /></div>
          <h1 className={s.brandTitle}>Set a new password</h1>
          <p className={s.brandSubtitle}>
            Choose a strong one — at least 6 characters, mixing letters,
            numbers, and symbols.
          </p>
          <div className={s.featureList}>
            <div className={s.feature}>
              <ShieldCheck size={16} /> Stored as bcrypt hash
            </div>
            <div className={s.feature}>
              <ShieldCheck size={16} /> All other sessions logged out
            </div>
            <div className={s.feature}>
              <KeyRound size={16} /> {token ? "Link verified" : "OTP verified"}
            </div>
          </div>
        </div>
        <div className={s.brandFooter}>
          University of Gujrat · Final Year Project 2026
        </div>
      </div>

      <div className={s.formSide}>
        <div className={s.formCard}>
          <h2 className={s.formTitle}>Create a new password</h2>
          <p className={s.formSubtitle}>
            For <strong style={{ color: "var(--color-primary)" }}>{email}</strong>
          </p>

          <form onSubmit={handleSubmit} className={s.form} noValidate>
            <Field label="New password" required>
              <div className={s.inputGroup}>
                <Lock size={16} className={s.inputIcon} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  autoComplete="new-password"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  className={s.passwordToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1, height: 4, borderRadius: 2,
                          background: i < strength
                            ? STRENGTH_COLORS[strength]
                            : "var(--color-border)",
                          transition: "all 0.2s ease",
                        }}
                      />
                    ))}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    color: STRENGTH_COLORS[strength],
                  }}>
                    {STRENGTH_LABELS[strength]}
                  </div>
                </div>
              )}
            </Field>

            <Field label="Confirm new password" required>
              <div className={s.inputGroup}>
                <Lock size={16} className={s.inputIcon} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={
                    confirm.length > 0 && !passwordsMatch ? s.inputInvalid :
                    confirm.length > 0 && passwordsMatch ? s.inputValid : ""
                  }
                />
              </div>
              {confirm.length > 0 && !passwordsMatch && (
                <span className={`${s.inlineMsg} ${s.inlineMsgError}`}>
                  <AlertCircle size={12} /> Passwords don't match
                </span>
              )}
            </Field>

            {error && (
              <div className={s.errorBox} role="alert">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" disabled={loading || !formValid}>
              {loading ? (
                <><Loader2 size={16} className="spin" /> Updating password…</>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>

          <div className={s.formFooter}>
            Remembered it? <Link to="/login" className={s.link}>Sign in instead</Link>
          </div>
        </div>
      </div>
    </div>
  );
}