"use client";

import { useMemo } from "react";
import { useInvestment } from "@/contexts/InvestmentContext";
import {
  computeMoic,
  computeDpi,
  computeRvpi,
  computeUnrealizedGain,
  computeHoldingPeriod,
} from "@/lib/dataAggregation";
import {
  formatCurrency,
  formatPct,
  formatMoic,
  formatCompact,
  CHART_THEME,
} from "@/lib/chartTheme";
import Card from "@/components/ui/Card";
import KpiCard from "@/components/cards/KpiCard";
import ChartContainer from "@/components/ui/ChartContainer";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import CustomTooltip from "@/components/charts/CustomTooltip";
import { KPI_DEFINITIONS } from "@/lib/kpiDefinitions";
import {
  DollarSign,
  BarChart3,
  Percent,
  Layers,
  ArrowDownToLine,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useInteractiveLegend } from "@/hooks/useInteractiveLegend";

export default function InvestmentFinancialsPage() {
  const { investment, portfolioAvg } = useInvestment();
  const compLegend = useInteractiveLegend();
  const ts = investment.timeSeries;

  const moic = computeMoic(investment);
  const dpi = computeDpi(investment);
  const rvpi = computeRvpi(investment);
  const unrealized = computeUnrealizedGain(investment);
  const holding = computeHoldingPeriod(investment);

  const revenueData = useMemo(
    () => ts.periods.map((period, i) => ({ period, value: ts.revenue[i] })),
    [ts]
  );
  const valuationData = useMemo(
    () => ts.periods.map((period, i) => ({ period, value: ts.valuation[i] })),
    [ts]
  );

  // Period-over-period table data
  const periodTableData = useMemo(() => {
    const metrics = ["Revenue ($K)", "Valuation ($K)", "People Reached", "Jobs Created"];
    const series = [ts.revenue, ts.valuation, ts.peopleReached, ts.jobsCreated];
    return metrics.map((metric, mi) => {
      const row: Record<string, string | number> = { Metric: metric };
      ts.periods.forEach((p, pi) => {
        row[p] = series[mi][pi];
      });
      return row;
    });
  }, [ts]);

  // Comparison bar data
  const comparisonData = useMemo(
    () => [
      { metric: "IRR (%)", investment: investment.irr, portfolio: portfolioAvg.avgIrr },
      { metric: "MOIC", investment: moic, portfolio: portfolioAvg.avgMoic },
      { metric: "DPI", investment: dpi, portfolio: portfolioAvg.avgDpi },
      { metric: "RVPI", investment: rvpi, portfolio: portfolioAvg.avgRvpi },
    ],
    [investment, moic, dpi, rvpi, portfolioAvg]
  );

  const kpis = [
    { icon: DollarSign, label: "Capital Called", value: formatCurrency(investment.capitalCalled, true), color: "var(--color-accent)", raw: investment.capitalCalled, avgRaw: null as number | null, format: "number" as const },
    { icon: BarChart3, label: "Valuation", value: formatCurrency(investment.currentValuation, true), color: "#3DD29D", raw: investment.currentValuation, avgRaw: null as number | null, format: "number" as const },
    { icon: Percent, label: "IRR", value: formatPct(investment.irr), color: "#FF9705", raw: investment.irr, avgRaw: portfolioAvg.avgIrr, format: "pct" as const },
    { icon: Layers, label: "MOIC", value: formatMoic(moic), color: "#428BF9", raw: moic, avgRaw: portfolioAvg.avgMoic, format: "moic" as const },
    { icon: ArrowDownToLine, label: "DPI", value: `${dpi.toFixed(2)}x`, color: "#034BE4", raw: dpi, avgRaw: portfolioAvg.avgDpi, format: "moic" as const },
  ];

  const kpis2 = [
    { icon: ArrowUpRight, label: "RVPI", value: `${rvpi.toFixed(2)}x`, color: "#E05297", raw: rvpi, avgRaw: portfolioAvg.avgRvpi, format: "moic" as const },
    { icon: TrendingUp, label: "Unrealized Gain", value: formatCurrency(unrealized, true), color: unrealized >= 0 ? "#3DD29D" : "#FF5005", raw: null as number | null, avgRaw: null as number | null, format: "number" as const },
    { icon: TrendingUp, label: "Revenue Growth", value: `${investment.revenueGrowth}%`, color: "#FF9705", raw: investment.revenueGrowth, avgRaw: portfolioAvg.avgRevenueGrowth, format: "pct" as const },
    { icon: DollarSign, label: "Distributions", value: formatCurrency(investment.distributions, true), color: "#034BE4", raw: null as number | null, avgRaw: null as number | null, format: "number" as const },
    { icon: Calendar, label: "Holding Period", value: `${holding}y`, color: "var(--text-secondary)", raw: null as number | null, avgRaw: null as number | null, format: "number" as const },
  ];

  const periods = ts.periods;
  const reportingSpan = `${periods[0]} – ${periods[periods.length - 1]}`;

  return (
    <div className="space-y-6">
      {/* Reporting Period Banner */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--card-border)",
          color: "var(--text-secondary)",
        }}
      >
        <Info size={14} className="shrink-0" style={{ color: "var(--color-accent)" }} />
        <span>
          <strong style={{ color: "var(--text-primary)" }}>Reporting period: {reportingSpan}</strong>
          {" "}&middot; {periods.length} semi-annual reporting periods &middot; Financial data as of {periods[periods.length - 1]}
        </span>
      </div>

      {/* Financial KPIs Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            color={kpi.color}
            tooltip={KPI_DEFINITIONS[kpi.label]}
            comparison={
              kpi.avgRaw !== null && kpi.raw !== null
                ? { value: kpi.raw, avgValue: kpi.avgRaw, format: kpi.format }
                : undefined
            }
          />
        ))}
      </div>

      {/* Financial KPIs Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis2.map((kpi) => (
          <KpiCard
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            color={kpi.color}
            tooltip={KPI_DEFINITIONS[kpi.label]}
            comparison={
              kpi.avgRaw !== null && kpi.raw !== null
                ? { value: kpi.raw, avgValue: kpi.avgRaw, format: kpi.format }
                : undefined
            }
          />
        ))}
      </div>

      {/* Revenue & Valuation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Revenue Trend"
          subtitle="Revenue ($K) across reporting periods"
          csvData={revenueData.map((d) => ({ Period: d.period, "Revenue ($K)": d.value }))}
          csvFilename={`${investment.id}-revenue`}
          tableView={
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <th className="text-left py-2 font-semibold" style={{ color: "var(--text-secondary)" }}>Period</th>
                  <th className="text-right py-2 font-semibold" style={{ color: "var(--text-secondary)" }}>Revenue ($K)</th>
                  <th className="text-right py-2 font-semibold" style={{ color: "var(--text-secondary)" }}>Change</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map((d, i) => {
                  const prev = i > 0 ? revenueData[i - 1].value : 0;
                  const change = prev > 0 ? Math.round(((d.value - prev) / prev) * 100) : 0;
                  return (
                    <tr key={d.period} style={{ borderBottom: "1px solid var(--card-border)" }}>
                      <td className="py-2" style={{ color: "var(--text-primary)" }}>{d.period}</td>
                      <td className="py-2 text-right font-medium" style={{ color: "var(--text-primary)" }}>${d.value.toLocaleString()}</td>
                      <td className="py-2 text-right font-medium" style={{ color: i === 0 ? "var(--text-tertiary)" : change >= 0 ? "#3DD29D" : "#FF5005" }}>
                        {i === 0 ? "—" : `${change >= 0 ? "+" : ""}${change}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          }
        >
          <TimeSeriesChart data={revenueData} color="#034BE4" gradientId="finRevGrad" formatValue={(v) => `$${formatCompact(v * 1000)}`} />
        </ChartContainer>

        <ChartContainer
          title="Valuation Timeline"
          subtitle="Fair market value over time"
          csvData={valuationData.map((d) => ({ Period: d.period, "Valuation ($K)": d.value }))}
          csvFilename={`${investment.id}-valuation`}
          tableView={
            <div className="overflow-x-auto h-full">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Period</th>
                    <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Valuation</th>
                    <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {valuationData.map((d, i) => {
                    const prev = i > 0 ? valuationData[i - 1].value : 0;
                    const change = prev > 0 ? Math.round(((d.value - prev) / prev) * 100) : 0;
                    return (
                      <tr key={d.period} style={{ borderBottom: "1px solid var(--card-border)" }}>
                        <td className="py-1.5 px-2" style={{ color: "var(--text-primary)" }}>{d.period}</td>
                        <td className="py-1.5 px-2 text-right font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>${formatCompact(d.value * 1000)}</td>
                        <td className="py-1.5 px-2 text-right font-medium" style={{ color: i === 0 ? "var(--text-tertiary)" : change >= 0 ? "#3DD29D" : "#FF5005" }}>
                          {i === 0 ? "\u2014" : `${change >= 0 ? "+" : ""}${change}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          }
        >
          <TimeSeriesChart
            data={valuationData}
            color="#3DD29D"
            gradientId="finValGrad"
            formatValue={(v) => `$${formatCompact(v * 1000)}`}
            referenceLine={{
              value: investment.capitalCalled / 1000,
              label: `Capital Called: $${formatCompact(investment.capitalCalled)}`,
              color: "#FF9705",
            }}
          />
        </ChartContainer>
      </div>

      {/* Capital Flow Summary */}
      <Card>
        <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Capital Flow Summary</p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {[
            { label: "Capital Called", value: formatCurrency(investment.capitalCalled, true), color: "var(--color-accent)" },
            { label: "→", value: "", color: "var(--text-tertiary)" },
            { label: "Current Valuation", value: formatCurrency(investment.currentValuation, true), color: "#3DD29D" },
            { label: "+", value: "", color: "var(--text-tertiary)" },
            { label: "Distributions", value: formatCurrency(investment.distributions, true), color: "#428BF9" },
            { label: "=", value: "", color: "var(--text-tertiary)" },
            { label: "Total Value", value: formatCurrency(investment.currentValuation + investment.distributions, true), color: "#034BE4" },
          ].map((item, i) =>
            item.value ? (
              <div key={i} className="text-center">
                <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-tertiary)" }}>{item.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: item.color }}>{item.value}</p>
              </div>
            ) : (
              <span key={i} className="text-xl font-bold" style={{ color: item.color }}>{item.label}</span>
            )
          )}
        </div>
      </Card>

      {/* Period-over-Period Table */}
      <ChartContainer
        title="Period-over-Period Data"
        subtitle="Key metrics across all reporting periods"
        csvData={periodTableData}
        csvFilename={`${investment.id}-period-data`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--card-border)" }}>
                <th className="text-left py-2 px-2 font-semibold" style={{ color: "var(--text-secondary)" }}>Metric</th>
                {ts.periods.map((p) => (
                  <th key={p} className="text-right py-2 px-2 font-semibold" style={{ color: "var(--text-secondary)" }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periodTableData.map((row) => (
                <tr key={row.Metric as string} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td className="py-2 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{row.Metric}</td>
                  {ts.periods.map((p) => (
                    <td key={p} className="py-2 px-2 text-right tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {(row[p] as number).toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {/* Comparison to Portfolio */}
      <ChartContainer
        title="vs Portfolio Average"
        subtitle="Key financial metrics compared to fund averages"
        csvData={comparisonData.map((d) => ({
          Metric: d.metric,
          [investment.name]: d.investment,
          "Portfolio Avg": d.portfolio,
        }))}
        csvFilename={`${investment.id}-comparison`}
        tableView={
          <div className="overflow-x-auto h-full">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Metric</th>
                  <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>{investment.name}</th>
                  <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Portfolio Avg</th>
                  <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Difference</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((d) => {
                  const diff = d.investment - d.portfolio;
                  return (
                    <tr key={d.metric} style={{ borderBottom: "1px solid var(--card-border)" }}>
                      <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{d.metric}</td>
                      <td className="py-1.5 px-2 text-right font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{d.investment.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>{d.portfolio.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-medium" style={{ color: diff >= 0 ? "#3DD29D" : "#FF5005" }}>
                        {diff >= 0 ? "+" : ""}{diff.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={comparisonData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} vertical={false} />
            <XAxis dataKey="metric" tick={{ fontSize: 11, fill: CHART_THEME.tickFill }} axisLine={{ stroke: CHART_THEME.axisStroke }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: CHART_THEME.tickFill }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, cursor: "pointer" }}
              onClick={compLegend.handleLegendClick}
              formatter={(value: string) => (
                <span style={{ color: compLegend.isHidden(value) ? "var(--text-tertiary)" : undefined, textDecoration: compLegend.isHidden(value) ? "line-through" : undefined }}>
                  {value}
                </span>
              )}
            />
            {!compLegend.isHidden(investment.name) && (
              <Bar dataKey="investment" name={investment.name} fill="#034BE4" radius={[4, 4, 0, 0]} />
            )}
            {!compLegend.isHidden("Portfolio Avg") && (
              <Bar dataKey="portfolio" name="Portfolio Avg" fill="#B6CDFF" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
