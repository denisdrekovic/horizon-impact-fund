"use client";

import { Info } from "lucide-react";

interface MetricTooltipProps {
  text: string;
}

export default function MetricTooltip({ text }: MetricTooltipProps) {
  return (
    <span className="relative group inline-flex">
      <Info
        size={12}
        className="cursor-help shrink-0"
        style={{ color: "var(--text-tertiary)" }}
      />
      <span
        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 rounded-lg text-[10px] leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none"
        style={{
          background: "var(--color-surface-1)",
          color: "var(--text-secondary)",
          border: "1px solid var(--card-border)",
          boxShadow: "var(--shadow-card-hover)",
        }}
      >
        {text}
      </span>
    </span>
  );
}
