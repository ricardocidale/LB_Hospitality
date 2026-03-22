import { BRAND } from "./premium-export-prompts";
import { logger } from "../logger";
import { type ThemeColorMap, resolveThemeColors } from "../pdf/theme-resolver";
import { buildPdfHtml } from "./pdf-html-templates";
import { renderPdf } from "../pdf/browser-renderer";
import { filterFormulaRows } from "./format-generators/excel-generator";

interface ExportRow {
  category: string;
  values: (string | number)[];
  indent?: number;
  isBold?: boolean;
  isHeader?: boolean;
  isItalic?: boolean;
  format?: string;
}

interface StatementBlock {
  title: string;
  years: string[];
  rows: ExportRow[];
}

interface MetricItem {
  label: string;
  value: string;
}

interface PdfExportData {
  format: string;
  orientation?: string;
  entityName: string;
  companyName?: string;
  statementType?: string;
  years?: string[];
  rows?: ExportRow[];
  statements?: StatementBlock[];
  metrics?: MetricItem[];
  includeCoverPage?: boolean;
  themeColors?: Array<{ name: string; hexCode: string; rank?: number; description?: string }>;
}

export function buildChartSeriesByStatement(tc?: ThemeColorMap): Record<string, Array<{ keyword: string; label: string; color: string }>> {
  const ln = tc?.line || [];
  const accent  = `#${ln[0] || tc?.darkGreen || BRAND.ACCENT_HEX}`;
  const series2 = `#${ln[1] || tc?.navy      || BRAND.PRIMARY_HEX}`;
  const series3 = `#${ln[2] || tc?.sage      || BRAND.SECONDARY_HEX}`;
  const series4 = `#${ln[3] || tc?.lightGray || BRAND.MUTED_HEX}`;
  return {
    income: [
      { keyword: "total revenue",            label: "Revenue", color: accent  },
      { keyword: "gross operating profit",   label: "GOP",     color: series2 },
      { keyword: "net operating income",     label: "NOI",     color: series3 },
      { keyword: "adjusted noi",             label: "ANOI",    color: series4 },
    ],
    cashflow: [
      { keyword: "free cash flow (fcf)",     label: "Cash Flow", color: accent  },
      { keyword: "free cash flow to equity", label: "FCFE",      color: series2 },
    ],
    balance: [
      { keyword: "total assets",      label: "Total Assets",      color: accent  },
      { keyword: "total liabilities", label: "Total Liabilities",  color: series2 },
      { keyword: "total equity",      label: "Total Equity",       color: series3 },
    ],
    investment: [
      { keyword: "net operating income",     label: "NOI",          color: accent  },
      { keyword: "adjusted noi",             label: "ANOI",         color: series2 },
      { keyword: "debt service",             label: "Debt Service", color: series3 },
      { keyword: "free cash flow to equity", label: "FCFE",         color: series4 },
    ],
  };
}

function detectStatementType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("income")) return "income";
  if (t.includes("cash flow")) return "cashflow";
  if (t.includes("balance")) return "balance";
  if (t.includes("investment")) return "investment";
  return "income";
}

export function buildChartsForStatement(stmt: { title: string; years: string[]; rows: ExportRow[] }, tc?: ThemeColorMap): { type: string; title: string; content: { series: Array<{ label: string; values: number[]; color: string }>; years: string[] } } | null {
  const years = stmt.years || [];
  const stmtType = detectStatementType(stmt.title);
  const chartSeries = buildChartSeriesByStatement(tc);
  const seriesDefs = chartSeries[stmtType] || chartSeries.income;

  const series: Array<{ label: string; values: number[]; color: string }> = [];
  for (const def of seriesDefs) {
    for (const row of stmt.rows) {
      const cat = (row.category || "").toLowerCase();
      if (cat.includes(def.keyword)) {
        const vals = (row.values || []).map((v) => typeof v === "number" ? v : 0);
        if (vals.some((v: number) => v !== 0)) {
          series.push({ label: def.label, values: vals, color: def.color });
        }
        break;
      }
    }
  }

  if (series.length < 1) return null;

  return {
    type: "line_chart",
    title: `${stmt.title} — Trends`,
    content: { series, years },
  };
}

export function getMetricDescription(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("irr")) return "Overall investment performance";
  if (l.includes("equity multiple")) return "Return on initial equity";
  if (l.includes("cash-on-cash")) return "Annual cash income yield";
  if (l.includes("total properties") || l.includes("properties")) return "Number of properties managed";
  if (l.includes("total rooms") || l.includes("rooms")) return "Total hotel rooms count";
  return "";
}

export function buildPdfSectionsFromData(data: PdfExportData): Array<Record<string, unknown>> {
  const sections: Array<Record<string, unknown>> = [];
  const includeCover = !!data.includeCoverPage;
  const tc = resolveThemeColors(data.themeColors);

  if (includeCover) {
    sections.push({ type: "cover", title: data.statementType || "Financial Report" });
  }

  if (data.metrics?.length) {
    sections.push({
      type: "metrics_dashboard",
      title: "Key Performance Metrics",
      content: {
        metrics: data.metrics.map(m => ({
          label: m.label,
          value: m.value,
          description: getMetricDescription(m.label),
        })),
      },
    });
  }

  const statements = data.statements || [];
  if (statements.length) {
    for (const stmt of statements) {
      const isInvestment = (stmt.title || "").toLowerCase().includes("investment");

      if (isInvestment) {
        const investmentMetrics: Array<{ label: string; value: string; description: string }> = [];
        const summaryRows = stmt.rows.filter(r => {
          const cat = (r.category || "").toLowerCase();
          return cat.includes("total initial equity") || cat.includes("total exit value")
            || cat.includes("portfolio irr") || cat.includes("equity multiple")
            || cat.includes("cash-on-cash");
        });
        for (const r of summaryRows) {
          const val = typeof r.values?.[0] === "number" ? r.values[0] : 0;
          const cat = (r.category || "");
          let displayVal = "";
          if (cat.includes("IRR") || cat.includes("Cash-on-Cash")) {
            displayVal = `${(Math.abs(val) <= 2 ? val * 100 : val).toFixed(1)}%`;
          } else if (cat.includes("Equity Multiple")) {
            displayVal = `${val.toFixed(2)}x`;
          } else {
            const abs = Math.abs(val);
            displayVal = abs >= 1e6 ? `$${(abs / 1e6).toFixed(1)}M` : abs >= 1e3 ? `$${Math.round(abs / 1e3)}K` : `$${abs.toFixed(0)}`;
          }
          investmentMetrics.push({ label: cat.trim(), value: displayVal, description: getMetricDescription(cat) });
        }
        if (investmentMetrics.length) {
          sections.push({
            type: "metrics_dashboard",
            title: "Investment Summary",
            content: { metrics: investmentMetrics },
          });
        }
      }

      const filteredRows = filterFormulaRows(stmt.rows).map(r => ({
        category: r.category,
        values: r.values,
        type: r.isHeader ? "header" : r.isBold ? "total" : "data",
        indent: r.indent || 0,
        format: r.format,
      }));

      if (isInvestment && filteredRows.length > 0) {
        const majorSections = new Set([
          "Free Cash Flow to Investors",
          "Per-Property Returns",
          "Property-Level IRR Analysis",
          "Discounted Cash Flow (DCF) Analysis",
        ]);

        let pending: typeof filteredRows = [];
        let pendingTitle = "Investment Analysis";

        const flushSection = () => {
          if (!pending.length) return;
          sections.push({
            type: "financial_table",
            title: pendingTitle,
            content: { years: stmt.years, rows: pending },
          });
          pending = [];
        };

        for (const row of filteredRows) {
          if (row.type === "header" && !row.indent && majorSections.has(row.category.trim())) {
            flushSection();
            pendingTitle = row.category.trim();
            pending = [row];
          } else {
            pending.push(row);
          }
        }
        flushSection();
      } else {
        sections.push({
          type: "financial_table",
          title: stmt.title,
          content: { years: stmt.years, rows: filteredRows },
        });
      }

      const chartSection = buildChartsForStatement(stmt, tc);
      if (chartSection) sections.push(chartSection);
    }
  } else if (data.rows?.length && data.years?.length) {
    const filteredRows = filterFormulaRows(data.rows).map(r => ({
      category: r.category,
      values: r.values,
      type: r.isHeader ? "header" : r.isBold ? "total" : "data",
      indent: r.indent || 0,
      format: r.format,
    }));
    sections.push({
      type: "financial_table",
      title: data.statementType || "Financial Statement",
      content: { years: data.years, rows: filteredRows },
    });
  }

  return sections;
}

export async function generatePdfWithAiDesign(
  data: PdfExportData,
  generateWithGemini: (prompt: string, format: string, modelId?: string) => Promise<Record<string, unknown>>,
  modelId?: string
): Promise<Buffer> {
  const { getPdfDesignPrompt } = await import("./premium-export-prompts");

  const company = data.companyName || "Hospitality Business Group";
  const isLandscape = (data.orientation || "landscape") === "landscape";
  const colors = resolveThemeColors(data.themeColors);

  logger.info(`[pdf-design] Asking LLM to design PDF layout...`, "premium-export");
  const designPrompt = getPdfDesignPrompt(data, data.themeColors);
  const designJson = await generateWithGemini(designPrompt, "pdf", modelId) as Record<string, unknown>;
  const cover = designJson.cover as Record<string, string> | undefined;
  const pages = (designJson.pages || []) as Array<Record<string, unknown>>;
  logger.info(`[pdf-design] LLM returned design vision: ${designJson.design_vision || ""}`, "premium-export");

  const sections: Array<Record<string, unknown>> = [];
  const includeCover = !!data.includeCoverPage;

  if (includeCover && cover) {
    sections.push({
      type: "cover",
      title: cover.headline || `${company} — Financial Report`,
      subtitle: cover.tagline || "",
    });
  }

  for (const page of pages) {
    if (page.type === "metrics_dashboard") {
      const pageMetrics = (page.metrics || []) as Array<{ label: string; value: string; visual_weight?: string }>;
      sections.push({
        type: "metrics_dashboard",
        title: (page.title as string) || "Key Performance Metrics",
        content: {
          metrics: pageMetrics.map((m) => ({
            label: m.label,
            value: m.value,
            description: m.visual_weight === "hero" ? "Primary metric" : "",
          })),
        },
        insight: page.insight_callout,
      });
    } else if (page.type === "financial_table") {
      const stmt = (data.statements || []).find(s =>
        s.title.toLowerCase().includes(((page.statement_title as string) || "").toLowerCase()) ||
        ((page.statement_title as string) || "").toLowerCase().includes(s.title.toLowerCase())
      );
      if (stmt) {
        const highlightCategories = (page.highlight_categories || []) as string[];
        const filteredRows = filterFormulaRows(stmt.rows).map(r => ({
          category: r.category,
          values: r.values,
          type: r.isHeader ? "header" : r.isBold ? "total" : "data",
          indent: r.indent || 0,
          format: r.format,
          highlight: highlightCategories.some((h: string) =>
            (r.category || "").toLowerCase().includes(h.toLowerCase())
          ),
        }));
        sections.push({
          type: "financial_table",
          title: stmt.title,
          content: { years: stmt.years, rows: filteredRows },
          insight: page.insight_callout,
        });
      }
    } else if (page.type === "line_chart") {
      const stmt = (data.statements || []).find(s =>
        s.title.toLowerCase().includes(((page.for_statement as string) || "").toLowerCase())
      );
      if (stmt) {
        const chartSection = buildChartsForStatement(stmt, colors);
        if (chartSection) {
          chartSection.title = (page.title as string) || chartSection.title;
          const pageSeries = page.series as Array<{ label: string; color_intent?: string }> | undefined;
          if (pageSeries?.length && chartSection.content?.series) {
            for (const designSeries of pageSeries) {
              const match = chartSection.content.series.find((s) =>
                s.label.toLowerCase().includes(designSeries.label.toLowerCase())
              );
              if (match && designSeries.color_intent) {
              }
            }
          }
          sections.push(chartSection);
        }
      }
    }
  }

  if (sections.length < 2) {
    logger.warn(`[pdf-design] LLM returned insufficient sections (${sections.length}), adding template fallback`, "premium-export");
    const templateSections = buildPdfSectionsFromData(data);
    sections.push(...templateSections);
  }

  const reportTitle = cover?.headline || `${company} — Financial Report`;

  const html = buildPdfHtml({ sections: sections as Parameters<typeof buildPdfHtml>[0]["sections"] }, {
    orientation: data.orientation || "landscape",
    companyName: company,
    entityName: data.entityName,
    sections: sections as Parameters<typeof buildPdfHtml>[0]["sections"],
    reportTitle,
    colors,
  });

  const safeCompanyHtml = company.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const footerColor = `#${colors.lightGray}`;

  return renderPdf(html, {
    width: isLandscape ? "406.4mm" : "215.9mm",
    height: isLandscape ? "228.6mm" : "279.4mm",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `
      <div style="width:100%;font-size:7pt;font-family:Helvetica,Arial,sans-serif;color:${footerColor};padding:0 16mm;">
        <span style="float:left">${safeCompanyHtml}</span>
        <span style="float:right"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        <span style="display:block;text-align:center">CONFIDENTIAL</span>
      </div>`,
    margin: { top: "0mm", bottom: "10mm", left: "0mm", right: "0mm" },
  });
}

export async function generatePdfBuffer(data: PdfExportData): Promise<Buffer> {
  const company = data.companyName || "Hospitality Business Group";
  const isLandscape = (data.orientation || "landscape") === "landscape";

  const sections = buildPdfSectionsFromData(data);
  const reportTitle = data.statementType
    ? `${company} — ${data.statementType}`
    : `${company} — Financial Report`;

  const colors = resolveThemeColors(data.themeColors);

  const html = buildPdfHtml({ sections: sections as Parameters<typeof buildPdfHtml>[0]["sections"] }, {
    orientation: data.orientation || "landscape",
    companyName: company,
    entityName: data.entityName,
    sections: sections as Parameters<typeof buildPdfHtml>[0]["sections"],
    reportTitle,
    colors,
  });

  const safeCompanyHtml = company.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const footerColor = `#${colors.lightGray}`;

  return renderPdf(html, {
    width: isLandscape ? "406.4mm" : "215.9mm",
    height: isLandscape ? "228.6mm" : "279.4mm",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `
      <div style="width:100%;font-size:7pt;font-family:Helvetica,Arial,sans-serif;color:${footerColor};padding:0 16mm;">
        <span style="float:left">${safeCompanyHtml}</span>
        <span style="float:right"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        <span style="display:block;text-align:center">CONFIDENTIAL</span>
      </div>`,
    margin: { top: "0mm", bottom: "10mm", left: "0mm", right: "0mm" },
  });
}
