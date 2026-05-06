// src/components/common/StatCard.jsx
import React from "react";
import s from "./StatCard.module.css";

export default function StatCard({ label, value, delta, Icon, spark, accent = false }) {
  const deltaPositive =
    typeof delta === "string" && (delta.startsWith("+") || delta.toLowerCase().includes("up"));
  const deltaNegative = typeof delta === "string" && delta.startsWith("-");

  return (
    <div className={`${s.card} ${accent ? s.cardAccent : ""}`}>
      <div className={s.head}>
        <span className={s.label}>{label}</span>
        {Icon && (
          <span className={`${s.iconWrap} ${accent ? s.iconAccent : ""}`}>
            <Icon size={16} />
          </span>
        )}
      </div>

      <div className={s.value}>{value}</div>

      <div className={s.foot}>
        {delta && (
          <span
            className={`${s.delta} ${deltaPositive ? s.deltaUp : deltaNegative ? s.deltaDown : s.deltaNeutral
              }`}
          >
            {delta}
          </span>
        )}

        {spark && spark.length > 1 && (
          <Sparkline data={spark} accent={accent} />
        )}
      </div>
    </div>
  );
}

function Sparkline({ data, accent }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 60;
  const H = 22;
  const step = W / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(H - ((v - min) / range) * H).toFixed(1)}`)
    .join(" ");
  const areaPoints = `0,${H} ${points} ${W},${H}`;

  const stroke = accent ? "var(--color-accent)" : "var(--color-primary)";
  const fill = accent ? "var(--color-accent-soft)" : "var(--color-primary-soft)";

  return (
    <svg width={W} height={H} className={s.spark} aria-hidden>
      <polygon points={areaPoints} fill={fill} opacity="0.7" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}