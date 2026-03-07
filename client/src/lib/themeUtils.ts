/**
 * themeUtils.ts — Dynamic CSS variable injection for the design theme system.
 *
 * Maps DesignColor[] from the database onto :root CSS custom properties so any
 * DB-defined theme can drive the full UI without a hardcoded CSS class.
 *
 * Palette color rank convention (PALETTE: prefix):
 *   rank 1 → primary (buttons, focus rings, active nav)
 *   rank 2 → secondary (contrast accent, deep brand color)
 *   rank 3 → background (page + card surfaces)
 *   rank 4 → foreground / sidebar (dark text + sidebar background)
 *   rank 5 → muted (secondary backgrounds, table rows)
 *   rank 6 → border / input outline
 *
 * Chart color rank convention (CHART: prefix):
 *   rank 1-5 → --chart-1 through --chart-5
 */

export interface DesignColor {
  rank: number;
  name: string;
  hexCode: string;
  description: string;
}

/** Convert a hex color (#RRGGBB) to the raw "H S% L%" string used by CSS custom properties. */
export function hexToHslString(hex: string): string {
  const safe = hex.startsWith("#") ? hex : `#${hex}`;
  const r = parseInt(safe.slice(1, 3), 16) / 255;
  const g = parseInt(safe.slice(3, 5), 16) / 255;
  const b = parseInt(safe.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return `0 0% ${Math.round(l * 100)}%`;

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Return a contrasting foreground HSL string for a given background hex.
 * Uses W3C perceived-luminance weighting.
 */
function contrastHsl(hex: string): string {
  const safe = hex.startsWith("#") ? hex : `#${hex}`;
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "0 0% 20%" : "0 0% 98%";
}

/** CSS variables managed by the theme engine — cleared on reset. */
const MANAGED_VARS = [
  "--primary", "--primary-foreground",
  "--secondary", "--secondary-foreground",
  "--background", "--card", "--card-foreground",
  "--popover", "--popover-foreground",
  "--foreground",
  "--muted", "--muted-foreground",
  "--accent", "--accent-foreground",
  "--border", "--input", "--ring",
  "--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5",
];

/**
 * Apply a DesignColor array from the DB as CSS custom properties on :root.
 * Existing CSS class-based theme classes are removed first.
 */
export function applyThemeColors(colors: DesignColor[]): void {
  const root = document.documentElement;

  // Remove legacy CSS class themes
  root.classList.remove("theme-indigo-blue");

  const palette = colors
    .filter(c => c.description?.startsWith("PALETTE:"))
    .sort((a, b) => a.rank - b.rank);
  const charts = colors
    .filter(c => c.description?.startsWith("CHART:"))
    .sort((a, b) => a.rank - b.rank);

  const set = (name: string, hsl: string) =>
    root.style.setProperty(name, hsl);

  // Palette rank 1 → primary brand color
  const p1 = palette.find(c => c.rank === 1);
  if (p1) {
    const hsl = hexToHslString(p1.hexCode);
    const fg = contrastHsl(p1.hexCode);
    set("--primary", hsl);
    set("--primary-foreground", fg);
    set("--accent", hsl);
    set("--accent-foreground", fg);
    set("--ring", hsl);
  }

  // Palette rank 2 → secondary (deep/dark brand color)
  const p2 = palette.find(c => c.rank === 2);
  if (p2) {
    set("--secondary", hexToHslString(p2.hexCode));
    set("--secondary-foreground", contrastHsl(p2.hexCode));
  }

  // Palette rank 3 → background
  const p3 = palette.find(c => c.rank === 3);
  if (p3) {
    const hsl = hexToHslString(p3.hexCode);
    set("--background", hsl);
    set("--card", hsl);
    set("--popover", "0 0% 100%");
  }

  // Palette rank 4 → foreground (sidebar stays white — never themed)
  const p4 = palette.find(c => c.rank === 4);
  if (p4) {
    const hsl = hexToHslString(p4.hexCode);
    set("--foreground", hsl);
    set("--card-foreground", hsl);
    set("--popover-foreground", hsl);
  }

  // Palette rank 5 → muted
  const p5 = palette.find(c => c.rank === 5);
  if (p5) {
    set("--muted", hexToHslString(p5.hexCode));
    set("--muted-foreground", "0 0% 40%");
  }

  // Palette rank 6 → border / input
  const p6 = palette.find(c => c.rank === 6);
  if (p6) {
    const hsl = hexToHslString(p6.hexCode);
    set("--border", hsl);
    set("--input", hsl);
  }

  // Chart colors rank 1–5
  charts.forEach((c, i) => {
    if (i < 5) set(`--chart-${i + 1}`, hexToHslString(c.hexCode));
  });
}

/** Remove all dynamically injected theme variables, restoring CSS defaults. */
export function resetThemeColors(): void {
  const root = document.documentElement;
  root.classList.remove("theme-indigo-blue");
  MANAGED_VARS.forEach(v => root.style.removeProperty(v));
}
