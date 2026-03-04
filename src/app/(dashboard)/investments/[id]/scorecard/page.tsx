"use client";

import { useMemo, useState } from "react";
import { useInvestment } from "@/contexts/InvestmentContext";
import { computeOverallScore } from "@/lib/dataAggregation";
import { CHART_THEME, STATUS_COLORS } from "@/lib/chartTheme";
import Card from "@/components/ui/Card";
import ChartContainer from "@/components/ui/ChartContainer";
import MetricComparisonBadge from "@/components/ui/MetricComparisonBadge";
import CustomTooltip from "@/components/charts/CustomTooltip";
import { useInteractiveLegend } from "@/hooks/useInteractiveLegend";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Shield, Target, Activity, Leaf, Info, ChevronDown, X, BookOpen } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  outperforming: "Outperforming",
  "on-track": "On Track",
  "needs-attention": "Needs Attention",
};

const DIMENSION_META = [
  { key: "financial" as const, label: "Financial", icon: Target, description: "Returns (IRR, MOIC), revenue growth, capital efficiency", avgKey: "avgFinancial" as const },
  { key: "impact" as const, label: "Impact", icon: Activity, description: "Lives reached, jobs created, outcome achievement", avgKey: "avgImpact" as const },
  { key: "operational" as const, label: "Operational", icon: Shield, description: "Team capacity, governance, reporting quality", avgKey: "avgOperational" as const },
  { key: "esg" as const, label: "ESG", icon: Leaf, description: "Environmental, social, governance compliance", avgKey: "avgEsg" as const },
];

const SCORING_METHODOLOGY: Record<string, { criteria: string[]; sources: string; frequency: string }> = {
  financial: {
    criteria: [
      "1 — IRR below 0%; MOIC below 0.8x; revenue declining; significant capital impairment",
      "2 — IRR 0–8%; MOIC 0.8–1.0x; revenue flat or single-digit growth; DPI near zero",
      "3 — IRR 8–15%; MOIC 1.0–1.5x; revenue growing 15–30% YoY; DPI beginning",
      "4 — IRR 15–25%; MOIC 1.5–2.5x; revenue growing 30–50% YoY; meaningful distributions",
      "5 — IRR above 25%; MOIC above 2.5x; revenue growing 50%+ YoY; strong distributions",
    ],
    sources: "Audited financial statements, quarterly management accounts, fund administrator reports",
    frequency: "Assessed semi-annually based on trailing 12-month financials",
  },
  impact: {
    criteria: [
      "1 — Less than 25% of target lives reached; no measurable outcomes; minimal beneficiary data",
      "2 — 25–50% of target reached; some outcome data but below expectations; limited disaggregation",
      "3 — 50–75% of target reached; outcomes meeting milestones; adequate disaggregation by sex/region",
      "4 — 75–100% of target reached; outcomes exceeding milestones; strong evidence of attribution",
      "5 — Target exceeded; transformative outcomes demonstrated; rigorous impact evaluation completed",
    ],
    sources: "Investee M&E systems, third-party evaluations, beneficiary surveys, IRIS+ aligned indicators",
    frequency: "Assessed semi-annually using latest reporting period data against cumulative targets",
  },
  operational: {
    criteria: [
      "1 — Weak management team; no governance structures; missed reporting deadlines; no risk management",
      "2 — Incomplete team; basic governance only; irregular reporting; reactive risk management",
      "3 — Competent team; functioning board; on-time reporting; documented risk framework",
      "4 — Strong experienced team; active independent board; proactive reporting with insights; robust risk management",
      "5 — Exceptional leadership; best-in-class governance; exemplary transparency; systematic risk mitigation",
    ],
    sources: "Board meeting minutes, management reports, operational due diligence, site visits",
    frequency: "Assessed semi-annually with annual deep-dive operational review",
  },
  esg: {
    criteria: [
      "1 — No ESG policy; material environmental/social violations; no safeguards in place",
      "2 — Basic ESG policy exists but not implemented; some gaps in safeguards; no monitoring",
      "3 — ESG policy implemented; compliance with IFC Performance Standards; regular monitoring",
      "4 — Proactive ESG management; exceeds compliance requirements; annual ESG audits; stakeholder engagement",
      "5 — ESG leadership; certified standards (B Corp, ISO 14001); measurable positive externalities; industry benchmark",
    ],
    sources: "ESG questionnaires, IFC PS gap analysis, environmental audits, social assessments, grievance mechanism logs",
    frequency: "Assessed semi-annually with annual third-party ESG audit",
  },
};

/* ─── Scoring Methodology Modal ─── */

function ScoringMethodologyModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--card-border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: "var(--color-accent)" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Scoring Methodology
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                How each dimension is scored on a 1–5 scale
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Overall formula */}
          <div
            className="px-4 py-3 rounded-xl"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--card-border)" }}
          >
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
              Overall Score Formula
            </p>
            <p className="text-xs font-mono font-bold" style={{ color: "var(--text-primary)" }}>
              Overall = Financial × 0.25 + Impact × 0.30 + Operational × 0.25 + ESG × 0.20
            </p>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
              Weights reflect the fund&apos;s dual mandate: impact outcomes are weighted highest (30%), with financial performance and operational quality equally weighted (25% each), and ESG compliance at 20%.
            </p>
          </div>

          {DIMENSION_META.map((dim) => {
            const method = SCORING_METHODOLOGY[dim.key];
            const Icon = dim.icon;
            return (
              <div key={dim.key}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} style={{ color: "var(--color-accent)" }} />
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {dim.label}
                  </p>
                </div>
                <p className="text-[10px] mb-2" style={{ color: "var(--text-tertiary)" }}>
                  {dim.description}
                </p>
                <div className="space-y-1.5">
                  {method.criteria.map((c, i) => {
                    const score = i + 1;
                    return (
                      <div
                        key={score}
                        className="flex gap-2 px-3 py-1.5 rounded-lg text-[11px]"
                        style={{ background: "var(--color-surface-2)" }}
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: scoreColor(score) }}
                        >
                          {score}
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>{c.replace(/^\d\s*—\s*/, "")}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-6 mt-2 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  <span><strong>Sources:</strong> {method.sources}</span>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  <strong>Frequency:</strong> {method.frequency}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const SDG_NAMES: Record<number, string> = {
  1: "No Poverty", 2: "Zero Hunger", 3: "Good Health & Well-Being",
  4: "Quality Education", 5: "Gender Equality", 6: "Clean Water & Sanitation",
  7: "Affordable & Clean Energy", 8: "Decent Work & Economic Growth",
  9: "Industry, Innovation & Infrastructure", 10: "Reduced Inequalities",
  11: "Sustainable Cities & Communities", 12: "Responsible Consumption & Production",
  13: "Climate Action", 14: "Life Below Water", 15: "Life on Land",
  16: "Peace, Justice & Strong Institutions", 17: "Partnerships for the Goals",
};

function scoreColor(score: number): string {
  if (score >= 4) return "#3DD29D";
  if (score >= 3) return "#FF9705";
  return "#FF5005";
}

export default function InvestmentScorecardPage() {
  const { investment, portfolioAvg } = useInvestment();
  const overall = computeOverallScore(investment.scores);
  const statusColor = STATUS_COLORS[investment.status] || "#428BF9";
  const barLegend = useInteractiveLegend();
  const [showMethodology, setShowMethodology] = useState(false);

  const radarData = useMemo(
    () => [
      { dimension: "Financial", investment: investment.scores.financial, portfolio: portfolioAvg.avgFinancial },
      { dimension: "Impact", investment: investment.scores.impact, portfolio: portfolioAvg.avgImpact },
      { dimension: "Operational", investment: investment.scores.operational, portfolio: portfolioAvg.avgOperational },
      { dimension: "ESG", investment: investment.scores.esg, portfolio: portfolioAvg.avgEsg },
    ],
    [investment, portfolioAvg]
  );

  const comparisonBarData = useMemo(
    () => DIMENSION_META.map((dim) => ({
      dimension: dim.label,
      investment: investment.scores[dim.key],
      portfolio: portfolioAvg[dim.avgKey],
    })),
    [investment, portfolioAvg]
  );

  /* Table views */
  const radarTableView = (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Dimension</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>{investment.name}</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Portfolio Avg</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Difference</th>
          </tr>
        </thead>
        <tbody>
          {radarData.map((d) => {
            const diff = d.investment - d.portfolio;
            return (
              <tr key={d.dimension} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{d.dimension}</td>
                <td className="py-1.5 px-2 text-right font-bold" style={{ color: scoreColor(d.investment) }}>{d.investment.toFixed(1)}</td>
                <td className="py-1.5 px-2 text-right" style={{ color: "var(--text-secondary)" }}>{d.portfolio.toFixed(1)}</td>
                <td className="py-1.5 px-2 text-right font-medium" style={{ color: diff >= 0 ? "#3DD29D" : "#FF5005" }}>
                  {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const comparisonTableView = (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Dimension</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>{investment.name}</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Portfolio Avg</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Difference</th>
          </tr>
        </thead>
        <tbody>
          {comparisonBarData.map((d) => {
            const diff = d.investment - d.portfolio;
            return (
              <tr key={d.dimension} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{d.dimension}</td>
                <td className="py-1.5 px-2 text-right font-bold" style={{ color: "var(--text-primary)" }}>{d.investment.toFixed(1)}</td>
                <td className="py-1.5 px-2 text-right" style={{ color: "var(--text-secondary)" }}>{d.portfolio.toFixed(1)}</td>
                <td className="py-1.5 px-2 text-right font-medium" style={{ color: diff >= 0 ? "#3DD29D" : "#FF5005" }}>
                  {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                </td>
              </tr>
            );
          })}
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
          <strong style={{ color: "var(--text-primary)" }}>Reporting period: H1 2023 – H2 2025</strong>
          {" "}&middot; 6 semi-annual reporting periods &middot; Scores as of H2 2025
        </span>
      </div>

      {/* Overall Score Hero */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-tertiary)" }}>
              Overall Score
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold" style={{ color: scoreColor(overall) }}>
                {overall.toFixed(1)}
              </span>
              <span className="text-lg font-medium" style={{ color: "var(--text-tertiary)" }}>/ 5.0</span>
            </div>
            <MetricComparisonBadge value={overall} avgValue={portfolioAvg.avgOverall} format="pct" />
            <p className="text-[10px] mt-2" style={{ color: "var(--text-tertiary)" }}>
              Weighted: Financial 25% + Impact 30% + Operational 25% + ESG 20%
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMethodology(true)}
              className="flex items-center gap-1.5 text-[10px] font-semibold px-3 py-2 rounded-lg transition-colors"
              style={{
                color: "var(--color-accent)",
                background: "var(--color-accent)10",
                border: "1px solid var(--color-accent)30",
              }}
            >
              <BookOpen size={12} />
              Methodology
            </button>
            <span
              className="text-xs font-bold px-4 py-2 rounded-full"
              style={{ background: `${statusColor}18`, color: statusColor }}
            >
              {STATUS_LABELS[investment.status] || investment.status}
            </span>
          </div>
        </div>
      </Card>

      {/* Radar Chart + Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Performance Radar"
          subtitle="Investment vs portfolio average (1-5 scale)"
          csvData={radarData.map((d) => ({
            Dimension: d.dimension,
            Investment: d.investment,
            "Portfolio Avg": d.portfolio,
          }))}
          csvFilename={`${investment.id}-radar`}
          tableView={radarTableView}
        >
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--card-border)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
              />
              <Radar
                dataKey="investment"
                name={investment.name}
                stroke="var(--color-accent)"
                fill="var(--color-accent)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Radar
                dataKey="portfolio"
                name="Portfolio Avg"
                stroke="#B6CDFF"
                fill="#B6CDFF"
                fillOpacity={0.1}
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Score Breakdown */}
        <Card>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Score Breakdown
          </p>
          <div className="space-y-5">
            {DIMENSION_META.map((dim) => {
              const score = investment.scores[dim.key];
              const avg = portfolioAvg[dim.avgKey];
              const Icon = dim.icon;

              return (
                <div key={dim.key}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <Icon size={16} style={{ color: scoreColor(score) }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {dim.label}
                    </span>
                    <span className="text-sm font-bold ml-auto" style={{ color: scoreColor(score) }}>
                      {score.toFixed(1)}
                    </span>
                  </div>

                  {/* Score dots */}
                  <div className="flex items-center gap-3 ml-7">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className="w-3 h-3 rounded-full"
                          style={{
                            background: n <= score ? scoreColor(score) : "var(--color-surface-3)",
                          }}
                        />
                      ))}
                    </div>
                    <MetricComparisonBadge value={score} avgValue={avg} format="pct" />
                  </div>

                  <p className="text-[10px] mt-1 ml-7" style={{ color: "var(--text-tertiary)" }}>
                    {dim.description}
                  </p>
                  {/* Current score criteria */}
                  <p className="text-[10px] mt-0.5 ml-7 italic" style={{ color: "var(--text-tertiary)" }}>
                    {SCORING_METHODOLOGY[dim.key].criteria[Math.max(0, Math.round(score) - 1)]?.replace(/^\d\s*—\s*/, "")}
                  </p>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowMethodology(true)}
            className="flex items-center gap-1 text-[10px] font-medium mt-4 px-3 py-1.5 rounded-lg transition-colors"
            style={{
              color: "var(--color-accent)",
              background: "var(--color-accent)10",
              border: "1px solid var(--color-accent)30",
            }}
          >
            <BookOpen size={11} />
            View Full Scoring Methodology
          </button>
        </Card>
      </div>

      {/* Score Comparison Bar Chart — interactive legend */}
      <ChartContainer
        title="Dimension Comparison"
        subtitle="Investment scores vs portfolio averages"
        csvData={comparisonBarData.map((d) => ({
          Dimension: d.dimension,
          [investment.name]: d.investment,
          "Portfolio Avg": d.portfolio,
        }))}
        csvFilename={`${investment.id}-score-comparison`}
        tableView={comparisonTableView}
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={comparisonBarData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} vertical={false} />
            <XAxis dataKey="dimension" tick={{ fontSize: 11, fill: CHART_THEME.tickFill }} axisLine={{ stroke: CHART_THEME.axisStroke }} tickLine={false} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: CHART_THEME.tickFill }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, cursor: "pointer" }}
              onClick={barLegend.handleLegendClick}
              formatter={(value: string) => (
                <span style={{ color: barLegend.isHidden(value) ? "var(--text-tertiary)" : undefined, textDecoration: barLegend.isHidden(value) ? "line-through" : undefined }}>
                  {value}
                </span>
              )}
            />
            {!barLegend.isHidden(investment.name) && (
              <Bar dataKey="investment" name={investment.name} fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            )}
            {!barLegend.isHidden("Portfolio Avg") && (
              <Bar dataKey="portfolio" name="Portfolio Avg" fill="#B6CDFF" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* SDG Alignment */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            SDG Alignment
          </p>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {investment.sdgAlignment.length} SDGs aligned
          </span>
        </div>
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
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: "var(--color-accent)" }}
              >
                {sdg}
              </span>
              <span className="text-xs" style={{ color: "var(--text-primary)" }}>
                {SDG_NAMES[sdg] || `SDG ${sdg}`}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Scoring Methodology Modal */}
      {showMethodology && (
        <ScoringMethodologyModal onClose={() => setShowMethodology(false)} />
      )}
    </div>
  );
}
