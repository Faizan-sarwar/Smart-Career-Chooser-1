// src/components/common/CircularProgress.jsx
import React from "react";
import s from "./CircularProgress.module.css";

export default function CircularProgress({
  value = 0,
  size = 80,
  stroke = 8,
  label,
  showValue = true,
  accent = false,
}) {
  const safe = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const color = accent ? "var(--color-accent)" : "var(--color-primary)";

  return (
    <div className={s.wrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} className={s.svg}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.7s var(--ease-out)" }}
        />
      </svg>
      {showValue && (
        <div className={s.center}>
          <span className={s.value} style={{ fontSize: size * 0.22 }}>
            {Math.round(safe)}%
          </span>
          {label && <span className={s.label}>{label}</span>}
        </div>
      )}
    </div>
  );
}