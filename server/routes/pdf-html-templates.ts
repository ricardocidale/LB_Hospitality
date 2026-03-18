import { BRAND } from "./premium-export-prompts";
import { logger } from "../logger";

interface PdfTemplateData {
  orientation: "landscape" | "portrait";
  companyName: string;
  entityName: string;
  sections: any[];
  reportTitle?: string;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCurrency(v: any): string {
  if (typeof v === "number") {
    if (v === 0) return "\u2014";
    const abs = Math.abs(v);
    const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
    return v < 0 ? `(${s})` : s;
  }
  return escapeHtml(String(v ?? ""));
}

function formatCompactValue(v: number): string {
  if (v === 0) return "$0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function renderCoverSection(section: any, data: PdfTemplateData): string {
  const company = escapeHtml(data.companyName);
  const entity = escapeHtml(data.entityName);
  const reportTitle = escapeHtml(data.reportTitle || section.title || "Financial Report");
  const subtitle = section.subtitle ? escapeHtml(section.subtitle) : "";
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return `
    <div class="cover-page">
      <div class="cover-accent-top"></div>
      <div class="cover-content">
        <div class="cover-badge">CONFIDENTIAL</div>
        <div class="cover-company-name">${company}</div>
        <div class="cover-rule"></div>
        <div class="cover-report-title">${reportTitle}</div>
        ${subtitle ? `<div class="cover-subtitle">${subtitle}</div>` : ""}
        <div class="cover-meta-grid">
          <div class="cover-meta-item">
            <div class="cover-meta-label">PREPARED FOR</div>
            <div class="cover-meta-value">${entity}</div>
          </div>
          <div class="cover-meta-item">
            <div class="cover-meta-label">DATE</div>
            <div class="cover-meta-value">${dateStr}</div>
          </div>
          <div class="cover-meta-item">
            <div class="cover-meta-label">CLASSIFICATION</div>
            <div class="cover-meta-value">Strictly Confidential</div>
          </div>
        </div>
      </div>
      <div class="cover-footer">
        This document contains proprietary financial projections and confidential business information.
        Distribution is restricted to authorized recipients only.
      </div>
      <div class="cover-accent-bottom"></div>
    </div>`;
}

function renderMetricsDashboardSection(section: any, data: PdfTemplateData): string {
  const title = escapeHtml(section.title || "Key Performance Metrics");
  const company = escapeHtml(data.companyName);
  const entity = escapeHtml(data.entityName);
  const metrics = section.content?.metrics || [];

  const cards = metrics.map((m: any, idx: number) => {
    const trendArrow = m.trend === "up" ? `<span class="kpi-trend kpi-trend-up">\u25B2</span>` :
      m.trend === "down" ? `<span class="kpi-trend kpi-trend-down">\u25BC</span>` : "";
    const accentColors = ["#257D41", "#1A2332", "#9FBCA4", "#257D41", "#1A2332", "#9FBCA4"];
    const accent = accentColors[idx % accentColors.length];
    return `
      <div class="kpi-card">
        <div class="kpi-card-accent" style="background:${accent}"></div>
        <div class="kpi-card-body">
          ${trendArrow}
          <div class="kpi-card-value">${escapeHtml(m.value || "")}</div>
          <div class="kpi-card-label">${escapeHtml(m.label || "")}</div>
          ${m.description ? `<div class="kpi-card-desc">${escapeHtml(m.description)}</div>` : ""}
        </div>
      </div>`;
  }).join("");

  return `
    <div class="content-page">
      <div class="page-header">
        <div class="page-header-title">${title}</div>
        <div class="page-header-subtitle">${company} \u2014 ${entity}</div>
      </div>
      <div class="kpi-grid">${cards}</div>
    </div>`;
}

function renderFinancialTableSection(section: any, data: PdfTemplateData): string {
  const title = escapeHtml(section.title || "Financial Statement");
  const company = escapeHtml(data.companyName);
  const entity = escapeHtml(data.entityName);
  const years = section.content?.years || [];
  const rows = section.content?.rows || [];

  if (!years.length || !rows.length) {
    return `
      <div class="content-page">
        <div class="page-header">
          <div class="page-header-title">${title}</div>
          <div class="page-header-subtitle">${company} \u2014 ${entity}</div>
        </div>
        <p class="empty-state">No financial data available for this section.</p>
      </div>`;
  }

  const yearHeaders = years.map((yr: any) => `<th class="year-col">FY ${escapeHtml(String(yr))}</th>`).join("");

  const tableRows = rows.map((r: any, idx: number) => {
    const isHeader = r.type === "header" || r.isHeader;
    const isTotal = r.type === "total" || r.type === "subtotal" || r.isBold;
    const isFormula = r.isItalic || r.type === "formula";
    const indent = r.indent || 0;

    let rowClass = "";
    if (isHeader) rowClass = "tbl-row-header";
    else if (isTotal) rowClass = "tbl-row-total";
    else if (isFormula) rowClass = "tbl-row-formula";
    else if (idx % 2 === 0) rowClass = "tbl-row-stripe";

    const indentPx = indent * 14;
    const label = escapeHtml(r.category || "");
    const vals = (r.values || []).map((v: any) => `<td class="tbl-val">${formatCurrency(v)}</td>`).join("");

    return `<tr class="${rowClass}"><td class="tbl-label" style="padding-left:${8 + indentPx}px">${label}</td>${vals}</tr>`;
  }).join("");

  return `
    <div class="content-page">
      <div class="page-header">
        <div class="page-header-title">${title}</div>
        <div class="page-header-subtitle">${company} \u2014 ${entity}</div>
      </div>
      <table class="fin-table">
        <thead><tr><th class="tbl-label-hdr"></th>${yearHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;
}

function renderChartSection(section: any, data: PdfTemplateData): string {
  const title = escapeHtml(section.title || "Financial Performance");
  const company = escapeHtml(data.companyName);
  const entity = escapeHtml(data.entityName);
  const charts = section.content?.charts || [];
  const isLandscape = data.orientation === "landscape";
  const chartW = isLandscape ? 180 : 160;
  const chartH = isLandscape ? 130 : 120;

  const CHART_PALETTES: Array<{ top: string; bottom: string }> = [
    { top: "#257D41", bottom: "#9FBCA4" },
    { top: "#1A2332", bottom: "#4A6B8A" },
    { top: "#0E7C6B", bottom: "#7BCEC0" },
    { top: "#8B5A2B", bottom: "#D4A574" },
    { top: "#6B3FA0", bottom: "#B89AD8" },
    { top: "#C75050", bottom: "#E8A0A0" },
  ];

  const chartsHtml = charts.map((chart: any, cIdx: number) => {
    const label = escapeHtml(chart.label || "");
    const values: number[] = (chart.values || []).map((v: any) => typeof v === "number" ? v : 0);
    const years: string[] = (chart.years || []).map((y: any) => String(y));
    if (!values.length) return "";

    const palette = CHART_PALETTES[cIdx % CHART_PALETTES.length];
    const maxVal = Math.max(...values.map(Math.abs), 1);
    const svgW = chartW;
    const svgH = chartH;
    const padL = 48;
    const padR = 10;
    const padT = 16;
    const padB = 28;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;
    const barCount = values.length;
    const gap = plotW / barCount;
    const barW = Math.min(gap * 0.6, 16);
    const gradId = `grad-${cIdx}`;
    const useRotatedLabels = barCount > 6;
    const showEveryNthLabel = barCount > 8 ? 2 : 1;

    const gridLines = 4;
    let gridSvg = "";
    for (let g = 0; g <= gridLines; g++) {
      const y = padT + (plotH / gridLines) * g;
      const gVal = maxVal - (maxVal / gridLines) * g;
      const lbl = formatCompactValue(gVal);
      gridSvg += `<line x1="${padL}" y1="${y}" x2="${svgW - padR}" y2="${y}" stroke="#e0e3e6" stroke-width="0.5" stroke-dasharray="3,2"/>`;
      gridSvg += `<text x="${padL - 4}" y="${y + 2.5}" text-anchor="end" fill="#888" font-size="6" font-family="Helvetica,Arial,sans-serif">${lbl}</text>`;
    }

    let barsSvg = "";
    values.forEach((v, i) => {
      const bH = Math.max((Math.abs(v) / maxVal) * plotH, 1);
      const x = padL + i * gap + (gap - barW) / 2;
      const y = padT + plotH - bH;
      barsSvg += `<rect x="${x}" y="${y}" width="${barW}" height="${bH}" fill="url(#${gradId})" rx="1.5"/>`;

      if (i % showEveryNthLabel === 0 || i === values.length - 1) {
        const valLabel = formatCompactValue(v);
        barsSvg += `<text x="${x + barW / 2}" y="${y - 3}" text-anchor="middle" fill="${palette.top}" font-size="5" font-weight="600" font-family="Helvetica,Arial,sans-serif">${valLabel}</text>`;
      }

      if (years[i]) {
        const yr = years[i].length === 4 ? "'" + years[i].slice(2) : years[i];
        if (useRotatedLabels) {
          barsSvg += `<text x="${x + barW / 2}" y="${padT + plotH + 5}" text-anchor="end" fill="#555" font-size="6" font-weight="500" font-family="Helvetica,Arial,sans-serif" transform="rotate(-45, ${x + barW / 2}, ${padT + plotH + 5})">${yr}</text>`;
        } else {
          barsSvg += `<text x="${x + barW / 2}" y="${svgH - 8}" text-anchor="middle" fill="#555" font-size="6.5" font-weight="500" font-family="Helvetica,Arial,sans-serif">${yr}</text>`;
        }
      }
    });

    return `
      <div class="chart-card">
        <div class="chart-card-title">${label}</div>
        <svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
          <defs>
            <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${palette.top}" stop-opacity="0.92"/>
              <stop offset="100%" stop-color="${palette.bottom}" stop-opacity="0.65"/>
            </linearGradient>
          </defs>
          ${gridSvg}
          <line x1="${padL}" y1="${padT + plotH}" x2="${svgW - padR}" y2="${padT + plotH}" stroke="#bbb" stroke-width="0.7"/>
          ${barsSvg}
        </svg>
      </div>`;
  }).join("");

  return `
    <div class="content-page">
      <div class="page-header">
        <div class="page-header-title">${title}</div>
        <div class="page-header-subtitle">${company} \u2014 ${entity}</div>
      </div>
      <div class="chart-grid">${chartsHtml}</div>
    </div>`;
}

export function buildPdfHtml(aiResult: any, data: PdfTemplateData): string {
  const sections = aiResult.sections || [];
  const isLandscape = data.orientation === "landscape";
  const pageW = isLandscape ? "406.4mm" : "215.9mm";
  const pageH = isLandscape ? "228.6mm" : "279.4mm";

  const sectionHtmlParts: string[] = [];
  for (const section of sections) {
    switch (section.type) {
      case "cover":
        sectionHtmlParts.push(renderCoverSection(section, data));
        break;
      case "metrics_dashboard":
        sectionHtmlParts.push(renderMetricsDashboardSection(section, data));
        break;
      case "financial_table":
        sectionHtmlParts.push(renderFinancialTableSection(section, data));
        break;
      case "chart":
        sectionHtmlParts.push(renderChartSection(section, data));
        break;
      default:
        logger.warn(`Unknown section type "${section.type}" — skipped`, "pdf-template");
        break;
    }
  }

  const NAVY = `#${BRAND.NAVY_HEX}`;
  const SAGE = `#${BRAND.SAGE_HEX}`;
  const DK_GREEN = `#${BRAND.DARK_GREEN_HEX}`;
  const DK_TEXT = `#${BRAND.DARK_TEXT_HEX}`;
  const GRAY = `#${BRAND.GRAY_HEX}`;
  const ALT_ROW = `#${BRAND.ALT_ROW_HEX}`;

  const reportTitle = escapeHtml(data.reportTitle || `${data.companyName} — Financial Report`);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${reportTitle}</title>
<style>
  @page {
    size: ${pageW} ${pageH};
    margin: 0;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: ${DK_TEXT};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-feature-settings: 'liga' 1, 'kern' 1;
    text-rendering: optimizeLegibility;
  }

  /* ═══════════════════════════════════════════
     COVER PAGE — light background
     ═══════════════════════════════════════════ */
  .cover-page {
    width: ${pageW};
    height: ${pageH};
    background: #ffffff;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }

  .cover-accent-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3mm;
    background: linear-gradient(90deg, ${DK_GREEN}, ${SAGE});
  }

  .cover-accent-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3mm;
    background: linear-gradient(90deg, ${SAGE}, ${DK_GREEN});
  }

  .cover-content {
    position: absolute;
    left: 30mm;
    top: 22%;
    right: 30mm;
  }

  .cover-badge {
    display: inline-block;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 2.5px;
    color: ${DK_GREEN};
    border: 1.5px solid ${SAGE};
    padding: 1.5mm 4mm;
    border-radius: 1mm;
    margin-bottom: 8mm;
  }

  .cover-company-name {
    font-size: 36pt;
    font-weight: 700;
    color: ${NAVY};
    letter-spacing: -0.5px;
    line-height: 1.1;
    margin-bottom: 5mm;
  }

  .cover-rule {
    width: 50mm;
    height: 0.8mm;
    background: linear-gradient(90deg, ${DK_GREEN}, ${SAGE});
    margin-bottom: 6mm;
  }

  .cover-report-title {
    font-size: 18pt;
    color: ${GRAY};
    font-weight: 400;
    letter-spacing: 0.3px;
    margin-bottom: 3mm;
  }

  .cover-subtitle {
    font-size: 11pt;
    color: ${GRAY};
    font-weight: 300;
    margin-bottom: 8mm;
  }

  .cover-meta-grid {
    display: flex;
    gap: 18mm;
    margin-top: 12mm;
    padding: 5mm 0;
    border-top: 1.5px solid #e0e3e6;
  }

  .cover-meta-label {
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: ${DK_GREEN};
    margin-bottom: 1.5mm;
  }

  .cover-meta-value {
    font-size: 10pt;
    color: ${DK_TEXT};
    font-weight: 500;
  }

  .cover-footer {
    position: absolute;
    left: 30mm;
    right: 30mm;
    bottom: 8%;
    font-size: 7pt;
    color: ${GRAY};
    font-style: italic;
    line-height: 1.5;
    border-top: 1px solid #e0e3e6;
    padding-top: 3mm;
  }

  /* ═══════════════════════════════════════════
     CONTENT PAGES
     ═══════════════════════════════════════════ */
  .content-page {
    width: ${pageW};
    min-height: ${pageH};
    padding: 14mm 18mm 24mm;
    position: relative;
    page-break-after: always;
    background: #ffffff;
  }

  .content-page::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2mm;
    background: linear-gradient(90deg, ${DK_GREEN}, ${SAGE});
  }

  .content-page::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1mm;
    background: linear-gradient(90deg, ${SAGE}, ${DK_GREEN});
  }

  /* ── Page Header — light ─────────────────── */
  .page-header {
    border-bottom: 2px solid ${DK_GREEN};
    padding: 0 0 4mm;
    margin-bottom: 6mm;
  }

  .page-header-title {
    font-size: 18pt;
    font-weight: 700;
    color: ${NAVY};
    letter-spacing: 0.2px;
  }

  .page-header-subtitle {
    font-size: 9.5pt;
    color: ${GRAY};
    margin-top: 1.5mm;
    font-weight: 400;
    letter-spacing: 0.3px;
  }

  /* ── KPI Metrics Dashboard ────────────────── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5mm;
    margin-top: 4mm;
  }

  .kpi-card {
    background: #fafbfc;
    border: 1px solid #e0e3e6;
    border-radius: 2.5mm;
    overflow: hidden;
    text-align: center;
    break-inside: avoid;
    position: relative;
  }

  .kpi-card-accent {
    height: 2mm;
  }

  .kpi-card-body {
    padding: 5mm 5mm 6mm;
    position: relative;
  }

  .kpi-trend {
    position: absolute;
    top: 2mm;
    right: 3mm;
    font-size: 7pt;
    font-weight: 700;
  }
  .kpi-trend-up { color: ${DK_GREEN}; }
  .kpi-trend-down { color: #cc3333; }

  .kpi-card-value {
    font-size: 24pt;
    font-weight: 700;
    color: ${DK_GREEN};
    letter-spacing: -0.5px;
    margin-bottom: 1.5mm;
  }

  .kpi-card-label {
    font-size: 9pt;
    color: ${GRAY};
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  .kpi-card-desc {
    font-size: 7.5pt;
    color: #aaa;
    margin-top: 1.5mm;
    line-height: 1.3;
  }

  /* ═══════════════════════════════════════════
     FINANCIAL TABLES
     ═══════════════════════════════════════════ */
  .fin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: ${isLandscape ? "9.5pt" : "9pt"};
    border: 1px solid #d0d4d8;
    border-radius: 2mm;
    overflow: hidden;
  }

  .fin-table thead {
    display: table-header-group;
  }

  .fin-table tr {
    break-inside: avoid;
  }

  .fin-table thead tr {
    background: #f5f7f6;
    border-bottom: 2px solid ${DK_GREEN};
  }

  .fin-table th {
    color: ${NAVY};
    font-weight: 700;
    padding: 3mm 3mm;
    text-align: center;
    font-size: ${isLandscape ? "9.5pt" : "9pt"};
    border: none;
    letter-spacing: 0.3px;
  }

  .fin-table th.tbl-label-hdr {
    text-align: left;
    min-width: ${isLandscape ? "50mm" : "40mm"};
  }

  .fin-table td {
    padding: 2mm 3mm;
    border-bottom: 1px solid #e8eaec;
    border-left: 1px solid #eef0f2;
    border-right: 1px solid #eef0f2;
  }

  .fin-table tbody tr:last-child td {
    border-bottom: 2px solid ${SAGE};
  }

  .fin-table .tbl-label {
    text-align: left;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: ${DK_TEXT};
  }

  .fin-table .tbl-val {
    text-align: right;
    font-family: 'SF Mono', 'Menlo', 'Courier New', Courier, monospace;
    white-space: nowrap;
    font-size: ${isLandscape ? "9pt" : "8.5pt"};
    color: #333;
  }

  .fin-table .tbl-row-header td {
    font-weight: 700;
    background: #f0f4f1;
    border-top: 1.5px solid ${SAGE};
    color: ${NAVY};
    font-size: ${isLandscape ? "10pt" : "9.5pt"};
    letter-spacing: 0.2px;
  }

  .fin-table .tbl-row-total td {
    font-weight: 700;
    border-top: 1.5px solid #c0c4c8;
    color: ${NAVY};
  }

  .fin-table .tbl-row-formula td {
    font-style: italic;
    color: ${GRAY};
    font-size: 0.9em;
  }

  .fin-table .tbl-row-stripe td {
    background: ${ALT_ROW};
  }

  .empty-state {
    font-size: 11pt;
    color: ${GRAY};
    text-align: center;
    padding: 20mm;
  }

  /* ═══════════════════════════════════════════
     CHARTS
     ═══════════════════════════════════════════ */
  .chart-grid {
    display: flex;
    flex-direction: column;
    gap: 6mm;
    margin-top: 5mm;
  }

  .chart-card {
    background: #fafbfc;
    border: 1px solid #e0e3e6;
    border-radius: 2.5mm;
    padding: 5mm 6mm 4mm;
    break-inside: avoid;
    overflow: hidden;
  }

  .chart-card-title {
    font-size: 11pt;
    font-weight: 700;
    color: ${NAVY};
    margin-bottom: 3mm;
    padding-bottom: 2mm;
    border-bottom: 1.5px solid #e8eaec;
    letter-spacing: 0.2px;
  }

  .chart-svg {
    display: block;
    width: 100%;
    max-width: ${isLandscape ? "360mm" : "180mm"};
    height: auto;
    margin: 0 auto;
  }
</style>
</head>
<body>
${sectionHtmlParts.join("\n")}
</body>
</html>`;
}
