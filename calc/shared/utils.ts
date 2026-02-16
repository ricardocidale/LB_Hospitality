import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";

export const DEFAULT_ROUNDING: RoundingPolicy = { precision: 2, bankers_rounding: false };
export const RATIO_ROUNDING: RoundingPolicy = { precision: 4, bankers_rounding: false };
export const RATE_ROUNDING: RoundingPolicy = { precision: 6, bankers_rounding: false };
export const DEFAULT_TOLERANCE = 0.01;
export const CENTS_TOLERANCE = 0.01;

export function rounder(policy: RoundingPolicy = DEFAULT_ROUNDING) {
  return (v: number) => roundTo(v, policy);
}

export function roundCents(v: number): number {
  return Math.round(v * 100) / 100;
}

export function sumArray(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}

export function sumField<T>(arr: T[], fn: (item: T) => number): number {
  return arr.reduce((s, item) => s + fn(item), 0);
}

export function withinTolerance(a: number, b: number, tol: number = DEFAULT_TOLERANCE): boolean {
  return Math.abs(a - b) <= tol;
}

export function variance(a: number, b: number): number {
  return Math.abs(a - b);
}

export function countBySeverity<T extends { severity: string }>(
  items: T[],
  predicate?: (item: T) => boolean,
): Record<string, number> {
  const filtered = predicate ? items.filter(predicate) : items;
  const counts: Record<string, number> = {};
  for (const item of filtered) {
    counts[item.severity] = (counts[item.severity] ?? 0) + 1;
  }
  return counts;
}

export function pctChange(baseline: number, alternative: number): number {
  if (baseline === 0) return 0;
  return roundCents(((alternative - baseline) / baseline) * 100);
}
