"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { getInvestmentById, getPortfolioAverages } from "@/lib/dataAggregation";
import { InvestmentProvider } from "@/contexts/InvestmentContext";
import InvestmentHeader from "@/components/layout/InvestmentHeader";
import InvestmentTabBar from "@/components/layout/InvestmentTabBar";
import { AlertTriangle } from "lucide-react";

export default function InvestmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const investmentId = params.id;

  const investment = useMemo(
    () => getInvestmentById(investmentId),
    [investmentId]
  );
  const portfolioAvg = useMemo(() => getPortfolioAverages(), []);

  if (!investment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle size={40} style={{ color: "#FF5005" }} />
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Investment Not Found
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          No investment found with ID &ldquo;{investmentId}&rdquo;
        </p>
      </div>
    );
  }

  return (
    <InvestmentProvider investment={investment} portfolioAvg={portfolioAvg}>
      <div className="space-y-0">
        <InvestmentHeader investment={investment} />
        <InvestmentTabBar investmentId={investmentId} />
        <div className="p-6">{children}</div>
      </div>
    </InvestmentProvider>
  );
}
