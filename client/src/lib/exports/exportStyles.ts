/**
 * exportStyles.ts — Shared constants and formatting helpers for all export formats
 *
 * Centralises the brand palette, typography rules, number-formatting logic,
 * and row-classification used across PDF (jsPDF), PPTX (pptxgenjs), Excel,
 * and CSV exports. A single change here propagates everywhere.
 *
 * ─── Brand Palette (last-resort fallback — current theme always takes precedence) ───
 *   Colors resolve from the active DB theme via buildBrandPalette(themeColors).
 *   BRAND constant below matches Studio Noir defaults and is ONLY used when
 *   no theme colors are passed. All shade colors are derived from theme solids.
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

export interface ThemeColor {
  name: string;
  hexCode: string;
  rank?: number;
  description?: string;
}

export type BrandPalette = {
  SAGE_HEX: string;
  DARK_GREEN_HEX: string;
  NAVY_HEX: string;
  DARK_TEXT_HEX: string;
  GRAY_HEX: string;
  LIGHT_GRAY_HEX: string;
  WHITE_HEX: string;
  SECTION_BG_HEX: string;
  ALT_ROW_HEX: string;
  WARM_BG_HEX: string;
  CARD_BG_HEX: string;
  BORDER_LIGHT_HEX: string;
  BORDER_SECTION_HEX: string;
  NEGATIVE_RED_HEX: string;
  CHART_HEX: string[];
  LINE_HEX: string[];
  SAGE_RGB: [number, number, number];
  DARK_GREEN_RGB: [number, number, number];
  NAVY_RGB: [number, number, number];
  DARK_TEXT_RGB: [number, number, number];
  GRAY_RGB: [number, number, number];
  LIGHT_GRAY_RGB: [number, number, number];
  WHITE_RGB: [number, number, number];
  SECTION_BG_RGB: [number, number, number];
  ALT_ROW_RGB: [number, number, number];
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function lighten(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  const l = (c: number) => Math.min(255, Math.round(c + (255 - c) * factor));
  return [l(r), l(g), l(b)].map(c => c.toString(16).padStart(2, "0")).join("");
}

export function buildBrandPalette(themeColors?: ThemeColor[]): BrandPalette {
  if (!themeColors?.length) return BRAND;

  const strip = (hex: string) => hex.replace(/^#/, "");
  const lower = themeColors.map(c => ({ h: strip(c.hexCode), d: (c.description || "").toLowerCase(), r: c.rank ?? 99 }));
  const byDesc = (...keywords: string[]): string | undefined => {
    for (const c of lower) {
      if (keywords.some(k => c.d.includes(k))) return c.h;
    }
    return undefined;
  };
  const collectByPrefix = (prefix: string): string[] =>
    lower.filter(c => c.d.startsWith(prefix)).sort((a, b) => a.r - b.r).map(c => c.h);

  const navy = byDesc("palette: primary") ?? BRAND.NAVY_HEX;
  const sage = byDesc("palette: secondary") ?? BRAND.SAGE_HEX;
  const darkGreen = byDesc("palette: accent", "accent:") ?? BRAND.DARK_GREEN_HEX;
  const darkText = byDesc("palette: foreground") ?? BRAND.DARK_TEXT_HEX;
  const gray = byDesc("palette: border") ?? BRAND.GRAY_HEX;
  const sectionBg = byDesc("palette: background") ?? BRAND.SECTION_BG_HEX;
  const altRow = byDesc("palette: muted") ?? BRAND.ALT_ROW_HEX;
  const chartArr = collectByPrefix("chart:");
  const lineArr = collectByPrefix("line:");
  const negRed = byDesc("line: line 3", "destructive") ?? (lineArr[2] || BRAND.NEGATIVE_RED_HEX);

  return {
    SAGE_HEX: sage,
    DARK_GREEN_HEX: darkGreen,
    NAVY_HEX: navy,
    DARK_TEXT_HEX: darkText,
    GRAY_HEX: gray,
    LIGHT_GRAY_HEX: chartArr[3] || lighten(gray, 0.3),
    WHITE_HEX: "FFFFFF",
    SECTION_BG_HEX: sectionBg,
    ALT_ROW_HEX: altRow,
    WARM_BG_HEX: lighten(sectionBg, 0.5),
    CARD_BG_HEX: lighten(sectionBg, 0.4),
    BORDER_LIGHT_HEX: lighten(gray, 0.2),
    BORDER_SECTION_HEX: sage,
    NEGATIVE_RED_HEX: negRed,
    CHART_HEX: chartArr.length ? chartArr : [darkGreen, sage, navy, lighten(gray, 0.3), gray],
    LINE_HEX: lineArr.length ? [darkGreen, ...lineArr] : [darkGreen, sage, navy, lighten(gray, 0.3)],
    SAGE_RGB: hexToRgb(sage),
    DARK_GREEN_RGB: hexToRgb(darkGreen),
    NAVY_RGB: hexToRgb(navy),
    DARK_TEXT_RGB: hexToRgb(darkText),
    GRAY_RGB: hexToRgb(gray),
    LIGHT_GRAY_RGB: hexToRgb(chartArr[3] || lighten(gray, 0.3)),
    WHITE_RGB: [255, 255, 255],
    SECTION_BG_RGB: hexToRgb(sectionBg),
    ALT_ROW_RGB: hexToRgb(altRow),
  };
}

export const BRAND: BrandPalette = {
  SAGE_HEX: "3F3F46",
  DARK_GREEN_HEX: "10B981",
  NAVY_HEX: "18181B",
  DARK_TEXT_HEX: "09090B",
  GRAY_HEX: "E4E4E7",
  LIGHT_GRAY_HEX: "A1A1AA",
  WHITE_HEX: "FFFFFF",
  SECTION_BG_HEX: "FFFFFF",
  ALT_ROW_HEX: "F4F4F5",
  WARM_BG_HEX: "FAFAFA",
  CARD_BG_HEX: "F9F9FA",
  BORDER_LIGHT_HEX: "E4E4E7",
  BORDER_SECTION_HEX: "3F3F46",
  NEGATIVE_RED_HEX: "F43F5E",
  CHART_HEX: ["27272A", "52525B", "71717A", "A1A1AA", "D4D4D8"],
  LINE_HEX: ["10B981", "F59E0B", "F43F5E", "0EA5E9", "8B5CF6"],
  SAGE_RGB: [63, 63, 70],
  DARK_GREEN_RGB: [16, 185, 129],
  NAVY_RGB: [24, 24, 27],
  DARK_TEXT_RGB: [9, 9, 11],
  GRAY_RGB: [228, 228, 231],
  LIGHT_GRAY_RGB: [161, 161, 170],
  WHITE_RGB: [255, 255, 255],
  SECTION_BG_RGB: [255, 255, 255],
  ALT_ROW_RGB: [244, 244, 245],
};

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

