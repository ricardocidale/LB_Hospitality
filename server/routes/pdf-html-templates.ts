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
      <div class="cover-pattern"></div>
      <div class="cover-gradient"></div>
      <div class="cover-top-line"></div>
      <div class="cover-bottom-line"></div>
      <div class="cover-corner-accent"></div>
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
    </div>`;
}

function renderExecutiveSummarySection(section: any, data: PdfTemplateData): string {
  const title = escapeHtml(section.title || "Executive Summary");
  const company = escapeHtml(data.companyName);
  const entity = escapeHtml(data.entityName);
  const paragraphs = section.content?.paragraphs || section.content?.observations || section.content?.items || [];
  const highlights = section.content?.highlights || [];

  let paragraphsHtml = "";
  if (paragraphs.length > 0) {
    const items = paragraphs.map((p: any) => {
      const text = typeof p === "string"
        ? escapeHtml(p)
        : `<strong>${escapeHtml(p.metric)}:</strong> ${escapeHtml(p.insight)}`;
      return `<p class="prose-paragraph">${text}</p>`;
    }).join("");
    paragraphsHtml = `<div class="prose-card">${items}</div>`;
  }

  let highlightsHtml = "";
  if (highlights.length > 0) {
    const items = highlights.map((h: any) => `
      <div class="kpi-highlight">
        <div class="kpi-highlight-bar"></div>
        <div class="kpi-highlight-content">
          <div class="kpi-highlight-metric">${escapeHtml(h.metric)}</div>
          <div class="kpi-highlight-insight">${escapeHtml(h.insight || "")}</div>
        </div>
      </div>
    `).join("");
    highlightsHtml = `
      <div class="kpi-highlights-section">
        <div class="kpi-highlights-label">KEY HIGHLIGHTS</div>
        ${items}
      </div>`;
  }

  return `
    <div class="content-page">
      <div class="page-header">
        <div class="page-header-title">${title}</div>
        <div class="page-header-subtitle">${company} \u2014 ${entity}</div>
        <div class="page-header-company">${company}</div>
      </div>
      ${paragraphsHtml}
      ${highlightsHtml}
    </div>`;
}

function renderMetricsDashboardSection(section: any, data: PdfTemplateData): string {
  const title = escapeHtml(section.title || "Key Investment Metrics");
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
        <div class="page-header-company">${company}</div>
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
          <div class="page-header-company">${company}</div>
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

    return `<tr class="${rowClass}"><td class="tbl-label" style="padding-left:${6 + indentPx}px">${label}</td>${vals}</tr>`;
  }).join("");

  return `
    <div class="content-page">
      <div class="page-header">
        <div class="page-header-title">${title}</div>
        <div class="page-header-subtitle">${company} \u2014 ${entity}</div>
        <div class="page-header-company">${company}</div>
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
  const chartW = isLandscape ? 170 : 150;
  const chartH = 115;

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
    const padL = 44;
    const padR = 8;
    const padT = 14;
    const padB = 22;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;
    const barCount = values.length;
    const gap = plotW / barCount;
    const barW = Math.min(gap * 0.55, 18);
    const gradId = `grad-${cIdx}`;

    const gridLines = 4;
    let gridSvg = "";
    for (let g = 0; g <= gridLines; g++) {
      const y = padT + (plotH / gridLines) * g;
      const gVal = maxVal - (maxVal / gridLines) * g;
      const lbl = formatCompactValue(gVal);
      gridSvg += `<line x1="${padL}" y1="${y}" x2="${svgW - padR}" y2="${y}" stroke="#e8eaec" stroke-width="0.4" stroke-dasharray="2,2"/>`;
      gridSvg += `<text x="${padL - 3}" y="${y + 2.5}" text-anchor="end" fill="#999" font-size="5.5" font-family="Helvetica,Arial,sans-serif">${lbl}</text>`;
    }

    let barsSvg = "";
    values.forEach((v, i) => {
      const bH = Math.max((Math.abs(v) / maxVal) * plotH, 1);
      const x = padL + i * gap + (gap - barW) / 2;
      const y = padT + plotH - bH;
      barsSvg += `<rect x="${x}" y="${y}" width="${barW}" height="${bH}" fill="url(#${gradId})" rx="2"/>`;
      const valLabel = formatCompactValue(v);
      barsSvg += `<text x="${x + barW / 2}" y="${y - 2}" text-anchor="middle" fill="${palette.top}" font-size="4.5" font-weight="600" font-family="Helvetica,Arial,sans-serif">${valLabel}</text>`;
      if (years[i]) {
        barsSvg += `<text x="${x + barW / 2}" y="${svgH - 6}" text-anchor="middle" fill="#666" font-size="5.5" font-weight="500" font-family="Helvetica,Arial,sans-serif">${years[i]}</text>`;
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
          <line x1="${padL}" y1="${padT + plotH}" x2="${svgW - padR}" y2="${padT + plotH}" stroke="#ccd0d4" stroke-width="0.7"/>
          ${barsSvg}
        </svg>
      </div>`;
  }).join("");

  return `
    <div class="content-page">
      <div class="page-header">
        <div class="page-header-title">${title}</div>
        <div class="page-header-subtitle">${company} \u2014 ${entity}</div>
        <div class="page-header-company">${company}</div>
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
      case "executive_summary":
      case "analysis":
      case "notes":
        sectionHtmlParts.push(renderExecutiveSummarySection(section, data));
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
  const SEC_BG = `#${BRAND.SECTION_BG_HEX}`;
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
     COVER PAGE
     ═══════════════════════════════════════════ */
  .cover-page {
    width: ${pageW};
    height: ${pageH};
    background: ${NAVY};
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }

  .cover-pattern {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(159,188,164,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(159,188,164,0.06) 1px, transparent 1px);
    background-size: 16mm 16mm;
  }

  .cover-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgba(37,125,65,0.08) 70%, rgba(159,188,164,0.12) 100%);
  }

  .cover-top-line, .cover-bottom-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2.5mm;
    background: linear-gradient(90deg, ${SAGE}, ${DK_GREEN});
  }
  .cover-top-line { top: 0; }
  .cover-bottom-line { bottom: 0; }

  .cover-corner-accent {
    position: absolute;
    right: 0;
    top: 0;
    width: 80mm;
    height: 80mm;
    background: linear-gradient(225deg, rgba(159,188,164,0.12) 0%, transparent 60%);
  }

  .cover-content {
    position: absolute;
    left: 28mm;
    top: 24%;
    right: 28mm;
  }

  .cover-badge {
    display: inline-block;
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 2.5px;
    color: ${SAGE};
    border: 1px solid rgba(159,188,164,0.4);
    padding: 1.5mm 4mm;
    border-radius: 1mm;
    margin-bottom: 6mm;
  }

  .cover-company-name {
    font-size: 36pt;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.5px;
    line-height: 1.1;
    margin-bottom: 5mm;
  }

  .cover-rule {
    width: 50mm;
    height: 0.6mm;
    background: linear-gradient(90deg, ${SAGE}, transparent);
    margin-bottom: 6mm;
  }

  .cover-report-title {
    font-size: 18pt;
    color: ${SAGE};
    font-weight: 300;
    letter-spacing: 0.3px;
    margin-bottom: 3mm;
  }

  .cover-subtitle {
    font-size: 11pt;
    color: rgba(180,200,185,0.8);
    font-weight: 300;
    margin-bottom: 8mm;
  }

  .cover-meta-grid {
    display: flex;
    gap: 16mm;
    margin-top: 10mm;
    padding: 5mm 0;
    border-top: 1px solid rgba(159,188,164,0.2);
  }

  .cover-meta-item {}

  .cover-meta-label {
    font-size: 6pt;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: ${SAGE};
    margin-bottom: 1.5mm;
  }

  .cover-meta-value {
    font-size: 9pt;
    color: rgba(255,255,255,0.85);
    font-weight: 400;
  }

  .cover-footer {
    position: absolute;
    left: 28mm;
    right: 28mm;
    bottom: 8%;
    font-size: 6.5pt;
    color: rgba(120,140,138,0.8);
    font-style: italic;
    line-height: 1.5;
    border-top: 1px solid rgba(159,188,164,0.15);
    padding-top: 3mm;
  }

  /* ═══════════════════════════════════════════
     CONTENT PAGES
     ═══════════════════════════════════════════ */
  .content-page {
    width: ${pageW};
    min-height: ${pageH};
    padding: 10mm 16mm 22mm;
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
    background: linear-gradient(90deg, ${NAVY}, ${NAVY} 70%, ${SAGE});
  }

  .content-page::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1mm;
    background: linear-gradient(90deg, ${SAGE}, ${NAVY});
  }

  /* ── Page Header ──────────────────────────── */
  .page-header {
    background: linear-gradient(135deg, ${NAVY} 0%, #243040 100%);
    border-radius: 2.5mm;
    padding: 6mm 8mm 5mm;
    margin-bottom: 6mm;
    position: relative;
    overflow: hidden;
  }

  .page-header::before {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 30%;
    background: linear-gradient(90deg, transparent, rgba(159,188,164,0.08));
  }

  .page-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1mm;
    background: linear-gradient(90deg, ${SAGE}, ${DK_GREEN}, ${SAGE});
    border-radius: 0 0 2.5mm 2.5mm;
  }

  .page-header-title {
    font-size: 18pt;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.2px;
    position: relative;
  }

  .page-header-subtitle {
    font-size: 9pt;
    color: ${SAGE};
    margin-top: 1.5mm;
    font-weight: 400;
    letter-spacing: 0.3px;
    position: relative;
  }

  .page-header-company {
    position: absolute;
    right: 8mm;
    top: 50%;
    transform: translateY(-50%);
    font-size: 8pt;
    color: rgba(200,200,200,0.6);
    letter-spacing: 0.5px;
    font-weight: 300;
  }

  /* ── Prose / Executive Summary Cards ───────── */
  .prose-card {
    background: linear-gradient(135deg, #fefcfa 0%, #f9faf7 100%);
    border: 1px solid rgba(159,188,164,0.35);
    border-left: 2.5mm solid ${DK_GREEN};
    border-radius: 2mm;
    padding: 5mm 6mm;
    margin-bottom: 5mm;
    break-inside: avoid;
  }

  .prose-paragraph {
    font-size: 11pt;
    line-height: 1.6;
    margin-bottom: 3.5mm;
    color: ${DK_TEXT};
  }
  .prose-paragraph:last-child { margin-bottom: 0; }
  .prose-paragraph strong { color: ${NAVY}; }

  /* ── Key Highlights ───────────────────────── */
  .kpi-highlights-section {
    margin-top: 5mm;
  }

  .kpi-highlights-label {
    font-size: 10pt;
    font-weight: 700;
    color: ${DK_GREEN};
    letter-spacing: 1px;
    margin-bottom: 3mm;
    padding-bottom: 2mm;
    border-bottom: 1.5px solid ${SAGE};
    display: inline-block;
  }

  .kpi-highlight {
    display: flex;
    align-items: stretch;
    border-radius: 2mm;
    margin-bottom: 2mm;
    overflow: hidden;
    background: linear-gradient(90deg, #f5f9f6 0%, #ffffff 30%);
    border: 1px solid rgba(159,188,164,0.25);
    break-inside: avoid;
  }

  .kpi-highlight-bar {
    width: 2mm;
    background: linear-gradient(180deg, ${DK_GREEN}, ${SAGE});
    flex-shrink: 0;
  }

  .kpi-highlight-content {
    padding: 3mm 4mm;
    display: flex;
    align-items: center;
    gap: 4mm;
  }

  .kpi-highlight-metric {
    font-size: 9.5pt;
    font-weight: 700;
    color: ${NAVY};
    min-width: 40mm;
  }

  .kpi-highlight-insight {
    font-size: 9.5pt;
    color: ${DK_TEXT};
    line-height: 1.4;
  }

  /* ── KPI Metrics Dashboard ────────────────── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4mm;
    margin-top: 3mm;
  }

  .kpi-card {
    background: #ffffff;
    border: 1px solid rgba(159,188,164,0.3);
    border-radius: 2.5mm;
    overflow: hidden;
    text-align: center;
    break-inside: avoid;
    position: relative;
  }

  .kpi-card-accent {
    height: 1.8mm;
  }

  .kpi-card-body {
    padding: 4mm 4mm 5mm;
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
    font-size: 22pt;
    font-weight: 700;
    color: ${DK_GREEN};
    letter-spacing: -0.5px;
    margin-bottom: 1mm;
  }

  .kpi-card-label {
    font-size: 8.5pt;
    color: ${GRAY};
    font-weight: 500;
    letter-spacing: 0.2px;
  }

  .kpi-card-desc {
    font-size: 7pt;
    color: #aaa;
    margin-top: 1mm;
    line-height: 1.3;
  }

  /* ═══════════════════════════════════════════
     FINANCIAL TABLES
     ═══════════════════════════════════════════ */
  .fin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: ${isLandscape ? "8.5pt" : "8pt"};
    border: 1px solid rgba(159,188,164,0.4);
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
    background: linear-gradient(90deg, ${NAVY} 0%, #243040 100%);
  }

  .fin-table th {
    color: #ffffff;
    font-weight: 600;
    padding: 2.5mm 2.5mm;
    text-align: center;
    font-size: ${isLandscape ? "8.5pt" : "8pt"};
    border: none;
    letter-spacing: 0.3px;
  }

  .fin-table th.tbl-label-hdr {
    text-align: left;
    min-width: ${isLandscape ? "48mm" : "38mm"};
  }

  .fin-table td {
    padding: 1.8mm 2.5mm;
    border-bottom: 1px solid #e2e5e8;
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
    font-size: ${isLandscape ? "8pt" : "7.5pt"};
    color: #444;
  }

  .fin-table .tbl-row-header td {
    font-weight: 700;
    background: linear-gradient(90deg, ${SEC_BG} 0%, #f2f6f3 100%);
    border-top: 1.5px solid ${SAGE};
    color: ${NAVY};
    font-size: ${isLandscape ? "9pt" : "8.5pt"};
    letter-spacing: 0.2px;
  }

  .fin-table .tbl-row-total td {
    font-weight: 700;
    border-top: 1.5px solid #c8cdd2;
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
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4mm;
    margin-top: 4mm;
  }

  .chart-card {
    background: #ffffff;
    border: 1px solid rgba(159,188,164,0.3);
    border-radius: 2.5mm;
    padding: 4mm 4mm 3mm;
    break-inside: avoid;
    overflow: hidden;
  }

  .chart-card-title {
    font-size: 9.5pt;
    font-weight: 700;
    color: ${NAVY};
    margin-bottom: 2mm;
    padding-bottom: 1.5mm;
    border-bottom: 1px solid #eef0f2;
    letter-spacing: 0.2px;
  }

  .chart-svg {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
</head>
<body>
${sectionHtmlParts.join("\n")}
</body>
</html>`;
}
