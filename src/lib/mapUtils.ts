import { STATUS_COLORS } from "./chartTheme";

export function statusToColor(status: string): string {
  return STATUS_COLORS[status] || "#707787";
}

export function investmentRadius(amount: number): number {
  const min = 8, max = 18;
  const minAmt = 1_000_000, maxAmt = 6_000_000;
  const clamped = Math.max(minAmt, Math.min(maxAmt, amount));
  return min + ((clamped - minAmt) / (maxAmt - minAmt)) * (max - min);
}
