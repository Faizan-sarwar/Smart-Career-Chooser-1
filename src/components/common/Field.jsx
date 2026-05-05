import React from "react";
import s from "./Field.module.css";

export function Field({ label, error, hint, children }) {
  return (
    <label className={s.field}>
      {label && <span className={s.label}>{label}</span>}
      {children}
      {hint && !error && <span className={s.hint}>{hint}</span>}
      {error && <span className={s.error}>{error}</span>}
    </label>
  );
}

export function Input(props) { return <input className={s.input} {...props} />; }
export function Textarea(props) { return <textarea className={s.textarea} {...props} />; }
export function Select({ children, ...rest }) {
  return <select className={s.select} {...rest}>{children}</select>;
}
