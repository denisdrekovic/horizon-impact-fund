"use client";

import { useCallback, useMemo } from "react";

export interface WaterfallItem {
  label: string;
  value: number;
  type: "start" | "increase" | "decrease" | "total";
}

const COLORS = {
  start: "#062A74",       // navy — starting value
  increase: "#3DD29D",    // green — gains / positive flow
  decrease: "#FF5005",    // red-orange — outflows / losses
  total: "#034BE4",       // accent blue — final total
  bridge: "var(--card-border-hover)",
};

const LEGEND = [
  { label: "Starting", color: COLORS.start },
  { label: "Increase", color: COLORS.increase },
  { label: "Decrease", color: COLORS.decrease },
  { label: "Total", color: COLORS.total },
];

interface Props {
  data: WaterfallItem[];
  formatValue?: (v: number) => string;
}

export default function WaterfallChart({
  data,
  formatValue = (v) => `$${(v / 1_000_000).toFixed(1)}M`,
}: Props) {
  /* ── Compute bar geometry ── */
  const bars = useMemo(() => {
    let running = 0;
    return data.map((item) => {
      let bottom: number, top: number;

      if (item.type === "total") {
        bottom = 0;
        top = item.value;
      } else if (item.type === "start") {
        bottom = 0;
        top = item.value;
        running = item.value;
      } else {
        // increase or decrease
        bottom = running;
        top = running + item.value;
        running = top;
      }

      return {
        ...item,
        bottom: Math.min(bottom, top),
        top: Math.max(bottom, top),
        runningAfter: running,
      };
    });
  }, [data]);

  const maxVal = useMemo(
    () => Math.max(...bars.map((b) => b.top)) * 1.12,
    [bars]
  );

  const barColor = useCallback((type: WaterfallItem["type"]) => COLORS[type], []);

  /* ── Render dimensions (responsive via viewBox) ── */
  const CHART_W = 500;
  const CHART_H = 220;
  const MARGIN = { top: 24, right: 16, bottom: 40, left: 56 };
  const plotW = CHART_W - MARGIN.left - MARGIN.right;
  const plotH = CHART_H - MARGIN.top - MARGIN.bottom;

  const barCount = bars.length;
  const barGap = plotW * 0.12 / Math.max(barCount - 1, 1);
  const barW = (plotW - barGap * (barCount - 1)) / barCount;

  const yScale = useCallback((v: number) => MARGIN.top + plotH - (v / maxVal) * plotH, [maxVal, plotH]);
  const xBar = useCallback((i: number) => MARGIN.left + i * (barW + barGap), [barW, barGap]);

  /* ── Y-axis ticks ── */
  const yTicks = useMemo(() => {
    const count = 5;
    const step = maxVal / count;
    const niceStep = Math.ceil(step / 1_000_000) * 1_000_000;
    const ticks: number[] = [];
    for (let v = 0; v <= maxVal; v += niceStep) {
      ticks.push(v);
    }
    return ticks;
  }, [maxVal]);

  /* ── Active legend items (only show types present in data) ── */
  const activeTypes = useMemo(
    () => new Set(data.map((d) => d.type)),
    [data]
  );
  const activeLegend = LEGEND.filter((l) =>
    activeTypes.has(l.label.toLowerCase() as WaterfallItem["type"]) ||
    (l.label === "Starting" && activeTypes.has("start")) ||
    (l.label === "Increase" && activeTypes.has("increase")) ||
    (l.label === "Decrease" && activeTypes.has("decrease")) ||
    (l.label === "Total" && activeTypes.has("total"))
  );

  return (
    <div className="h-full flex flex-col">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="flex-1 w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis grid + labels */}
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={MARGIN.left}
              y1={yScale(v)}
              x2={CHART_W - MARGIN.right}
              y2={yScale(v)}
              stroke="var(--card-border)"
              strokeWidth={0.5}
            />
            <text
              x={MARGIN.left - 8}
              y={yScale(v) + 3}
              textAnchor="end"
              fontSize={9}
              fill="var(--text-tertiary)"
            >
              {formatValue(v)}
            </text>
          </g>
        ))}

        {/* X-axis baseline */}
        <line
          x1={MARGIN.left}
          y1={yScale(0)}
          x2={CHART_W - MARGIN.right}
          y2={yScale(0)}
          stroke="var(--card-border-hover)"
          strokeWidth={1}
        />

        {/* Bars */}
        {bars.map((bar, i) => {
          const x = xBar(i);
          const yTop = yScale(bar.top);
          const yBottom = yScale(bar.bottom);
          const h = yBottom - yTop;

          return (
            <g key={bar.label}>
              {/* Bar rectangle with rounded top */}
              <rect
                x={x}
                y={yTop}
                width={barW}
                height={Math.max(h, 1)}
                fill={barColor(bar.type)}
                rx={3}
                ry={3}
              />

              {/* Value label above bar */}
              <text
                x={x + barW / 2}
                y={yTop - 6}
                textAnchor="middle"
                fontSize={9}
                fontWeight={600}
                fill="var(--text-primary)"
              >
                {formatValue(bar.value)}
              </text>

              {/* X-axis label */}
              <text
                x={x + barW / 2}
                y={yScale(0) + 14}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-primary)"
              >
                {bar.label}
              </text>
            </g>
          );
        })}

        {/* Bridge / connector lines */}
        {bars.map((bar, i) => {
          if (i >= bars.length - 1) return null;
          const nextBar = bars[i + 1];
          // No bridge line leading INTO a total bar
          if (nextBar.type === "total") return null;

          const bridgeY = yScale(bar.runningAfter);
          const x1 = xBar(i) + barW;
          const x2 = xBar(i + 1);

          return (
            <line
              key={`bridge-${i}`}
              x1={x1}
              y1={bridgeY}
              x2={x2}
              y2={bridgeY}
              stroke={COLORS.bridge}
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-1">
        {activeLegend.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: item.color }}
            />
            <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
