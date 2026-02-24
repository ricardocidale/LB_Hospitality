/**
 * consolidatedFormulaHelpers.tsx — Formula breakdown rows for consolidated financial tables
 *
 * When a user clicks on a line item in a consolidated (multi-property) financial
 * statement, the table expands to show how each property contributes to the
 * portfolio total. This module generates those expandable breakdown rows.
 *
 * For example, clicking "Total Revenue" shows each property's revenue and how
 * they sum to the portfolio total. Weighted metrics (ADR, Occupancy, RevPAR)
 * also show the weighted-average formula with each property's contribution.
 *
 * These helpers are used by the YearlyIncomeStatement and YearlyCashFlowStatement
 * components when rendering in "consolidated" (portfolio) mode.
 */
import React from "react";
import {
  FormulaDetailRow,
  PropertyBreakdownRow,
} from "@/components/financial-table-rows";
import { formatMoney } from "@/lib/financialEngine";
import type { YearlyPropertyFinancials } from "@/lib/yearlyAggregator";
import type { YearlyCashFlowResult } from "@/lib/loanCalculations";
import type { Property } from "@shared/schema";
import { DAYS_PER_MONTH } from "@shared/constants";

const fmt = (n: number) => formatMoney(n);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export interface WeightedMetrics {
  weightedADR: number;
  weightedOcc: number;
  revPAR: number;
  totalAvailableRoomNights: number;
}

/**
 * Render a per-property breakdown for any numeric field on the income statement
 * (e.g., revenueRooms, expenseAdmin). Shows one row per property with that
 * property's value for each projection year.
 */
export function consolidatedLineItemBreakdown(
  field: keyof YearlyPropertyFinancials,
  properties: Property[],
  allPropertyYearlyIS: YearlyPropertyFinancials[][],
  years: number,
): React.ReactNode {
  return (
    <>
      {properties.map((prop, idx) => (
        <PropertyBreakdownRow
          key={idx}
          propertyName={prop.name}
          values={Array.from({ length: years }, (_, y) =>
            fmt((allPropertyYearlyIS[idx]?.[y]?.[field] as number) ?? 0)
          )}
        />
      ))}
    </>
  );
}

/**
 * Render the weighted ADR (Average Daily Rate) breakdown.
 * Weighted ADR = Total Room Revenue across all properties ÷ Total Sold Rooms.
 * Shows the formula row plus each property's ADR × room count contribution.
 */
export function consolidatedWeightedADR(
  properties: Property[],
  allPropertyYearlyIS: YearlyPropertyFinancials[][],
  yearlyConsolidated: YearlyPropertyFinancials[],
  weightedMetrics: WeightedMetrics[],
  years: number,
): React.ReactNode {
  return (
    <>
      <FormulaDetailRow
        label="Σ(Room Revenue) ÷ Σ(Sold Rooms)"
        values={Array.from({ length: years }, (_, y) => {
          const c = yearlyConsolidated[y];
          return `${fmt(c?.revenueRooms ?? 0)} ÷ ${(c?.soldRooms ?? 0).toLocaleString()} = $${weightedMetrics[y]?.weightedADR.toFixed(2) ?? "?"}`;
        })}
      />
      {properties.map((prop, idx) => (
        <PropertyBreakdownRow
          key={idx}
          propertyName={prop.name}
          values={Array.from({ length: years }, (_, y) => {
            const py = allPropertyYearlyIS[idx]?.[y];
            if (!py || py.soldRooms === 0) return "-";
            const adr = py.revenueRooms / py.soldRooms;
            return `$${adr.toFixed(2)} × ${py.soldRooms.toLocaleString()} rooms`;
          })}
        />
      ))}
    </>
  );
}

/**
 * Render the weighted occupancy breakdown.
 * Weighted Occupancy = Total Sold Rooms ÷ Total Available Rooms across all properties.
 * Shows each property's occupancy rate and room counts.
 */
export function consolidatedWeightedOccupancy(
  properties: Property[],
  allPropertyYearlyIS: YearlyPropertyFinancials[][],
  yearlyConsolidated: YearlyPropertyFinancials[],
  weightedMetrics: WeightedMetrics[],
  years: number,
): React.ReactNode {
  return (
    <>
      <FormulaDetailRow
        label="Σ(Sold Rooms) ÷ Σ(Available Rooms)"
        values={Array.from({ length: years }, (_, y) => {
          const c = yearlyConsolidated[y];
          return `${(c?.soldRooms ?? 0).toLocaleString()} ÷ ${(c?.availableRooms ?? 0).toLocaleString()} = ${pct(weightedMetrics[y]?.weightedOcc ?? 0)}`;
        })}
      />
      {properties.map((prop, idx) => (
        <PropertyBreakdownRow
          key={idx}
          propertyName={prop.name}
          values={Array.from({ length: years }, (_, y) => {
            const py = allPropertyYearlyIS[idx]?.[y];
            if (!py || py.availableRooms === 0) return "-";
            const occ = py.soldRooms / py.availableRooms;
            return `${pct(occ)} (${py.soldRooms.toLocaleString()} / ${py.availableRooms.toLocaleString()})`;
          })}
        />
      ))}
    </>
  );
}

/**
 * Render the weighted RevPAR (Revenue Per Available Room) breakdown.
 * RevPAR = Total Room Revenue ÷ Total Available Rooms (equivalent to ADR × Occupancy).
 * Shows each property's RevPAR contribution based on its room count.
 */
export function consolidatedRevPAR(
  properties: Property[],
  allPropertyYearlyIS: YearlyPropertyFinancials[][],
  yearlyConsolidated: YearlyPropertyFinancials[],
  weightedMetrics: WeightedMetrics[],
  years: number,
): React.ReactNode {
  return (
    <>
      <FormulaDetailRow
        label="Σ(Room Revenue) ÷ Σ(Available Rooms)"
        values={Array.from({ length: years }, (_, y) => {
          const c = yearlyConsolidated[y];
          return `${fmt(c?.revenueRooms ?? 0)} ÷ ${(c?.availableRooms ?? 0).toLocaleString()} = $${weightedMetrics[y]?.revPAR.toFixed(2) ?? "?"}`;
        })}
      />
      {properties.map((prop, idx) => (
        <PropertyBreakdownRow
          key={idx}
          propertyName={prop.name}
          values={Array.from({ length: years }, (_, y) => {
            const py = allPropertyYearlyIS[idx]?.[y];
            if (!py || py.availableRooms === 0) return "-";
            const revpar = py.revenueRooms / py.availableRooms;
            return `$${revpar.toFixed(2)} (${prop.roomCount} rooms × ${DAYS_PER_MONTH}d × 12mo)`;
          })}
        />
      ))}
    </>
  );
}

/**
 * Render a per-property breakdown for any numeric field on the cash flow statement
 * (e.g., interestExpense, principalPayment, debtService).
 */
export function consolidatedCashFlowBreakdown(
  field: keyof YearlyCashFlowResult,
  properties: Property[],
  allPropertyYearlyCF: YearlyCashFlowResult[][],
  years: number,
): React.ReactNode {
  return (
    <>
      {properties.map((prop, idx) => (
        <PropertyBreakdownRow
          key={idx}
          propertyName={prop.name}
          values={Array.from({ length: years }, (_, y) =>
            fmt((allPropertyYearlyCF[idx]?.[y]?.[field] as number) ?? 0)
          )}
        />
      ))}
    </>
  );
}

/**
 * Render the consolidated DSCR (Debt Service Coverage Ratio) breakdown.
 * DSCR = NOI ÷ Total Debt Service. Lenders typically require ≥ 1.25x.
 * Shows the portfolio-level ratio plus each property's individual DSCR.
 */
export function consolidatedDSCR(
  properties: Property[],
  allPropertyYearlyCF: YearlyCashFlowResult[][],
  consolidatedNOI: number[],
  consolidatedDS: number[],
  years: number,
): React.ReactNode {
  return (
    <>
      <FormulaDetailRow
        label="NOI ÷ Total Debt Service"
        values={Array.from({ length: years }, (_, y) =>
          consolidatedDS[y] > 0
            ? `${fmt(consolidatedNOI[y])} ÷ ${fmt(consolidatedDS[y])} = ${(consolidatedNOI[y] / consolidatedDS[y]).toFixed(2)}x`
            : "N/A"
        )}
      />
      {properties.map((prop, idx) => (
        <PropertyBreakdownRow
          key={idx}
          propertyName={prop.name}
          values={Array.from({ length: years }, (_, y) => {
            const cf = allPropertyYearlyCF[idx]?.[y];
            if (!cf || cf.debtService === 0) return "N/A";
            return `${(cf.noi / cf.debtService).toFixed(2)}x (${fmt(cf.noi)} ÷ ${fmt(cf.debtService)})`;
          })}
        />
      ))}
    </>
  );
}

/**
 * Render the consolidated Cash-on-Cash Return breakdown.
 * Cash-on-Cash = After-Tax Cash Flow (ATCF) ÷ Equity Invested.
 * Shows the portfolio-level return plus each property's individual return.
 */
export function consolidatedCashOnCash(
  properties: Property[],
  allPropertyYearlyCF: YearlyCashFlowResult[][],
  equityByProperty: number[],
  consolidatedATCF: number[],
  totalEquity: number,
  years: number,
): React.ReactNode {
  return (
    <>
      <FormulaDetailRow
        label="ATCF ÷ Equity Invested"
        values={Array.from({ length: years }, (_, y) =>
          totalEquity > 0
            ? `${fmt(consolidatedATCF[y])} ÷ ${fmt(totalEquity)} = ${((consolidatedATCF[y] / totalEquity) * 100).toFixed(1)}%`
            : "-"
        )}
      />
      {properties.map((prop, idx) => (
        <PropertyBreakdownRow
          key={idx}
          propertyName={prop.name}
          values={Array.from({ length: years }, (_, y) => {
            const cf = allPropertyYearlyCF[idx]?.[y];
            const eq = equityByProperty[idx] ?? 0;
            if (!cf || eq === 0) return "-";
            return `${((cf.atcf / eq) * 100).toFixed(1)}% (${fmt(cf.atcf)} ÷ ${fmt(eq)})`;
          })}
        />
      ))}
    </>
  );
}
