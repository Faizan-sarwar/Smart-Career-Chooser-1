import React from "react";
import s from "./Card.module.css";

export default function Card({ title, action, children, className = "" }) {
  return (
    <section className={`${s.card} ${className}`}>
      {(title || action) && (
        <header className={s.head}>
          <div className={s.title}>{title}</div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
