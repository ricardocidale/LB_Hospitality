/**
 * ConsolidatedBalanceSheet — Refactored with shared row components
 *
 * Uses BalanceSheetSection, BalanceSheetLineItem, GrandTotalRow, and
 * SpacerRow from financial-table-rows for consistent visual language.
 */

import { Property } from "@shared/schema";
import { MonthlyFinancials, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { GlobalResponse } from "@/lib/api";
import {
  DEFAULT_LTV,
  PROJECTION_YEARS,
} from "@/lib/constants";
import {
  TableShell,
  BalanceSheetSection,
  BalanceSheetLineItem,
  GrandTotalRow,
  SpacerRow,
} from "@/components/financial-table-rows";

interface Props {
  properties: Property[];
  global: GlobalResponse;
  allProFormas: { property: Property; data: MonthlyFinancials[] }[];
  year: number;
  /** Optional: show a single property instead of consolidated */
  propertyIndex?: number;
}

export function ConsolidatedBalanceSheet({ properties, global, allProFormas, year, propertyIndex }: Props) {
  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
  const displayYear = global.modelStartDate
    ? getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, year)
    : 2026 + year;

  // If propertyIndex is provided, only show that property; otherwise show all
  const propertiesToShow = propertyIndex !== undefined
    ? [{ prop: properties[propertyIndex], idx: propertyIndex }]
    : properties.map((prop, idx) => ({ prop, idx }));

  let totalPropertyValue = 0;
  let totalAccumulatedDepreciation = 0;
  let totalCashReserves = 0;
  let totalDebtOutstanding = 0;
  let totalInitialEquity = 0;
  let totalRetainedEarnings = 0;
  let totalCumulativeCashFlow = 0;
  let totalRefinanceProceeds = 0;

  propertiesToShow.forEach(({ prop, idx }) => {
    const proForma = allProFormas[idx]?.data || [];
    const monthsToInclude = year * 12;
    const relevantMonths = proForma.slice(0, monthsToInclude);

    // Determine acquisition year from dates (no loanCalculations dependency)
    const modelStart = new Date(global.modelStartDate);
    const acqDate = prop.acquisitionDate ? new Date(prop.acquisitionDate) : new Date(prop.operationsStartDate);
    const acqMonthsFromModelStart = Math.max(0,
      (acqDate.getFullYear() - modelStart.getFullYear()) * 12 +
      (acqDate.getMonth() - modelStart.getMonth()));
    const acqYear = Math.floor(acqMonthsFromModelStart / 12);

    // Property not yet acquired - skip all balance sheet entries
    if (year < acqYear) {
      return;
    }

    // Fixed Assets: Full property value (land + building + improvements)
    const totalPropValue = prop.purchasePrice + prop.buildingImprovements;
    totalPropertyValue += totalPropValue;

    // Accumulated Depreciation: sum monthly depreciation from engine data
    const accDepForProp = relevantMonths.reduce((sum, m) => sum + m.depreciationExpense, 0);
    totalAccumulatedDepreciation += accDepForProp;

    // Initial operating reserve (only after acquisition)
    const operatingReserve = prop.operatingReserve ?? 0;
    totalCashReserves += operatingReserve;

    // Equity invested: compute inline (no loanCalculations dependency)
    const totalInvestment = prop.purchasePrice + prop.buildingImprovements +
      (prop.preOpeningCosts ?? 0) + operatingReserve;
    const totalPropVal = prop.purchasePrice + prop.buildingImprovements;
    const ltv = prop.acquisitionLTV ?? (global.debtAssumptions as any)?.acqLTV ?? DEFAULT_LTV;
    const loanAmount = prop.type === "Financed" ? totalPropVal * ltv : 0;
    const equityInvested = totalInvestment - loanAmount;
    totalInitialEquity += equityInvested;

    // Debt outstanding: from last month of the year period (engine data)
    const lastMonthIdx = monthsToInclude - 1;
    const debtOutstanding = lastMonthIdx >= 0 && lastMonthIdx < proForma.length
      ? proForma[lastMonthIdx].debtOutstanding
      : 0;
    totalDebtOutstanding += debtOutstanding;

    // Cumulative interest and principal from engine monthly data
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    let refiProceedsReceived = 0;

    for (let m = 0; m < relevantMonths.length; m++) {
      cumulativeInterest += relevantMonths[m].interestExpense;
      cumulativePrincipal += relevantMonths[m].principalPayment;
      refiProceedsReceived += relevantMonths[m].refinancingProceeds;
    }
    totalRefinanceProceeds += refiProceedsReceived;

    // GAAP Retained Earnings = Cumulative Net Income from engine
    const netIncome = relevantMonths.reduce((sum, m) => sum + m.netIncome, 0);
    totalRetainedEarnings += netIncome;

    // Cash Position = cumulative cash flow from engine (NOI - debt service - taxes)
    const cumulativeNOI = relevantMonths.reduce((sum, m) => sum + m.noi, 0);
    const incomeTax = relevantMonths.reduce((sum, m) => sum + m.incomeTax, 0);
    const cumulativeDebtService = cumulativeInterest + cumulativePrincipal;
    const operatingCashFlow = cumulativeNOI - cumulativeDebtService - incomeTax;
    totalCumulativeCashFlow += operatingCashFlow;
  });

  // Total cash = initial reserves + operating cash flow + refinancing proceeds (financing activity)
  const totalCash = totalCashReserves + totalCumulativeCashFlow + totalRefinanceProceeds;

  const netPropertyValue = totalPropertyValue - totalAccumulatedDepreciation;
  const totalAssets = netPropertyValue + totalCash;
  const totalLiabilities = totalDebtOutstanding;
  const totalEquity = totalInitialEquity + totalRetainedEarnings;

  const title = propertyIndex !== undefined
    ? `Balance Sheet — ${properties[propertyIndex]?.name}`
    : "Consolidated Balance Sheet";

  return (
    <TableShell
      title={title}
      subtitle={`As of December 31, ${displayYear}`}
      columns={["Amount"]}
      stickyLabel="Account"
    >
      {/* ── Assets ── */}
      <BalanceSheetSection label="ASSETS" colSpan={2} />

      <BalanceSheetLineItem label="Current Assets" indent={1} bold />
      <BalanceSheetLineItem label="Cash & Cash Equivalents" amount={totalCash} indent={2} />
      <BalanceSheetLineItem label="Total Current Assets" amount={totalCash} indent={1} bold isSubtotal />

      <SpacerRow colSpan={2} />

      <BalanceSheetLineItem label="Fixed Assets" indent={1} bold />
      <BalanceSheetLineItem label="Property, Plant & Equipment" amount={totalPropertyValue} indent={2} />
      <BalanceSheetLineItem label="Less: Accumulated Depreciation" amount={-totalAccumulatedDepreciation} indent={2} />
      <BalanceSheetLineItem label="Net Fixed Assets" amount={netPropertyValue} indent={1} bold isSubtotal />

      <SpacerRow colSpan={2} />

      <BalanceSheetLineItem label="TOTAL ASSETS" amount={totalAssets} isTotal />

      <SpacerRow colSpan={2} height="h-4" />

      {/* ── Liabilities ── */}
      <BalanceSheetSection label="LIABILITIES" colSpan={2} />

      <BalanceSheetLineItem label="Long-Term Liabilities" indent={1} bold />
      <BalanceSheetLineItem label="Mortgage Notes Payable" amount={totalDebtOutstanding} indent={2} />
      <BalanceSheetLineItem label="TOTAL LIABILITIES" amount={totalLiabilities} isTotal />

      <SpacerRow colSpan={2} height="h-4" />

      {/* ── Equity ── */}
      <BalanceSheetSection label="EQUITY" colSpan={2} />

      <BalanceSheetLineItem label="Paid-In Capital" amount={totalInitialEquity} indent={1} />
      <BalanceSheetLineItem label="Retained Earnings" amount={totalRetainedEarnings} indent={1} />
      <BalanceSheetLineItem label="TOTAL EQUITY" amount={totalEquity} isTotal />

      <SpacerRow colSpan={2} />

      {/* ── Grand Total ── */}
      <GrandTotalRow label="TOTAL LIABILITIES & EQUITY" values={[totalLiabilities + totalEquity]} />
    </TableShell>
  );
}
