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
 *   • Title slides include descriptive title, projection range subtitle,
 *     and right-aligned source tag identifying the report scope
 *   • Financial table slides show the statement name as title and
 *     a right-aligned source tag (e.g., "Income Statement — Consolidated")
 *   • Section headers — bold, section-bg fill, Title Case (not ALL CAPS)
 *   • Numbers — short format ($1.2M, $450K) for readability
 *   • Footer — company name (left) + page number (right) on every slide
 *   • Table framed with sage-green outer border
 */
import { format } from "date-fns";
import {
  BRAND,
  type ExportRowMeta,
  classifyRow,
  indentLabel,
  formatShort,
  normalizeCaps,
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

function addTitleSlide(ctx: SlideContext, title: string, subtitle: string, sourceTag: string) {
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
    x: 0.6, y: 2.9, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Arial", color: "AAAAAA",
  });

  slide.addText(sourceTag, {
    x: SLIDE_W - 5.6, y: 2.9, w: 5, h: 0.4,
    fontSize: 11, fontFace: "Arial", color: BRAND.SAGE_HEX, bold: true,
    align: "right",
  });

  slide.addText(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, {
    x: 0.6, y: 4.6, w: 12, h: 0.3,
    fontSize: 10, fontFace: "Arial", color: "888888",
  });
}

function addMetricsSlide(
  ctx: SlideContext,
  title: string,
  subtitle: string,
  sourceTag: string,
  metrics: { label: string; value: string }[],
) {
  const slide = ctx.pres.addSlide();

  slide.addText(title, {
    x: 0.5, y: 0.2, w: 8, h: 0.4,
    fontSize: 20, fontFace: "Arial", color: BRAND.DARK_GREEN_HEX, bold: true,
  });

  slide.addText(subtitle, {
    x: 0.5, y: 0.6, w: 6, h: 0.25,
    fontSize: 9, fontFace: "Arial", color: BRAND.GRAY_HEX,
  });

  slide.addText(sourceTag, {
    x: SLIDE_W - 5.5, y: 0.6, w: 5, h: 0.25,
    fontSize: 9, fontFace: "Arial", color: BRAND.DARK_GREEN_HEX, bold: true,
    align: "right",
  });

  slide.addShape("rect", {
    x: 0.5, y: 0.9, w: 12, h: 0.02,
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
  sourceTag: string,
  years: string[],
  rows: ExportRowMeta[],
) {
  const slide = ctx.pres.addSlide();
  const fontSize = pptxFontSize(years.length);
  const { labelW, dataW, tableW } = pptxColumnWidths(years.length, SLIDE_W, MARGIN_X);

  slide.addText(title, {
    x: MARGIN_X, y: 0.1, w: 8, h: 0.3,
    fontSize: 14, fontFace: "Arial", color: BRAND.DARK_GREEN_HEX, bold: true,
  });

  slide.addText(sourceTag, {
    x: SLIDE_W - 5.3, y: 0.1, w: 5, h: 0.3,
    fontSize: 9, fontFace: "Arial", color: BRAND.GRAY_HEX, bold: true,
    align: "right",
  });

  const headerCells = [
    {
      text: "",
      options: {
        fill: { color: BRAND.SAGE_HEX },
        fontFace: "Arial", fontSize, color: BRAND.WHITE_HEX, bold: true,
        border: [
          { type: "solid", pt: 1.5, color: BRAND.SAGE_HEX },
          { type: "solid", pt: 1.5, color: BRAND.SAGE_HEX },
          { type: "solid", pt: 1, color: BRAND.SAGE_HEX },
          { type: "solid", pt: 1.5, color: BRAND.SAGE_HEX },
        ],
      },
    },
    ...years.map((y, yi) => ({
      text: y,
      options: {
        fill: { color: BRAND.SAGE_HEX },
        fontFace: "Arial", fontSize, color: BRAND.WHITE_HEX, bold: true,
        align: "right" as const,
        border: [
          { type: "solid", pt: 1.5, color: BRAND.SAGE_HEX },
          yi === years.length - 1
            ? { type: "solid", pt: 1.5, color: BRAND.SAGE_HEX }
            : { type: "solid", pt: 0.5, color: BRAND.BORDER_LIGHT_HEX },
          { type: "solid", pt: 1, color: BRAND.SAGE_HEX },
          { type: "solid", pt: 0.5, color: BRAND.BORDER_LIGHT_HEX },
        ],
      },
    })),
  ];

  const tableRows: any[][] = [headerCells];
  const filteredRows = rows.filter((r) => r.category !== "");
  let dataRowIdx = 0;

  filteredRows.forEach((row, ri) => {
    const { isSectionHeader, isSubtotal, isFormula } = classifyRow(row);
    const label = indentLabel(normalizeCaps(row.category), row.indent);

    let bgColor: string;
    if (isSectionHeader) {
      bgColor = BRAND.SECTION_BG_HEX;
    } else if (isSubtotal) {
      bgColor = BRAND.WHITE_HEX;
    } else {
      bgColor = dataRowIdx % 2 === 1 ? BRAND.ALT_ROW_HEX : BRAND.WHITE_HEX;
      dataRowIdx++;
    }

    const isLastRow = ri === filteredRows.length - 1;

    const topBorder = isSectionHeader
      ? { type: "solid" as const, pt: 1.2, color: BRAND.BORDER_SECTION_HEX }
      : isSubtotal
        ? { type: "solid" as const, pt: 0.8, color: BRAND.BORDER_LIGHT_HEX }
        : { type: "solid" as const, pt: 0.3, color: "E8E8E8" };
    const bottomBorder = isLastRow
      ? { type: "solid" as const, pt: 1.5, color: BRAND.SAGE_HEX }
      : { type: "solid" as const, pt: 0.3, color: "E8E8E8" };

    const makeBorder = (colIdx: number) => [
      topBorder,
      colIdx === years.length
        ? { type: "solid" as const, pt: 1.5, color: BRAND.SAGE_HEX }
        : { type: "solid" as const, pt: 0.3, color: "E8E8E8" },
      bottomBorder,
      colIdx === 0
        ? { type: "solid" as const, pt: 1.5, color: BRAND.SAGE_HEX }
        : { type: "solid" as const, pt: 0.3, color: "E8E8E8" },
    ];

    const labelCell: any = {
      text: label,
      options: {
        fontFace: "Arial",
        fontSize: isSectionHeader || isSubtotal ? fontSize + 0.5 : fontSize,
        color: isFormula ? BRAND.GRAY_HEX : BRAND.DARK_TEXT_HEX,
        bold: isSectionHeader || isSubtotal,
        italic: isFormula,
        fill: { color: bgColor },
        border: makeBorder(0),
      },
    };

    const valueCells = row.values.map((v, vi) => ({
      text: formatShort(v),
      options: {
        fontFace: "Arial",
        fontSize,
        color: BRAND.DARK_TEXT_HEX,
        bold: isSubtotal,
        italic: isFormula,
        align: "right" as const,
        fill: { color: bgColor },
        border: makeBorder(vi + 1),
      },
    }));

    tableRows.push([labelCell, ...valueCells]);
  });

  slide.addTable(tableRows, {
    x: MARGIN_X,
    y: 0.45,
    w: tableW,
    colW: [labelW, ...years.map(() => dataW)],
    rowH: 0.22,
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
  portfolioMIRR?: number;
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
  pres.title = "Consolidated Portfolio Investment Report";

  const ctx: SlideContext = { pres, companyName };
  const yearRange = `${data.getFiscalYear(0)}\u2013${data.getFiscalYear(data.projectionYears - 1)}`;

  addTitleSlide(
    ctx,
    "Consolidated Portfolio Investment Report",
    `${data.projectionYears}-Year Financial Projection (${yearRange})`,
    `Portfolio \u2014 ${data.totalProperties} Properties, ${data.totalRooms} Rooms`,
  );

  addMetricsSlide(
    ctx,
    "Portfolio Investment Summary",
    `Key performance indicators across ${data.totalProperties} properties over ${data.projectionYears} years`,
    `Consolidated Portfolio \u2014 ${data.totalProperties} Properties`,
    [
      { label: "Total Equity Invested", value: `$${(data.totalInitialEquity / 1_000_000).toFixed(1)}M` },
      { label: `Projected Exit Value (Year ${data.projectionYears})`, value: `$${(data.totalExitValue / 1_000_000).toFixed(1)}M` },
      { label: "Equity Multiple", value: `${data.equityMultiple.toFixed(2)}x` },
      { label: "Portfolio IRR", value: `${(data.portfolioIRR * 100).toFixed(1)}%` },
      { label: "Portfolio MIRR", value: data.portfolioMIRR != null ? `${(data.portfolioMIRR * 100).toFixed(1)}%` : "N/A" },
      { label: "Avg Cash-on-Cash Return", value: `${data.cashOnCash.toFixed(1)}%` },
      { label: "Properties / Total Rooms", value: `${data.totalProperties} / ${data.totalRooms}` },
      { label: `Cumulative ${data.projectionYears}-Year Revenue`, value: `$${(data.totalProjectionRevenue / 1_000_000).toFixed(1)}M` },
      { label: `Cumulative ${data.projectionYears}-Year NOI`, value: `$${(data.totalProjectionNOI / 1_000_000).toFixed(1)}M` },
      { label: `Cumulative ${data.projectionYears}-Year Cash Flow`, value: `$${(data.totalProjectionCashFlow / 1_000_000).toFixed(1)}M` },
    ],
  );

  const entityTag = `Consolidated Portfolio \u2014 ${data.totalProperties} Properties`;
  addFinancialTableSlide(ctx, "Consolidated Income Statement (USALI)", entityTag, data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(ctx, "Consolidated Cash Flow Statement", entityTag, data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(ctx, "Consolidated Balance Sheet", entityTag, data.balanceSheetData.years, data.balanceSheetData.rows);
  addFinancialTableSlide(ctx, "Portfolio Investment Analysis", entityTag, data.investmentData.years, data.investmentData.rows);

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
  pres.title = `${data.propertyName} \u2014 Financial Report`;

  const ctx: SlideContext = { pres, companyName };
  const yearRange = `${data.getFiscalYear(0)}\u2013${data.getFiscalYear(data.projectionYears - 1)}`;

  addTitleSlide(
    ctx,
    `${data.propertyName} \u2014 Financial Report`,
    `${data.projectionYears}-Year Financial Projection (${yearRange})`,
    data.propertyName,
  );

  addFinancialTableSlide(ctx, `Income Statement (USALI)`, data.propertyName, data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(ctx, `Cash Flow Statement`, data.propertyName, data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(ctx, `Balance Sheet`, data.propertyName, data.balanceSheetData.years, data.balanceSheetData.rows);

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
  pres.title = `${companyName} \u2014 Management Company Financial Report`;

  const ctx: SlideContext = { pres, companyName };
  const yearRange = `${data.getFiscalYear(0)}\u2013${data.getFiscalYear(data.projectionYears - 1)}`;

  addTitleSlide(
    ctx,
    `${companyName} \u2014 Management Company Financial Report`,
    `${data.projectionYears}-Year Financial Projection (${yearRange})`,
    companyName,
  );

  const entityTag = `${companyName} \u2014 Management Company`;
  addFinancialTableSlide(ctx, `Income Statement`, entityTag, data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(ctx, `Cash Flow Statement`, entityTag, data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(ctx, `Balance Sheet`, entityTag, data.balanceSheetData.years, data.balanceSheetData.rows);

  addAllFooters(ctx);
  pres.writeFile({ fileName: "Management-Company-Report.pptx" });
}
