"use client";

import Card from "@/components/ui/Card";
import { Info, Database, BarChart3, Code2, AlertTriangle } from "lucide-react";
import Image from "next/image";

const METRIC_DEFINITIONS = [
  {
    term: "IRR (Internal Rate of Return)",
    definition:
      "The annualized return rate that makes the net present value of all cash flows equal to zero. A higher IRR indicates a more profitable investment on a time-adjusted basis.",
  },
  {
    term: "MOIC (Multiple on Invested Capital)",
    definition:
      "Total value (current valuation + distributions) divided by the original capital invested. A MOIC of 2.0x means the investment has doubled in value. Unlike IRR, MOIC does not account for the time it took to achieve the return.",
  },
  {
    term: "DPI (Distributions to Paid-In Capital)",
    definition:
      "Realized cash returned to investors divided by total capital called. A DPI above 1.0x means investors have received back more than they contributed.",
  },
  {
    term: "TVPI (Total Value to Paid-In Capital)",
    definition:
      "The sum of current net asset value plus distributions, divided by total capital called. Measures total fund value relative to capital invested.",
  },
  {
    term: "Capital Called",
    definition:
      "The total amount of committed capital that has been drawn down from limited partners (LPs) for investments and fund expenses.",
  },
  {
    term: "Capital Deployed",
    definition:
      "The portion of called capital that has been directly invested into portfolio companies, excluding fees and reserves.",
  },
];

const DATA_SOURCES = [
  {
    source: "Portfolio Company Reports",
    description:
      "Quarterly financial statements and KPI dashboards submitted by each portfolio company, including revenue, headcount, and impact metrics.",
  },
  {
    source: "Fund Administrator Records",
    description:
      "Audited capital account statements, cash flow records, and NAV calculations provided by the fund administrator.",
  },
  {
    source: "Impact Measurement Frameworks",
    description:
      "Impact data collected using IRIS+ indicators and aligned with the UN Sustainable Development Goals (SDGs). People reached, jobs created, and CO₂ avoided figures are self-reported by portfolio companies with annual third-party verification.",
  },
  {
    source: "Valuation Methodology",
    description:
      "Investments are valued using a blend of comparable company multiples, discounted cash flow, and most recent transaction price, following IPEV (International Private Equity and Venture Capital Valuation) guidelines.",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Info size={20} style={{ color: "var(--color-accent)" }} />
        <h1
          className="text-xl font-bold font-[var(--font-heading)]"
          style={{ color: "var(--text-primary)" }}
        >
          About This Dashboard
        </h1>
      </div>

      {/* Disclaimer */}
      <Card>
        <div
          className="flex items-start gap-3 p-4 rounded-lg mb-4"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--status-attention)",
          }}
        >
          <AlertTriangle
            size={20}
            style={{ color: "var(--status-attention)", flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <p
              className="text-sm font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Disclaimer
            </p>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              This dashboard has been altered from its original state and contains
              mock data for demonstration purposes only. All company names, financial
              figures, impact metrics, and other data points are entirely fictitious
              and do not represent real investments or outcomes. This dashboard is
              intended solely as a product demonstration and should not be used for
              investment decisions or reporting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Image
            src="/idi-logo.svg"
            alt="Institute for Development Impact"
            width={160}
            height={40}
            style={{ height: "auto" }}
          />
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Built by the Institute for Development Impact (I4DI)
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              Data systems, impact measurement, and analytics for international development.
            </p>
          </div>
        </div>
      </Card>

      {/* Dashboard overview */}
      <Card>
        <h3
          className="text-sm font-bold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Dashboard Overview
        </h3>
        <div className="space-y-2">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            The Horizon Impact Fund dashboard provides a comprehensive real-time view of a
            $100M emerging-markets impact fund focused on six sectors: Clean Energy,
            AgriTech, Water &amp; Sanitation, Financial Inclusion, Healthcare, and Education.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            It tracks both financial performance and social impact across six portfolio
            companies operating in Colombia, India, Kenya, Nigeria, Rwanda, and Vietnam.
            The dashboard surfaces key portfolio health signals through performance
            scorecards, financial waterfall analyses, and geographic visualizations.
          </p>
        </div>
      </Card>

      {/* Data sources */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} style={{ color: "var(--color-accent)" }} />
          <h3
            className="text-sm font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Data Sources &amp; Methodology
          </h3>
        </div>
        <div className="space-y-4">
          {DATA_SOURCES.map((item) => (
            <div key={item.source}>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: "var(--text-primary)" }}
              >
                {item.source}
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-tertiary)" }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Key metrics */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} style={{ color: "var(--color-accent)" }} />
          <h3
            className="text-sm font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Key Metrics Explained
          </h3>
        </div>
        <div className="space-y-4">
          {METRIC_DEFINITIONS.map((item) => (
            <div key={item.term}>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: "var(--text-primary)" }}
              >
                {item.term}
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-tertiary)" }}
              >
                {item.definition}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Version & credits */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Code2 size={16} style={{ color: "var(--color-accent)" }} />
          <h3
            className="text-sm font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Version &amp; Credits
          </h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              Version
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "var(--color-surface-2)",
                color: "var(--text-secondary)",
                border: "1px solid var(--card-border)",
              }}
            >
              1.0.0
            </span>
          </div>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--text-tertiary)" }}
          >
            Built with Next.js, Recharts, and React-Leaflet. Map tiles provided by
            CartoDB / OpenStreetMap contributors. Data presented is for the H2 2025
            reporting period.
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--text-tertiary)" }}
          >
            For questions or data corrections, contact the fund operations team.
          </p>
        </div>
      </Card>
    </div>
  );
}
