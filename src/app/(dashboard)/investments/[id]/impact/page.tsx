"use client";

import { useMemo } from "react";
import { useInvestment } from "@/contexts/InvestmentContext";
import { formatCompact } from "@/lib/chartTheme";
import Card from "@/components/ui/Card";
import KpiCard from "@/components/cards/KpiCard";
import ChartContainer from "@/components/ui/ChartContainer";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import IndicatorSection from "@/components/tables/IndicatorSection";
import GenderBreakdownChart from "@/components/charts/GenderBreakdownChart";
import { useInteractiveLegend } from "@/hooks/useInteractiveLegend";
import {
  Users,
  Home,
  Briefcase,
  Leaf,
  Heart,
  Info,
} from "lucide-react";

const SDG_NAMES: Record<number, string> = {
  1: "No Poverty", 2: "Zero Hunger", 3: "Good Health & Well-Being",
  4: "Quality Education", 5: "Gender Equality", 6: "Clean Water & Sanitation",
  7: "Affordable & Clean Energy", 8: "Decent Work & Economic Growth",
  9: "Industry, Innovation & Infrastructure", 10: "Reduced Inequalities",
  11: "Sustainable Cities & Communities", 12: "Responsible Consumption & Production",
  13: "Climate Action", 14: "Life Below Water", 15: "Life on Land",
  16: "Peace, Justice & Strong Institutions", 17: "Partnerships for the Goals",
};

export default function InvestmentImpactPage() {
  const { investment, portfolioAvg } = useInvestment();
  const ts = investment.timeSeries;
  const lastIdx = ts.periods.length - 1;
  const prevIdx = Math.max(0, lastIdx - 1);
  const periods = ts.periods;
  const reportingSpan = `${periods[0]} \u2013 ${periods[periods.length - 1]}`;

  const regionLegend = useInteractiveLegend();
  const jobsLegend = useInteractiveLegend();

  /* Look up end-of-lifecycle targets from output/outcome indicators */
  const allIndicators = [...investment.outputs, ...investment.outcomes];
  const findTarget = (keyword: string) =>
    allIndicators.find((ind) => ind.label.toLowerCase().includes(keyword))?.target ?? undefined;
  const peopleTarget = findTarget("people reached") ?? findTarget("clients served") ?? findTarget("individuals");
  const jobsTarget = findTarget("jobs created") ?? findTarget("jobs");

  const peopleData = useMemo(
    () => ts.periods.map((period, i) => ({ period, value: ts.peopleReached[i] })),
    [ts]
  );
  const jobsData = useMemo(
    () => ts.periods.map((period, i) => ({ period, value: ts.jobsCreated[i] })),
    [ts]
  );
  const primaryData = useMemo(
    () => ts.periods.map((period, i) => ({ period, value: ts.primaryOutcome.values[i] })),
    [ts]
  );
  const secondaryData = useMemo(
    () => ts.periods.map((period, i) => ({ period, value: ts.secondaryOutcome.values[i] })),
    [ts]
  );

  const impactCards = [
    {
      icon: Users,
      label: "People Reached",
      value: formatCompact(investment.peopleReached),
      color: "var(--color-accent)",
      current: ts.peopleReached[lastIdx],
      previous: ts.peopleReached[prevIdx],
      raw: investment.peopleReached,
      avgRaw: portfolioAvg.avgPeopleReached,
      definition: investment.peopleReachedDefinition,
    },
    {
      icon: Home,
      label: "Households Reached",
      value: formatCompact(investment.householdsReached),
      color: "#034BE4",
      current: 0,
      previous: 0,
      raw: investment.householdsReached,
      avgRaw: portfolioAvg.avgHouseholdsReached,
      definition: investment.householdsReachedDefinition,
    },
    {
      icon: Briefcase,
      label: "Jobs Created",
      value: investment.jobsCreated.toLocaleString(),
      color: "#428BF9",
      current: ts.jobsCreated[lastIdx],
      previous: ts.jobsCreated[prevIdx],
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
            current: 0,
            previous: 0,
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
      current: 0,
      previous: 0,
      raw: investment.womenBeneficiaryPct,
      avgRaw: null as number | null,
      definition: null as string | null,
    },
  ];

  /* Disaggregation data */
  const disagg = investment.disaggregation;
  const peopleByRegion = disagg.peopleReached.byRegion;
  const jobsByType = disagg.jobsCreated.byType;

  /* Table views for time series charts */
  const makeTimeSeriesTable = (data: { period: string; value: number }[], label: string) => (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Period</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>{label}</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Change</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => {
            const prev = i > 0 ? data[i - 1].value : 0;
            const change = prev > 0 ? Math.round(((d.value - prev) / prev) * 100) : 0;
            return (
              <tr key={d.period} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td className="py-1.5 px-2" style={{ color: "var(--text-primary)" }}>{d.period}</td>
                <td className="py-1.5 px-2 text-right font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {d.value.toLocaleString()}
                </td>
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

  /* Table views for disaggregation */
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
              <td className="py-1.5 px-2 text-right" style={{ color: "var(--text-secondary)" }}>{Math.round((r.female / (r.female + r.male)) * 100)}%</td>
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
              <td className="py-1.5 px-2 text-right" style={{ color: "var(--text-secondary)" }}>{Math.round((t.female / (t.female + t.male)) * 100)}%</td>
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
          {" "}&middot; {periods.length} semi-annual reporting periods &middot; Targets are 3-year fund lifecycle goals
        </span>
      </div>

      {/* Impact KPI Cards */}
      <div className={`grid gap-4 ${impactCards.length >= 5 ? "grid-cols-2 lg:grid-cols-5" : impactCards.length === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-3"}`}>
        {impactCards.map((card) => {
          const trendPct =
            card.current > 0 && card.previous > 0
              ? Math.round(((card.current - card.previous) / card.previous) * 100)
              : 0;
          return (
            <KpiCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              color={card.color}
              tooltip={card.definition || undefined}
              trend={trendPct !== 0 ? { pct: trendPct, label: "vs prior period" } : undefined}
              comparison={
                card.avgRaw !== null
                  ? { value: card.raw, avgValue: card.avgRaw }
                  : undefined
              }
            />
          );
        })}
      </div>

      {/* Primary & Secondary Outcome Time Series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title={ts.primaryOutcome.label}
          subtitle={`Tracked across ${periods.length} periods (${reportingSpan})`}
          csvData={primaryData.map((d) => ({ Period: d.period, Value: d.value }))}
          csvFilename={`${investment.id}-primary-outcome`}
          tableView={makeTimeSeriesTable(primaryData, `${ts.primaryOutcome.label} (${ts.primaryOutcome.unit})`)}
        >
          <TimeSeriesChart
            data={primaryData}
            color="#FF9705"
            gradientId="primaryGrad"
            formatValue={(v) => formatCompact(v)}
            target={ts.primaryOutcome.target}
            targetLabel="Target"
          />
        </ChartContainer>

        <ChartContainer
          title={ts.secondaryOutcome.label}
          subtitle={`Tracked across ${periods.length} periods (${reportingSpan})`}
          csvData={secondaryData.map((d) => ({ Period: d.period, Value: d.value }))}
          csvFilename={`${investment.id}-secondary-outcome`}
          tableView={makeTimeSeriesTable(secondaryData, `${ts.secondaryOutcome.label} (${ts.secondaryOutcome.unit})`)}
        >
          <TimeSeriesChart
            data={secondaryData}
            color="#034BE4"
            gradientId="secondaryGrad"
            formatValue={(v) => formatCompact(v)}
            target={ts.secondaryOutcome.target}
            targetLabel="Target"
          />
        </ChartContainer>
      </div>

      {/* People & Jobs Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="People Reached Over Time"
          subtitle={`Cumulative beneficiaries per reporting period (${reportingSpan})`}
          csvData={peopleData.map((d) => ({ Period: d.period, People: d.value }))}
          csvFilename={`${investment.id}-people`}
          tableView={makeTimeSeriesTable(peopleData, "People Reached")}
        >
          <TimeSeriesChart
            data={peopleData}
            color="#034BE4"
            gradientId="peopleGrad"
            formatValue={(v) => formatCompact(v)}
            height={220}
            target={peopleTarget ?? undefined}
            targetLabel="Target"
          />
        </ChartContainer>

        <ChartContainer
          title="Jobs Created Over Time"
          subtitle={`Cumulative jobs per reporting period (${reportingSpan})`}
          csvData={jobsData.map((d) => ({ Period: d.period, Jobs: d.value }))}
          csvFilename={`${investment.id}-jobs`}
          tableView={makeTimeSeriesTable(jobsData, "Jobs Created")}
        >
          <TimeSeriesChart
            data={jobsData}
            color="#428BF9"
            gradientId="jobsGrad"
            formatValue={(v) => v.toLocaleString()}
            height={220}
            target={jobsTarget ?? undefined}
            targetLabel="Target"
          />
        </ChartContainer>
      </div>

      {/* Disaggregation Charts — Interactive legends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="People Reached by Region & Sex"
          subtitle={`${investment.womenBeneficiaryPct}% women beneficiaries across ${investment.country}`}
          csvData={peopleByRegion.map((r) => ({
            Region: r.name,
            Female: r.female,
            Male: r.male,
            Total: r.female + r.male,
          }))}
          csvFilename={`${investment.id}-people-by-region-sex`}
          height={160}
          tableView={regionTableView}
        >
          <GenderBreakdownChart data={peopleByRegion} legendInstance={regionLegend} />
        </ChartContainer>

        <ChartContainer
          title="Jobs Created by Type & Sex"
          subtitle="Direct employment by role and gender"
          csvData={jobsByType.map((t) => ({
            "Job Type": t.name,
            Female: t.female,
            Male: t.male,
            Total: t.female + t.male,
          }))}
          csvFilename={`${investment.id}-jobs-by-type-sex`}
          height={160}
          tableView={jobsTableView}
        >
          <GenderBreakdownChart data={jobsByType} legendInstance={jobsLegend} yAxisWidth={160} />
        </ChartContainer>
      </div>

      {/* Output Indicators — with period selector */}
      <IndicatorSection
        title="Output Indicators"
        subtitle={`Direct deliverables and activities \u2014 3-year targets (${reportingSpan})`}
        indicators={investment.outputs}
        periods={periods}
        csvFilename={`${investment.id}-outputs`}
        showMethodology
      />

      {/* Outcome Indicators — with period selector */}
      <IndicatorSection
        title="Outcome Indicators"
        subtitle={`Behavioral and social change results \u2014 3-year targets (${reportingSpan})`}
        indicators={investment.outcomes}
        periods={periods}
        csvFilename={`${investment.id}-outcomes`}
        showMethodology
      />

      {/* SDG Alignment Detail */}
      <Card>
        <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          SDG Alignment
        </p>
        <div className="flex flex-wrap gap-2">
          {investment.sdgAlignment.map((sdg) => (
            <div
              key={sdg}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--card-border)",
              }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "var(--color-accent)" }}
              >
                {sdg}
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                {SDG_NAMES[sdg] || `SDG ${sdg}`}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
