// src/components/common/Badge.jsx
import React from "react";
import s from "./Badge.module.css";

export default function Badge({ children, tone = "default" }) {
  return <span className={`${s.badge} ${s[`tone_${tone}`] || s.tone_default}`}>{children}</span>;
}