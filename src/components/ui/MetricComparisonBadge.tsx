"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricComparisonBadgeProps {
  value: number;
  avgValue: number;
  format?: "pct" | "number" | "moic";
  label?: string;
}

export default function MetricComparisonBadge({
  value,
  avgValue,
  format = "number",
  label = "avg",
}: MetricComparisonBadgeProps) {
  if (avgValue === 0) return null;

  const diff = value - avgValue;
  const pctDiff = Math.round((diff / avgValue) * 100);
  const isPositive = diff > 0;
  const isZero = Math.abs(pctDiff) < 1;

  let displayDiff: string;
  if (format === "pct") {
    displayDiff = `${isPositive ? "+" : ""}${diff.toFixed(1)}pp`;
  } else if (format === "moic") {
    displayDiff = `${isPositive ? "+" : ""}${diff.toFixed(2)}x`;
  } else {
    displayDiff = `${isPositive ? "+" : ""}${pctDiff}%`;
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium mt-0.5"
      style={{
        color: isZero
          ? "var(--text-tertiary)"
          : isPositive
            ? "#3DD29D"
            : "#FF5005",
      }}
    >
      {isZero ? (
        <Minus size={10} />
      ) : isPositive ? (
        <TrendingUp size={10} />
      ) : (
        <TrendingDown size={10} />
      )}
      {displayDiff}
      <span style={{ color: "var(--text-tertiary)" }}>vs {label}</span>
    </span>
  );
}
