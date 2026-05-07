// src/components/common/Badge.jsx
import React from "react";
import s from "./Badge.module.css";

export default function Badge({ children, tone = "default", className = "" }) {
  // Safely map the tone string (e.g. 'primary') to the CSS module class (e.g. s.primary)
  // Fallback to s.default if the tone is unrecognized
  const toneClass = s[tone] || s.default;

  return (
    <span className={`${s.badge} ${toneClass} ${className}`}>
      {children}
    </span>
  );
}