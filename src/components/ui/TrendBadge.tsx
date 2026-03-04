"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendBadgeProps {
  pct: number;
  label?: string;
}

export default function TrendBadge({ pct, label = "vs prior" }: TrendBadgeProps) {
  if (pct === 0) return null;
  const isUp = pct > 0;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold mt-1"
      style={{ color: isUp ? "#3DD29D" : "#FF5005" }}
    >
      {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {isUp ? "+" : ""}
      {pct}%
      <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
    </span>
  );
}
