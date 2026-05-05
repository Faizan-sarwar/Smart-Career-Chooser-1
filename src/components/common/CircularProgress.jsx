import React from "react";
import s from "./CircularProgress.module.css";

export default function CircularProgress({ value = 0, size = 120, stroke = 10, label }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className={s.wrap} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--color-border)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke="url(#cpGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
        <defs>
          <linearGradient id="cpGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#52a447" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className={s.center}>
        <div className={s.value}>{pct}%</div>
        {label && <div className={s.label}>{label}</div>}
      </div>
    </div>
  );
}
