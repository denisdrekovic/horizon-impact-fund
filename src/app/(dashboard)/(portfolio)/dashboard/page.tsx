"use client";

import { useState, useMemo } from "react";
import { useFilters } from "@/contexts/FilterContext";
import {
  getAllInvestments,
  getGeoLocations,
  getPortfolioSummary,
  filterLocations,
  getInvestmentById,
} from "@/lib/dataAggregation";
import type { Investment, GeoLocation } from "@/types/investment";
import HeroStat from "@/components/cards/HeroStat";
import CategoryCard from "@/components/cards/CategoryCard";
import InteractiveMap from "@/components/map/InteractiveMap";
import MapLegend from "@/components/map/MapLegend";
import DetailPanel from "@/components/layout/DetailPanel";
import InvestmentDetailCard from "@/components/cards/InvestmentDetailCard";
import SectorBar from "@/components/charts/SectorBar";
import CountryBar from "@/components/charts/CountryBar";
import ChartContainer from "@/components/ui/ChartContainer";
import { statusToColor } from "@/lib/mapUtils";
import { STATUS_COLORS, SECTOR_COLORS, CATEGORY_LABELS, formatCurrency } from "@/lib/chartTheme";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import CustomTooltip from "@/components/charts/CustomTooltip";

const STATUS_LABELS: Record<string, string> = {
  outperforming: "Outperforming",
  "on-track": "On Track",
  "needs-attention": "Needs Attention",
};

export default function DashboardPage() {
  const { filters } = useFilters();
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);

  const investments = useMemo(() => getAllInvestments(), []);
  const geoLocations = useMemo(() => getGeoLocations(), []);
  const portfolio = useMemo(() => getPortfolioSummary(), []);

  const filteredLocations = useMemo(
    () => filterLocations(geoLocations, filters),
    [geoLocations, filters]
  );

  /* Filtered investments — used for allocation charts, status, categories */
  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      if (filters.country && inv.country !== filters.country) return false;
      if (filters.investmentId && inv.id !== filters.investmentId) return false;
      return true;
    });
  }, [investments, filters]);

  const handleMarkerClick = (loc: GeoLocation) => {
    const inv = getInvestmentById(loc.investmentId);
    if (inv) setSelectedInvestment(inv);
  };

  const handlePillClick = (inv: Investment) => {
    setSelectedInvestment(inv);
  };

  const panelOpen = selectedInvestment !== null;

  /* ── Status Distribution Data ── */
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInvestments.forEach((inv) => {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || "#428BF9",
    }));
  }, [filteredInvestments]);

  /* ── CSV data for charts ── */
  const sectorCsvData = useMemo(
    () =>
      filteredInvestments.map((inv) => ({
        Sector: CATEGORY_LABELS[inv.sectorCategory] || inv.sectorCategory,
        Company: inv.name,
        "Investment ($)": inv.investmentAmount,
      })),
    [filteredInvestments]
  );

  const countryCsvData = useMemo(
    () =>
      filteredInvestments.map((inv) => ({
        Country: inv.country,
        Company: inv.name,
        "Investment ($)": inv.investmentAmount,
      })),
    [filteredInvestments]
  );

  const statusCsvData = useMemo(
    () =>
      statusData.map((d) => ({
        Status: d.name,
        Count: d.value,
      })),
    [statusData]
  );

  /* ── Filtered category cards ── */
  const filteredCategories = useMemo(() => {
    const catMap = new Map<string, { label: string; icon: string; investments: number; totalDeployed: number; statuses: string[] }>();
    const catMeta: Record<string, { label: string; icon: string }> = {
      livelihoods: { label: "Livelihoods", icon: "Briefcase" },
      "essential-services": { label: "Essential Services", icon: "Heart" },
      "climate-energy": { label: "Climate & Energy", icon: "Zap" },
    };
    filteredInvestments.forEach((inv) => {
      const cat = inv.sectorCategory;
      const existing = catMap.get(cat) || { ...catMeta[cat], investments: 0, totalDeployed: 0, statuses: [] as string[] };
      existing.investments += 1;
      existing.totalDeployed += inv.investmentAmount;
      existing.statuses.push(inv.status);
      catMap.set(cat, existing);
    });
    const statusPriority = ["needs-attention", "on-track", "outperforming"];
    return Array.from(catMap.entries()).map(([id, data]) => ({
      id,
      ...data,
      avgStatus: statusPriority.find((s) => data.statuses.includes(s)) || "on-track",
    }));
  }, [filteredInvestments]);

  /* ── Table views for flip cards ── */
  const sectorTableView = (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Company</th>
            <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Sector</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Investment</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvestments.map((inv) => (
            <tr key={inv.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{inv.name}</td>
              <td className="py-1.5 px-2" style={{ color: "var(--text-secondary)" }}>{CATEGORY_LABELS[inv.sectorCategory] || inv.sectorCategory}</td>
              <td className="py-1.5 px-2 text-right font-medium" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(inv.investmentAmount, true)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const countryTableView = (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Country</th>
            <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Company</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Investment</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvestments.map((inv) => (
            <tr key={inv.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td className="py-1.5 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{inv.country}</td>
              <td className="py-1.5 px-2" style={{ color: "var(--text-secondary)" }}>{inv.name}</td>
              <td className="py-1.5 px-2 text-right font-medium" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(inv.investmentAmount, true)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const statusTableView = (
    <div className="overflow-x-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
            <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Status</th>
            <th className="text-right py-2 px-2" style={{ color: "var(--text-secondary)" }}>Investments</th>
          </tr>
        </thead>
        <tbody>
          {statusData.map((d) => (
            <tr key={d.name} style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td className="py-1.5 px-2" style={{ color: "var(--text-primary)" }}>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.color }} />
                  {d.name}
                </span>
              </td>
              <td className="py-1.5 px-2 text-right font-bold" style={{ color: "var(--text-primary)" }}>
                {d.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div
      className="space-y-6 transition-[margin] duration-300"
      style={{ marginRight: panelOpen ? 420 : 0 }}
    >
      {/* Hero Stats */}
      <HeroStat portfolio={portfolio} panelOpen={panelOpen} />

      {/* Map + Investment Cards — Side by Side */}
      <div className="flex gap-4" style={{ height: 380 }}>
        {/* Map — left ~60% */}
        <div
          className="relative rounded-[var(--radius-card-lg)] overflow-hidden flex-[3] min-w-0"
          style={{
            border: "1px solid var(--card-border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <InteractiveMap
            locations={filteredLocations}
            selectedInvestmentId={selectedInvestment?.id || null}
            onMarkerClick={handleMarkerClick}
          />
          <MapLegend />
        </div>

        {/* Investment Summary Cards — right ~40%, scrollable */}
        <div
          className="flex-[2] min-w-0 overflow-y-auto space-y-2 pr-1"
        >
          {investments.map((inv) => {
            const isActive = selectedInvestment?.id === inv.id;
            const color = statusToColor(inv.status);
            const moicVal = inv.capitalCalled > 0
              ? ((inv.currentValuation + inv.distributions) / inv.capitalCalled)
              : 0;
            const valuationPct = inv.investmentAmount > 0
              ? Math.min(100, Math.round((inv.currentValuation / inv.investmentAmount) * 100))
              : 0;

            return (
              <button
                key={inv.id}
                onClick={() => handlePillClick(inv)}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  background: isActive ? `${color}08` : "var(--card-bg)",
                  border: isActive ? `2px solid ${color}` : "1px solid var(--card-border)",
                  boxShadow: isActive ? `0 0 0 1px ${color}40` : "var(--shadow-card)",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                      {inv.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2"
                    style={{ background: `${color}15`, color }}
                  >
                    {inv.status === "outperforming" ? "Outperforming" : inv.status === "on-track" ? "On Track" : "Needs Attention"}
                  </span>
                </div>
                <p className="text-[10px] mb-2" style={{ color: "var(--text-tertiary)" }}>
                  {inv.country} &middot; {CATEGORY_LABELS[inv.sectorCategory] || inv.sectorCategory}
                </p>
                {/* Metrics row */}
                <div className="flex gap-3">
                  {[
                    { label: "Invested", val: formatCurrency(inv.investmentAmount, true) },
                    { label: "Valuation", val: formatCurrency(inv.currentValuation, true) },
                    { label: "IRR", val: `${inv.irr.toFixed(1)}%` },
                    { label: "MOIC", val: `${moicVal.toFixed(2)}x` },
                  ].map((m) => (
                    <div key={m.label} className="min-w-0">
                      <p className="text-[8px] uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-tertiary)" }}>{m.label}</p>
                      <p className="text-[11px] font-bold tabular-nums whitespace-nowrap" style={{ color: "var(--text-primary)" }}>{m.val}</p>
                    </div>
                  ))}
                </div>
                {/* Mini progress bar: invested → valuation */}
                <div className="mt-2">
                  <div className="h-1 rounded-full" style={{ background: "var(--card-border)" }}>
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{
                        width: `${Math.min(valuationPct, 100)}%`,
                        background: valuationPct >= 100
                          ? `linear-gradient(90deg, ${color}, #3DD29D)`
                          : color,
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Allocation Charts — 3 Column with ChartContainer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartContainer
          title="Sector Allocation"
          subtitle="Capital deployed by sector category"
          csvData={sectorCsvData}
          csvFilename="sector-allocation"
          tableView={sectorTableView}
          height={240}
        >
          <SectorBar investments={filteredInvestments} />
        </ChartContainer>

        <ChartContainer
          title="Country Allocation"
          subtitle="Capital deployed by country"
          csvData={countryCsvData}
          csvFilename="country-allocation"
          tableView={countryTableView}
          height={240}
        >
          <CountryBar investments={filteredInvestments} />
        </ChartContainer>

        <ChartContainer
          title="Status Distribution"
          subtitle="Investment performance distribution"
          csvData={statusCsvData}
          csvFilename="status-distribution"
          tableView={statusTableView}
          height={240}
        >
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                  axisLine={{ stroke: "var(--card-border)" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--text-primary)" }}
                  width={110}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      formatValue={(val) => `${val} investment${val !== 1 ? "s" : ""}`}
                    />
                  }
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <CategoryCard
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            investments={cat.investments}
            totalDeployed={cat.totalDeployed}
            avgStatus={cat.avgStatus}
          />
        ))}
      </div>

      {/* Detail Panel */}
      <DetailPanel
        isOpen={panelOpen}
        onClose={() => setSelectedInvestment(null)}
        title={selectedInvestment?.name || ""}
        subtitle={
          selectedInvestment
            ? `${selectedInvestment.country} \u00b7 ${CATEGORY_LABELS[selectedInvestment.sectorCategory] || selectedInvestment.sectorCategory}`
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
