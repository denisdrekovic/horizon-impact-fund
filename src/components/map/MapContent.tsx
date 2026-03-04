"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { GeoLocation } from "@/types/investment";
import { statusToColor, investmentRadius } from "@/lib/mapUtils";
import "leaflet/dist/leaflet.css";

interface MapContentProps {
  locations: GeoLocation[];
  selectedInvestmentId: string | null;
  onMarkerClick: (location: GeoLocation) => void;
}

function MapBoundsUpdater({ locations }: { locations: GeoLocation[] }) {
  const map = useMap();
  if (locations.length > 0) {
    const lats = locations.map((l) => l.coordinates[1]);
    const lngs = locations.map((l) => l.coordinates[0]);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats) - 10, Math.min(...lngs) - 20],
      [Math.max(...lats) + 10, Math.max(...lngs) + 20],
    ];
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 4 });
  }
  return null;
}

const STATUS_LABELS: Record<string, string> = {
  outperforming: "Outperforming",
  "on-track": "On Track",
  "needs-attention": "Needs Attention",
};

const SECTOR_LABELS: Record<string, string> = {
  "clean-energy": "Clean Energy",
  agritech: "AgriTech",
  wash: "Water & Sanitation",
  "financial-inclusion": "Financial Inclusion",
  healthcare: "Healthcare",
  education: "Education",
};

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function formatCompactNum(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export default function MapContent({ locations, selectedInvestmentId, onMarkerClick }: MapContentProps) {
  return (
    <MapContainer
      center={[15, 20]}
      zoom={2}
      scrollWheelZoom={true}
      className="h-full w-full rounded-[var(--radius-card)]"
      style={{ minHeight: "500px", background: "#E0EAFF" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      />
      <MapBoundsUpdater locations={locations} />

      {locations.map((loc) => {
        const color = statusToColor(loc.status);
        const radius = investmentRadius(loc.investmentAmount);
        const isSelected = loc.investmentId === selectedInvestmentId;

        return (
          <CircleMarker
            key={loc.investmentId}
            center={[loc.coordinates[1], loc.coordinates[0]]}
            radius={radius}
            pathOptions={{
              fillColor: color,
              fillOpacity: isSelected ? 0.95 : 0.75,
              color: isSelected ? "#062A74" : "#ffffff",
              weight: isSelected ? 3 : 2,
              opacity: 1,
            }}
            eventHandlers={{ click: () => onMarkerClick(loc) }}
          >
            {/* Hover tooltip — visual card with valuation bar + key metrics */}
            <Tooltip
              direction="top"
              offset={[0, -(radius + 10)]}
              opacity={1}
              className="map-marker-label"
            >
              {(() => {
                const moic = loc.investmentAmount > 0
                  ? (loc.currentValuation / loc.investmentAmount).toFixed(2)
                  : "—";
                const valuationPct = loc.investmentAmount > 0
                  ? Math.min(100, Math.round((loc.currentValuation / loc.investmentAmount) * 100))
                  : 0;
                const gain = loc.currentValuation - loc.investmentAmount;
                const gainPositive = gain >= 0;

                return (
                  <div style={{ minWidth: 240, padding: "6px 4px" }}>
                    {/* Header bar with status color accent */}
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: 4,
                      paddingBottom: 6,
                      borderBottom: `2px solid ${color}`,
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.2 }}>
                          {loc.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                          {loc.country} &middot; {SECTOR_LABELS[loc.sector] || loc.sector}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 9999,
                          background: `${color}18`,
                          color: color,
                          whiteSpace: "nowrap",
                          marginLeft: 8,
                          marginTop: 2,
                        }}
                      >
                        {STATUS_LABELS[loc.status] || loc.status}
                      </span>
                    </div>

                    {/* Visual: Investment → Valuation progress bar */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>Invested</span>
                        <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>Valuation</span>
                      </div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                          {formatAmount(loc.investmentAmount)}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-accent)" }}>
                          {formatAmount(loc.currentValuation)}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div style={{
                        height: 6,
                        borderRadius: 3,
                        background: "var(--color-surface-3)",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min(valuationPct, 100)}%`,
                          borderRadius: 3,
                          background: valuationPct >= 100
                            ? "linear-gradient(90deg, #034BE4, #3DD29D)"
                            : "linear-gradient(90deg, #034BE4, #428BF9)",
                          transition: "width 0.3s",
                        }} />
                      </div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 3,
                      }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: gainPositive ? "#3DD29D" : "#FF5005",
                        }}>
                          {gainPositive ? "+" : ""}{formatAmount(gain)} gain
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-accent)" }}>
                          {moic}x MOIC
                        </span>
                      </div>
                    </div>

                    {/* Key metrics row */}
                    <div style={{
                      display: "flex",
                      gap: 0,
                      borderTop: "1px solid var(--card-border)",
                      paddingTop: 6,
                    }}>
                      <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid var(--card-border)", paddingRight: 4 }}>
                        <div style={{ fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>IRR</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-accent)" }}>{loc.irr.toFixed(1)}%</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid var(--card-border)", paddingLeft: 4, paddingRight: 4 }}>
                        <div style={{ fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>People</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{formatCompactNum(loc.peopleReached)}</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center", paddingLeft: 4 }}>
                        <div style={{ fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Status</div>
                        <div style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: color,
                        }}>
                          {loc.status === "outperforming" ? "Strong" : loc.status === "on-track" ? "Good" : "Watch"}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                      fontSize: 10,
                      color: "var(--text-tertiary)",
                      marginTop: 8,
                      textAlign: "center",
                      fontStyle: "italic",
                    }}>
                      Click for full details
                    </div>
                  </div>
                );
              })()}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
