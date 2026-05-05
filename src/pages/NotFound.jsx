import React from "react";
import { Link } from "react-router-dom";
import s from "./NotFound.module.css";

export default function NotFound() {
  return (
    <div className={s.wrap}>
      <div className={s.code}>404</div>
      <h1 className={s.title}>Page not found</h1>
      <p className={s.sub}>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className={s.btn}>Go home</Link>
    </div>
  );
}
