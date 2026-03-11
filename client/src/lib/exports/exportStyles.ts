/**
 * exportStyles.ts — Shared constants and formatting helpers for all export formats
 *
 * This module centralises the brand palette, typography rules, and number-formatting
 * logic used across PDF (jsPDF), PPTX (pptxgenjs), Excel (xlsx), and CSV exports.
 * Every financial report — portfolio, property, company, research — should reference
 * these constants so a single change propagates everywhere.
 *
 * ─── Brand Palette (hex for PPTX, RGB tuples for jsPDF) ───────────────────
 *   SAGE_GREEN   #9FBCA4  |  rgb(159, 188, 164)   — accent bars, table headers
 *   DARK_GREEN   #257D41  |  rgb( 37, 125,  65)   — titles, positive KPIs
 *   NAVY         #1A2332  |  rgb( 26,  35,  50)   — branded header / title bg
 *   DARK_TEXT    #3D3D3D  |  rgb( 61,  61,  61)   — table body text
 *   GRAY         #666666  |  rgb(102, 102, 102)   — labels, subtitles
 *   LIGHT_GRAY   #999999  |  rgb(153, 153, 153)   — footer text
 *   WHITE        #FFFFFF  |  rgb(255, 255, 255)   — backgrounds, inverted text
 *   SECTION_BG   #EFF5F0  |  rgb(239, 245, 240)   — section header row fill
 *   WARM_BG      #FFF9F5  |  rgb(255, 249, 245)   — warm neutral background
 *
 * ─── Typography Rules ─────────────────────────────────────────────────────
 *   • Section headers (ALL CAPS)  →  bold, section-bg fill
 *   • Subtotals (GOP, AGOP, …)   →  bold, no fill
 *   • Line items                  →  normal, indent 1–2 levels (2 spaces each)
 *   • Formulas / notes            →  italic, indent 2, muted color
 *
 * ─── Number Formatting ────────────────────────────────────────────────────
 *   Slide / summary format:   $1.2M, $450K, $800, (negative in parens)
 *   Full / detailed format:    $1,234,567 or ($1,234,567) for negatives
 *   Percentage format:         12.5%
 *   Zero / empty:              — (em dash)
 */

export const BRAND = {
  SAGE_HEX: "9FBCA4",
  DARK_GREEN_HEX: "257D41",
  NAVY_HEX: "1A2332",
  DARK_TEXT_HEX: "3D3D3D",
  GRAY_HEX: "666666",
  LIGHT_GRAY_HEX: "999999",
  WHITE_HEX: "FFFFFF",
  SECTION_BG_HEX: "EFF5F0",
  WARM_BG_HEX: "FFF9F5",
  CARD_BG_HEX: "F5F9F6",

  SAGE_RGB: [159, 188, 164] as [number, number, number],
  DARK_GREEN_RGB: [37, 125, 65] as [number, number, number],
  NAVY_RGB: [26, 35, 50] as [number, number, number],
  DARK_TEXT_RGB: [61, 61, 61] as [number, number, number],
  GRAY_RGB: [102, 102, 102] as [number, number, number],
  LIGHT_GRAY_RGB: [153, 153, 153] as [number, number, number],
  WHITE_RGB: [255, 255, 255] as [number, number, number],
  SECTION_BG_RGB: [239, 245, 240] as [number, number, number],
} as const;

export interface ExportRowMeta {
  category: string;
  values: (string | number)[];
  indent?: number;
  isBold?: boolean;
  isHeader?: boolean;
  isItalic?: boolean;
}

/**
 * Detect whether a row represents a section header (ALL CAPS),
 * a subtotal/total line, or a formula/note row.
 */
export function classifyRow(row: ExportRowMeta): {
  isSectionHeader: boolean;
  isSubtotal: boolean;
  isFormula: boolean;
} {
  const cat = row.category.trim();
  const isSectionHeader = cat === cat.toUpperCase() && cat.length > 2 && !cat.startsWith(" ");
  const lower = cat.toLowerCase();
  const isSubtotal = row.isBold === true ||
    row.isHeader === true ||
    lower.startsWith("total") ||
    lower.includes("net operating") ||
    lower.includes("gross operating") ||
    lower.includes("adjusted") ||
    lower.includes("gaap net") ||
    lower.includes("free cash flow") ||
    lower.includes("closing cash") ||
    lower.includes("net change");
  const isFormula = lower.startsWith("formula:") || row.isItalic === true;
  return { isSectionHeader, isSubtotal, isFormula };
}

/**
 * Format a number using the short/abbreviated style for slides and summaries.
 *   >= 1M  → $1.2M
 *   >= 1K  → $450K
 *   < 1K   → $800
 *   zero   → —
 *   negative → ($1.2M)
 */
export function formatShort(v: string | number): string {
  if (typeof v === "string") return v;
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
    return "\u2014";
  }
  return neg ? `(${formatted})` : formatted;
}

/**
 * Format a number using the full/detailed style for PDF tables.
 *   Positive → $1,234,567
 *   Negative → ($1,234,567)
 *   Zero     → —
 */
export function formatFull(v: string | number): string {
  if (typeof v === "string") return v;
  if (v === 0) return "\u2014";
  const abs = Math.abs(v);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return v < 0 ? `($${s})` : `$${s}`;
}

/**
 * Format a percentage value.
 */
export function formatPct(v: number, decimals = 1): string {
  return `${v.toFixed(decimals)}%`;
}

/**
 * Build the indented label string from a row's category and indent level.
 */
export function indentLabel(category: string, indent?: number): string {
  return indent ? "  ".repeat(indent) + category : category;
}

/**
 * Compute dynamic font size for PPTX tables based on the number of year columns.
 * Ensures all columns fit on a single 16:9 widescreen slide.
 */
export function pptxFontSize(yearCount: number): number {
  if (yearCount <= 5) return 8;
  if (yearCount <= 7) return 7;
  if (yearCount <= 10) return 6;
  return 5;
}

/**
 * Compute dynamic column widths for PPTX tables.
 * Returns [labelWidth, ...dataWidths] that sum to the full slide table width.
 */
export function pptxColumnWidths(yearCount: number, slideW = 13.33, marginX = 0.3): {
  labelW: number;
  dataW: number;
  tableW: number;
} {
  const tableW = slideW - marginX * 2;
  const labelW = Math.max(2.2, Math.min(3.5, tableW - yearCount * 0.9));
  const dataW = (tableW - labelW) / yearCount;
  return { labelW, dataW, tableW };
}

/**
 * Standard footer text for all exported documents.
 */
export function footerText(companyName: string): string {
  return `${companyName} \u2014 Confidential`;
}
