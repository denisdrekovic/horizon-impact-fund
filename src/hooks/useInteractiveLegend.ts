"use client";

import { useState, useCallback } from "react";

/**
 * Hook for interactive Recharts legends.
 * Click a legend item to toggle its visibility.
 * Returns hidden keys set and handler.
 */
export function useInteractiveLegend() {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLegendClick = useCallback(
    (e: any) => {
      const key = String(e.dataKey || e.value || "");
      if (!key) return;
      setHiddenKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    },
    []
  );

  const isHidden = useCallback(
    (key: string) => hiddenKeys.has(key),
    [hiddenKeys]
  );

  return { hiddenKeys, handleLegendClick, isHidden };
}
