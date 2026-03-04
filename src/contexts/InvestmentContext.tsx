"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Investment, InvestmentProfile, PortfolioAverages, AuditEntry } from "@/types/investment";

interface InvestmentContextValue {
  investment: Investment;
  portfolioAvg: PortfolioAverages;
  updateProfile: (partial: Partial<InvestmentProfile>) => void;
  updateInvestment: (partial: Partial<Investment>) => void;
  lockIndicators: () => void;
  unlockIndicators: () => void;
  addAuditEntry: (entry: Omit<AuditEntry, "id" | "timestamp" | "user">) => void;
}

const InvestmentContext = createContext<InvestmentContextValue | null>(null);

export function InvestmentProvider({
  investment: initialInvestment,
  portfolioAvg,
  children,
}: {
  investment: Investment;
  portfolioAvg: PortfolioAverages;
  children: ReactNode;
}) {
  const [investment, setInvestment] = useState<Investment>(initialInvestment);

  const addAuditEntry = useCallback(
    (entry: Omit<AuditEntry, "id" | "timestamp" | "user">) => {
      const full: AuditEntry = {
        ...entry,
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        user: "Fund Manager",
      };
      setInvestment((prev) => ({
        ...prev,
        auditTrail: [...(prev.auditTrail || []), full],
      }));
    },
    [],
  );

  const updateProfile = useCallback(
    (partial: Partial<InvestmentProfile>) => {
      setInvestment((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...partial },
      }));
    },
    [],
  );

  const updateInvestment = useCallback(
    (partial: Partial<Investment>) => {
      setInvestment((prev) => ({ ...prev, ...partial }));
    },
    [],
  );

  const lockIndicators = useCallback(() => {
    setInvestment((prev) => ({
      ...prev,
      indicatorsLocked: true,
      indicatorsLockedAt: new Date().toISOString(),
      indicatorsLockedBy: "Fund Manager",
    }));
    addAuditEntry({
      action: "lock",
      field: "indicators",
      detail: "Indicators locked for the current reporting period",
    });
  }, [addAuditEntry]);

  const unlockIndicators = useCallback(() => {
    setInvestment((prev) => ({
      ...prev,
      indicatorsLocked: false,
    }));
    addAuditEntry({
      action: "unlock",
      field: "indicators",
      detail: "Indicators unlocked for editing",
    });
  }, [addAuditEntry]);

  return (
    <InvestmentContext.Provider
      value={{
        investment,
        portfolioAvg,
        updateProfile,
        updateInvestment,
        lockIndicators,
        unlockIndicators,
        addAuditEntry,
      }}
    >
      {children}
    </InvestmentContext.Provider>
  );
}

export function useInvestment(): InvestmentContextValue {
  const ctx = useContext(InvestmentContext);
  if (!ctx) {
    throw new Error("useInvestment must be used within an InvestmentProvider");
  }
  return ctx;
}
