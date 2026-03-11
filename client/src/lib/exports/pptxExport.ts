/**
 * pptxExport.ts — PowerPoint (.pptx) presentation generation
 *
 * Generates branded investor-ready slide decks using the pptxgenjs library.
 * All presentations use 16:9 landscape (LAYOUT_WIDE = 13.33" × 7.5").
 * Three export targets are supported:
 *   1. Portfolio — consolidated multi-property investment summary
 *   2. Property — single-property financial report
 *   3. Company — management company financial report
 *
 * Financial tables always fit all year-columns on a single slide width.
 * Values use short format ($1.2M, $450K) for readability at presentation scale.
 *
 * Color palette follows the brand guidelines (sage green,
 * dark green, warm neutrals).
 */
import { format } from "date-fns";

const SAGE = "9FBCA4";
const DARK_GREEN = "257D41";
const DARK_TEXT = "3D3D3D";
const LIGHT_BG = "FFF9F5";
const WHITE = "FFFFFF";
const GRAY = "666666";

interface SlideTableRow {
  category: string;
  values: (string | number)[];
  indent?: number;
  isBold?: boolean;
}

function addPageNumber(slide: any) {
  slide.addText(
    [{ text: "", options: { field: "slidenum" } }],
    {
      x: 12.2, y: 7.0, w: 0.8, h: 0.3,
      fontSize: 8, fontFace: "Arial", color: "999999", align: "right",
    }
  );
}

/** Create a dark-background title slide with brand name, report title, and date. */
function addTitleSlide(pres: any, title: string, subtitle: string, companyName: string) {
  const slide = pres.addSlide();
  slide.background = { color: "1a2a3a" };
  slide.addShape("rect", { x: 0, y: 0, w: "100%", h: 0.05, fill: { color: SAGE } });
  slide.addText(companyName, {
    x: 0.5, y: 1.5, w: 12, h: 0.6,
    fontSize: 28, fontFace: "Arial", color: SAGE, bold: true,
  });
  slide.addText(title, {
    x: 0.5, y: 2.2, w: 12, h: 0.5,
    fontSize: 22, fontFace: "Arial", color: WHITE,
  });
  slide.addText(subtitle, {
    x: 0.5, y: 2.8, w: 12, h: 0.4,
    fontSize: 14, fontFace: "Arial", color: "AAAAAA",
  });
  slide.addText(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, {
    x: 0.5, y: 4.5, w: 12, h: 0.3,
    fontSize: 10, fontFace: "Arial", color: "888888",
  });
  addPageNumber(slide);
}

/**
 * Create a slide showing KPI metric cards in a 3-column grid layout.
 * Each card displays a large formatted value with a descriptive label below it.
 */
function addMetricsSlide(pres: any, title: string, metrics: { label: string; value: string }[]) {
  const slide = pres.addSlide();
  slide.addText(title, {
    x: 0.5, y: 0.3, w: 12, h: 0.5,
    fontSize: 20, fontFace: "Arial", color: DARK_GREEN, bold: true,
  });
  slide.addShape("rect", { x: 0.5, y: 0.85, w: 12, h: 0.02, fill: { color: SAGE } });

  const cols = 3;
  const cardW = 3.8;
  const cardH = 1.1;
  const gapX = 0.35;
  const startX = 0.5;
  const startY = 1.1;

  metrics.forEach((m, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + 0.15);

    slide.addShape("rect", {
      x, y, w: cardW, h: cardH,
      fill: { color: "F5F9F6" },
      line: { color: SAGE, width: 1 },
      rectRadius: 0.1,
    });
    slide.addText(m.value, {
      x: x + 0.15, y: y + 0.15, w: cardW - 0.3, h: 0.5,
      fontSize: 18, fontFace: "Arial", color: DARK_GREEN, bold: true,
    });
    slide.addText(m.label, {
      x: x + 0.15, y: y + 0.6, w: cardW - 0.3, h: 0.35,
      fontSize: 9, fontFace: "Arial", color: GRAY,
    });
  });
  addPageNumber(slide);
}

/** Format a numeric value using short notation ($1.2M, $450K) for slide readability. */
function formatVal(v: string | number): string {
  if (typeof v === "number") {
    const abs = Math.abs(v);
    const neg = v < 0;
    let formatted: string;
    if (abs >= 1_000_000) {
      formatted = `$${(abs / 1_000_000).toFixed(1)}M`;
    } else if (abs >= 1_000) {
      formatted = `$${(abs / 1_000).toFixed(0)}K`;
    } else if (abs > 0) {
      formatted = `$${abs.toFixed(0)}`;
    } else {
      return "—";
    }
    return neg ? `(${formatted})` : formatted;
  }
  return String(v);
}

/**
 * Add a single slide containing a financial data table with all year-columns
 * fitted to the full slide width (13.33" with margins). Column widths are
 * computed dynamically so every year fits on one slide.
 */
function addFinancialTableSlide(
  pres: any,
  title: string,
  years: string[],
  rows: SlideTableRow[],
) {
  const slide = pres.addSlide();
  const slideW = 13.33;
  const marginX = 0.3;
  const tableW = slideW - marginX * 2;
  const labelW = Math.max(2.0, Math.min(3.5, tableW - years.length * 0.9));
  const dataW = (tableW - labelW) / years.length;
  const fontSize = years.length <= 6 ? 7 : years.length <= 10 ? 6 : 5;

  slide.addText(title, {
    x: marginX, y: 0.2, w: tableW, h: 0.4,
    fontSize: 14, fontFace: "Arial", color: DARK_GREEN, bold: true,
  });

  const headerRow: any[] = [
    { text: "", options: { fill: { color: SAGE }, fontFace: "Arial", fontSize, color: WHITE, bold: true } },
    ...years.map((y) => ({
      text: y,
      options: { fill: { color: SAGE }, fontFace: "Arial", fontSize, color: WHITE, bold: true, align: "right" as const },
    })),
  ];

  const tableRows: any[] = [headerRow];
  const filteredRows = rows.filter((r) => r.category !== "");

  filteredRows.forEach((row) => {
    const isSectionHeader = row.category === row.category.toUpperCase() && row.category.length > 2 && !row.category.startsWith(" ");
    const isTotal = row.isBold || row.category.toLowerCase().startsWith("total") ||
      row.category.toLowerCase().includes("net operating") ||
      row.category.toLowerCase().includes("gross operating") ||
      row.category.toLowerCase().includes("adjusted") ||
      row.category.toLowerCase().includes("gaap net") ||
      row.category.toLowerCase().includes("free cash flow") ||
      row.category.toLowerCase().includes("closing cash");

    const label = (row.indent ? "  ".repeat(row.indent) : "") + row.category;
    const bgColor = isSectionHeader ? "EFF5F0" : WHITE;

    const cells: any[] = [
      {
        text: label,
        options: {
          fontFace: "Arial", fontSize, color: DARK_TEXT,
          bold: isSectionHeader || isTotal,
          fill: { color: bgColor },
        },
      },
      ...row.values.map((v) => ({
        text: formatVal(v),
        options: {
          fontFace: "Arial", fontSize, color: DARK_TEXT,
          bold: isTotal,
          align: "right" as const,
          fill: { color: bgColor },
        },
      })),
    ];
    tableRows.push(cells);
  });

  slide.addTable(tableRows, {
    x: marginX,
    y: 0.7,
    w: tableW,
    colW: [labelW, ...years.map(() => dataW)],
    border: { type: "solid", pt: 0.5, color: "DDDDDD" },
    rowH: 0.2,
    autoPage: true,
    autoPageRepeatHeader: true,
    newSlideStartY: 0.5,
  });
  addPageNumber(slide);
}

export interface PortfolioExportData {
  projectionYears: number;
  getFiscalYear: (i: number) => number;
  totalInitialEquity: number;
  totalExitValue: number;
  equityMultiple: number;
  portfolioIRR: number;
  cashOnCash: number;
  totalProperties: number;
  totalRooms: number;
  totalProjectionRevenue: number;
  totalProjectionNOI: number;
  totalProjectionCashFlow: number;
  incomeData: { years: string[]; rows: SlideTableRow[] };
  cashFlowData: { years: string[]; rows: SlideTableRow[] };
  balanceSheetData: { years: string[]; rows: SlideTableRow[] };
  investmentData: { years: string[]; rows: SlideTableRow[] };
}

/**
 * Generate and download a full portfolio investment report as a PowerPoint deck.
 * Includes title slide, investment summary KPIs, and four financial tables
 * (Income Statement, Cash Flow, Balance Sheet, Investment Analysis).
 */
export async function exportPortfolioPPTX(data: PortfolioExportData, companyName = "Hospitality Business Group") {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new (pptxgen as any)();
  pres.layout = "LAYOUT_WIDE";
  pres.author = companyName;
  pres.title = "Portfolio Investment Report";

  addTitleSlide(pres, "Portfolio Investment Report", `${data.projectionYears}-Year Projection (${data.getFiscalYear(0)} – ${data.getFiscalYear(data.projectionYears - 1)})`, companyName);

  addMetricsSlide(pres, "Investment Summary", [
    { label: "Total Equity Invested", value: `$${(data.totalInitialEquity / 1000000).toFixed(1)}M` },
    { label: `Exit Value (Year ${data.projectionYears})`, value: `$${(data.totalExitValue / 1000000).toFixed(1)}M` },
    { label: "Equity Multiple", value: `${data.equityMultiple.toFixed(2)}x` },
    { label: "Portfolio IRR", value: `${(data.portfolioIRR * 100).toFixed(1)}%` },
    { label: "Avg Cash-on-Cash", value: `${data.cashOnCash.toFixed(1)}%` },
    { label: "Properties / Rooms", value: `${data.totalProperties} / ${data.totalRooms}` },
    { label: `${data.projectionYears}-Year Revenue`, value: `$${(data.totalProjectionRevenue / 1000000).toFixed(1)}M` },
    { label: `${data.projectionYears}-Year NOI`, value: `$${(data.totalProjectionNOI / 1000000).toFixed(1)}M` },
    { label: `${data.projectionYears}-Year Cash Flow`, value: `$${(data.totalProjectionCashFlow / 1000000).toFixed(1)}M` },
  ]);

  addFinancialTableSlide(pres, "Consolidated Income Statement", data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(pres, "Consolidated Cash Flow Statement", data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(pres, "Consolidated Balance Sheet", data.balanceSheetData.years, data.balanceSheetData.rows);
  addFinancialTableSlide(pres, "Investment Analysis", data.investmentData.years, data.investmentData.rows);

  pres.writeFile({ fileName: "Portfolio-Investment-Report.pptx" });
}

export interface PropertyExportData {
  propertyName: string;
  projectionYears: number;
  getFiscalYear: (i: number) => string;
  incomeData: { years: string[]; rows: SlideTableRow[] };
  cashFlowData: { years: string[]; rows: SlideTableRow[] };
  balanceSheetData: { years: string[]; rows: SlideTableRow[] };
}

/**
 * Generate and download a single-property financial report as a PowerPoint deck.
 * Includes title slide plus Income Statement, Cash Flow, and Balance Sheet tables.
 */
export async function exportPropertyPPTX(data: PropertyExportData, companyName = "Hospitality Business Group") {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new (pptxgen as any)();
  pres.layout = "LAYOUT_WIDE";
  pres.author = companyName;
  pres.title = `${data.propertyName} Financial Report`;

  addTitleSlide(pres, data.propertyName, `${data.projectionYears}-Year Financial Projection`, companyName);
  addFinancialTableSlide(pres, `${data.propertyName} – Income Statement`, data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(pres, `${data.propertyName} – Cash Flow Statement`, data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(pres, `${data.propertyName} – Balance Sheet`, data.balanceSheetData.years, data.balanceSheetData.rows);

  const safeName = data.propertyName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
  pres.writeFile({ fileName: `${safeName} - Financial Report.pptx` });
}

export interface CompanyExportData {
  projectionYears: number;
  getFiscalYear: (i: number) => string;
  incomeData: { years: string[]; rows: SlideTableRow[] };
  cashFlowData: { years: string[]; rows: SlideTableRow[] };
  balanceSheetData: { years: string[]; rows: SlideTableRow[] };
}

/**
 * Generate and download a management company financial report as a PowerPoint deck.
 * Includes title slide plus Income Statement, Cash Flow, and Balance Sheet tables.
 */
export async function exportCompanyPPTX(data: CompanyExportData, companyName = "Hospitality Business Group") {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new (pptxgen as any)();
  pres.layout = "LAYOUT_WIDE";
  pres.author = companyName;
  pres.title = "Management Company Financial Report";

  addTitleSlide(pres, "Management Company", `${data.projectionYears}-Year Financial Projection`, companyName);
  addFinancialTableSlide(pres, "Management Company – Income Statement", data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(pres, "Management Company – Cash Flow Statement", data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(pres, "Management Company – Balance Sheet", data.balanceSheetData.years, data.balanceSheetData.rows);

  pres.writeFile({ fileName: "Management-Company-Report.pptx" });
}
