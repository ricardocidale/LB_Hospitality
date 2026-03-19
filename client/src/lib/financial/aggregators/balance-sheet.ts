/**
 * Consolidated Balance Sheet Aggregator — single source of truth.
 *
 * Identity: Total Assets = Total Liabilities + Total Equity
 * Uses ANOI (not NOI) for cash derivation per balance-sheet-identity rule.
 *
 * Used by: BalanceSheetTab (screen), dashboardExports (export), premium pipeline (PDF/PPTX/DOCX)
 */
import type { StatementData, StatementRow, ChartSeries } from "./types";
import { headerRow, childRow } from "./helpers";
import { propertyEquityInvested, acquisitionYearIndex } from "@/lib/financial/equityCalculations";

export function aggregatePortfolioBalanceSheet(
  allPropertyFinancials: Array<{ property: any; financials: any[] }>,
  projectionYears: number,
  getFiscalYear: (i: number) => number,
  modelStartDate?: Date
): StatementData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const rows: StatementRow[] = [];

  const getYearEndData = (yearIdx: number) => {
    let totalCash = 0;
    let totalPPE = 0;
    let totalAccDep = 0;
    let totalDeferredFinancing = 0;
    let totalDebt = 0;
    let totalEquity = 0;
    let totalRetainedEarnings = 0;

    allPropertyFinancials.forEach(({ property, financials }) => {
      const acqYear = acquisitionYearIndex(
        property.acquisitionDate,
        property.operationsStartDate,
        modelStartDate ? modelStartDate.toISOString().slice(0, 10) : ""
      );
      if (yearIdx < acqYear) return;

      const monthsToInclude = (yearIdx + 1) * 12;
      const relevantMonths = financials.slice(0, monthsToInclude);
      const lastMonth = relevantMonths[relevantMonths.length - 1];

      if (!lastMonth) return;

      // Assets
      const ppe = property.purchasePrice + (property.buildingImprovements || 0);
      const accDep = relevantMonths.reduce((sum: number, m: any) => sum + m.depreciationExpense, 0);

      const operatingReserve = property.operatingReserve || 0;
      const cumulativeANOI = relevantMonths.reduce((sum: number, m: any) => sum + m.anoi, 0);
      const cumulativeDebtService = relevantMonths.reduce(
        (sum: number, m: any) => sum + m.interestExpense + m.principalPayment, 0
      );
      const cumulativeTax = relevantMonths.reduce((sum: number, m: any) => sum + m.incomeTax, 0);
      const cumulativeRefi = relevantMonths.reduce((sum: number, m: any) => sum + m.refinancingProceeds, 0);

      const cash = operatingReserve + (cumulativeANOI - cumulativeDebtService - cumulativeTax) + cumulativeRefi;

      let deferredFinancing = 0;
      for (let m = 0; m < relevantMonths.length; m++) {
        if (financials[m].refinancingProceeds > 0) {
          const debtBefore = m > 0 ? financials[m - 1].debtOutstanding : 0;
          const debtAfter = financials[m].debtOutstanding;
          const principalInRefiMonth = financials[m].principalPayment;
          const newLoanAmount = debtAfter + principalInRefiMonth;
          const refiClosingCosts = newLoanAmount - debtBefore - financials[m].refinancingProceeds;
          if (refiClosingCosts > 0) deferredFinancing += refiClosingCosts;
        }
      }

      totalPPE += ppe;
      totalAccDep += accDep;
      totalCash += cash;
      totalDeferredFinancing += deferredFinancing;
      totalDebt += lastMonth.debtOutstanding;
      totalEquity += propertyEquityInvested(property);

      const netIncome = relevantMonths.reduce((sum: number, m: any) => sum + m.netIncome, 0);
      const preOpening = property.preOpeningCosts || 0;
      totalRetainedEarnings += (netIncome - preOpening);
    });

    return {
      cash: totalCash,
      ppe: totalPPE,
      accDep: totalAccDep,
      deferredFinancing: totalDeferredFinancing,
      debt: totalDebt,
      equity: totalEquity,
      retainedEarnings: totalRetainedEarnings,
      totalAssets: totalPPE - totalAccDep + totalCash + totalDeferredFinancing,
      totalLiabilitiesEquity: totalDebt + totalEquity + totalRetainedEarnings,
    };
  };

  const yearlyData = years.map((_, i) => getYearEndData(i));

  // ── ASSETS (header — no values, just label)
  rows.push(headerRow("ASSETS", years.map(() => 0)));
  rows.push(childRow("Cash & Cash Equivalents", yearlyData.map(d => d.cash)));
  rows.push(childRow("Property, Plant & Equipment", yearlyData.map(d => d.ppe)));
  rows.push(childRow("Accumulated Depreciation", yearlyData.map(d => -d.accDep)));
  rows.push(childRow("Deferred Financing Costs", yearlyData.map(d => d.deferredFinancing)));

  // ── TOTAL ASSETS (always visible, bold)
  rows.push(headerRow("TOTAL ASSETS", yearlyData.map(d => d.totalAssets), { isBold: true }));

  // ── LIABILITIES & EQUITY (header — no values, just label)
  rows.push(headerRow("LIABILITIES & EQUITY", years.map(() => 0)));
  rows.push(childRow("Mortgage Notes Payable", yearlyData.map(d => d.debt)));
  rows.push(childRow("Paid-In Capital", yearlyData.map(d => d.equity)));
  rows.push(childRow("Retained Earnings", yearlyData.map(d => d.retainedEarnings)));

  // ── TOTAL LIABILITIES & EQUITY (always visible, bold)
  rows.push(headerRow("TOTAL LIABILITIES & EQUITY", yearlyData.map(d => d.totalLiabilitiesEquity), { isBold: true }));

  // ── Chart series
  const chartSeries: ChartSeries[] = [
    { label: "Total Assets", values: yearlyData.map(d => d.totalAssets), color: "#257D41" },
    { label: "Total Liabilities", values: yearlyData.map(d => d.debt), color: "#F4795B" },
  ];

  return {
    title: "Consolidated Balance Sheet",
    years,
    rows,
    chartSeries,
  };
}
