/* ─── Sector & Status Enums ─── */

export type Sector =
  | "clean-energy"
  | "agritech"
  | "wash"
  | "financial-inclusion"
  | "healthcare"
  | "education";

export type InvestmentStatus = "outperforming" | "on-track" | "needs-attention";

export type InvestmentStage = "series-a" | "series-b" | "growth" | "early-growth";

export type SectorCategory =
  | "livelihoods"
  | "essential-services"
  | "climate-energy";

/* ─── Indicator Metric (Output or Outcome) ─── */

export interface IndicatorMetric {
  id: string;
  label: string;
  fullName: string;
  value: number;
  unit: string;
  target: number | null;
  period: string;
  methodology?: string;
  source?: string;
  type: "output" | "outcome" | "financial";
  /** Per-period values aligned to timeSeries.periods (6 semi-annual values) */
  values?: number[];
  /** Optional per-period milestone targets (same length as values).
   *  When set, progress is assessed against these instead of linear interpolation. */
  milestones?: number[];
}

/* ─── Disaggregation (combined sex × region/type) ─── */

export interface RegionDisaggregation {
  name: string;
  female: number;
  male: number;
}

export interface JobTypeDisaggregation {
  name: string;
  female: number;
  male: number;
}

export interface Disaggregation {
  peopleReached: {
    byRegion: RegionDisaggregation[];
  };
  jobsCreated: {
    byType: JobTypeDisaggregation[];
  };
}

/* ─── Time-Series Outcome Tracker ─── */

export interface TimeSeriesOutcome {
  label: string;
  values: number[];
  unit: string;
  /** End-of-fund-lifecycle target. Used to render a target trendline. */
  target?: number;
}

/* ─── Time Series Block ─── */

export interface TimeSeries {
  periods: string[];
  revenue: number[];
  valuation: number[];
  peopleReached: number[];
  jobsCreated: number[];
  primaryOutcome: TimeSeriesOutcome;
  secondaryOutcome: TimeSeriesOutcome;
}

/* ─── Audit Trail ─── */

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: "add" | "edit" | "delete" | "lock" | "unlock";
  field: string;
  detail: string;
  previousValue?: string;
  newValue?: string;
}

/* ─── Main Investment Interface ─── */

export interface Investment {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  sector: Sector;
  sectorCategory: SectorCategory;
  coordinates: [number, number];
  stage: InvestmentStage;
  status: InvestmentStatus;

  /* Fund-level financial */
  investmentDate: string;
  investmentAmount: number;
  capitalCalled: number;
  currentValuation: number;
  distributions: number;
  irr: number;
  revenueGrowth: number;

  /* Time series (6 semi-annual periods: H1 2023 → H2 2025) */
  timeSeries: TimeSeries;

  /* Impact snapshot (latest period) */
  peopleReached: number;
  householdsReached: number;
  jobsCreated: number;
  womenBeneficiaryPct: number;
  co2Avoided: number | null;

  /* Cross-cutting indicator derivation */
  peopleReachedDefinition: string;
  householdsReachedDefinition: string;
  jobsCreatedDefinition: string;

  /* Disaggregated data (sex × region, sex × job type) */
  disaggregation: Disaggregation;

  /* Sector-specific indicators */
  outputs: IndicatorMetric[];
  outcomes: IndicatorMetric[];

  /* Financial indicators */
  financials?: IndicatorMetric[];

  /* Indicator locking */
  indicatorsLocked?: boolean;
  indicatorsLockedAt?: string;
  indicatorsLockedBy?: string;

  /* Audit trail */
  auditTrail?: AuditEntry[];

  /* SDGs */
  sdgAlignment: number[];

  /* ESG Scorecard (1–5 scale) */
  scores: {
    financial: number;
    impact: number;
    operational: number;
    esg: number;
  };

  /* Project Profile */
  profile: InvestmentProfile;
}

/* ─── Project Profile ─── */

export interface TocLevel {
  label: string;
  color: string;
  items: string[];
}

export interface InvestmentProfile {
  description: string;
  theoryOfChange: string;
  tocImage?: string;
  tocLevels?: TocLevel[];
  targetBeneficiaries: string;
  geographicFocus: string;
  implementationApproach: string;
  reportingFrequency: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
}

/* ─── Derived / Computed Types ─── */

export interface GeoLocation {
  investmentId: string;
  name: string;
  country: string;
  sector: Sector;
  sectorCategory: SectorCategory;
  coordinates: [number, number];
  investmentAmount: number;
  status: InvestmentStatus;
  irr: number;
  peopleReached: number;
  currentValuation: number;
}

export interface PortfolioSummary {
  totalDeployed: number;
  totalValuation: number;
  totalDistributions: number;
  portfolioIRR: number;
  avgMoic: number;
  totalInvestments: number;
  totalCountries: number;
  totalPeopleReached: number;
  totalHouseholdsReached: number;
  totalJobsCreated: number;
  totalCo2Avoided: number;
  avgWomenPct: number;
  atRiskCount: number;
  /* Period-over-period trends (last vs second-to-last reporting period) */
  trends: {
    peopleReachedPct: number;
    jobsCreatedPct: number;
    valuationPct: number;
    deployedPct: number;  // not really a trend but useful
  };
  categories: {
    id: SectorCategory;
    label: string;
    icon: string;
    investments: number;
    totalDeployed: number;
    avgStatus: InvestmentStatus;
  }[];
}

export interface ScorecardRow {
  investmentId: string;
  name: string;
  country: string;
  sector: Sector;
  status: InvestmentStatus;
  financial: number;
  impact: number;
  operational: number;
  esg: number;
  overall: number;
}

export interface PortfolioAverages {
  avgIrr: number;
  avgMoic: number;
  avgDpi: number;
  avgRvpi: number;
  avgRevenueGrowth: number;
  avgFinancial: number;
  avgImpact: number;
  avgOperational: number;
  avgEsg: number;
  avgOverall: number;
  avgPeopleReached: number;
  avgHouseholdsReached: number;
  avgJobsCreated: number;
}

export interface FinancialRow {
  investmentId: string;
  name: string;
  country: string;
  sector: Sector;
  stage: InvestmentStage;
  status: InvestmentStatus;
  investmentAmount: number;
  capitalCalled: number;
  currentValuation: number;
  distributions: number;
  moic: number;
  irr: number;
  unrealizedGain: number;
  revenueGrowth: number;
  investmentDate: string;
  holdingPeriodYears: number;
}
