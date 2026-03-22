import { type Express, type Request, type Response } from "express";
import { getGeminiClient } from "../ai/clients";
import { requireAuth } from "../auth";
import { z } from "zod";
import { AI_GENERATION_TIMEOUT_MS } from "../constants";
import { logger } from "../logger";
import { BRAND, buildFinancialDataContext, getExcelPrompt, getPptxPrompt, getPdfPrompt, getDocxPrompt } from "./premium-export-prompts";
import { buildPdfHtml, resolveThemeColors } from "./pdf-html-templates";
import { renderPdf } from "../pdf/browser-renderer";
import { logApiCost, estimateCost } from "../middleware/cost-logger";
import { storage } from "../storage";
import { resolveLlm, getVendorService } from "../ai/resolve-llm";
import type { ResearchConfig } from "@shared/schema";
import { aggressiveParse } from "./export-json-utils";
import { generateExcelBuffer, generateExcelFromData, filterFormulaRows } from "./format-generators/excel-generator";
import { generatePptxBuffer } from "./format-generators/pptx-generator";
import { generateDocxBuffer } from "./format-generators/docx-generator";
import { generatePngZipBuffer } from "./format-generators/png-generator";

const exportRowSchema = z.object({
  category: z.string(),
  values: z.array(z.union([z.string(), z.number()])),
  indent: z.number().optional(),
  isBold: z.boolean().optional(),
  isHeader: z.boolean().optional(),
  isItalic: z.boolean().optional(),
  format: z.enum(["currency", "percentage", "number", "ratio", "multiplier"]).optional(),
});

const premiumExportSchema = z.object({
  format: z.enum(["xlsx", "pptx", "pdf", "docx", "png"]),
  orientation: z.enum(["landscape", "portrait"]).optional().default("landscape"),
  version: z.enum(["short", "extended"]).optional().default("short"),
  entityName: z.string(),
  companyName: z.string().optional().default("Hospitality Business Group"),
  statementType: z.string().optional(),
  years: z.array(z.string()).optional(),
  rows: z.array(exportRowSchema).optional(),
  statements: z.array(z.object({
    title: z.string(),
    years: z.array(z.string()),
    rows: z.array(exportRowSchema),
  })).optional(),
  metrics: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  projectionYears: z.number().optional(),
  includeCoverPage: z.boolean().optional().default(false),
  themeColors: z.array(z.object({
    name: z.string(),
    hexCode: z.string(),
    rank: z.number().optional(),
    description: z.string().optional(),
  })).optional(),
  memoSections: z.object({
    executiveSummary: z.string().optional(),
    investmentThesis: z.string().optional(),
    marketOverview: z.string().optional(),
    financialHighlights: z.string().optional(),
    riskFactors: z.string().optional(),
    conclusion: z.string().optional(),
  }).optional(),
});

type PremiumExportRequest = z.infer<typeof premiumExportSchema>;

function validateAIOutput(result: any, format: string): void {
  if (!result || typeof result !== "object") {
    throw new Error("AI returned invalid output structure");
  }
  switch (format) {
    case "xlsx":
      if (!Array.isArray(result.sheets) || result.sheets.length === 0) {
        throw new Error("AI output missing required 'sheets' array for Excel export");
      }
      break;
    case "pptx":
      if (!Array.isArray(result.slides) || result.slides.length === 0) {
        throw new Error("AI output missing required 'slides' array for PowerPoint export");
      }
      break;
    case "pdf":
      if (!Array.isArray(result.pages) || result.pages.length === 0) {
        throw new Error("AI output missing required 'pages' array for PDF export");
      }
      break;
    case "docx":
      if (!Array.isArray(result.sections) || result.sections.length === 0) {
        throw new Error("AI output missing required 'sections' array for Word export");
      }
      break;
  }
}

async function callGemini(
  client: any, prompt: string, format: string, startTime: number, modelId: string
): Promise<{ text: string; finishReason: string | undefined }> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("AI generation timed out after 120 seconds")), AI_GENERATION_TIMEOUT_MS)
  );
  const generatePromise = client.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
    },
  });
  const response = await Promise.race([generatePromise, timeoutPromise]);
  const text = response.text;
  if (!text) throw new Error("No text response from Gemini");
  const finishReason = response.candidates?.[0]?.finishReason;
  const inTok = response.usageMetadata?.promptTokenCount ?? Math.round(prompt.length / 4);
  const outTok = response.usageMetadata?.candidatesTokenCount ?? Math.round(text.length / 4);
  try { logApiCost({ timestamp: new Date().toISOString(), service: "gemini", model: modelId, operation: `premium-export-${format}`, inputTokens: inTok, outputTokens: outTok, estimatedCostUsd: estimateCost("gemini", modelId, inTok, outTok), durationMs: Date.now() - startTime, route: "/api/exports/premium" }); } catch (e) { console.warn("[WARN] [cost-logger] Failed to log API cost", (e as Error).message); }
  return { text, finishReason };
}

async function generateWithGemini(prompt: string, format: string, modelId?: string): Promise<any> {
  const client = getGeminiClient();
  const startTime = Date.now();
  const resolvedModel = modelId || "gemini-2.5-flash";

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { text, finishReason } = await callGemini(client, prompt, format, startTime, resolvedModel);
      logger.info(`[attempt ${attempt}] ${resolvedModel} returned ${text.length} chars, finishReason=${finishReason}`, "premium-export");

      const parsed = aggressiveParse(text);
      if (attempt > 1) logger.warn(`Premium export: succeeded on retry attempt ${attempt}`);
      validateAIOutput(parsed, format);
      return parsed;
    } catch (err: any) {
      lastError = err;
      logger.warn(`[attempt ${attempt}] Parse failed: ${err.message} — ${attempt < 2 ? "retrying..." : "giving up"}`, "premium-export");
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  throw lastError ?? new Error("AI returned invalid JSON — could not parse response");
}

function buildChartSeriesByStatement(tc?: import("./pdf-html-templates").ThemeColorMap): Record<string, Array<{ keyword: string; label: string; color: string }>> {
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

function buildChartsForStatement(stmt: { title: string; years: string[]; rows: any[] }, tc?: import("./pdf-html-templates").ThemeColorMap): any | null {
  const years = stmt.years || [];
  const stmtType = detectStatementType(stmt.title);
  const chartSeries = buildChartSeriesByStatement(tc);
  const seriesDefs = chartSeries[stmtType] || chartSeries.income;

  const series: any[] = [];
  for (const def of seriesDefs) {
    for (const row of stmt.rows) {
      const cat = (row.category || "").toLowerCase();
      if (cat.includes(def.keyword)) {
        const vals = (row.values || []).map((v: any) => typeof v === "number" ? v : 0);
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

function buildPdfSectionsFromData(data: PremiumExportRequest): any[] {
  const sections: any[] = [];
  const includeCover = !!(data as any).includeCoverPage;
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
        const investmentMetrics: any[] = [];
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

function getMetricDescription(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("irr")) return "Overall investment performance";
  if (l.includes("equity multiple")) return "Return on initial equity";
  if (l.includes("cash-on-cash")) return "Annual cash income yield";
  if (l.includes("total properties") || l.includes("properties")) return "Number of properties managed";
  if (l.includes("total rooms") || l.includes("rooms")) return "Total hotel rooms count";
  return "";
}

async function generatePdfWithAiDesign(data: PremiumExportRequest, modelId?: string): Promise<Buffer> {
  const { getPdfDesignPrompt } = await import("./premium-export-prompts");

  const company = data.companyName || "Hospitality Business Group";
  const isLandscape = (data.orientation || "landscape") === "landscape";
  const colors = resolveThemeColors(data.themeColors);

  logger.info(`[pdf-design] Asking LLM to design PDF layout...`, "premium-export");
  const designPrompt = getPdfDesignPrompt(data, data.themeColors);
  const designJson = await generateWithGemini(designPrompt, "pdf", modelId);
  logger.info(`[pdf-design] LLM returned design vision: ${designJson.design_vision || ""}`, "premium-export");

  const sections: any[] = [];
  const includeCover = !!data.includeCoverPage;

  if (includeCover && designJson.cover) {
    sections.push({
      type: "cover",
      title: designJson.cover.headline || `${company} — Financial Report`,
      subtitle: designJson.cover.tagline || "",
    });
  }

  for (const page of (designJson.pages || [])) {
    if (page.type === "metrics_dashboard") {
      sections.push({
        type: "metrics_dashboard",
        title: page.title || "Key Performance Metrics",
        content: {
          metrics: (page.metrics || []).map((m: any) => ({
            label: m.label,
            value: m.value,
            description: m.visual_weight === "hero" ? "Primary metric" : "",
          })),
        },
        insight: page.insight_callout,
      });
    } else if (page.type === "financial_table") {
      const stmt = (data.statements || []).find(s =>
        s.title.toLowerCase().includes((page.statement_title || "").toLowerCase()) ||
        (page.statement_title || "").toLowerCase().includes(s.title.toLowerCase())
      );
      if (stmt) {
        const filteredRows = filterFormulaRows(stmt.rows).map(r => ({
          category: r.category,
          values: r.values,
          type: r.isHeader ? "header" : r.isBold ? "total" : "data",
          indent: r.indent || 0,
          format: r.format,
          highlight: (page.highlight_categories || []).some((h: string) =>
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
        s.title.toLowerCase().includes((page.for_statement || "").toLowerCase())
      );
      if (stmt) {
        const chartSection = buildChartsForStatement(stmt, colors);
        if (chartSection) {
          chartSection.title = page.title || chartSection.title;
          if (page.series?.length && chartSection.content?.series) {
            for (const designSeries of page.series) {
              const match = chartSection.content.series.find((s: any) =>
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

  const reportTitle = designJson.cover?.headline || `${company} — Financial Report`;

  const html = buildPdfHtml({ sections, report_title: reportTitle }, {
    orientation: data.orientation || "landscape",
    companyName: company,
    entityName: data.entityName,
    sections,
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

async function generatePdfBuffer(_aiResult: any, data: PremiumExportRequest): Promise<Buffer> {
  const company = data.companyName || "Hospitality Business Group";
  const isLandscape = (data.orientation || "landscape") === "landscape";

  const sections = buildPdfSectionsFromData(data);
  const reportTitle = data.statementType
    ? `${company} — ${data.statementType}`
    : `${company} — Financial Report`;

  const colors = resolveThemeColors(data.themeColors);

  const html = buildPdfHtml({ sections, report_title: reportTitle }, {
    orientation: data.orientation || "landscape",
    companyName: company,
    entityName: data.entityName,
    sections,
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

const CONTENT_TYPES: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "application/zip",
};

const FORMAT_EXTENSIONS: Record<string, string> = {
  xlsx: ".xlsx",
  pptx: ".pptx",
  pdf: ".pdf",
  docx: ".docx",
  png: ".zip",
};

const DEFAULT_REPORT_TYPE: Record<string, string> = {
  xlsx: "Financial Report",
  pptx: "Presentation",
  pdf: "Financial Report",
  docx: "Investor Memo",
};

async function generateViaTemplatePipeline(
  data: PremiumExportRequest,
  modelId?: string
): Promise<Buffer> {
  if (data.format === "pdf") {
    try {
      logger.info(`[pdf-design] Using AI designer cascade (${modelId || "gemini-2.5-flash"})...`, "premium-export");
      return await generatePdfWithAiDesign(data, modelId);
    } catch (err: any) {
      logger.warn(`[pdf-design] AI design failed: ${err.message} — falling back to template`, "premium-export");
      return generatePdfBuffer(null, data);
    }
  }

  if (data.format === "xlsx") {
    logger.info(`[template] Building Excel directly from data (no AI call)...`, "premium-export");
    return generateExcelFromData(data);
  }

  if (data.format === "png") {
    logger.info(`[template] Building PNG ZIP from data (no AI call)...`, "premium-export");
    return generatePngZipBuffer(data, buildPdfSectionsFromData);
  }

  logger.info(`[template] Building ${data.format} prompt...`, "premium-export");
  let prompt: string;
  switch (data.format) {
    case "pptx": prompt = getPptxPrompt(data, data.themeColors); break;
    case "docx": prompt = getDocxPrompt(data, data.themeColors); break;
    default: throw new Error(`Unsupported format: ${data.format}`);
  }

  logger.info(`[template] Calling AI (${modelId || "default"}) for JSON structure...`, "premium-export");
  const aiResult = await generateWithGemini(prompt, data.format, modelId);
  logger.info(`[template] AI returned valid JSON, generating ${data.format} buffer...`, "premium-export");

  switch (data.format) {
    case "pptx": {
      const tc = resolveThemeColors(data.themeColors);
      return generatePptxBuffer(aiResult, data, tc);
    }
    case "docx": return generateDocxBuffer(aiResult, data);
    default: throw new Error(`Unsupported format: ${data.format}`);
  }
}

export function register(app: Express) {
  app.post("/api/exports/premium", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = premiumExportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid export request", details: parsed.error.flatten() });
      }

      const data = parsed.data;

      if (!data.themeColors?.length) {
        const defaultTheme = await storage.getDefaultDesignTheme();
        if (defaultTheme?.colors && Array.isArray(defaultTheme.colors)) {
          data.themeColors = (defaultTheme.colors as Array<{ name: string; hexCode: string; rank?: number; description?: string }>);
        }
      }

      const contentType = CONTENT_TYPES[data.format];
      if (!contentType) {
        return res.status(400).json({ error: `Unsupported format: ${data.format}` });
      }

      const safeCompany = (data.companyName || data.entityName).replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 40).trim();
      const reportType = (data.statementType || DEFAULT_REPORT_TYPE[data.format] || "Report").replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 40).trim();
      const ext = FORMAT_EXTENSIONS[data.format] || `.${data.format}`;
      const filename = `${safeCompany} - ${reportType}${ext}`;

      const ga = await storage.getGlobalAssumptions(req.user?.id);
      const rc = (ga?.researchConfig as ResearchConfig) ?? {};
      const resolved = resolveLlm(rc, "premiumExportLlm");
      logger.info(`Generating premium ${data.format} via ${resolved.model} + template pipeline for "${data.entityName}"...`, "premium-export");
      const buffer = await generateViaTemplatePipeline(data, resolved.model);
      logger.info(`Premium ${data.format} generated (${buffer.length} bytes)`, "premium-export");

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error: any) {
      const errorMsg = error?.message || String(error) || "Unknown error";
      logger.error(`Error: ${errorMsg} ${error?.stack || ""}`, "premium-export");
      const format = typeof req.body?.format === "string" ? req.body.format : "unknown";
      if (errorMsg.includes("API key not configured")) {
        return res.status(503).json({ error: "AI service is not available for premium exports", format });
      }
      if (errorMsg.includes("timed out") || errorMsg.includes("aborted")) {
        return res.status(504).json({ error: `Export timed out — the AI service took too long generating ${format.toUpperCase()}. Please try again.`, format });
      }
      res.status(500).json({ error: errorMsg.length > 300 ? errorMsg.substring(0, 300) + "…" : errorMsg, format });
    }
  });

  app.get("/api/exports/premium/status", requireAuth, async (_req: Request, res: Response) => {
    const hasApiKey = !!(process.env.AI_INTEGRATIONS_GEMINI_API_KEY);
    res.json({ available: hasApiKey, formats: ["xlsx", "pptx", "pdf", "docx", "png"] });
  });
}
