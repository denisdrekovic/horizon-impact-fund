"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sun, Moon, ChevronRight } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import { useTheme } from "@/providers/ThemeProvider";
import { getInvestmentById } from "@/lib/dataAggregation";

const COUNTRIES = [
  "Colombia",
  "India",
  "Kenya",
  "Nigeria",
  "Rwanda",
  "Vietnam",
];

const INVESTMENTS = [
  { id: "solvida-energy", name: "SolVida Energy" },
  { id: "kisantech", name: "KisanTech" },
  { id: "maji-solutions", name: "Maji Solutions" },
  { id: "payforward", name: "PayForward" },
  { id: "umuganda-health", name: "Umuganda Health" },
  { id: "skillbridge", name: "SkillBridge" },
];

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard": "Portfolio Overview",
  "/impact": "Impact Metrics",
  "/financials": "Financials",
  "/scorecard": "Scorecard",
  "/settings": "Settings",
  "/about": "About",
};

const INVESTMENT_TAB_LABELS: Record<string, string> = {
  overview: "Overview",
  impact: "Impact",
  financials: "Financials",
  scorecard: "Scorecard",
};

export default function TopBar() {
  const pathname = usePathname();
  const { filters, setCountry, setInvestmentId } = useFilters();
  const { theme, toggleTheme } = useTheme();

  // Determine if we're on an investment page
  const isInvestmentPage = pathname.startsWith("/investments/");

  const breadcrumbSegments = useMemo(() => {
    if (isInvestmentPage) {
      const parts = pathname.split("/").filter(Boolean);
      // parts: ["investments", "<id>", "<tab>"]
      const investmentId = parts[1] || "";
      const tab = parts[2] || "overview";
      const inv = getInvestmentById(investmentId);
      return {
        isInvestment: true,
        investmentName: inv?.name || investmentId,
        investmentId,
        tabLabel: INVESTMENT_TAB_LABELS[tab] || tab,
      };
    }
    return {
      isInvestment: false,
      label: BREADCRUMB_MAP[pathname] || "Portfolio Overview",
    };
  }, [pathname, isInvestmentPage]);

  const showFilters = !isInvestmentPage && pathname !== "/settings" && pathname !== "/about";

  return (
    <header
      className="h-14 sticky top-0 z-40 flex items-center justify-between px-6 shrink-0"
      style={{
        background: "var(--color-surface-1)",
        borderBottom: "1px solid var(--card-border)",
      }}
      role="banner"
    >
      {/* Breadcrumb + reporting period */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2">
        {breadcrumbSegments.isInvestment ? (
          <>
            <Link
              href="/dashboard"
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              Investments
            </Link>
            <ChevronRight size={14} style={{ color: "var(--text-tertiary)" }} />
            <Link
              href={`/investments/${breadcrumbSegments.investmentId}/overview`}
              className="text-sm font-semibold hover:underline font-[var(--font-heading)]"
              style={{ color: "var(--text-primary)" }}
            >
              {breadcrumbSegments.investmentName}
            </Link>
            <ChevronRight size={14} style={{ color: "var(--text-tertiary)" }} />
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {breadcrumbSegments.tabLabel}
            </span>
          </>
        ) : (
          <h1
            className="text-sm font-semibold font-[var(--font-heading)]"
            style={{ color: "var(--text-primary)" }}
          >
            {breadcrumbSegments.label}
          </h1>
        )}
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full ml-2"
          style={{
            background: "var(--color-surface-2)",
            color: "var(--text-tertiary)",
            border: "1px solid var(--card-border)",
          }}
        >
          Data as of H2 2025
        </span>
      </nav>

      {/* Actions */}
      <div
        className="flex items-center gap-3"
        role="toolbar"
        aria-label="Toolbar"
      >
        {showFilters && (
          <>
            <label className="sr-only" htmlFor="filter-country">
              Filter by country
            </label>
            <select
              id="filter-country"
              value={filters.country || ""}
              onChange={(e) => setCountry(e.target.value || null)}
              className="text-xs rounded-[var(--radius-button)] px-2.5 py-1.5 focus:outline-none focus:ring-2"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">All Countries</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-investment">
              Filter by investment
            </label>
            <select
              id="filter-investment"
              value={filters.investmentId || ""}
              onChange={(e) => setInvestmentId(e.target.value || null)}
              className="text-xs rounded-[var(--radius-button)] px-2.5 py-1.5 focus:outline-none focus:ring-2"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">All Investments</option>
              {INVESTMENTS.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name}
                </option>
              ))}
            </select>
          </>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
