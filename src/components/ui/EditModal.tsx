"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";

/* ─── Single text field editor ─── */

interface EditTextModalProps {
  title: string;
  label: string;
  value: string;
  multiline?: boolean;
  onSave: (value: string) => void;
  onClose: () => void;
}

export function EditTextModal({
  title,
  label,
  value,
  multiline = true,
  onSave,
  onClose,
}: EditTextModalProps) {
  const [draft, setDraft] = useState(value);

  return (
    <ModalShell title={title} onClose={onClose}>
      <div className="space-y-3">
        <label className="block">
          <span
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "var(--text-tertiary)" }}
          >
            {label}
          </span>
          {multiline ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg px-3 py-2 text-xs leading-relaxed resize-y"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--card-border)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          ) : (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-xs"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--card-border)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          )}
        </label>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--card-border)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(draft); onClose(); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1"
            style={{ background: "var(--color-accent)" }}
          >
            <Check size={12} />
            Save
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ─── Multi-field editor (contact, etc.) ─── */

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "email" | "number";
  suffix?: string;
}

interface EditFieldsModalProps {
  title: string;
  fields: FieldDef[];
  values: Record<string, string>;
  onSave: (values: Record<string, string>) => void;
  onClose: () => void;
}

export function EditFieldsModal({
  title,
  fields,
  values,
  onSave,
  onClose,
}: EditFieldsModalProps) {
  const [draft, setDraft] = useState<Record<string, string>>({ ...values });

  return (
    <ModalShell title={title} onClose={onClose}>
      <div className="space-y-3">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: "var(--text-tertiary)" }}
            >
              {f.label}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type={f.type === "number" ? "number" : f.type || "text"}
                value={draft[f.key] || ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="flex-1 rounded-lg px-3 py-2 text-xs"
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--card-border)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
              {f.suffix && (
                <span className="text-[10px] shrink-0" style={{ color: "var(--text-tertiary)" }}>
                  {f.suffix}
                </span>
              )}
            </div>
          </label>
        ))}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--card-border)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(draft); onClose(); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1"
            style={{ background: "var(--color-accent)" }}
          >
            <Check size={12} />
            Save
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ─── SDG toggle editor ─── */

const ALL_SDGS = Array.from({ length: 17 }, (_, i) => i + 1);

const SDG_NAMES: Record<number, string> = {
  1: "No Poverty", 2: "Zero Hunger", 3: "Good Health & Well-Being",
  4: "Quality Education", 5: "Gender Equality", 6: "Clean Water & Sanitation",
  7: "Affordable & Clean Energy", 8: "Decent Work & Economic Growth",
  9: "Industry, Innovation & Infrastructure", 10: "Reduced Inequalities",
  11: "Sustainable Cities & Communities", 12: "Responsible Consumption & Production",
  13: "Climate Action", 14: "Life Below Water", 15: "Life on Land",
  16: "Peace, Justice & Strong Institutions", 17: "Partnerships for the Goals",
};

interface EditSDGModalProps {
  selected: number[];
  onSave: (sdgs: number[]) => void;
  onClose: () => void;
}

export function EditSDGModal({ selected, onSave, onClose }: EditSDGModalProps) {
  const [draft, setDraft] = useState<Set<number>>(new Set(selected));

  const toggle = (sdg: number) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(sdg)) next.delete(sdg);
      else next.add(sdg);
      return next;
    });
  };

  return (
    <ModalShell title="Edit SDG Alignment" onClose={onClose} wide>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {ALL_SDGS.map((sdg) => {
            const active = draft.has(sdg);
            return (
              <button
                key={sdg}
                onClick={() => toggle(sdg)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors"
                style={{
                  background: active ? "var(--color-accent)12" : "var(--color-surface-2)",
                  border: `1.5px solid ${active ? "var(--color-accent)" : "var(--card-border)"}`,
                }}
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    background: active ? "var(--color-accent)" : "var(--color-surface-3)",
                    color: active ? "#fff" : "var(--text-tertiary)",
                  }}
                >
                  {sdg}
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  {SDG_NAMES[sdg]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--card-border)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(Array.from(draft).sort((a, b) => a - b)); onClose(); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1"
            style={{ background: "var(--color-accent)" }}
          >
            <Check size={12} />
            Save ({draft.size} SDGs)
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ─── Add Indicator Modal ─── */

import type { IndicatorMetric } from "@/types/investment";

interface AddIndicatorModalProps {
  type: "output" | "outcome" | "financial";
  onSave: (metric: IndicatorMetric) => void;
  onClose: () => void;
}

const PERIOD_LABELS = ["H1 2023", "H2 2023", "H1 2024", "H2 2024", "H1 2025", "H2 2025"];

export function AddIndicatorModal({ type, onSave, onClose }: AddIndicatorModalProps) {
  const [draft, setDraft] = useState({
    label: "",
    fullName: "",
    unit: "",
    value: "",
    target: "",
    methodology: "",
    source: "",
  });
  const [milestones, setMilestones] = useState<string[]>(["", "", "", "", "", ""]);
  const [showMilestones, setShowMilestones] = useState(false);

  const updateMilestone = (idx: number, val: string) => {
    setMilestones((prev) => prev.map((v, i) => (i === idx ? val : v)));
  };

  const handleSave = () => {
    if (!draft.label.trim() || !draft.fullName.trim()) return;
    const parsedMilestones = milestones.map((m) => Number(m) || 0);
    const hasMilestones = parsedMilestones.some((m) => m > 0);
    const metric: IndicatorMetric = {
      id: `${type}_${Date.now()}`,
      label: draft.label.trim(),
      fullName: draft.fullName.trim(),
      value: Number(draft.value) || 0,
      unit: draft.unit.trim() || "count",
      target: draft.target ? Number(draft.target) : null,
      period: "H2 2025",
      methodology: draft.methodology.trim() || undefined,
      source: draft.source.trim() || undefined,
      type,
      values: [0, 0, 0, 0, 0, Number(draft.value) || 0],
      milestones: hasMilestones ? parsedMilestones : undefined,
    };
    onSave(metric);
    onClose();
  };

  // Auto-fill milestones with linear interpolation when target changes
  const autoFillMilestones = () => {
    const t = Number(draft.target);
    if (!t) return;
    setMilestones(PERIOD_LABELS.map((_, i) => String(Math.round(t * ((i + 1) / PERIOD_LABELS.length)))));
    setShowMilestones(true);
  };

  const field = (key: keyof typeof draft, label: string, opts?: { type?: string; required?: boolean; placeholder?: string }) => (
    <label key={key} className="block">
      <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-tertiary)" }}>
        {label} {opts?.required && <span style={{ color: "#FF5005" }}>*</span>}
      </span>
      <input
        type={opts?.type || "text"}
        value={draft[key]}
        onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={opts?.placeholder}
        className="mt-1 w-full rounded-lg px-3 py-2 text-xs"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--card-border)",
          color: "var(--text-primary)",
          outline: "none",
        }}
      />
    </label>
  );

  return (
    <ModalShell title={`Add ${type === "output" ? "Output" : type === "financial" ? "Financial" : "Outcome"} Indicator`} onClose={onClose} wide>
      <div className="space-y-3">
        {field("label", "Short Label", { required: true, placeholder: "e.g. Farmers Trained" })}
        {field("fullName", "Full Indicator Name", { required: true, placeholder: "e.g. Number of smallholder farmers trained in sustainable practices" })}
        <div className="grid grid-cols-3 gap-3">
          {field("unit", "Unit of Measure", { placeholder: "e.g. farmers" })}
          {field("value", "Current Value", { type: "number", placeholder: "0" })}
          {field("target", "3-Year Target", { type: "number", placeholder: "Optional" })}
        </div>

        {/* Milestone targets — per period */}
        {draft.target && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-tertiary)" }}>
                Period Milestones
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={autoFillMilestones}
                  className="text-[9px] font-medium px-2 py-0.5 rounded transition-colors"
                  style={{ color: "var(--color-accent)", background: "var(--color-accent)10" }}
                >
                  Auto-fill (linear)
                </button>
                <button
                  onClick={() => setShowMilestones(!showMilestones)}
                  className="text-[9px] font-medium px-2 py-0.5 rounded transition-colors"
                  style={{ color: "var(--text-tertiary)", background: "var(--color-surface-2)" }}
                >
                  {showMilestones ? "Hide" : "Customize"}
                </button>
              </div>
            </div>
            <p className="text-[9px] mb-2" style={{ color: "var(--text-tertiary)" }}>
              Set expected values for each reporting period. Progress is assessed against these milestones, not just the final target. Leave blank for linear interpolation.
            </p>
            {showMilestones && (
              <div className="grid grid-cols-6 gap-1.5">
                {PERIOD_LABELS.map((label, i) => (
                  <label key={label} className="block">
                    <span className="text-[8px] font-medium block text-center mb-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {label}
                    </span>
                    <input
                      type="number"
                      value={milestones[i]}
                      onChange={(e) => updateMilestone(i, e.target.value)}
                      placeholder="—"
                      className="w-full rounded-lg px-2 py-1.5 text-[10px] text-center tabular-nums"
                      style={{
                        background: "var(--color-surface-2)",
                        border: "1px solid var(--card-border)",
                        color: "var(--text-primary)",
                        outline: "none",
                      }}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {field("methodology", "Data Collection Methodology", { placeholder: "e.g. Field surveys conducted quarterly" })}
        {field("source", "Data Source", { placeholder: "e.g. Project M&E system" })}

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--card-border)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!draft.label.trim() || !draft.fullName.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1 disabled:opacity-40"
            style={{ background: "var(--color-accent)" }}
          >
            <Check size={12} />
            Add {type === "output" ? "Output" : type === "financial" ? "Financial" : "Outcome"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ─── Shared modal shell ─── */

function ModalShell({
  title,
  wide,
  children,
  onClose,
}: {
  title: string;
  wide?: boolean;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full rounded-2xl overflow-hidden ${wide ? "max-w-2xl" : "max-w-lg"}`}
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--card-border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--card-border)" }}
        >
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {title}
          </p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
