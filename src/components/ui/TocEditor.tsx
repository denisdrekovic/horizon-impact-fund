"use client";

import { useState } from "react";
import type { TocLevel } from "@/types/investment";
import { Plus, X, ChevronRight, ZoomIn, Pencil, Check } from "lucide-react";

interface TocEditorProps {
  levels: TocLevel[];
  compact?: boolean;
  onExpand?: () => void;
  onChange?: (levels: TocLevel[]) => void;
}

/* ─── Full-size TOC Diagram (used in lightbox) ─── */

function TocFull({
  levels,
  onChange,
}: {
  levels: TocLevel[];
  onChange?: (levels: TocLevel[]) => void;
}) {
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [newItemText, setNewItemText] = useState("");

  const handleRemoveItem = (levelIdx: number, itemIdx: number) => {
    if (!onChange) return;
    const next = levels.map((lvl, li) =>
      li === levelIdx
        ? { ...lvl, items: lvl.items.filter((_, ii) => ii !== itemIdx) }
        : lvl
    );
    onChange(next);
  };

  const handleAddItem = (levelIdx: number) => {
    if (!onChange || !newItemText.trim()) return;
    const next = levels.map((lvl, li) =>
      li === levelIdx
        ? { ...lvl, items: [...lvl.items, newItemText.trim()] }
        : lvl
    );
    onChange(next);
    setNewItemText("");
    setAddingTo(null);
  };

  return (
    <div className="flex items-stretch gap-2 p-4 min-w-[700px]">
      {levels.map((level, li) => (
        <div key={level.label} className="flex items-center gap-2 flex-1">
          <div className="flex-1 space-y-2">
            {/* Column header */}
            <div
              className="text-center py-1.5 px-3 rounded-full"
              style={{ background: level.color }}
            >
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {level.label}
              </span>
            </div>

            {/* Items */}
            {level.items.map((item, ii) => (
              <div
                key={ii}
                className="relative group text-center py-3 px-2 rounded-lg text-[11px] font-medium"
                style={{
                  background: `${level.color}12`,
                  border: `1.5px solid ${level.color}`,
                  color: "var(--text-primary)",
                }}
              >
                {item}
                {/* Remove button */}
                {onChange && (
                  <button
                    onClick={() => handleRemoveItem(li, ii)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: level.color, color: "#fff" }}
                    title="Remove item"
                  >
                    <X size={8} />
                  </button>
                )}
              </div>
            ))}

            {/* Add item — inline form or button */}
            {addingTo === li ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddItem(li);
                    if (e.key === "Escape") { setAddingTo(null); setNewItemText(""); }
                  }}
                  placeholder="New item…"
                  className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-[10px]"
                  style={{
                    background: "var(--color-surface-2)",
                    border: `1px solid ${level.color}60`,
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => handleAddItem(li)}
                  className="px-1.5 rounded-lg"
                  style={{ background: level.color, color: "#fff" }}
                >
                  <Check size={10} />
                </button>
                <button
                  onClick={() => { setAddingTo(null); setNewItemText(""); }}
                  className="px-1.5 rounded-lg"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAddingTo(li); setNewItemText(""); }}
                className="w-full py-2 rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1"
                style={{
                  border: `1px dashed ${level.color}60`,
                  color: `${level.color}`,
                  background: `${level.color}06`,
                }}
              >
                <Plus size={10} />
                Add
              </button>
            )}
          </div>

          {/* Arrow between columns */}
          {li < levels.length - 1 && (
            <ChevronRight
              size={16}
              className="shrink-0"
              style={{ color: "var(--text-tertiary)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Compact TOC thumbnail ─── */

function TocCompact({ levels, onExpand }: { levels: TocLevel[]; onExpand?: () => void }) {
  return (
    <button
      onClick={onExpand}
      className="relative w-full rounded-lg overflow-hidden group cursor-zoom-in"
      style={{
        background: "var(--color-surface-2)",
        border: "1px solid var(--card-border)",
      }}
    >
      <div className="flex items-stretch gap-1 p-2.5" style={{ maxHeight: 160, overflow: "hidden" }}>
        {levels.map((level, li) => (
          <div key={level.label} className="flex items-center gap-1 flex-1 min-w-0">
            <div className="flex-1 space-y-1 min-w-0">
              {/* Tiny header pill */}
              <div
                className="text-center py-0.5 px-1 rounded-full"
                style={{ background: level.color }}
              >
                <span className="text-[7px] font-bold text-white uppercase tracking-wider">
                  {level.label}
                </span>
              </div>

              {/* Tiny item boxes */}
              {level.items.map((item, ii) => (
                <div
                  key={ii}
                  className="text-center py-1.5 px-1 rounded text-[7px] font-medium truncate"
                  style={{
                    background: `${level.color}10`,
                    border: `1px solid ${level.color}40`,
                    color: "var(--text-secondary)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            {li < levels.length - 1 && (
              <ChevronRight
                size={8}
                className="shrink-0"
                style={{ color: "var(--text-tertiary)", opacity: 0.5 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,0.35))" }}
      >
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 text-[10px] font-medium text-gray-800">
          <ZoomIn size={11} />
          Click to enlarge &amp; edit
        </div>
      </div>
    </button>
  );
}

/* ─── Lightbox Modal ─── */

function TocLightbox({
  levels,
  investmentName,
  onChange,
  onClose,
}: {
  levels: TocLevel[];
  investmentName: string;
  onChange?: (levels: TocLevel[]) => void;
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
          className="rounded-2xl overflow-x-auto"
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--card-border)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          }}
        >
          <TocFull levels={levels} onChange={onChange} />
        </div>
        <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.6)" }}>
          {investmentName} &mdash; Theory of Change
          {onChange && (
            <span className="ml-2 opacity-70">(click + or &times; to edit)</span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ─── Main export: handles compact/expanded + lightbox ─── */

export default function TocEditor({ levels, compact = true, onExpand, onChange }: TocEditorProps) {
  if (compact) {
    return <TocCompact levels={levels} onExpand={onExpand} />;
  }
  return <TocFull levels={levels} onChange={onChange} />;
}

export { TocLightbox, TocFull, TocCompact };
