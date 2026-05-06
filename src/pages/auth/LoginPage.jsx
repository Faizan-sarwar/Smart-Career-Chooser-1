// src/pages/auth/LoginPage.jsx
//
// Enterprise-grade login: real-time email validation, password show/hide,
// remember me, loading state, helpful error messages, full keyboard nav.

import React, { useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  Lock,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  Loader2,
} from "lucide-react";
import Button from "../../components/common/Button.jsx";
import { Field, Input } from "../../components/common/Field.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "./Auth.module.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Validation derived state ────────────────────────────────────
  const emailValid = EMAIL_REGEX.test(email);
  const passwordValid = password.length >= 6;
  const formValid = emailValid && passwordValid;

  const emailError = touched.email && email && !emailValid
    ? "Enter a valid email address"
    : "";
  const passwordError = touched.password && password && !passwordValid
    ? "Password must be at least 6 characters"
    : "";

  const redirectTo = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!formValid) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", { email, password });

      if (login) {
        login(data, data.token);
      } else {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", data.token);
        storage.setItem("user", JSON.stringify(data));
      }

      const role = (data.role || "student").toLowerCase();
      navigate(redirectTo || `/${role}/dashboard`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(
        err.response?.status === 401
          ? "Incorrect email or password. Please try again."
          : msg || "Login failed. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.shell}>
      {/* Left side - branding */}
      <div className={s.brandSide}>
        <div className={s.brandInner}>
          <div className={s.logo}>
            <GraduationCap size={26} />
          </div>
          <h1 className={s.brandTitle}>Smart Career Chooser</h1>
          <p className={s.brandSubtitle}>
            AI-powered career guidance built for Pakistani students. Discover your
            Holland Code, get personalized recommendations, and follow a roadmap
            to your dream career.
          </p>
          <div className={s.featureList}>
            <div className={s.feature}>
              <Sparkles size={16} /> 63-question RIASEC + skills assessment
            </div>
            <div className={s.feature}>
              <Sparkles size={16} /> AI recommendations from 30+ Pakistani careers
            </div>
            <div className={s.feature}>
              <Sparkles size={16} /> Personalized 12-month skill roadmaps
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
          <h2 className={s.formTitle}>Welcome back</h2>
          <p className={s.formSubtitle}>Log in to continue your career journey</p>

          <form onSubmit={handleSubmit} className={s.form} noValidate>
            <Field label="Email" required>
              <div className={s.inputGroup}>
                <Mail size={16} className={s.inputIcon} />
                <Input
                  type="email"
                  placeholder="you@university.edu.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  required
                  autoComplete="email"
                  autoFocus
                  className={
                    touched.email && emailValid
                      ? s.inputValid
                      : emailError
                      ? s.inputInvalid
                      : ""
                  }
                  aria-invalid={!!emailError}
                  aria-describedby="email-feedback"
                />
              </div>
              {emailError && (
                <span id="email-feedback" className={`${s.inlineMsg} ${s.inlineMsgError}`}>
                  <AlertCircle size={12} /> {emailError}
                </span>
              )}
            </Field>

            <Field label="Password" required>
              <div className={s.inputGroup}>
                <Lock size={16} className={s.inputIcon} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  required
                  autoComplete="current-password"
                  className={passwordError ? s.inputInvalid : ""}
                  aria-invalid={!!passwordError}
                  aria-describedby="pw-feedback"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  className={s.passwordToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <span id="pw-feedback" className={`${s.inlineMsg} ${s.inlineMsgError}`}>
                  <AlertCircle size={12} /> {passwordError}
                </span>
              )}
            </Field>

            <div className={s.checkRow}>
              <label className={s.checkLabel}>
                <span
                  className={s.check}
                  data-checked={rememberMe}
                  role="checkbox"
                  aria-checked={rememberMe}
                  tabIndex={0}
                  onClick={() => setRememberMe((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setRememberMe((v) => !v);
                    }
                  }}
                >
                  {rememberMe && <Check size={11} strokeWidth={3} />}
                </span>
                Keep me signed in
              </label>
              <Link to="/forgot-password" className={s.linkSm}>
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className={s.errorBox} role="alert">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !formValid}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className={s.formFooter}>
            New to Smart Career Chooser?{" "}
            <Link to="/register" className={s.link}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 