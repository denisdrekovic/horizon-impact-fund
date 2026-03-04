"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useSettings } from "@/providers/SettingsProvider";
import Card from "@/components/ui/Card";
import { Shield, Lock, Sun, Moon } from "lucide-react";

export default function SettingsPage() {
  const { role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings, updateSetting } = useSettings();

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="p-3 rounded-full"
              style={{ background: "#FF500520" }}
            >
              <Lock size={24} style={{ color: "#FF5005" }} />
            </div>
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Admin Access Required
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Dashboard settings are only accessible to administrators. Contact
              your fund manager for access.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Shield size={20} style={{ color: "var(--color-accent)" }} />
        <h1
          className="text-xl font-bold font-[var(--font-heading)]"
          style={{ color: "var(--text-primary)" }}
        >
          Settings
        </h1>
      </div>

      {/* Theme Toggle */}
      <Card>
        <h3
          className="text-sm font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Appearance
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              Theme
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              Toggle between light and dark mode
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              background: "var(--color-surface-2)",
              color: "var(--text-primary)",
              border: "1px solid var(--card-border)",
            }}
          >
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            <span className="text-sm font-medium capitalize">{theme}</span>
          </button>
        </div>
      </Card>

      {/* Fund Configuration */}
      <Card>
        <h3
          className="text-sm font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Fund Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Fund Name
            </label>
            <input
              type="text"
              defaultValue="Horizon Impact Fund"
              className="w-full px-3 py-2 text-sm rounded-[var(--radius-button)] focus:outline-none focus:ring-2"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Reporting Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) =>
                updateSetting("currency", e.target.value as "USD" | "EUR" | "GBP")
              }
              className="w-full px-3 py-2 text-sm rounded-[var(--radius-button)] focus:outline-none focus:ring-2"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (&euro;)</option>
              <option value="GBP">GBP (&pound;)</option>
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Fiscal Year Start
            </label>
            <select
              className="w-full px-3 py-2 text-sm rounded-[var(--radius-button)] focus:outline-none focus:ring-2"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            >
              <option>January</option>
              <option>April</option>
              <option>July</option>
              <option>October</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Display Preferences */}
      <Card>
        <h3
          className="text-sm font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Display Preferences
        </h3>
        <div className="space-y-3">
          {[
            {
              key: "showSdgBadges" as const,
              label: "Show SDG badges",
            },
            {
              key: "showSparklines" as const,
              label: "Show revenue trend sparklines",
            },
            {
              key: "showInvestmentStage" as const,
              label: "Show investment stage",
            },
            {
              key: "enableCsvExport" as const,
              label: "Enable CSV exports for viewers",
            },
          ].map((pref) => (
            <label
              key={pref.key}
              className="flex items-center justify-between cursor-pointer"
            >
              <span
                className="text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {pref.label}
              </span>
              <div
                className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
                style={{
                  background: settings[pref.key]
                    ? "var(--color-accent)"
                    : "var(--card-border)",
                }}
                onClick={() =>
                  updateSetting(pref.key, !settings[pref.key])
                }
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{
                    transform: settings[pref.key]
                      ? "translateX(22px)"
                      : "translateX(2px)",
                  }}
                />
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Access Management */}
      <Card>
        <h3
          className="text-sm font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Access Management
        </h3>
        <div className="space-y-3">
          <div
            className="flex items-center justify-between py-2"
            style={{ borderBottom: "1px solid var(--card-border)" }}
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                admin
              </p>
              <p
                className="text-[10px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Full access
              </p>
            </div>
            <span className="brand-badge brand-badge-green">Admin</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                viewer
              </p>
              <p
                className="text-[10px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Read-only access
              </p>
            </div>
            <span className="brand-badge brand-badge-orange">Viewer</span>
          </div>
        </div>
        <p
          className="text-[10px] mt-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          Users are configured via the AUTH_USERS environment variable.
        </p>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <button
          className="px-4 py-2 text-sm font-medium text-white rounded-[var(--radius-button)] transition-colors"
          style={{ background: "var(--color-accent)" }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
