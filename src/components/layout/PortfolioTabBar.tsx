"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Heart, TrendingUp, ClipboardCheck } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { id: "overview", label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { id: "impact", label: "Impact", href: "/impact", icon: Heart },
  { id: "financials", label: "Financials", href: "/financials", icon: TrendingUp },
  { id: "scorecard", label: "Scorecard", href: "/scorecard", icon: ClipboardCheck },
];

export default function PortfolioTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 px-1"
      style={{ borderBottom: "1px solid var(--card-border)" }}
      aria-label="Portfolio views"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={clsx(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 rounded-t-lg"
            )}
            style={{
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
            }}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={16} className="shrink-0" />
            <span>{tab.label}</span>
            {isActive && (
              <span
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                style={{ background: "var(--color-accent)" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
