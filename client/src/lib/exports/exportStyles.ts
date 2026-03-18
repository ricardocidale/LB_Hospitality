/**
 * exportStyles.ts — Shared constants and formatting helpers for all export formats
 *
 * Centralises the brand palette, typography rules, number-formatting logic,
 * and row-classification used across PDF (jsPDF), PPTX (pptxgenjs), Excel,
 * and CSV exports. A single change here propagates everywhere.
 *
 * ─── Brand Palette (hex for PPTX, RGB tuples for jsPDF) ───────────────────
 *   SAGE_GREEN   #9FBCA4  — accent bars, table headers
 *   DARK_GREEN   #257D41  — titles, positive KPIs
 *   NAVY         #1A2332  — branded header / title bg
 *   DARK_TEXT     #3D3D3D  — table body text
 *   GRAY         #666666  — labels, subtitles
 *   LIGHT_GRAY   #999999  — footer text
 *   WHITE        #FFFFFF  — backgrounds, inverted text
 *   SECTION_BG   #EFF5F0  — section header row fill
 *   ALT_ROW      #F8FAF9  — alternating row tint for readability
 *   WARM_BG      #FFF9F5  — warm neutral background
 *
 * ─── Typography Rules ─────────────────────────────────────────────────────
 *   • Section headers  →  bold, section-bg fill, Title Case (not ALL CAPS)
 *   • Subtotals        →  bold, white background
 *   • Line items       →  normal, indent 1–2 levels (2 spaces each)
 *   • Formulas / notes →  italic, indent 2, muted color
 *   • Known abbreviations are preserved: GOP, NOI, ANOI, GAAP, etc.
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
  ALT_ROW_HEX: "F8FAF9",
  WARM_BG_HEX: "FFF9F5",
  CARD_BG_HEX: "F5F9F6",
  BORDER_LIGHT_HEX: "D5D8DA",
  BORDER_SECTION_HEX: "9FBCA4",

  SAGE_RGB: [159, 188, 164] as [number, number, number],
  DARK_GREEN_RGB: [37, 125, 65] as [number, number, number],
  NAVY_RGB: [26, 35, 50] as [number, number, number],
  DARK_TEXT_RGB: [61, 61, 61] as [number, number, number],
  GRAY_RGB: [102, 102, 102] as [number, number, number],
  LIGHT_GRAY_RGB: [153, 153, 153] as [number, number, number],
  WHITE_RGB: [255, 255, 255] as [number, number, number],
  SECTION_BG_RGB: [239, 245, 240] as [number, number, number],
  ALT_ROW_RGB: [248, 250, 249] as [number, number, number],
} as const;

export const PAGE_DIMS = {
  LANDSCAPE_W: 406.4,
  LANDSCAPE_H: 228.6,
  PORTRAIT_W: 215.9,
  PORTRAIT_H: 279.4,
} as const;

export type ExportFormat = "currency" | "percentage" | "number" | "ratio" | "multiplier";

export interface ExportRowMeta {
  category: string;
  values: (string | number)[];
  indent?: number;
  isBold?: boolean;
  isHeader?: boolean;
  isItalic?: boolean;
  format?: ExportFormat;
}

export function formatByType(v: string | number, format: ExportFormat = "currency"): string {
  if (typeof v === "string") return v;
  switch (format) {
    case "percentage":
      if (v === 0) return "0.0%";
      return `${(v * 100).toFixed(1)}%`;
    case "number":
      if (v === 0) return "\u2014";
      const neg = v < 0;
      const s = Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
      return neg ? `(${s})` : s;
    case "ratio":
      if (v === 0) return "0.00x";
      return `${v.toFixed(2)}x`;
    case "multiplier":
      if (v === 0) return "0.00x";
      return `${v.toFixed(2)}x`;
    case "currency":
    default:
      return formatFull(v);
  }
}

const KNOWN_ABBREVS = new Set([
  "GOP", "NOI", "ANOI", "GAAP", "FFE", "FF&E",
  "DSCR", "IRR", "CFO", "CFI", "CFF", "IT", "F&B",
  "PP&E", "ADR", "REVPAR", "LTV", "EBITDA", "WACC",
  "FCFE", "FCFF", "FY", "YOY",
]);

/**
 * Convert an ALL-CAPS category label to Title Case for export readability,
 * while preserving known financial abbreviations (GOP, NOI, GAAP, etc.).
 * Non-uppercase labels are returned unchanged.
 */
export function normalizeCaps(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 2) return trimmed;
  if (trimmed !== trimmed.toUpperCase()) return text;

  return text.replace(/\S+/g, (word) => {
    const upper = word.replace(/[^A-Z&]/g, "");
    if (KNOWN_ABBREVS.has(upper) || KNOWN_ABBREVS.has(word)) return word;
    if (word.length <= 2) return word.toLowerCase();
    return word.charAt(0) + word.slice(1).toLowerCase();
  });
}

/**
 * Detect whether a row represents a section header,
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

export function formatFull(v: string | number): string {
  if (typeof v === "string") return v;
  if (v === 0) return "\u2014";
  const abs = Math.abs(v);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return v < 0 ? `($${s})` : `$${s}`;
}

export function formatPct(v: number, decimals = 1): string {
  return `${v.toFixed(decimals)}%`;
}

export function indentLabel(category: string, indent?: number): string {
  return indent ? "  ".repeat(indent) + category : category;
}

/**
 * Compute dynamic font size for PPTX tables based on year-column count.
 * Bumped up by ~2pt versus prior version — there is plenty of horizontal
 * space on a 13.33" wide slide.
 */
export function pptxFontSize(yearCount: number): number {
  if (yearCount <= 5) return 10;
  if (yearCount <= 7) return 9;
  if (yearCount <= 10) return 8;
  return 7;
}

export function pptxColumnWidths(yearCount: number, slideW = 13.33, marginX = 0.3): {
  labelW: number;
  dataW: number;
  tableW: number;
} {
  const tableW = slideW - marginX * 2;
  const labelW = Math.max(2.4, Math.min(3.8, tableW - yearCount * 0.9));
  const dataW = (tableW - labelW) / yearCount;
  return { labelW, dataW, tableW };
}

