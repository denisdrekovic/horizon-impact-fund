export default function MapLegend() {
  const statuses = [
    { label: "Outperforming", color: "#3DD29D" },
    { label: "On Track", color: "#428BF9" },
    { label: "Needs Attention", color: "#FF5005" },
  ];

  return (
    <div
      className="absolute bottom-3 left-3 z-[500] backdrop-blur-sm rounded-lg px-3 py-2 pointer-events-auto max-w-[260px]"
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid var(--card-border)",
        boxShadow: "var(--shadow-card)",
      }}
      role="img"
      aria-label="Map legend: marker color represents investment status. Marker size represents investment amount."
    >
      <p
        className="text-[9px] font-medium mb-1.5"
        style={{ color: "var(--text-tertiary)" }}
      >
        Status
      </p>
      <div className="flex flex-col gap-1 mb-2">
        {statuses.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
              aria-hidden="true"
            />
            <span className="text-[9px]" style={{ color: "var(--text-secondary)" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-2 pt-1.5"
        style={{ borderTop: "1px solid var(--card-border)" }}
      >
        <span
          className="text-[9px] font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          Size:
        </span>
        <div className="flex items-end gap-2" aria-hidden="true">
          <div className="flex flex-col items-center">
            <div
              className="rounded-full"
              style={{
                width: 12,
                height: 12,
                background: "var(--text-tertiary)",
                opacity: 0.3,
                border: "1px solid var(--text-tertiary)",
              }}
            />
            <span className="text-[7px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              $2M
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div
              className="rounded-full"
              style={{
                width: 22,
                height: 22,
                background: "var(--text-tertiary)",
                opacity: 0.3,
                border: "1px solid var(--text-tertiary)",
              }}
            />
            <span className="text-[7px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              $5M
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
