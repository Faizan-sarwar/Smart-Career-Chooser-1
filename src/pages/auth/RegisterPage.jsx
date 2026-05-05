import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GraduationCap, Compass, ShieldCheck, ChevronLeft, ChevronRight, Check } from "lucide-react";
import s from "./Auth.module.css";
import Button from "../../components/common/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

// Roles definition for step 1
const ROLES = [
  { id: "student", label: "Student", desc: "Discover careers, take assessments, get matched.", Icon: GraduationCap },
  { id: "mentor", label: "Mentor", desc: "Guide mentees and host live sessions.", Icon: Compass },
  { id: "admin", label: "Admin", desc: "Oversee the platform and manage users.", Icon: ShieldCheck },
];

const AVATARS = ["🦊", "🐼", "🐨", "🦁", "🐸", "🦉", "🦄", "🐧"];
const MAJORS = ["Computer Science", "Data Analytics", "UX Design", "Cybersecurity", "Cloud Engineering", "Business", "Marketing", "Other"];
const INTERESTS = ["AI/ML", "Web Dev", "Design", "Cybersecurity", "Cloud", "Data", "Product", "Marketing", "Finance"];

function strengthOf(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

function FloatingInput({ label, type = "text", value, onChange, autoComplete }) {
  const [focus, setFocus] = useState(false);
  const filled = focus || value;
  return (
    <div className={`${s.fl} ${filled ? s.flFilled : ""}`}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
      <label>{label}</label>
    </div>
  );
}

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [role, setRole] = useState("student"); // Changed default to lowercase to match ENUM
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [major, setMajor] = useState(MAJORS[0]);
  const [interests, setInterests] = useState([]);
  const [error, setError] = useState("");

  const pwScore = useMemo(() => strengthOf(password), [password]);
  const pwLabel = ["Too weak", "Weak", "Okay", "Good", "Strong"][pwScore];

  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />;

  const next = () => {
    setError("");
    if (step === 2) {
      if (!name.trim()) return setError("Please enter your name.");
      if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email.");
      if (pwScore < 2) return setError("Please choose a stronger password.");
    }
    setDirection(1);
    setStep((v) => Math.min(v + 1, 3));
  };

  const back = () => {
    setDirection(-1);
    setStep((v) => Math.max(v - 1, 1));
  };

  const finish = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Create the payload dynamically based on the role to keep the DB clean
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role.toLowerCase(), // Ensure strict lowercase for backend
        avatar,
        // Only send university and career interests if the user is a student
        ...(role === 'student' && { university: major, careerInterests: interests }),
        // If they are a mentor, reuse the 'major' variable to store their expertise
        ...(role === 'mentor' && { expertise: major })
      };

      await register(payload);
      navigate('/login');

    } catch (err) {
      console.error("Full Registration Error:", err);

      if (err.code === 'ERR_NETWORK') {
        setError("Cannot connect to the server. Is your Node.js backend running?");
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(`Error: ${err.response.data.message}`);
      } else {
        setError("An unexpected error occurred. Please check the browser console.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInterest = (i) => setInterests((arr) =>
    arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]
  );

  return (
    <div className={s.wrap}>
      <aside className={s.hero}>
        <div className={s.brand}><div className={s.logo}>CC</div> Career Chooser</div>
        <div className={s.heroArt} aria-hidden>
          <svg viewBox="0 0 400 300" width="100%">
            <defs>
              <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#52a447" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <path d="M20,250 Q120,180 200,210 T380,80" fill="none" stroke="url(#g1)" strokeWidth="4" strokeLinecap="round">
              <animate attributeName="stroke-dasharray" from="0,800" to="800,0" dur="3s" repeatCount="indefinite" />
            </path>
            {[[20, 250], [140, 210], [260, 160], [380, 80]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="8" fill="#fff" stroke="url(#g1)" strokeWidth="3">
                <animate attributeName="r" values="6;10;6" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </svg>
        </div>
        <div>
          <h2 className={s.heroTitle}>Build a career roadmap that grows with you.</h2>
          <p className={s.heroSub}>Three quick steps and your personalized journey begins.</p>
        </div>
        <div className={s.heroFoot}>© {new Date().getFullYear()} Career Chooser</div>
      </aside>

      <div className={s.formArea}>
        <div className={s.card}>
          <div className={s.stepper}>
            {[1, 2, 3].map((n) => (
              <div key={n} className={`${s.stepDot} ${step >= n ? s.stepDotDone : ""}`}>
                {step > n ? <Check size={14} /> : n}
              </div>
            ))}
          </div>

          <div key={step} className={direction > 0 ? s.slideRight : s.slideLeft}>
            {step === 1 && (
              <>
                <h1 className={s.title}>Choose your role</h1>
                <p className={s.sub}>Pick the experience that fits you best.</p>
                <div className={s.roleGrid}>
                  {ROLES.map(({ id, label, desc, Icon }) => (
                    <button key={id} type="button"
                      className={`${s.roleCard} ${role === id ? s.roleCardActive : ""}`}
                      onClick={() => setRole(id)}>
                      <Icon size={28} />
                      <div className={s.roleCardLabel}>{label}</div>
                      <div className={s.roleCardDesc}>{desc}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className={s.title}>Account details</h1>
                <p className={s.sub}>We'll keep your info private and secure.</p>
                <div className={s.form}>
                  <FloatingInput label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  <FloatingInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  <FloatingInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                  <div className={s.meter}>
                    <div className={s.meterTrack}>
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`${s.meterBar} ${i < pwScore ? s[`mb${pwScore}`] : ""}`} />
                      ))}
                    </div>
                    <div className={s.meterLabel}>{password ? pwLabel : "Password strength"}</div>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className={s.title}>Personalize</h1>
                <p className={s.sub}>Pick an avatar and tell us about yourself.</p>
                <div className={s.form}>
                  {/* EVERYONE picks an avatar */}
                  <div>
                    <div className={s.fieldLabel}>Avatar</div>
                    <div className={s.avatarRow}>
                      {AVATARS.map((a) => (
                        <button key={a} type="button"
                          className={`${s.avatarPick} ${avatar === a ? s.avatarPickActive : ""}`}
                          onClick={() => setAvatar(a)}>{a}</button>
                      ))}
                    </div>
                  </div>

                  {/* ONLY STUDENTS see this section */}
                  {role === 'student' && (
                    <>
                      <div>
                        <div className={s.fieldLabel}>Major / focus</div>
                        <select className={s.select} value={major} onChange={(e) => setMajor(e.target.value)}>
                          {MAJORS.map((m) => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className={s.fieldLabel}>Career interests</div>
                        <div className={s.chipRow}>
                          {INTERESTS.map((i) => (
                            <button key={i} type="button"
                              className={`${s.chip} ${interests.includes(i) ? s.chipActive : ""}`}
                              onClick={() => toggleInterest(i)}>{i}</button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ONLY MENTORS see this section */}
                  {role === 'mentor' && (
                    <div>
                      <div className={s.fieldLabel}>Industry Expertise</div>
                      {/* Reusing the 'major' state variable to store expertise to save state management overhead */}
                      <input 
                        type="text"
                        className={s.input}
                        style={{width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg)'}}
                        placeholder="e.g., Senior Software Engineer..." 
                        value={major} 
                        onChange={(e) => setMajor(e.target.value)} 
                      />
                    </div>
                  )}

                  {/* ADMINS see nothing extra here, keeping the flow fast and simple! */}
                </div>
              </>
            )}
          </div>

          {error && <div className={s.error}>{error}</div>}

          <div className={s.navRow}>
            <Button variant="ghost" onClick={back} disabled={step === 1 || isLoading}>
              <ChevronLeft size={16} /> Back
            </Button>
            {step < 3 ? (
              <Button onClick={next}>Continue <ChevronRight size={16} /></Button>
            ) : (
              <Button onClick={finish} disabled={isLoading}>
                {isLoading ? "Creating account..." : "Finish & enter"} {isLoading ? null : <Check size={16} />}
              </Button>
            )}
          </div>

          <div className={s.foot}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 