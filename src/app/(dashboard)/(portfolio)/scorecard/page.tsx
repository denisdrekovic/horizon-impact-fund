"use client";

import React, { useState, useMemo } from "react";
import { useFilters } from "@/contexts/FilterContext";
import {
  getScorecardRows,
  getAllInvestments,
  computeOverallScore,
  getInvestmentById,
} from "@/lib/dataAggregation";
import type { Investment, ScorecardRow } from "@/types/investment";
import ChartContainer from "@/components/ui/ChartContainer";
import DetailPanel from "@/components/layout/DetailPanel";
import InvestmentDetailCard from "@/components/cards/InvestmentDetailCard";
import Card from "@/components/ui/Card";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import CustomTooltip from "@/components/charts/CustomTooltip";
import { CHART_THEME, CHART_COLORS, SECTOR_COLORS, formatCompact } from "@/lib/chartTheme";
import { Download, ChevronDown, ChevronUp } from "lucide-react";

function scoreColor(score: number): string {
  if (score >= 4) return "#3DD29D";
  if (score >= 3) return "#FF9705";
  return "#FF5005";
}

function scoreBgColor(score: number): string {
  if (score >= 4) return "#3DD29D20";
  if (score >= 3) return "#FF970520";
  return "#FF500520";
}

const SDG_NAMES: Record<number, string> = {
  1: "No Poverty", 2: "Zero Hunger", 3: "Good Health", 4: "Quality Education",
  5: "Gender Equality", 6: "Clean Water", 7: "Clean Energy", 8: "Decent Work",
  9: "Industry & Innovation", 10: "Reduced Inequalities", 11: "Sustainable Cities",
  12: "Responsible Consumption", 13: "Climate Action",
};

export default function ScorecardPage() {
  const { filters } = useFilters();
  const allRows = useMemo(
    () => getScorecardRows().sort((a, b) => b.overall - a.overall),
    []
  );
  const allInvestments = useMemo(() => getAllInvestments(), []);

  /* ── Apply global filters ── */
  const investments = useMemo(() => {
    return allInvestments.filter((inv) => {
      if (filters.country && inv.country !== filters.country) return false;
      if (filters.investmentId && inv.id !== filters.investmentId) return false;
      return true;
    });
  }, [allInvestments, filters]);

  const rows = useMemo(() => {
    const ids = new Set(investments.map((i) => i.id));
    return allRows.filter((r) => ids.has(r.investmentId));
  }, [allRows, investments]);

  /* Auto-expand top-scoring investment */
  const [expandedRow, setExpandedRow] = useState<string | null>(allRows[0]?.investmentId ?? null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  /* Pre-select best vs worst overall score for comparison */
  const [compareIds, setCompareIds] = useState<[string, string] | null>(() => {
    const sorted = getScorecardRows().sort((a, b) => b.overall - a.overall);
    if (sorted.length >= 2) {
      return [sorted[0].investmentId, sorted[sorted.length - 1].investmentId];
    }
    return null;
  });

  const panelOpen = selectedInvestment !== null;

  /* ── Fund Dimension Averages ── */
  const dimAverages = useMemo(() => {
    const dims = [
      { key: "financial" as const, label: "Financial", desc: "IRR, MOIC & Revenue" },
      { key: "impact" as const, label: "Impact", desc: "Lives, Jobs & SDGs" },
      { key: "operational" as const, label: "Operational", desc: "Management & Governance" },
      { key: "esg" as const, label: "ESG", desc: "Env, Social & Gov" },
    ];
    return dims.map((d) => ({
      dimension: d.label,
      description: d.desc,
      avg:
        Math.round(
          (rows.reduce((s, r) => s + r[d.key], 0) / rows.length) * 10
        ) / 10,
    }));
  }, [rows]);

  /* ── SDG Heatmap Data ── */
  const allSdgs = useMemo(() => {
    const sdgSet = new Set<number>();
    investments.forEach((inv) => inv.sdgAlignment.forEach((s) => sdgSet.add(s)));
    return Array.from(sdgSet).sort((a, b) => a - b);
  }, [investments]);

  /* ── CSV export ── */
  const csvData = rows.map((r) => ({
    Company: r.name,
    Country: r.country,
    Sector: r.sector,
    Status: r.status,
    Financial: r.financial,
    Impact: r.impact,
    Operational: r.operational,
    ESG: r.esg,
    Overall: r.overall,
  }));

  /* ── Comparison data ── */
  const comparisonData = useMemo(() => {
    if (!compareIds) return null;
    const [id1, id2] = compareIds;
    const inv1 = getInvestmentById(id1);
    const inv2 = getInvestmentById(id2);
    if (!inv1 || !inv2) return null;

    const dims = ["financial", "impact", "operational", "esg"] as const;
    return dims.map((d) => ({
      dimension: d.charAt(0).toUpperCase() + d.slice(1),
      [inv1.name]: inv1.scores[d],
      [inv2.name]: inv2.scores[d],
    }));
  }, [compareIds]);

  /* ── Table view for Investment Comparison ── */
  const comparisonTableView = useMemo(() => {
    if (!comparisonData || !compareIds) return null;
    const inv1 = getInvestmentById(compareIds[0]);
    const inv2 = getInvestmentById(compareIds[1]);
    if (!inv1 || !inv2) return null;
    return (
      <div className="overflow-x-auto h-full">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Dimension</th>
              <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>{inv1.name}</th>
              <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>{inv2.name}</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row) => (
              <tr key={row.dimension} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{row.dimension}</td>
                <td className="py-1.5 px-2 text-right font-bold" style={{ color: scoreColor(row[inv1.name] as number) }}>
                  {row[inv1.name]}
                </td>
                <td className="py-1.5 px-2 text-right font-bold" style={{ color: scoreColor(row[inv2.name] as number) }}>
                  {row[inv2.name]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [comparisonData, compareIds]);

  /* ── CSV for Investment Comparison ── */
  const comparisonCsv = useMemo(() => {
    if (!comparisonData || !compareIds) return undefined;
    const inv1 = getInvestmentById(compareIds[0]);
    const inv2 = getInvestmentById(compareIds[1]);
    if (!inv1 || !inv2) return undefined;
    return comparisonData.map((row) => ({
      Dimension: row.dimension,
      [inv1.name]: row[inv1.name] as number,
      [inv2.name]: row[inv2.name] as number,
    }));
  }, [comparisonData, compareIds]);

  /* ── CSV for SDG Alignment ── */
  const sdgCsv = useMemo(() => {
    return investments.map((inv) => {
      const row: Record<string, string | number> = {
        Investment: inv.name,
        Country: inv.country,
      };
      allSdgs.forEach((sdg) => {
        row[`SDG ${sdg}`] = inv.sdgAlignment.includes(sdg) ? 1 : 0;
      });
      return row;
    });
  }, [investments, allSdgs]);

  /* ── Table view for SDG Alignment ── */
  const sdgTableView = useMemo(() => (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-[10px]">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th
              className="text-left py-2 px-2 sticky left-0"
              style={{ color: "var(--text-secondary)", background: "var(--color-surface-1)" }}
            >
              Investment
            </th>
            {allSdgs.map((sdg) => (
              <th
                key={sdg}
                className="text-center py-2 px-1.5"
                style={{ color: "var(--text-secondary)" }}
                title={SDG_NAMES[sdg]}
              >
                {sdg}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {investments.map((inv) => (
            <tr key={inv.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td
                className="py-2 px-2 font-medium sticky left-0"
                style={{ color: "var(--text-primary)", background: "var(--color-surface-1)" }}
              >
                {inv.name}
              </td>
              {allSdgs.map((sdg) => (
                <td
                  key={sdg}
                  className="text-center py-2 px-1.5"
                  style={{ color: inv.sdgAlignment.includes(sdg) ? "#3DD29D" : "var(--card-border)" }}
                >
                  {inv.sdgAlignment.includes(sdg) ? "\u2713" : "\u2014"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ), [investments, allSdgs]);

  return (
    <div
      className="space-y-6 transition-[margin] duration-300"
      style={{ marginRight: panelOpen ? 420 : 0 }}
    >
      <h1
        className="text-xl font-bold font-[var(--font-heading)]"
        style={{ color: "var(--text-primary)" }}
      >
        Scorecard
      </h1>

      {/* Fund Health Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dimAverages.map((dim) => (
          <Card key={dim.dimension}>
            <p
              className="text-[10px] uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              Avg {dim.dimension}
            </p>
            <p
              className="text-[9px] mt-0.5"
              style={{ color: "var(--text-tertiary)", opacity: 0.7 }}
            >
              {dim.description}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <p
                className="text-2xl font-bold"
                style={{ color: scoreColor(dim.avg) }}
              >
                {dim.avg}
              </p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="w-3 h-3 rounded-full"
                    style={{
                      background:
                        n <= Math.round(dim.avg)
                          ? scoreColor(dim.avg)
                          : "var(--card-border)",
                    }}
                  />
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Scorecard Table */}
      <ChartContainer
        title="Performance Scorecard"
        subtitle="Traffic light scoring (1-5 scale)"
        csvData={csvData}
        csvFilename="horizon-scorecard"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "4%" }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--card-border)" }}>
                <th className="py-3 px-3 text-left" style={{ color: "var(--text-tertiary)" }}>
                  <span className="text-[10px] uppercase tracking-wider font-medium">Company</span>
                </th>
                <th className="py-3 px-3 text-left" style={{ color: "var(--text-tertiary)" }}>
                  <span className="text-[10px] uppercase tracking-wider font-medium">Country</span>
                </th>
                {[
                  { label: "Financial", desc: "IRR, MOIC & Revenue" },
                  { label: "Impact", desc: "Lives, Jobs & SDGs" },
                  { label: "Operational", desc: "Mgmt & Governance" },
                  { label: "ESG", desc: "Env, Social & Gov" },
                  { label: "Overall", desc: "Weighted Avg" },
                ].map((col) => (
                  <th
                    key={col.label}
                    className="py-2 px-2 text-center"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] uppercase tracking-wider font-medium">
                        {col.label}
                      </span>
                      <span className="text-[8px] font-normal" style={{ color: "var(--text-tertiary)", opacity: 0.7 }}>
                        {col.desc}
                      </span>
                    </div>
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isExpanded = expandedRow === row.investmentId;
                const inv = getInvestmentById(row.investmentId);
                return (
                  <React.Fragment key={row.investmentId}>
                    {/* Main data row */}
                    <tr
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: isExpanded ? "none" : "1px solid var(--card-border)" }}
                      onClick={() => setExpandedRow(isExpanded ? null : row.investmentId)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="py-3 px-3 font-semibold" style={{ color: "var(--text-primary)" }}>
                        {row.name}
                      </td>
                      <td className="py-3 px-3" style={{ color: "var(--text-secondary)" }}>
                        {row.country}
                      </td>
                      {(["financial", "impact", "operational", "esg"] as const).map((dim) => (
                        <td key={dim} className="py-3 px-2 text-center">
                          <span
                            className="inline-block w-8 py-1 rounded-md text-[11px] font-bold"
                            style={{ background: scoreBgColor(row[dim]), color: scoreColor(row[dim]) }}
                          >
                            {row[dim]}
                          </span>
                        </td>
                      ))}
                      <td className="py-3 px-2 text-center">
                        <span
                          className="inline-block w-10 py-1 rounded-md text-[11px] font-bold"
                          style={{ background: scoreBgColor(row.overall), color: scoreColor(row.overall) }}
                        >
                          {row.overall.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-1 text-center">
                        {isExpanded ? (
                          <ChevronUp size={14} style={{ color: "var(--text-tertiary)" }} />
                        ) : (
                          <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && inv && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <div
                            className="px-4 pb-4 pt-2"
                            style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--card-border)" }}
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart
                                    data={[
                                      { dim: "Financial", value: inv.scores.financial },
                                      { dim: "Impact", value: inv.scores.impact },
                                      { dim: "Operational", value: inv.scores.operational },
                                      { dim: "ESG", value: inv.scores.esg },
                                    ]}
                                  >
                                    <PolarGrid stroke="var(--card-border)" />
                                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9, fill: "var(--text-tertiary)" }} />
                                    <Radar dataKey="value" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.25} strokeWidth={2} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="space-y-3">
                                {([
                                  { key: "financial" as const, label: "Financial Performance", desc: "Returns (IRR, MOIC), revenue growth, capital efficiency" },
                                  { key: "impact" as const, label: "Impact Delivery", desc: "Lives reached, jobs created, SDG alignment, beneficiary outcomes" },
                                  { key: "operational" as const, label: "Operational Quality", desc: "Management team, governance, reporting, milestone delivery" },
                                  { key: "esg" as const, label: "ESG Practices", desc: "Environmental stewardship, social safeguards, governance standards" },
                                ]).map(({ key: dim, label, desc }) => (
                                  <div key={dim} className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <span className="text-xs font-medium block" style={{ color: "var(--text-secondary)" }}>{label}</span>
                                      <span className="text-[9px] block" style={{ color: "var(--text-tertiary)" }}>{desc}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                          <div
                                            key={n}
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ background: n <= inv.scores[dim] ? scoreColor(inv.scores[dim]) : "var(--card-border)" }}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-xs font-bold w-4 text-right" style={{ color: scoreColor(inv.scores[dim]) }}>
                                        {inv.scores[dim]}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                <button
                                  className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                                  style={{ background: "var(--color-accent)", color: "#FFFFFF" }}
                                  onClick={(e) => { e.stopPropagation(); setSelectedInvestment(inv); }}
                                >
                                  View Full Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {/* Score Legend */}
      <div
        className="flex items-center gap-4 text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        <span>Score Key:</span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded"
            style={{ background: "#3DD29D" }}
          />
          4-5 Strong
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded"
            style={{ background: "#FF9705" }}
          />
          3 Adequate
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded"
            style={{ background: "#FF5005" }}
          />
          1-2 Needs Improvement
        </div>
      </div>

      {/* Investment Comparison */}
      <ChartContainer
        title="Investment Comparison"
        subtitle="Select 2 investments to compare scores"
        height={260}
        csvData={comparisonCsv}
        csvFilename="investment-comparison"
        tableView={comparisonTableView}
      >
        <div className="h-full flex flex-col">
          <div className="flex gap-2 mb-3 flex-wrap">
            {investments.map((inv, i) => {
              const isSelected = compareIds?.includes(inv.id);
              return (
                <button
                  key={inv.id}
                  onClick={() => {
                    if (!compareIds) {
                      setCompareIds([inv.id, investments[(i + 1) % investments.length].id]);
                    } else if (compareIds[0] === inv.id) {
                      setCompareIds(null);
                    } else {
                      setCompareIds([compareIds[0], inv.id]);
                    }
                  }}
                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors"
                  style={
                    isSelected
                      ? {
                          background: CHART_COLORS[i % CHART_COLORS.length],
                          color: "#FFFFFF",
                        }
                      : {
                          background: "var(--color-surface-2)",
                          color: "var(--text-secondary)",
                        }
                  }
                >
                  {inv.name}
                </button>
              );
            })}
          </div>
          <div className="flex-1">
            {comparisonData && compareIds ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={comparisonData}>
                  <PolarGrid stroke="var(--card-border)" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 5]}
                    tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
                  />
                  {compareIds.map((id, i) => {
                    const inv = getInvestmentById(id);
                    return inv ? (
                      <Radar
                        key={id}
                        dataKey={inv.name}
                        stroke={CHART_COLORS[investments.findIndex((x) => x.id === id) % CHART_COLORS.length]}
                        fill={CHART_COLORS[investments.findIndex((x) => x.id === id) % CHART_COLORS.length]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ) : null;
                  })}
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="flex items-center justify-center h-full text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Select investments above to compare
              </div>
            )}
          </div>
        </div>
      </ChartContainer>

      {/* SDG Alignment Heatmap */}
      <ChartContainer
        title="SDG Alignment"
        subtitle="Investment coverage across Sustainable Development Goals"
        csvData={sdgCsv}
        csvFilename="sdg-alignment"
        tableView={sdgTableView}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <th
                  className="text-left py-2 px-2 sticky left-0"
                  style={{
                    color: "var(--text-tertiary)",
                    background: "var(--color-surface-1)",
                  }}
                >
                  Investment
                </th>
                {allSdgs.map((sdg) => (
                  <th
                    key={sdg}
                    className="text-center py-2 px-1.5"
                    style={{ color: "var(--text-tertiary)" }}
                    title={SDG_NAMES[sdg]}
                  >
                    {sdg}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr
                  key={inv.id}
                  style={{
                    borderBottom: "1px solid var(--card-border)",
                  }}
                >
                  <td
                    className="py-2 px-2 font-medium sticky left-0"
                    style={{
                      color: "var(--text-primary)",
                      background: "var(--color-surface-1)",
                    }}
                  >
                    {inv.name}
                  </td>
                  {allSdgs.map((sdg) => {
                    const aligned = inv.sdgAlignment.includes(sdg);
                    return (
                      <td key={sdg} className="text-center py-2 px-1.5">
                        {aligned ? (
                          <div
                            className="w-5 h-5 rounded mx-auto"
                            style={{
                              background: "var(--color-accent)",
                              opacity: 0.8,
                            }}
                            title={`${inv.name} — SDG ${sdg}: ${SDG_NAMES[sdg]}`}
                          />
                        ) : (
                          <div
                            className="w-5 h-5 rounded mx-auto"
                            style={{
                              background: "var(--card-border)",
                              opacity: 0.3,
                            }}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

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
