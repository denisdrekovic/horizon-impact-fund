"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Eye,
  Building2,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { getAllInvestments } from "@/lib/dataAggregation";
import { STATUS_COLORS } from "@/lib/chartTheme";
import clsx from "clsx";

const PORTFOLIO_NAV = [
  { id: "portfolio", label: "Portfolio", href: "/dashboard", icon: LayoutDashboard },
];

const BOTTOM_NAV = [
  { id: "about", label: "About", href: "/about", icon: Info },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { role, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const investments = useMemo(() => getAllInvestments(), []);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  };

  const visibleBottom = BOTTOM_NAV.filter(
    (item) => !("adminOnly" in item && item.adminOnly && role !== "admin")
  );

  const linkClasses =
    "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-button)] text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20";

  return (
    <aside
      className={clsx(
        "flex flex-col transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
      style={{
        background: "var(--sidebar-bg)",
        color: "var(--sidebar-text)",
        minHeight: "100vh",
      }}
    >
      {/* Logo area */}
      <div
        className="flex items-center justify-between px-4 h-16"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        {!collapsed && (
          <span className="font-[var(--font-heading)] font-bold text-sm tracking-wide whitespace-nowrap">
            Horizon Fund
          </span>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg transition-colors ml-auto"
          style={{ color: "var(--sidebar-text-muted)" }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Scrollable nav area */}
      <nav
        className="flex-1 flex flex-col px-2 py-3 overflow-y-auto"
        aria-label="Main navigation"
      >
        {/* ── PORTFOLIO section ── */}
        {!collapsed && (
          <p
            className="text-[10px] uppercase tracking-wider font-medium px-3 mb-2"
            style={{ color: "var(--sidebar-text-muted)", opacity: 0.7 }}
          >
            Portfolio
          </p>
        )}

        <div className="space-y-0.5">
          {PORTFOLIO_NAV.map((item) => {
            const portfolioRoutes = ["/dashboard", "/impact", "/financials", "/scorecard"];
            const isActive = portfolioRoutes.some(
              (r) => pathname === r || pathname.startsWith(r + "/")
            );
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(linkClasses)}
                style={{
                  background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                  color: isActive ? "var(--sidebar-text)" : "var(--sidebar-text-muted)",
                }}
                title={collapsed ? item.label : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--sidebar-hover-bg)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon size={20} className="shrink-0" aria-hidden="true" />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div
          className="my-3 mx-2"
          style={{ borderTop: "1px solid var(--sidebar-border)" }}
        />

        {/* ── INVESTMENTS section ── */}
        {!collapsed && (
          <p
            className="text-[10px] uppercase tracking-wider font-medium px-3 mb-2"
            style={{ color: "var(--sidebar-text-muted)", opacity: 0.7 }}
          >
            Investments
          </p>
        )}
        {collapsed && (
          <div className="flex justify-center mb-2" title="Investments">
            <Building2 size={16} style={{ color: "var(--sidebar-text-muted)", opacity: 0.6 }} />
          </div>
        )}

        <div className="space-y-0.5">
          {investments.map((inv) => {
            const href = `/investments/${inv.id}/overview`;
            const isActive = pathname.startsWith(`/investments/${inv.id}`);
            const statusColor = STATUS_COLORS[inv.status] || "#428BF9";

            return (
              <Link
                key={inv.id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(linkClasses, collapsed && "justify-center")}
                style={{
                  background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                  color: isActive ? "var(--sidebar-text)" : "var(--sidebar-text-muted)",
                }}
                title={collapsed ? inv.name : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--sidebar-hover-bg)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Status dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: statusColor }}
                />
                {!collapsed && (
                  <span className="whitespace-nowrap text-xs truncate">
                    {inv.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom nav (Settings) */}
      {visibleBottom.length > 0 && (
        <div className="px-2 pb-1">
          {visibleBottom.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(linkClasses)}
                style={{
                  background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                  color: isActive ? "var(--sidebar-text)" : "var(--sidebar-text-muted)",
                }}
                title={collapsed ? item.label : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--sidebar-hover-bg)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon size={20} className="shrink-0" aria-hidden="true" />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom: role badge + logout */}
      <div
        className="px-2 py-3 space-y-2"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 px-2">
            {role === "admin" ? (
              <Shield size={14} style={{ color: "var(--semantic-pos)" }} />
            ) : (
              <Eye size={14} style={{ color: "#FF9705" }} />
            )}
            <span
              className="text-[11px] font-medium capitalize"
              style={{ color: "var(--sidebar-text-muted)" }}
            >
              {role || "viewer"}
            </span>
          </div>
        )}

        <button
          onClick={logout}
          className={clsx(
            "flex items-center gap-3 w-full px-3 py-2 rounded-[var(--radius-button)] text-sm font-medium transition-all",
            collapsed && "justify-center"
          )}
          style={{ color: "var(--sidebar-text-muted)" }}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {!collapsed && (
          <p
            className="text-[10px] leading-tight px-2 pt-1"
            style={{ color: "var(--sidebar-text-muted)", opacity: 0.5 }}
          >
            Impact Portfolio
            <br />
            2025 Annual Review
          </p>
        )}
      </div>
    </aside>
  );
}
