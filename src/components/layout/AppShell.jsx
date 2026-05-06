// src/components/layout/AppShell.jsx
import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ClipboardCheck,
  Sparkles,
  Map,
  TrendingUp,
  Calendar,
  Users,
  MessageSquare,
  Search,
  Bell,
  LogOut,
  GraduationCap,
  UsersRound,
  ShieldCheck,
  Menu,
  X,
  Briefcase,
  Settings,
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

// EXPANDED — added Careers, Events, Settings
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

  const role = (user?.role || "student").toLowerCase();
  const navItems =
    role === "mentor" ? MENTOR_NAV : role === "admin" ? ADMIN_NAV : STUDENT_NAV;
  const portalLabel =
    role === "mentor" ? "Mentor Portal" : role === "admin" ? "Admin Portal" : "Student Portal";

  const handleLogout = () => {
    if (logout) logout();
    else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    navigate("/login");
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={s.shell}>
      <button
        className={s.mobileMenuBtn}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {sidebarOpen && (
        <div className={s.scrim} onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`${s.sidebar} ${sidebarOpen ? s.sidebarOpen : ""}`}>
        <div className={s.brand}>
          <div className={s.brandLogo}>
            <GraduationCap size={20} />
          </div>
          <div className={s.brandText}>
            <span className={s.brandName}>Career Chooser</span>
            <span className={s.brandTag}>Smart Guidance</span>
          </div>
          <button
            className={s.sidebarClose}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className={s.portalLabel}>{portalLabel}</div>

        <nav className={s.nav}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `${s.navItem} ${isActive ? s.navItemActive : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={s.sidebarFoot}>
          <div className={s.userMini}>
            <div className={s.userAvatar}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={s.userName} title={user?.name}>{user?.name || "User"}</div>
              <div className={s.userRole}>{role}</div>
            </div>
            <button
              className={s.logoutBtn}
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className={s.main}>
        <header className={s.topbar}>
          <div className={s.search}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search careers, skills, mentors…"
              aria-label="Search"
            />
          </div>

          <div className={s.topbarRight}>
            <button className={s.iconBtn} aria-label="Notifications">
              <Bell size={18} />
              <span className={s.notifDot} />
            </button>

            <div className={s.userBlock}>
              <div className={s.userBlockText}>
                <span className={s.userBlockName}>{user?.name || "User"}</span>
                <span className={s.userBlockRole}>{role}</span>
              </div>
              <div className={s.userBlockAvatar}>{initials}</div>
            </div>
          </div>
        </header>

        <div className={s.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}