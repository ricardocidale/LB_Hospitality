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
import type { OverviewExportData } from "./overviewExportData";

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
  customFilename?: string,
  overviewData?: OverviewExportData
): Promise<void> {
  const XLSX = await import("xlsx");
  const { applyCurrencyFormat, applyHeaderStyle, setColumnWidths } = await import("@/lib/exports/excel/helpers");
  const wb = (XLSX as any).utils.book_new();

  const fmtUSD = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;

  if (overviewData) {
    const { portfolioKPIs: kpis, capitalStructure: cs } = overviewData;

    const summaryData: (string | number)[][] = [
      ["Portfolio Summary"],
      [],
      ["Return Metrics"],
      ["Portfolio IRR", fmtPct(kpis.portfolioIRR * 100)],
      ["Equity Multiple", `${kpis.equityMultiple.toFixed(2)}x`],
      ["Cash-on-Cash Return", fmtPct(kpis.cashOnCash)],
      [],
      ["Investment Summary"],
      ["Total Equity Invested", fmtUSD(kpis.totalInitialEquity)],
      ["Projected Exit Value", fmtUSD(kpis.totalExitValue)],
      ["Properties", cs.totalProperties],
      ["Total Rooms", cs.totalRooms],
      [],
      ["Projection Totals"],
      [`${cs.holdPeriod}-Year Revenue`, fmtUSD(kpis.totalProjectionRevenue)],
      [`${cs.holdPeriod}-Year NOI`, fmtUSD(kpis.totalProjectionNOI)],
      [`${cs.holdPeriod}-Year ANOI`, fmtUSD(kpis.totalProjectionANOI)],
      [`${cs.holdPeriod}-Year Cash Flow`, fmtUSD(kpis.totalProjectionCashFlow)],
      [],
      ["Capital Structure"],
      ["Total Purchase Price", fmtUSD(cs.totalPurchasePrice)],
      ["Avg Purchase Price", fmtUSD(cs.avgPurchasePrice)],
      ["Avg Exit Cap Rate", fmtPct(cs.avgExitCapRate * 100)],
      ["Hold Period", `${cs.holdPeriod} Years`],
      ["ANOI Margin", fmtPct(cs.anoiMargin)],
      ["Avg Rooms / Property", cs.avgRoomsPerProperty.toFixed(0)],
      ["Avg Daily Rate (ADR)", fmtUSD(cs.avgADR)],
    ];
    const wsSummary = (XLSX as any).utils.aoa_to_sheet(summaryData);
    setColumnWidths(wsSummary, [36, 20]);
    (XLSX as any).utils.book_append_sheet(wb, wsSummary, "Portfolio Summary");

    const propHeaders = ["#", "Property", "Market", "Rooms", "Status", "Acquisition Cost", "ADR", "IRR"];
    const propRows = overviewData.propertyItems.map((p, i) => [
      i + 1, p.name, p.market, p.rooms, p.status, fmtUSD(p.acquisitionCost), fmtUSD(p.adr), fmtPct(p.irr),
    ]);
    const wsProps = (XLSX as any).utils.aoa_to_sheet([propHeaders, ...propRows]);
    setColumnWidths(wsProps, [5, 28, 18, 10, 16, 20, 12, 10]);
    (XLSX as any).utils.book_append_sheet(wb, wsProps, "Properties & IRR");

    const mktRows: (string | number)[][] = [
      ["Market", "Properties", "Share (%)"],
      ...Object.entries(overviewData.marketCounts).map(([m, c]) => [
        m, c, parseFloat(((c / cs.totalProperties) * 100).toFixed(1)),
      ]),
      [],
      ["Status", "Properties", "Share (%)"],
      ...Object.entries(overviewData.statusCounts).map(([s, c]) => [
        s, c, parseFloat(((c / cs.totalProperties) * 100).toFixed(1)),
      ]),
    ];
    const wsMkt = (XLSX as any).utils.aoa_to_sheet(mktRows);
    setColumnWidths(wsMkt, [24, 14, 14]);
    (XLSX as any).utils.book_append_sheet(wb, wsMkt, "Market & Status");

    const projHeader = ["Year", "Revenue", "NOI", "ANOI", "Cash Flow"];
    const projRows = overviewData.revenueNOIData.map((d) => [
      d.year, fmtUSD(d.revenue), fmtUSD(d.noi), fmtUSD(d.anoi), fmtUSD(d.cashFlow),
    ]);
    const wsProj = (XLSX as any).utils.aoa_to_sheet([projHeader, ...projRows]);
    setColumnWidths(wsProj, [10, 18, 18, 18, 18]);
    (XLSX as any).utils.book_append_sheet(wb, wsProj, "Revenue Projection");

    const wfHeader = ["", ...overviewData.yearLabels.map(String)];
    const wfRows = overviewData.waterfallRows.map((row) => [
      row.label,
      ...row.values.map((v) => (row.isDeduction ? -v : v)),
    ]);
    const wsWf = (XLSX as any).utils.aoa_to_sheet([wfHeader, ...wfRows]);
    setColumnWidths(wsWf, [40, ...overviewData.yearLabels.map(() => 16)]);
    applyCurrencyFormat(wsWf, [wfHeader, ...wfRows]);
    applyHeaderStyle(wsWf, [wfHeader, ...wfRows]);
    (XLSX as any).utils.book_append_sheet(wb, wsWf, "USALI Waterfall");
  }

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
      { name: "Operating Expenses", data: expenseData, color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
      { name: "ANOI", data: noiData, color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
    ],
    brand,
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
  overviewOnly?: boolean;
  statementsOnly?: boolean;
  overviewData?: OverviewExportData;
}

const fmtCompact = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v);

export async function exportDashboardComprehensivePDF(params: ComprehensiveDashboardExportParams, customFilename?: string): Promise<void> {
  const {
    financials, properties, projectionYears, getFiscalYear,
    companyName = "H+ Analytics",
    incomeRows, modelStartDate, themeColors,
    overviewOnly = false, statementsOnly = false,
    overviewData,
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

  const NAVY: [number, number, number] = brand.PRIMARY_RGB;
  const ACCENT: [number, number, number] = brand.SECONDARY_RGB;

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
    doc.setTextColor(...brand.MUTED_RGB);
    doc.text(companyName, pageW - 22, 22, { align: "right" });
    return 38;
  }

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

  let startY: number;
  let needsNewFirstPage = false;

  if (!statementsOnly) {
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

    if (overviewOnly && overviewData) {
      const fmtUSD = (v: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
      const fmtPct = (v: number) => `${v.toFixed(1)}%`;

      doc.addPage();
      startY = drawSectionTitle("Revenue & ANOI Projection", `${projectionYears}-Year Consolidated Projection`);
      const revData = overviewData.revenueNOIData.map((d) => ({ label: String(d.year), value: d.revenue }));
      const anoiData = overviewData.revenueNOIData.map((d) => ({ label: String(d.year), value: d.anoi }));
      const noiData = overviewData.revenueNOIData.map((d) => ({ label: String(d.year), value: d.noi }));
      const cfData = overviewData.revenueNOIData.map((d) => ({ label: String(d.year), value: d.cashFlow }));
      drawLineChart({
        doc, x: 16, y: startY!, width: pageW - 32, height: 130,
        title: `Portfolio Revenue & ANOI (${projectionYears}-Year Projection)`,
        series: [
          { name: "Revenue", data: revData, color: `#${brand.LINE_HEX[0]}` },
          { name: "NOI", data: noiData, color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
          { name: "ANOI", data: anoiData, color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
          { name: "Cash Flow", data: cfData, color: `#${brand.LINE_HEX[3] || brand.ACCENT_HEX}` },
        ],
        brand,
      });
      const projTableY = startY! + 140;
      autoTable(doc, {
        startY: projTableY,
        margin: { left: 16, right: 16 },
        head: [["Year", "Revenue", "NOI", "ANOI", "Cash Flow"]],
        body: overviewData.revenueNOIData.map((d) => [
          String(d.year), fmtUSD(d.revenue), fmtUSD(d.noi), fmtUSD(d.anoi), fmtUSD(d.cashFlow),
        ]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: brand.SECONDARY_RGB, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didDrawPage: (data: any) => { if (data.pageNumber > 1) drawPageChrome(); },
      });

      doc.addPage();
      startY = drawSectionTitle("Portfolio & Capital Structure", "Portfolio Composition and Capital Summary");
      const cs = overviewData.capitalStructure;
      const compositionRows = [
        ["Properties", String(cs.totalProperties)],
        ["Total Rooms", String(cs.totalRooms)],
        ["Avg Rooms / Property", cs.avgRoomsPerProperty.toFixed(0)],
        ["Markets", String(cs.totalMarkets)],
        ["Avg Daily Rate (ADR)", fmtUSD(cs.avgADR)],
      ];
      const capitalRows = [
        ["Total Purchase Price", fmtUSD(cs.totalPurchasePrice)],
        ["Avg Purchase Price", fmtUSD(cs.avgPurchasePrice)],
        ["Avg Exit Cap Rate", fmtPct(cs.avgExitCapRate * 100)],
        ["Hold Period", `${cs.holdPeriod} Years`],
        ["ANOI Margin", fmtPct(cs.anoiMargin)],
      ];
      autoTable(doc, {
        startY: startY!,
        margin: { left: 16, right: pageW / 2 + 4 },
        head: [["Portfolio Composition", "Value"]],
        body: compositionRows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: brand.SECONDARY_RGB, textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      autoTable(doc, {
        startY: startY!,
        margin: { left: pageW / 2 + 4, right: 16 },
        head: [["Capital Structure", "Value"]],
        body: capitalRows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: brand.PRIMARY_RGB, textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right", fontStyle: "bold", textColor: brand.ACCENT_RGB } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.addPage();
      startY = drawSectionTitle("Portfolio Composition", "Geographic and Status Distribution");
      const mktRows = Object.entries(overviewData.marketCounts).map(([market, count]) => [
        market, String(count), fmtPct((count / overviewData.capitalStructure.totalProperties) * 100),
      ]);
      const stsRows = Object.entries(overviewData.statusCounts).map(([status, count]) => [
        status, String(count), fmtPct((count / overviewData.capitalStructure.totalProperties) * 100),
      ]);
      autoTable(doc, {
        startY: startY!,
        margin: { left: 16, right: pageW / 2 + 4 },
        head: [["Market", "Properties", "Share"]],
        body: mktRows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: brand.SECONDARY_RGB, textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right", fontStyle: "bold", textColor: brand.ACCENT_RGB } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      autoTable(doc, {
        startY: startY!,
        margin: { left: pageW / 2 + 4, right: 16 },
        head: [["Status", "Properties", "Share"]],
        body: stsRows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: brand.PRIMARY_RGB, textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right", fontStyle: "bold", textColor: brand.ACCENT_RGB } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.addPage();
      startY = drawSectionTitle("USALI Profit Waterfall", `${projectionYears}-Year Consolidated USALI Income Bridge`);
      const wfHead = ["", ...overviewData.yearLabels.map(String)];
      const wfBody = overviewData.waterfallRows.map((row) => [
        row.label,
        ...row.values.map((v) => (row.isDeduction ? `(${fmtUSD(v)})` : fmtUSD(v))),
      ]);
      autoTable(doc, {
        startY: startY!,
        margin: { left: 16, right: 16 },
        head: [wfHead],
        body: wfBody,
        styles: { fontSize: 6.5, cellPadding: 1.5 },
        headStyles: { fillColor: brand.SECONDARY_RGB, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
        bodyStyles: { textColor: brand.FOREGROUND_RGB },
        didParseCell: (data: any) => {
          if (data.section === "body") {
            const row = overviewData.waterfallRows[data.row.index];
            if (row?.isSubtotal) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.fillColor = [240, 247, 244];
            }
            if (row?.isDeduction) {
              data.cell.styles.textColor = [180, 60, 60];
            }
          }
        },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
        alternateRowStyles: {},
        didDrawPage: (data: any) => { if (data.pageNumber > 1) drawPageChrome(); },
      });

      doc.addPage();
      startY = drawSectionTitle("Portfolio Insights", `${projectionYears}-Year Properties & Key Metrics`);
      const insightRows = overviewData.propertyItems.map((p, i) => [
        String(i + 1), p.name, p.market, String(p.rooms), p.status,
        fmtUSD(p.acquisitionCost), fmtUSD(p.adr), `${p.irr.toFixed(1)}%`,
      ]);
      autoTable(doc, {
        startY: startY!,
        margin: { left: 16, right: 16 },
        head: [["#", "Property", "Market", "Rooms", "Status", "Acquisition", "ADR", "IRR"]],
        body: insightRows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: brand.SECONDARY_RGB, textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          3: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
          7: { halign: "right", fontStyle: "bold", textColor: brand.ACCENT_RGB },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didDrawPage: (data: any) => { if (data.pageNumber > 1) drawPageChrome(); },
      });
      const afterTableY = (doc as any).lastAutoTable?.finalY ?? (startY! + 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...brand.ACCENT_RGB);
      doc.text("Portfolio Insights", 16, afterTableY + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...brand.FOREGROUND_RGB);
      const { kpis } = { kpis: overviewData.portfolioKPIs };
      const insightLines = [
        `Markets: ${Object.entries(overviewData.marketCounts).map(([m, c]) => `${m} (${c})`).join(", ")}`,
        `${projectionYears}-Year Total Revenue: ${fmtUSD(kpis.totalProjectionRevenue)}`,
        `${projectionYears}-Year Total NOI: ${fmtUSD(kpis.totalProjectionNOI)}`,
        `${projectionYears}-Year Total ANOI: ${fmtUSD(kpis.totalProjectionANOI)}`,
        `${projectionYears}-Year Total Cash Flow: ${fmtUSD(kpis.totalProjectionCashFlow)}`,
      ];
      insightLines.forEach((line, i) => {
        doc.text(`\u2022  ${line}`, 18, afterTableY + 18 + i * 6);
      });
    }
  } else {
    needsNewFirstPage = true;
  }

  if (!overviewOnly) {
    if (needsNewFirstPage) {
      startY = drawSectionTitle("Consolidated Income Statement (USALI)", `${projectionYears}-Year Projection (${projRange})`);
      needsNewFirstPage = false;
    } else {
      doc.addPage();
      startY = drawSectionTitle("Consolidated Income Statement (USALI)", `${projectionYears}-Year Projection (${projRange})`);
    }
    const incomeConfig = buildFinancialTableConfig(years, incomeRows, "landscape", startY!, brand);
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
  }

  if (!overviewOnly && !statementsOnly) {
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

    const flushPending = () => {
      if (pendingRows.length === 0) return;
      doc.addPage();
      startY = drawSectionTitle(pendingSectionTitle, `${projectionYears}-Year Projection (${projRange})`);
      const cfg = buildFinancialTableConfig(investmentData.years, pendingRows, "landscape", startY!, brand);
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
      y: startY!,
      width: pageW - 32,
      height: 140,
      title: `Investment Returns (${projectionYears}-Year Projection)`,
      series: [
        { name: "Net Operating Income (NOI)", data: noiChartData, color: `#${brand.LINE_HEX[0]}` },
        { name: "Adjusted NOI (ANOI)", data: anoiChartData, color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
        { name: "Debt Service", data: debtServiceData, color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
        { name: "Free Cash Flow to Equity", data: fcfeData, color: `#${brand.LINE_HEX[3] || brand.ACCENT_HEX}` },
      ],
      brand,
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
        { name: "Operating Expenses", data: expenseData, color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
        { name: "ANOI", data: noiData, color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
      ],
      brand,
    });
  }

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    if (pg === 1) continue;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...brand.MUTED_RGB);
    doc.text(companyName, 16, pageH - 5);
    doc.text("CONFIDENTIAL", pageW / 2, pageH - 5, { align: "center" });
    doc.text(`${pg} / ${totalPages}`, pageW - 16, pageH - 5, { align: "right" });
  }

  const suffix = overviewOnly ? "Portfolio Overview" : statementsOnly ? "Financial Statements" : "Consolidated Portfolio Report";
  const { saveFile: savePdfFile } = await import("./../../lib/exports/saveFile");
  await savePdfFile(doc.output("blob"), customFilename || `${companyName} - ${suffix}.pdf`);
}

export function exportOverviewCSV(
  overviewData: OverviewExportData,
  incomeRows: ExportRow[],
  incomeYears: (string | number)[],
  filename: string,
): void {
  const { portfolioKPIs: kpis, capitalStructure: cs } = overviewData;
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;
  const fmtUSD = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  const lines: string[] = [];

  lines.push("PORTFOLIO SUMMARY");
  lines.push(`Portfolio IRR,${fmtPct(kpis.portfolioIRR * 100)}`);
  lines.push(`Equity Multiple,${kpis.equityMultiple.toFixed(2)}x`);
  lines.push(`Cash-on-Cash Return,${fmtPct(kpis.cashOnCash)}`);
  lines.push(`Total Equity Invested,${fmtUSD(kpis.totalInitialEquity)}`);
  lines.push(`Projected Exit Value,${fmtUSD(kpis.totalExitValue)}`);
  lines.push(`Properties,${cs.totalProperties}`);
  lines.push(`Total Rooms,${cs.totalRooms}`);
  lines.push(`Avg Daily Rate (ADR),${fmtUSD(cs.avgADR)}`);
  lines.push(`Total Purchase Price,${fmtUSD(cs.totalPurchasePrice)}`);
  lines.push(`Avg Exit Cap Rate,${fmtPct(cs.avgExitCapRate * 100)}`);
  lines.push(`Hold Period,${cs.holdPeriod} Years`);
  lines.push(`ANOI Margin,${fmtPct(cs.anoiMargin)}`);
  lines.push(`${cs.holdPeriod}-Year Revenue,${fmtUSD(kpis.totalProjectionRevenue)}`);
  lines.push(`${cs.holdPeriod}-Year NOI,${fmtUSD(kpis.totalProjectionNOI)}`);
  lines.push(`${cs.holdPeriod}-Year ANOI,${fmtUSD(kpis.totalProjectionANOI)}`);
  lines.push(`${cs.holdPeriod}-Year Cash Flow,${fmtUSD(kpis.totalProjectionCashFlow)}`);

  lines.push("");
  lines.push("PROPERTIES & IRR");
  lines.push("#,Property,Market,Rooms,Status,Acquisition Cost,ADR,IRR");
  overviewData.propertyItems.forEach((p, i) => {
    lines.push(`${i + 1},"${p.name}","${p.market}",${p.rooms},"${p.status}",${fmtUSD(p.acquisitionCost)},${fmtUSD(p.adr)},${fmtPct(p.irr)}`);
  });

  lines.push("");
  lines.push("MARKET DISTRIBUTION");
  lines.push("Market,Properties,Share (%)");
  Object.entries(overviewData.marketCounts).forEach(([m, c]) => {
    lines.push(`"${m}",${c},${((c / cs.totalProperties) * 100).toFixed(1)}`);
  });

  lines.push("");
  lines.push("STATUS DISTRIBUTION");
  lines.push("Status,Properties,Share (%)");
  Object.entries(overviewData.statusCounts).forEach(([s, c]) => {
    lines.push(`"${s}",${c},${((c / cs.totalProperties) * 100).toFixed(1)}`);
  });

  lines.push("");
  lines.push("REVENUE & ANOI PROJECTION");
  lines.push("Year,Revenue,NOI,ANOI,Cash Flow");
  overviewData.revenueNOIData.forEach((d) => {
    lines.push(`${d.year},${fmtUSD(d.revenue)},${fmtUSD(d.noi)},${fmtUSD(d.anoi)},${fmtUSD(d.cashFlow)}`);
  });

  lines.push("");
  lines.push("USALI PROFIT WATERFALL");
  lines.push(`"",${overviewData.yearLabels.map(String).join(",")}`);
  overviewData.waterfallRows.forEach((row) => {
    const values = row.values.map((v) => (row.isDeduction ? -v : v));
    lines.push(`"${row.label}",${values.join(",")}`);
  });

  lines.push("");
  lines.push("CONSOLIDATED INCOME STATEMENT");
  lines.push(`"",${incomeYears.map(String).join(",")}`);
  incomeRows.forEach((row) => {
    const label = `"${"  ".repeat(row.indent || 0)}${row.category}"`;
    lines.push(`${label},${row.values.join(",")}`);
  });

  downloadCSV(lines.join("\n"), filename);
}

export function exportAllPortfolioStatementsCSV(
  incomeData: { years: (string | number)[]; rows: ExportRow[] },
  cashFlowData: { years: (string | number)[]; rows: ExportRow[] },
  balanceSheetData: { years: (string | number)[]; rows: ExportRow[] },
  investmentData: { years: (string | number)[]; rows: ExportRow[] },
  filename: string,
): void {
  const indent = (row: ExportRow) => (row.indent ? "  ".repeat(row.indent) : "");
  const section = (label: string, data: { years: (string | number)[]; rows: ExportRow[] }): string[] => {
    const lines: string[] = [];
    lines.push(`"${label}",${data.years.map(String).join(",")}`);
    data.rows.forEach(row => {
      lines.push(`"${indent(row)}${row.category}",${row.values.map((v: number) => v.toFixed(0)).join(",")}`);
    });
    return lines;
  };
  const all: string[] = [];
  all.push(...section("CONSOLIDATED INCOME STATEMENT", incomeData));
  all.push("");
  all.push(...section("CONSOLIDATED CASH FLOW STATEMENT", cashFlowData));
  all.push("");
  all.push(...section("CONSOLIDATED BALANCE SHEET", balanceSheetData));
  all.push("");
  all.push(...section("CONSOLIDATED INVESTMENT ANALYSIS", investmentData));
  downloadCSV(all.join("\n"), filename);
}

export { originalExportPortfolioPPTX as exportPortfolioPPTX };
export { exportTablePNG };
