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
} from "@/lib/chartTheme";
import ChartContainer from "@/components/ui/ChartContainer";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import IndicatorSection from "@/components/tables/IndicatorSection";
import KpiCard from "@/components/cards/KpiCard";
import GenderBreakdownChart from "@/components/charts/GenderBreakdownChart";
import { useInteractiveLegend } from "@/hooks/useInteractiveLegend";
import { KPI_DEFINITIONS } from "@/lib/kpiDefinitions";
import {
  DollarSign,
  BarChart3,
  Percent,
  Layers,
  ArrowDownToLine,
  TrendingUp,
  Users,
  Home,
  Briefcase,
  Leaf,
  Heart,
  Info,
} from "lucide-react";

export default function InvestmentOverviewPage() {
  const { investment, portfolioAvg } = useInvestment();

  const moic = computeMoic(investment);
  const dpi = computeDpi(investment);
  const rvpi = computeRvpi(investment);
  const unrealized = computeUnrealizedGain(investment);
  const holding = computeHoldingPeriod(investment);

  const regionLegend = useInteractiveLegend();
  const jobsLegend = useInteractiveLegend();

  const revenueData = useMemo(
    () =>
      investment.timeSeries.periods.map((period, i) => ({
        period,
        value: investment.timeSeries.revenue[i],
      })),
    [investment]
  );

  const valuationData = useMemo(
    () =>
      investment.timeSeries.periods.map((period, i) => ({
        period,
        value: investment.timeSeries.valuation[i],
      })),
    [investment]
  );

  const kpis = [
    {
      icon: DollarSign,
      label: "Invested",
      value: formatCurrency(investment.investmentAmount, true),
      color: "var(--color-accent)",
      raw: investment.investmentAmount,
      avgRaw: null as number | null,
      format: "number" as const,
    },
    {
      icon: BarChart3,
      label: "Valuation",
      value: formatCurrency(investment.currentValuation, true),
      color: "#3DD29D",
      raw: investment.currentValuation,
      avgRaw: null as number | null,
      format: "number" as const,
    },
    {
      icon: Percent,
      label: "IRR",
      value: formatPct(investment.irr),
      color: "#FF9705",
      raw: investment.irr,
      avgRaw: portfolioAvg.avgIrr,
      format: "pct" as const,
    },
    {
      icon: Layers,
      label: "MOIC",
      value: formatMoic(moic),
      color: "#428BF9",
      raw: moic,
      avgRaw: portfolioAvg.avgMoic,
      format: "moic" as const,
    },
    {
      icon: ArrowDownToLine,
      label: "DPI",
      value: `${dpi.toFixed(2)}x`,
      color: "#034BE4",
      raw: dpi,
      avgRaw: portfolioAvg.avgDpi,
      format: "moic" as const,
    },
    {
      icon: TrendingUp,
      label: "Revenue Growth",
      value: `${investment.revenueGrowth}%`,
      color: "#E05297",
      raw: investment.revenueGrowth,
      avgRaw: portfolioAvg.avgRevenueGrowth,
      format: "pct" as const,
    },
  ];

  const impactCards = [
    {
      icon: Users,
      label: "People Reached",
      value: formatCompact(investment.peopleReached),
      color: "var(--color-accent)",
      raw: investment.peopleReached,
      avgRaw: portfolioAvg.avgPeopleReached,
      definition: investment.peopleReachedDefinition,
    },
    {
      icon: Home,
      label: "Households Reached",
      value: formatCompact(investment.householdsReached),
      color: "#034BE4",
      raw: investment.householdsReached,
      avgRaw: portfolioAvg.avgHouseholdsReached,
      definition: investment.householdsReachedDefinition,
    },
    {
      icon: Briefcase,
      label: "Jobs Created",
      value: investment.jobsCreated.toLocaleString(),
      color: "#428BF9",
      raw: investment.jobsCreated,
      avgRaw: portfolioAvg.avgJobsCreated,
      definition: investment.jobsCreatedDefinition,
    },
    ...(investment.co2Avoided
      ? [
          {
            icon: Leaf,
            label: "CO\u2082 Avoided",
            value: `${formatCompact(investment.co2Avoided)} tCO2e`,
            color: "#3DD29D",
            raw: investment.co2Avoided,
            avgRaw: null as number | null,
            definition: null as string | null,
          },
        ]
      : []),
    {
      icon: Heart,
      label: "Women Beneficiaries",
      value: `${investment.womenBeneficiaryPct}%`,
      color: "#FF9705",
      raw: investment.womenBeneficiaryPct,
      avgRaw: null as number | null,
      definition: null as string | null,
    },
  ];

  /* Disaggregation chart data */
  const disagg = investment.disaggregation;
  const peopleByRegion = disagg.peopleReached.byRegion;
  const jobsByType = disagg.jobsCreated.byType;

  const periods = investment.timeSeries.periods;
  const reportingSpan = `${periods[0]} \u2013 ${periods[periods.length - 1]}`;

  /* Table views for time series charts */
  const revenueTableView = (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Period</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Revenue ($K)</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Change</th>
          </tr>
        </thead>
        <tbody>
          {revenueData.map((d, i) => {
            const prev = i > 0 ? revenueData[i - 1].value : 0;
            const change = prev > 0 ? Math.round(((d.value - prev) / prev) * 100) : 0;
            return (
              <tr key={d.period} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td className="py-1.5 px-2" style={{ color: "var(--text-primary)" }}>{d.period}</td>
                <td className="py-1.5 px-2 text-right font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>${d.value.toLocaleString()}</td>
                <td className="py-1.5 px-2 text-right font-medium" style={{ color: i === 0 ? "var(--text-tertiary)" : change >= 0 ? "#3DD29D" : "#FF5005" }}>
                  {i === 0 ? "\u2014" : `${change >= 0 ? "+" : ""}${change}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const valuationTableView = (
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
  );

  /* Table views for disaggregation charts */
  const regionTableView = (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Region</th>
            <th className="text-right py-2 px-2" style={{ color: "#E05297" }}>Female</th>
            <th className="text-right py-2 px-2" style={{ color: "#428BF9" }}>Male</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Total</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>% Female</th>
          </tr>
        </thead>
        <tbody>
          {peopleByRegion.map((r) => (
            <tr key={r.name} style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{r.name}</td>
              <td className="py-1.5 px-2 text-right tabular-nums" style={{ color: "var(--text-primary)" }}>{r.female.toLocaleString()}</td>
              <td className="py-1.5 px-2 text-right tabular-nums" style={{ color: "var(--text-primary)" }}>{r.male.toLocaleString()}</td>
              <td className="py-1.5 px-2 text-right tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>{(r.female + r.male).toLocaleString()}</td>
              <td className="py-1.5 px-2 text-right" style={{ color: "var(--text-secondary)" }}>
                {Math.round((r.female / (r.female + r.male)) * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const jobsTableView = (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Job Type</th>
            <th className="text-right py-2 px-2" style={{ color: "#E05297" }}>Female</th>
            <th className="text-right py-2 px-2" style={{ color: "#428BF9" }}>Male</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Total</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>% Female</th>
          </tr>
        </thead>
        <tbody>
          {jobsByType.map((t) => (
            <tr key={t.name} style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{t.name}</td>
              <td className="py-1.5 px-2 text-right tabular-nums" style={{ color: "var(--text-primary)" }}>{t.female.toLocaleString()}</td>
              <td className="py-1.5 px-2 text-right tabular-nums" style={{ color: "var(--text-primary)" }}>{t.male.toLocaleString()}</td>
              <td className="py-1.5 px-2 text-right tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>{(t.female + t.male).toLocaleString()}</td>
              <td className="py-1.5 px-2 text-right" style={{ color: "var(--text-secondary)" }}>
                {Math.round((t.female / (t.female + t.male)) * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
          {" "}&middot; {periods.length} semi-annual reporting periods &middot; Targets are 3-year fund lifecycle goals &middot; Latest data as of {periods[periods.length - 1]}
        </span>
      </div>

      {/* Financial Hero KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            color={kpi.color}
            variant="hero"
            tooltip={KPI_DEFINITIONS[kpi.label]}
            comparison={
              kpi.avgRaw !== null
                ? { value: kpi.raw, avgValue: kpi.avgRaw, format: kpi.format }
                : undefined
            }
          />
        ))}
      </div>

      {/* Holding period note */}
      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        Holding period: {holding} years &middot; RVPI: {rvpi.toFixed(2)}x &middot;
        Unrealized gain: {formatCurrency(unrealized, true)} &middot;
        Distributions: {formatCurrency(investment.distributions, true)}
      </p>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Revenue Trend"
          subtitle={`Revenue ($K) across ${periods.length} reporting periods (${reportingSpan})`}
          csvData={revenueData.map((d) => ({
            Period: d.period,
            "Revenue ($K)": d.value,
          }))}
          csvFilename={`${investment.id}-revenue`}
          tableView={revenueTableView}
        >
          <TimeSeriesChart
            data={revenueData}
            color="#034BE4"
            gradientId="revGrad"
            formatValue={(v) => `$${formatCompact(v * 1000)}`}
            yAxisLabel="Revenue ($K)"
          />
        </ChartContainer>

        <ChartContainer
          title="Valuation Over Time"
          subtitle={`Fair market value across ${periods.length} reporting periods (${reportingSpan})`}
          csvData={valuationData.map((d) => ({
            Period: d.period,
            "Valuation ($K)": d.value,
          }))}
          csvFilename={`${investment.id}-valuation`}
          tableView={valuationTableView}
        >
          <TimeSeriesChart
            data={valuationData}
            color="#3DD29D"
            gradientId="valGrad"
            formatValue={(v) => `$${formatCompact(v * 1000)}`}
            yAxisLabel="Valuation"
            referenceLine={{
              value: investment.capitalCalled / 1000,
              label: `Capital Called: $${formatCompact(investment.capitalCalled)}`,
              color: "#FF9705",
            }}
          />
        </ChartContainer>
      </div>

      {/* Impact Summary Cards */}
      <div className={`grid gap-4 ${impactCards.length >= 5 ? "grid-cols-2 lg:grid-cols-5" : impactCards.length === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-3"}`}>
        {impactCards.map((card) => (
          <KpiCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            color={card.color}
            tooltip={card.definition || undefined}
            comparison={
              card.avgRaw !== null
                ? { value: card.raw, avgValue: card.avgRaw }
                : undefined
            }
          />
        ))}
      </div>

      {/* Disaggregation — Stacked Bars with interactive legends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="People Reached by Region & Sex"
          subtitle={`Sub-national distribution across ${investment.country} (${investment.womenBeneficiaryPct}% women)`}
          csvData={peopleByRegion.map((r) => ({
            Region: r.name,
            Female: r.female,
            Male: r.male,
            Total: r.female + r.male,
          }))}
          csvFilename={`${investment.id}-people-by-region-sex`}
          height={180}
          tableView={regionTableView}
        >
          <GenderBreakdownChart data={peopleByRegion} legendInstance={regionLegend} />
        </ChartContainer>

        <ChartContainer
          title="Jobs Created by Type & Sex"
          subtitle="Direct employment breakdown by role and gender"
          csvData={jobsByType.map((t) => ({
            "Job Type": t.name,
            Female: t.female,
            Male: t.male,
            Total: t.female + t.male,
          }))}
          csvFilename={`${investment.id}-jobs-by-type-sex`}
          height={180}
          tableView={jobsTableView}
        >
          <GenderBreakdownChart data={jobsByType} legendInstance={jobsLegend} yAxisWidth={130} />
        </ChartContainer>
      </div>

      {/* Output Indicators — with period selector */}
      <IndicatorSection
        title="Output Indicators"
        subtitle={`Direct deliverables and activities \u2014 targets are 3-year goals (${reportingSpan})`}
        indicators={investment.outputs}
        periods={periods}
        csvFilename={`${investment.id}-outputs`}
        showMethodology
      />

      {/* Outcome Indicators — with period selector */}
      <IndicatorSection
        title="Outcome Indicators"
        subtitle={`Behavioral and social change results \u2014 targets are 3-year goals (${reportingSpan})`}
        indicators={investment.outcomes}
        periods={periods}
        csvFilename={`${investment.id}-outcomes`}
        showMethodology
      />
    </div>
  );
}
