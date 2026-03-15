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
import { propertyEquityInvested } from "@/lib/financial/equityCalculations";
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
    [],
    ["WORKING CAPITAL"],
    ["  Accounts Receivable", ...yearly.map((y) => y.accountsReceivable)],
    ["  Accounts Payable", ...yearly.map((y) => y.accountsPayable)],
    ["  Working Capital Change", ...yearly.map((y) => y.workingCapitalChange)],
    [],
    ["NOL Carryforward Balance", ...yearly.map((y) => y.nolBalance)],
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
  propertyIndex: number,
  companyName?: string
) {
  const XLSX = await import("xlsx");
  const yearly = aggregateByYear(data, years, modelStartDate, fiscalYearStartMonth);
  const cfData = aggregateCashFlowByYear(data, property, global, years);
  const loan = calculateLoanParams(property, global);
  const acquisitionYear = getAcquisitionYear(loan);
  const totalPropertyCost = (property as any).purchasePrice + ((property as any).buildingImprovements ?? 0) + ((property as any).preOpeningCosts ?? 0);

  const wb = (XLSX as any).utils.book_new();
  const safeCompany = (companyName || "Portfolio").replace(/[^a-zA-Z0-9 &\-]/g, "").substring(0, 40);
  const safeProp = propertyName.replace(/[^a-zA-Z0-9 &\-]/g, "").substring(0, 40);

  const isRows = buildPropertyISRows(yearly);
  const isWs = (XLSX as any).utils.aoa_to_sheet(isRows);
  setColumnWidths(isWs, [30, ...yearly.map(() => 16)]);
  await applyCurrencyFormat(isWs, isRows);
  await applyHeaderStyle(isWs, isRows);
  (XLSX as any).utils.book_append_sheet(wb, isWs, "Income Statement");

  const s = computeCashFlowSections(yearly, cfData, loan, acquisitionYear, totalPropertyCost, years);

  const cfHeaders = ["Cash Flow Statement", ...yearly.map((y) => y.label)];
  const cfRows: (string | number)[][] = [
    cfHeaders, [],
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
  const cfWs = (XLSX as any).utils.aoa_to_sheet(cfRows);
  setColumnWidths(cfWs, [38, ...yearly.map(() => 16)]);
  await applyCurrencyFormat(cfWs, cfRows);
  await applyHeaderStyle(cfWs, cfRows);
  (XLSX as any).utils.book_append_sheet(wb, cfWs, "Cash Flow");

  const yearLabels = yearly.map(y => y.label);
  const ppe = (property as any).purchasePrice + ((property as any).buildingImprovements ?? 0);
  const equityInvestedVal = propertyEquityInvested(property as any);

  const bsYearlyData = Array.from({ length: years }, (_, y) => {
    const monthsToInclude = (y + 1) * 12;
    const relevantMonths = data.slice(0, monthsToInclude);
    const lastMonth = relevantMonths[relevantMonths.length - 1];
    if (!lastMonth) return { accDep: 0, cash: 0, netPropValue: ppe, totalAssets: ppe, debt: 0, retained: 0 };

    const accDep = relevantMonths.reduce((sum, m) => sum + m.depreciationExpense, 0);
    const operatingReserve = (property as any).operatingReserve ?? 0;
    const cumulativeNOI = relevantMonths.reduce((sum, m) => sum + m.noi, 0);
    const cumulativeDS = relevantMonths.reduce((sum, m) => sum + m.interestExpense + m.principalPayment, 0);
    const cumulativeTax = relevantMonths.reduce((sum, m) => sum + m.incomeTax, 0);
    const cumulativeRefi = relevantMonths.reduce((sum, m) => sum + m.refinancingProceeds, 0);
    const cash = operatingReserve + (cumulativeNOI - cumulativeDS - cumulativeTax) + cumulativeRefi;
    const netPropValue = ppe - accDep;
    return {
      accDep,
      cash,
      netPropValue,
      totalAssets: netPropValue + cash,
      debt: lastMonth.debtOutstanding,
      retained: relevantMonths.reduce((sum, m) => sum + m.cashFlow, 0),
    };
  });

  const bsRows: (string | number)[][] = [
    ["Balance Sheet", ...yearLabels],
    [],
    ["ASSETS"],
    ["  Property Value (at cost)", ...bsYearlyData.map(() => ppe)],
    ["  Less: Accumulated Depreciation", ...bsYearlyData.map(d => -d.accDep)],
    ["  Net Property Value", ...bsYearlyData.map(d => d.netPropValue)],
    ["  Cash & Reserves", ...bsYearlyData.map(d => d.cash)],
    ["Total Assets", ...bsYearlyData.map(d => d.totalAssets)],
    [],
    ["LIABILITIES"],
    ["  Outstanding Debt", ...bsYearlyData.map(d => d.debt)],
    ["Total Liabilities", ...bsYearlyData.map(d => d.debt)],
    [],
    ["EQUITY"],
    ["  Initial Equity Invested", ...bsYearlyData.map(() => equityInvestedVal)],
    ["  Retained Earnings", ...bsYearlyData.map(d => d.retained)],
    ["Total Equity", ...bsYearlyData.map(d => equityInvestedVal + d.retained)],
    [],
    ["Total Liabilities + Equity", ...bsYearlyData.map(d => d.debt + equityInvestedVal + d.retained)],
  ];

  const bsWs = (XLSX as any).utils.aoa_to_sheet(bsRows);
  setColumnWidths(bsWs, [30, ...yearLabels.map(() => 16)]);
  await applyCurrencyFormat(bsWs, bsRows);
  await applyHeaderStyle(bsWs, bsRows);
  (XLSX as any).utils.book_append_sheet(wb, bsWs, "Balance Sheet");

  const totalExitValue = cfData.reduce((sum, cf) => sum + cf.exitValue, 0);
  const totalCashFlow = data.reduce((sum, m) => sum + m.cashFlow, 0);
  const cashOnCash = equityInvestedVal > 0 ? (totalCashFlow / equityInvestedVal) * 100 : 0;
  const equityMultiple = equityInvestedVal > 0 ? (totalCashFlow + totalExitValue) / equityInvestedVal : 0;

  const iaRows: (string | number)[][] = [
    ["Investment Analysis", ...yearLabels],
    [],
    ["PROPERTY METRICS"],
    ["  Initial Equity Invested", ...yearly.map(() => equityInvestedVal)],
    ["  Total Exit Value", ...yearly.map(() => totalExitValue)],
    ["  Equity Multiple", ...yearly.map(() => equityMultiple)],
    ["  Cash-on-Cash Return (%)", ...yearly.map(() => cashOnCash)],
    [],
    ["ANNUAL PERFORMANCE"],
    ["  Net Operating Income (NOI)", ...yearly.map(y => y.noi)],
    ["  Adjusted NOI (ANOI)", ...yearly.map(y => y.anoi)],
    ["  GAAP Net Income", ...yearly.map(y => y.netIncome)],
    ["  Cash Flow", ...yearly.map((_, i) => cfData[i]?.freeCashFlowToEquity ?? 0)],
  ];

  const iaWs = (XLSX as any).utils.aoa_to_sheet(iaRows);
  setColumnWidths(iaWs, [30, ...yearLabels.map(() => 16)]);
  await applyCurrencyFormat(iaWs, iaRows);
  await applyHeaderStyle(iaWs, iaRows);
  (XLSX as any).utils.book_append_sheet(wb, iaWs, "Investment Analysis");

  await downloadWorkbook(wb, `${safeCompany} - ${safeProp} Financial Statements.xlsx`);
}
