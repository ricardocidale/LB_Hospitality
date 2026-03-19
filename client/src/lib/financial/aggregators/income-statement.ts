/**
 * Consolidated Income Statement Aggregator — single source of truth.
 *
 * USALI 12th Edition cascade:
 * Operational Metrics → Revenue → Departmental Expenses → Undistributed Expenses →
 * GOP → Management Fees → AGOP → Fixed Charges → NOI → FF&E → ANOI →
 * Debt Service → Net Income
 *
 * Used by: IncomeStatementTab (screen), dashboardExports (export), premium pipeline (PDF/PPTX/DOCX)
 */
import type { StatementData, StatementRow, ChartSeries } from "./types";
import { headerRow, childRow, grandchildRow, separatorRow } from "./helpers";
import type { YearlyPropertyFinancials } from "@/lib/yearlyAggregator";

export function aggregatePortfolioIncomeStatement(
  yearlyConsolidatedCache: YearlyPropertyFinancials[],
  projectionYears: number,
  getFiscalYear: (i: number) => number,
  allPropertyYearlyIS?: YearlyPropertyFinancials[][],
  propertyNames?: string[]
): StatementData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const c = (i: number) => yearlyConsolidatedCache[i];
  const p = (idx: number, i: number) => allPropertyYearlyIS?.[idx]?.[i];
  const rows: StatementRow[] = [];
  const hasProps = allPropertyYearlyIS && propertyNames && propertyNames.length > 0;

  // ── Operational Metrics (chevron parent — children hidden in short mode)
  rows.push(headerRow("Operational Metrics", years.map(() => 0)));
  rows.push(childRow("Total Rooms Available", years.map((_, i) => c(i)?.availableRooms ?? 0), { format: "number" }));
  const adrVals = years.map((_, i) => { const sold = c(i)?.soldRooms ?? 0; return sold > 0 ? (c(i)?.revenueRooms ?? 0) / sold : 0; });
  rows.push(childRow("ADR (Effective)", adrVals, { format: "currency" }));
  const occVals = years.map((_, i) => { const sold = c(i)?.soldRooms ?? 0; const avail = c(i)?.availableRooms ?? 0; return avail > 0 ? sold / avail : 0; });
  rows.push(childRow("Occupancy", occVals, { format: "percentage" }));
  const revparVals = years.map((_, i) => { const rev = c(i)?.revenueRooms ?? 0; const avail = c(i)?.availableRooms ?? 0; return avail > 0 ? rev / avail : 0; });
  rows.push(childRow("RevPAR", revparVals, { format: "currency" }));

  // ── Total Revenue
  rows.push(headerRow("Total Revenue", years.map((_, i) => c(i)?.revenueTotal ?? 0)));
  rows.push(childRow("Room Revenue", years.map((_, i) => c(i)?.revenueRooms ?? 0)));
  rows.push(childRow("Event Revenue", years.map((_, i) => c(i)?.revenueEvents ?? 0)));
  rows.push(childRow("F&B Revenue", years.map((_, i) => c(i)?.revenueFB ?? 0)));
  rows.push(childRow("Other Revenue", years.map((_, i) => c(i)?.revenueOther ?? 0)));
  if (hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push(grandchildRow(name, years.map((_, i) => p(idx, i)?.revenueTotal ?? 0)));
    });
  }

  // ── Departmental Expenses
  const deptExpTotal = (i: number) => {
    const d = c(i); if (!d) return 0;
    return d.expenseRooms + d.expenseFB + d.expenseEvents + d.expenseOther;
  };
  rows.push(headerRow("Departmental Expenses", years.map((_, i) => deptExpTotal(i))));
  rows.push(childRow("Room Expense", years.map((_, i) => c(i)?.expenseRooms ?? 0)));
  rows.push(childRow("F&B Expense", years.map((_, i) => c(i)?.expenseFB ?? 0)));
  rows.push(childRow("Event Expense", years.map((_, i) => c(i)?.expenseEvents ?? 0)));
  rows.push(childRow("Other Departmental Expense", years.map((_, i) => c(i)?.expenseOther ?? 0)));

  // ── Undistributed Operating Expenses
  const undistExpTotal = (i: number) => {
    const d = c(i); if (!d) return 0;
    return d.expenseMarketing + d.expensePropertyOps + d.expenseAdmin +
      d.expenseIT + d.expenseInsurance + d.expenseUtilitiesVar + d.expenseUtilitiesFixed + d.expenseOtherCosts;
  };
  rows.push(headerRow("Undistributed Operating Expenses", years.map((_, i) => undistExpTotal(i))));
  rows.push(childRow("Marketing & Sales", years.map((_, i) => c(i)?.expenseMarketing ?? 0)));
  rows.push(childRow("Property Operations & Maintenance", years.map((_, i) => c(i)?.expensePropertyOps ?? 0)));
  rows.push(childRow("Admin & General", years.map((_, i) => c(i)?.expenseAdmin ?? 0)));
  rows.push(childRow("IT & Technology", years.map((_, i) => c(i)?.expenseIT ?? 0)));
  rows.push(childRow("Insurance", years.map((_, i) => c(i)?.expenseInsurance ?? 0)));
  rows.push(childRow("Utilities", years.map((_, i) => (c(i)?.expenseUtilitiesVar ?? 0) + (c(i)?.expenseUtilitiesFixed ?? 0))));
  rows.push(childRow("Other Undistributed", years.map((_, i) => c(i)?.expenseOtherCosts ?? 0)));

  // ── Gross Operating Profit (GOP)
  rows.push(headerRow("Gross Operating Profit (GOP)", years.map((_, i) => c(i)?.gop ?? 0)));
  if (hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push(childRow(name, years.map((_, i) => p(idx, i)?.gop ?? 0)));
    });
  }

  // ── Management Fees
  rows.push(headerRow("Management Fees", years.map((_, i) => (c(i)?.feeBase ?? 0) + (c(i)?.feeIncentive ?? 0))));
  rows.push(childRow("Base Fee", years.map((_, i) => c(i)?.feeBase ?? 0)));
  const catSet = new Set<string>();
  for (const yc of yearlyConsolidatedCache) for (const k of Object.keys(yc?.serviceFeesByCategory ?? {})) catSet.add(k);
  catSet.forEach(cat => {
    rows.push(grandchildRow(cat, years.map((_, i) => c(i)?.serviceFeesByCategory?.[cat] ?? 0)));
  });
  rows.push(childRow("Incentive Fee", years.map((_, i) => c(i)?.feeIncentive ?? 0)));

  // ── Adjusted Gross Operating Profit (AGOP)
  rows.push(headerRow("Adjusted Gross Operating Profit (AGOP)", years.map((_, i) => c(i)?.agop ?? 0)));
  if (hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push(childRow(name, years.map((_, i) => p(idx, i)?.agop ?? 0)));
    });
  }

  // ── Fixed Charges
  rows.push(headerRow("Fixed Charges", years.map((_, i) => c(i)?.expenseTaxes ?? 0)));
  rows.push(childRow("Property Taxes", years.map((_, i) => c(i)?.expenseTaxes ?? 0)));

  // ── Net Operating Income (NOI)
  rows.push(headerRow("Net Operating Income (NOI)", years.map((_, i) => c(i)?.noi ?? 0)));
  if (hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push(childRow(name, years.map((_, i) => p(idx, i)?.noi ?? 0)));
    });
  }

  // ── FF&E Reserve
  rows.push(headerRow("FF&E Reserve", years.map((_, i) => c(i)?.expenseFFE ?? 0)));

  // ── Adjusted NOI (ANOI)
  rows.push(headerRow("Adjusted NOI (ANOI)", years.map((_, i) => c(i)?.anoi ?? 0)));
  if (hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push(childRow(name, years.map((_, i) => p(idx, i)?.anoi ?? 0)));
    });
  }

  // ── Debt Service
  rows.push(headerRow("Debt Service", years.map((_, i) => c(i)?.debtPayment ?? 0)));
  rows.push(childRow("Interest Expense", years.map((_, i) => c(i)?.interestExpense ?? 0)));
  rows.push(childRow("Principal Payment", years.map((_, i) => c(i)?.principalPayment ?? 0)));

  // ── Net Income
  rows.push(headerRow("Net Income", years.map((_, i) => c(i)?.netIncome ?? 0)));
  rows.push(childRow("Depreciation", years.map((_, i) => c(i)?.depreciationExpense ?? 0)));
  rows.push(childRow("Income Tax", years.map((_, i) => c(i)?.incomeTax ?? 0)));

  // ── Chart series (matching UI FinancialChart colors)
  const chartSeries: ChartSeries[] = [
    { label: "Revenue", values: years.map((_, i) => c(i)?.revenueTotal ?? 0), color: "#18181b" },
    { label: "GOP", values: years.map((_, i) => c(i)?.gop ?? 0), color: "#3B82F6" },
    { label: "NOI", values: years.map((_, i) => c(i)?.noi ?? 0), color: "#F59E0B" },
    { label: "ANOI", values: years.map((_, i) => c(i)?.anoi ?? 0), color: "#6B7280" },
  ];

  return {
    title: "Consolidated Income Statement",
    years,
    rows,
    chartSeries,
  };
}
