import * as XLSX from "xlsx";
import { MonthlyFinancials, CompanyMonthlyFinancials, getFiscalYearForModelYear } from "./financialEngine";
import {
  LoanParams,
  GlobalLoanParams,
  calculateLoanParams,
  getAcquisitionYear,
  YearlyCashFlowResult,
  DEFAULT_LTV,
  DEFAULT_COMMISSION_RATE,
} from "./loanCalculations";
import {
  PROJECTION_YEARS,
  DEFAULT_EXIT_CAP_RATE,
} from "./constants";

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

function setColumnWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
}

interface YearlyAggregation {
  year: number;
  label: string;
  soldRooms: number;
  availableRooms: number;
  revenueRooms: number;
  revenueFB: number;
  revenueEvents: number;
  revenueOther: number;
  revenueTotal: number;
  expenseRooms: number;
  expenseFB: number;
  expenseEvents: number;
  expenseOther: number;
  expenseMarketing: number;
  expensePropertyOps: number;
  expenseUtilities: number;
  expenseUtilitiesVar: number;
  expenseUtilitiesFixed: number;
  expenseAdmin: number;
  expenseIT: number;
  expenseInsurance: number;
  expenseTaxes: number;
  expenseOtherCosts: number;
  expenseFFE: number;
  feeBase: number;
  feeIncentive: number;
  totalExpenses: number;
  gop: number;
  noi: number;
  interestExpense: number;
  depreciationExpense: number;
  incomeTax: number;
  netIncome: number;
  principalPayment: number;
  debtPayment: number;
  cashFlow: number;
  refinancingProceeds: number;
  operatingCashFlow: number;
  financingCashFlow: number;
  endingCash: number;
}

function aggregateByYear(
  data: MonthlyFinancials[],
  years: number,
  modelStartDate: string,
  fiscalYearStartMonth: number
): YearlyAggregation[] {
  const result: YearlyAggregation[] = [];
  for (let y = 0; y < years; y++) {
    const yearData = data.slice(y * 12, (y + 1) * 12);
    if (yearData.length === 0) continue;
    const fyLabel = getFiscalYearForModelYear(modelStartDate, fiscalYearStartMonth, y);
    result.push({
      year: y,
      label: String(fyLabel),
      soldRooms: yearData.reduce((a, m) => a + m.soldRooms, 0),
      availableRooms: yearData.reduce((a, m) => a + m.availableRooms, 0),
      revenueRooms: yearData.reduce((a, m) => a + m.revenueRooms, 0),
      revenueFB: yearData.reduce((a, m) => a + m.revenueFB, 0),
      revenueEvents: yearData.reduce((a, m) => a + m.revenueEvents, 0),
      revenueOther: yearData.reduce((a, m) => a + m.revenueOther, 0),
      revenueTotal: yearData.reduce((a, m) => a + m.revenueTotal, 0),
      expenseRooms: yearData.reduce((a, m) => a + m.expenseRooms, 0),
      expenseFB: yearData.reduce((a, m) => a + m.expenseFB, 0),
      expenseEvents: yearData.reduce((a, m) => a + m.expenseEvents, 0),
      expenseOther: yearData.reduce((a, m) => a + m.expenseOther, 0),
      expenseMarketing: yearData.reduce((a, m) => a + m.expenseMarketing, 0),
      expensePropertyOps: yearData.reduce((a, m) => a + m.expensePropertyOps, 0),
      expenseUtilities: yearData.reduce((a, m) => a + m.expenseUtilitiesVar + m.expenseUtilitiesFixed, 0),
      expenseUtilitiesVar: yearData.reduce((a, m) => a + m.expenseUtilitiesVar, 0),
      expenseUtilitiesFixed: yearData.reduce((a, m) => a + m.expenseUtilitiesFixed, 0),
      expenseAdmin: yearData.reduce((a, m) => a + m.expenseAdmin, 0),
      expenseIT: yearData.reduce((a, m) => a + m.expenseIT, 0),
      expenseInsurance: yearData.reduce((a, m) => a + m.expenseInsurance, 0),
      expenseTaxes: yearData.reduce((a, m) => a + m.expenseTaxes, 0),
      expenseOtherCosts: yearData.reduce((a, m) => a + m.expenseOtherCosts, 0),
      expenseFFE: yearData.reduce((a, m) => a + m.expenseFFE, 0),
      feeBase: yearData.reduce((a, m) => a + m.feeBase, 0),
      feeIncentive: yearData.reduce((a, m) => a + m.feeIncentive, 0),
      totalExpenses: yearData.reduce((a, m) => a + m.totalExpenses, 0),
      gop: yearData.reduce((a, m) => a + m.gop, 0),
      noi: yearData.reduce((a, m) => a + m.noi, 0),
      interestExpense: yearData.reduce((a, m) => a + m.interestExpense, 0),
      depreciationExpense: yearData.reduce((a, m) => a + m.depreciationExpense, 0),
      incomeTax: yearData.reduce((a, m) => a + m.incomeTax, 0),
      netIncome: yearData.reduce((a, m) => a + m.netIncome, 0),
      principalPayment: yearData.reduce((a, m) => a + m.principalPayment, 0),
      debtPayment: yearData.reduce((a, m) => a + m.debtPayment, 0),
      cashFlow: yearData.reduce((a, m) => a + m.cashFlow, 0),
      refinancingProceeds: yearData.reduce((a, m) => a + m.refinancingProceeds, 0),
      operatingCashFlow: yearData.reduce((a, m) => a + m.operatingCashFlow, 0),
      financingCashFlow: yearData.reduce((a, m) => a + m.financingCashFlow, 0),
      endingCash: yearData.length > 0 ? yearData[yearData.length - 1].endingCash : 0,
    });
  }
  return result;
}

function buildCashFlowData(
  data: MonthlyFinancials[],
  property: LoanParams,
  global: GlobalLoanParams | undefined,
  years: number
): YearlyCashFlowResult[] {
  const loan = calculateLoanParams(property, global);
  const acquisitionYear = getAcquisitionYear(loan);
  const results: YearlyCashFlowResult[] = [];
  let cumulative = 0;

  for (let y = 0; y < years; y++) {
    const yearData = data.slice(y * 12, (y + 1) * 12);
    const noi = yearData.reduce((a, m) => a + m.noi, 0);
    const interestExpense = yearData.reduce((a, m) => a + m.interestExpense, 0);
    const principalPayment = yearData.reduce((a, m) => a + m.principalPayment, 0);
    const debtService = yearData.reduce((a, m) => a + m.debtPayment, 0);
    const depreciationExpense = yearData.reduce((a, m) => a + m.depreciationExpense, 0);
    const taxLiability = yearData.reduce((a, m) => a + m.incomeTax, 0);
    const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
    const refiProceeds = yearData.reduce((a, m) => a + m.refinancingProceeds, 0);
    const expenseFFE = yearData.reduce((a, m) => a + m.expenseFFE, 0);

    const operatingCashFlow = netIncome + depreciationExpense;
    const workingCapitalChange = 0;
    const cashFromOperations = operatingCashFlow + workingCapitalChange;
    const freeCashFlow = cashFromOperations - expenseFFE;
    const freeCashFlowToEquity = freeCashFlow - principalPayment;
    const btcf = noi - debtService;
    const taxableIncome = noi - interestExpense - depreciationExpense;
    const atcf = btcf - taxLiability;

    const exitCapRate = property.exitCapRate ?? global?.exitCapRate ?? DEFAULT_EXIT_CAP_RATE;
    const commissionRate = global?.commissionRate ?? (global as any)?.salesCommissionRate ?? DEFAULT_COMMISSION_RATE;
    const isLastYear = y === years - 1;
    let exitValue = 0;
    if (isLastYear && exitCapRate > 0) {
      const grossValue = noi / exitCapRate;
      const commission = grossValue * commissionRate;
      const outstandingDebt = yearData.length > 0 ? yearData[yearData.length - 1].debtOutstanding : 0;
      exitValue = grossValue - commission - outstandingDebt;
    }

    const capitalExpenditures = y === acquisitionYear ? loan.equityInvested : 0;
    const netCashFlowToInvestors = atcf + refiProceeds + (isLastYear ? exitValue : 0) - (y === acquisitionYear ? loan.equityInvested : 0);
    cumulative += netCashFlowToInvestors;

    results.push({
      year: y,
      noi,
      interestExpense,
      depreciation: depreciationExpense,
      netIncome,
      taxLiability,
      operatingCashFlow,
      workingCapitalChange,
      cashFromOperations,
      maintenanceCapex: expenseFFE,
      freeCashFlow,
      principalPayment,
      debtService,
      freeCashFlowToEquity,
      btcf,
      taxableIncome,
      atcf,
      capitalExpenditures,
      refinancingProceeds: refiProceeds,
      exitValue,
      netCashFlowToInvestors,
      cumulativeCashFlow: cumulative,
    });
  }

  return results;
}

export function exportPropertyIncomeStatement(
  data: MonthlyFinancials[],
  propertyName: string,
  years: number,
  modelStartDate: string,
  fiscalYearStartMonth: number
) {
  const yearly = aggregateByYear(data, years, modelStartDate, fiscalYearStartMonth);
  const headers = ["Income Statement", ...yearly.map((y) => y.label)];

  const rows: (string | number)[][] = [
    headers,
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
    ["  Insurance", ...yearly.map((y) => y.expenseInsurance)],
    ["  Property Taxes", ...yearly.map((y) => y.expenseTaxes)],
    ["  Other Costs", ...yearly.map((y) => y.expenseOtherCosts)],
    [],
    ["Gross Operating Profit (GOP)", ...yearly.map((y) => y.gop)],
    [],
    ["NON-OPERATING EXPENSES"],
    ["  Base Management Fee", ...yearly.map((y) => y.feeBase)],
    ["  Incentive Management Fee", ...yearly.map((y) => y.feeIncentive)],
    ["  FF&E Reserve", ...yearly.map((y) => y.expenseFFE)],
    [],
    ["Net Operating Income (NOI)", ...yearly.map((y) => y.noi)],
    [],
    ["BELOW NOI"],
    ["  Interest Expense", ...yearly.map((y) => y.interestExpense)],
    ["  Depreciation", ...yearly.map((y) => y.depreciationExpense)],
    ["  Income Tax", ...yearly.map((y) => y.incomeTax)],
    [],
    ["GAAP Net Income", ...yearly.map((y) => y.netIncome)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  setColumnWidths(ws, [30, ...yearly.map(() => 16)]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Income Statement");

  const safeName = propertyName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
  downloadWorkbook(wb, `${safeName} - Income Statement.xlsx`);
}

export function exportPropertyCashFlow(
  data: MonthlyFinancials[],
  property: LoanParams,
  global: GlobalLoanParams | undefined,
  propertyName: string,
  years: number,
  modelStartDate: string,
  fiscalYearStartMonth: number
) {
  const yearly = aggregateByYear(data, years, modelStartDate, fiscalYearStartMonth);
  const cfData = buildCashFlowData(data, property, global, years);
  const loan = calculateLoanParams(property, global);
  const acquisitionYear = getAcquisitionYear(loan);
  const totalPropertyCost = (property as any).purchasePrice + ((property as any).buildingImprovements ?? 0) + ((property as any).preOpeningCosts ?? 0);

  const cfoValues = yearly.map((yd, i) => {
    return yd.revenueTotal - (yd.totalExpenses - yd.expenseFFE) - cfData[i].interestExpense - cfData[i].taxLiability;
  });
  const cfiValues = cfData.map((cf, i) => {
    const ffe = yearly[i].expenseFFE;
    const acqCost = i === acquisitionYear ? totalPropertyCost : 0;
    return -acqCost - ffe + cf.exitValue;
  });
  const cffValues = cfData.map((cf, i) => {
    const eqContrib = i === acquisitionYear ? loan.equityInvested : 0;
    const loanProceeds = i === acquisitionYear && loan.loanAmount > 0 ? loan.loanAmount : 0;
    return eqContrib + loanProceeds - cf.principalPayment + cf.refinancingProceeds;
  });
  const netChange = cfoValues.map((cfo, i) => cfo + cfiValues[i] + cffValues[i]);
  let runCash = 0;
  const openCash: number[] = [];
  const closeCash: number[] = [];
  for (let i = 0; i < years; i++) {
    openCash.push(runCash);
    runCash += netChange[i];
    closeCash.push(runCash);
  }

  const headers = ["Cash Flow Statement", ...yearly.map((y) => y.label)];

  const rows: (string | number)[][] = [
    headers,
    [],
    ["OPERATING CASH FLOW"],
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
    ["Cash from Operations", ...cfoValues],
    [],
    ["INVESTING CASH FLOW"],
    ["  Property Acquisition", ...cfData.map((_, i) => (i === acquisitionYear ? -totalPropertyCost : 0))],
    ["  FF&E Reserve / Capital Improvements", ...yearly.map((y) => -y.expenseFFE)],
    ["  Sale Proceeds (Net Exit Value)", ...cfData.map((cf) => cf.exitValue)],
    ["Cash from Investing", ...cfiValues],
    [],
    ["FINANCING CASH FLOW"],
    ["  Equity Contribution", ...cfData.map((_, i) => (i === acquisitionYear ? loan.equityInvested : 0))],
    ["  Loan Proceeds", ...cfData.map((_, i) => (i === acquisitionYear && loan.loanAmount > 0 ? loan.loanAmount : 0))],
    ["  Less: Principal Repayments", ...cfData.map((cf) => -cf.principalPayment)],
    ["  Refinancing Proceeds", ...cfData.map((cf) => cf.refinancingProceeds)],
    ["Cash from Financing", ...cffValues],
    [],
    ["Net Increase (Decrease) in Cash", ...netChange],
    ["Opening Cash Balance", ...openCash],
    ["Closing Cash Balance", ...closeCash],
    [],
    ["FREE CASH FLOW"],
    ["  Cash from Operations", ...cfoValues],
    ["  Less: Capital Expenditures (FF&E)", ...yearly.map((y) => -y.expenseFFE)],
    ["  Free Cash Flow (FCF)", ...cfoValues.map((cfo, i) => cfo - yearly[i].expenseFFE)],
    ["  Less: Principal Payments", ...cfData.map((cf) => -cf.principalPayment)],
    ["  Free Cash Flow to Equity (FCFE)", ...cfoValues.map((cfo, i) => cfo - yearly[i].expenseFFE - cfData[i].principalPayment)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  setColumnWidths(ws, [38, ...yearly.map(() => 16)]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cash Flow");

  const safeName = propertyName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
  downloadWorkbook(wb, `${safeName} - Cash Flow.xlsx`);
}

export function exportPropertyBalanceSheet(
  properties: LoanParams[],
  globalAssumptions: any,
  allProFormas: { property: LoanParams; data: MonthlyFinancials[] }[],
  years: number,
  modelStartDate: string,
  fiscalYearStartMonth: number,
  title: string,
  propertyIndex?: number
) {
  const yearLabels: string[] = [];
  for (let y = 0; y < years; y++) {
    yearLabels.push(String(getFiscalYearForModelYear(modelStartDate, fiscalYearStartMonth, y)));
  }

  const headers = ["Balance Sheet", ...yearLabels];

  const propertiesToShow =
    propertyIndex !== undefined
      ? [{ prop: properties[propertyIndex], idx: propertyIndex }]
      : properties.map((prop, idx) => ({ prop, idx }));

  const yearlyAssets: number[][] = [];

  for (let yearIdx = 0; yearIdx < years; yearIdx++) {
    let totalPropertyValue = 0;
    let totalAccDepreciation = 0;
    let totalCashReserves = 0;
    let totalDebt = 0;
    let totalEquity = 0;
    let totalRetainedEarnings = 0;
    let totalRefiProceeds = 0;

    const monthsToInclude = (yearIdx + 1) * 12;

    propertiesToShow.forEach(({ prop, idx }) => {
      const proForma = allProFormas[idx]?.data || [];
      const relevantMonths = proForma.slice(0, monthsToInclude);

      const modelStart = new Date(modelStartDate);
      const acqDate = (prop as any).acquisitionDate
        ? new Date((prop as any).acquisitionDate)
        : new Date((prop as any).operationsStartDate);
      const acqMonthsFromModelStart = Math.max(
        0,
        (acqDate.getFullYear() - modelStart.getFullYear()) * 12 +
          (acqDate.getMonth() - modelStart.getMonth())
      );
      const acqYear = Math.floor(acqMonthsFromModelStart / 12);
      if (yearIdx + 1 <= acqYear) return;

      const totalPropValue = (prop as any).purchasePrice + ((prop as any).buildingImprovements ?? 0);
      totalPropertyValue += totalPropValue;

      const accDep = relevantMonths.reduce((sum, m) => sum + m.depreciationExpense, 0);
      totalAccDepreciation += accDep;

      const operatingReserve = (prop as any).operatingReserve ?? 0;
      totalCashReserves += operatingReserve;

      const totalInvestment =
        (prop as any).purchasePrice +
        ((prop as any).buildingImprovements ?? 0) +
        ((prop as any).preOpeningCosts ?? 0) +
        operatingReserve;
      const ltv =
        (prop as any).acquisitionLTV ??
        (globalAssumptions.debtAssumptions as any)?.acqLTV ??
        DEFAULT_LTV;
      const loanAmount = (prop as any).type === "Financed" ? totalPropValue * ltv : 0;
      const equityInvested = totalInvestment - loanAmount;
      totalEquity += equityInvested;

      const lastMonthIdx = monthsToInclude - 1;
      const debtOutstanding =
        lastMonthIdx >= 0 && lastMonthIdx < proForma.length
          ? proForma[lastMonthIdx].debtOutstanding
          : 0;
      totalDebt += debtOutstanding;

      let refiProceeds = 0;
      for (let m = 0; m < relevantMonths.length; m++) {
        refiProceeds += relevantMonths[m].refinancingProceeds;
      }
      totalRefiProceeds += refiProceeds;

      const cumulativeCashFlow = relevantMonths.reduce((sum, m) => sum + m.cashFlow, 0);
      totalRetainedEarnings += cumulativeCashFlow;
    });

    const netPropValue = totalPropertyValue - totalAccDepreciation;
    const totalAssets = netPropValue + totalCashReserves;
    const totalLiabilities = totalDebt;
    const totalEquityValue = totalEquity + totalRefiProceeds + totalRetainedEarnings;

    yearlyAssets.push([
      totalPropertyValue,
      -totalAccDepreciation,
      netPropValue,
      totalCashReserves,
      totalAssets,
      totalDebt,
      totalLiabilities,
      totalEquity,
      totalRefiProceeds,
      totalRetainedEarnings,
      totalEquityValue,
      totalLiabilities + totalEquityValue,
    ]);
  }

  const rowLabels = [
    "ASSETS",
    "  Property Value (at cost)",
    "  Less: Accumulated Depreciation",
    "  Net Property Value",
    "  Cash & Reserves",
    "Total Assets",
    "",
    "LIABILITIES",
    "  Outstanding Debt",
    "Total Liabilities",
    "",
    "EQUITY",
    "  Initial Equity Invested",
    "  Refinancing Proceeds",
    "  Retained Earnings",
    "Total Equity",
    "",
    "Total Liabilities + Equity",
  ];

  const dataMapping = [
    -1,
    0, 1, 2, 3, 4,
    -1,
    -1,
    5, 6,
    -1,
    -1,
    7, 8, 9, 10,
    -1,
    11,
  ];

  const dataRows: (string | number)[][] = [headers, []];
  for (let r = 0; r < rowLabels.length; r++) {
    const row: (string | number)[] = [rowLabels[r]];
    const idx = dataMapping[r];
    if (idx >= 0) {
      for (let y = 0; y < years; y++) {
        row.push(yearlyAssets[y][idx]);
      }
    }
    dataRows.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  setColumnWidths(ws, [30, ...yearLabels.map(() => 16)]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet");

  const safeName = title.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
  downloadWorkbook(wb, `${safeName} - Balance Sheet.xlsx`);
}

export function exportCompanyIncomeStatement(
  data: CompanyMonthlyFinancials[],
  years: number,
  modelStartDate: string,
  fiscalYearStartMonth: number
) {
  const yearLabels: string[] = [];
  const yearlyData: {
    label: string;
    baseFee: number;
    incentiveFee: number;
    totalRevenue: number;
    partnerComp: number;
    staffComp: number;
    officeLease: number;
    profServices: number;
    techInfra: number;
    bizInsurance: number;
    travel: number;
    itLicensing: number;
    marketing: number;
    miscOps: number;
    totalExpenses: number;
    netIncome: number;
    safeFunding: number;
    cashFlow: number;
  }[] = [];

  for (let y = 0; y < years; y++) {
    const yearSlice = data.slice(y * 12, (y + 1) * 12);
    if (yearSlice.length === 0) continue;
    const fyLabel = String(getFiscalYearForModelYear(modelStartDate, fiscalYearStartMonth, y));
    yearLabels.push(fyLabel);
    yearlyData.push({
      label: fyLabel,
      baseFee: yearSlice.reduce((a, m) => a + m.baseFeeRevenue, 0),
      incentiveFee: yearSlice.reduce((a, m) => a + m.incentiveFeeRevenue, 0),
      totalRevenue: yearSlice.reduce((a, m) => a + m.totalRevenue, 0),
      partnerComp: yearSlice.reduce((a, m) => a + m.partnerCompensation, 0),
      staffComp: yearSlice.reduce((a, m) => a + m.staffCompensation, 0),
      officeLease: yearSlice.reduce((a, m) => a + m.officeLease, 0),
      profServices: yearSlice.reduce((a, m) => a + m.professionalServices, 0),
      techInfra: yearSlice.reduce((a, m) => a + m.techInfrastructure, 0),
      bizInsurance: yearSlice.reduce((a, m) => a + m.businessInsurance, 0),
      travel: yearSlice.reduce((a, m) => a + m.travelCosts, 0),
      itLicensing: yearSlice.reduce((a, m) => a + m.itLicensing, 0),
      marketing: yearSlice.reduce((a, m) => a + m.marketing, 0),
      miscOps: yearSlice.reduce((a, m) => a + m.miscOps, 0),
      totalExpenses: yearSlice.reduce((a, m) => a + m.totalExpenses, 0),
      netIncome: yearSlice.reduce((a, m) => a + m.netIncome, 0),
      safeFunding: yearSlice.reduce((a, m) => a + m.safeFunding, 0),
      cashFlow: yearSlice.reduce((a, m) => a + m.cashFlow, 0),
    });
  }

  const headers = ["Management Company - Income Statement", ...yearLabels];
  const rows: (string | number)[][] = [
    headers,
    [],
    ["REVENUE"],
    ["  Base Management Fees", ...yearlyData.map((y) => y.baseFee)],
    ["  Incentive Management Fees", ...yearlyData.map((y) => y.incentiveFee)],
    ["Total Revenue", ...yearlyData.map((y) => y.totalRevenue)],
    [],
    ["OPERATING EXPENSES"],
    ["  Partner Compensation", ...yearlyData.map((y) => y.partnerComp)],
    ["  Staff Compensation", ...yearlyData.map((y) => y.staffComp)],
    ["  Office Lease", ...yearlyData.map((y) => y.officeLease)],
    ["  Professional Services", ...yearlyData.map((y) => y.profServices)],
    ["  Technology Infrastructure", ...yearlyData.map((y) => y.techInfra)],
    ["  Business Insurance", ...yearlyData.map((y) => y.bizInsurance)],
    ["  Travel Costs", ...yearlyData.map((y) => y.travel)],
    ["  IT Licensing", ...yearlyData.map((y) => y.itLicensing)],
    ["  Marketing", ...yearlyData.map((y) => y.marketing)],
    ["  Miscellaneous Operations", ...yearlyData.map((y) => y.miscOps)],
    ["Total Expenses", ...yearlyData.map((y) => y.totalExpenses)],
    [],
    ["Net Income", ...yearlyData.map((y) => y.netIncome)],
    [],
    ["FUNDING"],
    ["  SAFE Funding", ...yearlyData.map((y) => y.safeFunding)],
    ["Cash Flow", ...yearlyData.map((y) => y.cashFlow)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  setColumnWidths(ws, [35, ...yearLabels.map(() => 16)]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Company Income Statement");

  downloadWorkbook(wb, "Management Company - Income Statement.xlsx");
}

export function exportCompanyCashFlow(
  data: CompanyMonthlyFinancials[],
  years: number,
  modelStartDate: string,
  fiscalYearStartMonth: number
) {
  const yearLabels: string[] = [];
  const yearlyData: {
    label: string;
    totalRevenue: number;
    baseFee: number;
    incentiveFee: number;
    safeFunding: number;
    totalExpenses: number;
    partnerComp: number;
    staffComp: number;
    officeLease: number;
    profServices: number;
    techInfra: number;
    bizInsurance: number;
    travel: number;
    itLicensing: number;
    marketing: number;
    miscOps: number;
    cashFlow: number;
  }[] = [];

  for (let y = 0; y < years; y++) {
    const yearSlice = data.slice(y * 12, (y + 1) * 12);
    if (yearSlice.length === 0) continue;
    const fyLabel = String(getFiscalYearForModelYear(modelStartDate, fiscalYearStartMonth, y));
    yearLabels.push(fyLabel);
    yearlyData.push({
      label: fyLabel,
      totalRevenue: yearSlice.reduce((a, m) => a + m.totalRevenue, 0),
      baseFee: yearSlice.reduce((a, m) => a + m.baseFeeRevenue, 0),
      incentiveFee: yearSlice.reduce((a, m) => a + m.incentiveFeeRevenue, 0),
      safeFunding: yearSlice.reduce((a, m) => a + m.safeFunding, 0),
      totalExpenses: yearSlice.reduce((a, m) => a + m.totalExpenses, 0),
      partnerComp: yearSlice.reduce((a, m) => a + m.partnerCompensation, 0),
      staffComp: yearSlice.reduce((a, m) => a + m.staffCompensation, 0),
      officeLease: yearSlice.reduce((a, m) => a + m.officeLease, 0),
      profServices: yearSlice.reduce((a, m) => a + m.professionalServices, 0),
      techInfra: yearSlice.reduce((a, m) => a + m.techInfrastructure, 0),
      bizInsurance: yearSlice.reduce((a, m) => a + m.businessInsurance, 0),
      travel: yearSlice.reduce((a, m) => a + m.travelCosts, 0),
      itLicensing: yearSlice.reduce((a, m) => a + m.itLicensing, 0),
      marketing: yearSlice.reduce((a, m) => a + m.marketing, 0),
      miscOps: yearSlice.reduce((a, m) => a + m.miscOps, 0),
      cashFlow: yearSlice.reduce((a, m) => a + m.cashFlow, 0),
    });
  }

  let cumulative = 0;
  const cumulatives = yearlyData.map((y) => {
    cumulative += y.cashFlow;
    return cumulative;
  });

  const headers = ["Cash Flow Statement - Management Company", ...yearLabels];
  const rows: (string | number)[][] = [
    headers,
    [],
    ["CASH INFLOWS"],
    ["  Management Fee Revenue", ...yearlyData.map((y) => y.totalRevenue)],
    ["    Base Management Fees", ...yearlyData.map((y) => y.baseFee)],
    ["    Incentive Management Fees", ...yearlyData.map((y) => y.incentiveFee)],
    ["  SAFE Funding", ...yearlyData.map((y) => y.safeFunding)],
    ["Total Cash Inflows", ...yearlyData.map((y) => y.totalRevenue + y.safeFunding)],
    [],
    ["CASH OUTFLOWS"],
    ["  Compensation", ...yearlyData.map((y) => y.partnerComp + y.staffComp)],
    ["    Partner Compensation", ...yearlyData.map((y) => y.partnerComp)],
    ["    Staff Compensation", ...yearlyData.map((y) => y.staffComp)],
    ["  Fixed Overhead", ...yearlyData.map((y) => y.officeLease + y.profServices + y.techInfra + y.bizInsurance)],
    ["    Office Lease", ...yearlyData.map((y) => y.officeLease)],
    ["    Professional Services", ...yearlyData.map((y) => y.profServices)],
    ["    Technology Infrastructure", ...yearlyData.map((y) => y.techInfra)],
    ["    Business Insurance", ...yearlyData.map((y) => y.bizInsurance)],
    ["  Variable Costs", ...yearlyData.map((y) => y.travel + y.itLicensing + y.marketing + y.miscOps)],
    ["    Travel Costs", ...yearlyData.map((y) => y.travel)],
    ["    IT Licensing", ...yearlyData.map((y) => y.itLicensing)],
    ["    Marketing", ...yearlyData.map((y) => y.marketing)],
    ["    Miscellaneous Operations", ...yearlyData.map((y) => y.miscOps)],
    ["Total Cash Outflows", ...yearlyData.map((y) => y.totalExpenses)],
    [],
    ["Net Cash Flow", ...yearlyData.map((y) => y.cashFlow)],
    ["Cumulative Cash", ...cumulatives],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  setColumnWidths(ws, [38, ...yearLabels.map(() => 16)]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Company Cash Flow");

  downloadWorkbook(wb, "Management Company - Cash Flow.xlsx");
}

export function exportCompanyBalanceSheet(
  data: CompanyMonthlyFinancials[],
  safeTranche1Amount: number,
  safeTranche2Amount: number,
  modelStartDate: string,
  fiscalYearStartMonth: number,
  years: number
) {
  const cumulativeNetIncome = data.reduce((a, m) => a + m.netIncome, 0);
  const totalSafeFunding = safeTranche1Amount + safeTranche2Amount;
  const cashBalance = totalSafeFunding + cumulativeNetIncome;
  const totalAssets = cashBalance;
  const safeNotesPayable = totalSafeFunding;
  const totalLiabilities = safeNotesPayable;
  const retainedEarnings = cumulativeNetIncome;
  const totalEquity = retainedEarnings;

  const lastYearLabel = String(getFiscalYearForModelYear(modelStartDate, fiscalYearStartMonth, years - 1));

  const rows: (string | number)[][] = [
    [`Balance Sheet - Management Company (As of ${lastYearLabel})`],
    [],
    ["ASSETS"],
    ["  Current Assets"],
    ["    Cash & Cash Equivalents", cashBalance],
    ["  Total Current Assets", cashBalance],
    ["TOTAL ASSETS", totalAssets],
    [],
    ["LIABILITIES"],
    ["  Long-Term Liabilities"],
    ["    SAFE Notes Payable", safeNotesPayable],
    ["  Total Long-Term Liabilities", totalLiabilities],
    ["TOTAL LIABILITIES", totalLiabilities],
    [],
    ["EQUITY"],
    ["  Retained Earnings", retainedEarnings],
    ["TOTAL EQUITY", totalEquity],
    [],
    ["TOTAL LIABILITIES + EQUITY", totalLiabilities + totalEquity],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  setColumnWidths(ws, [35, 18]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Company Balance Sheet");

  downloadWorkbook(wb, "Management Company - Balance Sheet.xlsx");
}
