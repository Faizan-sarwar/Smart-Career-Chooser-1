import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Menu, LogOut, ImagePlus, User, Smile } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import s from "./Topbar.module.css";

const PRESET_AVATARS = ["🦊", "🐼", "🐨", "🦁", "🐸", "🦉", "🦄", "🐧"];

export default function Topbar({ onMenuClick }) {
  const { user, logout, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [pickEmoji, setPickEmoji] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const initials = (user?.name || "U")
    .split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatarUrl: reader.result, avatarEmoji: null });
    reader.readAsDataURL(file);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const renderAvatarFace = () => {
    if (user?.avatarUrl) return null;
    if (user?.avatarEmoji) return <span style={{ fontSize: 20 }}>{user.avatarEmoji}</span>;
    return initials;
  };

  return (
    <header className={s.bar}>
      <button className={s.menu} onClick={onMenuClick} aria-label="Open menu"><Menu size={20} /></button>
      <div className={s.search}>
        <Search size={16} />
        <input placeholder="Search careers, skills, mentors…" />
      </div>
      <div className={s.spacer} />
      <button className={s.iconBtn} aria-label="Notifications">
        <Bell size={18} />
        <span className={s.dot} />
      </button>

      <div className={s.profile}>
        <div className={s.who}>
          <div className={s.name}>{user?.name}</div>
          <div className={s.role}>{user?.role}</div>
        </div>
        <button
          className={s.avatar}
          onClick={() => { setOpen((v) => !v); setPickEmoji(false); }}
          style={user?.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})`, backgroundSize: "cover", color: "transparent" } : {}}
          aria-label="Account menu"
        >
          {renderAvatarFace()}
        </button>
      </div>

      {open && (
        <div className={s.popover} role="menu">
          {pickEmoji ? (
            <>
              <div className={s.popHead}>Pick an avatar</div>
              <div className={s.emojiGrid}>
                {PRESET_AVATARS.map((a) => (
                  <button key={a} className={`${s.emojiBtn} ${user?.avatarEmoji === a ? s.emojiBtnActive : ""}`}
                    onClick={() => { updateProfile({ avatarEmoji: a, avatarUrl: null }); setPickEmoji(false); setOpen(false); }}>
                    {a}
                  </button>
                ))}
              </div>
              <button className={s.popItem} onClick={() => setPickEmoji(false)}>← Back</button>
            </>
          ) : (
            <>
              <button className={s.popItem} onClick={() => setPickEmoji(true)}>
                <Smile size={16} /> Pick avatar
              </button>
              <button className={s.popItem} onClick={() => { setOpen(false); fileRef.current?.click(); }}>
                <ImagePlus size={16} /> Upload photo
              </button>
              <button className={s.popItem}>
                <User size={16} /> Profile
              </button>
              <button className={s.popItem} onClick={handleLogout}>
                <LogOut size={16} /> Log out
              </button>
            </>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
    </header>
  );
}
