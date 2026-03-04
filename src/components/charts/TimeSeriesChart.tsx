"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { CHART_THEME } from "@/lib/chartTheme";
import CustomTooltip from "@/components/charts/CustomTooltip";

interface TimeSeriesChartProps {
  data: { period: string; value: number }[];
  color?: string;
  gradientId?: string;
  formatValue?: (v: number) => string;
  height?: number;
  yAxisLabel?: string;
  /** End-of-lifecycle target value. When provided, renders a dashed trendline
   *  from the first period's proportional milestone to the target at the last period. */
  target?: number;
  /** Optional label for the target reference (shown in tooltip). Defaults to "Target". */
  targetLabel?: string;
  /** Flat horizontal reference line (no trendline interpolation). Useful for
   *  break-even lines, baselines, etc. */
  referenceLine?: { value: number; label: string; color?: string };
}

export default function TimeSeriesChart({
  data,
  color = "#034BE4",
  gradientId = "tsGrad",
  formatValue = (v) => v.toLocaleString(),
  height = 250,
  target,
  targetLabel = "Target",
  referenceLine,
}: TimeSeriesChartProps) {
  /* Build data with optional linear target milestones.
     Interpolates from the first actual value → target across all periods.
     This way metrics with a meaningful baseline (e.g. NPS starting at 42,
     Repayment Rate starting at 92%) show a realistic trajectory. */
  const chartData = data.map((d, i) => {
    if (target == null) return d;
    const baseline = data[0]?.value ?? 0;
    const milestone = baseline + ((target - baseline) / (data.length - 1)) * i;
    return { ...d, target: Math.round(milestone * 1000) / 1000 };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_THEME.gridStroke}
          vertical={false}
        />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11, fill: CHART_THEME.tickFill }}
          axisLine={{ stroke: CHART_THEME.axisStroke }}
          tickLine={false}
          angle={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_THEME.tickFill }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatValue}
        />
        <Tooltip
          content={
            <CustomTooltip
              formatValue={(val) => formatValue(val)}
            />
          }
        />
        {/* Target trendline — dashed, drawn BEHIND the actual line */}
        {target != null && (
          <Line
            type="monotone"
            dataKey="target"
            name={targetLabel}
            stroke="var(--text-tertiary)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        )}
        {/* Final target reference line */}
        {target != null && (
          <ReferenceLine
            y={target}
            stroke="var(--text-tertiary)"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{
              value: `${targetLabel}: ${formatValue(target)}`,
              position: "insideTopRight",
              fontSize: 10,
              fill: "var(--text-tertiary)",
            }}
          />
        )}
        {/* Flat horizontal reference line (e.g. break-even / capital called) */}
        {referenceLine && (
          <ReferenceLine
            y={referenceLine.value}
            stroke={referenceLine.color || "#FF9705"}
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: referenceLine.label,
              position: "insideTopLeft",
              fontSize: 10,
              fill: referenceLine.color || "#FF9705",
              fontWeight: 600,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          name="Actual"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: color, stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
