import { BRAND } from "./premium-export-prompts";
import { logger } from "../logger";

export interface ThemeColorMap {
  navy: string;      // dark primary (headers, cover bg)
  sage: string;      // accent (bars, borders)
  darkGreen: string; // titles, positive values
  darkText: string;  // body text
  gray: string;      // secondary text
  altRow: string;    // zebra striping
  sectionBg: string; // section header bg
  white: string;     // white / inverted text
  lightGray: string; // muted footer text
  negativeRed: string; // negative trend / loss
}

/** Map client theme colors to functional PDF roles using the semantic description labels
 *  that every theme consistently provides: "PALETTE: Primary", "PALETTE: Secondary",
 *  "PALETTE: Muted", "PALETTE: Border", "PALETTE: Background", "PALETTE: Foreground",
 *  and "PALETTE: Accent" / "ACCENT:". Falls back to BRAND defaults when no theme is set. */
export function resolveThemeColors(themeColors?: Array<{name: string; hexCode: string; rank?: number; description?: string}>): ThemeColorMap {
  const defaults: ThemeColorMap = {
    navy: BRAND.NAVY_HEX, sage: BRAND.SAGE_HEX, darkGreen: BRAND.DARK_GREEN_HEX,
    darkText: BRAND.DARK_TEXT_HEX, gray: BRAND.GRAY_HEX,
    altRow: BRAND.ALT_ROW_HEX, sectionBg: BRAND.SECTION_BG_HEX,
    white: BRAND.WHITE_HEX, lightGray: BRAND.LIGHT_GRAY_HEX, negativeRed: BRAND.NEGATIVE_RED_HEX,
  };
  if (!themeColors?.length) return defaults;

  const strip = (hex: string) => hex.replace(/^#/, "");
  const entries = themeColors.map(c => ({
    h: strip(c.hexCode),
    d: (c.description || "").toLowerCase(),
  }));

  // Match by the semantic description prefix that every theme consistently provides.
  // Order matters — first match wins.
  const byDesc = (...keywords: string[]): string | undefined => {
    for (const c of entries) {
      if (keywords.some(k => c.d.includes(k))) return c.h;
    }
    return undefined;
  };

  return {
    navy:      byDesc("palette: primary")                  ?? defaults.navy,
    sage:      byDesc("palette: secondary")                ?? defaults.sage,
    darkGreen: byDesc("palette: accent", "accent:")        ?? defaults.darkGreen,
    darkText:  byDesc("palette: foreground")               ?? defaults.darkText,
    gray:      byDesc("palette: border")                   ?? defaults.gray,
    altRow:    byDesc("palette: muted")                    ?? defaults.altRow,
    sectionBg: byDesc("palette: background")               ?? defaults.sectionBg,
    white:     defaults.white,
    lightGray: defaults.lightGray,
    negativeRed: defaults.negativeRed,
  };
}

interface PdfTemplateData {
  orientation: "landscape" | "portrait";
  companyName: string;
  entityName: string;
  sections: any[];
  reportTitle?: string;
  colors?: ThemeColorMap;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function esc(str: string): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function adjustHex(hex: string, amount: number): string {
  const h = hex.replace(/^#/, "");
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [clamp(r + amount), clamp(g + amount), clamp(b + amount)]
    .map(c => c.toString(16).padStart(2, "0")).join("");
}

function isPercentageRow(category: string): boolean {
  const c = (category || "").toLowerCase();
  return c.includes("(%)") || c.includes("margin") || c === "occupancy"
    || c.includes("cap rate") || c.includes("expense ratio");
}

function isMultiplierRow(category: string): boolean {
  const c = (category || "").toLowerCase();
  return c.includes("equity multiple") || c.includes("dscr");
}

function formatTableValue(v: any, category: string, format?: string): string {
  if (typeof v === "string") return esc(v);
  if (typeof v !== "number") return esc(String(v ?? ""));
  if (isNaN(v)) return "\u2014";

  if (format === "percentage" || isPercentageRow(category)) {
    if (v === 0) return "\u2014";
    const pct = Math.abs(v) <= 2 ? v * 100 : v;
    if (Math.abs(pct) < 0.05) return "\u2014";
    const cls = pct < 0 ? ' class="val-neg"' : "";
    return pct < 0 ? `<span${cls}>(${Math.abs(pct).toFixed(1)}%)</span>` : `${pct.toFixed(1)}%`;
  }

  if (format === "multiplier" || isMultiplierRow(category)) {
    if (v === 0) return "\u2014";
    return v.toFixed(2) + "x";
  }

  if (v === 0) return "\u2014";
  const abs = Math.abs(v);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return v < 0 ? `<span class="val-neg">(${s})</span>` : s;
}

function fmtCompact(v: number): string {
  if (v === 0) return "$0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000).toLocaleString()}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

/* ═══════════════════════════════════════════════════════════════
   COVER PAGE — dark navy with sage accent bar, metadata card
   ═══════════════════════════════════════════════════════════════ */

function renderCoverSection(section: any, d: PdfTemplateData): string {
  const company = esc(d.companyName);
  const entity = esc(d.entityName);
  const title = esc(d.reportTitle || section.title || "Financial Report");
  const subtitle = section.subtitle ? esc(section.subtitle) : "";
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return `
    <div class="cover-page">
      <div class="cover-accent-top"></div>
      <div class="cover-geometric"></div>
      <div class="cover-sage-bar"></div>
      <div class="cover-content">
        <div class="cover-badge">CONFIDENTIAL</div>
        <h1 class="cover-company">${company}</h1>
        <div class="cover-rule"></div>
        <h2 class="cover-title">${title}</h2>
        ${subtitle ? `<p class="cover-subtitle">${subtitle}</p>` : ""}
        <div class="cover-meta-card">
          <div class="cover-meta-grid">
            <div class="cover-meta-item">
              <span class="cover-meta-label">PREPARED FOR</span>
              <span class="cover-meta-value">${entity}</span>
            </div>
            <div class="cover-meta-item">
              <span class="cover-meta-label">DATE</span>
              <span class="cover-meta-value">${dateStr}</span>
            </div>
            <div class="cover-meta-item">
              <span class="cover-meta-label">CLASSIFICATION</span>
              <span class="cover-meta-value">Strictly Confidential</span>
            </div>
          </div>
        </div>
      </div>
      <div class="cover-footer">
        <p>This document contains proprietary financial projections and confidential business information.
        Distribution is restricted to authorized recipients only.</p>
      </div>
      <div class="cover-accent-bottom"></div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   TABLE OF CONTENTS
   ═══════════════════════════════════════════════════════════════ */

function renderTableOfContents(section: any, d: PdfTemplateData): string {
  const entries: { title: string; page: number }[] = section.content?.entries || [];

  const rows = entries.map((e: any, i: number) => `
    <div class="toc-row">
      <span class="toc-num">${String(i + 1).padStart(2, "0")}</span>
      <span class="toc-label">${esc(e.title)}</span>
      <span class="toc-dots"></span>
      <span class="toc-page">${e.page}</span>
    </div>`
  ).join("");

  return `
    <div class="content-page">
      ${pageHeader("Table of Contents", d)}
      <div class="toc-body">${rows}</div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   EXECUTIVE SUMMARY
   ═══════════════════════════════════════════════════════════════ */

function renderExecutiveSummarySection(section: any, d: PdfTemplateData): string {
  const paragraphs: string[] = section.content?.paragraphs || [];
  const highlights: any[] = section.content?.highlights || [];
  const isL = d.orientation === "landscape";

  const parasHtml = paragraphs.map((p: string) =>
    `<p class="summary-para">${esc(p)}</p>`
  ).join("");

  const highlightsHtml = highlights.map((h: any, i: number) => {
    const accentColors = d.colors
      ? [`#${d.colors.darkGreen}`, `#${d.colors.navy}`, `#${d.colors.sage}`, `#${d.colors.darkGreen}`, `#${d.colors.navy}`]
      : [`#${BRAND.DARK_GREEN_HEX}`, `#${BRAND.NAVY_HEX}`, `#${BRAND.SAGE_HEX}`, `#${BRAND.DARK_GREEN_HEX}`, `#${BRAND.NAVY_HEX}`];
    const color = accentColors[i % accentColors.length];
    return `
      <div class="highlight-card">
        <div class="highlight-accent" style="background:${color}"></div>
        <div class="highlight-body">
          <div class="highlight-value" style="color:${color}">${esc(h.value || "")}</div>
          <div class="highlight-label">${esc(h.label || "")}</div>
          ${h.description ? `<div class="highlight-desc">${esc(h.description)}</div>` : ""}
        </div>
      </div>`;
  }).join("");

  return `
    <div class="content-page">
      ${pageHeader("Executive Summary", d)}
      <div class="summary-body">
        <div class="summary-text-block">${parasHtml}</div>
        ${highlights.length ? `
          <div class="summary-divider"></div>
          <h3 class="section-label">KEY HIGHLIGHTS</h3>
          <div class="highlights-grid">${highlightsHtml}</div>
        ` : ""}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   KPI METRICS DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

function renderMetricsDashboardSection(section: any, d: PdfTemplateData): string {
  const metrics: any[] = section.content?.metrics || [];
  const accentColors = d.colors
    ? [`#${d.colors.darkGreen}`, `#${d.colors.navy}`, `#${d.colors.sage}`, `#${d.colors.darkGreen}`, `#${d.colors.navy}`, `#${d.colors.sage}`]
    : [`#${BRAND.DARK_GREEN_HEX}`, `#${BRAND.NAVY_HEX}`, `#${BRAND.SAGE_HEX}`, `#${BRAND.DARK_GREEN_HEX}`, `#${BRAND.NAVY_HEX}`, `#${BRAND.SAGE_HEX}`];

  const cards = metrics.map((m: any, i: number) => {
    const accent = accentColors[i % accentColors.length];
    return `
      <div class="kpi-card">
        <div class="kpi-accent" style="background:${accent}"></div>
        <div class="kpi-body">
          <div class="kpi-value" style="color:${accent}">${esc(m.value || "")}</div>
          <div class="kpi-label">${esc(m.label || "")}</div>
          ${m.description ? `<div class="kpi-desc">${esc(m.description)}</div>` : ""}
        </div>
      </div>`;
  }).join("");

  return `
    <div class="content-page">
      ${pageHeader("Key Performance Metrics", d)}
      <div class="kpi-grid">${cards}</div>
    </div>`;
}

/* Bar chart renderer removed — all charts now use line_chart type */

// Bar chart renderer removed — all charts now use renderLineChartSection
function renderChartSection(_section: any, _d: PdfTemplateData): string {
  return "";
}

/* ═══════════════════════════════════════════════════════════════
   LINE CHART — multi-series trend lines (Revenue, OpEx, ANOI)
   ═══════════════════════════════════════════════════════════════ */

/** Build a theme-aware chart palette from the resolved colors object.
 *  Series are ordered: accent → blue → amber → purple → red → muted  */
function buildChartPalette(colors?: { darkGreen: string; navy: string; sage: string }): string[] {
  if (colors?.darkGreen) {
    const accent = `#${colors.darkGreen}`;
    return [accent, "#3B82F6", "#F59E0B", "#8B5CF6", "#F4795B", "#6B7280", "#14B8A6"];
  }
  return ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#F4795B", "#6B7280", "#14B8A6"];
}

/** Monotone cubic Bézier interpolation (Fritsch–Carlson) — produces smooth curves like Recharts type="monotone" */
function monotoneCubicPath(pts: Array<{x: number; y: number}>): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y}L${pts[1].x},${pts[1].y}`;

  const n = pts.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    dy.push(pts[i + 1].y - pts[i].y);
    m.push(dy[i] / dx[i]);
  }

  const alpha: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      alpha.push(0);
    } else {
      alpha.push(3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
    }
  }
  alpha.push(m[n - 2]);

  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const t = dx[i] / 3;
    const cp1x = pts[i].x + t;
    const cp1y = pts[i].y + alpha[i] * t;
    const cp2x = pts[i + 1].x - t;
    const cp2y = pts[i + 1].y - alpha[i + 1] * t;
    d += `C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${pts[i + 1].x.toFixed(1)},${pts[i + 1].y.toFixed(1)}`;
  }
  return d;
}

function renderLineChartSection(section: any, d: PdfTemplateData): string {
  const series: any[] = section.content?.series || [];
  const years: string[] = section.content?.years || [];
  if (!series.length || !years.length) return "";
  const isL = d.orientation === "landscape";

  const svgW = isL ? 700 : 440;
  const svgH = isL ? 195 : 240;
  const padL = 70, padR = 30, padT = 20, padB = 38;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  // Compute global max across all series
  let globalMax = 1;
  for (const s of series) {
    for (const v of (s.values || [])) {
      if (typeof v === "number" && Math.abs(v) > globalMax) globalMax = Math.abs(v);
    }
  }
  globalMax *= 1.08; // 8% headroom for labels

  // Y-axis grid — stronger lines, larger labels
  const gridN = 5;
  let gridSvg = "";
  for (let g = 0; g <= gridN; g++) {
    const y = padT + (plotH / gridN) * g;
    const gVal = globalMax - (globalMax / gridN) * g;
    gridSvg += `<line x1="${padL}" y1="${y}" x2="${svgW - padR}" y2="${y}" stroke="#d8dbe0" stroke-width="0.7"/>`;
    gridSvg += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="#777" font-size="9" font-weight="500" font-family="Helvetica,Arial,sans-serif">${fmtCompact(gVal * (1 / 1.08))}</text>`;
  }

  // X-axis labels
  let xLabels = "";
  const n = years.length;
  years.forEach((yr, i) => {
    const x = padL + (i / Math.max(n - 1, 1)) * plotW;
    const label = yr.length === 4 ? "'" + yr.slice(2) : yr;
    xLabels += `<text x="${x}" y="${padT + plotH + 18}" text-anchor="middle" fill="#555" font-size="9" font-weight="500" font-family="Helvetica,Arial,sans-serif">${label}</text>`;
  });

  const palette = buildChartPalette(d.colors);

  // Gradient defs for area fills
  let defsSvg = "";
  series.forEach((s: any, si: number) => {
    const color = s.color || palette[si % palette.length];
    const gradId = `area-grad-${si}`;
    defsSvg += `
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.14"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.01"/>
      </linearGradient>`;
  });

  // Series: area fills + smooth curves + precision dots
  let seriesSvg = "";
  series.forEach((s: any, si: number) => {
    const color = s.color || palette[si % palette.length];
    const values: number[] = (s.values || []).map((v: any) => typeof v === "number" ? v : 0);
    if (values.length < 2) return;

    const pts = values.map((v, i) => ({
      x: padL + (i / Math.max(values.length - 1, 1)) * plotW,
      y: padT + plotH - (v / globalMax) * plotH,
    }));

    // Smooth curve path
    const curvePath = monotoneCubicPath(pts);

    // Area fill (gradient under the curve)
    const baseY = padT + plotH;
    const areaPath = `${curvePath}L${pts[pts.length - 1].x.toFixed(1)},${baseY}L${pts[0].x.toFixed(1)},${baseY}Z`;
    seriesSvg += `<path d="${areaPath}" fill="url(#area-grad-${si})" stroke="none"/>`;

    // Fine-line curve — 1.5px for precision, matching on-screen Recharts appearance
    seriesSvg += `<path d="${curvePath}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;

    // Precision data-point markers: white fill + colored stroke, no outer glow
    pts.forEach((p) => {
      seriesSvg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="#fff" stroke="${color}" stroke-width="1.5"/>`;
      seriesSvg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.2" fill="${color}" stroke="none"/>`;
    });
  });

  // Legend — fine line segment + marker + label
  const legendY = svgH - 6;
  const legendSpacing = isL ? 170 : 135;
  const legendItems = series.map((s: any, si: number) => {
    const color = s.color || palette[si % palette.length];
    const xOff = si * legendSpacing;
    return `
      <line x1="${padL + xOff}" y1="${legendY}" x2="${padL + xOff + 16}" y2="${legendY}" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="${padL + xOff + 8}" cy="${legendY}" r="2" fill="#fff" stroke="${color}" stroke-width="1.2"/>
      <text x="${padL + xOff + 22}" y="${legendY + 3.5}" fill="#444" font-size="9" font-weight="600" font-family="Helvetica,Arial,sans-serif">${esc(s.label || "")}</text>`;
  }).join("");

  return `
    <div class="content-page">
      ${pageHeader(esc(section.title || "Performance Trends"), d)}
      <div class="line-chart-container">
        <svg viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet" class="line-chart-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>${defsSvg}</defs>
          ${gridSvg}
          <line x1="${padL}" y1="${padT + plotH}" x2="${svgW - padR}" y2="${padT + plotH}" stroke="#aaa" stroke-width="1"/>
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#d8dbe0" stroke-width="0.5"/>
          ${xLabels}
          ${seriesSvg}
          ${legendItems}
        </svg>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   FINANCIAL TABLE
   ═══════════════════════════════════════════════════════════════ */

function renderFinancialTableSection(section: any, d: PdfTemplateData): string {
  const title = esc(section.title || "Financial Statement");
  const years: string[] = section.content?.years || [];
  const rows: any[] = section.content?.rows || [];

  if (!years.length || !rows.length) {
    return `
      <div class="content-page">
        ${pageHeader(title, d)}
        <p class="empty-state">No financial data available for this section.</p>
      </div>`;
  }

  const yearHeaders = years.map((yr: any) =>
    `<th class="tbl-year">FY ${esc(String(yr))}</th>`
  ).join("");

  const bodyRows = rows.map((r: any, idx: number) => {
    const isHeader = r.type === "header" || r.isHeader;
    const isTotal = r.type === "total" || r.type === "subtotal" || r.isBold;
    const isFormula = r.isItalic || r.type === "formula";
    const indent = r.indent || 0;
    const category = (r.category || "").trim();

    // Skip empty separator rows (blank label + all zeros/nulls)
    if (!category && (r.values || []).every((v: any) => v === 0 || v === null || v === "")) {
      return `<tr class="row-spacer"><td colspan="${years.length + 1}" style="height:3mm;border:none"></td></tr>`;
    }

    let cls = "";
    if (isHeader) cls = "row-header";
    else if (isTotal) cls = "row-total";
    else if (isFormula) cls = "row-formula";
    else if (idx % 2 === 0) cls = "row-stripe";

    const indentPx = indent * 14;
    const label = esc(category);

    // For header/section rows with all-zero values, render empty value cells (no em-dashes)
    const allZero = (r.values || []).every((v: any) => v === 0 || v === null || v === "");
    const vals = (r.values || []).map((v: any) =>
      `<td class="tbl-val">${allZero && isHeader ? "" : formatTableValue(v, category, r.format)}</td>`
    ).join("");

    return `<tr class="${cls}"><td class="tbl-label" style="padding-left:${8 + indentPx}px">${label}</td>${vals}</tr>`;
  }).join("");

  return `
    <div class="content-page">
      ${pageHeader(title, d)}
      <table class="fin-table">
        <thead><tr><th class="tbl-label-hdr"></th>${yearHeaders}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   ANALYSIS & INSIGHTS
   ═══════════════════════════════════════════════════════════════ */

function renderAnalysisSection(section: any, d: PdfTemplateData): string {
  const insights: string[] = section.content?.insights || [];
  const highlights: any[] = section.content?.highlights || [];
  const isL = d.orientation === "landscape";

  const insightsHtml = insights.map((text: string) => {
    const match = text.match(/^\*\*(.+?):\*\*\s*(.+)$/);
    if (match) {
      return `
        <div class="insight-block">
          <div class="insight-title">${esc(match[1])}</div>
          <div class="insight-text">${esc(match[2])}</div>
        </div>`;
    }
    return `<p class="insight-text-plain">${esc(text)}</p>`;
  }).join("");

  const highlightsHtml = highlights.length ? `
    <h3 class="section-label">KEY HIGHLIGHTS</h3>
    <div class="analysis-highlights-grid">
      ${highlights.map((h: any) => `
        <div class="analysis-highlight">
          <div class="analysis-highlight-label">${esc(h.label || "")}</div>
          <div class="analysis-highlight-value">${esc(h.value || "")}</div>
          ${h.description ? `<div class="analysis-highlight-desc">${esc(h.description)}</div>` : ""}
        </div>
      `).join("")}
    </div>` : "";

  return `
    <div class="content-page">
      ${pageHeader("Financial Analysis & Insights", d)}
      <div class="analysis-body">
        <div class="insights-list">${insightsHtml}</div>
        ${highlightsHtml}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   SHARED: branded navy page header (28mm bar + 2mm sage accent)
   ═══════════════════════════════════════════════════════════════ */

function pageHeader(title: string, d: PdfTemplateData): string {
  return `
    <div class="page-hdr">
      <div class="page-hdr-bar">
        <div class="page-hdr-left">
          <h2 class="page-hdr-title">${esc(title)}</h2>
          <span class="page-hdr-sub">${esc(d.companyName)} \u2014 ${esc(d.entityName)}</span>
        </div>
        <span class="page-hdr-brand">${esc(d.companyName)}</span>
      </div>
      <div class="page-hdr-accent"></div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN: assemble HTML document
   ═══════════════════════════════════════════════════════════════ */

export function buildPdfHtml(aiResult: any, data: PdfTemplateData): string {
  const sections = aiResult.sections || [];
  const isL = data.orientation === "landscape";
  const pageW = isL ? "406.4mm" : "215.9mm";
  const pageH = isL ? "228.6mm" : "279.4mm";

  const parts: string[] = [];
  for (const section of sections) {
    switch (section.type) {
      case "cover": parts.push(renderCoverSection(section, data)); break;
      case "table_of_contents": parts.push(renderTableOfContents(section, data)); break;
      case "executive_summary": parts.push(renderExecutiveSummarySection(section, data)); break;
      case "metrics_dashboard": parts.push(renderMetricsDashboardSection(section, data)); break;
      case "financial_table": parts.push(renderFinancialTableSection(section, data)); break;
      case "chart": parts.push(renderChartSection(section, data)); break;
      case "line_chart": parts.push(renderLineChartSection(section, data)); break;
      case "analysis": parts.push(renderAnalysisSection(section, data)); break;
      default: logger.warn(`Unknown PDF section type "${section.type}" — skipped`, "pdf-template"); break;
    }
  }

  // Use theme colors if provided, fall back to BRAND defaults
  const c = data.colors || resolveThemeColors();
  const NAVY = `#${c.navy}`;
  const SAGE = `#${c.sage}`;
  const DK = `#${c.darkGreen}`;
  const TXT = `#${c.darkText}`;
  const GR = `#${c.gray}`;
  const ALT = `#${c.altRow}`;
  const SECBG = `#${c.sectionBg}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${esc(data.reportTitle || data.companyName + " Report")}</title>
<style>
/* ────────────────────────────────────────────
   RESET & BASE
   ──────────────────────────────────────────── */
@page { size: ${pageW} ${pageH}; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: ${TXT};
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  font-feature-settings: 'liga' 1, 'kern' 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
.val-neg { color: #${c.negativeRed}; }

/* ────────────────────────────────────────────
   COVER PAGE — dark navy
   ──────────────────────────────────────────── */
.cover-page {
  width: ${pageW}; height: ${pageH};
  background: linear-gradient(155deg, #${adjustHex(c.navy, 12)} 0%, ${NAVY} 35%, #${adjustHex(c.navy, -8)} 100%);
  position: relative; overflow: hidden;
  page-break-after: always;
}
.cover-accent-top {
  position: absolute; top: 0; left: 0; right: 0; height: 3.5mm;
  background: linear-gradient(90deg, ${DK}, ${SAGE}, ${DK});
}
.cover-accent-bottom {
  position: absolute; bottom: 0; left: 0; right: 0; height: 3.5mm;
  background: linear-gradient(90deg, ${SAGE}, ${DK}, ${SAGE});
}
.cover-geometric {
  position: absolute;
  right: ${isL ? "-30mm" : "-20mm"};
  top: 15%;
  width: ${isL ? "180mm" : "120mm"};
  height: ${isL ? "180mm" : "120mm"};
  border: 1.5px solid ${SAGE}1f;
  border-radius: 50%;
}
.cover-geometric::after {
  content: '';
  position: absolute;
  top: 15%; left: 15%; right: 15%; bottom: 15%;
  border: 1px solid ${SAGE}14;
  border-radius: 50%;
}
/* Vertical sage accent bar beside company name */
.cover-sage-bar {
  position: absolute;
  left: ${isL ? "35mm" : "23mm"};
  top: ${isL ? "27%" : "21%"};
  width: 2mm; height: 42mm;
  background: linear-gradient(180deg, ${SAGE}, ${DK});
  border-radius: 1mm;
}
.cover-content {
  position: absolute;
  left: ${isL ? "42mm" : "30mm"};
  top: ${isL ? "28%" : "22%"};
  right: ${isL ? "50%" : "30mm"};
}
.cover-badge {
  display: inline-block;
  font-size: 7pt; font-weight: 700;
  letter-spacing: 3px; color: ${SAGE};
  border: 1.5px solid rgba(159,188,164,0.5);
  padding: 2mm 5mm; border-radius: 1.2mm;
  margin-bottom: 10mm;
}
.cover-company {
  font-size: ${isL ? "40pt" : "34pt"};
  font-weight: 800; color: #fff;
  letter-spacing: -0.5px; line-height: 1.08;
  margin-bottom: 6mm;
}
.cover-rule {
  width: 50mm; height: 1mm;
  background: linear-gradient(90deg, ${DK}, ${SAGE});
  border-radius: 0.5mm; margin-bottom: 7mm;
}
.cover-title {
  font-size: ${isL ? "18pt" : "16pt"};
  color: rgba(255,255,255,0.75);
  font-weight: 400; letter-spacing: 0.3px;
  line-height: 1.4; margin-bottom: 3mm;
}
.cover-subtitle {
  font-size: 11pt; color: rgba(255,255,255,0.5);
  font-weight: 300; margin-bottom: 8mm;
}
/* Metadata card with navy bg + sage border */
.cover-meta-card {
  margin-top: 14mm;
  background: rgba(26,35,50,0.6);
  border: 1px solid rgba(159,188,164,0.35);
  border-radius: 2mm;
  padding: 5mm 6mm;
}
.cover-meta-grid {
  display: flex; gap: 18mm;
}
.cover-meta-item { display: flex; flex-direction: column; gap: 2mm; }
.cover-meta-label {
  font-size: 6.5pt; font-weight: 700;
  letter-spacing: 2px; color: ${SAGE};
}
.cover-meta-value {
  font-size: 10pt; color: rgba(255,255,255,0.85); font-weight: 500;
}
.cover-footer {
  position: absolute;
  left: ${isL ? "42mm" : "30mm"};
  right: ${isL ? "42mm" : "30mm"};
  bottom: 7%;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 3mm;
}
.cover-footer p {
  font-size: 7pt; color: rgba(255,255,255,0.35);
  font-style: italic; line-height: 1.6;
}

/* ────────────────────────────────────────────
   CONTENT PAGES
   ──────────────────────────────────────────── */
.content-page {
  width: ${pageW};
  height: ${pageH};
  padding: ${isL ? "4mm 22mm 20mm" : "4mm 18mm 20mm"};
  position: relative;
  page-break-after: always;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.content-page::after {
  content: ''; position: absolute;
  bottom: 0; left: 0; right: 0; height: 1.2mm;
  background: linear-gradient(90deg, ${SAGE}, ${DK});
}

/* ── Branded Page Header: Navy bar (28mm) + Sage accent (2mm) ── */
.page-hdr {
  flex-shrink: 0;
  margin: 0 -22mm 5mm;
  padding: 0 22mm;
}
.page-hdr-bar {
  background: ${NAVY};
  padding: 4.5mm 7mm 4mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0 0 2mm 2mm;
}
.page-hdr-title {
  font-size: ${isL ? "18pt" : "16pt"};
  font-weight: 700; color: #fff;
  letter-spacing: 0.2px;
}
.page-hdr-sub {
  font-size: 8.5pt; color: rgba(255,255,255,0.55);
  margin-top: 1mm; display: block;
  letter-spacing: 0.3px;
}
.page-hdr-brand {
  font-size: 8pt; color: ${SAGE}; font-weight: 600;
  letter-spacing: 0.5px; white-space: nowrap;
}
.page-hdr-accent {
  height: 2mm;
  background: linear-gradient(90deg, ${DK}, ${SAGE});
  border-radius: 0 0 1mm 1mm;
}

/* ────────────────────────────────────────────
   TABLE OF CONTENTS
   ──────────────────────────────────────────── */
.toc-body {
  flex: 1; display: flex; flex-direction: column;
  justify-content: center;
  padding: 0 ${isL ? "40mm" : "10mm"};
}
.toc-row {
  display: flex; align-items: baseline;
  padding: 3.5mm 0;
  border-bottom: 1px solid #eef0f2;
}
.toc-row:last-child { border-bottom: none; }
.toc-num {
  font-size: 9pt; font-weight: 700; color: ${SAGE};
  width: 10mm; flex-shrink: 0;
}
.toc-label {
  font-size: 11pt; font-weight: 500; color: ${TXT};
  flex-shrink: 0;
}
.toc-dots {
  flex: 1; margin: 0 3mm;
  border-bottom: 1px dotted #ccc;
  min-width: 10mm;
  align-self: flex-end;
  margin-bottom: 2px;
}
.toc-page {
  font-size: 10pt; font-weight: 700; color: ${NAVY};
  flex-shrink: 0;
}

/* ────────────────────────────────────────────
   EXECUTIVE SUMMARY
   ──────────────────────────────────────────── */
.summary-body { flex: 1; display: flex; flex-direction: column; }
.summary-text-block { margin-bottom: 4mm; }
.summary-para {
  font-size: 10.5pt; line-height: 1.75; color: ${TXT};
  margin-bottom: 4mm; text-align: justify;
}
.summary-divider {
  height: 1px; background: linear-gradient(90deg, ${DK}, ${SAGE}, transparent);
  margin: 5mm 0;
}
.section-label {
  font-size: 8pt; font-weight: 700; letter-spacing: 2px;
  color: ${DK}; margin-bottom: 4mm;
}
.highlights-grid {
  display: grid;
  grid-template-columns: repeat(${isL ? 3 : 2}, 1fr);
  gap: 4mm;
}
.highlight-card {
  background: #f8faf9; border: 1px solid #e4e8e5;
  border-radius: 2mm; overflow: hidden;
  display: flex;
}
.highlight-accent { width: 3mm; flex-shrink: 0; }
.highlight-body { padding: 4mm 5mm; }
.highlight-value {
  font-size: 16pt; font-weight: 700;
  margin-bottom: 1mm; letter-spacing: -0.3px;
}
.highlight-label {
  font-size: 8pt; font-weight: 600; color: ${GR};
  letter-spacing: 0.3px; margin-bottom: 1mm;
}
.highlight-desc {
  font-size: 7pt; color: #999; line-height: 1.4;
}

/* ────────────────────────────────────────────
   KPI METRICS
   ──────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(${isL ? 3 : 2}, 1fr);
  gap: 5mm; margin-top: 3mm;
}
.kpi-card {
  background: #f8faf9; border: 1px solid #e0e3e6;
  border-radius: 2.5mm; overflow: hidden; text-align: center;
}
.kpi-accent { height: 2.5mm; }
.kpi-body { padding: 6mm 5mm 7mm; }
.kpi-value {
  font-size: 28pt; font-weight: 800;
  letter-spacing: -0.5px; margin-bottom: 2mm;
}
.kpi-label {
  font-size: 9.5pt; color: ${GR}; font-weight: 600;
  letter-spacing: 0.2px; margin-bottom: 1.5mm;
}
.kpi-desc {
  font-size: 7.5pt; color: #aaa; line-height: 1.35;
  max-width: 90%; margin: 0 auto;
}

/* ────────────────────────────────────────────
   BAR CHARTS — ${isL ? "2x2 grid" : "stacked"}
   ──────────────────────────────────────────── */
.chart-page .chart-grid {
  display: grid;
  grid-template-columns: ${isL ? "1fr 1fr" : "1fr"};
  gap: 4mm;
  flex: 1;
  min-height: 0;
}
.chart-card {
  background: #fafbfc;
  border: 1px solid #e2e5e8;
  border-radius: 2.5mm;
  display: flex; flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.chart-card-header {
  font-size: 10pt; font-weight: 700; color: ${NAVY};
  padding: 3.5mm 5mm 2.5mm;
  border-bottom: 1px solid #eaedf0;
  letter-spacing: 0.1px; flex-shrink: 0;
}
.chart-svg {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 2mm 3mm 1mm;
}

/* ────────────────────────────────────────────
   LINE CHART
   ──────────────────────────────────────────── */
.line-chart-container {
  display: flex; align-items: center; justify-content: center;
  break-inside: avoid; overflow: visible;
  max-height: ${isL ? "110mm" : "130mm"};
  height: ${isL ? "110mm" : "130mm"};
}
.line-chart-svg {
  width: 100%;
  max-height: 100%;
  display: block;
  break-inside: avoid;
}

/* ────────────────────────────────────────────
   FINANCIAL TABLES
   ──────────────────────────────────────────── */
.fin-table {
  width: 100%; border-collapse: collapse;
  font-size: ${isL ? "9pt" : "8.5pt"};
  border: 0.6pt solid ${SAGE};
  border-radius: 2mm; overflow: hidden;
}
.fin-table thead { display: table-header-group; }
.fin-table tr { break-inside: avoid; }
.fin-table thead tr {
  background: linear-gradient(135deg, ${SECBG}, ${ALT});
  border-bottom: 2px solid ${DK};
}
.fin-table th {
  color: ${NAVY}; font-weight: 700;
  padding: 2.5mm 3mm; text-align: center;
  font-size: ${isL ? "9pt" : "8.5pt"};
  letter-spacing: 0.2px; border: none;
}
.fin-table th.tbl-label-hdr {
  text-align: left; min-width: ${isL ? "48mm" : "38mm"};
}
.fin-table td {
  padding: 1.8mm 3mm;
  border-bottom: 1px solid color-mix(in srgb, ${SAGE} 18%, white);
  border-left: 1px solid color-mix(in srgb, ${SAGE} 10%, white);
  border-right: 1px solid color-mix(in srgb, ${SAGE} 10%, white);
}
.fin-table tbody tr:last-child td {
  border-bottom: 2px solid ${SAGE};
}
.fin-table .tbl-label {
  text-align: left; color: ${TXT};
  white-space: nowrap;
}
.fin-table .tbl-val {
  text-align: right;
  font-family: 'Courier New', Courier, monospace;
  white-space: nowrap;
  color: ${TXT}; letter-spacing: 0.2px;
}
.fin-table .row-header td {
  font-weight: 700; background: ${SECBG};
  border-top: 1.5px solid ${SAGE};
  color: ${NAVY};
  letter-spacing: 0.15px;
}
.fin-table .row-total td {
  font-weight: 700;
  border-top: 1.5px solid ${GR};
  color: ${NAVY};
}
.fin-table .row-formula td {
  font-style: italic; color: ${GR};
  font-size: 0.9em;
}
.fin-table .row-stripe td {
  background: ${ALT};
}

/* ────────────────────────────────────────────
   ANALYSIS & INSIGHTS
   ──────────────────────────────────────────── */
.analysis-body { flex: 1; }
.insights-list { margin-bottom: 6mm; }
.insight-block {
  background: #f8faf9; border-left: 3px solid ${DK};
  border-radius: 0 2mm 2mm 0;
  padding: 4mm 5mm; margin-bottom: 3.5mm;
}
.insight-title {
  font-size: 10pt; font-weight: 700; color: ${NAVY};
  margin-bottom: 1.5mm;
}
.insight-text {
  font-size: 9.5pt; line-height: 1.6; color: ${TXT};
}
.insight-text-plain {
  font-size: 9.5pt; line-height: 1.6; color: ${TXT};
  margin-bottom: 3mm;
}
.analysis-highlights-grid {
  display: grid;
  grid-template-columns: repeat(${isL ? 3 : 2}, 1fr);
  gap: 3mm;
}
.analysis-highlight {
  background: linear-gradient(135deg, #f0f4f1, #f8faf9);
  border: 1px solid #e0e3e6;
  border-radius: 2mm; padding: 4mm 5mm;
}
.analysis-highlight-label {
  font-size: 7pt; font-weight: 700; color: ${DK};
  letter-spacing: 1px; margin-bottom: 1mm;
}
.analysis-highlight-value {
  font-size: 14pt; font-weight: 700; color: ${NAVY};
  margin-bottom: 1mm;
}
.analysis-highlight-desc {
  font-size: 7pt; color: #999; line-height: 1.3;
}

.empty-state {
  font-size: 11pt; color: ${GR};
  text-align: center; padding: 30mm; flex: 1;
  display: flex; align-items: center; justify-content: center;
}
</style>
</head>
<body>
${parts.join("\n")}
</body>
</html>`;
}
