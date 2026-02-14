/**
 * equityCalculations — Shared equity/investment helpers
 *
 * Single source of truth for property equity investment, loan sizing,
 * and acquisition year derivation. Replaces 11 inline copies across
 * Dashboard, InvestmentAnalysis, ConsolidatedBalanceSheet, excelExport,
 * and loanCalculations.
 */

import { DEFAULT_LTV } from "./constants";

/** Minimal property shape accepted by equity helpers. */
export interface EquityPropertyInput {
  purchasePrice: number;
  buildingImprovements?: number | null;
  preOpeningCosts?: number | null;
  operatingReserve?: number | null;
  type: string;
  acquisitionLTV?: number | null;
  acquisitionDate?: string | null;
  operationsStartDate?: string | null;
}

/** Total cost before financing: purchase + improvements + pre-opening + reserve. */
export function totalPropertyCost(prop: EquityPropertyInput): number {
  return prop.purchasePrice + (prop.buildingImprovements ?? 0)
       + (prop.preOpeningCosts ?? 0) + (prop.operatingReserve ?? 0);
}

/** Acquisition loan amount (0 for Full Equity properties). */
export function acquisitionLoanAmount(prop: EquityPropertyInput): number {
  if (prop.type !== "Financed") return 0;
  const propertyValue = prop.purchasePrice + (prop.buildingImprovements ?? 0);
  const ltv = prop.acquisitionLTV ?? DEFAULT_LTV;
  return propertyValue * ltv;
}

/** Equity invested = total cost - loan amount. */
export function propertyEquityInvested(prop: EquityPropertyInput): number {
  return totalPropertyCost(prop) - acquisitionLoanAmount(prop);
}

/** Months from model start to acquisition date. */
export function acqMonthsFromModelStart(
  acquisitionDate: string | null | undefined,
  fallbackDate: string | null | undefined,
  modelStartDate: string,
): number {
  const modelStart = new Date(modelStartDate);
  const acqDate = new Date(acquisitionDate || fallbackDate || modelStartDate);
  return Math.max(0,
    (acqDate.getFullYear() - modelStart.getFullYear()) * 12 +
    (acqDate.getMonth() - modelStart.getMonth())
  );
}

/** Year index (0-based) of property acquisition. */
export function acquisitionYearIndex(
  acquisitionDate: string | null | undefined,
  fallbackDate: string | null | undefined,
  modelStartDate: string,
): number {
  return Math.floor(acqMonthsFromModelStart(acquisitionDate, fallbackDate, modelStartDate) / 12);
}
