"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { FilterProvider } from "@/contexts/FilterContext";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";
import LoginScreen from "@/components/auth/LoginScreen";

function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ background: "var(--color-surface-0)" }}
      >
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "var(--color-accent)" }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <SettingsProvider>
            <FilterProvider>
              {/* Skip navigation link */}
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-[var(--radius-button)] focus:text-sm focus:font-medium"
                style={{
                  background: "var(--color-accent)",
                  color: "#fff",
                }}
              >
                Skip to main content
              </a>
              <div
                className="h-screen flex overflow-hidden"
                style={{ background: "var(--color-surface-2)" }}
              >
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                  <TopBar />
                  <main
                    id="main-content"
                    className="flex-1 p-6 overflow-y-auto"
                    role="main"
                  >
                    {children}
                  </main>
                </div>
              </div>
            </FilterProvider>
          </SettingsProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
