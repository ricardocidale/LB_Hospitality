import type { PostedEntry, TrialBalanceEntry } from "../../domain/ledger/types.js";
import { getAccount } from "../../domain/ledger/accounts.js";
import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";

/**
 * Build a trial balance for a specific period.
 * Groups posted entries by account and computes debit/credit totals.
 * Balance respects normal side: DEBIT normal → debit - credit, CREDIT normal → credit - debit.
 */
export function buildTrialBalance(
  entries: PostedEntry[],
  period: string,
  rounding: RoundingPolicy,
): TrialBalanceEntry[] {
  const r = (v: number) => roundTo(v, rounding);

  // Filter to the requested period
  const periodEntries = entries.filter((e) => e.period === period);

  // Group by account
  const byAccount = new Map<string, { debit: number; credit: number }>();
  for (const entry of periodEntries) {
    const existing = byAccount.get(entry.account) ?? { debit: 0, credit: 0 };
    existing.debit += entry.debit;
    existing.credit += entry.credit;
    byAccount.set(entry.account, existing);
  }

  const result: TrialBalanceEntry[] = [];
  for (const [account, totals] of byAccount) {
    const acctDef = getAccount(account);
    const normalSide = acctDef?.normal_side ?? "DEBIT";
    const balance =
      normalSide === "DEBIT"
        ? r(totals.debit - totals.credit)
        : r(totals.credit - totals.debit);

    result.push({
      account,
      debit_total: r(totals.debit),
      credit_total: r(totals.credit),
      balance,
    });
  }

  // Sort by account name for deterministic output
  result.sort((a, b) => a.account.localeCompare(b.account));
  return result;
}

/**
 * Build cumulative trial balance from the start period through the target period.
 * Used for balance sheet (which is a point-in-time snapshot of cumulative activity).
 */
export function buildCumulativeTrialBalance(
  entries: PostedEntry[],
  throughPeriod: string,
  rounding: RoundingPolicy,
): TrialBalanceEntry[] {
  const r = (v: number) => roundTo(v, rounding);

  // Filter to entries up to and including the target period
  const cumulativeEntries = entries.filter((e) => e.period <= throughPeriod);

  // Group by account
  const byAccount = new Map<string, { debit: number; credit: number }>();
  for (const entry of cumulativeEntries) {
    const existing = byAccount.get(entry.account) ?? { debit: 0, credit: 0 };
    existing.debit += entry.debit;
    existing.credit += entry.credit;
    byAccount.set(entry.account, existing);
  }

  const result: TrialBalanceEntry[] = [];
  for (const [account, totals] of byAccount) {
    const acctDef = getAccount(account);
    const normalSide = acctDef?.normal_side ?? "DEBIT";
    const balance =
      normalSide === "DEBIT"
        ? r(totals.debit - totals.credit)
        : r(totals.credit - totals.debit);

    result.push({
      account,
      debit_total: r(totals.debit),
      credit_total: r(totals.credit),
      balance,
    });
  }

  result.sort((a, b) => a.account.localeCompare(b.account));
  return result;
}
