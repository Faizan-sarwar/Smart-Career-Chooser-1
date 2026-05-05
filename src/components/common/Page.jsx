import React from "react";
import s from "./Page.module.css";

export function Page({ children }) { return <div className={s.page}>{children}</div>; }
export function PageHead({ title, subtitle, action }) {
  return (
    <header className={s.head}>
      <div>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
export function Grid({ cols = 4, children }) {
  const cls = cols === 2 ? s.grid2 : cols === 3 ? s.grid3 : s.grid;
  return <div className={cls}>{children}</div>;
}
export function TwoCol({ children }) { return <div className={s.cols2}>{children}</div>; }
