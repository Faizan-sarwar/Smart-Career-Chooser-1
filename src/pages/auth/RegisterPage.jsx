// src/pages/auth/RegisterPage.jsx

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Mail, Lock, User as UserIcon, AlertCircle, Sparkles,
  Users, ShieldCheck, Eye, EyeOff, Check, X, Loader2, Building2, Camera, ChevronDown
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

// Upgraded list with official web domains to fetch real logos!
// Upgraded list with official web domains to fetch real logos!
const PAK_UNIVERSITIES = [
  { name: "University of Gujrat", acronym: "UOG", domain: "uog.edu.pk" },
  { name: "National University of Sciences & Technology", acronym: "NUST", domain: "nust.edu.pk" },
  { name: "FAST NUCES", acronym: "FAST", domain: "nu.edu.pk" },
  { name: "Lahore University of Management Sciences", acronym: "LUMS", domain: "lums.edu.pk" },
  { name: "COMSATS University Islamabad", acronym: "CUI", domain: "comsats.edu.pk" },
  { name: "Punjab University", acronym: "PU", domain: "pu.edu.pk" },
  { name: "Information Technology University", acronym: "ITU", domain: "itu.edu.pk" },
  { name: "University of Engineering and Technology", acronym: "UET", domain: "uet.edu.pk" },
  { name: "NED University of Engineering and Technology", acronym: "NED", domain: "neduet.edu.pk" },
  { name: "Ghulam Ishaq Khan Institute", acronym: "GIKI", domain: "giki.edu.pk" },
  { name: "Institute of Business Administration", acronym: "IBA", domain: "iba.edu.pk" },
  { name: "Quaid-i-Azam University", acronym: "QAU", domain: "qau.edu.pk" },
  { name: "Air University", acronym: "AU", domain: "au.edu.pk" },
  { name: "Bahria University", acronym: "BU", domain: "bahria.edu.pk" },
  { name: "University of Karachi", acronym: "UoK", domain: "uok.edu.pk" },
  { name: "Mehran University of Engineering & Technology", acronym: "MUET", domain: "muet.edu.pk" },
  { name: "University of Central Punjab", acronym: "UCP", domain: "ucp.edu.pk" },
  { name: "University of Management and Technology", acronym: "UMT", domain: "umt.edu.pk" },
  { name: "University of Lahore", acronym: "UOL", domain: "uol.edu.pk" },
  { name: "Sindh Madressatul Islam University", acronym: "SMIU", domain: "smiu.edu.pk" },
  { name: "Other", acronym: "UNI", domain: "hec.gov.pk" }
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
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Student");

  const [university, setUniversity] = useState("");
  const [expertise, setExpertise] = useState("");
  const [avatar, setAvatar] = useState(null);

  // Custom Dropdown States
  const [uniSearch, setUniSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nameValid = name.trim().length >= 2;
  const emailValid = EMAIL_REGEX.test(email);
  const reqsMet = useMemo(() => PW_REQUIREMENTS.filter((r) => r.test(password)).length, [password]);

  const strength = useMemo(() => {
    if (password.length === 0) return { level: 0, label: "", color: "" };
    if (password.length < 6) return { level: 1, label: "Too short", color: "var(--color-danger)" };
    if (reqsMet <= 1) return { level: 1, label: "Weak", color: "var(--color-danger)" };
    if (reqsMet === 2) return { level: 2, label: "Fair", color: "var(--color-warning)" };
    if (reqsMet === 3) return { level: 3, label: "Good", color: "var(--color-info)" };
    return { level: 4, label: "Strong", color: "var(--color-success)" };
  }, [password, reqsMet]);

  const passwordValid = password.length >= 6;
  const universityValid = role === "Student" ? university.trim().length >= 2 : true;
  const expertiseValid = role === "Mentor" ? expertise.trim().length >= 2 : true;

  const formValid = nameValid && emailValid && passwordValid && universityValid && expertiseValid;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image is too large. Please select a file smaller than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, university: true, expertise: true });
    if (!formValid) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role.toLowerCase(),
        avatar: avatar || null,
        ...(role === "Student" && { university: university.trim() }),
        ...(role === "Mentor" && { university: expertise.trim() }),
      };

      // 1. Create the account in the database
      await api.post("/auth/register", payload);

      // 2. Redirect straight to the login page so they have to log in manually!
      navigate("/login", { replace: true });

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

  const nameError = touched.name && name && !nameValid ? "Name must be at least 2 characters" : "";
  const emailError = touched.email && email && !emailValid ? "Enter a valid email address" : "";
  const passwordError = touched.password && password && !passwordValid ? "Password must be at least 6 characters" : "";
  const universityError = touched.university && role === "Student" && !universityValid ? "Please select or enter your institution" : "";
  const expertiseError = touched.expertise && role === "Mentor" && !expertiseValid ? "Please enter your area of expertise" : "";

  // Filter universities based on search text
  const filteredUniversities = PAK_UNIVERSITIES.filter(u =>
    (u.name + " " + u.acronym).toLowerCase().includes(uniSearch.toLowerCase())
  );

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
            <div className={s.feature}><Sparkles size={16} /> Science-based RIASEC personality assessment</div>
            <div className={s.feature}><Sparkles size={16} /> Pakistan-specific career recommendations</div>
            <div className={s.feature}><Sparkles size={16} /> Free roadmap with local learning resources</div>
          </div>
        </div>
        <div className={s.brandFooter}>University of Gujrat · Final Year Project 2026</div>
      </div>

      <div className={s.formSide}>
        <div className={s.formCard} style={{ maxHeight: '90vh', overflowY: 'auto', paddingBottom: '40px' }}>
          <h2 className={s.formTitle}>Create your account</h2>
          <p className={s.formSubtitle}>Free, takes under a minute. No credit card required.</p>

          <form onSubmit={handleSubmit} className={s.form} noValidate>

            {/* AVATAR UPLOAD */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--color-bg)',
                  border: '2px dashed var(--color-primary-light)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative'
                }}
              >
                {avatar ? (
                  <img src={avatar} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Camera size={28} color="var(--color-primary)" />
                )}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '8px' }}>
                {avatar ? "Click to change picture" : "Upload Profile Picture"}
              </span>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
            </div>

            <Field label="I am a" required>
              <div className={s.roleSelector} role="radiogroup">
                {ROLES.map(({ value, label, Icon }) => (
                  <button
                    key={value} type="button" role="radio" aria-checked={role === value}
                    className={`${s.roleBtn} ${role === value ? s.roleBtnActive : ""}`}
                    onClick={() => { setRole(value); setTouched({}); }}
                  >
                    <span className={s.roleBtnIcon}><Icon size={16} /></span>
                    <span className={s.roleBtnLabel}>{label}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Full name" required>
              <div className={s.inputGroup}>
                <UserIcon size={16} className={s.inputIcon} />
                <Input
                  type="text" placeholder="Ali Raza" value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  required autoComplete="name"
                  className={touched.name && nameValid ? s.inputValid : nameError ? s.inputInvalid : ""}
                />
              </div>
              {nameError && <span className={`${s.inlineMsg} ${s.inlineMsgError}`}><AlertCircle size={12} /> {nameError}</span>}
            </Field>

            <Field label="Email" required>
              <div className={s.inputGroup}>
                <Mail size={16} className={s.inputIcon} />
                <Input
                  type="email" placeholder="ali@uog.edu.pk" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  required autoComplete="email"
                  className={touched.email && emailValid ? s.inputValid : emailError ? s.inputInvalid : ""}
                />
              </div>
              {emailError && <span className={`${s.inlineMsg} ${s.inlineMsgError}`}><AlertCircle size={12} /> {emailError}</span>}
            </Field>

            {/* REAL LOGO & TOGGLEABLE UNIVERSITY DROPDOWN */}
            {role === "Student" && (
              <Field label="University / Institution" required>
                <div className={s.inputGroup} ref={dropdownRef} style={{ position: 'relative' }}>
                  <Building2 size={16} className={s.inputIcon} />
                  <Input
                    type="text"
                    placeholder="Search or type your university..."
                    value={isDropdownOpen ? uniSearch : university}
                    onChange={(e) => {
                      setUniSearch(e.target.value);
                      setIsDropdownOpen(true);
                      setUniversity(e.target.value);
                    }}
                    onClick={() => {
                      setIsDropdownOpen(!isDropdownOpen);
                      if (!isDropdownOpen) setUniSearch(university);
                    }}
                    required
                    className={touched.university && universityValid && university && !isDropdownOpen ? s.inputValid : universityError ? s.inputInvalid : ""}
                    style={{ paddingRight: '36px', cursor: 'pointer' }}
                  />
                  <div
                    onClick={() => {
                      setIsDropdownOpen(!isDropdownOpen);
                      if (!isDropdownOpen) setUniSearch(university);
                    }}
                    style={{ position: 'absolute', right: '10px', padding: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <ChevronDown size={16} style={{ color: 'var(--color-muted)', transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </div>

                  {/* Polished Floating Menu */}
                  {isDropdownOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                      backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', padding: '8px 0', maxHeight: '260px',
                      overflowY: 'auto', zIndex: 9999, boxShadow: 'var(--shadow-xl)'
                    }}>
                      {filteredUniversities.map((uni) => (
                        <div
                          key={uni.acronym}
                          onClick={() => {
                            setUniversity(uni.name);
                            setUniSearch("");
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', padding: '10px 16px',
                            cursor: 'pointer', gap: '14px', transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {/* REAL LOGO via Google's High-Res Favicon API */}
                          <img
                            src={`https://s2.googleusercontent.com/s2/favicons?domain=${uni.domain}&sz=128`}
                            alt={uni.acronym}
                            onError={(e) => {
                              // Fallback only if Google literally cannot find the website
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${uni.acronym}&background=random&color=fff&size=38&rounded=false&font-size=0.35&bold=true`;
                            }}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              flexShrink: 0,
                              boxShadow: 'var(--shadow-sm)',
                              objectFit: 'contain',
                              backgroundColor: '#fff',
                              padding: '4px' // Added a little more padding so the logos fit nicely
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', lineHeight: '1.2' }}>{uni.name}</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>{uni.acronym}</span>
                          </div>
                        </div>
                      ))}

                      {/* Custom Entry Fallback */}
                      {filteredUniversities.length === 0 && uniSearch.trim() !== "" && (
                        <div
                          onClick={() => {
                            setUniversity(uniSearch);
                            setIsDropdownOpen(false);
                          }}
                          style={{ padding: '12px 16px', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: '600', fontSize: '14px' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-faint)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Add "{uniSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {universityError && <span className={`${s.inlineMsg} ${s.inlineMsgError}`}><AlertCircle size={12} /> {universityError}</span>}
              </Field>
            )}
            {role === "Mentor" && (
              <Field label="Area of expertise" hint="e.g. Software Engineering, Product Design" required>
                <div className={s.inputGroup}>
                  <Building2 size={16} className={s.inputIcon} />
                  <Input
                    type="text" placeholder="Software Engineering" value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, expertise: true }))}
                    required
                    className={touched.expertise && expertiseValid && expertise ? s.inputValid : expertiseError ? s.inputInvalid : ""}
                  />
                </div>
                {expertiseError && <span className={`${s.inlineMsg} ${s.inlineMsgError}`}><AlertCircle size={12} /> {expertiseError}</span>}
              </Field>
            )}

            <Field label="Password" required>
              <div className={s.inputGroup}>
                <Lock size={16} className={s.inputIcon} />
                <Input
                  type={showPassword ? "text" : "password"} placeholder="At least 8 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  required minLength={6} autoComplete="new-password"
                  className={passwordError ? s.inputInvalid : ""}
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button" className={s.passwordToggle} onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {password.length > 0 && (
                <div className={s.passwordMeter}>
                  <div className={s.meterTrack}>
                    {[1, 2, 3, 4].map((seg) => (
                      <span key={seg} className={`${s.meterSegment} ${seg <= strength.level ? s.meterSegmentActive : ""}`}
                        style={{ color: seg <= strength.level ? strength.color : undefined }} />
                    ))}
                  </div>
                  <div className={s.meterLabel} style={{ color: strength.color || "var(--color-muted)" }}>
                    <span className={s.meterStrength}>{strength.label}</span>
                  </div>
                  <div className={s.meterRequirements}>
                    {PW_REQUIREMENTS.map((r) => {
                      const met = r.test(password);
                      return (
                        <span key={r.id} className={`${s.meterReq} ${met ? s.meterReqMet : ""}`}>
                          {met ? <Check size={11} strokeWidth={3} /> : <X size={11} />} {r.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {passwordError && <span className={`${s.inlineMsg} ${s.inlineMsgError}`}><AlertCircle size={12} /> {passwordError}</span>}
            </Field>

            {error && (
              <div className={s.errorBox} role="alert">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" disabled={loading || !formValid}>
              {loading ? <><Loader2 size={16} className="spin" /> Creating account…</> : "Create account"}
            </Button>
          </form>

          <div className={s.formFooter}>
            Already have an account? <Link to="/login" className={s.link}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}