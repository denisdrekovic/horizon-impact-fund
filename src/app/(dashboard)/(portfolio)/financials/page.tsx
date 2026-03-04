"use client";

import { useState, useMemo } from "react";
import { useFilters } from "@/contexts/FilterContext";
import {
  getAllInvestments,
  getPortfolioSummary,
  getFinancialRows,
  getInvestmentTimeSeries,
  getInvestmentById,
  computeUnrealizedGain,
} from "@/lib/dataAggregation";
import type { Investment } from "@/types/investment";
import ChartContainer from "@/components/ui/ChartContainer";
import CustomTooltip from "@/components/charts/CustomTooltip";
import WaterfallChart from "@/components/charts/WaterfallChart";
import type { WaterfallItem } from "@/components/charts/WaterfallChart";
import DetailPanel from "@/components/layout/DetailPanel";
import InvestmentDetailCard from "@/components/cards/InvestmentDetailCard";
import KpiCard from "@/components/cards/KpiCard";
import { KPI_DEFINITIONS } from "@/lib/kpiDefinitions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  CHART_THEME,
  CHART_COLORS,
  SECTOR_COLORS,
  formatCurrency,
  formatCompact,
  formatPct,
  formatMoic,
} from "@/lib/chartTheme";
import { useInteractiveLegend } from "@/hooks/useInteractiveLegend";
import {
  DollarSign,
  BarChart3,
  Percent,
  Layers,
  ArrowDownToLine,
} from "lucide-react";

type SortKey =
  | "name"
  | "investmentAmount"
  | "currentValuation"
  | "moic"
  | "irr"
  | "unrealizedGain"
  | "revenueGrowth";

export default function FinancialsPage() {
  const { filters } = useFilters();
  const allInvestments = useMemo(() => getAllInvestments(), []);
  const allPortfolio = useMemo(() => getPortfolioSummary(), []);
  const allRows = useMemo(() => getFinancialRows(), []);
  const [sortKey, setSortKey] = useState<SortKey>("irr");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);

  /* ── Apply global filters ── */
  const investments = useMemo(() => {
    return allInvestments.filter((inv) => {
      if (filters.country && inv.country !== filters.country) return false;
      if (filters.investmentId && inv.id !== filters.investmentId) return false;
      return true;
    });
  }, [allInvestments, filters]);

  const isFiltered = investments.length !== allInvestments.length;

  /* ── Recompute portfolio summary from filtered investments ── */
  const portfolio = useMemo(() => {
    if (!isFiltered) return allPortfolio;
    const totalDeployed = investments.reduce((s, i) => s + i.investmentAmount, 0);
    const totalValuation = investments.reduce((s, i) => s + i.currentValuation, 0);
    const totalDistributions = investments.reduce((s, i) => s + i.distributions, 0);
    const totalCapitalCalled = investments.reduce((s, i) => s + i.capitalCalled, 0);
    const portfolioIRR = totalDeployed > 0
      ? investments.reduce((s, i) => s + i.irr * i.investmentAmount, 0) / totalDeployed
      : 0;
    const avgMoic = totalCapitalCalled > 0
      ? investments.reduce((s, i) => s + (i.currentValuation / Math.max(i.capitalCalled, 1)) * i.capitalCalled, 0) / totalCapitalCalled
      : 0;
    return {
      ...allPortfolio,
      totalDeployed,
      totalValuation,
      totalDistributions,
      totalCapitalCalled,
      portfolioIRR,
      avgMoic,
    };
  }, [investments, allPortfolio, isFiltered]);

  /* ── Filter financial rows ── */
  const rows = useMemo(() => {
    if (!isFiltered) return allRows;
    const ids = new Set(investments.map((i) => i.id));
    return allRows.filter((r) => ids.has(r.investmentId));
  }, [allRows, investments, isFiltered]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string")
        return sortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
  }, [rows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleRowClick = (investmentId: string) => {
    const inv = getInvestmentById(investmentId);
    if (inv) setSelectedInvestment(inv);
  };

  const panelOpen = selectedInvestment !== null;

  /* ── Waterfall Data (proper cumulative money-flow) ── */
  const waterfallData = useMemo((): WaterfallItem[] => {
    const invested = portfolio.totalDeployed;
    const gains = investments.reduce(
      (s, i) => s + computeUnrealizedGain(i),
      0
    );
    const dist = portfolio.totalDistributions;
    const nav = portfolio.totalValuation;

    return [
      { label: "Capital In", value: invested, type: "start" },
      { label: "Unrealized Gains", value: gains, type: gains >= 0 ? "increase" : "decrease" },
      { label: "Distributions", value: dist, type: "increase" },
      { label: "Total Value", value: nav + dist, type: "total" },
    ];
  }, [portfolio, investments]);

  /* ── Capital Timeline Data ── */
  const capitalTimeline = useMemo(() => {
    const periods = investments[0]?.timeSeries.periods || [];
    return periods.map((period, idx) => {
      const valuation = investments.reduce(
        (s, inv) => s + (inv.timeSeries.valuation[idx] ?? 0),
        0
      );
      return { period, valuation };
    });
  }, [investments]);

  /* ── Revenue Trends ── */
  const revenueTrends = useMemo(
    () => getInvestmentTimeSeries("revenue"),
    []
  );

  /* ── IRR by Investment ── */
  const irrData = useMemo(
    () =>
      investments
        .map((inv) => ({
          name:
            inv.name.length > 14
              ? inv.name.slice(0, 14) + "..."
              : inv.name,
          fullName: inv.name,
          irr: inv.irr,
          sector: inv.sector,
        }))
        .sort((a, b) => b.irr - a.irr),
    [investments]
  );

  /* ── Interactive legend for Revenue Trends ── */
  const revenueLegend = useInteractiveLegend();

  /* ── Table views ── */
  const waterfallTableView = useMemo(
    () => (
      <div className="overflow-x-auto h-full">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Category</th>
              <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Value ($)</th>
            </tr>
          </thead>
          <tbody>
            {waterfallData.map((d) => (
              <tr key={d.label} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{d.label}</td>
                <td className="py-1.5 px-2 text-right" style={{ color: d.type === "total" ? "var(--color-accent)" : "var(--text-primary)" }}>
                  {formatCurrency(d.value, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    [waterfallData]
  );

  const capitalTimelineTableView = useMemo(
    () => (
      <div className="overflow-x-auto h-full">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Period</th>
              <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Valuation ($)</th>
            </tr>
          </thead>
          <tbody>
            {capitalTimeline.map((d) => (
              <tr key={d.period} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td className="py-1.5 px-2" style={{ color: "var(--text-primary)" }}>{d.period}</td>
                <td className="py-1.5 px-2 text-right" style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(d.valuation, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    [capitalTimeline]
  );

  const revenueTrendsTableView = useMemo(
    () => {
      const periods = revenueTrends.map((r) => r.period);
      return (
        <div className="overflow-x-auto h-full">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <th className="text-left py-2 px-2 sticky left-0" style={{ color: "var(--text-secondary)", background: "var(--color-surface-1)" }}>Company</th>
                {periods.map((p) => (
                  <th key={p} className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td className="py-1.5 px-2 font-medium sticky left-0" style={{ color: "var(--text-primary)", background: "var(--color-surface-1)" }}>{inv.name}</td>
                  {revenueTrends.map((r) => (
                    <td key={r.period} className="py-1.5 px-2 text-right" style={{ color: "var(--text-primary)" }}>
                      ${(r[inv.name] as number) ?? 0}K
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
    [revenueTrends, investments]
  );

  const irrTableView = useMemo(
    () => (
      <div className="overflow-x-auto h-full">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Company</th>
              <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>IRR (%)</th>
            </tr>
          </thead>
          <tbody>
            {irrData.map((d) => (
              <tr key={d.fullName} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{d.fullName}</td>
                <td className="py-1.5 px-2 text-right font-bold" style={{ color: d.irr >= 15 ? "#3DD29D" : d.irr >= 10 ? "#FF9705" : "#FF5005" }}>
                  {formatPct(d.irr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    [irrData]
  );

  /* ── CSV data ── */
  const returnsCsv = sortedRows.map((r) => ({
    Company: r.name,
    Country: r.country,
    "Invested ($)": r.investmentAmount,
    "Valuation ($)": r.currentValuation,
    "Distributions ($)": r.distributions,
    MOIC: r.moic,
    "IRR (%)": r.irr,
    "Unrealized Gain ($)": r.unrealizedGain,
    "Revenue Growth (%)": r.revenueGrowth,
  }));

  const SortHeader = ({
    label,
    field,
    align = "right",
  }: {
    label: string;
    field: SortKey;
    align?: "left" | "right";
  }) => (
    <th
      className={`py-2.5 px-3 cursor-pointer select-none text-${align}`}
      style={{ color: "var(--text-tertiary)" }}
      onClick={() => handleSort(field)}
    >
      <span className="text-[10px] uppercase tracking-wider font-medium">
        {label}
        {sortKey === field && (
          <span className="ml-1">
            {sortDir === "asc" ? "\u25B2" : "\u25BC"}
          </span>
        )}
      </span>
    </th>
  );

  return (
    <div
      className="space-y-6 transition-[margin] duration-300"
      style={{ marginRight: panelOpen ? 420 : 0 }}
    >
      <h1
        className="text-xl font-bold font-[var(--font-heading)]"
        style={{ color: "var(--text-primary)" }}
      >
        Financials
      </h1>

      {/* Financial KPIs with icons + methodology subtitles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            icon: DollarSign,
            label: "Capital Deployed",
            value: formatCurrency(portfolio.totalDeployed, true),
            subtitle: "Total committed capital drawn down",
            color: "var(--color-accent)",
            trend: undefined as { pct: number } | undefined,
          },
          {
            icon: BarChart3,
            label: "Total Value",
            value: formatCurrency(
              portfolio.totalValuation + portfolio.totalDistributions,
              true
            ),
            subtitle: "NAV + distributions returned to fund",
            color: "#3DD29D",
            trend: portfolio.trends.valuationPct
              ? { pct: portfolio.trends.valuationPct }
              : undefined,
          },
          {
            icon: Percent,
            label: "Portfolio IRR",
            value: formatPct(portfolio.portfolioIRR),
            subtitle: "Internal Rate of Return (weighted)",
            color: "#FF9705",
            trend: undefined as { pct: number } | undefined,
          },
          {
            icon: Layers,
            label: "Avg MOIC",
            value: formatMoic(portfolio.avgMoic),
            subtitle: "Multiple on Invested Capital (weighted)",
            color: "#428BF9",
            trend: undefined as { pct: number } | undefined,
          },
          {
            icon: ArrowDownToLine,
            label: "DPI",
            value: formatMoic(
              portfolio.totalDeployed > 0
                ? portfolio.totalDistributions / portfolio.totalDeployed
                : 0
            ),
            subtitle: "Distributions to Paid-In",
            color: "#062A74",
            trend: undefined as { pct: number } | undefined,
          },
        ].map((kpi) => (
          <KpiCard
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            color={kpi.color}
            variant="hero"
            tooltip={KPI_DEFINITIONS[kpi.label]}
            trend={kpi.trend}
            subtitle={kpi.subtitle}
          />
        ))}
      </div>

      {/* Returns Table */}
      <ChartContainer
        title="Investment Returns"
        subtitle="Click a row to view details"
        csvData={returnsCsv}
        csvFilename="investment-returns"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--card-border)" }}>
                <SortHeader label="Company" field="name" align="left" />
                <th
                  className="py-2.5 px-3 text-left text-[10px] uppercase tracking-wider font-medium"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Country
                </th>
                <SortHeader label="Invested" field="investmentAmount" />
                <SortHeader label="Valuation" field="currentValuation" />
                <SortHeader label="IRR" field="irr" />
                <SortHeader label="MOIC" field="moic" />
                <SortHeader label="Unrealized" field="unrealizedGain" />
                <SortHeader label="Rev Growth" field="revenueGrowth" />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr
                  key={row.investmentId}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid var(--card-border)" }}
                  onClick={() => handleRowClick(row.investmentId)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--color-surface-2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    className="py-2.5 px-3 font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {row.name}
                  </td>
                  <td
                    className="py-2.5 px-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {row.country}
                  </td>
                  <td
                    className="py-2.5 px-3 text-right font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatCurrency(row.investmentAmount, true)}
                  </td>
                  <td
                    className="py-2.5 px-3 text-right font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatCurrency(row.currentValuation, true)}
                  </td>
                  <td
                    className="py-2.5 px-3 text-right font-bold"
                    style={{
                      color:
                        row.irr >= 15
                          ? "#3DD29D"
                          : row.irr >= 10
                          ? "#FF9705"
                          : "#FF5005",
                    }}
                  >
                    {formatPct(row.irr)}
                  </td>
                  <td
                    className="py-2.5 px-3 text-right font-bold"
                    style={{
                      color:
                        row.moic >= 1.5
                          ? "#3DD29D"
                          : row.moic >= 1.2
                          ? "#FF9705"
                          : "#FF5005",
                    }}
                  >
                    {formatMoic(row.moic)}
                  </td>
                  <td
                    className="py-2.5 px-3 text-right font-medium"
                    style={{
                      color: row.unrealizedGain >= 0 ? "#3DD29D" : "#FF5005",
                    }}
                  >
                    {formatCurrency(row.unrealizedGain, true)}
                  </td>
                  <td
                    className="py-2.5 px-3 text-right font-medium"
                    style={{ color: "#3DD29D" }}
                  >
                    +{row.revenueGrowth}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {/* Charts Row: Waterfall + Capital Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer
          title="Valuation Waterfall"
          subtitle="Capital In → Gains → Distributions → Total Value"
          csvData={waterfallData.map((d) => ({
            Category: d.label,
            "Value ($)": d.value,
          }))}
          csvFilename="valuation-waterfall"
          height={280}
          tableView={waterfallTableView}
        >
          <WaterfallChart
            data={waterfallData}
            formatValue={(v) => `$${formatCompact(v)}`}
          />
        </ChartContainer>

        <ChartContainer
          title="Portfolio Valuation Over Time"
          subtitle="Aggregate valuation across 6 periods"
          csvData={capitalTimeline.map((d) => ({
            Period: d.period,
            "Valuation ($)": d.valuation,
          }))}
          csvFilename="capital-timeline"
          height={220}
          tableView={capitalTimelineTableView}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={capitalTimeline}
              margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#034BE4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#034BE4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_THEME.gridStroke}
              />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: CHART_THEME.tickFill }}
                axisLine={{ stroke: CHART_THEME.axisStroke }}
                tickLine={false}
                angle={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: CHART_THEME.tickFill }}
                tickFormatter={(v) => `$${formatCompact(v * 1000)}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    formatValue={(val) => `$${formatCompact(Number(val) * 1000)}`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="valuation"
                stroke="#034BE4"
                strokeWidth={2}
                fill="url(#valGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Revenue Trends + IRR Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer
          title="Revenue Trends ($K)"
          subtitle="Semi-annual, all investments"
          csvData={revenueTrends.map((r) => ({
            Period: r.period,
            ...Object.fromEntries(
              Object.entries(r).filter(([k]) => k !== "period")
            ),
          }))}
          csvFilename="revenue-trends"
          height={220}
          tableView={revenueTrendsTableView}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={revenueTrends}
              margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_THEME.gridStroke}
              />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: CHART_THEME.tickFill }}
                axisLine={{ stroke: CHART_THEME.axisStroke }}
                tickLine={false}
                angle={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: CHART_THEME.tickFill }}
                tickFormatter={(v) => `$${formatCompact(v * 1000)}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip formatValue={(val) => `$${formatCompact(Number(val) * 1000)}`} />}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
                onClick={revenueLegend.handleLegendClick}
                formatter={(value: string) => (
                  <span style={{ color: revenueLegend.isHidden(value) ? "var(--text-tertiary)" : undefined, textDecoration: revenueLegend.isHidden(value) ? "line-through" : undefined }}>
                    {value}
                  </span>
                )}
              />
              {investments.map((inv, i) =>
                !revenueLegend.isHidden(inv.name) ? (
                  <Line
                    key={inv.id}
                    type="monotone"
                    dataKey={inv.name}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="IRR by Investment"
          csvData={irrData.map((d) => ({
            Company: d.fullName,
            "IRR (%)": d.irr,
          }))}
          csvFilename="irr-comparison"
          height={220}
          tableView={irrTableView}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={irrData}
              layout="vertical"
              margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: CHART_THEME.tickFill }}
                tickFormatter={(v) => `${v}%`}
                axisLine={{ stroke: CHART_THEME.axisStroke }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--text-primary)" }}
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip formatValue={(val) => `${val}%`} />}
              />
              <Bar dataKey="irr" radius={[0, 6, 6, 0]} barSize={18}>
                {irrData.map((entry) => (
                  <Cell
                    key={entry.fullName}
                    fill={SECTOR_COLORS[entry.sector] || "#062A74"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Detail Panel */}
      <DetailPanel
        isOpen={panelOpen}
        onClose={() => setSelectedInvestment(null)}
        title={selectedInvestment?.name || ""}
        subtitle={
          selectedInvestment
            ? `${selectedInvestment.country} \u00b7 ${selectedInvestment.sector
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}`
            : ""
        }
      >
        {selectedInvestment && (
          <InvestmentDetailCard investment={selectedInvestment} />
        )}
      </DetailPanel>
    </div>
  );
}
