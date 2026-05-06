// src/components/common/Page.jsx
import React from "react";
import s from "./Page.module.css";

export function Page({ children }) {
  return <div className={s.page}>{children}</div>;
}

export function PageHead({ title, subtitle, actions }) {
  return (
    <header className={s.head}>
      <div className={s.headText}>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </header>
  );
}

export function Grid({ cols = 4, children }) {
  return (
    <div
      className={s.grid}
      style={{ "--grid-cols": cols }}
    >
      {children}
    </div>
  );
}

export function TwoCol({ children, ratio = "1:1" }) {
  return (
    <div className={`${s.twoCol} ${ratio === "2:1" ? s.twoColAsymm : ""}`}>
      {children}
    </div>
  );
}