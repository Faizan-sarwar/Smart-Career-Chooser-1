import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import s from "./AppShell.module.css";

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  return (
    <div className={s.shell}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      {mobileOpen && <div className={s.scrim} onClick={() => setMobileOpen(false)} />}
      <div className={s.main}>
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main key={location.pathname} className={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
