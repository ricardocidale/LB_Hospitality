import {
  AUDIT_VARIANCE_TOLERANCE,
  AUDIT_DOLLAR_TOLERANCE,
  AUDIT_VERIFICATION_WINDOW_MONTHS,
  AUDIT_CRITICAL_ISSUE_THRESHOLD,
} from '../constants';

export const AUDIT_TOLERANCE_PCT = AUDIT_VARIANCE_TOLERANCE;
export const AUDIT_TOLERANCE_DOLLARS = AUDIT_DOLLAR_TOLERANCE;
export const AUDIT_SAMPLE_MONTHS = AUDIT_VERIFICATION_WINDOW_MONTHS;
export const ADVERSE_CRITICAL_THRESHOLD = AUDIT_CRITICAL_ISSUE_THRESHOLD;

export function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T00:00:00');
}

export function withinTolerance(expected: number, actual: number, tolerance: number = AUDIT_TOLERANCE_PCT): boolean {
  if (expected === 0 && actual === 0) return true;
  if (expected === 0) return Math.abs(actual) < tolerance;
  return Math.abs((expected - actual) / expected) < tolerance;
}

export function formatVariance(expected: number, actual: number): string {
  const diff = actual - expected;
  const pct = expected !== 0 ? ((diff / expected) * 100).toFixed(2) : "N/A";
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} (${pct}%)`;
}
