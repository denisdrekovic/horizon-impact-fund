"use client";

import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Investment } from "@/types/investment";
import CustomTooltip from "./CustomTooltip";

const CATEGORY_LABELS: Record<string, string> = {
  "climate-energy": "Climate & Energy",
  livelihoods: "Livelihoods",
  "essential-services": "Essential Services",
};

const CATEGORY_COLORS: Record<string, string> = {
  "climate-energy": "#FF9705",
  livelihoods: "#034BE4",
  "essential-services": "#14B8A6",
};

interface Props {
  investments: Investment[];
}

export default function SectorBar({ investments }: Props) {
  const grouped = investments.reduce(
    (acc, inv) => {
      const cat = inv.sectorCategory;
      acc[cat] = (acc[cat] || 0) + inv.investmentAmount;
      return acc;
    },
    {} as Record<string, number>
  );

  const total = Object.values(grouped).reduce((s, v) => s + v, 0);

  const data = Object.entries(grouped)
    .map(([category, amount]) => ({
      name: CATEGORY_LABELS[category] || category,
      amount,
      category,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="h-full">
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
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--text-primary)" }}
            width={120}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={
              <CustomTooltip
                formatValue={(val) =>
                  `$${(val / 1_000_000).toFixed(1)}M (${((val / total) * 100).toFixed(0)}%)`
                }
              />
            }
          />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={22}>
            {data.map((entry) => (
              <Cell
                key={entry.category}
                fill={CATEGORY_COLORS[entry.category] || "#707787"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
