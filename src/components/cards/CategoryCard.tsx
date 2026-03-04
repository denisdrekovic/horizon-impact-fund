"use client";

import { Briefcase, Heart, Zap } from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  Briefcase,
  Heart,
  Zap,
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  outperforming: { label: "Outperforming", className: "brand-badge brand-badge-green" },
  "on-track": { label: "On Track", className: "brand-badge brand-badge-blue" },
  "needs-attention": { label: "Needs Attention", className: "brand-badge brand-badge-orange" },
};

interface CategoryCardProps {
  label: string;
  icon: string;
  investments: number;
  totalDeployed: number;
  avgStatus: string;
}

export default function CategoryCard({
  label,
  icon,
  investments,
  totalDeployed,
  avgStatus,
}: CategoryCardProps) {
  const Icon = ICONS[icon] || Briefcase;
  const status = STATUS_STYLES[avgStatus] || STATUS_STYLES["on-track"];

  return (
    <div className="brand-card brand-card-hover p-5 cursor-pointer">
      <div className="flex items-start justify-between">
        <div
          className="p-2.5 rounded-xl"
          style={{ background: "var(--color-accent-light)" }}
        >
          <Icon size={22} style={{ color: "var(--color-accent)" }} />
        </div>
        <span className={status.className}>{status.label}</span>
      </div>
      <h3
        className="text-sm font-bold mt-3"
        style={{ color: "var(--text-primary)" }}
      >
        {label}
      </h3>
      <div className="flex items-baseline gap-4 mt-2">
        <div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Investments
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {investments}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Deployed
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            ${(totalDeployed / 1_000_000).toFixed(1)}M
          </p>
        </div>
      </div>
    </div>
  );
}
