"use client";

import type { Investment } from "@/types/investment";
import { computeMoic, computeDpi, computeHoldingPeriod, computeUnrealizedGain } from "@/lib/dataAggregation";
import MetricTooltip from "@/components/ui/MetricTooltip";
import TrendBadge from "@/components/ui/TrendBadge";
import { KPI_DEFINITIONS } from "@/lib/kpiDefinitions";
import IndicatorTable from "@/components/tables/IndicatorTable";
import { TrendingUp, TrendingDown, Users, Briefcase, Leaf, Home, Heart } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { formatCurrency, formatPct, formatMoic } from "@/lib/chartTheme";
import { STATUS_COLORS } from "@/lib/chartTheme";

const SECTOR_LABELS: Record<string, string> = {
  "clean-energy": "Clean Energy",
  agritech: "AgriTech",
  wash: "Water & Sanitation",
  "financial-inclusion": "Financial Inclusion",
  healthcare: "Healthcare",
  education: "Education",
};

const SDG_NAMES: Record<number, string> = {
  1: "No Poverty", 2: "Zero Hunger", 3: "Good Health", 4: "Quality Education",
  5: "Gender Equality", 6: "Clean Water", 7: "Clean Energy", 8: "Decent Work",
  9: "Industry & Innovation", 10: "Reduced Inequalities", 11: "Sustainable Cities",
  12: "Responsible Consumption", 13: "Climate Action",
};

function scoreColor(score: number): string {
  if (score >= 4) return "#3DD29D";
  if (score >= 3) return "#FF9705";
  return "#FF5005";
}

interface Props {
  investment: Investment;
}

export default function InvestmentDetailCard({ investment }: Props) {
  const moic = computeMoic(investment);
  const dpi = computeDpi(investment);
  const holding = computeHoldingPeriod(investment);
  const unrealized = computeUnrealizedGain(investment);
  const statusColor = STATUS_COLORS[investment.status] || "#428BF9";

  const trendData = investment.timeSeries.revenue.map((v, i) => ({
    period: investment.timeSeries.periods[i],
    value: v,
  }));

  /* ── Impact trend computation ── */
  const ts = investment.timeSeries;
  const lastIdx = ts.periods.length - 1;
  const prevIdx = Math.max(0, lastIdx - 1);
  const pctChange = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;

  const peopleTrend = pctChange(ts.peopleReached[lastIdx], ts.peopleReached[prevIdx]);
  const jobsTrend = pctChange(ts.jobsCreated[lastIdx], ts.jobsCreated[prevIdx]);

  const impactMetrics = [
    { icon: Users, label: "People Reached", value: investment.peopleReached.toLocaleString(), color: "var(--color-accent)", trend: peopleTrend },
    { icon: Home, label: "Households Reached", value: investment.householdsReached.toLocaleString(), color: "#034BE4", trend: null as number | null },
    { icon: Briefcase, label: "Jobs Created", value: investment.jobsCreated.toLocaleString(), color: "var(--color-accent)", trend: jobsTrend },
    ...(investment.co2Avoided ? [{ icon: Leaf, label: "CO\u2082 Avoided", value: `${investment.co2Avoided.toLocaleString()} tCO2e`, color: "#3DD29D", trend: null as number | null }] : []),
    { icon: Heart, label: "Women Beneficiaries", value: `${investment.womenBeneficiaryPct}%`, color: "#FF9705", trend: null as number | null },
  ];

  return (
    <div className="space-y-5">
      {/* Header badges */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="brand-badge"
            style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
          >
            {SECTOR_LABELS[investment.sector] || investment.sector}
          </span>
          <span
            className="brand-badge"
            style={{ background: `${statusColor}20`, color: statusColor }}
          >
            {investment.status === "outperforming" ? "Outperforming" : investment.status === "on-track" ? "On Track" : "Needs Attention"}
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {investment.country} &middot;{" "}
          {investment.stage.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Invested", value: formatCurrency(investment.investmentAmount, true) },
          { label: "Valuation", value: formatCurrency(investment.currentValuation, true) },
          { label: "IRR", value: formatPct(investment.irr), accent: true },
          { label: "MOIC", value: formatMoic(moic), accent: true },
          { label: "DPI", value: dpi.toFixed(2) + "x" },
          { label: "Unrealized Gain", value: formatCurrency(unrealized, true) },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-3"
            style={{ background: "var(--color-surface-2)" }}
          >
            <div className="flex items-center gap-1">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                {kpi.label}
              </p>
              {KPI_DEFINITIONS[kpi.label] && (
                <MetricTooltip text={KPI_DEFINITIONS[kpi.label]} />
              )}
            </div>
            <p
              className="text-lg font-bold"
              style={{ color: kpi.accent ? "var(--color-accent)" : "var(--text-primary)" }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Holding period */}
      <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
        Holding period: {holding} years (since {investment.investmentDate})
      </p>

      {/* Revenue Trend Sparkline */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            Revenue Trend ($K)
          </p>
          <div className="flex items-center gap-1 text-xs">
            {investment.revenueGrowth > 0 ? (
              <TrendingUp size={14} style={{ color: "#3DD29D" }} />
            ) : (
              <TrendingDown size={14} style={{ color: "#FF5005" }} />
            )}
            <span className="font-bold" style={{ color: investment.revenueGrowth > 0 ? "#3DD29D" : "#FF5005" }}>
              {investment.revenueGrowth > 0 ? "+" : ""}{investment.revenueGrowth}% YoY
            </span>
          </div>
        </div>
        <p className="text-[9px] mb-1" style={{ color: "var(--text-tertiary)" }}>
          {investment.timeSeries.periods[0]} – {investment.timeSeries.periods[investment.timeSeries.periods.length - 1]} ({investment.timeSeries.periods.length} periods)
        </p>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="accentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#034BE4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#034BE4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#034BE4" strokeWidth={2} fill="url(#accentGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px]" style={{ color: "var(--text-tertiary)" }}>{investment.timeSeries.periods[0]}</span>
          <span className="text-[8px]" style={{ color: "var(--text-tertiary)" }}>{investment.timeSeries.periods[investment.timeSeries.periods.length - 1]}</span>
        </div>
      </div>

      {/* Impact KPIs */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Impact Metrics
        </p>
        <div className="space-y-2.5">
          {impactMetrics.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <item.icon size={16} className="shrink-0" style={{ color: item.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.label}</p>
                  {KPI_DEFINITIONS[item.label] && (
                    <MetricTooltip text={KPI_DEFINITIONS[item.label]} />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{item.value}</p>
                  {item.trend !== null && item.trend !== 0 && (
                    <TrendBadge pct={item.trend} label="vs prior" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Output Indicators */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Outputs
        </p>
        <IndicatorTable
          indicators={investment.outputs}
          periods={investment.timeSeries.periods}
          showMethodology
        />
      </div>

      {/* Outcome Indicators */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Outcomes
        </p>
        <IndicatorTable
          indicators={investment.outcomes}
          periods={investment.timeSeries.periods}
          showMethodology
        />
      </div>

      {/* SDG Badges */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          SDG Alignment
        </p>
        <div className="flex flex-wrap gap-1.5">
          {investment.sdgAlignment.map((sdg) => (
            <span
              key={sdg}
              className="brand-badge brand-badge-blue"
              title={SDG_NAMES[sdg]}
            >
              SDG {sdg}
            </span>
          ))}
        </div>
      </div>

      {/* Scorecard Mini */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Performance Scores
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(investment.scores) as [string, number][]).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: n <= value ? scoreColor(value) : "var(--card-border)",
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] capitalize" style={{ color: "var(--text-secondary)" }}>
                {key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
