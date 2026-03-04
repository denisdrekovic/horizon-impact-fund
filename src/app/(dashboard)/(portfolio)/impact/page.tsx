"use client";

import { useState, useMemo } from "react";
import { useFilters } from "@/contexts/FilterContext";
import {
  getAllInvestments,
  getInvestmentTimeSeries,
  getPortfolioSummary,
} from "@/lib/dataAggregation";
import { assessProgress } from "@/lib/progressUtils";
import ChartContainer from "@/components/ui/ChartContainer";
import CustomTooltip from "@/components/charts/CustomTooltip";
import Card from "@/components/ui/Card";
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
import { Users, Briefcase, Leaf, Heart } from "lucide-react";
import { CHART_THEME, CHART_COLORS, SECTOR_COLORS, formatCompact, formatCurrency } from "@/lib/chartTheme";
import { useInteractiveLegend } from "@/hooks/useInteractiveLegend";

const SDG_NAMES: Record<number, string> = {
  1: "No Poverty",
  2: "Zero Hunger",
  3: "Good Health",
  4: "Quality Education",
  5: "Gender Equality",
  6: "Clean Water",
  7: "Clean Energy",
  8: "Decent Work",
  9: "Industry & Innovation",
  10: "Reduced Inequalities",
  11: "Sustainable Cities",
  12: "Responsible Consumption",
  13: "Climate Action",
};

const SECTOR_LABELS: Record<string, string> = {
  "clean-energy": "Clean Energy",
  agritech: "AgriTech",
  wash: "Water & Sanitation",
  "financial-inclusion": "Financial Inclusion",
  healthcare: "Healthcare",
  education: "Education",
};

type MetricKey = "peopleReached" | "jobsCreated";

type SortKey = "company" | "type" | "indicator" | "value" | "target" | "pctAchieved";
type SortDir = "asc" | "desc";

export default function ImpactPage() {
  const { filters } = useFilters();
  const allInvestments = useMemo(() => getAllInvestments(), []);
  const portfolio = useMemo(() => getPortfolioSummary(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeMetric, setTimeMetric] = useState<MetricKey>("peopleReached");
  const [sortKey, setSortKey] = useState<SortKey>("company");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [typeFilter, setTypeFilter] = useState<"All" | "Output" | "Outcome">("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  /* ── Apply global filters first ── */
  const investments = useMemo(() => {
    return allInvestments.filter((inv) => {
      if (filters.country && inv.country !== filters.country) return false;
      if (filters.investmentId && inv.id !== filters.investmentId) return false;
      return true;
    });
  }, [allInvestments, filters]);

  const filtered = selectedId
    ? investments.filter((i) => i.id === selectedId)
    : investments;

  const totalLives = filtered.reduce((s, i) => s + i.peopleReached, 0);
  const totalJobs = filtered.reduce((s, i) => s + i.jobsCreated, 0);
  const totalCo2 = filtered.reduce((s, i) => s + (i.co2Avoided || 0), 0);
  const avgWomen = Math.round(
    filtered.reduce((s, i) => s + i.womenBeneficiaryPct, 0) / filtered.length
  );

  /* ── Period-over-period trends for impact KPIs ── */
  const impactTrends = useMemo(() => {
    const lastIdx = filtered[0]?.timeSeries.periods.length - 1 || 0;
    const prevIdx = Math.max(0, lastIdx - 1);
    const pctChange = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100 * 10) / 10 : 0;
    const currLives = filtered.reduce((s, i) => s + (i.timeSeries.peopleReached[lastIdx] ?? 0), 0);
    const prevLives = filtered.reduce((s, i) => s + (i.timeSeries.peopleReached[prevIdx] ?? 0), 0);
    const currJobs = filtered.reduce((s, i) => s + (i.timeSeries.jobsCreated[lastIdx] ?? 0), 0);
    const prevJobs = filtered.reduce((s, i) => s + (i.timeSeries.jobsCreated[prevIdx] ?? 0), 0);
    return {
      livesPct: pctChange(currLives, prevLives),
      jobsPct: pctChange(currJobs, prevJobs),
    };
  }, [filtered]);

  /* ── SDG dot matrix data ── */
  const allSdgs = useMemo(() => {
    const sdgSet = new Set<number>();
    investments.forEach((inv) => inv.sdgAlignment.forEach((s) => sdgSet.add(s)));
    return Array.from(sdgSet).sort((a, b) => a - b);
  }, [investments]);

  /* ── Per-investment gender data — Michelle needs to see each company ── */
  const genderByInvestment = useMemo(() => {
    return filtered.map((inv) => ({
      name: inv.name.length > 12 ? inv.name.slice(0, 12) + "..." : inv.name,
      fullName: inv.name,
      women: inv.womenBeneficiaryPct,
      men: 100 - inv.womenBeneficiaryPct,
    }));
  }, [filtered]);

  /* ── Lives by investment ── */
  const investmentImpact = investments
    .map((inv) => ({
      name: inv.name.length > 12 ? inv.name.slice(0, 12) + "..." : inv.name,
      fullName: inv.name,
      lives: inv.peopleReached,
      sector: inv.sector,
    }))
    .sort((a, b) => b.lives - a.lives);

  /* ── Time series data ── */
  const timeSeriesData = useMemo(
    () => getInvestmentTimeSeries(timeMetric),
    [timeMetric]
  );

  /* ── Output / Outcome summary ── */
  const outputOutcomeRows = useMemo(() => {
    return filtered.flatMap((inv) => {
      const totalPeriods = inv.timeSeries.periods.length;
      return [
        ...inv.outputs.map((o) => {
          const latestVal = o.values ? o.values[o.values.length - 1] : o.value;
          const progress = o.target ? assessProgress(latestVal, o.target, totalPeriods - 1, totalPeriods) : null;
          return {
            company: inv.name,
            type: "Output" as const,
            indicator: o.label,
            value: latestVal,
            unit: o.unit,
            target: o.target,
            pctAchieved: progress ? progress.pctOfTarget : null,
            progressColor: progress ? progress.color : null,
            progressLabel: progress ? progress.label : null,
            period: o.period,
          };
        }),
        ...inv.outcomes.map((o) => {
          const latestVal = o.values ? o.values[o.values.length - 1] : o.value;
          const progress = o.target ? assessProgress(latestVal, o.target, totalPeriods - 1, totalPeriods) : null;
          return {
            company: inv.name,
            type: "Outcome" as const,
            indicator: o.label,
            value: latestVal,
            unit: o.unit,
            target: o.target,
            pctAchieved: progress ? progress.pctOfTarget : null,
            progressColor: progress ? progress.color : null,
            progressLabel: progress ? progress.label : null,
            period: o.period,
          };
        }),
      ];
    });
  }, [filtered]);

  /* ── Sorted output/outcome rows ── */
  const sortedOutputOutcomeRows = useMemo(() => {
    const sorted = [...outputOutcomeRows];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "company":
          cmp = a.company.localeCompare(b.company);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "indicator":
          cmp = a.indicator.localeCompare(b.indicator);
          break;
        case "value":
          cmp = Number(a.value) - Number(b.value);
          break;
        case "target":
          cmp = (a.target ?? 0) as number - ((b.target ?? 0) as number);
          break;
        case "pctAchieved":
          cmp = (a.pctAchieved ?? 0) - (b.pctAchieved ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [outputOutcomeRows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* ── Filtered output/outcome rows ── */
  const filteredOutputOutcomeRows = useMemo(() => {
    return sortedOutputOutcomeRows.filter((row) => {
      if (typeFilter !== "All" && row.type !== typeFilter) return false;
      if (statusFilter !== "All") {
        if (!row.progressLabel) return false;
        const label = row.progressLabel.toLowerCase();
        if (statusFilter === "Ahead" && !label.includes("ahead") && !label.includes("target met")) return false;
        if (statusFilter === "On Track" && label !== "on track") return false;
        if (statusFilter === "Behind" && !label.includes("behind")) return false;
      }
      return true;
    });
  }, [sortedOutputOutcomeRows, typeFilter, statusFilter]);

  const outputOutcomeCsv = filteredOutputOutcomeRows.map((r) => ({
    Company: r.company,
    Type: r.type,
    Indicator: r.indicator,
    Value: r.value,
    Unit: r.unit,
    Target: r.target ?? "",
    "% Achieved": r.pctAchieved ?? "",
    Period: r.period,
  }));

  /* ── Interactive legends ── */
  const impactTimeLegend = useInteractiveLegend();
  const genderLegend = useInteractiveLegend();

  /* ── Table views ── */
  const impactOverTimeTableView = useMemo(() => {
    const periods = timeSeriesData.map((r) => r.period);
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
                {timeSeriesData.map((r) => (
                  <td key={r.period} className="py-1.5 px-2 text-right" style={{ color: "var(--text-primary)" }}>
                    {Number(r[inv.name] ?? 0).toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [timeSeriesData, investments]);

  const sdgTableView = useMemo(
    () => (
      <div className="overflow-x-auto h-full">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Investment</th>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>SDGs</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{inv.name}</td>
                <td className="py-1.5 px-2" style={{ color: "var(--text-secondary)" }}>
                  {inv.sdgAlignment.map((s) => `SDG ${s}`).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    [filtered]
  );

  const genderTableView = useMemo(
    () => (
      <div className="overflow-x-auto h-full">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Company</th>
              <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Women (%)</th>
              <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Men (%)</th>
            </tr>
          </thead>
          <tbody>
            {genderByInvestment.map((d) => (
              <tr key={d.fullName} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{d.fullName}</td>
                <td className="py-1.5 px-2 text-right font-bold" style={{ color: "#FF9705" }}>{d.women}%</td>
                <td className="py-1.5 px-2 text-right" style={{ color: "var(--text-primary)" }}>{d.men}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    [genderByInvestment]
  );

  const peopleReachedTableView = useMemo(
    () => (
      <div className="overflow-x-auto h-full">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Investment</th>
              <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>People Reached</th>
            </tr>
          </thead>
          <tbody>
            {investmentImpact.map((d) => (
              <tr key={d.fullName} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{d.fullName}</td>
                <td className="py-1.5 px-2 text-right" style={{ color: "var(--text-primary)" }}>
                  {d.lives.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    [investmentImpact]
  );

  return (
    <div className="space-y-6">
      <h1
        className="text-xl font-bold font-[var(--font-heading)]"
        style={{ color: "var(--text-primary)" }}
      >
        Impact Metrics
      </h1>

      {/* Investment Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedId(null)}
          className="shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border-2"
          style={
            selectedId === null
              ? {
                  background: "var(--color-accent)",
                  borderColor: "var(--color-accent)",
                  color: "#FFFFFF",
                }
              : {
                  background: "var(--card-bg)",
                  color: "var(--text-primary)",
                  borderColor: "var(--card-border)",
                }
          }
        >
          All Investments
        </button>
        {investments.map((inv) => (
          <button
            key={inv.id}
            onClick={() => setSelectedId(inv.id)}
            className="shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border-2"
            style={
              selectedId === inv.id
                ? {
                    background: SECTOR_COLORS[inv.sector] || "var(--color-accent)",
                    borderColor: SECTOR_COLORS[inv.sector] || "var(--color-accent)",
                    color: "#FFFFFF",
                  }
                : {
                    background: "var(--card-bg)",
                    color: "var(--text-primary)",
                    borderColor: "var(--card-border)",
                  }
            }
          >
            {inv.name}
          </button>
        ))}
      </div>

      {/* Impact KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: "People Reached",
            value: totalLives.toLocaleString(),
            color: "var(--color-accent)",
            trend: impactTrends.livesPct
              ? { pct: impactTrends.livesPct, label: "vs prior period" }
              : undefined,
          },
          {
            icon: Briefcase,
            label: "Jobs Created",
            value: totalJobs.toLocaleString(),
            color: "#3DD29D",
            trend: impactTrends.jobsPct
              ? { pct: impactTrends.jobsPct, label: "vs prior period" }
              : undefined,
          },
          {
            icon: Leaf,
            label: "CO\u2082 Avoided",
            value: `${formatCompact(totalCo2)} tCO2e`,
            color: "#3DD29D",
            trend: undefined as { pct: number; label?: string } | undefined,
          },
          {
            icon: Heart,
            label: "Women Beneficiaries",
            value: `${avgWomen}% avg`,
            color: "#FF9705",
            trend: undefined as { pct: number; label?: string } | undefined,
          },
        ].map((kpi) => (
          <KpiCard
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            color={kpi.color}
            tooltip={KPI_DEFINITIONS[kpi.label]}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Impact Over Time — Multi-Line */}
      <ChartContainer
        title="Impact Over Time"
        subtitle="Semi-annual comparison across investments"
        csvData={timeSeriesData.map((r) => ({
          Period: r.period,
          ...Object.fromEntries(
            Object.entries(r).filter(([k]) => k !== "period")
          ),
        }))}
        csvFilename={`impact-${timeMetric}`}
        height={280}
        tableView={impactOverTimeTableView}
      >
        <div className="h-full flex flex-col">
          {/* Metric Toggle */}
          <div className="flex gap-2 mb-3">
            {(
              [
                { key: "peopleReached", label: "People Reached" },
                { key: "jobsCreated", label: "Jobs Created" },
              ] as { key: MetricKey; label: string }[]
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTimeMetric(opt.key)}
                className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors"
                style={
                  timeMetric === opt.key
                    ? {
                        background: "var(--color-accent)",
                        color: "#FFFFFF",
                      }
                    : {
                        background: "var(--color-surface-2)",
                        color: "var(--text-secondary)",
                      }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeSeriesData}
                margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
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
                  tickFormatter={(v) => formatCompact(v)}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      formatValue={(val) => Number(val).toLocaleString()}
                    />
                  }
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                  onClick={impactTimeLegend.handleLegendClick}
                  formatter={(value: string) => (
                    <span style={{ color: impactTimeLegend.isHidden(value) ? "var(--text-tertiary)" : undefined, textDecoration: impactTimeLegend.isHidden(value) ? "line-through" : undefined }}>
                      {value}
                    </span>
                  )}
                />
                {investments.map((inv, i) =>
                  !impactTimeLegend.isHidden(inv.name) ? (
                    <Line
                      key={inv.id}
                      type="monotone"
                      dataKey={inv.name}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartContainer>

      {/* SDG + Gender Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SDG Dot Matrix — investments as rows, SDGs as columns */}
        <ChartContainer
          title="SDG Alignment by Investment"
          subtitle="Which SDGs each investment contributes to"
          csvData={filtered.map((inv) => {
            const row: Record<string, string | number> = { Investment: inv.name };
            allSdgs.forEach((sdg) => { row[`SDG ${sdg}`] = inv.sdgAlignment.includes(sdg) ? 1 : 0; });
            row["Total"] = inv.sdgAlignment.length;
            return row;
          })}
          csvFilename="sdg-alignment"
          tableView={sdgTableView}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <th
                    className="text-left py-2 px-2 sticky left-0"
                    style={{ color: "var(--text-tertiary)", background: "var(--color-surface-1)" }}
                  >
                    Investment
                  </th>
                  {allSdgs.map((sdg) => (
                    <th
                      key={sdg}
                      className="text-center py-2 px-1"
                      style={{ color: "var(--text-tertiary)", minWidth: 36 }}
                      title={`SDG ${sdg}: ${SDG_NAMES[sdg] || ""}`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[8px] font-bold leading-tight">{sdg}</span>
                        <span className="text-[6px] leading-tight" style={{ maxWidth: 36, overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-tertiary)" }}>
                          {SDG_NAMES[sdg]?.split(" ").slice(0, 2).join(" ") || ""}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-2 px-2" style={{ color: "var(--text-tertiary)" }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td
                      className="py-1.5 px-2 sticky left-0"
                      style={{ color: "var(--text-primary)", background: "var(--color-surface-1)", fontWeight: 500 }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="font-bold text-[11px]">{inv.name}</span>
                      </div>
                    </td>
                    {allSdgs.map((sdg) => {
                      const aligned = inv.sdgAlignment.includes(sdg);
                      return (
                        <td key={sdg} className="text-center py-1.5 px-1">
                          {aligned ? (
                            <div
                              className="w-5 h-5 rounded-md mx-auto flex items-center justify-center"
                              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                              title={`${inv.name} — SDG ${sdg}: ${SDG_NAMES[sdg]}`}
                            >
                              <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>&#10003;</span>
                            </div>
                          ) : (
                            <div
                              className="w-5 h-5 rounded-md mx-auto"
                              style={{ background: "var(--card-border)", opacity: 0.3 }}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center py-1.5 px-2">
                      <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                        {inv.sdgAlignment.length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartContainer>

        {/* Gender Reach — Per Investment (Michelle needs to see each company) */}
        <ChartContainer
          title="Women Beneficiaries by Investment"
          subtitle="% of beneficiaries who are women"
          csvData={genderByInvestment.map((d) => ({
            Company: d.fullName,
            "Women (%)": d.women,
            "Men (%)": d.men,
          }))}
          csvFilename="gender-by-investment"
          height={280}
          tableView={genderTableView}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={genderByInvestment}
                  layout="vertical"
                  margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
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
                    content={
                      <CustomTooltip
                        formatValue={(val) => `${val}%`}
                      />
                    }
                  />
                  {!genderLegend.isHidden("Women") && (
                    <Bar
                      dataKey="women"
                      stackId="gender"
                      fill="#FF9705"
                      name="Women"
                      barSize={16}
                      radius={[0, 0, 0, 0]}
                    />
                  )}
                  {!genderLegend.isHidden("Men") && (
                    <Bar
                      dataKey="men"
                      stackId="gender"
                      fill="#062A74"
                      name="Men"
                      barSize={16}
                      radius={[0, 4, 4, 0]}
                    />
                  )}
                  <Legend
                    wrapperStyle={{
                      fontSize: "10px",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                    onClick={genderLegend.handleLegendClick}
                    formatter={(value: string) => (
                      <span style={{ color: genderLegend.isHidden(value) ? "var(--text-tertiary)" : undefined, textDecoration: genderLegend.isHidden(value) ? "line-through" : undefined }}>
                        {value}
                      </span>
                    )}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p
              className="text-[9px] text-center mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Portfolio average: {avgWomen}% women beneficiaries
            </p>
          </div>
        </ChartContainer>
      </div>

      {/* People Reached by Investment */}
      <ChartContainer
        title="People Reached by Investment"
        csvData={investmentImpact.map((d) => ({
          Company: d.fullName,
          "People Reached": d.lives,
        }))}
        csvFilename="people-reached-by-investment"
        height={220}
        tableView={peopleReachedTableView}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={investmentImpact}
            layout="vertical"
            margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: CHART_THEME.tickFill }}
              tickFormatter={(v) => formatCompact(v)}
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
              content={
                <CustomTooltip
                  formatValue={(val) => Number(val).toLocaleString()}
                />
              }
            />
            <Bar dataKey="lives" radius={[0, 6, 6, 0]} barSize={18}>
              {investmentImpact.map((entry) => (
                <Cell
                  key={entry.fullName}
                  fill={SECTOR_COLORS[entry.sector] || "#062A74"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Output vs Outcome Table */}
      <ChartContainer
        title="Output & Outcome Indicators"
        subtitle="Sector-specific metrics with targets"
        csvData={outputOutcomeCsv}
        csvFilename="output-outcome-indicators"
      >
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-3">
          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Type</span>
            <div className="flex gap-1">
              {(["All", "Output", "Outcome"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setTypeFilter(opt)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors"
                  style={
                    typeFilter === opt
                      ? {
                          background: opt === "Output" ? "var(--color-accent)" : opt === "Outcome" ? "#3DD29D" : "var(--color-accent)",
                          color: "#FFFFFF",
                        }
                      : {
                          background: "var(--color-surface-2)",
                          color: "var(--text-secondary)",
                        }
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Status</span>
            <div className="flex gap-1">
              {["All", "Ahead", "On Track", "Behind"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors"
                  style={
                    statusFilter === opt
                      ? {
                          background: opt === "Ahead" ? "#3DD29D" : opt === "On Track" ? "var(--color-accent)" : opt === "Behind" ? "#FF9705" : "var(--color-accent)",
                          color: "#FFFFFF",
                        }
                      : {
                          background: "var(--color-surface-2)",
                          color: "var(--text-secondary)",
                        }
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Result count */}
          <span className="text-[10px] ml-auto" style={{ color: "var(--text-tertiary)" }}>
            {filteredOutputOutcomeRows.length} of {sortedOutputOutcomeRows.length} indicators
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--card-border)" }}>
                {([
                  { label: "Company", key: "company" as SortKey, align: "text-left" },
                  { label: "Type", key: "type" as SortKey, align: "text-left" },
                  { label: "Indicator", key: "indicator" as SortKey, align: "text-left" },
                  { label: "Value", key: "value" as SortKey, align: "text-right" },
                  { label: "Target", key: "target" as SortKey, align: "text-right" },
                  { label: "% Achieved", key: "pctAchieved" as SortKey, align: "text-right" },
                ]).map((h) => (
                    <th
                      key={h.key}
                      className={`py-2 px-2 ${h.align} cursor-pointer select-none hover:opacity-80 transition-opacity`}
                      style={{ color: "var(--text-tertiary)" }}
                      onClick={() => handleSort(h.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {h.label}
                        {sortKey === h.key && (
                          <span style={{ color: "var(--color-accent)" }}>
                            {sortDir === "asc" ? "\u25B2" : "\u25BC"}
                          </span>
                        )}
                      </span>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredOutputOutcomeRows.map((row, i) => (
                <tr
                  key={`${row.company}-${row.indicator}-${i}`}
                  style={{
                    borderBottom: "1px solid var(--card-border)",
                  }}
                >
                  <td
                    className="py-1.5 px-2 font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {row.company}
                  </td>
                  <td className="py-1.5 px-2">
                    <span
                      className="brand-badge"
                      style={
                        row.type === "Output"
                          ? {
                              background: "var(--color-accent-light)",
                              color: "var(--color-accent)",
                            }
                          : {
                              background: "#3DD29D20",
                              color: "#3DD29D",
                            }
                      }
                    >
                      {row.type}
                    </span>
                  </td>
                  <td
                    className="py-1.5 px-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {row.indicator}
                  </td>
                  <td
                    className="py-1.5 px-2 text-right font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {typeof row.value === "number"
                      ? row.value.toLocaleString()
                      : row.value}{" "}
                    {row.unit}
                  </td>
                  <td
                    className="py-1.5 px-2 text-right"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {row.target
                      ? `${Number(row.target).toLocaleString()} ${row.unit}`
                      : "—"}
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    {row.pctAchieved !== null ? (
                      <span>
                        <span
                          className="font-bold"
                          style={{ color: row.progressColor || "var(--text-secondary)" }}
                        >
                          {row.pctAchieved}%
                        </span>
                        {row.progressLabel && (
                          <span className="block text-[8px]" style={{ color: row.progressColor || "var(--text-tertiary)" }}>
                            {row.progressLabel}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-tertiary)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {/* Sector Impact Cards */}
      <div>
        <h2
          className="text-sm font-bold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Impact by Investment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {investments.map((inv) => {
            const topOutputs = inv.outputs.slice(0, 2);
            const topOutcomes = inv.outcomes.slice(0, 2);
            return (
              <Card key={inv.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="brand-badge"
                    style={{
                      background: `${SECTOR_COLORS[inv.sector]}20`,
                      color: SECTOR_COLORS[inv.sector],
                    }}
                  >
                    {SECTOR_LABELS[inv.sector] || inv.sector}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {inv.name}
                  </span>
                </div>

                {/* Key metrics */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>
                      People Reached
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {inv.peopleReached.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Jobs Created
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {inv.jobsCreated.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Mini sparkline — Primary Outcome (investment-specific) */}
                {(() => {
                  const outcome = inv.timeSeries.primaryOutcome;
                  const startVal = outcome.values[0];
                  const endVal = outcome.values[outcome.values.length - 1];
                  const isPercent = outcome.unit === "%";
                  const fmtVal = (v: number) => isPercent ? `${v}%` : formatCompact(v);
                  // Strip the unit suffix from label for a cleaner title
                  const cleanLabel = outcome.label.replace(/\s*\(.*\)\s*$/, "");
                  return (
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-tertiary)" }}>
                          {cleanLabel}
                        </span>
                        <span className="text-[9px] font-semibold tabular-nums" style={{ color: SECTOR_COLORS[inv.sector] }}>
                          {fmtVal(startVal)} &rarr; {fmtVal(endVal)}
                        </span>
                      </div>
                      <div className="h-10">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={outcome.values.map((v, i) => ({ p: inv.timeSeries.periods[i], v }))}>
                            <defs>
                              <linearGradient id={`spark-${inv.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={SECTOR_COLORS[inv.sector]} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={SECTOR_COLORS[inv.sector]} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="v"
                              stroke={SECTOR_COLORS[inv.sector]}
                              strokeWidth={1.5}
                              fill={`url(#spark-${inv.id})`}
                              dot={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}

                {/* Top indicators */}
                <div className="space-y-1">
                  {[...topOutputs, ...topOutcomes].map((ind) => (
                    <div
                      key={ind.id}
                      className="flex justify-between text-[10px] py-0.5"
                      style={{
                        borderBottom: "1px solid var(--card-border)",
                      }}
                    >
                      <span style={{ color: "var(--text-tertiary)" }}>
                        {ind.label}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {ind.value.toLocaleString()} {ind.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
