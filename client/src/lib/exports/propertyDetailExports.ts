import { downloadCSV } from "@/lib/exports/csvExport";
import { exportPropertyPPTX } from "@/lib/exports/pptxExport";
import {
  exportFullPropertyWorkbook,
} from "@/lib/exports/excelExport";
import { drawLineChart } from "@/lib/exports/pdfChartDrawer";
import { addFooters, buildFinancialTableConfig, drawTitle, drawSubtitle, drawSubtitleRow } from "@/lib/exports/pdfHelpers";
import { type ExportRowMeta, buildBrandPalette, type ThemeColor } from "@/lib/exports/exportStyles";
import { MONTHS_PER_YEAR } from "@/lib/constants";
import { calculateLoanParams, type LoanParams, type GlobalLoanParams } from "@/lib/financial/loanCalculations";
import { formatMoney } from "@/lib/financialEngine";
import type { ExportVersion, PremiumExportPayload } from "@/components/ExportDialog";

export interface PropertyExportContext {
  property: any;
  global: any;
  yearlyDetails: any[];
  cashFlowData: any[];
  yearlyChartData: { year: string; Revenue: number; GOP: number; AGOP: number; NOI: number; ANOI: number; CashFlow: number }[];
  years: number;
  startYear: number;
  projectionYears: number;
  projectionMonths: number;
  fiscalYearStartMonth: number;
  financials: any[];
  activeTab: string;
  brandingData: { themeColors: Array<{ rank: number; name: string; hexCode: string; description?: string }> | null } | undefined;
  incomeChartRef: React.RefObject<HTMLDivElement | null>;
  cashFlowChartRef: React.RefObject<HTMLDivElement | null>;
  incomeTableRef: React.RefObject<HTMLDivElement | null>;
  cashFlowTableRef: React.RefObject<HTMLDivElement | null>;
}

function getLoanCalcs(ctx: PropertyExportContext) {
  const loan = calculateLoanParams(ctx.property as LoanParams, ctx.global as GlobalLoanParams);
  const acqYear = Math.floor(loan.acqMonthsFromModelStart / MONTHS_PER_YEAR);
  const totalPropertyCost = (ctx.property as any).purchasePrice + ((ctx.property as any).buildingImprovements ?? 0) + ((ctx.property as any).preOpeningCosts ?? 0);
  return { loan, acqYear, totalPropertyCost };
}

function getBrand(ctx: PropertyExportContext) {
  return buildBrandPalette(ctx.brandingData?.themeColors as ThemeColor[] | undefined);
}

function computeCashFlowVectors(ctx: PropertyExportContext, loan: ReturnType<typeof calculateLoanParams>, acqYear: number, totalPropertyCost: number) {
  const { yearlyDetails, cashFlowData, years } = ctx;
  const cfo = yearlyDetails.map((yd, i) =>
    yd.revenueTotal - (yd.totalExpenses - yd.expenseFFE) - cashFlowData[i].interestExpense - cashFlowData[i].taxLiability
  );
  const cfi = cashFlowData.map((cf, i) => {
    const ffe = yearlyDetails[i].expenseFFE;
    const acqCost = i === acqYear ? totalPropertyCost : 0;
    return -acqCost - ffe + cf.exitValue;
  });
  const cff = cashFlowData.map((cf, i) => {
    const eqContrib = i === acqYear ? loan.equityInvested : 0;
    const loanProceeds = i === acqYear && loan.loanAmount > 0 ? loan.loanAmount : 0;
    return eqContrib + loanProceeds - cf.principalPayment + cf.refinancingProceeds;
  });
  const netChange = cfo.map((c, i) => c + cfi[i] + cff[i]);
  let runCash = 0;
  const openCash: number[] = [];
  const closeCash: number[] = [];
  for (let i = 0; i < years; i++) {
    openCash.push(runCash);
    runCash += netChange[i];
    closeCash.push(runCash);
  }
  return { cfo, cfi, cff, netChange, openCash, closeCash };
}

function buildIncomeRows(ctx: PropertyExportContext, isShort: boolean): ExportRowMeta[] {
  const { yearlyDetails } = ctx;
  const rows: ExportRowMeta[] = [];
  if (!isShort) {
    rows.push({ category: "REVENUE", values: yearlyDetails.map(() => 0), isHeader: true });
    rows.push({ category: "Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 });
    rows.push({ category: "Event Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 });
    rows.push({ category: "F&B Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 });
    rows.push({ category: "Other Revenue", values: yearlyDetails.map(y => y.revenueOther), indent: 1 });
  }
  rows.push({ category: "Total Revenue", values: yearlyDetails.map(y => y.revenueTotal), isBold: true });
  if (!isShort) {
    rows.push({ category: "OPERATING EXPENSES", values: yearlyDetails.map(() => 0), isHeader: true });
    rows.push({ category: "Room Expense", values: yearlyDetails.map(y => y.expenseRooms), indent: 1 });
    rows.push({ category: "F&B Expense", values: yearlyDetails.map(y => y.expenseFB), indent: 1 });
    rows.push({ category: "Event Expense", values: yearlyDetails.map(y => y.expenseEvents), indent: 1 });
    rows.push({ category: "Marketing", values: yearlyDetails.map(y => y.expenseMarketing), indent: 1 });
    rows.push({ category: "Property Ops", values: yearlyDetails.map(y => y.expensePropertyOps), indent: 1 });
    rows.push({ category: "Admin & General", values: yearlyDetails.map(y => y.expenseAdmin), indent: 1 });
    rows.push({ category: "IT", values: yearlyDetails.map(y => y.expenseIT), indent: 1 });
    rows.push({ category: "Utilities", values: yearlyDetails.map(y => y.expenseUtilitiesVar + y.expenseUtilitiesFixed), indent: 1 });
    rows.push({ category: "Other Expenses", values: yearlyDetails.map(y => y.expenseOther + y.expenseOtherCosts), indent: 1 });
  }
  rows.push({ category: "Total Operating Expenses", values: yearlyDetails.map(y => y.totalExpenses - y.expenseFFE - y.expenseTaxes), isBold: true });
  rows.push({ category: "Gross Operating Profit (GOP)", values: yearlyDetails.map(y => y.gop), isBold: true });
  if (!isShort) {
    rows.push({ category: "MANAGEMENT FEES", values: yearlyDetails.map(() => 0), isHeader: true });
    rows.push({ category: "Base Fee", values: yearlyDetails.map(y => y.feeBase), indent: 1 });
    rows.push({ category: "Incentive Fee", values: yearlyDetails.map(y => y.feeIncentive), indent: 1 });
  }
  rows.push({ category: "Total Management Fees", values: yearlyDetails.map(y => y.feeBase + y.feeIncentive), isBold: true });
  rows.push({ category: "Adjusted GOP (AGOP)", values: yearlyDetails.map(y => y.agop), isBold: true });
  if (!isShort) {
    rows.push({ category: "FIXED CHARGES", values: yearlyDetails.map(() => 0), isHeader: true });
    rows.push({ category: "Property Taxes", values: yearlyDetails.map(y => y.expenseTaxes), indent: 1 });
  }
  rows.push({ category: "Total Fixed Charges", values: yearlyDetails.map(y => y.expenseTaxes), isBold: true });
  rows.push({ category: "Net Operating Income (NOI)", values: yearlyDetails.map(y => y.noi), isBold: true });
  if (!isShort) {
    rows.push({ category: "FF&E Reserve", values: yearlyDetails.map(y => y.expenseFFE), indent: 1 });
  }
  rows.push({ category: "Adjusted NOI (ANOI)", values: yearlyDetails.map(y => y.anoi), isBold: true });
  return rows;
}

function buildCashFlowRows(ctx: PropertyExportContext, cfo: number[], cfi: number[], cff: number[], netChange: number[], openCash: number[], closeCash: number[], acqYear: number, totalPropertyCost: number, loan: ReturnType<typeof calculateLoanParams>, isShort: boolean): ExportRowMeta[] {
  const { yearlyDetails, cashFlowData } = ctx;
  const rows: ExportRowMeta[] = [];
  if (!isShort) {
    rows.push({ category: "CASH FLOW FROM OPERATING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
    rows.push({ category: "Cash Received from Guests & Clients", values: yearlyDetails.map(y => y.revenueTotal), isBold: true });
    rows.push({ category: "Guest Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 });
    rows.push({ category: "Event & Venue Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 });
    rows.push({ category: "Food & Beverage Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 });
    rows.push({ category: "Other Revenue (Spa/Experiences)", values: yearlyDetails.map(y => y.revenueOther), indent: 1 });
    rows.push({ category: "Cash Paid for Operating Expenses", values: yearlyDetails.map(y => -(y.totalExpenses - y.expenseFFE)) });
    rows.push({ category: "Less: Interest Paid", values: cashFlowData.map(y => -y.interestExpense) });
    rows.push({ category: "Less: Income Taxes Paid", values: cashFlowData.map(y => -y.taxLiability) });
  }
  rows.push({ category: "Net Cash from Operating Activities", values: cfo, isBold: true });
  if (!isShort) {
    rows.push({ category: "CASH FLOW FROM INVESTING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
    rows.push({ category: "Property Acquisition", values: cashFlowData.map((_, i) => i === acqYear ? -totalPropertyCost : 0) });
    rows.push({ category: "FF&E Reserve / Capital Improvements", values: yearlyDetails.map(y => -y.expenseFFE) });
    rows.push({ category: "Sale Proceeds (Net Exit Value)", values: cashFlowData.map(y => y.exitValue) });
  }
  rows.push({ category: "Net Cash from Investing Activities", values: cfi, isBold: true });
  if (!isShort) {
    rows.push({ category: "CASH FLOW FROM FINANCING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
    rows.push({ category: "Equity Contribution", values: cashFlowData.map((_, i) => i === acqYear ? loan.equityInvested : 0) });
    rows.push({ category: "Loan Proceeds", values: cashFlowData.map((_, i) => i === acqYear && loan.loanAmount > 0 ? loan.loanAmount : 0) });
    rows.push({ category: "Less: Principal Repayments", values: cashFlowData.map(y => -y.principalPayment) });
    rows.push({ category: "Refinancing Proceeds", values: cashFlowData.map(y => y.refinancingProceeds) });
  }
  rows.push({ category: "Net Cash from Financing Activities", values: cff, isBold: true });
  rows.push({ category: "Net Increase (Decrease) in Cash", values: netChange, isBold: true });
  rows.push({ category: "Opening Cash Balance", values: openCash });
  rows.push({ category: "Closing Cash Balance", values: closeCash, isBold: true });
  if (!isShort) {
    rows.push({ category: "FREE CASH FLOW", values: yearlyDetails.map(() => 0), isHeader: true });
    rows.push({ category: "Net Cash from Operating Activities", values: cfo });
    rows.push({ category: "Less: Capital Expenditures (FF&E)", values: yearlyDetails.map(y => -y.expenseFFE) });
    rows.push({ category: "Free Cash Flow (FCF)", values: cfo.map((c, i) => c - yearlyDetails[i].expenseFFE), isBold: true });
    rows.push({ category: "Less: Principal Payments", values: cashFlowData.map(y => -y.principalPayment) });
    rows.push({ category: "Free Cash Flow to Equity (FCFE)", values: cfo.map((c, i) => c - yearlyDetails[i].expenseFFE - cashFlowData[i].principalPayment), isBold: true });
  }
  return rows;
}

export function exportAllStatementsCSV(ctx: PropertyExportContext, customFilename?: string) {
  const { yearlyDetails, years, startYear, property } = ctx;
  const { loan, acqYear, totalPropertyCost } = getLoanCalcs(ctx);
  const cashFlowData = ctx.cashFlowData;
  const headers = ["Line Item", ...Array.from({ length: years }, (_, i) => `FY ${startYear + i}`)];
  const line = (label: string, vals: number[]) => [`"${label}"`, ...vals.map(v => v.toFixed(0))].join(",");

  const csvCfo = yearlyDetails.map((yd, i) =>
    yd.revenueTotal - (yd.totalExpenses - yd.expenseFFE) - cashFlowData[i].interestExpense - cashFlowData[i].taxLiability
  );
  const csvNetChange = csvCfo.map((cfo, i) => {
    const cfi = -totalPropertyCost * (i === acqYear ? 1 : 0) - yearlyDetails[i].expenseFFE + cashFlowData[i].exitValue;
    const cff = (i === acqYear ? loan.equityInvested : 0) +
      (i === acqYear && loan.loanAmount > 0 ? loan.loanAmount : 0) -
      cashFlowData[i].principalPayment + cashFlowData[i].refinancingProceeds;
    return cfo + cfi + cff;
  });
  const csvCloseCash: number[] = [];
  let csvRunCash = 0;
  for (const nc of csvNetChange) { csvRunCash += nc; csvCloseCash.push(csvRunCash); }

  const rows: string[] = [headers.join(","), ""];
  rows.push('"INCOME STATEMENT"', "");
  rows.push(line("Total Revenue", yearlyDetails.map(y => y.revenueTotal)));
  rows.push(line("  Room Revenue", yearlyDetails.map(y => y.revenueRooms)));
  rows.push(line("  Event Revenue", yearlyDetails.map(y => y.revenueEvents)));
  rows.push(line("  F&B Revenue", yearlyDetails.map(y => y.revenueFB)));
  rows.push(line("  Other Revenue", yearlyDetails.map(y => y.revenueOther)));
  rows.push(line("Total Operating Expenses", yearlyDetails.map(y => y.totalExpenses - y.expenseFFE - y.expenseTaxes)));
  rows.push(line("Gross Operating Profit (GOP)", yearlyDetails.map(y => y.gop)));
  rows.push(line("Total Management Fees", yearlyDetails.map(y => y.feeBase + y.feeIncentive)));
  rows.push(line("Adjusted GOP (AGOP)", yearlyDetails.map(y => y.agop)));
  rows.push(line("Total Fixed Charges", yearlyDetails.map(y => y.expenseTaxes)));
  rows.push(line("Net Operating Income (NOI)", yearlyDetails.map(y => y.noi)));
  rows.push(line("FF&E Reserve", yearlyDetails.map(y => y.expenseFFE)));
  rows.push(line("Adjusted NOI (ANOI)", yearlyDetails.map(y => y.anoi)));
  rows.push("");

  rows.push('"CASH FLOW STATEMENT"', "");
  rows.push(line("Net Cash from Operating Activities", csvCfo));
  rows.push(line("  FF&E Reserve / Capital Improvements", yearlyDetails.map(yd => -yd.expenseFFE)));
  rows.push(line("Free Cash Flow (FCF)", yearlyDetails.map((yd, i) => csvCfo[i] - yd.expenseFFE)));
  rows.push(line("  Less: Principal Payments", cashFlowData.map(cf => -cf.principalPayment)));
  rows.push(line("Free Cash Flow to Equity (FCFE)", yearlyDetails.map((yd, i) => csvCfo[i] - yd.expenseFFE - cashFlowData[i].principalPayment)));
  rows.push("");

  rows.push('"BALANCE SHEET"', "");
  rows.push(line("Cash & Equivalents", csvCloseCash));
  rows.push(line("Property (Net of Depreciation)", cashFlowData.map(cf => totalPropertyCost - cf.depreciation)));
  rows.push(line("Total Assets", csvCloseCash.map((cash, i) => cash + totalPropertyCost - cashFlowData[i].depreciation)));
  rows.push(line("Outstanding Debt", cashFlowData.map(cf => loan.loanAmount + cf.refinancingProceeds - cf.principalPayment)));
  rows.push(line("Total Liabilities", cashFlowData.map(cf => loan.loanAmount + cf.refinancingProceeds - cf.principalPayment)));
  rows.push(line("Equity Invested", yearlyDetails.map(() => loan.equityInvested)));
  rows.push(line("Total Equity", cashFlowData.map((cf, i) => {
    const ta = csvCloseCash[i] + totalPropertyCost - cf.depreciation;
    const tl = loan.loanAmount + cf.refinancingProceeds - cf.principalPayment;
    return ta - tl;
  })));
  rows.push("");

  rows.push('"INVESTMENT ANALYSIS"', "");
  rows.push(line("Equity Invested", yearlyDetails.map(() => loan.equityInvested)));
  rows.push(line("Total Property Cost", yearlyDetails.map(() => totalPropertyCost)));
  rows.push(line("Annual Revenue", yearlyDetails.map(y => y.revenueTotal)));
  rows.push(line("Annual ANOI", yearlyDetails.map(y => y.anoi)));
  rows.push(line("Debt Service", cashFlowData.map(cf => cf.debtService)));
  rows.push(line("Closing Cash Balance", csvCloseCash));

  downloadCSV(rows.join("\n"), customFilename || `${property.name.replace(/\s+/g, "_")}_Financial_Statements.csv`);
}

export function handleExcelExport(ctx: PropertyExportContext, customFilename?: string) {
  const { financials, property, global, projectionYears, fiscalYearStartMonth } = ctx;
  exportFullPropertyWorkbook(
    financials,
    property as unknown as LoanParams,
    [property] as unknown as LoanParams[],
    global as unknown as GlobalLoanParams,
    global,
    [{ property: property as unknown as LoanParams, data: financials }],
    property.name,
    projectionYears,
    global.modelStartDate,
    fiscalYearStartMonth,
    0,
    global?.companyName || "Portfolio",
    customFilename
  );
}

export async function exportIncomeStatementPDF(ctx: PropertyExportContext, orientation: 'landscape' | 'portrait' = 'landscape', version: ExportVersion = 'extended', customFilename?: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const { PAGE_DIMS } = await import("@/lib/exports/exportStyles");
  const brand = getBrand(ctx);
  const { property, global, yearlyChartData, projectionYears, years, startYear } = ctx;
  const dims = orientation === "landscape"
    ? { w: PAGE_DIMS.LANDSCAPE_W, h: PAGE_DIMS.LANDSCAPE_H }
    : { w: PAGE_DIMS.PORTRAIT_W, h: PAGE_DIMS.PORTRAIT_H };
  const doc = new jsPDF({ orientation, unit: "mm", format: [dims.w, dims.h] });
  const pageWidth = dims.w;
  const chartWidth = pageWidth - 28;
  const companyName = global?.companyName || property.name;
  const yearLabels = Array.from({ length: years }, (_, i) => startYear + i);
  const projRange = `${yearLabels[0]} \u2013 ${yearLabels[yearLabels.length - 1]}`;
  const isShort = version === "short";

  const entityTag = `${companyName} \u2014 ${property.name}`;
  drawTitle(doc, `${property.name} \u2014 Income Statement`, 14, 15);
  drawSubtitleRow(doc, `${projectionYears}-Year Projection (${projRange})`, entityTag, 14, 22, pageWidth);
  drawSubtitle(doc, `Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, 27);

  const rows = buildIncomeRows(ctx, isShort);
  const tableConfig = buildFinancialTableConfig(yearLabels, rows, orientation, 32);
  autoTable(doc, tableConfig);

  if (yearlyChartData && yearlyChartData.length > 0) {
    doc.addPage();
    drawTitle(doc, `${property.name} \u2014 Performance Trend`, 14, 15, { fontSize: 16 });
    drawSubtitleRow(doc, `${projectionYears}-Year Revenue, GOP, AGOP, NOI, and ANOI Trend`, entityTag, 14, 22, pageWidth);
    drawLineChart({
      doc, x: 14, y: 30, width: chartWidth, height: 150,
      title: `${property.name} - Financial Performance (${projectionYears}-Year Projection)`,
      series: [
        { name: 'Revenue', data: yearlyChartData.map((d) => ({ label: d.year, value: d.Revenue })), color: `#${brand.LINE_HEX[0]}` },
        { name: 'GOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.GOP })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
        { name: 'AGOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.AGOP })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
        { name: 'NOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.NOI })), color: `#${brand.LINE_HEX[3] || brand.ACCENT_HEX}` },
        { name: 'ANOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.ANOI })), color: `#${brand.LINE_HEX[4] || brand.MUTED_HEX}` },
      ],
      brand,
    });
  }

  addFooters(doc, companyName, { skipPages: new Set([1]) });
  const { saveFile } = await import("@/lib/exports/saveFile");
  await saveFile(doc.output("blob"), customFilename || `${property.name.replace(/\s+/g, '_')}_IncomeStatement.pdf`);
}

export async function exportCashFlowPDF(ctx: PropertyExportContext, orientation: 'landscape' | 'portrait' = 'landscape', version: ExportVersion = 'extended', customFilename?: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const { PAGE_DIMS } = await import("@/lib/exports/exportStyles");
  const brand = getBrand(ctx);
  const { property, global, yearlyChartData, cashFlowData, projectionYears, years, startYear, activeTab } = ctx;
  const { loan, acqYear, totalPropertyCost } = getLoanCalcs(ctx);
  const dims = orientation === "landscape"
    ? { w: PAGE_DIMS.LANDSCAPE_W, h: PAGE_DIMS.LANDSCAPE_H }
    : { w: PAGE_DIMS.PORTRAIT_W, h: PAGE_DIMS.PORTRAIT_H };
  const doc = new jsPDF({ orientation, unit: "mm", format: [dims.w, dims.h] });
  const pageWidth = dims.w;
  const chartWidth = pageWidth - 28;
  const companyName = global?.companyName || property.name;
  const yearLabels = Array.from({ length: years }, (_, i) => startYear + i);
  const projRange = `${yearLabels[0]} \u2013 ${yearLabels[yearLabels.length - 1]}`;
  const isShort = version === "short";
  const { cfo, cfi, cff, netChange, openCash, closeCash } = computeCashFlowVectors(ctx, loan, acqYear, totalPropertyCost);

  const entityTag = `${companyName} \u2014 ${property.name}`;
  drawTitle(doc, `${property.name} \u2014 Cash Flow Statement`, 14, 15);
  drawSubtitleRow(doc, `${projectionYears}-Year Projection (${projRange})`, entityTag, 14, 22, pageWidth);
  drawSubtitle(doc, `Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, 27);

  const rows = buildCashFlowRows(ctx, cfo, cfi, cff, netChange, openCash, closeCash, acqYear, totalPropertyCost, loan, isShort);
  const tableConfig = buildFinancialTableConfig(yearLabels, rows, orientation, 32);
  autoTable(doc, tableConfig);

  if (yearlyChartData && yearlyChartData.length > 0) {
    doc.addPage();
    const chartSubtitle = activeTab === "cashflow"
      ? `${projectionYears}-Year Revenue, ANOI, and Cash Flow Trend`
      : `${projectionYears}-Year Revenue, GOP, AGOP, NOI, and ANOI Trend`;
    drawTitle(doc, `${property.name} \u2014 Performance Trend`, 14, 15, { fontSize: 16 });
    drawSubtitleRow(doc, chartSubtitle, entityTag, 14, 22, pageWidth);

    const chartSeries = activeTab === "cashflow" ? [
      { name: 'Revenue', data: yearlyChartData.map((d) => ({ label: d.year, value: d.Revenue })), color: `#${brand.LINE_HEX[0]}` },
      { name: 'ANOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.ANOI })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
      { name: 'Cash Flow', data: yearlyChartData.map((d) => ({ label: d.year, value: d.CashFlow })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
    ] : [
      { name: 'Revenue', data: yearlyChartData.map((d) => ({ label: d.year, value: d.Revenue })), color: `#${brand.LINE_HEX[0]}` },
      { name: 'GOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.GOP })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
      { name: 'AGOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.AGOP })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
      { name: 'NOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.NOI })), color: `#${brand.LINE_HEX[3] || brand.ACCENT_HEX}` },
      { name: 'ANOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.ANOI })), color: `#${brand.LINE_HEX[4] || brand.MUTED_HEX}` },
    ];

    drawLineChart({
      doc, x: 14, y: 30, width: chartWidth, height: 150,
      title: `${property.name} - Financial Performance (${projectionYears}-Year Projection)`,
      series: chartSeries,
      brand,
    });
  }

  addFooters(doc, companyName, { skipPages: new Set([1]) });
  const { saveFile: savePdf } = await import("@/lib/exports/saveFile");
  await savePdf(doc.output("blob"), customFilename || `${property.name.replace(/\s+/g, '_')}_CashFlow.pdf`);
}

export async function exportChartPNG(ctx: PropertyExportContext, orientation: 'landscape' | 'portrait' = 'landscape', customFilename?: string) {
  const chartContainer = ctx.activeTab === "cashflow" ? ctx.cashFlowChartRef.current : ctx.incomeChartRef.current;
  if (!chartContainer) return;
  try {
    const width = orientation === 'landscape' ? 1200 : 800;
    const height = orientation === 'landscape' ? 600 : 1000;
    const domtoimage = (await import("dom-to-image-more")).default;
    const dataUrl = await domtoimage.toPng(chartContainer, {
      bgcolor: '#ffffff', quality: 1, width, height,
      style: { transform: 'scale(2)', transformOrigin: 'top left' }
    });
    const { saveDataUrl } = await import("@/lib/exports/saveFile");
    await saveDataUrl(dataUrl, customFilename || `${ctx.property.name.replace(/\s+/g, '_')}_chart_${orientation}.png`);
  } catch (error) {
    console.error('Error exporting chart:', error);
  }
}

export async function exportTablePNG(ctx: PropertyExportContext, orientation: 'landscape' | 'portrait' = 'landscape', customFilename?: string) {
  const tableContainer = ctx.activeTab === "cashflow" ? ctx.cashFlowTableRef.current : ctx.incomeTableRef.current;
  if (!tableContainer) return;
  try {
    const scale = 2;
    const domtoimage = (await import("dom-to-image-more")).default;
    const dataUrl = await domtoimage.toPng(tableContainer, {
      bgcolor: '#ffffff', quality: 1,
      style: { transform: `scale(${scale})`, transformOrigin: 'top left' },
      width: tableContainer.scrollWidth * scale,
      height: tableContainer.scrollHeight * scale,
    });
    const { saveDataUrl } = await import("@/lib/exports/saveFile");
    await saveDataUrl(dataUrl, customFilename || `${ctx.property.name.replace(/\s+/g, '_')}_${ctx.activeTab}_table.png`);
  } catch (error) {
    console.error('Error exporting table:', error);
  }
}

export function handlePPTXExport(ctx: PropertyExportContext, customFilename?: string) {
  const { yearlyDetails, cashFlowData, yearlyChartData, years, startYear, projectionYears, property, global } = ctx;
  const { loan, acqYear, totalPropertyCost } = getLoanCalcs(ctx);
  const yearLabels = Array.from({ length: years }, (_, i) => `FY ${startYear + i}`);

  const pptxCfo = yearlyDetails.map((yd, i) =>
    yd.revenueTotal - (yd.totalExpenses - yd.expenseFFE) - cashFlowData[i].interestExpense - cashFlowData[i].taxLiability
  );
  const pptxNetChange = pptxCfo.map((cfo, i) => {
    const cfi = -totalPropertyCost * (i === acqYear ? 1 : 0) - yearlyDetails[i].expenseFFE + cashFlowData[i].exitValue;
    const cff = (i === acqYear ? loan.equityInvested : 0) +
      (i === acqYear && loan.loanAmount > 0 ? loan.loanAmount : 0) -
      cashFlowData[i].principalPayment + cashFlowData[i].refinancingProceeds;
    return cfo + cfi + cff;
  });
  const pptxCloseCash: number[] = [];
  let pptxRunCash = 0;
  for (const nc of pptxNetChange) { pptxRunCash += nc; pptxCloseCash.push(pptxRunCash); }

  const incomeRows = [
    { category: "REVENUE", values: yearlyDetails.map(() => 0), isHeader: true },
    { category: "Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 },
    { category: "Event Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 },
    { category: "F&B Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 },
    { category: "Other Revenue", values: yearlyDetails.map(y => y.revenueOther), indent: 1 },
    { category: "Total Revenue", values: yearlyDetails.map(y => y.revenueTotal), isBold: true },
    { category: "Total Operating Expenses", values: yearlyDetails.map(y => y.totalExpenses - y.expenseFFE - y.expenseTaxes), isBold: true },
    { category: "Gross Operating Profit (GOP)", values: yearlyDetails.map(y => y.gop), isBold: true },
    { category: "Total Management Fees", values: yearlyDetails.map(y => y.feeBase + y.feeIncentive) },
    { category: "Adjusted GOP (AGOP)", values: yearlyDetails.map(y => y.agop), isBold: true },
    { category: "Total Fixed Charges", values: yearlyDetails.map(y => y.expenseTaxes) },
    { category: "Net Operating Income (NOI)", values: yearlyDetails.map(y => y.noi), isBold: true },
    { category: "FF&E Reserve", values: yearlyDetails.map(y => y.expenseFFE), indent: 1 },
    { category: "Adjusted NOI (ANOI)", values: yearlyDetails.map(y => y.anoi), isBold: true },
  ];

  const cfRows = [
    { category: "Net Cash from Operating Activities", values: pptxCfo, isBold: true },
    { category: "FF&E Reserve / Capital Improvements", values: yearlyDetails.map(yd => -yd.expenseFFE), indent: 1 },
    { category: "Free Cash Flow (FCF)", values: yearlyDetails.map((yd, i) => pptxCfo[i] - yd.expenseFFE), isBold: true },
    { category: "Less: Principal Payments", values: cashFlowData.map(cf => -cf.principalPayment), indent: 1 },
    { category: "Free Cash Flow to Equity (FCFE)", values: yearlyDetails.map((yd, i) => pptxCfo[i] - yd.expenseFFE - cashFlowData[i].principalPayment), isBold: true },
  ];

  const bsRows = [
    { category: "ASSETS", values: yearlyDetails.map(() => 0), isHeader: true },
    { category: "Cash & Equivalents", values: pptxCloseCash, indent: 1 },
    { category: "Property (Net of Depreciation)", values: cashFlowData.map(cf => totalPropertyCost - cf.depreciation), indent: 1 },
    { category: "Total Assets", values: pptxCloseCash.map((cash, i) => cash + totalPropertyCost - cashFlowData[i].depreciation), isBold: true },
    { category: "LIABILITIES", values: yearlyDetails.map(() => 0), isHeader: true },
    { category: "Outstanding Debt", values: cashFlowData.map(cf => loan.loanAmount + cf.refinancingProceeds - cf.principalPayment), indent: 1 },
    { category: "Total Liabilities", values: cashFlowData.map(cf => loan.loanAmount + cf.refinancingProceeds - cf.principalPayment), isBold: true },
    { category: "EQUITY", values: yearlyDetails.map(() => 0), isHeader: true },
    { category: "Equity Invested", values: yearlyDetails.map(() => loan.equityInvested), indent: 1 },
    { category: "Retained Earnings", values: cashFlowData.map((cf, i) => {
      const ta = pptxCloseCash[i] + totalPropertyCost - cf.depreciation;
      const tl = loan.loanAmount + cf.refinancingProceeds - cf.principalPayment;
      return ta - tl - loan.equityInvested;
    }), indent: 1 },
    { category: "Total Equity", values: cashFlowData.map((cf, i) => {
      const ta = pptxCloseCash[i] + totalPropertyCost - cf.depreciation;
      const tl = loan.loanAmount + cf.refinancingProceeds - cf.principalPayment;
      return ta - tl;
    }), isBold: true },
  ];

  const investRows = [
    { category: "INVESTMENT SUMMARY", values: yearlyDetails.map(() => 0), isHeader: true },
    { category: "Equity Invested", values: yearlyDetails.map(() => loan.equityInvested), indent: 1 },
    { category: "Total Property Cost", values: yearlyDetails.map(() => totalPropertyCost), indent: 1 },
    { category: "Loan Amount", values: yearlyDetails.map(() => loan.loanAmount), indent: 1 },
    { category: "Annual Revenue", values: yearlyDetails.map(y => y.revenueTotal), indent: 1 },
    { category: "Annual ANOI", values: yearlyDetails.map(y => y.anoi), indent: 1 },
    { category: "Debt Service", values: cashFlowData.map(cf => cf.debtService), indent: 1 },
    { category: "Closing Cash Balance", values: pptxCloseCash, isBold: true },
  ];

  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v);
  const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const firstY = yearlyChartData[0];
  const kpiMetrics = firstY ? [
    { label: "Year 1 Total Revenue", value: fmt(firstY.Revenue) },
    { label: "Year 1 GOP", value: fmt(firstY.GOP) },
    { label: "Year 1 ANOI", value: fmt(firstY.ANOI) },
    { label: "Total Equity Invested", value: fmt(loan.equityInvested) },
    { label: "Total Property Cost", value: fmt(totalPropertyCost) },
    { label: "Loan Amount", value: fmt(loan.loanAmount) },
    { label: "LTV", value: fmtPct(loan.loanAmount / totalPropertyCost) },
    { label: "ANOI Margin (Year 1)", value: firstY.Revenue > 0 ? fmtPct(firstY.ANOI / firstY.Revenue) : "—" },
  ] : [];

  exportPropertyPPTX({
    propertyName: property.name,
    projectionYears,
    getFiscalYear: (i: number) => `FY ${startYear + i}`,
    incomeData: { years: yearLabels, rows: incomeRows },
    cashFlowData: { years: yearLabels, rows: cfRows },
    balanceSheetData: { years: yearLabels, rows: bsRows },
    investmentData: { years: yearLabels, rows: investRows },
    kpiMetrics,
  }, global?.companyName || "H+ Analytics", customFilename, ctx.brandingData?.themeColors ?? undefined);
}

export async function exportUnifiedPDF(ctx: PropertyExportContext, orientation: 'landscape' | 'portrait' = 'landscape', version: ExportVersion = 'extended', customFilename?: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const { PAGE_DIMS } = await import("@/lib/exports/exportStyles");
  const brand = getBrand(ctx);
  const { property, global, yearlyDetails, cashFlowData, yearlyChartData, projectionYears, years, startYear } = ctx;
  const { loan, acqYear, totalPropertyCost } = getLoanCalcs(ctx);
  const dims = orientation === "landscape"
    ? { w: PAGE_DIMS.LANDSCAPE_W, h: PAGE_DIMS.LANDSCAPE_H }
    : { w: PAGE_DIMS.PORTRAIT_W, h: PAGE_DIMS.PORTRAIT_H };
  const doc = new jsPDF({ orientation, unit: "mm", format: [dims.w, dims.h] });
  const pageWidth = dims.w;
  const chartWidth = pageWidth - 28;
  const companyName = global?.companyName || property.name;
  const yearLabels = Array.from({ length: years }, (_, i) => startYear + i);
  const projRange = `${yearLabels[0]} \u2013 ${yearLabels[yearLabels.length - 1]}`;
  const isShort = version === "short";
  const entityTag = `${companyName} \u2014 ${property.name}`;

  drawTitle(doc, `${property.name} Income Statement`, 14, 15);
  drawSubtitleRow(doc, `${projectionYears}-Year Projection (${projRange})`, entityTag, 14, 22, pageWidth);
  drawSubtitle(doc, `Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, 27);

  const incomeRows = buildIncomeRows(ctx, isShort);
  autoTable(doc, buildFinancialTableConfig(yearLabels, incomeRows, orientation, 32));

  if (yearlyChartData && yearlyChartData.length > 0) {
    doc.addPage();
    drawTitle(doc, `${property.name} \u2014 Income Statement Trend`, 14, 15, { fontSize: 16 });
    drawSubtitleRow(doc, `${projectionYears}-Year Revenue, GOP, AGOP, NOI, and ANOI Trend`, entityTag, 14, 22, pageWidth);
    drawLineChart({
      doc, x: 14, y: 30, width: chartWidth, height: 150,
      title: `${property.name} - Income Statement (${projectionYears}-Year Projection)`,
      series: [
        { name: 'Revenue', data: yearlyChartData.map((d) => ({ label: d.year, value: d.Revenue })), color: `#${brand.LINE_HEX[0]}` },
        { name: 'GOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.GOP })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
        { name: 'AGOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.AGOP })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
        { name: 'NOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.NOI })), color: `#${brand.LINE_HEX[3] || brand.ACCENT_HEX}` },
        { name: 'ANOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.ANOI })), color: `#${brand.LINE_HEX[4] || brand.MUTED_HEX}` },
      ],
      brand,
    });
  }

  const { cfo, cfi, cff, netChange, openCash, closeCash } = computeCashFlowVectors(ctx, loan, acqYear, totalPropertyCost);

  doc.addPage();
  drawTitle(doc, `${property.name} Cash Flow Statement`, 14, 15);
  drawSubtitleRow(doc, `${projectionYears}-Year Projection (${projRange})`, entityTag, 14, 22, pageWidth);
  drawSubtitle(doc, `Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, 27);

  const cfRows = buildCashFlowRows(ctx, cfo, cfi, cff, netChange, openCash, closeCash, acqYear, totalPropertyCost, loan, isShort);
  autoTable(doc, buildFinancialTableConfig(yearLabels, cfRows, orientation, 32));

  if (yearlyChartData && yearlyChartData.length > 0) {
    doc.addPage();
    drawTitle(doc, `${property.name} \u2014 Cash Flow Trend`, 14, 15, { fontSize: 16 });
    drawSubtitleRow(doc, `${projectionYears}-Year NOI, ANOI, FCF, and FCFE Trend`, entityTag, 14, 22, pageWidth);
    drawLineChart({
      doc, x: 14, y: 30, width: chartWidth, height: 150,
      title: `${property.name} - Cash Flow (${projectionYears}-Year Projection)`,
      series: [
        { name: 'NOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.NOI })), color: `#${brand.LINE_HEX[3] || brand.ACCENT_HEX}` },
        { name: 'ANOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.ANOI })), color: `#${brand.LINE_HEX[0]}` },
        { name: 'FCF', data: cashFlowData.map((cf, i) => ({ label: String(yearLabels[i]), value: cf.freeCashFlow || 0 })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
        { name: 'FCFE', data: cashFlowData.map((cf, i) => ({ label: String(yearLabels[i]), value: cf.freeCashFlowToEquity || 0 })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
      ],
      brand,
    });
  }

  let cumLoanBalance = loan.loanAmount;
  const bsRows: ExportRowMeta[] = [];
  bsRows.push({ category: "ASSETS", values: yearlyDetails.map(() => 0), isHeader: true });
  bsRows.push({ category: "Cash & Equivalents", values: closeCash, indent: 1 });
  bsRows.push({ category: "Property (Net Book Value)", values: yearlyDetails.map((_, i) => {
    const depPerYear = totalPropertyCost / 39;
    return Math.max(totalPropertyCost - depPerYear * (i + 1), 0);
  }), indent: 1 });
  bsRows.push({ category: "Total Assets", values: yearlyDetails.map((_, i) => {
    const depPerYear = totalPropertyCost / 39;
    return closeCash[i] + Math.max(totalPropertyCost - depPerYear * (i + 1), 0);
  }), isBold: true });
  bsRows.push({ category: "LIABILITIES", values: yearlyDetails.map(() => 0), isHeader: true });
  const loanBalances = yearlyDetails.map((_, i) => {
    if (i === 0) cumLoanBalance = loan.loanAmount;
    if (i > 0) cumLoanBalance -= cashFlowData[i - 1].principalPayment;
    return Math.max(cumLoanBalance - cashFlowData[i].principalPayment, 0);
  });
  bsRows.push({ category: "Loan Balance", values: loanBalances, indent: 1 });
  bsRows.push({ category: "Total Liabilities", values: loanBalances, isBold: true });
  bsRows.push({ category: "EQUITY", values: yearlyDetails.map(() => 0), isHeader: true });
  bsRows.push({ category: "Total Equity", values: yearlyDetails.map((_, i) => {
    const depPerYear = totalPropertyCost / 39;
    const totalAssets = closeCash[i] + Math.max(totalPropertyCost - depPerYear * (i + 1), 0);
    return totalAssets - loanBalances[i];
  }), isBold: true });

  doc.addPage();
  drawTitle(doc, `${property.name} Balance Sheet`, 14, 15);
  drawSubtitleRow(doc, `${projectionYears}-Year Projection (${projRange})`, entityTag, 14, 22, pageWidth);
  drawSubtitle(doc, `Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, 27);
  autoTable(doc, buildFinancialTableConfig(yearLabels, bsRows, orientation, 32));

  if (yearlyChartData && yearlyChartData.length > 0) {
    doc.addPage();
    const totalAssets = yearlyDetails.map((_, i) => {
      const depPerYear = totalPropertyCost / 39;
      return closeCash[i] + Math.max(totalPropertyCost - depPerYear * (i + 1), 0);
    });
    const totalEquity = yearlyDetails.map((_, i) => totalAssets[i] - loanBalances[i]);
    drawTitle(doc, `${property.name} \u2014 Balance Sheet Trend`, 14, 15, { fontSize: 16 });
    drawSubtitleRow(doc, `${projectionYears}-Year Assets, Liabilities, and Equity Trend`, entityTag, 14, 22, pageWidth);
    drawLineChart({
      doc, x: 14, y: 30, width: chartWidth, height: 150,
      title: `${property.name} - Balance Sheet (${projectionYears}-Year Projection)`,
      series: [
        { name: 'Total Assets', data: totalAssets.map((v, i) => ({ label: String(yearLabels[i]), value: v })), color: `#${brand.LINE_HEX[0]}` },
        { name: 'Total Liabilities', data: loanBalances.map((v, i) => ({ label: String(yearLabels[i]), value: v })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
        { name: 'Total Equity', data: totalEquity.map((v, i) => ({ label: String(yearLabels[i]), value: v })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
      ],
      brand,
    });
  }

  addFooters(doc, companyName, { skipPages: new Set([1]) });
  const { saveFile } = await import("@/lib/exports/saveFile");
  await saveFile(doc.output("blob"), customFilename || `${property.name.replace(/\s+/g, '_')}_Financial_Statements.pdf`);
}

export function handleExport(ctx: PropertyExportContext, exportType: string, orientation: 'landscape' | 'portrait', version: ExportVersion, customFilename?: string) {
  if (exportType === 'pdf') {
    return exportUnifiedPDF(ctx, orientation, version, customFilename);
  } else if (exportType === 'chart') {
    return exportChartPNG(ctx, orientation, customFilename);
  } else if (exportType === 'xlsx') {
    handleExcelExport(ctx, customFilename);
  } else if (exportType === 'pptx') {
    handlePPTXExport(ctx, customFilename);
  }
}

export function buildPremiumExportPayload(ctx: PropertyExportContext, version: ExportVersion, includeCoverPage: boolean): PremiumExportPayload {
  const { property, global, yearlyDetails, cashFlowData, yearlyChartData, years, projectionYears } = ctx;
  const { loan, acqYear, totalPropertyCost } = getLoanCalcs(ctx);
  const yrLabels = yearlyChartData.map((d) => d.year);
  const summaryOnly = version === "short";

  const incomeRows = buildIncomeRows(ctx, summaryOnly);

  const { cfo, cfi, cff, netChange, openCash, closeCash } = computeCashFlowVectors(ctx, loan, acqYear, totalPropertyCost);

  const cfRows: Array<{ category: string; values: number[]; indent?: number; isBold?: boolean; isHeader?: boolean }> = [];
  if (!summaryOnly) {
    cfRows.push({ category: "CASH FLOW FROM OPERATING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
    cfRows.push({ category: "Cash Received from Guests & Clients", values: yearlyDetails.map(y => y.revenueTotal), isBold: true });
    cfRows.push({ category: "Guest Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 });
    cfRows.push({ category: "Event & Venue Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 });
    cfRows.push({ category: "Food & Beverage Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 });
    cfRows.push({ category: "Other Revenue (Spa/Experiences)", values: yearlyDetails.map(y => y.revenueOther), indent: 1 });
    cfRows.push({ category: "Cash Paid for Operating Expenses", values: yearlyDetails.map(y => -(y.totalExpenses - y.expenseFFE)) });
    cfRows.push({ category: "Less: Interest Paid", values: cashFlowData.map(y => -y.interestExpense) });
    cfRows.push({ category: "Less: Income Taxes Paid", values: cashFlowData.map(y => -y.taxLiability) });
  }
  cfRows.push({ category: "Net Cash from Operating Activities", values: cfo, isBold: true });
  if (!summaryOnly) {
    cfRows.push({ category: "CASH FLOW FROM INVESTING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
    cfRows.push({ category: "Property Acquisition", values: cashFlowData.map((_, i) => i === acqYear ? -totalPropertyCost : 0) });
    cfRows.push({ category: "FF&E Reserve / Capital Improvements", values: yearlyDetails.map(y => -y.expenseFFE) });
    cfRows.push({ category: "Sale Proceeds (Net Exit Value)", values: cashFlowData.map(y => y.exitValue) });
  }
  cfRows.push({ category: "Net Cash from Investing Activities", values: cfi, isBold: true });
  if (!summaryOnly) {
    cfRows.push({ category: "CASH FLOW FROM FINANCING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
    cfRows.push({ category: "Equity Contribution", values: cashFlowData.map((_, i) => i === acqYear ? loan.equityInvested : 0) });
    cfRows.push({ category: "Loan Proceeds", values: cashFlowData.map((_, i) => i === acqYear && loan.loanAmount > 0 ? loan.loanAmount : 0) });
    cfRows.push({ category: "Less: Principal Repayments", values: cashFlowData.map(y => -y.principalPayment) });
    cfRows.push({ category: "Refinancing Proceeds", values: cashFlowData.map(y => y.refinancingProceeds) });
  }
  cfRows.push({ category: "Net Cash from Financing Activities", values: cff, isBold: true });
  cfRows.push({ category: "Net Increase (Decrease) in Cash", values: netChange, isBold: true });
  cfRows.push({ category: "Opening Cash Balance", values: openCash });
  cfRows.push({ category: "Closing Cash Balance", values: closeCash, isBold: true });

  const bsRows: Array<{ category: string; values: number[]; indent?: number; isBold?: boolean; isHeader?: boolean }> = [];
  bsRows.push({ category: "ASSETS", values: yearlyDetails.map(() => 0), isHeader: true });
  bsRows.push({ category: "Cash & Equivalents", values: closeCash, indent: 1 });
  bsRows.push({ category: "Property (Net of Depreciation)", values: cashFlowData.map(cf => totalPropertyCost - cf.depreciation), indent: 1 });
  bsRows.push({ category: "Total Assets", values: closeCash.map((cash, i) => cash + totalPropertyCost - cashFlowData[i].depreciation), isBold: true });
  bsRows.push({ category: "LIABILITIES", values: yearlyDetails.map(() => 0), isHeader: true });
  bsRows.push({ category: "Outstanding Debt", values: cashFlowData.map(cf => loan.loanAmount + cf.refinancingProceeds - cf.principalPayment), indent: 1 });
  bsRows.push({ category: "Total Liabilities", values: cashFlowData.map(cf => loan.loanAmount + cf.refinancingProceeds - cf.principalPayment), isBold: true });
  bsRows.push({ category: "EQUITY", values: yearlyDetails.map(() => 0), isHeader: true });
  bsRows.push({ category: "Equity Invested", values: yearlyDetails.map(() => loan.equityInvested), indent: 1 });
  bsRows.push({ category: "Retained Earnings", values: cashFlowData.map((cf, i) => {
    const totalAssets = closeCash[i] + totalPropertyCost - cf.depreciation;
    const totalLiabilities = loan.loanAmount + cf.refinancingProceeds - cf.principalPayment;
    return totalAssets - totalLiabilities - loan.equityInvested;
  }), indent: 1 });
  bsRows.push({ category: "Total Equity", values: cashFlowData.map((cf, i) => {
    const totalAssets = closeCash[i] + totalPropertyCost - cf.depreciation;
    const totalLiabilities = loan.loanAmount + cf.refinancingProceeds - cf.principalPayment;
    return totalAssets - totalLiabilities;
  }), isBold: true });

  const investRows: Array<{ category: string; values: number[]; indent?: number; isBold?: boolean; isHeader?: boolean }> = [];
  investRows.push({ category: "Investment Summary", values: yearlyDetails.map(() => 0), isHeader: true });
  investRows.push({ category: "Equity Invested", values: yearlyDetails.map(() => loan.equityInvested), indent: 1 });
  investRows.push({ category: "Total Property Cost", values: yearlyDetails.map(() => totalPropertyCost), indent: 1 });
  investRows.push({ category: "Loan Amount", values: yearlyDetails.map(() => loan.loanAmount), indent: 1 });
  if (!summaryOnly) {
    investRows.push({ category: "Annual Revenue", values: yearlyDetails.map(y => y.revenueTotal), indent: 1 });
    investRows.push({ category: "Annual NOI", values: yearlyDetails.map(y => y.noi), indent: 1 });
    investRows.push({ category: "Annual ANOI", values: yearlyDetails.map(y => y.anoi), indent: 1 });
    investRows.push({ category: "Annual Cash Flow", values: yearlyChartData.map(d => d.CashFlow), indent: 1 });
    investRows.push({ category: "Debt Service", values: cashFlowData.map(cf => cf.debtService), indent: 1 });
  }
  investRows.push({ category: "Closing Cash Balance", values: closeCash, isBold: true });

  const mapRows = (rows: Array<{ category: string; values: (string | number)[]; indent?: number; isBold?: boolean; isHeader?: boolean; isItalic?: boolean; format?: string }>) => rows.map(r => ({
    category: r.category, values: r.values, indent: r.indent, isBold: r.isBold,
    isHeader: r.isHeader, isItalic: r.isItalic, format: r.format,
  }));

  return {
    entityName: property.name,
    companyName: global?.companyName || "H+ Analytics",
    statementType: ctx.activeTab === "income" ? "Income Statement" : ctx.activeTab === "cashflow" ? "Cash Flow Statement" : "Balance Sheet",
    years: yrLabels,
    statements: [
      { title: `${property.name} — Income Statement`, years: yrLabels, rows: mapRows(incomeRows) },
      { title: `${property.name} — Cash Flow Statement`, years: yrLabels, rows: mapRows(cfRows) },
      { title: `${property.name} — Balance Sheet`, years: yrLabels, rows: mapRows(bsRows) },
      { title: `${property.name} — Investment Analysis`, years: yrLabels, rows: mapRows(investRows) },
    ],
    metrics: [
      { label: "Total Revenue (Year 1)", value: yearlyChartData[0] ? formatMoney(yearlyChartData[0].Revenue) : "—" },
      { label: "GOP (Year 1)", value: yearlyChartData[0] ? formatMoney(yearlyChartData[0].GOP) : "—" },
      { label: "NOI (Year 1)", value: yearlyChartData[0] ? formatMoney(yearlyChartData[0].NOI) : "—" },
      { label: "ANOI (Year 1)", value: yearlyChartData[0] ? formatMoney(yearlyChartData[0].ANOI) : "—" },
    ],
    projectionYears,
    includeCoverPage,
    themeColors: ctx.brandingData?.themeColors?.map((c: any) => ({ name: c.name, hexCode: c.hexCode, rank: c.rank })),
  } as PremiumExportPayload;
}
