import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Compass, ShieldCheck, GraduationCap, ArrowRight, BarChart3, Target, Users } from "lucide-react";
import s from "./LandingPage.module.css";

function useCountUp(target, duration = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      setN(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function Stat({ value, suffix, label }) {
  const v = useCountUp(value);
  return (
    <div className={s.stat}>
      <div className={s.statValue}>{v.toLocaleString()}{suffix}</div>
      <div className={s.statLabel}>{label}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className={s.wrap}>
      <header className={s.nav}>
        <div className={s.brand}>
          <div className={s.logo}>CC</div> Career Chooser
        </div>
        <nav className={s.navLinks}>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link to="/login">Sign in</Link>
          <Link to="/register" className={s.navCta}>Get started <ArrowRight size={14} /></Link>
        </nav>
      </header>

      <section className={s.hero}>
        <div className={s.heroBg} />
        <div className={s.heroInner}>
          <span className={s.pill}><Sparkles size={14} /> AI-powered career intelligence</span>
          <h1 className={s.title}>
            Discover the career path<br />
            <span className={s.titleAccent}>that fits who you are.</span>
          </h1>
          <p className={s.lead}>
            Personalized assessments, expert mentors, and real opportunities — all in one
            beautifully designed platform built for the next generation of professionals.
          </p>
          <div className={s.ctaRow}>
            <Link to="/register" className={s.primaryCta}>Start your career journey <ArrowRight size={16} /></Link>
            <Link to="/login" className={s.ghostCta}>I already have an account</Link>
          </div>

          <div className={s.statsBar}>
            <Stat value={12480} label="Active members" />
            <Stat value={94} suffix="%" label="Match accuracy" />
            <Stat value={2410} label="Mentors onboarded" />
            <Stat value={36} suffix="K" label="Career outcomes" />
          </div>
        </div>
      </section>

      <section id="features" className={s.features}>
        <div className={s.sectionHead}>
          <h2>Everything you need to choose, plan and grow.</h2>
          <p>From assessment to first job — guided every step of the way.</p>
        </div>
        <div className={s.featureGrid}>
          {[
            { Icon: Target, color: "primary", title: "Smart assessments", text: "Multi-dimensional quizzes that uncover your real strengths." },
            { Icon: BarChart3, color: "accent", title: "Market insights", text: "Live salary trends and demand data for every recommended path." },
            { Icon: Users, color: "primary", title: "Expert mentors", text: "1:1 sessions with vetted industry mentors who've walked the path." },
            { Icon: Sparkles, color: "accent", title: "Gamified roadmap", text: "Earn gold badges as you complete milestones on your journey." },
          ].map((f) => (
            <div key={f.title} className={s.featureCard}>
              <div className={`${s.featureIcon} ${f.color === "accent" ? s.iconAccent : ""}`}><f.Icon size={20} /></div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className={s.roles}>
        <div className={s.sectionHead}>
          <h2>Built for everyone in the journey.</h2>
          <p>Three powerful portals, one cohesive platform.</p>
        </div>
        <div className={s.roleGrid}>
          {[
            { Icon: GraduationCap, title: "Students", text: "Find your match, plan your skills, connect with mentors.", to: "/register" },
            { Icon: Compass, title: "Mentors", text: "Manage your roster, run sessions, change lives.", to: "/register" },
            { Icon: ShieldCheck, title: "Admins", text: "Run analytics, monitor health, scale the platform.", to: "/register" },
          ].map((r) => (
            <Link key={r.title} to={r.to} className={s.roleCard}>
              <div className={s.roleIcon}><r.Icon size={22} /></div>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
              <span className={s.roleLink}>Open portal <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </section>

      <footer className={s.footer}>
        <div>© {new Date().getFullYear()} Career Chooser — built for ambitious humans.</div>
        <div className={s.footLinks}>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Get started</Link>
        </div>
      </footer>
    </div>
  );
}
