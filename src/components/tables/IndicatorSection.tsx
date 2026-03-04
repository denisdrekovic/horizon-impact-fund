"use client";

import { useState, useMemo } from "react";
import type { IndicatorMetric } from "@/types/investment";
import ChartContainer from "@/components/ui/ChartContainer";
import IndicatorTable from "@/components/tables/IndicatorTable";
import PeriodSelector from "@/components/ui/PeriodSelector";
import { assessProgress } from "@/lib/progressUtils";

interface IndicatorSectionProps {
  title: string;
  subtitle: string;
  indicators: IndicatorMetric[];
  periods: string[];
  csvFilename: string;
  showMethodology?: boolean;
}

export default function IndicatorSection({
  title,
  subtitle,
  indicators,
  periods,
  csvFilename,
  showMethodology = false,
}: IndicatorSectionProps) {
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(periods.length - 1);

  const selectedPeriod = periods[selectedPeriodIndex];

  // CSV data includes all periods for export
  const csvData = useMemo(() => {
    return indicators.map((m) => {
      const row: Record<string, string | number> = {
        Indicator: m.label,
        "Full Name": m.fullName,
        Unit: m.unit,
        Target: m.target ?? "N/A",
      };
      // Add each period's value
      if (m.values) {
        periods.forEach((p, i) => {
          row[p] = m.values![i] ?? "N/A";
        });
      } else {
        row["Latest Value"] = m.value;
      }
      if (m.methodology) row["Methodology"] = m.methodology;
      if (m.source) row["Source"] = m.source;
      return row;
    });
  }, [indicators, periods]);

  // Table view: all periods as columns
  const tableView = (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "2px solid var(--card-border)" }}>
            <th
              className="text-left py-2 px-2 font-semibold sticky left-0"
              style={{ color: "var(--text-secondary)", background: "var(--color-surface-1)" }}
            >
              Indicator
            </th>
            {periods.map((p) => (
              <th
                key={p}
                className="text-right py-2 px-2 font-semibold whitespace-nowrap"
                style={{
                  color: p === selectedPeriod ? "var(--color-accent)" : "var(--text-secondary)",
                }}
              >
                {p}
              </th>
            ))}
            <th className="text-right py-2 px-2 font-semibold" style={{ color: "var(--text-secondary)" }}>
              Target
            </th>
            <th className="text-right py-2 px-2 font-semibold" style={{ color: "var(--text-secondary)" }}>
              % Achieved
            </th>
          </tr>
        </thead>
        <tbody>
          {indicators.map((m) => {
            const latestVal = m.values ? m.values[m.values.length - 1] : m.value;
            const progress = m.target
              ? assessProgress(latestVal, m.target, periods.length - 1, periods.length)
              : null;
            return (
              <tr key={m.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td
                  className="py-1.5 px-2 font-medium sticky left-0"
                  style={{ color: "var(--text-primary)", background: "var(--color-surface-1)" }}
                >
                  <span className="block">{m.label}</span>
                  <span className="block text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                    {m.unit}
                  </span>
                </td>
                {periods.map((p, i) => {
                  const val = m.values ? m.values[i] : (i === periods.length - 1 ? m.value : null);
                  const prevVal = i > 0 && m.values ? m.values[i - 1] : null;
                  const change = prevVal && prevVal > 0 && val != null
                    ? Math.round(((val - prevVal) / prevVal) * 100)
                    : null;
                  return (
                    <td
                      key={p}
                      className="py-1.5 px-2 text-right tabular-nums"
                      style={{
                        color: p === selectedPeriod ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: p === selectedPeriod ? 600 : 400,
                      }}
                    >
                      {val != null ? val.toLocaleString() : "\u2014"}
                      {change !== null && (
                        <span
                          className="block text-[9px]"
                          style={{ color: change >= 0 ? "#3DD29D" : "#FF5005" }}
                        >
                          {change >= 0 ? "+" : ""}{change}%
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="py-1.5 px-2 text-right" style={{ color: "var(--text-secondary)" }}>
                  {m.target != null ? m.target.toLocaleString() : "\u2014"}
                </td>
                <td
                  className="py-1.5 px-2 text-right font-medium"
                  style={{ color: progress ? progress.color : "var(--text-tertiary)" }}
                >
                  {progress ? `${progress.pctOfTarget}%` : "\u2014"}
                  {progress && (
                    <span className="block text-[8px]" style={{ color: progress.color }}>
                      {progress.label}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      csvData={csvData}
      csvFilename={csvFilename}
      tableView={tableView}
    >
      <div className="space-y-4">
        {/* Period selector + progress legend */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <PeriodSelector
            periods={periods}
            selectedIndex={selectedPeriodIndex}
            onChange={setSelectedPeriodIndex}
          />
          <div className="flex items-center gap-3 text-[9px]" style={{ color: "var(--text-tertiary)" }}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#3DD29D" }} />
              Ahead / Target met
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--color-accent)" }} />
              On track for period
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#FF9705" }} />
              Behind milestone
            </span>
          </div>
        </div>

        {/* Indicator cards with per-period values */}
        <IndicatorTable
          indicators={indicators}
          periods={periods}
          selectedPeriodIndex={selectedPeriodIndex}
          showMethodology={showMethodology}
        />
      </div>
    </ChartContainer>
  );
}
