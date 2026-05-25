// src/components/layout/AppShell.jsx
//
// FIXED — notification logic moved to NotificationContext (no more own
// useEffect/polling here). Everything else (theme toggle, search, profile
// menu, AnimatePresence on Outlet) is preserved.

import { AnimatePresence } from "framer-motion";
import PageTransition from "../common/PageTransition.jsx";
import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid, ClipboardCheck, Sparkles, Map, TrendingUp, Calendar, Users,
  MessageSquare, Search, Bell, LogOut, GraduationCap, UsersRound, ShieldCheck,
  Menu, X, Briefcase, Settings, User, BookOpen, AlertTriangle, Info, Sun, Moon,
  CalendarClock, Activity, UserPlus, Inbox, CheckCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotifications } from "../../context/NotificationContext.jsx"; // 🚨 ADDED
import s from "./AppShell.module.css";

const STUDENT_NAV = [
  { to: "/student/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/student/assessment", icon: ClipboardCheck, label: "Assessment" },
  { to: "/student/recommendations", icon: Sparkles, label: "Recommendations" },
  { to: "/student/roadmap", icon: Map, label: "Skill Roadmap" },
  { to: "/student/mentors", icon: UserPlus, label: "Find Mentor" },
  { to: "/student/market", icon: TrendingUp, label: "Market Insights" },
  { to: "/student/hub", icon: Calendar, label: "Events Hub" },
  { to: "/student/community", icon: Users, label: "Community" },
  { to: "/student/messages", icon: MessageSquare, label: "Messages" },
];

const MENTOR_NAV = [
  { to: "/mentor/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/mentor/requests", icon: Inbox, label: "Requests" },
  { to: "/mentor/mentees", icon: UsersRound, label: "My Mentees" },
  { to: "/mentor/sessions", icon: CalendarClock, label: "Sessions" },
  { to: "/mentor/insights", icon: Activity, label: "Insights" },
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

// Icon for each notification type
const TYPE_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  milestone: Sparkles,
  event: Calendar,
  message: MessageSquare,
};

const TYPE_COLORS = {
  info: "var(--color-primary)",
  success: "var(--color-success, #16a34a)",
  warning: "var(--color-warning, #eab308)",
  milestone: "var(--color-accent, #f97316)",
  event: "var(--color-accent, #f97316)",
  message: "var(--color-primary)",
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 🚨 Pull notifications from context — single source of truth, app-wide
  const { notifications, unreadCount, markAsRead, markAllRead, refresh } = useNotifications();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  // ── Theme ──
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const role = (user?.role || "student").toLowerCase();
  const navItems = role === "mentor" ? MENTOR_NAV : role === "admin" ? ADMIN_NAV : STUDENT_NAV;
  const portalLabel = role === "mentor" ? "Mentor Portal" : role === "admin" ? "Admin Portal" : "Student Portal";

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = () => {
    if (logout) logout();
    else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    navigate("/login");
  };

  const safeName = (user && user.name && typeof user.name === 'string') ? user.name : "User";
  const initials = safeName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const closeMenus = () => {
    setUserMenuOpen(false);
    setNotifMenuOpen(false);
    setIsSearchOpen(false);
  };

  const handleNotifClick = async (n) => {
    if (n.unread) await markAsRead(n._id);
    closeMenus();
    if (n.link) navigate(n.link);
  };

  const searchData = [
    ...navItems.map(item => ({ ...item, category: "Navigation" })),
    ...(role === "admin" ? [
      { label: "Manage Users", to: "/admin/users", icon: UsersRound, category: "Management" },
      { label: "Review Reports", to: "/admin/moderation", icon: ShieldCheck, category: "Moderation" },
      { label: "Add New Career", to: "/admin/careers", icon: Briefcase, category: "Management" },
      { label: "System Health", to: "/admin/dashboard", icon: LayoutGrid, category: "Analytics" },
    ] : [
      { label: "Software Engineering", to: `/${role}/recommendations`, icon: Briefcase, category: "Careers" },
      { label: "Data Science", to: `/${role}/recommendations`, icon: Briefcase, category: "Careers" },
      { label: "Python Programming", to: `/${role}/roadmap`, icon: BookOpen, category: "Skills" },
      { label: "Find Mentors", to: `/${role}/community`, icon: Users, category: "Network" },
    ]),
    { label: "Account Settings", to: `/${role}/settings`, icon: Settings, category: "Settings" }
  ];

  const filteredSearch = searchData.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={s.shell}>
      <button className={s.mobileMenuBtn} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
        <Menu size={22} />
      </button>

      {sidebarOpen && <div className={s.scrim} onClick={() => setSidebarOpen(false)} />}

      {(userMenuOpen || notifMenuOpen || isSearchOpen) && (
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
        <header className={s.topbar} style={{ overflow: 'visible', zIndex: 50 }}>

          {/* SEARCH */}
          <div className={s.search} style={{ position: 'relative', overflow: 'visible' }}>
            <Search size={16} style={{ color: 'var(--color-muted)' }} />
            <input
              type="text"
              placeholder={role === "admin" ? "Search users, careers, settings…" : "Search careers, skills, mentors…"}
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
              onFocus={() => { setIsSearchOpen(true); setUserMenuOpen(false); setNotifMenuOpen(false); }}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '14px' }}
            />

            {isSearchOpen && (
              <div style={{
                position: 'absolute', top: '50px', left: 0, right: 0,
                backgroundColor: 'var(--glass-bg, var(--color-surface))', backdropFilter: 'blur(16px)',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)', zIndex: 100, maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column'
              }}>
                {searchQuery.trim() === "" ? (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ padding: '12px 16px 8px', fontSize: '11px', fontWeight: '800', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Suggested for {role}s
                    </div>
                    {searchData.slice(0, 5).map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={`sug-${idx}`}
                          onClick={() => { navigate(item.to); closeMenus(); setSearchQuery(""); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', cursor: 'pointer', transition: 'background 0.2s', color: 'var(--color-text)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-faint)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ backgroundColor: 'var(--color-primary-soft)', padding: '8px', borderRadius: '8px', color: 'var(--color-primary)' }}>
                            <Icon size={16} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.label}</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{item.category}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : filteredSearch.length === 0 ? (
                  <div style={{ padding: '24px 16px', color: 'var(--color-muted)', fontSize: '14px', textAlign: 'center' }}>
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ padding: '12px 16px 8px', fontSize: '11px', fontWeight: '800', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Results
                    </div>
                    {filteredSearch.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={`res-${idx}`}
                          onClick={() => { navigate(item.to); closeMenus(); setSearchQuery(""); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', cursor: 'pointer', transition: 'background 0.2s', color: 'var(--color-text)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-faint)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ backgroundColor: 'var(--color-primary-soft)', padding: '8px', borderRadius: '8px', color: 'var(--color-primary)' }}>
                            <Icon size={16} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.label}</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{item.category}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={s.topbarRight} style={{ position: 'relative', overflow: 'visible', display: 'flex', alignItems: 'center', gap: '16px' }}>

            {/* THEME TOGGLE */}
            <button
              className={s.iconBtn}
              aria-label="Toggle Theme"
              onClick={toggleTheme}
              style={{ position: 'relative', zIndex: 50, color: 'var(--color-muted)', transition: 'color 0.2s ease' }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* NOTIFICATION BELL — wired to context */}
            <button
              className={s.iconBtn}
              aria-label={`Notifications (${unreadCount} unread)`}
              onClick={() => {
                const next = !notifMenuOpen;
                setNotifMenuOpen(next);
                setUserMenuOpen(false);
                setIsSearchOpen(false);
                if (next) refresh();
              }}
              style={{ position: 'relative', zIndex: 50 }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  minWidth: 18, height: 18, padding: '0 5px',
                  borderRadius: 9, background: 'var(--color-accent, #f97316)',
                  color: 'white', fontSize: 10, fontWeight: 800,
                  display: 'grid', placeItems: 'center',
                  border: '2px solid var(--color-surface)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifMenuOpen && (
              <div style={{
                position: 'absolute', top: '50px', right: '150px', width: '360px',
                backgroundColor: 'var(--glass-bg, var(--color-surface))', backdropFilter: 'blur(16px)',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)', zIndex: 100, overflow: 'hidden',
                maxHeight: '480px', display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary-dark)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                      {unreadCount} New
                    </span>
                  )}
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
                      <Bell size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>You're all caught up.</div>
                      <div style={{ fontSize: '12px', marginTop: 4 }}>New notifications will appear here.</div>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const Icon = TYPE_ICONS[n.type] || Info;
                      const color = TYPE_COLORS[n.type] || 'var(--color-primary)';
                      return (
                        <div
                          key={n._id}
                          onClick={() => handleNotifClick(n)}
                          style={{
                            padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
                            cursor: 'pointer', transition: 'background 0.2s',
                            backgroundColor: n.unread ? 'var(--color-primary-faint)' : 'transparent',
                            display: 'flex', gap: 10, alignItems: 'flex-start'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.unread ? 'var(--color-primary-faint)' : 'transparent'}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: `${color}1a`, color,
                            display: 'grid', placeItems: 'center', flexShrink: 0,
                          }}>
                            <Icon size={15} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: n.unread ? 700 : 500, lineHeight: 1.4 }}>
                              {n.text || n.body}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: 4 }}>
                              {n.timeAgo}
                            </div>
                          </div>
                          {n.unread && (
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: 'var(--color-accent)', flexShrink: 0, marginTop: 8,
                            }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {notifications.length > 0 && unreadCount > 0 && (
                  <div
                    onClick={markAllRead}
                    style={{ padding: '12px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '800', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}
                  >
                    Mark all as read
                  </div>
                )}
              </div>
            )}

            {/* PROFILE BLOCK */}
            <div
              className={s.userBlock}
              onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifMenuOpen(false); setIsSearchOpen(false); }}
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

            {userMenuOpen && (
              <div style={{
                position: 'absolute', top: '50px', right: '0', minWidth: '220px',
                backgroundColor: 'var(--glass-bg, var(--color-surface))', backdropFilter: 'blur(16px)',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)', zIndex: 100, overflow: 'hidden', padding: '8px 0'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-text)' }}>{user?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{user?.email}</div>
                </div>

                <div
                  onClick={() => { closeMenus(); navigate(`/${role}/profile`); }}
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s', color: 'var(--color-text)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-faint)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User size={16} /> Profile
                </div>

                <div
                  onClick={() => { closeMenus(); navigate(`/${role}/settings`); }}
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s', color: 'var(--color-text)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-faint)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Settings size={16} /> Settings
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }}></div>

                <div
                  onClick={handleLogout}
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', color: 'var(--color-danger)', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-soft)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={16} /> Log out
                </div>
              </div>
            )}

          </div>
        </header>

        <div className={s.content}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}