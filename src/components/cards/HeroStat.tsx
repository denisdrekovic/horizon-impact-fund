"use client";

import type { PortfolioSummary } from "@/types/investment";
import {
  formatCurrency,
  formatMoic,
  formatCompact,
  formatPct,
} from "@/lib/chartTheme";
import { KPI_DEFINITIONS } from "@/lib/kpiDefinitions";
import KpiCard from "@/components/cards/KpiCard";
import {
  DollarSign,
  BarChart3,
  Percent,
  Layers,
  Users,
  AlertTriangle,
} from "lucide-react";

interface HeroStatProps {
  portfolio: PortfolioSummary;
  panelOpen?: boolean;
}

export default function HeroStat({ portfolio, panelOpen = false }: HeroStatProps) {
  const atRisk = portfolio.atRiskCount;
  const total = portfolio.totalInvestments;

  const atRiskCustomValue = (
    <>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span
          className="text-xl font-bold"
          style={{ color: atRisk > 0 ? "#FF5005" : "#3DD29D" }}
        >
          {atRisk}
        </span>
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          /{total}
        </span>
      </div>
      <div className="flex gap-1 mt-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: i < atRisk ? "#FF5005" : "#3DD29D",
              opacity: i < atRisk ? 1 : 0.35,
            }}
          />
        ))}
      </div>
    </>
  );

  const kpis = [
    {
      icon: DollarSign,
      label: "Capital Deployed",
      subtitle: "Total committed capital",
      value: formatCurrency(portfolio.totalDeployed, true),
      color: "var(--color-accent)",
      trend: undefined as { pct: number } | undefined,
    },
    {
      icon: BarChart3,
      label: "Total Value",
      subtitle: "Valuation + distributions",
      value: formatCurrency(
        portfolio.totalValuation + portfolio.totalDistributions,
        true
      ),
      color: "#3DD29D",
      trend: portfolio.trends.valuationPct
        ? { pct: portfolio.trends.valuationPct }
        : undefined,
    },
    {
      icon: Percent,
      label: "Portfolio IRR",
      subtitle: "Annualized return on cash flows",
      value: formatPct(portfolio.portfolioIRR),
      color: "#FF9705",
      trend: undefined as { pct: number } | undefined,
    },
    {
      icon: Layers,
      label: "Avg MOIC",
      subtitle: "Total value / capital invested",
      value: formatMoic(portfolio.avgMoic),
      color: "#428BF9",
      trend: undefined as { pct: number } | undefined,
    },
    {
      icon: Users,
      label: "People Reached",
      subtitle: "Total beneficiaries",
      value: formatCompact(portfolio.totalPeopleReached),
      color: "#034BE4",
      trend: portfolio.trends.peopleReachedPct
        ? { pct: portfolio.trends.peopleReachedPct }
        : undefined,
    },
    {
      icon: AlertTriangle,
      label: "At Risk",
      subtitle: "Investments needing attention",
      value: "",
      color: atRisk > 0 ? "#FF5005" : "#3DD29D",
      trend: undefined as { pct: number } | undefined,
      customValue: atRiskCustomValue,
    },
  ];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 ${panelOpen ? "lg:grid-cols-3" : "lg:grid-cols-6"} gap-3`}>
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.label}
          icon={kpi.icon}
          label={kpi.label}
          value={kpi.value}
          color={kpi.color}
          variant="compact"
          tooltip={KPI_DEFINITIONS[kpi.label]}
          trend={kpi.trend}
          subtitle={kpi.subtitle}
          customValue={"customValue" in kpi ? kpi.customValue : undefined}
        />
      ))}
    </div>
  );
}
