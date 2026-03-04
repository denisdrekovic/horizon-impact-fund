"use client";

interface PeriodSelectorProps {
  periods: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export default function PeriodSelector({
  periods,
  selectedIndex,
  onChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {periods.map((period, i) => {
        const isActive = i === selectedIndex;
        return (
          <button
            key={period}
            onClick={() => onChange(i)}
            className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all duration-150"
            style={{
              background: isActive ? "var(--color-accent)" : "var(--color-surface-2)",
              color: isActive ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${isActive ? "var(--color-accent)" : "var(--card-border)"}`,
            }}
          >
            {period}
          </button>
        );
      })}
    </div>
  );
}
