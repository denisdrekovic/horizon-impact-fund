"use client";

import type { LucideIcon } from "lucide-react";
import Card from "@/components/ui/Card";
import MetricTooltip from "@/components/ui/MetricTooltip";
import MetricComparisonBadge from "@/components/ui/MetricComparisonBadge";
import TrendBadge from "@/components/ui/TrendBadge";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  variant?: "default" | "compact" | "hero";
  tooltip?: string;
  comparison?: {
    value: number;
    avgValue: number;
    format?: "pct" | "number" | "moic";
  };
  trend?: { pct: number; label?: string };
  subtitle?: string;
  customValue?: React.ReactNode;
}

const VARIANT_CONFIG = {
  default: { padding: "", iconSize: 18, iconBg: "p-2", gap: "gap-3", valueFont: "text-lg" },
  compact: { padding: "!p-4", iconSize: 18, iconBg: "p-1.5", gap: "gap-2.5", valueFont: "text-lg" },
  hero: { padding: "", iconSize: 20, iconBg: "p-2", gap: "gap-3", valueFont: "text-xl" },
} as const;

export default function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  variant = "default",
  tooltip,
  comparison,
  trend,
  subtitle,
  customValue,
}: KpiCardProps) {
  const cfg = VARIANT_CONFIG[variant];

  return (
    <Card className={cfg.padding || undefined}>
      <div className={`flex items-start ${cfg.gap}`}>
        <div
          className={`${cfg.iconBg} rounded-lg shrink-0`}
          style={{ background: "var(--color-surface-2)" }}
        >
          <Icon size={cfg.iconSize} style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p
              className="text-[10px] uppercase tracking-wider font-medium truncate"
              style={{ color: "var(--text-tertiary)" }}
            >
              {label}
            </p>
            {tooltip && <MetricTooltip text={tooltip} />}
          </div>

          {customValue ?? (
            <p
              className={`${cfg.valueFont} font-bold mt-0.5 whitespace-nowrap`}
              style={{ color: "var(--text-primary)" }}
            >
              {value}
            </p>
          )}

          {comparison && (
            <MetricComparisonBadge
              value={comparison.value}
              avgValue={comparison.avgValue}
              format={comparison.format}
            />
          )}

          {trend && <TrendBadge pct={trend.pct} label={trend.label} />}

          {subtitle && (
            <p
              className="text-[9px] mt-1 leading-tight"
              style={{ color: "var(--text-tertiary)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
