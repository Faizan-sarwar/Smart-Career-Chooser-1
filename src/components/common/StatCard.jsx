import React from "react";
import Sparkline from "./Sparkline.jsx";
import s from "./StatCard.module.css";

export default function StatCard({ label, value, delta, Icon, down, spark, accent }) {
  return (
    <div className={`${s.stat} ${accent ? s.accent : ""}`}>
      <div className={s.row}>
        <div className={s.label}>{label}</div>
        {Icon && <div className={`${s.icon} ${accent ? s.iconAccent : ""}`}><Icon size={18} /></div>}
      </div>
      <div className={s.value}>{value}</div>
      <div className={s.foot}>
        {delta && <div className={`${s.delta} ${down ? s.deltaDown : ""}`}>{delta}</div>}
        {spark && <Sparkline data={spark} color={accent ? "#f59e0b" : "#52a447"} />}
      </div>
    </div>
  );
}
