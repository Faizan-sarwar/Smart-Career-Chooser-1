// src/components/common/Card.jsx
import React from "react";
import s from "./Card.module.css";

export default function Card({ title, action, children, className = "", padded = true }) {
  return (
    <section className={`${s.card} ${className}`}>
      {(title || action) && (
        <header className={s.head}>
          {title && <h3 className={s.title}>{title}</h3>}
          {action && <div className={s.action}>{action}</div>}
        </header>
      )}
      <div className={padded ? s.body : ""}>{children}</div>
    </section>
  );
}