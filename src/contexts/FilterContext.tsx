"use client";
import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

interface FilterState {
  country: string | null;
  investmentId: string | null;
}

interface FilterContextValue {
  filters: FilterState;
  setCountry: (country: string | null) => void;
  setInvestmentId: (investmentId: string | null) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = { country: null, investmentId: null };

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const setCountry = useCallback((country: string | null) => setFilters(prev => ({ ...prev, country })), []);
  const setInvestmentId = useCallback((investmentId: string | null) => setFilters(prev => ({ ...prev, investmentId })), []);
  const resetFilters = useCallback(() => setFilters(defaultFilters), []);
  const value = useMemo(() => ({ filters, setCountry, setInvestmentId, resetFilters }), [filters, setCountry, setInvestmentId, resetFilters]);
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
