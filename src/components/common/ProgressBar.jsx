// src/components/common/ProgressBar.jsx
import React from "react";
import s from "./ProgressBar.module.css";

export default function ProgressBar({ value = 0, label, showValue = true }) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div className={s.wrap}>
      {(label || showValue) && (
        <div className={s.head}>
          {label && <span className={s.label}>{label}</span>}
          {showValue && <span className={s.value}>{Math.round(safe)}%</span>}
        </div>
      )}
      <div className={s.track}>
        <div className={s.fill} style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}