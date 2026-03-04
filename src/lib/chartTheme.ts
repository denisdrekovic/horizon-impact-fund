/** Shared chart styling constants — all reference CSS variables for theme support */
export const CHART_THEME = {
  gridStroke: "var(--card-border)",
  axisStroke: "var(--card-border-hover)",
  tickFill: "var(--text-tertiary)",
  tooltipBg: "var(--color-surface-1)",
  tooltipBorder: "var(--card-border)",
  fontSize: 12,
};

/** Chart color palette — constant across themes, all high contrast */
export const CHART_COLORS = [
  "#FF9705", // orange
  "#062A74", // navy
  "#034BE4", // blue
  "#428BF9", // light blue
  "#3DD29D", // green (was pale blue)
  "#E05297", // magenta-pink (was faint pink)
];

/** Semantic colors */
export const SEMANTIC = {
  positive: "#3DD29D",
  negative: "#FF5005",
};

/** Status colors */
export const STATUS_COLORS: Record<string, string> = {
  outperforming: "#3DD29D",
  "on-track": "#428BF9",
  "needs-attention": "#FF5005",
};

/** Sector colors for charts — deliberately distinct from STATUS_COLORS */
export const SECTOR_COLORS: Record<string, string> = {
  "clean-energy": "#FF9705",
  agritech: "#14B8A6",
  wash: "#6366F1",
  "financial-inclusion": "#062A74",
  healthcare: "#034BE4",
  education: "#E05297",
};

/** Sector category labels — maps sectorCategory IDs to display names */
export const CATEGORY_LABELS: Record<string, string> = {
  "climate-energy": "Climate & Energy",
  livelihoods: "Livelihoods",
  "essential-services": "Essential Services",
};


/** Format large numbers compactly: 1200 → "1.2K", 1500000 → "1.5M" */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

/** Format currency: $1,500,000 or $1.5M */
export function formatCurrency(
  value: number,
  compact = false,
  currency = "USD"
): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  const sym = symbols[currency] || "$";
  if (compact) return `${sym}${formatCompact(value)}`;
  return `${sym}${value.toLocaleString()}`;
}

/** Format percentage with optional decimal */
export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format MOIC: 1.45x */
export function formatMoic(value: number): string {
  return `${value.toFixed(2)}x`;
}
