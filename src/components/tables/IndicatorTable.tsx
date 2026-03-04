"use client";

import type { IndicatorMetric } from "@/types/investment";
import { ChevronRight } from "lucide-react";
import { assessProgress } from "@/lib/progressUtils";

interface IndicatorTableProps {
  indicators: IndicatorMetric[];
  periods?: string[];
  selectedPeriodIndex?: number;
  showMethodology?: boolean;
}

/** Tiny inline sparkline SVG */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const pad = 2;
  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - 2 * pad);
      const y = h - pad - ((v - min) / range) * (h - 2 * pad);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {(() => {
        const lastX = pad + ((values.length - 1) / (values.length - 1)) * (w - 2 * pad);
        const lastY = h - pad - ((values[values.length - 1] - min) / range) * (h - 2 * pad);
        return <circle cx={lastX} cy={lastY} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

export default function IndicatorTable({
  indicators,
  periods,
  selectedPeriodIndex,
  showMethodology = false,
}: IndicatorTableProps) {
  if (!indicators.length) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: "var(--text-tertiary)" }}>
        No indicators available
      </p>
    );
  }

  const totalPeriods = periods?.length ?? 6;
  const currentPeriodIdx = selectedPeriodIndex ?? totalPeriods - 1;

  const getDisplayValue = (metric: IndicatorMetric): number => {
    if (
      selectedPeriodIndex !== undefined &&
      metric.values &&
      selectedPeriodIndex < metric.values.length
    ) {
      return metric.values[selectedPeriodIndex];
    }
    return metric.value;
  };

  const getDisplayPeriod = (metric: IndicatorMetric): string => {
    if (selectedPeriodIndex !== undefined && periods && selectedPeriodIndex < periods.length) {
      return periods[selectedPeriodIndex];
    }
    return metric.period;
  };

  const getPrevValue = (metric: IndicatorMetric): number | null => {
    if (
      selectedPeriodIndex !== undefined &&
      selectedPeriodIndex > 0 &&
      metric.values &&
      selectedPeriodIndex - 1 < metric.values.length
    ) {
      return metric.values[selectedPeriodIndex - 1];
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {indicators.map((metric) => {
        const displayValue = getDisplayValue(metric);
        const displayPeriod = getDisplayPeriod(metric);
        const prevValue = getPrevValue(metric);

        // Milestone-based progress assessment
        const progress =
          metric.target && metric.target > 0
            ? assessProgress(displayValue, metric.target, currentPeriodIdx, totalPeriods)
            : null;

        const hasDetails =
          (showMethodology || metric.methodology) &&
          (metric.methodology || metric.source);

        const periodChange =
          prevValue !== null && prevValue > 0
            ? Math.round(((displayValue - prevValue) / prevValue) * 100)
            : null;

        return (
          <div key={metric.id}>
            <div
              className="flex justify-between items-start py-2"
              style={{ borderBottom: "1px solid var(--card-border)" }}
            >
              <div className="min-w-0 mr-3 flex-1">
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  {metric.label}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  {metric.fullName}
                </p>

                {hasDetails && (
                  <details className="mt-1 group">
                    <summary
                      className="flex items-center gap-1 cursor-pointer text-[9px] font-medium select-none"
                      style={{ color: "var(--color-accent)" }}
                    >
                      <ChevronRight
                        size={10}
                        className="shrink-0 transition-transform duration-200 group-open:rotate-90"
                      />
                      Methodology & Source
                    </summary>
                    <div className="mt-1 ml-3.5 space-y-0.5">
                      {metric.methodology && (
                        <p className="text-[9px] leading-tight" style={{ color: "var(--text-tertiary)" }}>
                          {metric.methodology}
                        </p>
                      )}
                      {metric.source && (
                        <p className="text-[9px] italic" style={{ color: "var(--text-tertiary)" }}>
                          Source: {metric.source}
                        </p>
                      )}
                    </div>
                  </details>
                )}
              </div>

              <div className="flex items-center gap-3">
                {metric.values && metric.values.length > 1 && (
                  <Sparkline values={metric.values} color="var(--color-accent)" />
                )}

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {displayValue.toLocaleString()} {metric.unit}
                  </p>
                  {metric.target != null && (
                    <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      Target: {metric.target.toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                      as of {displayPeriod}
                    </p>
                    {periodChange !== null && (
                      <span
                        className="text-[9px] font-semibold"
                        style={{ color: periodChange >= 0 ? "#3DD29D" : "#FF5005" }}
                      >
                        {periodChange >= 0 ? "+" : ""}{periodChange}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar — milestone-aware */}
            {progress && (
              <div className="mt-1.5">
                <div
                  className="w-full h-1.5 rounded-full"
                  style={{ background: "var(--color-surface-3)" }}
                >
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, progress.pctOfTarget)}%`,
                      background: progress.color,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    {progress.pctOfTarget}% of target
                  </p>
                  <span
                    className="text-[9px] font-semibold"
                    style={{ color: progress.color }}
                  >
                    {progress.label}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
