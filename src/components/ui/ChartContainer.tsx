"use client";

import { useState, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Table2, Download, Maximize2 } from "lucide-react";
import ChartExpandModal from "@/components/charts/ChartExpandModal";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  tableView?: ReactNode;
  csvData?: Record<string, string | number>[];
  csvFilename?: string;
  className?: string;
  height?: number;
}

function downloadCSV(
  data: Record<string, string | number>[],
  filename: string
) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    })
  );
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ChartContainer({
  title,
  subtitle,
  children,
  tableView,
  csvData,
  csvFilename = "export",
  className = "",
  height,
}: ChartContainerProps) {
  const [showTable, setShowTable] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleExport = useCallback(() => {
    if (csvData) downloadCSV(csvData, csvFilename);
  }, [csvData, csvFilename]);

  return (
    <>
      <div className={`brand-card overflow-hidden ${className}`}>
        {/* Title bar */}
        <div className="brand-card-title flex items-center justify-between">
          <div className="min-w-0">
            <span className="block truncate">{title}</span>
            {subtitle && (
              <span
                className="block text-[10px] font-normal mt-0.5 truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {subtitle}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 ml-3 shrink-0">
            {tableView && (
              <button
                onClick={() => setShowTable(!showTable)}
                className="p-1.5 rounded-md transition-colors"
                style={{
                  color: showTable
                    ? "var(--color-accent)"
                    : "var(--text-tertiary)",
                }}
                title={showTable ? "Show chart" : "Show table"}
              >
                {showTable ? <BarChart3 size={15} /> : <Table2 size={15} />}
              </button>
            )}
            {csvData && csvData.length > 0 && (
              <button
                onClick={handleExport}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                title="Export CSV"
              >
                <Download size={15} />
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              title="Expand"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="p-4"
          style={height ? { height, minHeight: height } : undefined}
        >
          <AnimatePresence mode="wait">
            {showTable && tableView ? (
              <motion.div
                key="table"
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: -90 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                {tableView}
              </motion.div>
            ) : (
              <motion.div
                key="chart"
                initial={{ opacity: 0, rotateY: -90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: 90 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expand modal */}
      {showModal && (
        <ChartExpandModal
          title={title}
          onClose={() => setShowModal(false)}
        >
          {showTable && tableView ? tableView : children}
        </ChartExpandModal>
      )}
    </>
  );
}
