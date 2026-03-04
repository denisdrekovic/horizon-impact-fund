"use client";

import type { Investment } from "@/types/investment";
import { STATUS_COLORS, SECTOR_COLORS } from "@/lib/chartTheme";

const SECTOR_LABELS: Record<string, string> = {
  "clean-energy": "Clean Energy",
  agritech: "AgriTech",
  wash: "Water & Sanitation",
  "financial-inclusion": "Financial Inclusion",
  healthcare: "Healthcare",
  education: "Education",
};

const STATUS_LABELS: Record<string, string> = {
  outperforming: "Outperforming",
  "on-track": "On Track",
  "needs-attention": "Needs Attention",
};

interface InvestmentHeaderProps {
  investment: Investment;
}

export default function InvestmentHeader({ investment }: InvestmentHeaderProps) {
  const statusColor = STATUS_COLORS[investment.status] || "#428BF9";
  const sectorColor = SECTOR_COLORS[investment.sector] || "var(--color-accent)";

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        {/* Color indicator */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: sectorColor }}
        >
          {investment.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>

        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {investment.name}
          </h2>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {investment.country} &middot;{" "}
            {SECTOR_LABELS[investment.sector] || investment.sector} &middot;{" "}
            {investment.stage.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-bold px-3 py-1 rounded-full"
          style={{
            background: `${sectorColor}18`,
            color: sectorColor,
          }}
        >
          {SECTOR_LABELS[investment.sector] || investment.sector}
        </span>
        <span
          className="text-[10px] font-bold px-3 py-1 rounded-full"
          style={{
            background: `${statusColor}18`,
            color: statusColor,
          }}
        >
          {STATUS_LABELS[investment.status] || investment.status}
        </span>
      </div>
    </div>
  );
}
