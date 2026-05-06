// src/components/layout/Topbar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Menu, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import s from "./Topbar.module.css";

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const role = (user?.role || "student").toLowerCase();
  const initials = (user?.name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const handleLogout = () => { logout(); navigate("/login"); };
  const closeMenus = () => { setUserMenuOpen(false); setNotifMenuOpen(false); };

  const renderAvatarFace = () => {
    if (user?.avatar && user.avatar.length > 10) {
      return <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />;
    }
    return <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{initials}</span>;
  };

  return (
    <header className={s.bar} style={{ overflow: 'visible', zIndex: 50, position: 'relative' }}>
      
      {/* Invisible overlay to close dropdowns */}
      {(userMenuOpen || notifMenuOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={closeMenus} />
      )}

      <button className={s.menu} onClick={onMenuClick} aria-label="Open menu"><Menu size={20} /></button>
      
      <div className={s.search}>
        <Search size={16} />
        <input placeholder="Search careers, skills, mentors…" />
      </div>
      
      <div className={s.spacer} />
      
      {/* Right Container */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'visible' }}>
        
        {/* NOTIFICATIONS */}
        <button 
          className={s.iconBtn} 
          aria-label="Notifications"
          onClick={() => { setNotifMenuOpen(!notifMenuOpen); setUserMenuOpen(false); }}
          style={{ position: 'relative', zIndex: 50 }}
        >
          <Bell size={18} />
          <span className={s.dot} />
        </button>

        {notifMenuOpen && (
          <div style={{
            position: 'absolute', top: '45px', right: '100px', width: '320px',
            backgroundColor: 'var(--color-surface, #fff)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden'
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 'bold', fontSize: '14px' }}>
              Notifications
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-primary-faint)', cursor: 'pointer' }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>Welcome to Smart Career Chooser!</div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>Complete your assessment to unlock your roadmap.</div>
                <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '6px', fontWeight: 'bold' }}>Just now</div>
              </div>
            </div>
            <div onClick={closeMenus} style={{ padding: '10px', textAlign: 'center', fontSize: '13px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}>
              Mark all as read
            </div>
          </div>
        )}

        {/* PROFILE BLOCK */}
        <div className={s.profile} style={{ cursor: 'pointer', position: 'relative', zIndex: 50, display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifMenuOpen(false); }}>
          <div className={s.who}>
            <div className={s.name}>{user?.name}</div>
            <div className={s.role}>{role}</div>
          </div>
          <div className={s.avatar} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, backgroundColor: 'var(--color-primary)' }}>
            {renderAvatarFace()}
          </div>
        </div>

        {/* PROFILE DROPDOWN */}
        {userMenuOpen && (
          <div style={{
            position: 'absolute', top: '45px', right: '0', minWidth: '220px',
            backgroundColor: 'var(--color-surface, #fff)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden',
            padding: '8px 0'
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{user?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{user?.email}</div>
            </div>

            <div onClick={() => { closeMenus(); navigate(`/${role}/profile`); }} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <User size={16} /> Profile
            </div>
            
            <div onClick={() => { closeMenus(); navigate(`/${role}/settings`); }} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <Settings size={16} /> Settings
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }}></div>

            <div onClick={handleLogout} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', color: 'var(--color-danger)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-soft, #fee2e2)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <LogOut size={16} /> Log out
            </div>
          </div>
        )}
      </div>
    </header>
  );
}