import type {
  Investment,
  GeoLocation,
  PortfolioSummary,
  PortfolioAverages,
  ScorecardRow,
  FinancialRow,
  SectorCategory,
  InvestmentStatus,
} from "@/types/investment";

import solvidaEnergy from "@/data/investments/solvida-energy.json";
import kisantech from "@/data/investments/kisantech.json";
import majiSolutions from "@/data/investments/maji-solutions.json";
import payforward from "@/data/investments/payforward.json";
import umugandaHealth from "@/data/investments/umuganda-health.json";
import skillbridge from "@/data/investments/skillbridge.json";

/* ─── Investment Registry ─── */

const investmentMap = new Map<string, Investment>([
  ["solvida-energy", solvidaEnergy as unknown as Investment],
  ["kisantech", kisantech as unknown as Investment],
  ["maji-solutions", majiSolutions as unknown as Investment],
  ["payforward", payforward as unknown as Investment],
  ["umuganda-health", umugandaHealth as unknown as Investment],
  ["skillbridge", skillbridge as unknown as Investment],
]);

export function getAllInvestments(): Investment[] {
  return Array.from(investmentMap.values());
}

export function getInvestmentById(id: string): Investment | undefined {
  return investmentMap.get(id);
}

/* ─── Derived Financial Metrics ─── */

/** Multiple on Invested Capital = (Valuation + Distributions) / Capital Called */
export function computeMoic(inv: Investment): number {
  if (inv.capitalCalled === 0) return 0;
  return (inv.currentValuation + inv.distributions) / inv.capitalCalled;
}

/** Distributions to Paid-In = Distributions / Capital Called */
export function computeDpi(inv: Investment): number {
  if (inv.capitalCalled === 0) return 0;
  return inv.distributions / inv.capitalCalled;
}

/** Residual Value to Paid-In = Current Valuation / Capital Called */
export function computeRvpi(inv: Investment): number {
  if (inv.capitalCalled === 0) return 0;
  return inv.currentValuation / inv.capitalCalled;
}

/** Unrealized Gain = Current Valuation - Capital Called */
export function computeUnrealizedGain(inv: Investment): number {
  return inv.currentValuation - inv.capitalCalled;
}

/** Holding Period in years from investmentDate to today */
export function computeHoldingPeriod(inv: Investment): number {
  const start = new Date(inv.investmentDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.round((diffMs / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;
}

/** Overall Score = Financial×0.25 + Impact×0.30 + Operational×0.25 + ESG×0.20 */
export function computeOverallScore(scores: Investment["scores"]): number {
  const raw =
    scores.financial * 0.25 +
    scores.impact * 0.3 +
    scores.operational * 0.25 +
    scores.esg * 0.2;
  return Math.round(raw * 10) / 10;
}

/* ─── Geo Locations (derived from investments) ─── */

export function getGeoLocations(): GeoLocation[] {
  return getAllInvestments().map((inv) => ({
    investmentId: inv.id,
    name: inv.name,
    country: inv.country,
    sector: inv.sector,
    sectorCategory: inv.sectorCategory,
    coordinates: inv.coordinates,
    investmentAmount: inv.investmentAmount,
    status: inv.status,
    irr: inv.irr,
    peopleReached: inv.peopleReached,
    currentValuation: inv.currentValuation,
  }));
}

export function filterLocations(
  locations: GeoLocation[],
  filters: { country: string | null; investmentId: string | null }
): GeoLocation[] {
  return locations.filter((loc) => {
    if (filters.country && loc.country !== filters.country) return false;
    if (filters.investmentId && loc.investmentId !== filters.investmentId)
      return false;
    return true;
  });
}

/* ─── Portfolio Summary (computed dynamically) ─── */

const CATEGORY_META: Record<
  SectorCategory,
  { label: string; icon: string }
> = {
  livelihoods: { label: "Livelihoods", icon: "Briefcase" },
  "essential-services": { label: "Essential Services", icon: "Heart" },
  "climate-energy": { label: "Climate & Energy", icon: "Zap" },
};

export function getPortfolioSummary(): PortfolioSummary {
  const investments = getAllInvestments();

  const totalDeployed = investments.reduce(
    (sum, i) => sum + i.investmentAmount,
    0
  );
  const totalValuation = investments.reduce(
    (sum, i) => sum + i.currentValuation,
    0
  );
  const totalDistributions = investments.reduce(
    (sum, i) => sum + i.distributions,
    0
  );
  const totalCapitalCalled = investments.reduce(
    (sum, i) => sum + i.capitalCalled,
    0
  );

  // Weighted average IRR (by investment amount)
  const portfolioIRR =
    totalDeployed > 0
      ? investments.reduce(
          (sum, i) => sum + i.irr * i.investmentAmount,
          0
        ) / totalDeployed
      : 0;

  // Weighted average MOIC (by capital called)
  const avgMoic =
    totalCapitalCalled > 0
      ? investments.reduce(
          (sum, i) => sum + computeMoic(i) * i.capitalCalled,
          0
        ) / totalCapitalCalled
      : 0;

  const totalPeopleReached = investments.reduce(
    (sum, i) => sum + i.peopleReached,
    0
  );
  const totalHouseholdsReached = investments.reduce(
    (sum, i) => sum + i.householdsReached,
    0
  );
  const totalJobsCreated = investments.reduce(
    (sum, i) => sum + i.jobsCreated,
    0
  );
  const totalCo2Avoided = investments.reduce(
    (sum, i) => sum + (i.co2Avoided ?? 0),
    0
  );
  const avgWomenPct =
    investments.length > 0
      ? Math.round(
          investments.reduce((sum, i) => sum + i.womenBeneficiaryPct, 0) /
            investments.length
        )
      : 0;

  const countries = new Set(investments.map((i) => i.country));
  const atRiskCount = investments.filter(
    (i) => i.status === "needs-attention"
  ).length;

  // Categories
  const catGroups = new Map<SectorCategory, Investment[]>();
  for (const inv of investments) {
    const existing = catGroups.get(inv.sectorCategory) || [];
    existing.push(inv);
    catGroups.set(inv.sectorCategory, existing);
  }

  const categories = Array.from(catGroups.entries()).map(([id, invs]) => {
    const meta = CATEGORY_META[id];
    const catDeployed = invs.reduce((s, i) => s + i.investmentAmount, 0);
    const statusPriority: InvestmentStatus[] = [
      "needs-attention",
      "on-track",
      "outperforming",
    ];
    const worstStatus = statusPriority.find((s) =>
      invs.some((i) => i.status === s)
    )!;
    return {
      id,
      label: meta.label,
      icon: meta.icon,
      investments: invs.length,
      totalDeployed: catDeployed,
      avgStatus: worstStatus,
    };
  });

  /* ── Period-over-period trends (last 2 periods in timeSeries) ── */
  const pctChange = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 100 * 10) / 10 : 0;

  const lastIdx = investments[0]?.timeSeries.periods.length - 1 || 0;
  const prevIdx = Math.max(0, lastIdx - 1);

  const currPeople = investments.reduce((s, i) => s + (i.timeSeries.peopleReached[lastIdx] ?? 0), 0);
  const prevPeople = investments.reduce((s, i) => s + (i.timeSeries.peopleReached[prevIdx] ?? 0), 0);
  const currJobs = investments.reduce((s, i) => s + (i.timeSeries.jobsCreated[lastIdx] ?? 0), 0);
  const prevJobs = investments.reduce((s, i) => s + (i.timeSeries.jobsCreated[prevIdx] ?? 0), 0);
  const currVal = investments.reduce((s, i) => s + (i.timeSeries.valuation[lastIdx] ?? 0), 0);
  const prevVal = investments.reduce((s, i) => s + (i.timeSeries.valuation[prevIdx] ?? 0), 0);

  const trends = {
    peopleReachedPct: pctChange(currPeople, prevPeople),
    jobsCreatedPct: pctChange(currJobs, prevJobs),
    valuationPct: pctChange(currVal, prevVal),
    deployedPct: 0, // deployed doesn't change period-over-period
  };

  return {
    totalDeployed,
    totalValuation,
    totalDistributions,
    portfolioIRR: Math.round(portfolioIRR * 10) / 10,
    avgMoic: Math.round(avgMoic * 100) / 100,
    totalInvestments: investments.length,
    totalCountries: countries.size,
    totalPeopleReached,
    totalHouseholdsReached,
    totalJobsCreated,
    totalCo2Avoided,
    avgWomenPct,
    atRiskCount,
    trends,
    categories,
  };
}

/* ─── Scorecard Rows ─── */

export function getScorecardRows(): ScorecardRow[] {
  return getAllInvestments().map((inv) => ({
    investmentId: inv.id,
    name: inv.name,
    country: inv.country,
    sector: inv.sector,
    status: inv.status,
    financial: inv.scores.financial,
    impact: inv.scores.impact,
    operational: inv.scores.operational,
    esg: inv.scores.esg,
    overall: computeOverallScore(inv.scores),
  }));
}

/* ─── Financial Rows ─── */

export function getFinancialRows(): FinancialRow[] {
  return getAllInvestments().map((inv) => ({
    investmentId: inv.id,
    name: inv.name,
    country: inv.country,
    sector: inv.sector,
    stage: inv.stage,
    status: inv.status,
    investmentAmount: inv.investmentAmount,
    capitalCalled: inv.capitalCalled,
    currentValuation: inv.currentValuation,
    distributions: inv.distributions,
    moic: Math.round(computeMoic(inv) * 100) / 100,
    irr: inv.irr,
    unrealizedGain: computeUnrealizedGain(inv),
    revenueGrowth: inv.revenueGrowth,
    investmentDate: inv.investmentDate,
    holdingPeriodYears: computeHoldingPeriod(inv),
  }));
}

/* ─── Time Series Helpers ─── */

export function getTimePeriods(): string[] {
  return ["H1 2023", "H2 2023", "H1 2024", "H2 2024", "H1 2025", "H2 2025"];
}

/** Aggregate time series across all investments for a given metric */
export function getAggregatedTimeSeries(
  metric: "revenue" | "valuation" | "peopleReached" | "jobsCreated"
): { period: string; value: number }[] {
  const periods = getTimePeriods();
  const investments = getAllInvestments();

  return periods.map((period, idx) => ({
    period,
    value: investments.reduce(
      (sum, inv) => sum + (inv.timeSeries[metric][idx] ?? 0),
      0
    ),
  }));
}

/* ─── Portfolio Averages (for individual investment comparison) ─── */

export function getPortfolioAverages(): PortfolioAverages {
  const investments = getAllInvestments();
  const n = investments.length;
  if (n === 0) {
    return {
      avgIrr: 0, avgMoic: 0, avgDpi: 0, avgRvpi: 0, avgRevenueGrowth: 0,
      avgFinancial: 0, avgImpact: 0, avgOperational: 0, avgEsg: 0, avgOverall: 0,
      avgPeopleReached: 0, avgHouseholdsReached: 0, avgJobsCreated: 0,
    };
  }
  return {
    avgIrr: Math.round((investments.reduce((s, i) => s + i.irr, 0) / n) * 10) / 10,
    avgMoic: Math.round((investments.reduce((s, i) => s + computeMoic(i), 0) / n) * 100) / 100,
    avgDpi: Math.round((investments.reduce((s, i) => s + computeDpi(i), 0) / n) * 100) / 100,
    avgRvpi: Math.round((investments.reduce((s, i) => s + computeRvpi(i), 0) / n) * 100) / 100,
    avgRevenueGrowth: Math.round(investments.reduce((s, i) => s + i.revenueGrowth, 0) / n),
    avgFinancial: Math.round((investments.reduce((s, i) => s + i.scores.financial, 0) / n) * 10) / 10,
    avgImpact: Math.round((investments.reduce((s, i) => s + i.scores.impact, 0) / n) * 10) / 10,
    avgOperational: Math.round((investments.reduce((s, i) => s + i.scores.operational, 0) / n) * 10) / 10,
    avgEsg: Math.round((investments.reduce((s, i) => s + i.scores.esg, 0) / n) * 10) / 10,
    avgOverall: Math.round((investments.reduce((s, i) => s + computeOverallScore(i.scores), 0) / n) * 10) / 10,
    avgPeopleReached: Math.round(investments.reduce((s, i) => s + i.peopleReached, 0) / n),
    avgHouseholdsReached: Math.round(investments.reduce((s, i) => s + i.householdsReached, 0) / n),
    avgJobsCreated: Math.round(investments.reduce((s, i) => s + i.jobsCreated, 0) / n),
  };
}

/** Get per-investment time series for comparison charts */
export function getInvestmentTimeSeries(
  metric: "revenue" | "valuation" | "peopleReached" | "jobsCreated"
): { period: string; [investmentName: string]: string | number }[] {
  const periods = getTimePeriods();
  const investments = getAllInvestments();

  return periods.map((period, idx) => {
    const row: { period: string; [key: string]: string | number } = { period };
    for (const inv of investments) {
      row[inv.name] = inv.timeSeries[metric][idx] ?? 0;
    }
    return row;
  });
}
