"use client";

import { useState, useMemo } from "react";
import { useInvestment } from "@/contexts/InvestmentContext";
import {
  STATUS_COLORS,
  SECTOR_COLORS,
} from "@/lib/chartTheme";
import { assessProgress } from "@/lib/progressUtils";
import Card from "@/components/ui/Card";
import TocEditor, { TocLightbox } from "@/components/ui/TocEditor";
import { EditTextModal, EditFieldsModal, EditSDGModal, AddIndicatorModal } from "@/components/ui/EditModal";
import type { IndicatorMetric, TocLevel, AuditEntry } from "@/types/investment";
import {
  MapPin,
  Calendar,
  Users,
  Home,
  Briefcase,
  Globe,
  Mail,
  User,
  ChevronRight,
  X,
  Layers,
  Info,
  BookOpen,
  Crosshair,
  ClipboardList,
  Pencil,
  Plus,
  Upload,
  ZoomIn,
  Image as ImageIcon,
  Lock,
  Unlock,
  History,
  ShieldCheck,
} from "lucide-react";

const SECTOR_LABELS: Record<string, string> = {
  "clean-energy": "Clean Energy",
  agritech: "AgriTech",
  wash: "Water & Sanitation",
  "financial-inclusion": "Financial Inclusion",
  healthcare: "Healthcare",
  education: "Education",
};

const STATUS_LABELS: Record<string, string> = {
  outperforming: "Outperforming",
  "on-track": "On Track",
  "needs-attention": "Needs Attention",
};

const SDG_NAMES: Record<number, string> = {
  1: "No Poverty", 2: "Zero Hunger", 3: "Good Health & Well-Being",
  4: "Quality Education", 5: "Gender Equality", 6: "Clean Water & Sanitation",
  7: "Affordable & Clean Energy", 8: "Decent Work & Economic Growth",
  9: "Industry, Innovation & Infrastructure", 10: "Reduced Inequalities",
  11: "Sustainable Cities & Communities", 12: "Responsible Consumption & Production",
  13: "Climate Action", 14: "Life Below Water", 15: "Life on Land",
  16: "Peace, Justice & Strong Institutions", 17: "Partnerships for the Goals",
};

/* ─── Image Lightbox Modal ─── */

function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-4xl">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-1.5 rounded-lg transition-colors"
          style={{ color: "#fff" }}
        >
          <X size={22} />
        </button>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--card-border)",
          }}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-auto"
            style={{ minHeight: 200 }}
          />
        </div>
        <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.6)" }}>
          {alt}
        </p>
      </div>
    </div>
  );
}

/* ─── Edit Button ─── */

function EditButton({ label, onClick }: { label?: string; onClick?: () => void }) {
  return (
    <button
      className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-colors hover:opacity-80"
      style={{
        color: "var(--text-tertiary)",
        background: "var(--color-surface-2)",
        border: "1px solid var(--card-border)",
      }}
      title={label || "Edit"}
      onClick={onClick}
    >
      <Pencil size={10} />
      {label && <span>{label}</span>}
    </button>
  );
}

type EditingField =
  | null
  | "description"
  | "theoryOfChange"
  | "targetBeneficiaries"
  | "geographicFocus"
  | "implementationApproach"
  | "reportingFrequency"
  | "contact"
  | "sdg"
  | "addOutput"
  | "addOutcome"
  | "addFinancial"
  | "peopleReachedDef"
  | "householdsReachedDef"
  | "jobsCreatedDef";

type IndicatorTab = "outputs" | "outcomes" | "financial";

/* ─── PIRS Indicator Reference Card Modal ─── */

function PIRSModal({
  metric,
  periods,
  onClose,
}: {
  metric: IndicatorMetric;
  periods: string[];
  onClose: () => void;
}) {
  const latestVal = metric.values ? metric.values[metric.values.length - 1] : metric.value;
  const latestMilestone = metric.milestones ? metric.milestones[periods.length - 1] : undefined;
  const progress =
    metric.target && metric.target > 0
      ? assessProgress(latestVal, metric.target, periods.length - 1, periods.length, 0.85, latestMilestone)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--card-border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--card-border)" }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {metric.label}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Performance Indicator Reference Sheet (PIRS)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Definition */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
              Indicator Name
            </p>
            <p className="text-xs" style={{ color: "var(--text-primary)" }}>
              {metric.fullName}
            </p>
          </div>

          {/* Type */}
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                Type
              </p>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: metric.type === "output" ? "#034BE418" : metric.type === "financial" ? "#3DD29D18" : "#FF970518",
                  color: metric.type === "output" ? "#034BE4" : metric.type === "financial" ? "#3DD29D" : "#FF9705",
                }}
              >
                {metric.type === "output" ? "Output" : metric.type === "financial" ? "Financial" : "Outcome"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                Unit of Measure
              </p>
              <p className="text-xs" style={{ color: "var(--text-primary)" }}>{metric.unit}</p>
            </div>
          </div>

          {/* Current Value & Target & Progress */}
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                Latest Value
              </p>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {latestVal.toLocaleString()} <span className="text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>{metric.unit}</span>
              </p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                3-Year Target
              </p>
              <p className="text-lg font-bold" style={{ color: "var(--text-secondary)" }}>
                {metric.target != null ? metric.target.toLocaleString() : "\u2014"}
              </p>
            </div>
            {progress && (
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                  % of Target
                </p>
                <p className="text-lg font-bold" style={{ color: progress.color }}>
                  {progress.pctOfTarget}%
                </p>
              </div>
            )}
          </div>

          {/* Progress bar with milestone info */}
          {progress && (
            <div>
              <div
                className="w-full h-2 rounded-full"
                style={{ background: "var(--color-surface-3)" }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, progress.pctOfTarget)}%`,
                    background: progress.color,
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] font-medium" style={{ color: progress.color }}>
                  {progress.label}
                </span>
                <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                  Period milestone: {Math.round(progress.expectedMilestone).toLocaleString()} ({progress.pctOfMilestone}% achieved)
                </span>
              </div>
            </div>
          )}

          {/* Time Series Values */}
          {metric.values && metric.values.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--text-tertiary)" }}>
                Values by Reporting Period
              </p>
              <div className="grid grid-cols-6 gap-1">
                {periods.map((p, i) => {
                  const val = metric.values![i];
                  const periodMilestone = metric.milestones ? metric.milestones[i] : undefined;
                  const periodProgress = metric.target
                    ? assessProgress(val ?? 0, metric.target, i, periods.length, 0.85, periodMilestone)
                    : null;
                  return (
                    <div
                      key={p}
                      className="text-center p-1.5 rounded-lg"
                      style={{ background: "var(--color-surface-2)" }}
                    >
                      <p className="text-[9px] font-medium" style={{ color: "var(--text-tertiary)" }}>{p}</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                        {val?.toLocaleString() ?? "\u2014"}
                      </p>
                      {periodProgress && (
                        <p className="text-[8px] mt-0.5" style={{ color: periodProgress.color }}>
                          {periodProgress.label}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Methodology */}
          {metric.methodology && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                Data Collection Methodology
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {metric.methodology}
              </p>
            </div>
          )}

          {/* Data Source */}
          {metric.source && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                Data Source
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {metric.source}
              </p>
            </div>
          )}

          {/* Reporting Period */}
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                Reporting Period
              </p>
              <p className="text-xs" style={{ color: "var(--text-primary)" }}>{metric.period}</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                Frequency
              </p>
              <p className="text-xs" style={{ color: "var(--text-primary)" }}>Semi-annual</p>
            </div>
          </div>

          {/* Disaggregation note — only shown when relevant */}
          {(metric.label.toLowerCase().includes("people") ||
            metric.label.toLowerCase().includes("beneficiar") ||
            metric.label.toLowerCase().includes("jobs") ||
            metric.label.toLowerCase().includes("employ")) && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                Disaggregation Available
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {metric.label.toLowerCase().includes("jobs") || metric.label.toLowerCase().includes("employ")
                  ? "By sex (female/male), by job type"
                  : "By sex (female/male), by region"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Indicator Row — clickable to open PIRS ─── */

function IndicatorRow({
  metric,
  periods,
}: {
  metric: IndicatorMetric;
  periods: string[];
}) {
  const [showPIRS, setShowPIRS] = useState(false);
  const latestVal = metric.values ? metric.values[metric.values.length - 1] : metric.value;
  const latestMilestone = metric.milestones ? metric.milestones[periods.length - 1] : undefined;
  const progress =
    metric.target && metric.target > 0
      ? assessProgress(latestVal, metric.target, periods.length - 1, periods.length, 0.85, latestMilestone)
      : null;

  return (
    <>
      <button
        onClick={() => setShowPIRS(true)}
        className="w-full text-left flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors group"
        style={{ border: "1px solid var(--card-border)" }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: metric.type === "output" ? "#034BE418" : metric.type === "financial" ? "#3DD29D18" : "#FF970518",
                color: metric.type === "output" ? "#034BE4" : metric.type === "financial" ? "#3DD29D" : "#FF9705",
              }}
            >
              {metric.type === "output" ? "OUT" : metric.type === "financial" ? "FIN" : "OTC"}
            </span>
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {metric.label}
            </p>
          </div>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-tertiary)" }}>
            {metric.fullName}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {latestVal.toLocaleString()} <span className="text-[10px] font-normal" style={{ color: "var(--text-tertiary)" }}>{metric.unit}</span>
          </p>
          {progress && (
            <div className="flex items-center gap-1 justify-end">
              <div
                className="w-12 h-1 rounded-full"
                style={{ background: "var(--color-surface-3)" }}
              >
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${Math.min(100, progress.pctOfTarget)}%`,
                    background: progress.color,
                  }}
                />
              </div>
              <span className="text-[9px] tabular-nums" style={{ color: progress.color }}>
                {progress.label}
              </span>
            </div>
          )}
        </div>

        <ChevronRight
          size={14}
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: "var(--text-tertiary)" }}
        />
      </button>

      {showPIRS && (
        <PIRSModal metric={metric} periods={periods} onClose={() => setShowPIRS(false)} />
      )}
    </>
  );
}

/* ─── Audit Trail Modal ─── */

const AUDIT_ACTION_LABELS: Record<string, { label: string; color: string; icon: typeof Lock }> = {
  add: { label: "Added", color: "#3DD29D", icon: Plus },
  edit: { label: "Edited", color: "#428BF9", icon: Pencil },
  delete: { label: "Removed", color: "#FF5005", icon: X },
  lock: { label: "Locked", color: "#FF9705", icon: Lock },
  unlock: { label: "Unlocked", color: "var(--color-accent)", icon: Unlock },
};

function AuditTrailModal({
  entries,
  onClose,
}: {
  entries: AuditEntry[];
  onClose: () => void;
}) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--card-border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center gap-2">
            <History size={16} style={{ color: "var(--color-accent)" }} />
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Change History
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="text-center py-8">
              <History size={24} style={{ color: "var(--text-tertiary)", opacity: 0.4 }} />
              <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                No changes recorded yet
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {sorted.map((entry, idx) => {
                const meta = AUDIT_ACTION_LABELS[entry.action] || AUDIT_ACTION_LABELS.edit;
                const Icon = meta.icon;
                const ts = new Date(entry.timestamp);
                const dateStr = ts.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const timeStr = ts.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={entry.id}
                    className="relative flex gap-3 pb-4"
                  >
                    {/* Timeline line */}
                    {idx < sorted.length - 1 && (
                      <div
                        className="absolute left-[11px] top-6 bottom-0 w-px"
                        style={{ background: "var(--card-border)" }}
                      />
                    )}
                    {/* Icon dot */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 relative z-10"
                      style={{ background: `${meta.color}18`, border: `1.5px solid ${meta.color}` }}
                    >
                      <Icon size={10} style={{ color: meta.color }} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
                          {entry.field}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-primary)" }}>
                        {entry.detail}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                          {entry.user}
                        </span>
                        <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                          {dateStr} at {timeStr}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Profile Page ─── */

export default function InvestmentProfilePage() {
  const { investment, portfolioAvg, updateProfile, updateInvestment, lockIndicators, unlockIndicators, addAuditEntry } = useInvestment();
  const profile = investment.profile;
  const statusColor = STATUS_COLORS[investment.status] || "#428BF9";
  const sectorColor = SECTOR_COLORS[investment.sector] || "var(--color-accent)";
  const periods = investment.timeSeries.periods;
  const locked = investment.indicatorsLocked ?? false;

  const [showTocModal, setShowTocModal] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [editing, setEditing] = useState<EditingField>(null);
  const [indicatorTab, setIndicatorTab] = useState<IndicatorTab>("outputs");

  const financials = investment.financials ?? [];
  const indicatorTabs = useMemo(() => {
    const tabs: { key: IndicatorTab; label: string; count: number }[] = [];
    if (investment.outputs.length > 0)
      tabs.push({ key: "outputs", label: "Outputs", count: investment.outputs.length });
    if (investment.outcomes.length > 0)
      tabs.push({ key: "outcomes", label: "Outcomes", count: investment.outcomes.length });
    if (financials.length > 0)
      tabs.push({ key: "financial", label: "Financial", count: financials.length });
    return tabs;
  }, [investment.outputs.length, investment.outcomes.length, financials.length]);

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <Card>
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ background: sectorColor }}
          >
            {investment.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {investment.name}
              </h3>
              <EditButton label="Edit" onClick={() => setEditing("description")} />
            </div>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {profile.description}
            </p>

            {/* Quick badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${sectorColor}18`, color: sectorColor }}>
                {SECTOR_LABELS[investment.sector]}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${statusColor}18`, color: statusColor }}>
                {STATUS_LABELS[investment.status]}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: "var(--color-surface-2)", color: "var(--text-secondary)" }}>
                <MapPin size={10} /> {investment.country}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: "var(--color-surface-2)", color: "var(--text-secondary)" }}>
                <Calendar size={10} /> Since {investment.investmentDate.split("-")[0]}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: "var(--color-surface-2)", color: "var(--text-secondary)" }}>
                <Layers size={10} /> {investment.stage.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Theory of Change + Details — 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Theory of Change with compact thumbnail */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} style={{ color: "var(--color-accent)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Theory of Change
              </p>
            </div>
            <EditButton onClick={() => setEditing("theoryOfChange")} />
          </div>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
            {profile.theoryOfChange}
          </p>

          {/* Compact TOC thumbnail — click to enlarge */}
          {profile.tocLevels && profile.tocLevels.length > 0 ? (
            <TocEditor
              levels={profile.tocLevels}
              compact
              onExpand={() => setShowTocModal(true)}
            />
          ) : profile.tocImage ? (
            <button
              onClick={() => setShowTocModal(true)}
              className="relative w-full rounded-lg overflow-hidden group cursor-zoom-in"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--card-border)",
                maxHeight: 180,
              }}
            >
              <img
                src={profile.tocImage}
                alt={`${investment.name} Theory of Change Diagram`}
                className="w-full h-auto"
              />
              <div
                className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.4))" }}
              >
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 text-[10px] font-medium text-gray-800">
                  <ZoomIn size={11} />
                  Click to enlarge
                </div>
              </div>
            </button>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-6 rounded-lg"
              style={{
                background: "var(--color-surface-2)",
                border: "1px dashed var(--card-border)",
              }}
            >
              <ImageIcon size={20} style={{ color: "var(--text-tertiary)" }} />
              <p className="text-[9px] mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                No TOC diagram uploaded
              </p>
              <button
                className="flex items-center gap-1 text-[9px] font-medium px-2 py-1 rounded mt-1.5 transition-colors"
                style={{
                  color: "var(--color-accent)",
                  background: "var(--color-accent)10",
                }}
              >
                <Upload size={9} />
                Upload
              </button>
            </div>
          )}
        </Card>

        {/* Right: Target Beneficiaries + Geographic Focus stacked */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crosshair size={16} style={{ color: "#034BE4" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Target Beneficiaries
                </p>
              </div>
              <EditButton onClick={() => setEditing("targetBeneficiaries")} />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {profile.targetBeneficiaries}
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe size={16} style={{ color: "#428BF9" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Geographic Focus
                </p>
              </div>
              <EditButton onClick={() => setEditing("geographicFocus")} />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {profile.geographicFocus}
            </p>
          </Card>
        </div>
      </div>

      {/* Implementation & Reporting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} style={{ color: "#FF9705" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Implementation Approach
              </p>
            </div>
            <EditButton onClick={() => setEditing("implementationApproach")} />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {profile.implementationApproach}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Info size={16} style={{ color: "#3DD29D" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Reporting & Monitoring
              </p>
            </div>
            <EditButton onClick={() => setEditing("reportingFrequency")} />
          </div>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
            {profile.reportingFrequency}
          </p>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            <Calendar size={12} />
            <span>Reporting spans {periods[0]} &ndash; {periods[periods.length - 1]} ({periods.length} periods)</span>
          </div>
        </Card>
      </div>

      {/* Indicator Registry — PIRS-style */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Indicator Registry
              </p>
              {locked && (
                <span
                  className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#FF970518", color: "#FF9705" }}
                >
                  <Lock size={9} />
                  Locked
                </span>
              )}
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Click any indicator to view its Performance Indicator Reference Sheet (PIRS)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Audit trail button */}
            <button
              onClick={() => setShowAuditTrail(true)}
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-lg transition-colors"
              style={{
                color: "var(--text-tertiary)",
                background: "var(--color-surface-2)",
                border: "1px solid var(--card-border)",
              }}
              title="View change history"
            >
              <History size={11} />
              History
              {(investment.auditTrail?.length ?? 0) > 0 && (
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded-full ml-0.5"
                  style={{ background: "var(--color-accent)18", color: "var(--color-accent)" }}
                >
                  {investment.auditTrail!.length}
                </span>
              )}
            </button>

            {/* Lock/unlock toggle */}
            <button
              onClick={() => {
                if (locked) {
                  unlockIndicators();
                } else {
                  lockIndicators();
                }
              }}
              className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
              style={{
                color: locked ? "#FF9705" : "#3DD29D",
                background: locked ? "#FF970510" : "#3DD29D10",
                border: `1px solid ${locked ? "#FF970530" : "#3DD29D30"}`,
              }}
              title={locked ? "Unlock indicators for editing" : "Lock indicators to prevent changes"}
            >
              {locked ? <Unlock size={11} /> : <Lock size={11} />}
              {locked ? "Unlock" : "Lock"}
            </button>

            {/* Add indicator — hidden when locked */}
            {!locked && (
              <button
                onClick={() => setEditing("addOutput")}
                className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                style={{
                  color: "var(--color-accent)",
                  background: "var(--color-accent)10",
                  border: "1px solid var(--color-accent)30",
                }}
              >
                <Plus size={12} />
                Add Indicator
              </button>
            )}
          </div>
        </div>

        {/* Lock status banner */}
        {locked && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
            style={{ background: "#FF970508", border: "1px solid #FF970520" }}
          >
            <ShieldCheck size={14} style={{ color: "#FF9705" }} />
            <div className="flex-1">
              <p className="text-[10px] font-semibold" style={{ color: "#FF9705" }}>
                Indicators are locked for the current reporting period
              </p>
              <p className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                {investment.indicatorsLockedBy && investment.indicatorsLockedAt && (
                  <>Locked by {investment.indicatorsLockedBy} on {new Date(investment.indicatorsLockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                )}
                {" \u2014 "}Unlock to make changes.
              </p>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div
          className="flex items-center gap-0 mb-3 overflow-x-auto"
          style={{ borderBottom: "1px solid var(--card-border)" }}
        >
          {indicatorTabs.map((tab) => {
            const isActive = indicatorTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setIndicatorTab(tab.key)}
                className="relative px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap"
                style={{
                  color: isActive ? "var(--color-accent)" : "var(--text-tertiary)",
                }}
              >
                {tab.label}
                <span
                  className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? "var(--color-accent)15" : "var(--color-surface-2)",
                    color: isActive ? "var(--color-accent)" : "var(--text-tertiary)",
                  }}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: "var(--color-accent)" }}
                  />
                )}
              </button>
            );
          })}

          {/* Progress legend — right aligned */}
          <div className="ml-auto flex items-center gap-3 text-[9px] px-2" style={{ color: "var(--text-tertiary)" }}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#3DD29D" }} />
              Ahead
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--color-accent)" }} />
              On Track
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#FF9705" }} />
              Behind
            </span>
          </div>
        </div>

        {/* Tab content */}
        <div className="space-y-2">
          {indicatorTab === "outputs" && (
            <>
              {!locked && (
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => setEditing("addOutput")}
                    className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded transition-colors"
                    style={{ color: "var(--text-tertiary)", background: "var(--color-surface-2)" }}
                  >
                    <Plus size={9} />
                    Add Output
                  </button>
                </div>
              )}
              {investment.outputs.map((m) => (
                <IndicatorRow key={m.id} metric={m} periods={periods} />
              ))}
            </>
          )}

          {indicatorTab === "outcomes" && (
            <>
              {!locked && (
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => setEditing("addOutcome")}
                    className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded transition-colors"
                    style={{ color: "var(--text-tertiary)", background: "var(--color-surface-2)" }}
                  >
                    <Plus size={9} />
                    Add Outcome
                  </button>
                </div>
              )}
              {investment.outcomes.map((m) => (
                <IndicatorRow key={m.id} metric={m} periods={periods} />
              ))}
            </>
          )}

          {indicatorTab === "financial" && (
            <>
              {!locked && (
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => setEditing("addFinancial")}
                    className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded transition-colors"
                    style={{ color: "var(--text-tertiary)", background: "var(--color-surface-2)" }}
                  >
                    <Plus size={9} />
                    Add Financial
                  </button>
                </div>
              )}
              {financials.map((m) => (
                <IndicatorRow key={m.id} metric={m} periods={periods} />
              ))}
            </>
          )}
        </div>
      </Card>

      {/* Cross-Cutting Indicator Definitions */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Cross-Cutting Indicator Definitions
          </p>
        </div>
        <div className="space-y-2">
          {[
            { icon: Users, color: "var(--color-accent)", label: "People Reached", definition: investment.peopleReachedDefinition, editKey: "peopleReachedDef" as EditingField },
            { icon: Home, color: "#034BE4", label: "Households Reached", definition: investment.householdsReachedDefinition, editKey: "householdsReachedDef" as EditingField },
            { icon: Briefcase, color: "#428BF9", label: "Jobs Created", definition: investment.jobsCreatedDefinition, editKey: "jobsCreatedDef" as EditingField },
          ].map((def) => (
            <details key={def.label} className="group">
              <summary
                className="flex items-center gap-2 cursor-pointer select-none py-1.5 px-2 rounded-lg transition-colors"
                style={{ color: "var(--text-primary)" }}
              >
                <def.icon size={14} className="shrink-0" style={{ color: def.color }} />
                <span className="text-xs font-medium flex-1">How &ldquo;{def.label}&rdquo; is calculated</span>
                <button
                  onClick={(e) => { e.preventDefault(); setEditing(def.editKey); }}
                  className="p-1 rounded transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <Pencil size={10} />
                </button>
                <span className="text-[10px] transition-transform duration-200 group-open:rotate-90" style={{ color: "var(--text-tertiary)" }}>&rsaquo;</span>
              </summary>
              <p className="text-[11px] mt-1 ml-7 leading-relaxed pb-1" style={{ color: "var(--text-secondary)" }}>
                {def.definition}
              </p>
            </details>
          ))}
        </div>
      </Card>

      {/* SDG Alignment */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            SDG Alignment
          </p>
          <EditButton label="Edit" onClick={() => setEditing("sdg")} />
        </div>
        <div className="flex flex-wrap gap-2">
          {investment.sdgAlignment.map((sdg) => (
            <div
              key={sdg}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--card-border)",
              }}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: "var(--color-accent)" }}
              >
                {sdg}
              </span>
              <span className="text-xs" style={{ color: "var(--text-primary)" }}>
                {SDG_NAMES[sdg] || `SDG ${sdg}`}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact Information */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Primary Contact
          </p>
          <EditButton label="Edit" onClick={() => setEditing("contact")} />
        </div>
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--color-surface-2)" }}
          >
            <User size={18} style={{ color: "var(--color-accent)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {profile.contactName}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {profile.contactRole}
            </p>
            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--color-accent)" }}>
              <Mail size={11} /> {profile.contactEmail}
            </p>
          </div>
        </div>
      </Card>

      {/* TOC Lightbox */}
      {showTocModal && profile.tocLevels && profile.tocLevels.length > 0 && (
        <TocLightbox
          levels={profile.tocLevels}
          investmentName={investment.name}
          onChange={(levels: TocLevel[]) => updateProfile({ tocLevels: levels })}
          onClose={() => setShowTocModal(false)}
        />
      )}
      {showTocModal && (!profile.tocLevels || profile.tocLevels.length === 0) && profile.tocImage && (
        <ImageLightbox
          src={profile.tocImage}
          alt={`${investment.name} — Theory of Change`}
          onClose={() => setShowTocModal(false)}
        />
      )}

      {/* ─── Edit Modals ─── */}

      {editing === "description" && (
        <EditTextModal
          title="Edit Project Description"
          label="Description"
          value={profile.description}
          onSave={(v) => {
            updateProfile({ description: v });
            addAuditEntry({ action: "edit", field: "Description", detail: "Updated project description" });
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "theoryOfChange" && (
        <EditTextModal
          title="Edit Theory of Change"
          label="Theory of Change Narrative"
          value={profile.theoryOfChange}
          onSave={(v) => {
            updateProfile({ theoryOfChange: v });
            addAuditEntry({ action: "edit", field: "Theory of Change", detail: "Updated theory of change narrative" });
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "targetBeneficiaries" && (
        <EditTextModal
          title="Edit Target Beneficiaries"
          label="Target Beneficiaries"
          value={profile.targetBeneficiaries}
          onSave={(v) => updateProfile({ targetBeneficiaries: v })}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "geographicFocus" && (
        <EditTextModal
          title="Edit Geographic Focus"
          label="Geographic Focus"
          value={profile.geographicFocus}
          onSave={(v) => updateProfile({ geographicFocus: v })}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "implementationApproach" && (
        <EditTextModal
          title="Edit Implementation Approach"
          label="Implementation Approach"
          value={profile.implementationApproach}
          onSave={(v) => updateProfile({ implementationApproach: v })}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "reportingFrequency" && (
        <EditTextModal
          title="Edit Reporting & Monitoring"
          label="Reporting Frequency"
          value={profile.reportingFrequency}
          onSave={(v) => updateProfile({ reportingFrequency: v })}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "contact" && (
        <EditFieldsModal
          title="Edit Primary Contact"
          fields={[
            { key: "contactName", label: "Full Name" },
            { key: "contactRole", label: "Role / Title" },
            { key: "contactEmail", label: "Email Address", type: "email" },
          ]}
          values={{
            contactName: profile.contactName,
            contactRole: profile.contactRole,
            contactEmail: profile.contactEmail,
          }}
          onSave={(vals) =>
            updateProfile({
              contactName: vals.contactName,
              contactRole: vals.contactRole,
              contactEmail: vals.contactEmail,
            })
          }
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "sdg" && (
        <EditSDGModal
          selected={investment.sdgAlignment}
          onSave={(sdgs) => {
            const prev = investment.sdgAlignment;
            updateInvestment({ sdgAlignment: sdgs });
            addAuditEntry({
              action: "edit",
              field: "SDG Alignment",
              detail: `Updated SDG alignment from [${prev.join(", ")}] to [${sdgs.join(", ")}]`,
              previousValue: prev.join(", "),
              newValue: sdgs.join(", "),
            });
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "peopleReachedDef" && (
        <EditTextModal
          title="Edit: How &quot;People Reached&quot; is Calculated"
          label="Definition"
          value={investment.peopleReachedDefinition}
          onSave={(v) => updateInvestment({ peopleReachedDefinition: v })}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "householdsReachedDef" && (
        <EditTextModal
          title="Edit: How &quot;Households Reached&quot; is Calculated"
          label="Definition"
          value={investment.householdsReachedDefinition}
          onSave={(v) => updateInvestment({ householdsReachedDefinition: v })}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "jobsCreatedDef" && (
        <EditTextModal
          title="Edit: How &quot;Jobs Created&quot; is Calculated"
          label="Definition"
          value={investment.jobsCreatedDefinition}
          onSave={(v) => updateInvestment({ jobsCreatedDefinition: v })}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "addOutput" && (
        <AddIndicatorModal
          type="output"
          onSave={(metric) => {
            updateInvestment({ outputs: [...investment.outputs, metric] });
            addAuditEntry({
              action: "add",
              field: "Output Indicator",
              detail: `Added output indicator "${metric.label}" (${metric.fullName})`,
              newValue: `${metric.value} ${metric.unit}${metric.target ? `, target: ${metric.target}` : ""}`,
            });
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "addOutcome" && (
        <AddIndicatorModal
          type="outcome"
          onSave={(metric) => {
            updateInvestment({ outcomes: [...investment.outcomes, metric] });
            addAuditEntry({
              action: "add",
              field: "Outcome Indicator",
              detail: `Added outcome indicator "${metric.label}" (${metric.fullName})`,
              newValue: `${metric.value} ${metric.unit}${metric.target ? `, target: ${metric.target}` : ""}`,
            });
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "addFinancial" && (
        <AddIndicatorModal
          type="financial"
          onSave={(metric) => {
            updateInvestment({ financials: [...financials, metric] });
            addAuditEntry({
              action: "add",
              field: "Financial Indicator",
              detail: `Added financial indicator "${metric.label}" (${metric.fullName})`,
              newValue: `${metric.value} ${metric.unit}${metric.target ? `, target: ${metric.target}` : ""}`,
            });
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Audit Trail Modal */}
      {showAuditTrail && (
        <AuditTrailModal
          entries={investment.auditTrail || []}
          onClose={() => setShowAuditTrail(false)}
        />
      )}
    </div>
  );
}
