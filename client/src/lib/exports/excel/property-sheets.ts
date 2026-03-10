import {
  MonthlyFinancials,
  CompanyMonthlyFinancials,
  getFiscalYearForModelYear
} from "@/lib/financialEngine";
import {
  LoanParams,
  GlobalLoanParams,
  calculateLoanParams,
  getAcquisitionYear,
} from "@/lib/financial/loanCalculations";
import {
  PROJECTION_YEARS,
} from "@/lib/constants";
import { aggregateCashFlowByYear } from "@/lib/financial/cashFlowAggregator";
import { computeCashFlowSections } from "@/lib/financial/cashFlowSections";
import {
  applyCurrencyFormat,
  applyHeaderStyle,
  setColumnWidths,
  downloadWorkbook,
  aggregateByYear
} from "./helpers";
import { YearlyAggregation } from "./types";

/**
 * Build the row data for a single-property Income Statement following the
 * USALI layout: Revenue → Operating Expenses → GOP → Non-operating → NOI →
 * Below-NOI items → GAAP Net Income.
 */
export function buildPropertyISRows(yearly: YearlyAggregation[]): (string | number)[][] {
  return [
    ["Income Statement", ...yearly.map((y) => y.label)],
    [],
    ["REVENUE"],
    ["  ADR", ...yearly.map((y) => (y.soldRooms > 0 ? y.revenueRooms / y.soldRooms : 0))],
    ["  Occupancy %", ...yearly.map((y) => y.availableRooms > 0 ? Number(((y.soldRooms / y.availableRooms) * 100).toFixed(1)) : 0)],
    ["  RevPAR", ...yearly.map((y) => y.availableRooms > 0 ? y.revenueRooms / y.availableRooms : 0)],
    ["  Room Revenue", ...yearly.map((y) => y.revenueRooms)],
    ["  Food & Beverage", ...yearly.map((y) => y.revenueFB)],
    ["  Events & Functions", ...yearly.map((y) => y.revenueEvents)],
    ["  Other Revenue", ...yearly.map((y) => y.revenueOther)],
    ["Total Revenue", ...yearly.map((y) => y.revenueTotal)],
    [],
    ["OPERATING EXPENSES"],
    ["  Housekeeping", ...yearly.map((y) => y.expenseRooms)],
    ["  Food & Beverage", ...yearly.map((y) => y.expenseFB)],
    ["  Events & Functions", ...yearly.map((y) => y.expenseEvents)],
    ["  Other Departments", ...yearly.map((y) => y.expenseOther)],
    ["  Sales & Marketing", ...yearly.map((y) => y.expenseMarketing)],
    ["  Property Operations", ...yearly.map((y) => y.expensePropertyOps)],
    ["  Utilities", ...yearly.map((y) => y.expenseUtilities)],
    ["  Administrative & General", ...yearly.map((y) => y.expenseAdmin)],
    ["  IT & Technology", ...yearly.map((y) => y.expenseIT)],
    ["  Other Costs", ...yearly.map((y) => y.expenseOtherCosts)],
    [],
    ["Gross Operating Profit (GOP)", ...yearly.map((y) => y.gop)],
    [],
    ["NON-OPERATING EXPENSES"],
    ["  Base Management Fee", ...yearly.map((y) => y.feeBase)],
    ["  Incentive Management Fee", ...yearly.map((y) => y.feeIncentive)],
    [],
    ["Adjusted GOP (AGOP)", ...yearly.map((y) => y.agop)],
    [],
    ["FIXED CHARGES"],
    ["  Insurance", ...yearly.map((y) => y.expenseInsurance)],
    ["  Property Taxes", ...yearly.map((y) => y.expenseTaxes)],
    [],
    ["Net Operating Income (NOI)", ...yearly.map((y) => y.noi)],
    [],
    ["FF&E Reserve", ...yearly.map((y) => y.expenseFFE)],
    ["Adjusted NOI (ANOI)", ...yearly.map((y) => y.anoi)],
    [],
    ["BELOW NOI"],
    ["  Interest Expense", ...yearly.map((y) => y.interestExpense)],
    ["  Depreciation", ...yearly.map((y) => y.depreciationExpense)],
    ["  Income Tax", ...yearly.map((y) => y.incomeTax)],
    [],
    ["GAAP Net Income", ...yearly.map((y) => y.netIncome)],
  ];
}

/**
 * Download a single-property Income Statement as an Excel file.
 */
export async function exportPropertyIncomeStatement(
  data: MonthlyFinancials[],
  propertyName: string,
  years: number,
  modelStartDate: string,
  fiscalYearStartMonth: number
) {
  const XLSX = await import("xlsx");
  const yearly = aggregateByYear(data, years, modelStartDate, fiscalYearStartMonth);
  const rows = buildPropertyISRows(yearly);

  const ws = (XLSX as any).utils.aoa_to_sheet(rows);
  setColumnWidths(ws, [30, ...yearly.map(() => 16)]);
  await applyCurrencyFormat(ws, rows);
  await applyHeaderStyle(ws, rows);

  const wb = (XLSX as any).utils.book_new();
  (XLSX as any).utils.book_append_sheet(wb, ws, "Income Statement");

  const safeName = propertyName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
  await downloadWorkbook(wb, `${safeName} - Income Statement.xlsx`);
}

/**
 * Download a single-property Cash Flow Statement (ASC 230 format) as Excel.
 */
export async function exportPropertyCashFlow(
  data: MonthlyFinancials[],
  property: LoanParams,
  global: GlobalLoanParams | undefined,
  propertyName: string,
  years: number,
  modelStartDate: string,
  fiscalYearStartMonth: number
) {
  const XLSX = await import("xlsx");
  const yearly = aggregateByYear(data, years, modelStartDate, fiscalYearStartMonth);
  const cfData = aggregateCashFlowByYear(data, property, global, years);
  const loan = calculateLoanParams(property, global);
  const acquisitionYear = getAcquisitionYear(loan);
  const totalPropertyCost = (property as any).purchasePrice + ((property as any).buildingImprovements ?? 0) + ((property as any).preOpeningCosts ?? 0);

  const s = computeCashFlowSections(yearly, cfData, loan, acquisitionYear, totalPropertyCost, years);

  const headers = ["Cash Flow Statement", ...yearly.map((y) => y.label)];

  const rows: (string | number)[][] = [
    headers,
    [],
    ["CASH FLOW FROM OPERATING ACTIVITIES"],
    ["  Cash Received from Guests & Clients", ...yearly.map((y) => y.revenueTotal)],
    ["    Guest Room Revenue", ...yearly.map((y) => y.revenueRooms)],
    ["    Event & Venue Revenue", ...yearly.map((y) => y.revenueEvents)],
    ["    Food & Beverage Revenue", ...yearly.map((y) => y.revenueFB)],
    ["    Other Revenue", ...yearly.map((y) => y.revenueOther)],
    ["  Cash Paid for Operating Expenses", ...yearly.map((y) => -(y.totalExpenses - y.expenseFFE))],
    ["    Housekeeping & Room Operations", ...yearly.map((y) => y.expenseRooms)],
    ["    Food & Beverage Costs", ...yearly.map((y) => y.expenseFB)],
    ["    Event Operations", ...yearly.map((y) => y.expenseEvents)],
    ["    Marketing & Platform Fees", ...yearly.map((y) => y.expenseMarketing)],
    ["    Property Operations & Maintenance", ...yearly.map((y) => y.expensePropertyOps)],
    ["    Utilities (Variable)", ...yearly.map((y) => y.expenseUtilitiesVar)],
    ["    Utilities (Fixed)", ...yearly.map((y) => y.expenseUtilitiesFixed)],
    ["    Insurance", ...yearly.map((y) => y.expenseInsurance)],
    ["    Property Taxes", ...yearly.map((y) => y.expenseTaxes)],
    ["    Administrative & Compliance", ...yearly.map((y) => y.expenseAdmin)],
    ["    IT Systems", ...yearly.map((y) => y.expenseIT)],
    ["    Other Operating Costs", ...yearly.map((y) => y.expenseOther)],
    ["    Base Management Fee", ...yearly.map((y) => y.feeBase)],
    ["    Incentive Management Fee", ...yearly.map((y) => y.feeIncentive)],
    ["  Less: Interest Paid", ...cfData.map((cf) => -cf.interestExpense)],
    ["  Less: Income Taxes Paid", ...cfData.map((cf) => -cf.taxLiability)],
    ["Net Cash from Operating Activities", ...s.cashFromOperations],
    [],
    ["CASH FLOW FROM INVESTING ACTIVITIES"],
    ["  Property Acquisition", ...cfData.map((_, i) => (i === acquisitionYear ? -totalPropertyCost : 0))],
    ["  FF&E Reserve / Capital Improvements", ...yearly.map((y) => -y.expenseFFE)],
    ["  Sale Proceeds (Net Exit Value)", ...cfData.map((cf) => cf.exitValue)],
    ["Net Cash from Investing Activities", ...s.cashFromInvesting],
    [],
    ["CASH FLOW FROM FINANCING ACTIVITIES"],
    ["  Equity Contribution", ...cfData.map((_, i) => (i === acquisitionYear ? loan.equityInvested : 0))],
    ["  Loan Proceeds", ...cfData.map((_, i) => (i === acquisitionYear && loan.loanAmount > 0 ? loan.loanAmount : 0))],
    ["  Less: Principal Repayments", ...cfData.map((cf) => -cf.principalPayment)],
    ["  Refinancing Proceeds", ...cfData.map((cf) => cf.refinancingProceeds)],
    ["Net Cash from Financing Activities", ...s.cashFromFinancing],
    [],
    ["Net Increase (Decrease) in Cash", ...s.netChangeCash],
    ["Opening Cash Balance", ...s.openingCash],
    ["Closing Cash Balance", ...s.closingCash],
    [],
    ["FREE CASH FLOW"],
    ["  Net Cash from Operating Activities", ...s.cashFromOperations],
    ["  Less: Capital Expenditures (FF&E)", ...yearly.map((y) => -y.expenseFFE)],
    ["  Free Cash Flow (FCF)", ...s.fcf],
    ["  Less: Principal Payments", ...cfData.map((cf) => -cf.principalPayment)],
    ["  Free Cash Flow to Equity (FCFE)", ...s.fcfe],
  ];

  const ws = (XLSX as any).utils.aoa_to_sheet(rows);
  setColumnWidths(ws, [38, ...yearly.map(() => 16)]);
  await applyCurrencyFormat(ws, rows);
  await applyHeaderStyle(ws, rows);

  const wb = (XLSX as any).utils.book_new();
  (XLSX as any).utils.book_append_sheet(wb, ws, "Cash Flow");

  const safeName = propertyName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
  await downloadWorkbook(wb, `${safeName} - Cash Flow.xlsx`);
}

/**
 * Download a multi-sheet Excel workbook for a single property.
 */
export async function exportFullPropertyWorkbook(
  data: MonthlyFinancials[],
  property: LoanParams,
  properties: LoanParams[],
  global: GlobalLoanParams | undefined,
  globalAssumptions: any,
  allProFormas: { property: LoanParams; data: MonthlyFinancials[] }[],
  propertyName: string,
  years: number,
  modelStartDate: string,
  fiscalYearStartMonth: number,
  propertyIndex: number
) {
  const XLSX = await import("xlsx");
  const yearly = aggregateByYear(data, years, modelStartDate, fiscalYearStartMonth);
  const cfData = aggregateCashFlowByYear(data, property, global, years);
  const loan = calculateLoanParams(property, global);
  const acquisitionYear = getAcquisitionYear(loan);
  const totalPropertyCost = (property as any).purchasePrice + ((property as any).buildingImprovements ?? 0) + ((property as any).preOpeningCosts ?? 0);

  const wb = (XLSX as any).utils.book_new();
  const safeName = propertyName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);

  // Income Statement sheet — uses shared row builder
  const isRows = buildPropertyISRows(yearly);
  const isWs = (XLSX as any).utils.aoa_to_sheet(isRows);
  setColumnWidths(isWs, [30, ...yearly.map(() => 16)]);
  await applyCurrencyFormat(isWs, isRows);
  await applyHeaderStyle(isWs, isRows);
  (XLSX as any).utils.book_append_sheet(wb, isWs, "Income Statement");

  // Cash Flow sheet — uses shared CF sections computation
  const s = computeCashFlowSections(yearly, cfData, loan, acquisitionYear, totalPropertyCost, years);

  const cfHeaders = ["Cash Flow Statement", ...yearly.map((y) => y.label)];
  const cfRows: (string | number)[][] = [
    cfHeaders, [],
    ["CASH FLOW FROM OPERATING ACTIVITIES"],
    ["  Cash Received", ...yearly.map((y) => y.revenueTotal)],
    ["  Cash Paid for Expenses", ...yearly.map((y) => -(y.totalExpenses - y.expenseFFE))],
    ["  Less: Interest Paid", ...cfData.map((cf) => -cf.interestExpense)],
    ["  Less: Income Taxes Paid", ...cfData.map((cf) => -cf.taxLiability)],
    ["Net Cash from Operating Activities", ...s.cashFromOperations],
    [],
    ["CASH FLOW FROM INVESTING ACTIVITIES"],
    ["  Property Acquisition", ...cfData.map((_, i) => (i === acquisitionYear ? -totalPropertyCost : 0))],
    ["  FF&E Reserve", ...yearly.map((y) => -y.expenseFFE)],
    ["  Sale Proceeds", ...cfData.map((cf) => cf.exitValue)],
    ["Net Cash from Investing Activities", ...s.cashFromInvesting],
    [],
    ["CASH FLOW FROM FINANCING ACTIVITIES"],
    ["  Equity Contribution", ...cfData.map((_, i) => (i === acquisitionYear ? loan.equityInvested : 0))],
    ["  Loan Proceeds", ...cfData.map((_, i) => (i === acquisitionYear && loan.loanAmount > 0 ? loan.loanAmount : 0))],
    ["  Less: Principal Repayments", ...cfData.map((cf) => -cf.principalPayment)],
    ["  Refinancing Proceeds", ...cfData.map((cf) => cf.refinancingProceeds)],
    ["Net Cash from Financing Activities", ...s.cashFromFinancing],
    [],
    ["Net Increase (Decrease) in Cash", ...s.netChangeCash],
    ["Opening Cash Balance", ...s.openingCash],
    ["Closing Cash Balance", ...s.closingCash],
  ];
  const cfWs = (XLSX as any).utils.aoa_to_sheet(cfRows);
  setColumnWidths(cfWs, [38, ...yearly.map(() => 16)]);
  await applyCurrencyFormat(cfWs, cfRows);
  await applyHeaderStyle(cfWs, cfRows);
  (XLSX as any).utils.book_append_sheet(wb, cfWs, "Cash Flow");

  await downloadWorkbook(wb, `${safeName} - Full Workbook.xlsx`);
}
