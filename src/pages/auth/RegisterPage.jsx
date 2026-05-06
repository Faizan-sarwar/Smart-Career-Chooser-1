// src/pages/auth/RegisterPage.jsx
//
// Enterprise-grade registration:
//   - Real-time validation with visual feedback
//   - Password strength meter with requirement checklist
//   - Show/hide password
//   - Role selector with icons
//   - University field for students (matches backend User schema)
//   - Full keyboard accessibility
//   - Loading state with disabled button until form is valid

import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  Sparkles,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Building2,
} from "lucide-react";
import Button from "../../components/common/Button.jsx";
import { Field, Input } from "../../components/common/Field.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
import s from "./Auth.module.css";

const ROLES = [
  { value: "Student", label: "Student", Icon: GraduationCap },
  { value: "Mentor", label: "Mentor", Icon: Users },
  { value: "Admin", label: "Admin", Icon: ShieldCheck },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PW_REQUIREMENTS = [
  { id: "len", label: "8+ characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "num", label: "Number", test: (p) => /\d/.test(p) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [role, setRole] = useState("Student");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Validation ───────────────────────────────────────────────────
  const nameValid = name.trim().length >= 2;
  const emailValid = EMAIL_REGEX.test(email);

  // Password rules: a tier system based on requirements met
  const reqsMet = useMemo(
    () => PW_REQUIREMENTS.filter((r) => r.test(password)).length,
    [password]
  );

  const strength = useMemo(() => {
    if (password.length === 0) return { level: 0, label: "", color: "" };
    if (password.length < 6) return { level: 1, label: "Too short", color: "var(--color-danger)" };
    if (reqsMet <= 1) return { level: 1, label: "Weak", color: "var(--color-danger)" };
    if (reqsMet === 2) return { level: 2, label: "Fair", color: "var(--color-warning)" };
    if (reqsMet === 3) return { level: 3, label: "Good", color: "var(--color-info)" };
    return { level: 4, label: "Strong", color: "var(--color-success)" };
  }, [password, reqsMet]);

  // Backend requires min 6 chars; enterprise flow asks for stronger but accepts ≥6
  const passwordValid = password.length >= 6;

  const universityValid = role === "Student" ? university.trim().length >= 2 : true;
  const formValid = nameValid && emailValid && passwordValid && universityValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, university: true });
    if (!formValid) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        ...(role === "Student" && { university: university.trim() }),
        ...(role === "Mentor" && { university: university.trim() }), // backend reuses this for expertise
      };

      const { data } = await api.post("/auth/register", payload);

      if (login) {
        login(data, data.token);
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
      }

      const r = (data.role || "student").toLowerCase();
      navigate(`/${r}/dashboard`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.toLowerCase().includes("already exists")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else {
        setError(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Field-level error messages ───────────────────────────────────
  const nameError = touched.name && name && !nameValid
    ? "Name must be at least 2 characters" : "";
  const emailError = touched.email && email && !emailValid
    ? "Enter a valid email address" : "";
  const passwordError = touched.password && password && !passwordValid
    ? "Password must be at least 6 characters" : "";
  const universityError = touched.university && role === "Student" && university && !universityValid
    ? "Please enter your institution" : "";

  return (
    <div className={s.shell}>
      <div className={s.brandSide}>
        <div className={s.brandInner}>
          <div className={s.logo}>
            <GraduationCap size={26} />
          </div>
          <h1 className={s.brandTitle}>Start your journey</h1>
          <p className={s.brandSubtitle}>
            Join hundreds of Pakistani students discovering their ideal career path
            with science-backed assessments and AI-powered guidance.
          </p>
          <div className={s.featureList}>
            <div className={s.feature}>
              <Sparkles size={16} /> Science-based RIASEC personality assessment
            </div>
            <div className={s.feature}>
              <Sparkles size={16} /> Pakistan-specific career recommendations
            </div>
            <div className={s.feature}>
              <Sparkles size={16} /> Free roadmap with local learning resources
            </div>
          </div>
        </div>
        <div className={s.brandFooter}>
          University of Gujrat · Final Year Project 2026
        </div>
      </div>

      <div className={s.formSide}>
        <div className={s.formCard}>
          <h2 className={s.formTitle}>Create your account</h2>
          <p className={s.formSubtitle}>
            Free, takes under a minute. No credit card required.
          </p>

          <form onSubmit={handleSubmit} className={s.form} noValidate>
            <Field label="I am a" required>
              <div className={s.roleSelector} role="radiogroup">
                {ROLES.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={role === value}
                    className={`${s.roleBtn} ${role === value ? s.roleBtnActive : ""}`}
                    onClick={() => setRole(value)}
                  >
                    <span className={s.roleBtnIcon}>
                      <Icon size={16} />
                    </span>
                    <span className={s.roleBtnLabel}>{label}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Full name" required>
              <div className={s.inputGroup}>
                <UserIcon size={16} className={s.inputIcon} />
                <Input
                  type="text"
                  placeholder="Faizan Sarwar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  required
                  autoComplete="name"
                  className={
                    touched.name && nameValid
                      ? s.inputValid
                      : nameError
                        ? s.inputInvalid
                        : ""
                  }
                />
              </div>
              {nameError && (
                <span className={`${s.inlineMsg} ${s.inlineMsgError}`}>
                  <AlertCircle size={12} /> {nameError}
                </span>
              )}
            </Field>

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
                  className={
                    touched.email && emailValid
                      ? s.inputValid
                      : emailError
                        ? s.inputInvalid
                        : ""
                  }
                />
              </div>
              {emailError && (
                <span className={`${s.inlineMsg} ${s.inlineMsgError}`}>
                  <AlertCircle size={12} /> {emailError}
                </span>
              )}
            </Field>

            {role === "Student" && (
              <Field label="University / Institution" required>
                <div className={s.inputGroup}>
                  <Building2 size={16} className={s.inputIcon} />
                  <Input
                    type="text"
                    placeholder="University of Gujrat"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, university: true }))}
                    required
                    className={
                      touched.university && universityValid && university
                        ? s.inputValid
                        : universityError
                          ? s.inputInvalid
                          : ""
                    }
                  />
                </div>
                {universityError && (
                  <span className={`${s.inlineMsg} ${s.inlineMsgError}`}>
                    <AlertCircle size={12} /> {universityError}
                  </span>
                )}
              </Field>
            )}

            {role === "Mentor" && (
              <Field label="Area of expertise" hint="e.g. Software Engineering, Product Design" required>
                <div className={s.inputGroup}>
                  <Building2 size={16} className={s.inputIcon} />
                  <Input
                    type="text"
                    placeholder="Software Engineering"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    required
                  />
                </div>
              </Field>
            )}

            <Field label="Password" required>
              <div className={s.inputGroup}>
                <Lock size={16} className={s.inputIcon} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={passwordError ? s.inputInvalid : ""}
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

              {/* Password strength meter */}
              {password.length > 0 && (
                <div className={s.passwordMeter}>
                  <div className={s.meterTrack}>
                    {[1, 2, 3, 4].map((seg) => (
                      <span
                        key={seg}
                        className={`${s.meterSegment} ${seg <= strength.level ? s.meterSegmentActive : ""
                          }`}
                        style={{
                          color: seg <= strength.level ? strength.color : undefined,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    className={s.meterLabel}
                    style={{ color: strength.color || "var(--color-muted)" }}
                  >
                    <span className={s.meterStrength}>{strength.label}</span>
                  </div>
                  <div className={s.meterRequirements}>
                    {PW_REQUIREMENTS.map((r) => {
                      const met = r.test(password);
                      return (
                        <span
                          key={r.id}
                          className={`${s.meterReq} ${met ? s.meterReqMet : ""}`}
                        >
                          {met ? <Check size={11} strokeWidth={3} /> : <X size={11} />}
                          {r.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {passwordError && (
                <span className={`${s.inlineMsg} ${s.inlineMsgError}`}>
                  <AlertCircle size={12} /> {passwordError}
                </span>
              )}
            </Field>

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
                  <Loader2 size={16} className="spin" /> Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className={s.formFooter}>
            Already have an account?{" "}
            <Link to="/login" className={s.link}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}