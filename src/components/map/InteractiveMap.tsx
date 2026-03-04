"use client";

import dynamic from "next/dynamic";
import { GeoLocation } from "@/types/investment";

const MapContent = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[500px] w-full rounded-[var(--radius-card)] flex items-center justify-center"
      style={{ background: "var(--color-surface-2)" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
        />
        <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Loading map...
        </span>
      </div>
    </div>
  ),
});

interface InteractiveMapProps {
  locations: GeoLocation[];
  selectedInvestmentId: string | null;
  onMarkerClick: (location: GeoLocation) => void;
}

export default function InteractiveMap(props: InteractiveMapProps) {
  return <MapContent {...props} />;
}
