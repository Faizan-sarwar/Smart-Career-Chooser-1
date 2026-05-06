// src/components/common/Button.jsx
import React from "react";
import s from "./Button.module.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  onClick,
  className = "",
  ...rest
}) {
  const cls = [
    s.btn,
    s[`btn_${variant}`],
    s[`size_${size}`],
    disabled ? s.disabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}