import { format } from "date-fns";
import { drawLineChart } from "@/lib/exports/pdfChartDrawer";
import { exportPortfolioPPTX as originalExportPortfolioPPTX } from "@/lib/exports/pptxExport";
import { exportTablePNG } from "@/lib/exports/pngExport";
import { downloadCSV } from "@/lib/exports/csvExport";
import { buildFinancialTableConfig, addFooters, drawTitle, drawSubtitle, drawSubtitleRow, drawDashboardSummaryPage, drawCoverPage, type DashboardSummaryMetric } from "@/lib/exports/pdfHelpers";
import { PAGE_DIMS, type ThemeColor, buildBrandPalette } from "@/lib/exports/exportStyles";
import type { DashboardFinancials } from "./types";
import type { Property } from "@shared/schema";
import type { YearlyPropertyFinancials } from "@/lib/financial/yearlyAggregator";

import type { ExportRow, ExportData } from "./statementBuilders";
import { generatePortfolioCashFlowData, generatePortfolioBalanceSheetData, generatePortfolioInvestmentData } from "./statementBuilders";

function splitRowsBySectionHeaders(rows: ExportRow[]): { title: string; rows: ExportRow[] }[] {
  const sections: { title: string; rows: ExportRow[] }[] = [];
  let current: { title: string; rows: ExportRow[] } | null = null;

  for (const row of rows) {
    if (row.isHeader && !row.indent && row.category.trim()) {
      if (current && current.rows.length > 0) sections.push(current);
      current = { title: row.category, rows: [row] };
    } else if (current) {
      current.rows.push(row);
    }
  }
  if (current && current.rows.length > 0) sections.push(current);

  return sections;
}

export async function exportPortfolioExcel(
  datasets: {
    incomeData: ExportData;
    cashFlowData: ExportData;
    balanceSheetData: ExportData;
    investmentData: ExportData;
  },
  companyName = "Portfolio",
  customFilename?: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const { applyCurrencyFormat, applyHeaderStyle, setColumnWidths } = await import("@/lib/exports/excel/helpers");
  const wb = (XLSX as any).utils.book_new();

  const sheets: { name: string; data: ExportData }[] = [
    { name: "Income Statement", data: datasets.incomeData },
    { name: "Cash Flow", data: datasets.cashFlowData },
    { name: "Balance Sheet", data: datasets.balanceSheetData },
    { name: "Investment Analysis", data: datasets.investmentData },
  ];

  for (const sheet of sheets) {
    const wsData = [
      [sheet.name, ...sheet.data.years.map(String)],
      ...sheet.data.rows.map(row => [
        (row.indent ? "  ".repeat(row.indent) : "") + row.category,
        ...row.values,
      ]),
    ];
    const ws = (XLSX as any).utils.aoa_to_sheet(wsData);
    setColumnWidths(ws, [38, ...sheet.data.years.map(() => 16)]);
    applyCurrencyFormat(ws, wsData);
    applyHeaderStyle(ws, wsData);
    (XLSX as any).utils.book_append_sheet(wb, ws, sheet.name);
  }

  const safeName = companyName.replace(/[^a-zA-Z0-9 &\-]/g, "").substring(0, 60);
  const { saveFile: saveXlsx } = await import("./../../lib/exports/saveFile");
  const xlData = (XLSX as any).write(wb, { bookType: "xlsx", type: "array" });
  const xlBlob = new Blob([xlData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  await saveXlsx(xlBlob, customFilename || `${safeName} - Consolidated Financial Statements.xlsx`);
}

export function exportPortfolioCSV(
  years: number[],
  rows: ExportRow[],
  filename: string
): void {
  const headers = ["Category", ...years.map(String)];
  const csvContent = [
    headers.join(","),
    ...rows.map(row => [
      `"${(row.indent ? "  ".repeat(row.indent) : "") + row.category}"`,
      ...row.values.map((v: number) => v.toFixed(2)),
    ].join(",")),
  ].join("\n");
  downloadCSV(csvContent, filename);
}

export async function exportPortfolioPDF(
  orientation: "landscape" | "portrait",
  projectionYears: number,
  years: number[],
  rows: ExportRow[],
  getYearlyConsolidated: (i: number) => YearlyPropertyFinancials,
  title: string,
  companyName = "H+ Analytics",
  customFilename?: string,
  themeColors?: ThemeColor[]
): Promise<void> {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const dims = orientation === "landscape"
    ? { w: PAGE_DIMS.LANDSCAPE_W, h: PAGE_DIMS.LANDSCAPE_H }
    : { w: PAGE_DIMS.PORTRAIT_W, h: PAGE_DIMS.PORTRAIT_H };
  const doc = new jsPDF({ orientation, unit: "mm", format: [dims.w, dims.h] });
  const brand = buildBrandPalette(themeColors);

  const pageWidth = dims.w;
  const entityTag = `${companyName} \u2014 Consolidated Portfolio`;
  const projRange = `${years[0]} \u2013 ${years[projectionYears - 1]}`;

  drawCoverPage(doc, {
    companyName,
    title,
    subtitle: `${projectionYears}-Year Financial Projection (${projRange})`,
    meta: [
      `Report: ${title}`,
      `Period: FY ${projRange}`,
      "Classification: Confidential",
    ],
  }, brand);

  doc.addPage();
  drawTitle(doc, `${companyName} \u2014 ${title}`, 14, 15, undefined, brand);
  drawSubtitleRow(doc,
    `${projectionYears}-Year Projection (${projRange})`,
    entityTag, 14, 22, pageWidth, undefined, brand);
  drawSubtitle(doc, `Generated: ${format(new Date(), "MMM d, yyyy")}`, 14, 27, undefined, brand);

  const tableConfig = buildFinancialTableConfig(years, rows, orientation, 32, brand);
  autoTable(doc, tableConfig);

  doc.addPage();
  drawTitle(doc, `${companyName} \u2014 ${title} Performance Trend`, 14, 15, { fontSize: 16 }, brand);
  drawSubtitleRow(doc,
    `${projectionYears}-Year Revenue, Operating Expenses, and Adjusted NOI Trend`,
    entityTag, 14, 22, pageWidth, undefined, brand);

  const chartData = years.map((year, i) => ({
    label: String(year),
    value: getYearlyConsolidated(i)?.revenueTotal ?? 0,
  }));
  const noiData = years.map((year, i) => {
    const d = getYearlyConsolidated(i);
    return { label: String(year), value: d?.noi ?? 0 };
  });
  const expenseData = years.map((year, i) => ({
    label: String(year),
    value: getYearlyConsolidated(i)?.totalExpenses ?? 0,
  }));

  drawLineChart({
    doc,
    x: 14,
    y: 30,
    width: orientation === "landscape" ? 269 : 183,
    height: orientation === "landscape" ? 150 : 200,
    title: `Portfolio Performance (${projectionYears}-Year Projection)`,
    series: [
      { name: "Revenue", data: chartData, color: `#${brand.LINE_HEX[0]}` },
      { name: "Operating Expenses", data: expenseData, color: `#${brand.LINE_HEX[1] || brand.SAGE_HEX}` },
      { name: "ANOI", data: noiData, color: `#${brand.LINE_HEX[2] || brand.NAVY_HEX}` },
    ],
  });

  addFooters(doc, companyName, { skipPages: new Set([1]) }, brand);
  const { saveFile } = await import("./../../lib/exports/saveFile");
  await saveFile(doc.output("blob"), customFilename || `portfolio-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export interface ComprehensiveDashboardExportParams {
  financials: DashboardFinancials;
  properties: Property[];
  projectionYears: number;
  getFiscalYear: (i: number) => number;
  companyName?: string;
  incomeRows: ExportRow[];
  modelStartDate?: Date;
  themeColors?: ThemeColor[];
}

const fmtCompact = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v);

export async function exportDashboardComprehensivePDF(params: ComprehensiveDashboardExportParams, customFilename?: string): Promise<void> {
  const {
    financials, properties, projectionYears, getFiscalYear,
    companyName = "H+ Analytics",
    incomeRows, modelStartDate, themeColors,
  } = params;

  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [PAGE_DIMS.LANDSCAPE_W, PAGE_DIMS.LANDSCAPE_H] });
  const brand = buildBrandPalette(themeColors);
  const pageW = PAGE_DIMS.LANDSCAPE_W;
  const pageH = PAGE_DIMS.LANDSCAPE_H;
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const entityTag = `${companyName} \u2014 Consolidated Portfolio`;
  const dateStr = format(new Date(), "MMMM d, yyyy");
  const projRange = `${years[0]} \u2013 ${years[years.length - 1]}`;

  const NAVY: [number, number, number] = brand.NAVY_RGB;
  const ACCENT: [number, number, number] = brand.SAGE_RGB;

  function drawPageChrome() {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, 1.5, "F");
    doc.setFillColor(...ACCENT);
    doc.rect(0, 1.5, pageW, 0.8, "F");
    doc.setFillColor(...NAVY);
    doc.rect(0, pageH - 1.5, pageW, 1.5, "F");
    doc.setFillColor(...ACCENT);
    doc.rect(0, pageH - 2.3, pageW, 0.8, "F");
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.3);
    doc.line(10, 6, 10, pageH - 6);
    doc.line(pageW - 10, 6, pageW - 10, pageH - 6);
  }

  function drawSectionTitle(title: string, subtitle?: string): number {
    drawPageChrome();
    doc.setFillColor(...NAVY);
    doc.rect(16, 10, pageW - 32, 22, "F");
    doc.setFillColor(...ACCENT);
    doc.rect(16, 30, pageW - 32, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...brand.WHITE_RGB);
    doc.text(title, 22, 22);
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...ACCENT);
      doc.text(subtitle, 22, 28);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...brand.LIGHT_GRAY_RGB);
    doc.text(companyName, pageW - 22, 22, { align: "right" });
    return 38;
  }

  drawCoverPage(doc, {
    companyName,
    title: "Consolidated Portfolio Report",
    subtitle: `${projectionYears}-Year Financial Projection (${projRange})`,
    meta: [
      `Portfolio: ${properties.length} Properties \u2014 ${financials.totalRooms} Rooms`,
      `Period: FY ${projRange}`,
      "Classification: Confidential",
    ],
    dateStr,
  }, brand);

  doc.addPage();
  const metrics: DashboardSummaryMetric[] = [
    { label: "Portfolio IRR", value: `${(financials.portfolioIRR * 100).toFixed(1)}%`, section: "Return Metrics" },
    { label: "Equity Multiple", value: `${financials.equityMultiple.toFixed(2)}x`, section: "Return Metrics" },
    { label: "Cash-on-Cash Return", value: `${financials.cashOnCash.toFixed(1)}%`, section: "Return Metrics" },
    { label: "Total Equity Invested", value: fmtCompact(financials.totalInitialEquity), section: "Investment Summary" },
    { label: `Projected Exit Value (Year ${projectionYears})`, value: fmtCompact(financials.totalExitValue), section: "Investment Summary" },
    { label: "Total Properties / Rooms", value: `${properties.length} / ${financials.totalRooms}`, section: "Investment Summary" },
    { label: `${projectionYears}-Year Revenue`, value: fmtCompact(financials.totalProjectionRevenue), section: "Projection Totals" },
    { label: `${projectionYears}-Year NOI`, value: fmtCompact(financials.totalProjectionNOI), section: "Projection Totals" },
    { label: `${projectionYears}-Year Cash Flow`, value: fmtCompact(financials.totalProjectionCashFlow), section: "Projection Totals" },
  ];
  const propertyTable = properties.map(p => ({
    name: p.name, market: p.market, rooms: p.roomCount, status: p.status,
  }));
  drawPageChrome();
  drawDashboardSummaryPage(doc, pageW, entityTag, companyName, metrics, propertyTable, brand);

  function withChrome(config: Record<string, any>): Record<string, any> {
    const origDidDrawPage = config.didDrawPage;
    return {
      ...config,
      didDrawPage: (data: any) => {
        if (data.pageNumber > 1) drawPageChrome();
        if (origDidDrawPage) origDidDrawPage(data);
      },
    };
  }

  doc.addPage();
  let startY = drawSectionTitle("Consolidated Income Statement (USALI)", `${projectionYears}-Year Projection (${projRange})`);
  const incomeConfig = buildFinancialTableConfig(years, incomeRows, "landscape", startY, brand);
  autoTable(doc, withChrome(incomeConfig));

  doc.addPage();
  const cashFlowData = generatePortfolioCashFlowData(
    financials.allPropertyYearlyCF, projectionYears, getFiscalYear,
    new Set(["cfo", "cfi", "cff"]), false,
    properties.map(p => p.name),
    financials.yearlyConsolidatedCache,
  );
  startY = drawSectionTitle("Consolidated Cash Flow Statement", `${projectionYears}-Year Projection (${projRange})`);
  const cfConfig = buildFinancialTableConfig(cashFlowData.years, cashFlowData.rows, "landscape", startY, brand);
  autoTable(doc, withChrome(cfConfig));

  doc.addPage();
  const balanceSheetData = generatePortfolioBalanceSheetData(
    financials.allPropertyFinancials, projectionYears, getFiscalYear, modelStartDate,
  );
  startY = drawSectionTitle("Consolidated Balance Sheet", `${projectionYears}-Year Projection (${projRange})`);
  const bsConfig = buildFinancialTableConfig(balanceSheetData.years, balanceSheetData.rows, "landscape", startY, brand);
  autoTable(doc, withChrome(bsConfig));

  const investmentData = generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear);
  const investmentSections = splitRowsBySectionHeaders(investmentData.rows);

  const majorSectionTitles = new Set([
    "Free Cash Flow to Investors",
    "Per-Property Returns",
    "Property-Level IRR Analysis",
    "Discounted Cash Flow (DCF) Analysis",
  ]);

  let pendingRows: ExportRow[] = [];
  let pendingSectionTitle = "Portfolio Investment Analysis";

  function flushPending() {
    if (pendingRows.length === 0) return;
    doc.addPage();
    startY = drawSectionTitle(pendingSectionTitle, `${projectionYears}-Year Projection (${projRange})`);
    const cfg = buildFinancialTableConfig(investmentData.years, pendingRows, "landscape", startY, brand);
    autoTable(doc, withChrome(cfg));
    pendingRows = [];
  }

  for (const section of investmentSections) {
    if (majorSectionTitles.has(section.title)) {
      flushPending();
      pendingSectionTitle = section.title;
      pendingRows = section.rows;
    } else {
      pendingRows.push(...section.rows);
    }
  }
  flushPending();

  const cf = financials.allPropertyYearlyCF;
  doc.addPage();
  startY = drawSectionTitle("Investment Returns", `${projectionYears}-Year Projection (${projRange})`);

  const noiChartData = years.map((_, i) => ({
    label: String(years[i]),
    value: financials.yearlyConsolidatedCache[i]?.noi ?? 0,
  }));
  const anoiChartData = years.map((_, i) => ({
    label: String(years[i]),
    value: financials.yearlyConsolidatedCache[i]?.anoi ?? 0,
  }));
  const debtServiceData = years.map((_, y) => ({
    label: String(years[y]),
    value: cf.reduce((sum, prop) => sum + (prop[y]?.debtService ?? 0), 0),
  }));
  const fcfeData = years.map((_, y) => ({
    label: String(years[y]),
    value: cf.reduce((sum, prop) => sum + (prop[y]?.freeCashFlowToEquity ?? 0), 0),
  }));

  drawLineChart({
    doc,
    x: 16,
    y: startY,
    width: pageW - 32,
    height: 140,
    title: `Investment Returns (${projectionYears}-Year Projection)`,
    series: [
      { name: "Net Operating Income (NOI)", data: noiChartData, color: `#${brand.LINE_HEX[0]}` },
      { name: "Adjusted NOI (ANOI)", data: anoiChartData, color: `#${brand.LINE_HEX[1] || brand.SAGE_HEX}` },
      { name: "Debt Service", data: debtServiceData, color: `#${brand.LINE_HEX[2] || brand.NAVY_HEX}` },
      { name: "Free Cash Flow to Equity", data: fcfeData, color: `#${brand.LINE_HEX[3] || brand.DARK_GREEN_HEX}` },
    ],
  });

  doc.addPage();
  startY = drawSectionTitle("Performance Trend", `${projectionYears}-Year Revenue, Operating Expenses, and Adjusted NOI`);

  const chartData = years.map((year, i) => ({
    label: String(year),
    value: financials.yearlyConsolidatedCache[i]?.revenueTotal ?? 0,
  }));
  const noiData = years.map((year, i) => {
    const d = financials.yearlyConsolidatedCache[i];
    return { label: String(year), value: d?.noi ?? 0 };
  });
  const expenseData = years.map((year, i) => ({
    label: String(year),
    value: financials.yearlyConsolidatedCache[i]?.totalExpenses ?? 0,
  }));

  drawLineChart({
    doc,
    x: 16,
    y: startY,
    width: pageW - 32,
    height: 140,
    title: `Portfolio Performance (${projectionYears}-Year Projection)`,
    series: [
      { name: "Revenue", data: chartData, color: `#${brand.LINE_HEX[0]}` },
      { name: "Operating Expenses", data: expenseData, color: `#${brand.LINE_HEX[1] || brand.SAGE_HEX}` },
      { name: "ANOI", data: noiData, color: `#${brand.LINE_HEX[2] || brand.NAVY_HEX}` },
    ],
  });

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    if (pg === 1) continue;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...brand.LIGHT_GRAY_RGB);
    doc.text(companyName, 16, pageH - 5);
    doc.text("CONFIDENTIAL", pageW / 2, pageH - 5, { align: "center" });
    doc.text(`${pg} / ${totalPages}`, pageW - 16, pageH - 5, { align: "right" });
  }

  const { saveFile: savePdfFile } = await import("./../../lib/exports/saveFile");
  await savePdfFile(doc.output("blob"), customFilename || `${companyName} - Consolidated Portfolio Report.pdf`);
}

export { originalExportPortfolioPPTX as exportPortfolioPPTX };
export { exportTablePNG };
