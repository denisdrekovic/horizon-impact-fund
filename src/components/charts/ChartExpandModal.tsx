"use client";

import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ChartExpandModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export default function ChartExpandModal({
  title,
  children,
  onClose,
}: ChartExpandModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap + ESC close + body scroll lock
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    // Focus close button
    closeBtnRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-label={`Expanded view: ${title}`}
    >
      <motion.div
        initial={
          prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }
        }
        animate={
          prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
        }
        exit={
          prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }
        }
        transition={
          prefersReduced
            ? { duration: 0.1 }
            : { type: "spring", stiffness: 300, damping: 25 }
        }
        className="w-full max-w-5xl max-h-[85vh] overflow-auto brand-card"
      >
        {/* Header */}
        <div className="brand-card-title flex items-center justify-between sticky top-0 z-10">
          <span className="font-semibold text-sm">{title}</span>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            aria-label="Close expanded view"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6" style={{ minHeight: 400 }}>
          {children}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
