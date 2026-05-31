// src/pages/auth/ForgotPassword.jsx
//
// Two-step flow:
//   Step 1 — enter email → backend emails link + OTP
//   Step 2 — enter OTP from email → verify → redirect to /reset-password
//
// Alternatively, the user can click the link in the email which also
// lands them on /reset-password but with the token instead of OTP.

import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Mail, ArrowLeft, AlertCircle, Loader2, Check,
  ShieldCheck, RefreshCw, KeyRound,
} from "lucide-react";
import Button from "../../components/common/Button.jsx";
import { Field, Input } from "../../components/common/Field.jsx";
import api from "../../lib/axios.js";
import s from "./Auth.module.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOLDOWN_SECONDS = 30;

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = email, 2 = OTP
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [cooldown, setCooldown] = useState(0); // resend countdown
  const otpRefs = useRef([]);

  // Countdown for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Auto-focus first OTP box on step 2
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) otpRefs.current[0].focus();
  }, [step]);

  const emailValid = EMAIL_REGEX.test(email);
  const otp = otpDigits.join("");
  const otpComplete = otp.length === 6 && /^\d{6}$/.test(otp);

  // ── STEP 1: Send the reset email ────────────────────────────────
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailValid) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSuccess(data.message || "Check your email for the reset code & link.");
      setStep(2);
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ─────────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess("New code sent. Check your email.");
      setOtpDigits(["", "", "", "", "", ""]);
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP, then route to /reset-password ───────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpComplete) return;

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/verify-otp", { email, otp });
      // OTP verified → take them to the new-password screen carrying OTP+email
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers — auto-advance, backspace-back, paste support
  const handleOtpChange = (idx, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[idx] = value;
    setOtpDigits(next);
    if (value && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className={s.shell}>
      {/* Left side - branding */}
      <div className={s.brandSide}>
        <div className={s.brandBg}>
          <div className={s.blob1} />
          <div className={s.blob2} />
        </div>
        <div className={s.brandInner}>
          <div className={s.logo}>
            <GraduationCap size={26} />
          </div>
          <h1 className={s.brandTitle}>Account recovery</h1>
          <p className={s.brandSubtitle}>
            {step === 1
              ? "Tell us the email you used to register. We'll send you a 6-digit code and a reset link."
              : "Check your inbox for a 6-digit code. You can either enter it here, or click the link in the email — both work."}
          </p>
          <div className={s.featureList}>
            <div className={s.feature}>
              <ShieldCheck size={16} /> Codes expire in 15 minutes
            </div>
            <div className={s.feature}>
              <ShieldCheck size={16} /> Hashed & encrypted in storage
            </div>
            <div className={s.feature}>
              <ShieldCheck size={16} /> Single-use, rate-limited
            </div>
          </div>
        </div>
        <div className={s.brandFooter}>
          University of Gujrat · Final Year Project 2026
        </div>
      </div>

      {/* Right side - form */}
      <div className={s.formSide}>
        <div className={s.formCard}>
          <Link to="/login" className={s.linkSm} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to login
          </Link>

          {step === 1 && (
            <>
              <h2 className={s.formTitle}>Forgot your password?</h2>
              <p className={s.formSubtitle}>
                Enter your email and we'll send you a code & link to reset it.
              </p>

              <form onSubmit={handleSendEmail} className={s.form} noValidate>
                <Field label="Email" required>
                  <div className={s.inputGroup}>
                    <Mail size={16} className={s.inputIcon} />
                    <Input
                      type="email"
                      placeholder="you@university.edu.pk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </Field>

                {error && (
                  <div className={s.errorBox} role="alert">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <Button type="submit" variant="primary" size="lg" disabled={loading || !emailValid}>
                  {loading ? (
                    <><Loader2 size={16} className="spin" /> Sending…</>
                  ) : (
                    <>Send reset code</>
                  )}
                </Button>
              </form>

              <div className={s.formFooter}>
                Remembered it? <Link to="/login" className={s.link}>Sign in instead</Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className={s.formTitle}>Enter your code</h2>
              <p className={s.formSubtitle}>
                We sent a 6-digit code to <strong style={{ color: "var(--color-primary)" }}>{email}</strong>.
              </p>

              {success && (
                <div style={{
                  background: "var(--color-success-soft, #dcfce7)",
                  color: "var(--color-success, #16a34a)",
                  padding: "10px 14px", borderRadius: 8,
                  fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: 16,
                }}>
                  <Check size={14} /> {success}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className={s.form} noValidate>
                <Field label="6-digit code" required>
                  <div
                    style={{ display: "flex", gap: 8, justifyContent: "space-between" }}
                    onPaste={handleOtpPaste}
                  >
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        style={{
                          width: "100%", aspectRatio: "1 / 1",
                          textAlign: "center",
                          fontSize: 22, fontWeight: 700,
                          border: "1.5px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--color-surface)",
                          color: "var(--color-text)",
                          outline: "none",
                          transition: "all 0.18s ease",
                          fontFamily: "monospace",
                        }}
                        onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "var(--color-border)"; }}
                      />
                    ))}
                  </div>
                </Field>

                {error && (
                  <div className={s.errorBox} role="alert">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <Button type="submit" variant="primary" size="lg" disabled={loading || !otpComplete}>
                  {loading ? (
                    <><Loader2 size={16} className="spin" /> Verifying…</>
                  ) : (
                    <><KeyRound size={16} /> Verify code</>
                  )}
                </Button>

                <div style={{
                  marginTop: 16, padding: "14px 16px",
                  background: "var(--color-bg)", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  fontSize: 13, color: "var(--color-text-soft)", lineHeight: 1.5,
                }}>
                  Didn't get the email? Check spam, or{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || loading}
                    style={{
                      background: "none", border: "none", padding: 0,
                      color: cooldown > 0 ? "var(--color-muted)" : "var(--color-primary)",
                      fontWeight: 600, cursor: cooldown > 0 ? "not-allowed" : "pointer",
                      fontFamily: "inherit", fontSize: "inherit",
                      textDecoration: cooldown > 0 ? "none" : "underline",
                    }}
                  >
                    <RefreshCw size={11} style={{ verticalAlign: "middle", marginRight: 2 }} />
                    {cooldown > 0 ? `resend in ${cooldown}s` : "resend it"}
                  </button>.
                  <br /><br />
                  Or just <strong>click the link in the email</strong> — it works too.
                </div>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); setSuccess(""); setOtpDigits(["","","","","",""]); }}
                  style={{
                    marginTop: 8, background: "none", border: "none",
                    color: "var(--color-muted)", fontSize: 12, cursor: "pointer",
                    fontFamily: "inherit", textDecoration: "underline",
                  }}
                >
                  Wrong email? Start over
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}