/**
 * pptxExport.ts — PowerPoint (.pptx) presentation generation
 *
 * Generates branded investor-ready slide decks using the pptxgenjs library.
 * All presentations use 16:9 landscape (LAYOUT_WIDE = 13.33" × 7.5").
 *
 * Three export targets:
 *   1. Portfolio — consolidated multi-property investment summary
 *   2. Property — single-property financial report
 *   3. Company — management company financial report
 *
 * Design rules (shared with PDF via exportStyles.ts):
 *   • Section headers — bold, section-bg fill (#EFF5F0)
 *   • Subtotals — bold, white background
 *   • Line items — normal weight, indented 1–2 levels
 *   • Formula/notes — italic, muted gray color
 *   • Numbers — short format ($1.2M, $450K) for readability at presentation scale
 *   • Footer — company name (left) + page number (right) on every slide
 *   • All year-columns fit on a single slide; font size scales dynamically
 */
import { format } from "date-fns";
import {
  BRAND,
  type ExportRowMeta,
  classifyRow,
  indentLabel,
  formatShort,
  pptxFontSize,
  pptxColumnWidths,
} from "./exportStyles";

const SLIDE_W = 13.33;
const SLIDE_H = 7.5;
const MARGIN_X = 0.3;

interface SlideContext {
  pres: any;
  companyName: string;
}

/**
 * Post-process ALL slides in the presentation to add footer + page number.
 * MUST be called LAST, after all content (including auto-paginated tables)
 * has been generated. This ensures auto-paginated overflow slides also
 * receive the correct footer and sequential page number.
 */
function addAllFooters(ctx: SlideContext) {
  const slides = ctx.pres.slides as any[];
  if (!slides) return;
  const total = slides.length;
  for (let i = 0; i < total; i++) {
    const slide = slides[i];
    slide.addShape("rect", {
      x: 0, y: SLIDE_H - 0.35, w: SLIDE_W, h: 0.01,
      fill: { color: BRAND.SAGE_HEX },
    });
    slide.addText(ctx.companyName + " \u2014 Confidential", {
      x: MARGIN_X, y: SLIDE_H - 0.32, w: 5, h: 0.25,
      fontSize: 7, fontFace: "Arial", color: BRAND.LIGHT_GRAY_HEX, italic: true,
    });
    slide.addText(`${i + 1} / ${total}`, {
      x: SLIDE_W - 1.3, y: SLIDE_H - 0.32, w: 1, h: 0.25,
      fontSize: 7, fontFace: "Arial", color: BRAND.LIGHT_GRAY_HEX, align: "right",
    });
  }
}

function addTitleSlide(ctx: SlideContext, title: string, subtitle: string) {
  const slide = ctx.pres.addSlide();
  slide.background = { color: BRAND.NAVY_HEX };

  slide.addShape("rect", {
    x: 0, y: 0, w: SLIDE_W, h: 0.05,
    fill: { color: BRAND.SAGE_HEX },
  });

  slide.addText(ctx.companyName, {
    x: 0.6, y: 1.5, w: 12, h: 0.6,
    fontSize: 28, fontFace: "Arial", color: BRAND.SAGE_HEX, bold: true,
  });

  slide.addText(title, {
    x: 0.6, y: 2.3, w: 12, h: 0.5,
    fontSize: 22, fontFace: "Arial", color: BRAND.WHITE_HEX,
  });

  slide.addText(subtitle, {
    x: 0.6, y: 2.9, w: 12, h: 0.4,
    fontSize: 14, fontFace: "Arial", color: "AAAAAA",
  });

  slide.addText(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, {
    x: 0.6, y: 4.6, w: 12, h: 0.3,
    fontSize: 10, fontFace: "Arial", color: "888888",
  });
}

function addMetricsSlide(
  ctx: SlideContext,
  title: string,
  metrics: { label: string; value: string }[],
) {
  const slide = ctx.pres.addSlide();

  slide.addText(title, {
    x: 0.5, y: 0.3, w: 12, h: 0.5,
    fontSize: 20, fontFace: "Arial", color: BRAND.DARK_GREEN_HEX, bold: true,
  });

  slide.addShape("rect", {
    x: 0.5, y: 0.85, w: 12, h: 0.02,
    fill: { color: BRAND.SAGE_HEX },
  });

  const cols = 3;
  const cardW = 3.8;
  const cardH = 1.1;
  const gapX = 0.35;
  const startX = 0.5;
  const startY = 1.15;

  metrics.forEach((m, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + 0.15);

    slide.addShape("rect", {
      x, y, w: cardW, h: cardH,
      fill: { color: BRAND.CARD_BG_HEX },
      line: { color: BRAND.SAGE_HEX, width: 1 },
      rectRadius: 0.1,
    });
    slide.addText(m.value, {
      x: x + 0.15, y: y + 0.15, w: cardW - 0.3, h: 0.5,
      fontSize: 18, fontFace: "Arial", color: BRAND.DARK_GREEN_HEX, bold: true,
    });
    slide.addText(m.label, {
      x: x + 0.15, y: y + 0.6, w: cardW - 0.3, h: 0.35,
      fontSize: 9, fontFace: "Arial", color: BRAND.GRAY_HEX,
    });
  });
}

function addFinancialTableSlide(
  ctx: SlideContext,
  title: string,
  years: string[],
  rows: ExportRowMeta[],
) {
  const slide = ctx.pres.addSlide();
  const fontSize = pptxFontSize(years.length);
  const { labelW, dataW, tableW } = pptxColumnWidths(years.length, SLIDE_W, MARGIN_X);

  slide.addText(title, {
    x: MARGIN_X, y: 0.15, w: tableW, h: 0.35,
    fontSize: 14, fontFace: "Arial", color: BRAND.DARK_GREEN_HEX, bold: true,
  });

  const headerCells = [
    {
      text: "",
      options: {
        fill: { color: BRAND.SAGE_HEX },
        fontFace: "Arial", fontSize, color: BRAND.DARK_TEXT_HEX, bold: true,
      },
    },
    ...years.map((y) => ({
      text: y,
      options: {
        fill: { color: BRAND.SAGE_HEX },
        fontFace: "Arial", fontSize, color: BRAND.DARK_TEXT_HEX, bold: true,
        align: "right" as const,
      },
    })),
  ];

  const tableRows: any[][] = [headerCells];
  const filteredRows = rows.filter((r) => r.category !== "");

  filteredRows.forEach((row) => {
    const { isSectionHeader, isSubtotal, isFormula } = classifyRow(row);
    const label = indentLabel(row.category, row.indent);
    const bgColor = isSectionHeader ? BRAND.SECTION_BG_HEX : BRAND.WHITE_HEX;

    const labelCell: any = {
      text: label,
      options: {
        fontFace: "Arial",
        fontSize,
        color: isFormula ? BRAND.GRAY_HEX : BRAND.DARK_TEXT_HEX,
        bold: isSectionHeader || isSubtotal,
        italic: isFormula,
        fill: { color: bgColor },
      },
    };

    const valueCells = row.values.map((v) => ({
      text: formatShort(v),
      options: {
        fontFace: "Arial",
        fontSize,
        color: BRAND.DARK_TEXT_HEX,
        bold: isSubtotal,
        italic: isFormula,
        align: "right" as const,
        fill: { color: bgColor },
      },
    }));

    tableRows.push([labelCell, ...valueCells]);
  });

  slide.addTable(tableRows, {
    x: MARGIN_X,
    y: 0.55,
    w: tableW,
    colW: [labelW, ...years.map(() => dataW)],
    border: { type: "solid", pt: 0.5, color: "DDDDDD" },
    rowH: 0.2,
    autoPage: true,
    autoPageRepeatHeader: true,
    newSlideStartY: 0.4,
  });
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
  incomeData: { years: string[]; rows: ExportRowMeta[] };
  cashFlowData: { years: string[]; rows: ExportRowMeta[] };
  balanceSheetData: { years: string[]; rows: ExportRowMeta[] };
  investmentData: { years: string[]; rows: ExportRowMeta[] };
}

export async function exportPortfolioPPTX(data: PortfolioExportData, companyName = "Hospitality Business Group") {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new (pptxgen as any)();
  pres.layout = "LAYOUT_WIDE";
  pres.author = companyName;
  pres.title = "Portfolio Investment Report";

  const ctx: SlideContext = { pres, companyName };

  addTitleSlide(ctx, "Portfolio Investment Report",
    `${data.projectionYears}-Year Projection (${data.getFiscalYear(0)} \u2013 ${data.getFiscalYear(data.projectionYears - 1)})`);

  addMetricsSlide(ctx, "Investment Summary", [
    { label: "Total Equity Invested", value: `$${(data.totalInitialEquity / 1_000_000).toFixed(1)}M` },
    { label: `Exit Value (Year ${data.projectionYears})`, value: `$${(data.totalExitValue / 1_000_000).toFixed(1)}M` },
    { label: "Equity Multiple", value: `${data.equityMultiple.toFixed(2)}x` },
    { label: "Portfolio IRR", value: `${(data.portfolioIRR * 100).toFixed(1)}%` },
    { label: "Avg Cash-on-Cash", value: `${data.cashOnCash.toFixed(1)}%` },
    { label: "Properties / Rooms", value: `${data.totalProperties} / ${data.totalRooms}` },
    { label: `${data.projectionYears}-Year Revenue`, value: `$${(data.totalProjectionRevenue / 1_000_000).toFixed(1)}M` },
    { label: `${data.projectionYears}-Year NOI`, value: `$${(data.totalProjectionNOI / 1_000_000).toFixed(1)}M` },
    { label: `${data.projectionYears}-Year Cash Flow`, value: `$${(data.totalProjectionCashFlow / 1_000_000).toFixed(1)}M` },
  ]);

  addFinancialTableSlide(ctx, "Consolidated Income Statement", data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(ctx, "Consolidated Cash Flow Statement", data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(ctx, "Consolidated Balance Sheet", data.balanceSheetData.years, data.balanceSheetData.rows);
  addFinancialTableSlide(ctx, "Investment Analysis", data.investmentData.years, data.investmentData.rows);

  addAllFooters(ctx);
  pres.writeFile({ fileName: "Portfolio-Investment-Report.pptx" });
}

export interface PropertyExportData {
  propertyName: string;
  projectionYears: number;
  getFiscalYear: (i: number) => string;
  incomeData: { years: string[]; rows: ExportRowMeta[] };
  cashFlowData: { years: string[]; rows: ExportRowMeta[] };
  balanceSheetData: { years: string[]; rows: ExportRowMeta[] };
}

export async function exportPropertyPPTX(data: PropertyExportData, companyName = "Hospitality Business Group") {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new (pptxgen as any)();
  pres.layout = "LAYOUT_WIDE";
  pres.author = companyName;
  pres.title = `${data.propertyName} Financial Report`;

  const ctx: SlideContext = { pres, companyName };

  addTitleSlide(ctx, data.propertyName, `${data.projectionYears}-Year Financial Projection`);
  addFinancialTableSlide(ctx, `${data.propertyName} \u2013 Income Statement`, data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(ctx, `${data.propertyName} \u2013 Cash Flow Statement`, data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(ctx, `${data.propertyName} \u2013 Balance Sheet`, data.balanceSheetData.years, data.balanceSheetData.rows);

  const safeName = data.propertyName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
  addAllFooters(ctx);
  pres.writeFile({ fileName: `${safeName} - Financial Report.pptx` });
}

export interface CompanyExportData {
  projectionYears: number;
  getFiscalYear: (i: number) => string;
  incomeData: { years: string[]; rows: ExportRowMeta[] };
  cashFlowData: { years: string[]; rows: ExportRowMeta[] };
  balanceSheetData: { years: string[]; rows: ExportRowMeta[] };
}

export async function exportCompanyPPTX(data: CompanyExportData, companyName = "Hospitality Business Group") {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new (pptxgen as any)();
  pres.layout = "LAYOUT_WIDE";
  pres.author = companyName;
  pres.title = "Management Company Financial Report";

  const ctx: SlideContext = { pres, companyName };

  addTitleSlide(ctx, "Management Company", `${data.projectionYears}-Year Financial Projection`);
  addFinancialTableSlide(ctx, "Management Company \u2013 Income Statement", data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(ctx, "Management Company \u2013 Cash Flow Statement", data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(ctx, "Management Company \u2013 Balance Sheet", data.balanceSheetData.years, data.balanceSheetData.rows);

  addAllFooters(ctx);
  pres.writeFile({ fileName: "Management-Company-Report.pptx" });
}
