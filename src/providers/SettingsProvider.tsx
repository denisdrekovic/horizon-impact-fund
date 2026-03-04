"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export type Currency = "USD" | "EUR" | "GBP";

interface Settings {
  currency: Currency;
  showSdgBadges: boolean;
  showSparklines: boolean;
  showInvestmentStage: boolean;
  enableCsvExport: boolean;
}

interface SettingsContextValue {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  isHydrated: boolean;
}

const defaultSettings: Settings = {
  currency: "USD",
  showSdgBadges: true,
  showSparklines: true,
  showInvestmentStage: true,
  enableCsvExport: true,
};

const STORAGE_KEY = "horizon-settings";

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  updateSetting: () => {},
  isHydrated: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore parse errors
    }
    setIsHydrated(true);
  }, []);

  // Persist on change (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, isHydrated]);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, isHydrated }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
