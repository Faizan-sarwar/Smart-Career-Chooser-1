import React from "react";
import s from "./ProgressBar.module.css";

export default function ProgressBar({ value = 0, label, showValue = true }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && (
        <div className={s.row}>
          <span className={s.label}>{label}</span>
          {showValue && <span>{pct}%</span>}
        </div>
      )}
      <div className={s.bar}><div className={s.fill} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
