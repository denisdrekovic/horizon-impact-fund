"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_THEME, formatCompact } from "@/lib/chartTheme";
import CustomTooltip from "@/components/charts/CustomTooltip";

interface GenderBreakdownChartProps {
  data: Array<{ name: string; female: number; male: number }>;
  legendInstance: {
    handleLegendClick: (e: unknown) => void;
    isHidden: (key: string) => boolean;
  };
  yAxisWidth?: number;
  formatXValue?: (v: number) => string;
}

export default function GenderBreakdownChart({
  data,
  legendInstance,
  yAxisWidth = 100,
  formatXValue,
}: GenderBreakdownChartProps) {
  const xFormatter = formatXValue ?? ((v: number) => formatCompact(v));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_THEME.gridStroke}
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
          tickFormatter={xFormatter}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
          width={yAxisWidth}
        />
        <Tooltip
          content={
            <CustomTooltip formatValue={(v) => v.toLocaleString()} />
          }
        />
        <Legend
          wrapperStyle={{ fontSize: 10, cursor: "pointer" }}
          onClick={legendInstance.handleLegendClick}
          formatter={(value: string) => (
            <span
              style={{
                color: legendInstance.isHidden(value)
                  ? "var(--text-tertiary)"
                  : undefined,
                textDecoration: legendInstance.isHidden(value)
                  ? "line-through"
                  : undefined,
              }}
            >
              {value}
            </span>
          )}
        />
        {!legendInstance.isHidden("Female") && (
          <Bar
            dataKey="female"
            name="Female"
            stackId="sex"
            fill="#E05297"
            barSize={18}
          />
        )}
        {!legendInstance.isHidden("Male") && (
          <Bar
            dataKey="male"
            name="Male"
            stackId="sex"
            fill="#428BF9"
            radius={[0, 4, 4, 0]}
            barSize={18}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
