import { BRAND } from "./premium-export-prompts";

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
    return v < 0 ? `($${s})` : `$${s}`;
  }
  return escapeHtml(String(v ?? ""));
}

function renderCoverSection(section: any, data: PdfTemplateData): string {
  const company = escapeHtml(data.companyName);
  const entity = escapeHtml(data.entityName);
  const reportTitle = escapeHtml(data.reportTitle || section.title || "Financial Report");
  const subtitle = section.subtitle ? escapeHtml(section.subtitle) : "";
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return `
    <div class="cover-page">
      <div class="cover-grid"></div>
      <div class="cover-accent-bar"></div>
      <div class="cover-company">${company}</div>
      <div class="cover-divider"></div>
      <div class="cover-title">${reportTitle}</div>
      ${subtitle ? `<div class="cover-subtitle">${subtitle}</div>` : ""}
      <div class="cover-info-box">
        <div class="cover-info-row">
          <div class="cover-info-cell">
            <div class="cover-info-label">PREPARED</div>
            <div class="cover-info-value">For ${entity}</div>
          </div>
          <div class="cover-info-cell">
            <div class="cover-info-label">CLASSIFICATION</div>
            <div class="cover-info-value">CONFIDENTIAL</div>
          </div>
        </div>
        <div class="cover-info-row">
          <div class="cover-info-cell">
            <div class="cover-info-label">DATE</div>
            <div class="cover-info-value">${dateStr}</div>
          </div>
        </div>
      </div>
      <div class="cover-disclaimer">
        This document contains proprietary financial projections. Distribution is restricted to authorized recipients.
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
      return `<p>${text}</p>`;
    }).join("");
    paragraphsHtml = `<div class="content-card">${items}</div>`;
  }

  let highlightsHtml = "";
  if (highlights.length > 0) {
    const items = highlights.map((h: any) => `
      <div class="highlight-row">
        <span class="highlight-dot"></span>
        <span class="highlight-metric">${escapeHtml(h.metric)}</span>
        <span class="highlight-insight">${escapeHtml(h.insight || "")}</span>
      </div>
    `).join("");
    highlightsHtml = `
      <div class="highlights-section">
        <div class="highlights-title">KEY HIGHLIGHTS</div>
        ${items}
      </div>`;
  }

  return `
    <div class="content-page">
      <div class="section-header">
        <div class="section-title">${title}</div>
        <div class="section-subtitle">${company} \u2014 ${entity}</div>
        <div class="section-company">${company}</div>
      </div>
      ${paragraphsHtml}
      ${highlightsHtml}
    </div>`;
}

function renderMetricsDashboardSection(section: any, data: PdfTemplateData): string {
  const title = escapeHtml(section.title || "Key Performance Indicators");
  const company = escapeHtml(data.companyName);
  const metrics = section.content?.metrics || [];

  const cards = metrics.map((m: any) => {
    const trend = m.trend === "up" ? "trend-up" : m.trend === "down" ? "trend-down" : "";
    const arrow = m.trend === "up" ? "\u25B2" : m.trend === "down" ? "\u25BC" : "";
    return `
      <div class="metric-card">
        <div class="metric-accent"></div>
        ${arrow ? `<div class="metric-trend ${trend}">${arrow}</div>` : ""}
        <div class="metric-value">${escapeHtml(m.value || "")}</div>
        <div class="metric-label">${escapeHtml(m.label || "")}</div>
        ${m.description ? `<div class="metric-desc">${escapeHtml(m.description)}</div>` : ""}
      </div>`;
  }).join("");

  return `
    <div class="content-page">
      <div class="section-header">
        <div class="section-title">${title}</div>
        <div class="section-subtitle">${company} \u2014 Investment Overview</div>
        <div class="section-company">${company}</div>
      </div>
      <div class="metrics-grid">${cards}</div>
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
        <div class="section-header">
          <div class="section-title">${title}</div>
          <div class="section-subtitle">${company} \u2014 ${entity}</div>
          <div class="section-company">${company}</div>
        </div>
        <p class="no-data">No financial data available.</p>
      </div>`;
  }

  const yearHeaders = years.map((yr: any) => `<th class="year-col">FY ${escapeHtml(String(yr))}</th>`).join("");

  const tableRows = rows.map((r: any, idx: number) => {
    const isHeader = r.type === "header" || r.isHeader;
    const isTotal = r.type === "total" || r.type === "subtotal" || r.isBold;
    const isFormula = r.isItalic || r.type === "formula";
    const indent = r.indent || 0;

    let rowClass = "";
    if (isHeader) rowClass = "row-header";
    else if (isTotal) rowClass = "row-total";
    else if (isFormula) rowClass = "row-formula";
    else if (idx % 2 === 0) rowClass = "row-alt";

    const indentPx = indent * 16;
    const label = escapeHtml(r.category || "");
    const vals = (r.values || []).map((v: any) => `<td class="val-col">${formatCurrency(v)}</td>`).join("");

    return `<tr class="${rowClass}"><td class="label-col" style="padding-left:${8 + indentPx}px">${label}</td>${vals}</tr>`;
  }).join("");

  return `
    <div class="content-page">
      <div class="section-header">
        <div class="section-title">${title}</div>
        <div class="section-subtitle">${company} \u2014 ${entity}</div>
        <div class="section-company">${company}</div>
      </div>
      <table class="financial-table">
        <thead><tr><th class="label-col"></th>${yearHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;
}

export function buildPdfHtml(aiResult: any, data: PdfTemplateData): string {
  const sections = aiResult.sections || [];
  const isLandscape = data.orientation === "landscape";
  const pageW = isLandscape ? "297mm" : "210mm";
  const pageH = isLandscape ? "210mm" : "297mm";

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
    }
  }

  const NAVY = `#${BRAND.NAVY_HEX}`;
  const SAGE = `#${BRAND.SAGE_HEX}`;
  const DK_GREEN = `#${BRAND.DARK_GREEN_HEX}`;
  const DK_TEXT = `#${BRAND.DARK_TEXT_HEX}`;
  const GRAY = `#${BRAND.GRAY_HEX}`;
  const SEC_BG = `#${BRAND.SECTION_BG_HEX}`;
  const ALT_ROW = `#${BRAND.ALT_ROW_HEX}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
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
  }

  /* ── Cover Page ──────────────────────────── */
  .cover-page {
    width: ${pageW};
    height: ${pageH};
    background: ${NAVY};
    position: relative;
    overflow: hidden;
    page-break-after: always;
    padding: 0;
  }

  .cover-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(${SAGE}15 1px, transparent 1px),
      linear-gradient(90deg, ${SAGE}15 1px, transparent 1px);
    background-size: 12mm 12mm;
  }

  .cover-page::before,
  .cover-page::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 3mm;
    background: ${SAGE};
  }
  .cover-page::before { top: 0; }
  .cover-page::after { bottom: 0; }

  .cover-accent-bar {
    position: absolute;
    left: 16mm;
    top: 28%;
    width: 4mm;
    height: 40mm;
    background: ${SAGE};
    border-radius: 1mm;
  }

  .cover-company {
    position: absolute;
    left: 28mm;
    top: 28%;
    font-size: 32pt;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.5px;
  }

  .cover-divider {
    position: absolute;
    left: 28mm;
    top: 35%;
    width: 60mm;
    height: 0.5mm;
    background: #fff;
  }

  .cover-title {
    position: absolute;
    left: 28mm;
    top: 42%;
    font-size: 18pt;
    color: ${SAGE};
    font-weight: 400;
  }

  .cover-subtitle {
    position: absolute;
    left: 28mm;
    top: 48%;
    font-size: 12pt;
    color: #b4c8b9;
  }

  .cover-info-box {
    position: absolute;
    left: 28mm;
    top: 58%;
    width: 100mm;
    background: rgba(255,255,255,0.06);
    border: 1px solid ${SAGE}40;
    border-radius: 3mm;
    padding: 5mm 6mm;
  }

  .cover-info-row {
    display: flex;
    gap: 20mm;
    margin-bottom: 3mm;
  }
  .cover-info-row:last-child { margin-bottom: 0; }

  .cover-info-label {
    font-size: 7pt;
    font-weight: 700;
    color: ${SAGE};
    letter-spacing: 1px;
    margin-bottom: 1mm;
  }

  .cover-info-value {
    font-size: 9pt;
    color: #ddd;
  }

  .cover-disclaimer {
    position: absolute;
    left: 28mm;
    bottom: 18%;
    font-size: 7pt;
    color: #788c8a;
    font-style: italic;
    max-width: 70%;
  }

  /* ── Content Pages ───────────────────────── */
  .content-page {
    width: ${pageW};
    min-height: ${pageH};
    padding: 8mm 16mm 20mm;
    position: relative;
    page-break-after: always;
    border-top: 1.5mm solid ${NAVY};
  }

  .content-page::before {
    content: '';
    position: absolute;
    top: 1.5mm;
    left: 0;
    right: 0;
    height: 0.8mm;
    background: ${SAGE};
  }

  .content-page::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1.5mm;
    background: ${NAVY};
  }

  /* ── Section Header ──────────────────────── */
  .section-header {
    background: ${NAVY};
    border-radius: 2mm;
    padding: 6mm 8mm 5mm;
    margin-bottom: 6mm;
    position: relative;
  }

  .section-header::after {
    content: '';
    position: absolute;
    bottom: -1.2mm;
    left: 0;
    right: 0;
    height: 1.2mm;
    background: ${SAGE};
    border-radius: 0 0 1mm 1mm;
  }

  .section-title {
    font-size: 16pt;
    font-weight: 700;
    color: #fff;
  }

  .section-subtitle {
    font-size: 8pt;
    color: ${SAGE};
    margin-top: 2mm;
  }

  .section-company {
    position: absolute;
    right: 8mm;
    top: 50%;
    transform: translateY(-50%);
    font-size: 7pt;
    color: #c8c8c8;
  }

  /* ── Content Cards ───────────────────────── */
  .content-card {
    background: #fff9f5;
    border: 1px solid ${SAGE};
    border-left: 3mm solid ${DK_GREEN};
    border-radius: 2mm;
    padding: 5mm 6mm;
    margin-bottom: 5mm;
  }

  .content-card p {
    font-size: 9pt;
    line-height: 1.6;
    margin-bottom: 3mm;
    color: ${DK_TEXT};
  }
  .content-card p:last-child { margin-bottom: 0; }

  /* ── Highlights ──────────────────────────── */
  .highlights-section {
    margin-top: 5mm;
  }

  .highlights-title {
    font-size: 10pt;
    font-weight: 700;
    color: ${DK_GREEN};
    margin-bottom: 3mm;
    padding-bottom: 2mm;
    border-bottom: 2px solid ${SAGE};
    display: inline-block;
  }

  .highlight-row {
    display: flex;
    align-items: center;
    gap: 3mm;
    padding: 3mm 4mm;
    background: #f5f9f6;
    border-radius: 1.5mm;
    margin-bottom: 2mm;
  }

  .highlight-dot {
    width: 2mm;
    height: 2mm;
    border-radius: 50%;
    background: ${DK_GREEN};
    flex-shrink: 0;
  }

  .highlight-metric {
    font-size: 8pt;
    font-weight: 700;
    color: ${NAVY};
    min-width: 40mm;
  }

  .highlight-insight {
    font-size: 8pt;
    color: ${DK_TEXT};
  }

  /* ── Metrics Dashboard ───────────────────── */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5mm;
    margin-top: 2mm;
  }

  .metric-card {
    background: #fff;
    border: 1px solid ${SAGE};
    border-radius: 3mm;
    padding: 5mm;
    text-align: center;
    position: relative;
    overflow: hidden;
    break-inside: avoid;
  }

  .metric-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1.5mm;
    background: ${DK_GREEN};
  }

  .metric-trend {
    position: absolute;
    top: 3mm;
    right: 3mm;
    font-size: 8pt;
    font-weight: 700;
  }
  .trend-up { color: ${DK_GREEN}; }
  .trend-down { color: #cc3333; }

  .metric-value {
    font-size: 20pt;
    font-weight: 700;
    color: ${DK_GREEN};
    margin-top: 3mm;
  }

  .metric-label {
    font-size: 7.5pt;
    color: ${GRAY};
    margin-top: 2mm;
  }

  .metric-desc {
    font-size: 6.5pt;
    color: #999;
    margin-top: 1mm;
  }

  /* ── Financial Tables ────────────────────── */
  .financial-table {
    width: 100%;
    border-collapse: collapse;
    font-size: ${isLandscape ? "7.5pt" : "7pt"};
    border: 1px solid ${SAGE};
    border-radius: 2mm;
    overflow: hidden;
  }

  .financial-table thead tr {
    background: ${NAVY};
  }

  .financial-table th {
    color: #fff;
    font-weight: 700;
    padding: 2.5mm 3mm;
    text-align: center;
    font-size: ${isLandscape ? "8pt" : "7pt"};
    border: none;
  }

  .financial-table th.label-col {
    text-align: left;
    min-width: ${isLandscape ? "50mm" : "40mm"};
  }

  .financial-table td {
    padding: 2mm 3mm;
    border-bottom: 1px solid #d2d7dc;
  }

  .financial-table .label-col {
    text-align: left;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .financial-table .val-col {
    text-align: right;
    font-family: 'Courier New', Courier, monospace;
    white-space: nowrap;
  }

  .financial-table .row-header td {
    font-weight: 700;
    background: ${SEC_BG};
    border-top: 2px solid ${SAGE};
  }

  .financial-table .row-total td {
    font-weight: 700;
    border-top: 2px solid #b4b9be;
  }

  .financial-table .row-formula td {
    font-style: italic;
    color: ${GRAY};
    font-size: 0.9em;
  }

  .financial-table .row-alt td {
    background: ${ALT_ROW};
  }

  .no-data {
    font-size: 10pt;
    color: ${GRAY};
    text-align: center;
    padding: 20mm;
  }
</style>
</head>
<body>
${sectionHtmlParts.join("\n")}
</body>
</html>`;
}
