// src/components/layout/AppShell.jsx
import { AnimatePresence } from "framer-motion";
import PageTransition from "../common/PageTransition.jsx";
import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid, ClipboardCheck, Sparkles, Map, TrendingUp, Calendar, Users,
  MessageSquare, Search, Bell, LogOut, GraduationCap, UsersRound, ShieldCheck,
  Menu, X, Briefcase, Settings, User, BookOpen, AlertTriangle, Info, Sun, Moon
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../lib/axios.js";
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
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  // ── Theme State ──
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  // ── Search State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ── Dynamic Notifications State ──
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const role = (user?.role || "student").toLowerCase();
  const navItems = role === "mentor" ? MENTOR_NAV : role === "admin" ? ADMIN_NAV : STUDENT_NAV;
  const portalLabel = role === "mentor" ? "Mentor Portal" : role === "admin" ? "Admin Portal" : "Student Portal";

  // 🚨 APPLY THEME GLOBALLY 🚨
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  // 🚨 DYNAMIC NOTIFICATION POLLING 🚨
  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      if (role === "admin") {
        try {
          const { data } = await api.get("/admin/stats");
          if (!mounted) return;
          const notifs = [];

          if (data.totals.pendingReports > 0) {
            notifs.push({ id: "a1", type: "warning", title: "Action Required", text: `There are ${data.totals.pendingReports} items in the moderation queue.`, time: "Just now" });
          }
          notifs.push({ id: "a2", type: "success", title: "System Health", text: `API and Database are online. Serving ${data.totals.users} total users.`, time: "Live status" });

          setNotifications(notifs);
          setUnreadCount(notifs.length);
        } catch (err) {
          if (mounted) {
            setNotifications([{ id: "err", type: "error", title: "System Offline", text: "CRITICAL: Cannot connect to the API or Database.", time: "Just now" }]);
            setUnreadCount(1);
          }
        }
      } else if (role === "student") {
        try {
          const { data } = await api.get("/users/dashboard");
          if (mounted && data.notifications) {
            setNotifications(data.notifications);
            setUnreadCount(data.notifications.length);
          }
        } catch (err) {
          if (mounted) {
            setNotifications([{ id: "err", color: "var(--color-danger)", text: "Offline mode: Could not sync your latest roadmap progress.", time: "Just now" }]);
            setUnreadCount(1);
          }
        }
      } else if (role === "mentor") {
        if (mounted) {
          setNotifications([{ id: "m1", color: "var(--color-primary)", text: "Welcome to the Mentor Hub. Awaiting mentee requests.", time: "Just now" }]);
          setUnreadCount(1);
        }
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, [role]);

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
    setIsSearchOpen(false);
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

            {/* 🚨 THEME TOGGLE BUTTON 🚨 */}
            <button
              className={s.iconBtn}
              aria-label="Toggle Theme"
              onClick={toggleTheme}
              style={{ position: 'relative', zIndex: 50, color: 'var(--color-muted)', transition: 'color 0.2s ease' }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* 🚨 DYNAMIC NOTIFICATIONS BUTTON 🚨 */}
            <button
              className={s.iconBtn}
              aria-label="Notifications"
              onClick={() => { setNotifMenuOpen(!notifMenuOpen); setUserMenuOpen(false); setIsSearchOpen(false); }}
              style={{ position: 'relative', zIndex: 50 }}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className={s.notifDot} style={{ position: 'absolute', top: '0px', right: '0px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', border: '2px solid var(--color-surface)' }} />}
            </button>

            {notifMenuOpen && (
              <div style={{
                position: 'absolute', top: '50px', right: '150px', width: '340px',
                backgroundColor: 'var(--glass-bg, var(--color-surface))', backdropFilter: 'blur(16px)',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)', zIndex: 100, overflow: 'hidden'
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>Notifications</span>
                  {unreadCount > 0 && <span style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary-dark)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{unreadCount} New</span>}
                </div>

                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--color-muted)' }}>
                      You're all caught up!
                    </div>
                  ) : (
                    notifications.map((n, idx) => {
                      const isUnread = idx < unreadCount;
                      return (
                        <div
                          key={n.id || idx}
                          style={{
                            padding: '14px 16px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s',
                            backgroundColor: isUnread ? 'var(--color-primary-faint)' : 'transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isUnread ? 'var(--color-primary-faint)' : 'transparent'}
                        >
                          {/* ADMIN LOGIC */}
                          {role === "admin" ? (
                            <>
                              <div style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {n.type === 'error' && <AlertTriangle size={14} color="var(--color-danger)" />}
                                {n.type === 'warning' && <AlertTriangle size={14} color="var(--color-warning)" />}
                                {n.type === 'success' && <ShieldCheck size={14} color="var(--color-success)" />}
                                {n.type === 'info' && <Info size={14} color="var(--color-primary)" />}
                                {n.title}
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px', lineHeight: '1.4' }}>{n.text}</div>
                              <div style={{ fontSize: '11px', color: isUnread ? 'var(--color-primary)' : 'var(--color-muted)', marginTop: '8px', fontWeight: isUnread ? 'bold' : 'normal' }}>{n.time}</div>
                            </>
                          ) : (
                            /* STUDENT/MENTOR LOGIC */
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n.color || 'var(--color-primary)', marginTop: '5px', flexShrink: 0 }} />
                              <div>
                                <div style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: isUnread ? '700' : '500', lineHeight: '1.4' }}>{n.text}</div>
                                <div style={{ fontSize: '11px', color: isUnread ? 'var(--color-primary)' : 'var(--color-muted)', marginTop: '8px', fontWeight: isUnread ? 'bold' : 'normal' }}>{n.time}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                {unreadCount > 0 && (
                  <div onClick={() => setUnreadCount(0)} style={{ padding: '12px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '800', background: 'var(--color-bg)' }}>
                    Mark all as read
                  </div>
                )}
              </div>
            )}

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
          {/* 🚨 WRAP THE OUTLET IN ANIMATE PRESENCE 🚨 */}
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