import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import s from "./Auth.module.css";
import Button from "../../components/common/Button.jsx";
import { Field, Input } from "../../components/common/Field.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if already logged in
  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Sanitize Inputs
    const cleanEmail = email.trim().toLowerCase();
    
    // 2. Frontend Validation
    if (!cleanEmail || !password) { 
      setError("Please enter both your email and password."); 
      return; 
    }
    
    setIsLoading(true);
    
    try {
      // 3. API Call
      await login({ email: cleanEmail, password });
      
    } catch (err) {
      console.error("Login Error:", err);
      
      // 4. Robust Error Parsing
      if (err.code === 'ERR_NETWORK') {
        setError("Server is currently unreachable. Please ensure the backend is running.");
      } else if (err.response?.status === 401) {
        setError("Incorrect email or password. Please try again.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to sign in. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={s.wrap}>
      <aside className={s.hero}>
        <div className={s.brand}><div className={s.logo}>CC</div> Career Chooser</div>
        <div>
          <h2 className={s.heroTitle}>Discover the career path that fits who you are.</h2>
          <p className={s.heroSub}>Personalized assessments, mentor support, and real opportunities — all in one place.</p>
          <div className={s.bullets}>
            <div className={s.bullet}><span className={s.bulletDot} /> Smart, science-backed assessments</div>
            <div className={s.bullet}><span className={s.bulletDot} /> 1:1 mentorship from industry experts</div>
            <div className={s.bullet}><span className={s.bulletDot} /> Curated jobs and learning paths</div>
          </div>
        </div>
        <div className={s.heroFoot}>© {new Date().getFullYear()} Career Chooser</div>
      </aside>

      <div className={s.formArea}>
        <div className={s.card}>
          <h1 className={s.title}>Welcome back</h1>
          <p className={s.sub}>Sign in to continue to your portal.</p>

          <form className={s.form} onSubmit={submit}>
            <Field label="Email">
              <Input 
                type="email" 
                autoComplete="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                disabled={isLoading}
              />
            </Field>
            <Field label="Password">
              <Input 
                type="password" 
                autoComplete="current-password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                disabled={isLoading}
              />
            </Field>

            {error && <div className={s.error}>{error}</div>}

            <Button type="submit" size="lg" block disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Sign in"}
            </Button>
          </form>

          <div className={s.foot}>
            New here? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}