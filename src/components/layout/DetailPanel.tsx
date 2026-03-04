"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function DetailPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: DetailPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        role="complementary"
        aria-label={`Details for ${title}`}
        aria-hidden={!isOpen}
        className={clsx(
          "fixed right-0 z-50 transition-transform duration-300 ease-in-out overflow-y-auto",
          "w-[90vw] sm:w-[420px]",
          "top-14 h-[calc(100vh-56px)]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          background: "var(--color-surface-1)",
          borderLeft: "1px solid var(--card-border)",
          boxShadow: "var(--shadow-card-hover)",
        }}
      >
        <div
          className="sticky top-0 px-5 py-4 flex items-start justify-between z-10"
          style={{
            background: "var(--color-surface-1)",
            borderBottom: "1px solid var(--card-border)",
          }}
        >
          <div>
            <h2
              className="text-base font-bold font-[var(--font-heading)]"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close detail panel"
            className="p-1.5 rounded-lg transition-colors shrink-0 focus:outline-none focus:ring-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </>
  );
}
