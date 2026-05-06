// src/components/layout/AppShell.jsx
import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid, ClipboardCheck, Sparkles, Map, TrendingUp, Calendar, Users,
  MessageSquare, Search, Bell, LogOut, GraduationCap, UsersRound, ShieldCheck,
  Menu, X, Briefcase, Settings, User
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import s from "./AppShell.module.css";

const STUDENT_NAV = [
  { to: "/student/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/student/assessment", icon: ClipboardCheck, label: "Assessment" },
  { to: "/student/recommendations", icon: Sparkles, label: "Recommendations" },
  { to: "/student/roadmap", icon: Map, label: "Skill Roadmap" },
  { to: "/student/market", icon: TrendingUp, label: "Market Insights" },
  { to: "/student/hub", icon: Calendar, label: "Events Hub" },
  { to: "/student/community", icon: Users, label: "Community" },
  { to: "/student/messages", icon: MessageSquare, label: "Messages" },
];

const MENTOR_NAV = [
  { to: "/mentor/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/mentor/hub", icon: MessageSquare, label: "Communication Hub" },
];

const ADMIN_NAV = [
  { to: "/admin/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/admin/users", icon: UsersRound, label: "Users" },
  { to: "/admin/careers", icon: Briefcase, label: "Careers" },
  { to: "/admin/events", icon: Calendar, label: "Events" },
  { to: "/admin/market-data", icon: TrendingUp, label: "Market Data" },
  { to: "/admin/roadmaps", icon: Map, label: "Roadmaps" },
  { to: "/admin/moderation", icon: ShieldCheck, label: "Moderation" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const role = (user?.role || "student").toLowerCase();
  const navItems = role === "mentor" ? MENTOR_NAV : role === "admin" ? ADMIN_NAV : STUDENT_NAV;
  const portalLabel = role === "mentor" ? "Mentor Portal" : role === "admin" ? "Admin Portal" : "Student Portal";

  const handleLogout = () => {
    if (logout) logout();
    else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    navigate("/login");
  };

  const initials = (user?.name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const closeMenus = () => {
    setUserMenuOpen(false);
    setNotifMenuOpen(false);
  };

  return (
    <div className={s.shell}>
      <button className={s.mobileMenuBtn} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
        <Menu size={22} />
      </button>

      {sidebarOpen && <div className={s.scrim} onClick={() => setSidebarOpen(false)} />}
      
      {/* Invisible overlay to close dropdowns when clicking outside */}
      {(userMenuOpen || notifMenuOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={closeMenus} />
      )}

      <aside className={`${s.sidebar} ${sidebarOpen ? s.sidebarOpen : ""}`}>
        <div className={s.brand}>
          <div className={s.brandLogo}><GraduationCap size={20} /></div>
          <div className={s.brandText}>
            <span className={s.brandName}>Career Chooser</span>
            <span className={s.brandTag}>Smart Guidance</span>
          </div>
          <button className={s.sidebarClose} onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className={s.portalLabel}>{portalLabel}</div>

        <nav className={s.nav}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `${s.navItem} ${isActive ? s.navItemActive : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={s.sidebarFoot}>
          <div className={s.userMini}>
            <div className={s.userAvatar} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              {user?.avatar && user.avatar.length > 10 ? (
                <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={s.userName} title={user?.name}>{user?.name || "User"}</div>
              <div className={s.userRole}>{role}</div>
            </div>
            <button className={s.logoutBtn} onClick={handleLogout} aria-label="Log out" title="Log out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className={s.main}>
        {/* FIX: Forced overflow visible so dropdowns aren't cut off by CSS! */}
        <header className={s.topbar} style={{ overflow: 'visible', zIndex: 50 }}>
          <div className={s.search}>
            <Search size={16} />
            <input type="text" placeholder="Search careers, skills, mentors…" aria-label="Search" />
          </div>

          <div className={s.topbarRight} style={{ position: 'relative', overflow: 'visible', display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* NOTIFICATION BUTTON */}
            <button 
              className={s.iconBtn} 
              aria-label="Notifications"
              onClick={() => { setNotifMenuOpen(!notifMenuOpen); setUserMenuOpen(false); }}
              style={{ position: 'relative', zIndex: 50 }}
            >
              <Bell size={18} />
              <span className={s.notifDot} />
            </button>

            {/* NOTIFICATION DROPDOWN */}
            {notifMenuOpen && (
              <div style={{
                position: 'absolute', top: '50px', right: '150px', width: '320px',
                backgroundColor: 'var(--color-surface, #fff)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden'
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 'bold', fontSize: '14px', color: 'var(--color-text)' }}>
                  Notifications
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-primary-faint)', cursor: 'pointer' }}>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: '600' }}>Welcome to Smart Career Chooser!</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>Complete your RIASEC assessment to unlock your personalized roadmap.</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '6px', fontWeight: 'bold' }}>Just now</div>
                  </div>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: '600' }}>New tech event in Pakistan</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>A new DevFest event matches your skill roadmap.</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '6px' }}>2 hours ago</div>
                  </div>
                </div>
                <div onClick={() => setNotifMenuOpen(false)} style={{ padding: '10px', textAlign: 'center', fontSize: '13px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}>
                  Mark all as read
                </div>
              </div>
            )}

            {/* USER PROFILE BUTTON */}
            <div 
              className={s.userBlock} 
              onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifMenuOpen(false); }}
              style={{ cursor: 'pointer', position: 'relative', zIndex: 50 }}
            >
              <div className={s.userBlockText}>
                <span className={s.userBlockName}>{user?.name || "User"}</span>
                <span className={s.userBlockRole}>{role}</span>
              </div>
              <div className={s.userBlockAvatar} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                {user?.avatar && user.avatar.length > 10 ? (
                  <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : initials}
              </div>
            </div>

            {/* USER PROFILE DROPDOWN */}
            {userMenuOpen && (
              <div style={{
                position: 'absolute', top: '50px', right: '0', minWidth: '220px',
                backgroundColor: 'var(--color-surface, #fff)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden',
                padding: '8px 0'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--color-text)' }}>{user?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{user?.email}</div>
                </div>

                <div 
                  onClick={() => { closeMenus(); navigate(`/${role}/profile`); }}
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s', color: 'var(--color-text)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User size={16} /> Profile
                </div>

                <div 
                  onClick={() => { closeMenus(); navigate(`/${role}/settings`); }}
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s', color: 'var(--color-text)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Settings size={16} /> Settings
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }}></div>

                <div 
                  onClick={handleLogout}
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', color: 'var(--color-danger)', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-soft, #fee2e2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={16} /> Log out
                </div>
              </div>
            )}

          </div>
        </header>

        <div className={s.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}