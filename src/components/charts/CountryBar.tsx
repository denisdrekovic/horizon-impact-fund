"use client";

import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Investment } from "@/types/investment";
import { CHART_COLORS } from "@/lib/chartTheme";
import CustomTooltip from "./CustomTooltip";

interface Props {
  investments: Investment[];
}

export default function CountryBar({ investments }: Props) {
  const data = investments
    .map((inv) => ({
      country: inv.country,
      amount: inv.investmentAmount,
      sector: inv.sector,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
          <XAxis
            type="number"
            tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
            tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
            axisLine={{ stroke: "var(--card-border)" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="country"
            tick={{ fontSize: 11, fill: "var(--text-primary)" }}
            width={70}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={
              <CustomTooltip formatValue={(val) => `$${(val / 1_000_000).toFixed(1)}M`} />
            }
          />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
