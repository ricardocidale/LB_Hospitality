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
  type ExportRowMeta,
  type BrandPalette,
  type ThemeColor,
  classifyRow,
  indentLabel,
  formatShort,
  normalizeCaps,
  pptxFontSize,
  pptxColumnWidths,
  buildBrandPalette,
  lighten,
} from "./exportStyles";
import type { OverviewExportData } from "../../components/dashboard/overviewExportData";

const SLIDE_W = 13.33;
const SLIDE_H = 7.5;
const MARGIN_X = 0.3;

interface SlideContext {
  pres: any;
  companyName: string;
  brand: BrandPalette;
}

function addAllFooters(ctx: SlideContext, skipFirst = true) {
  const B = ctx.brand;
  const slides = ctx.pres.slides as any[];
  if (!slides) return;
  const total = slides.length;
  for (let i = 0; i < total; i++) {
    if (skipFirst && i === 0) continue;
    const slide = slides[i];
    slide.addShape("rect", {
      x: 0, y: SLIDE_H - 0.35, w: SLIDE_W, h: 0.01,
      fill: { color: B.SAGE_HEX },
    });
    slide.addText(ctx.companyName + " \u2014 Confidential", {
      x: MARGIN_X, y: SLIDE_H - 0.32, w: 5, h: 0.25,
      fontSize: 7, fontFace: "Arial", color: B.LIGHT_GRAY_HEX, italic: true,
    });
    slide.addText(`${i + 1} / ${total}`, {
      x: SLIDE_W - 1.3, y: SLIDE_H - 0.32, w: 1, h: 0.25,
      fontSize: 7, fontFace: "Arial", color: B.LIGHT_GRAY_HEX, align: "right",
    });
  }
}

function addTitleSlide(ctx: SlideContext, title: string, subtitle: string, sourceTag: string) {
  const B = ctx.brand;
  const slide = ctx.pres.addSlide();
  slide.background = { color: B.NAVY_HEX };

  slide.addShape("rect", {
    x: 0, y: 0, w: SLIDE_W, h: 0.06,
    fill: { color: B.SAGE_HEX },
  });
  slide.addShape("rect", {
    x: 0, y: SLIDE_H - 0.06, w: SLIDE_W, h: 0.06,
    fill: { color: B.SAGE_HEX },
  });

  const gridColor = lighten(B.NAVY_HEX, 0.1);
  for (let gx = 0; gx < SLIDE_W; gx += 0.5) {
    slide.addShape("rect", {
      x: gx, y: 0, w: 0.005, h: SLIDE_H,
      fill: { color: gridColor },
    });
  }
  for (let gy = 0; gy < SLIDE_H; gy += 0.5) {
    slide.addShape("rect", {
      x: 0, y: gy, w: SLIDE_W, h: 0.005,
      fill: { color: gridColor },
    });
  }

  slide.addShape("rect", {
    x: 0.5, y: 1.4, w: 0.08, h: 2.2,
    fill: { color: B.SAGE_HEX },
  });

  slide.addText(ctx.companyName, {
    x: 0.8, y: 1.4, w: 11, h: 0.7,
    fontSize: 32, fontFace: "Arial", color: B.WHITE_HEX, bold: true,
  });

  slide.addShape("rect", {
    x: 0.8, y: 2.15, w: 3, h: 0.02,
    fill: { color: B.WHITE_HEX },
  });

  slide.addText(title, {
    x: 0.8, y: 2.4, w: 11, h: 0.5,
    fontSize: 20, fontFace: "Arial", color: B.SAGE_HEX,
  });

  slide.addText(subtitle, {
    x: 0.8, y: 3.0, w: 8, h: 0.4,
    fontSize: 13, fontFace: "Arial", color: B.LIGHT_GRAY_HEX,
  });

  const cardX = 0.8;
  const cardY = 4.0;
  const cardW = 5.5;
  const cardH = 1.2;
  slide.addShape("roundRect", {
    x: cardX, y: cardY, w: cardW, h: cardH,
    fill: { color: lighten(B.NAVY_HEX, 0.08) },
    line: { color: B.SAGE_HEX, width: 0.75 },
    rectRadius: 0.08,
  });

  slide.addText("REPORT", {
    x: cardX + 0.2, y: cardY + 0.12, w: 2, h: 0.22,
    fontSize: 7, fontFace: "Arial", color: B.SAGE_HEX, bold: true,
  });
  slide.addText(sourceTag, {
    x: cardX + 0.2, y: cardY + 0.32, w: 2.3, h: 0.22,
    fontSize: 9, fontFace: "Arial", color: B.GRAY_HEX,
  });

  slide.addText("DATE", {
    x: cardX + 0.2, y: cardY + 0.6, w: 2, h: 0.22,
    fontSize: 7, fontFace: "Arial", color: B.SAGE_HEX, bold: true,
  });
  slide.addText(format(new Date(), "MMMM d, yyyy"), {
    x: cardX + 0.2, y: cardY + 0.8, w: 2.3, h: 0.22,
    fontSize: 9, fontFace: "Arial", color: B.GRAY_HEX,
  });

  slide.addText("CLASSIFICATION", {
    x: cardX + 2.8, y: cardY + 0.12, w: 2, h: 0.22,
    fontSize: 7, fontFace: "Arial", color: B.SAGE_HEX, bold: true,
  });
  slide.addText("CONFIDENTIAL", {
    x: cardX + 2.8, y: cardY + 0.32, w: 2, h: 0.22,
    fontSize: 9, fontFace: "Arial", color: B.GRAY_HEX,
  });

  slide.addText(
    "This document contains proprietary financial projections. Distribution is restricted to authorized recipients.",
    {
      x: 0.8, y: SLIDE_H - 0.7, w: 10, h: 0.3,
      fontSize: 7, fontFace: "Arial", color: B.LIGHT_GRAY_HEX, italic: true,
    },
  );
}

function addMetricsSlide(
  ctx: SlideContext,
  title: string,
  subtitle: string,
  sourceTag: string,
  metrics: { label: string; value: string }[],
) {
  const B = ctx.brand;
  const slide = ctx.pres.addSlide();

  slide.addText(title, {
    x: 0.5, y: 0.2, w: 8, h: 0.4,
    fontSize: 20, fontFace: "Arial", color: B.DARK_GREEN_HEX, bold: true,
  });

  slide.addText(subtitle, {
    x: 0.5, y: 0.6, w: 6, h: 0.25,
    fontSize: 9, fontFace: "Arial", color: B.GRAY_HEX,
  });

  slide.addText(sourceTag, {
    x: SLIDE_W - 5.5, y: 0.6, w: 5, h: 0.25,
    fontSize: 9, fontFace: "Arial", color: B.DARK_GREEN_HEX, bold: true,
    align: "right",
  });

  slide.addShape("rect", {
    x: 0.5, y: 0.9, w: 12, h: 0.02,
    fill: { color: B.SAGE_HEX },
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
      fill: { color: B.CARD_BG_HEX },
      line: { color: B.SAGE_HEX, width: 1 },
      rectRadius: 0.1,
    });
    slide.addText(m.value, {
      x: x + 0.15, y: y + 0.15, w: cardW - 0.3, h: 0.5,
      fontSize: 18, fontFace: "Arial", color: B.DARK_GREEN_HEX, bold: true,
    });
    slide.addText(m.label, {
      x: x + 0.15, y: y + 0.6, w: cardW - 0.3, h: 0.35,
      fontSize: 9, fontFace: "Arial", color: B.GRAY_HEX,
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
  const B = ctx.brand;
  const slide = ctx.pres.addSlide();
  const fontSize = pptxFontSize(years.length);
  const { labelW, dataW, tableW } = pptxColumnWidths(years.length, SLIDE_W, MARGIN_X);

  slide.addText(title, {
    x: MARGIN_X, y: 0.1, w: 8, h: 0.3,
    fontSize: 14, fontFace: "Arial", color: B.DARK_GREEN_HEX, bold: true,
  });

  slide.addText(sourceTag, {
    x: SLIDE_W - 5.3, y: 0.1, w: 5, h: 0.3,
    fontSize: 9, fontFace: "Arial", color: B.GRAY_HEX, bold: true,
    align: "right",
  });

  const headerCells = [
    {
      text: "",
      options: {
        fill: { color: B.SAGE_HEX },
        fontFace: "Arial", fontSize, color: B.WHITE_HEX, bold: true,
        border: [
          { type: "solid", pt: 1.5, color: B.SAGE_HEX },
          { type: "solid", pt: 1.5, color: B.SAGE_HEX },
          { type: "solid", pt: 1, color: B.SAGE_HEX },
          { type: "solid", pt: 1.5, color: B.SAGE_HEX },
        ],
      },
    },
    ...years.map((y, yi) => ({
      text: y,
      options: {
        fill: { color: B.SAGE_HEX },
        fontFace: "Arial", fontSize, color: B.WHITE_HEX, bold: true,
        align: "right" as const,
        border: [
          { type: "solid", pt: 1.5, color: B.SAGE_HEX },
          yi === years.length - 1
            ? { type: "solid", pt: 1.5, color: B.SAGE_HEX }
            : { type: "solid", pt: 0.5, color: B.BORDER_LIGHT_HEX },
          { type: "solid", pt: 1, color: B.SAGE_HEX },
          { type: "solid", pt: 0.5, color: B.BORDER_LIGHT_HEX },
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
      bgColor = B.SECTION_BG_HEX;
    } else if (isSubtotal) {
      bgColor = B.WHITE_HEX;
    } else {
      bgColor = dataRowIdx % 2 === 1 ? B.ALT_ROW_HEX : B.WHITE_HEX;
      dataRowIdx++;
    }

    const isLastRow = ri === filteredRows.length - 1;

    const topBorder = isSectionHeader
      ? { type: "solid" as const, pt: 1.2, color: B.BORDER_SECTION_HEX }
      : isSubtotal
        ? { type: "solid" as const, pt: 0.8, color: B.BORDER_LIGHT_HEX }
        : { type: "solid" as const, pt: 0.3, color: B.BORDER_LIGHT_HEX };
    const bottomBorder = isLastRow
      ? { type: "solid" as const, pt: 1.5, color: B.SAGE_HEX }
      : { type: "solid" as const, pt: 0.3, color: B.BORDER_LIGHT_HEX };

    const makeBorder = (colIdx: number) => [
      topBorder,
      colIdx === years.length
        ? { type: "solid" as const, pt: 1.5, color: B.SAGE_HEX }
        : { type: "solid" as const, pt: 0.3, color: B.BORDER_LIGHT_HEX },
      bottomBorder,
      colIdx === 0
        ? { type: "solid" as const, pt: 1.5, color: B.SAGE_HEX }
        : { type: "solid" as const, pt: 0.3, color: B.BORDER_LIGHT_HEX },
    ];

    const labelCell: any = {
      text: label,
      options: {
        fontFace: "Arial",
        fontSize: isSectionHeader || isSubtotal ? fontSize + 0.5 : fontSize,
        color: isFormula ? B.GRAY_HEX : B.DARK_TEXT_HEX,
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
        color: B.DARK_TEXT_HEX,
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
  overviewData?: OverviewExportData;
}

function addOverviewSlides(ctx: SlideContext, overview: OverviewExportData, projectionYears: number) {
  const B = ctx.brand;
  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v);
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;
  const fmtUSD = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  const entityTag = `Consolidated Portfolio \u2014 ${overview.capitalStructure.totalProperties} Properties`;

  const propIRRSlide = ctx.pres.addSlide();
  propIRRSlide.addText("Property IRR Comparison", {
    x: MARGIN_X, y: 0.15, w: 9, h: 0.35,
    fontSize: 16, fontFace: "Arial", color: B.DARK_GREEN_HEX, bold: true,
  });
  propIRRSlide.addText(`Per-property internal rate of return over ${projectionYears}-year projection`, {
    x: MARGIN_X, y: 0.5, w: 8, h: 0.25,
    fontSize: 9, fontFace: "Arial", color: B.GRAY_HEX,
  });
  propIRRSlide.addText(entityTag, {
    x: SLIDE_W - 5.5, y: 0.5, w: 5, h: 0.25,
    fontSize: 9, fontFace: "Arial", color: B.DARK_GREEN_HEX, bold: true, align: "right",
  });
  propIRRSlide.addShape("rect", { x: MARGIN_X, y: 0.78, w: SLIDE_W - 2 * MARGIN_X, h: 0.02, fill: { color: B.SAGE_HEX } });

  const pRows: any[][] = [
    [
      { text: "#", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8 } },
      { text: "Property", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8 } },
      { text: "Market", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8 } },
      { text: "Rooms", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
      { text: "Status", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8 } },
      { text: "Acquisition", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
      { text: "ADR", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
      { text: "IRR", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
    ],
    ...overview.propertyItems.map((p, i) => {
      const bg = i % 2 === 1 ? B.ALT_ROW_HEX : B.WHITE_HEX;
      const irrColor = p.irr >= 15 ? B.DARK_GREEN_HEX : p.irr >= 8 ? B.SAGE_HEX : B.DARK_TEXT_HEX;
      return [
        { text: String(i + 1), options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8, align: "center" as const } },
        { text: p.name, options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8, bold: true } },
        { text: p.market, options: { fill: { color: bg }, color: B.GRAY_HEX, fontFace: "Arial", fontSize: 8 } },
        { text: String(p.rooms), options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8, align: "right" as const } },
        { text: p.status, options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8 } },
        { text: fmtUSD(p.acquisitionCost), options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8, align: "right" as const } },
        { text: fmtUSD(p.adr), options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8, align: "right" as const } },
        { text: fmtPct(p.irr), options: { fill: { color: bg }, color: irrColor, fontFace: "Arial", fontSize: 8, bold: true, align: "right" as const } },
      ];
    }),
  ];
  propIRRSlide.addTable(pRows, {
    x: MARGIN_X, y: 0.9, w: SLIDE_W - 2 * MARGIN_X,
    colW: [0.4, 2.8, 1.6, 0.7, 1.2, 1.8, 0.9, 0.8],
    rowH: 0.28,
  });

  const revSlide = ctx.pres.addSlide();
  revSlide.addText("Revenue & ANOI Projection", {
    x: MARGIN_X, y: 0.15, w: 9, h: 0.35,
    fontSize: 16, fontFace: "Arial", color: B.DARK_GREEN_HEX, bold: true,
  });
  revSlide.addText(`${projectionYears}-Year consolidated projection — Revenue, NOI, ANOI, and Cash Flow`, {
    x: MARGIN_X, y: 0.5, w: 10, h: 0.25,
    fontSize: 9, fontFace: "Arial", color: B.GRAY_HEX,
  });
  revSlide.addShape("rect", { x: MARGIN_X, y: 0.78, w: SLIDE_W - 2 * MARGIN_X, h: 0.02, fill: { color: B.SAGE_HEX } });
  const revRows: any[][] = [
    [
      { text: "Year", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8 } },
      { text: "Revenue", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
      { text: "NOI", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
      { text: "ANOI", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
      { text: "Cash Flow", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
    ],
    ...overview.revenueNOIData.map((d, i) => {
      const bg = i % 2 === 1 ? B.ALT_ROW_HEX : B.WHITE_HEX;
      return [
        { text: String(d.year), options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8, bold: true } },
        { text: fmt(d.revenue), options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8, align: "right" as const } },
        { text: fmt(d.noi), options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8, align: "right" as const } },
        { text: fmt(d.anoi), options: { fill: { color: bg }, color: B.DARK_GREEN_HEX, fontFace: "Arial", fontSize: 8, bold: true, align: "right" as const } },
        { text: fmt(d.cashFlow), options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8, align: "right" as const } },
      ];
    }),
  ];
  revSlide.addTable(revRows, {
    x: MARGIN_X, y: 0.9, w: SLIDE_W - 2 * MARGIN_X,
    colW: [1.2, 2.8, 2.8, 2.8, 2.8],
    rowH: 0.28,
  });

  const compSlide = ctx.pres.addSlide();
  compSlide.addText("Portfolio Composition", {
    x: MARGIN_X, y: 0.15, w: 9, h: 0.35,
    fontSize: 16, fontFace: "Arial", color: B.DARK_GREEN_HEX, bold: true,
  });
  compSlide.addText("Geographic and operational distribution of properties", {
    x: MARGIN_X, y: 0.5, w: 8, h: 0.25,
    fontSize: 9, fontFace: "Arial", color: B.GRAY_HEX,
  });
  compSlide.addShape("rect", { x: MARGIN_X, y: 0.78, w: SLIDE_W - 2 * MARGIN_X, h: 0.02, fill: { color: B.SAGE_HEX } });

  const cs = overview.capitalStructure;
  const capRows: any[][] = [
    [
      { text: "Capital Structure", options: { fill: { color: B.NAVY_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8 } },
      { text: "Value", options: { fill: { color: B.NAVY_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
    ],
    [{ text: "Total Purchase Price", options: { fontFace: "Arial", fontSize: 8, fill: { color: B.WHITE_HEX }, color: B.DARK_TEXT_HEX } }, { text: fmtUSD(cs.totalPurchasePrice), options: { fontFace: "Arial", fontSize: 8, fill: { color: B.WHITE_HEX }, color: B.DARK_TEXT_HEX, align: "right" as const } }],
    [{ text: "Avg Purchase Price", options: { fontFace: "Arial", fontSize: 8, fill: { color: B.ALT_ROW_HEX }, color: B.DARK_TEXT_HEX } }, { text: fmtUSD(cs.avgPurchasePrice), options: { fontFace: "Arial", fontSize: 8, fill: { color: B.ALT_ROW_HEX }, color: B.DARK_TEXT_HEX, align: "right" as const } }],
    [{ text: "Avg Exit Cap Rate", options: { fontFace: "Arial", fontSize: 8, fill: { color: B.WHITE_HEX }, color: B.DARK_TEXT_HEX } }, { text: fmtPct(cs.avgExitCapRate * 100), options: { fontFace: "Arial", fontSize: 8, fill: { color: B.WHITE_HEX }, color: B.DARK_GREEN_HEX, bold: true, align: "right" as const } }],
    [{ text: "Hold Period", options: { fontFace: "Arial", fontSize: 8, fill: { color: B.ALT_ROW_HEX }, color: B.DARK_TEXT_HEX } }, { text: `${cs.holdPeriod} Years`, options: { fontFace: "Arial", fontSize: 8, fill: { color: B.ALT_ROW_HEX }, color: B.DARK_TEXT_HEX, align: "right" as const } }],
    [{ text: "ANOI Margin", options: { fontFace: "Arial", fontSize: 8, fill: { color: B.WHITE_HEX }, color: B.DARK_TEXT_HEX } }, { text: fmtPct(cs.anoiMargin), options: { fontFace: "Arial", fontSize: 8, fill: { color: B.WHITE_HEX }, color: B.DARK_GREEN_HEX, bold: true, align: "right" as const } }],
    [{ text: "Avg Rooms / Property", options: { fontFace: "Arial", fontSize: 8, fill: { color: B.ALT_ROW_HEX }, color: B.DARK_TEXT_HEX } }, { text: cs.avgRoomsPerProperty.toFixed(0), options: { fontFace: "Arial", fontSize: 8, fill: { color: B.ALT_ROW_HEX }, color: B.DARK_TEXT_HEX, align: "right" as const } }],
    [{ text: "Avg Daily Rate (ADR)", options: { fontFace: "Arial", fontSize: 8, fill: { color: B.WHITE_HEX }, color: B.DARK_TEXT_HEX } }, { text: fmtUSD(cs.avgADR), options: { fontFace: "Arial", fontSize: 8, fill: { color: B.WHITE_HEX }, color: B.DARK_GREEN_HEX, bold: true, align: "right" as const } }],
  ];
  compSlide.addTable(capRows, { x: MARGIN_X, y: 0.9, w: 5.5, colW: [3.3, 2.2], rowH: 0.28 });

  const mktRows: any[][] = [
    [
      { text: "Market", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8 } },
      { text: "Count", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
      { text: "%", options: { fill: { color: B.SAGE_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
    ],
    ...Object.entries(overview.marketCounts).map(([m, c], i) => {
      const bg = i % 2 === 1 ? B.ALT_ROW_HEX : B.WHITE_HEX;
      return [
        { text: m, options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8 } },
        { text: String(c), options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8, align: "right" as const } },
        { text: fmtPct((c / cs.totalProperties) * 100), options: { fill: { color: bg }, color: B.DARK_GREEN_HEX, fontFace: "Arial", fontSize: 8, bold: true, align: "right" as const } },
      ];
    }),
    [
      { text: "Status", options: { fill: { color: B.NAVY_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8 } },
      { text: "Count", options: { fill: { color: B.NAVY_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
      { text: "%", options: { fill: { color: B.NAVY_HEX }, color: B.WHITE_HEX, bold: true, fontFace: "Arial", fontSize: 8, align: "right" as const } },
    ],
    ...Object.entries(overview.statusCounts).map(([s, c], i) => {
      const bg = i % 2 === 1 ? B.ALT_ROW_HEX : B.WHITE_HEX;
      return [
        { text: s, options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8 } },
        { text: String(c), options: { fill: { color: bg }, color: B.DARK_TEXT_HEX, fontFace: "Arial", fontSize: 8, align: "right" as const } },
        { text: fmtPct((c / cs.totalProperties) * 100), options: { fill: { color: bg }, color: B.DARK_GREEN_HEX, fontFace: "Arial", fontSize: 8, bold: true, align: "right" as const } },
      ];
    }),
  ];
  compSlide.addTable(mktRows, { x: 6.2, y: 0.9, w: 6.83, colW: [4.0, 1.4, 1.43], rowH: 0.28 });

  const wfSlide = ctx.pres.addSlide();
  wfSlide.addText("USALI Profit Waterfall", {
    x: MARGIN_X, y: 0.15, w: 9, h: 0.35,
    fontSize: 16, fontFace: "Arial", color: B.DARK_GREEN_HEX, bold: true,
  });
  wfSlide.addText(`${projectionYears}-Year Consolidated Revenue-to-ANOI Bridge`, {
    x: MARGIN_X, y: 0.5, w: 10, h: 0.25,
    fontSize: 9, fontFace: "Arial", color: B.GRAY_HEX,
  });
  wfSlide.addShape("rect", { x: MARGIN_X, y: 0.78, w: SLIDE_W - 2 * MARGIN_X, h: 0.02, fill: { color: B.SAGE_HEX } });

  const { yearLabels, waterfallRows } = overview;
  const wfFontSize = pptxFontSize(yearLabels.length);
  const { labelW, dataW, tableW } = pptxColumnWidths(yearLabels.length, SLIDE_W, MARGIN_X);
  const wfTableRows: any[][] = [
    [
      { text: "", options: { fill: { color: B.SAGE_HEX }, fontFace: "Arial", fontSize: wfFontSize, color: B.WHITE_HEX, bold: true } },
      ...yearLabels.map((yr) => ({
        text: String(yr),
        options: { fill: { color: B.SAGE_HEX }, fontFace: "Arial", fontSize: wfFontSize, color: B.WHITE_HEX, bold: true, align: "right" as const },
      })),
    ],
    ...waterfallRows.map((row, ri) => {
      const bgColor = row.isSubtotal ? B.SECTION_BG_HEX : ri % 2 === 1 ? B.ALT_ROW_HEX : B.WHITE_HEX;
      const textColor = row.isDeduction ? B.GRAY_HEX : B.DARK_TEXT_HEX;
      return [
        { text: row.label, options: { fill: { color: bgColor }, fontFace: "Arial", fontSize: wfFontSize, color: textColor, bold: row.isSubtotal } },
        ...row.values.map((v) => ({
          text: row.isDeduction ? `(${formatShort(v)})` : formatShort(v),
          options: { fill: { color: bgColor }, fontFace: "Arial", fontSize: wfFontSize, color: row.isSubtotal ? B.DARK_GREEN_HEX : textColor, bold: row.isSubtotal, align: "right" as const },
        })),
      ];
    }),
  ];
  wfSlide.addTable(wfTableRows, {
    x: MARGIN_X, y: 0.9, w: tableW,
    colW: [labelW, ...yearLabels.map(() => dataW)],
    rowH: 0.24,
  });
}

export async function exportPortfolioPPTX(data: PortfolioExportData, companyName = "H+ Analytics", customFilename?: string, themeColors?: ThemeColor[]) {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new (pptxgen as any)();
  pres.layout = "LAYOUT_WIDE";
  pres.author = companyName;
  pres.title = "Consolidated Portfolio Investment Report";

  const ctx: SlideContext = { pres, companyName, brand: buildBrandPalette(themeColors) };
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

  if (data.overviewData) {
    addOverviewSlides(ctx, data.overviewData, data.projectionYears);
  }

  const entityTag = `Consolidated Portfolio \u2014 ${data.totalProperties} Properties`;
  addFinancialTableSlide(ctx, "Consolidated Income Statement (USALI)", entityTag, data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(ctx, "Consolidated Cash Flow Statement", entityTag, data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(ctx, "Consolidated Balance Sheet", entityTag, data.balanceSheetData.years, data.balanceSheetData.rows);
  addFinancialTableSlide(ctx, "Portfolio Investment Analysis", entityTag, data.investmentData.years, data.investmentData.rows);

  addAllFooters(ctx);
  const { saveFile } = await import("./saveFile");
  const pptxBlob = await pres.write({ outputType: "blob" }) as Blob;
  await saveFile(pptxBlob, customFilename || "Portfolio-Investment-Report.pptx");
}

export interface PropertyExportData {
  propertyName: string;
  projectionYears: number;
  getFiscalYear: (i: number) => string;
  incomeData: { years: string[]; rows: ExportRowMeta[] };
  cashFlowData: { years: string[]; rows: ExportRowMeta[] };
  balanceSheetData: { years: string[]; rows: ExportRowMeta[] };
  investmentData?: { years: string[]; rows: ExportRowMeta[] };
  kpiMetrics?: { label: string; value: string }[];
}

export async function exportPropertyPPTX(data: PropertyExportData, companyName = "H+ Analytics", customFilename?: string, themeColors?: ThemeColor[]) {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new (pptxgen as any)();
  pres.layout = "LAYOUT_WIDE";
  pres.author = companyName;
  pres.title = `${data.propertyName} \u2014 Financial Report`;

  const ctx: SlideContext = { pres, companyName, brand: buildBrandPalette(themeColors) };
  const yearRange = `${data.getFiscalYear(0)}\u2013${data.getFiscalYear(data.projectionYears - 1)}`;

  addTitleSlide(
    ctx,
    `${data.propertyName} \u2014 Financial Report`,
    `${data.projectionYears}-Year Financial Projection (${yearRange})`,
    data.propertyName,
  );

  if (data.kpiMetrics && data.kpiMetrics.length > 0) {
    addMetricsSlide(
      ctx,
      `${data.propertyName} \u2014 Key Metrics`,
      `${data.projectionYears}-Year financial highlights`,
      data.propertyName,
      data.kpiMetrics,
    );
  }

  addFinancialTableSlide(ctx, `${data.propertyName} \u2014 Income Statement (USALI)`, data.propertyName, data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(ctx, `${data.propertyName} \u2014 Cash Flow Statement`, data.propertyName, data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(ctx, `${data.propertyName} \u2014 Balance Sheet`, data.propertyName, data.balanceSheetData.years, data.balanceSheetData.rows);
  if (data.investmentData) {
    addFinancialTableSlide(ctx, `${data.propertyName} \u2014 Investment Analysis`, data.propertyName, data.investmentData.years, data.investmentData.rows);
  }

  const safeName = data.propertyName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
  addAllFooters(ctx);
  const { saveFile } = await import("./saveFile");
  const pptxBlob = await pres.write({ outputType: "blob" }) as Blob;
  await saveFile(pptxBlob, customFilename || `${safeName} - Financial Report.pptx`);
}

export interface CompanyExportData {
  projectionYears: number;
  getFiscalYear: (i: number) => string;
  incomeData: { years: string[]; rows: ExportRowMeta[] };
  cashFlowData: { years: string[]; rows: ExportRowMeta[] };
  balanceSheetData: { years: string[]; rows: ExportRowMeta[] };
  companyName?: string;
  kpiMetrics?: { label: string; value: string }[];
}

export async function exportCompanyPPTX(data: CompanyExportData, companyName = "H+ Analytics", customFilename?: string, themeColors?: ThemeColor[]) {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new (pptxgen as any)();
  pres.layout = "LAYOUT_WIDE";
  pres.author = companyName;
  pres.title = `${companyName} \u2014 Management Company Financial Report`;

  const ctx: SlideContext = { pres, companyName, brand: buildBrandPalette(themeColors) };
  const yearRange = `${data.getFiscalYear(0)}\u2013${data.getFiscalYear(data.projectionYears - 1)}`;

  addTitleSlide(
    ctx,
    `${companyName} \u2014 Management Company Financial Report`,
    `${data.projectionYears}-Year Financial Projection (${yearRange})`,
    companyName,
  );

  if (data.kpiMetrics && data.kpiMetrics.length > 0) {
    addMetricsSlide(
      ctx,
      `${companyName} \u2014 Management Company Key Metrics`,
      `${data.projectionYears}-Year financial highlights`,
      `${companyName} \u2014 Management Company`,
      data.kpiMetrics,
    );
  }

  const entityTag = `${companyName} \u2014 Management Company`;
  addFinancialTableSlide(ctx, `${companyName} \u2014 Income Statement`, entityTag, data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(ctx, `${companyName} \u2014 Cash Flow Statement`, entityTag, data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(ctx, `${companyName} \u2014 Balance Sheet`, entityTag, data.balanceSheetData.years, data.balanceSheetData.rows);

  addAllFooters(ctx);
  const { saveFile } = await import("./saveFile");
  const pptxBlob = await pres.write({ outputType: "blob" }) as Blob;
  await saveFile(pptxBlob, customFilename || "Management-Company-Report.pptx");
}
