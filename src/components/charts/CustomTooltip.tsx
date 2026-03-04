"use client";

import { formatCompact, formatPct } from "@/lib/chartTheme";

interface TooltipRow {
  label: string;
  value: number | string;
  color?: string;
  unit?: string;
  suffix?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  rows?: TooltipRow[];
  headerLabel?: string;
  // For Recharts integration
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
    payload?: Record<string, unknown>;
  }>;
  formatValue?: (value: number, name: string) => string;
}

export default function CustomTooltip({
  active,
  label,
  rows,
  headerLabel,
  payload,
  formatValue,
}: CustomTooltipProps) {
  if (!active) return null;

  // Build rows from Recharts payload if not explicitly provided
  const displayRows: TooltipRow[] =
    rows ||
    (payload
      ?.filter((p) => p.value !== undefined)
      .map((p) => ({
        label: String(p.name || p.dataKey || ""),
        value: formatValue
          ? formatValue(p.value as number, String(p.name || p.dataKey || ""))
          : typeof p.value === "number" && Math.abs(p.value) >= 1000
            ? formatCompact(p.value)
            : typeof p.value === "number"
              ? p.value % 1 !== 0
                ? p.value.toFixed(1)
                : String(p.value)
              : String(p.value ?? ""),
        color: p.color,
      })) ??
    []);

  if (displayRows.length === 0) return null;

  return (
    <div
      className="rounded-lg px-3 py-2.5 text-xs min-w-[160px]"
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid var(--card-border)",
        boxShadow: "var(--shadow-tooltip)",
        color: "var(--text-primary)",
      }}
    >
      {/* Header */}
      {(headerLabel || label) && (
        <div
          className="font-semibold mb-1.5 pb-1.5"
          style={{
            borderBottom: "1px solid var(--card-border)",
            color: "var(--text-primary)",
          }}
        >
          {headerLabel || label}
        </div>
      )}

      {/* Data rows */}
      <div className="space-y-1">
        {displayRows.map((row, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {row.color && (
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: row.color }}
                />
              )}
              <span style={{ color: "var(--text-secondary)" }}>
                {row.label}
              </span>
            </div>
            <span className="font-semibold tabular-nums">
              {row.value}
              {row.unit && (
                <span
                  className="font-normal ml-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {row.unit}
                </span>
              )}
              {row.suffix && (
                <span
                  className="font-normal ml-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {row.suffix}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Re-export formatting helpers for convenience */
export { formatCompact, formatPct };
