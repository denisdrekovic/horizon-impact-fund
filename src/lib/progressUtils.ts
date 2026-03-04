/**
 * Milestone-based progress assessment.
 *
 * Instead of naively comparing current value against the final 3-year target,
 * we calculate what the EXPECTED value should be at the current reporting period
 * (assuming linear growth toward the target) and compare against that milestone.
 *
 * Example: If the 3-year target is 10,000 and we're at period 4 of 6:
 *   - Expected milestone = 10,000 × (4/6) ≈ 6,667
 *   - If actual = 7,000 → ahead of schedule (green)
 *   - If actual = 6,500 → slightly behind but within tolerance (accent/blue)
 *   - If actual = 4,000 → significantly behind milestone (orange)
 */

export type ProgressStatus = "ahead" | "on-track" | "behind";

export interface ProgressAssessment {
  status: ProgressStatus;
  color: string;
  label: string;
  /** Percentage of the period milestone achieved (not the final target) */
  pctOfMilestone: number;
  /** The expected value for this period */
  expectedMilestone: number;
  /** Percentage of the overall final target achieved */
  pctOfTarget: number;
}

/**
 * Assess progress against a period-aware milestone.
 *
 * @param currentValue      - The indicator's current value
 * @param target            - The 3-year (final) target
 * @param periodIndex       - Current period (0-based)
 * @param totalPeriods      - Total number of reporting periods (typically 6)
 * @param tolerance         - How far below milestone before "behind" (default 0.85 = 85%)
 * @param customMilestone   - Optional: explicit milestone value for this period
 *                            (overrides linear interpolation when provided)
 */
export function assessProgress(
  currentValue: number,
  target: number,
  periodIndex: number,
  totalPeriods: number,
  tolerance = 0.85,
  customMilestone?: number,
): ProgressAssessment {
  if (target <= 0 || totalPeriods <= 0) {
    return {
      status: "on-track",
      color: "var(--color-accent)",
      label: "On Track",
      pctOfMilestone: 0,
      expectedMilestone: 0,
      pctOfTarget: 0,
    };
  }

  const pctOfTarget = Math.round((currentValue / target) * 100);

  // Expected milestone: use custom milestone if provided, else linear interpolation
  const expectedMilestone =
    customMilestone != null && customMilestone > 0
      ? customMilestone
      : target * ((periodIndex + 1) / totalPeriods);
  const pctOfMilestone =
    expectedMilestone > 0
      ? Math.round((currentValue / expectedMilestone) * 100)
      : 100;

  // Already met or exceeded the final target
  if (currentValue >= target) {
    return {
      status: "ahead",
      color: "#3DD29D",
      label: "Target Met",
      pctOfMilestone,
      expectedMilestone,
      pctOfTarget,
    };
  }

  // Ahead of or at the period milestone
  if (currentValue >= expectedMilestone) {
    return {
      status: "ahead",
      color: "#3DD29D",
      label: "Ahead of Schedule",
      pctOfMilestone,
      expectedMilestone,
      pctOfTarget,
    };
  }

  // Within tolerance of the period milestone (slightly behind but still "on track")
  if (currentValue >= expectedMilestone * tolerance) {
    return {
      status: "on-track",
      color: "var(--color-accent)",
      label: "On Track",
      pctOfMilestone,
      expectedMilestone,
      pctOfTarget,
    };
  }

  // Significantly behind the period milestone
  return {
    status: "behind",
    color: "#FF9705",
    label: "Behind Schedule",
    pctOfMilestone,
    expectedMilestone,
    pctOfTarget,
  };
}

/**
 * Get the progress bar color for a given progress assessment.
 */
export function progressColor(
  currentValue: number,
  target: number,
  periodIndex: number,
  totalPeriods: number,
): string {
  return assessProgress(currentValue, target, periodIndex, totalPeriods).color;
}
