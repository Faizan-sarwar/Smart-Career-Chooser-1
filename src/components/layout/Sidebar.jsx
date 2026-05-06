import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, Sparkles, Users, MessageSquare,
  ShieldCheck, UserCog, GraduationCap, Compass, TrendingUp, Map, CalendarDays,
  ShieldAlert // Added for Admin Moderation
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import s from "./Sidebar.module.css";

const NAV = {
  student: [
    { to: "/student/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { to: "/student/assessment", label: "Assessment", Icon: ClipboardList },
    { to: "/student/recommendations", label: "Recommendations", Icon: Sparkles },
    { to: "/student/roadmap", label: "Skill Roadmap", Icon: Map },
    { to: "/student/market", label: "Market Insights", Icon: TrendingUp },
    { to: "/student/hub", label: "Events Hub", Icon: CalendarDays },
    { to: "/student/community", label: "Community", Icon: Users },
    { to: "/student/messages", label: "Messages", Icon: MessageSquare },
  ],
  mentor: [
    { to: "/mentor/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { to: "/mentor/hub", label: "Communication", Icon: MessageSquare },
  ],
  // 🚨 UPGRADED ADMIN SIDEBAR 🚨
  admin: [
    { to: "/admin/dashboard", label: "Overview", Icon: ShieldCheck },
    { to: "/admin/users", label: "User Management", Icon: UserCog },
    { to: "/admin/market-data", label: "Market Data", Icon: TrendingUp },
    { to: "/admin/roadmaps", label: "Roadmap Builder", Icon: Map },
    { to: "/admin/moderation", label: "Moderation", Icon: ShieldAlert },
  ],
};

const ROLE_ICON = { student: GraduationCap, mentor: Compass, admin: ShieldCheck };

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();
  if (!user) return null;

  // Ensure we safely map the role to lowercase to avoid crashes if formatting changes
  const safeRole = user.role?.toLowerCase() || 'student';
  const items = NAV[safeRole] || [];
  const RoleIcon = ROLE_ICON[safeRole] || ShieldCheck;

  return (
    <aside className={`${s.sidebar} ${mobileOpen ? s.open : ""}`}>
      <div className={s.brand}>
        <div className={s.logo}>CC</div>
        <span className={s.brandText}>Career Chooser</span>
      </div>

      <div className={s.section}>{safeRole.toUpperCase()} PORTAL</div>
      <nav className={s.nav}>
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `${s.item} ${isActive ? s.itemActive : ""}`}
          >
            <Icon className={s.icon} />
            <span className={s.label}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={s.spacer} />
      <div className={s.foot}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
            {user?.avatar && user.avatar.length > 10 ? (
              <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (user?.name || "U").charAt(0).toUpperCase()
            )}
          </div>
          <span>{user.name}</span>
        </div>
      </div>
    </aside>
  );
}