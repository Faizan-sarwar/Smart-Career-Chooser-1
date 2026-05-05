import React from "react";
import s from "./Button.module.css";

export default function Button({
  variant = "primary",
  size,
  block,
  className = "",
  children,
  ...rest
}) {
  const cls = [s.btn, s[variant], size && s[size], block && s.block, className]
    .filter(Boolean).join(" ");
  return <button className={cls} {...rest}>{children}</button>;
}
