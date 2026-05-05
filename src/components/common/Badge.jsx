import React from "react";
import s from "./Badge.module.css";

export default function Badge({ tone = "primary", children }) {
  return <span className={`${s.badge} ${s[tone] || ""}`}>{children}</span>;
}
