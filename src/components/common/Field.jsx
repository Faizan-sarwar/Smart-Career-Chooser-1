// src/components/common/Field.jsx
import React from "react";
import s from "./Field.module.css";

export function Field({ label, hint, error, children, required = false }) {
  return (
    <label className={s.field}>
      {label && (
        <span className={s.label}>
          {label}
          {required && <span className={s.req}> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className={s.error}>{error}</span>
      ) : hint ? (
        <span className={s.hint}>{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ ...props }) {
  return <input className={s.input} {...props} />;
}

export function Textarea({ rows = 3, ...props }) {
  return <textarea rows={rows} className={s.textarea} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className={s.select} {...props}>
      {children}
    </select>
  );
}