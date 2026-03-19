import { type Express, type Request, type Response } from "express";
import { getGeminiClient } from "../ai/clients";
import { requireAuth } from "../auth";
import { z } from "zod";
import { AI_GENERATION_TIMEOUT_MS } from "../constants";
import { logger } from "../logger";
import { BRAND, buildFinancialDataContext, getExcelPrompt, getPptxPrompt, getPdfPrompt, getDocxPrompt } from "./premium-export-prompts";
import { buildPdfHtml } from "./pdf-html-templates";
import { renderPdf } from "../pdf/browser-renderer";
import { logApiCost, estimateCost } from "../middleware/cost-logger";
import { storage } from "../storage";
import { resolveLlm, getVendorService } from "../ai/resolve-llm";
import type { ResearchConfig } from "@shared/schema";

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
      if (!Array.isArray(result.sections) || result.sections.length === 0) {
        throw new Error("AI output missing required 'sections' array for PDF export");
      }
      break;
    case "docx":
      if (!Array.isArray(result.sections) || result.sections.length === 0) {
        throw new Error("AI output missing required 'sections' array for Word export");
      }
      break;
  }
}

function repairTruncatedJson(str: string): string {
  let s = str.trim();

  if (s.endsWith(",")) s = s.slice(0, -1);

  let inString = false;
  let escape = false;
  let lastValidPos = s.length;
  const stack: string[] = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}") { if (stack.length && stack[stack.length - 1] === "{") stack.pop(); }
    else if (ch === "]") { if (stack.length && stack[stack.length - 1] === "[") stack.pop(); }
    lastValidPos = i + 1;
  }

  if (inString) {
    const lastQuote = s.lastIndexOf('"');
    if (lastQuote > 0) {
      s = s.substring(0, lastQuote + 1);
    } else {
      s += '"';
    }
  }

  s = s.replace(/,\s*$/, "");
  s = s.replace(/,\s*([\]}])/g, "$1");
  s = s.replace(/"[^"]*":\s*$/m, "");
  s = s.replace(/,\s*$/, "");

  inString = false;
  escape = false;
  const stack2: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack2.push(ch);
    else if (ch === "}") { if (stack2.length && stack2[stack2.length - 1] === "{") stack2.pop(); }
    else if (ch === "]") { if (stack2.length && stack2[stack2.length - 1] === "[") stack2.pop(); }
  }

  while (stack2.length) {
    const open = stack2.pop();
    s += open === "{" ? "}" : "]";
  }

  return s;
}

function extractJsonFromText(text: string): string {
  let s = text.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const firstBrace = s.indexOf("{");
  const firstBracket = s.indexOf("[");
  if (firstBrace === -1 && firstBracket === -1) return s;
  const start = firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  return s.substring(start);
}

function aggressiveParse(raw: string): any {
  const jsonStr = extractJsonFromText(raw);

  try { return JSON.parse(jsonStr); } catch {}

  try { return JSON.parse(repairTruncatedJson(jsonStr)); } catch {}

  const lines = jsonStr.split("\n");
  for (let drop = 1; drop <= Math.min(20, lines.length - 1); drop++) {
    const trimmed = lines.slice(0, lines.length - drop).join("\n");
    try { return JSON.parse(repairTruncatedJson(trimmed)); } catch {}
  }

  throw new Error("Could not parse AI response as JSON after all repair strategies");
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
  try { logApiCost({ timestamp: new Date().toISOString(), service: "gemini", model: modelId, operation: `premium-export-${format}`, inputTokens: inTok, outputTokens: outTok, estimatedCostUsd: estimateCost("gemini", modelId, inTok, outTok), durationMs: Date.now() - startTime, route: "/api/exports/premium" }); } catch {}
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

async function generateExcelBuffer(aiResult: any, data: PremiumExportRequest): Promise<Buffer> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  if (aiResult.sheets) {
    for (const sheet of aiResult.sheets) {
      const wsData: any[][] = [];

      if (sheet.title) {
        wsData.push([sheet.title]);
        if (sheet.subtitle) wsData.push([sheet.subtitle]);
        wsData.push([]);
      }

      if (sheet.summary_metrics?.length) {
        sheet.summary_metrics.forEach((m: any) => {
          wsData.push([m.label, m.value]);
        });
        wsData.push([]);
      }

      if (sheet.years?.length) {
        wsData.push(["", ...sheet.years]);
      }

      if (sheet.rows?.length) {
        for (const row of sheet.rows) {
          const indent = row.indent ? "  ".repeat(row.indent) : "";
          const label = indent + (row.category || "");
          const values = (row.values || []).map((v: any) => {
            if (typeof v === "number") return v;
            if (typeof v === "string" && v === "—") return "";
            return v;
          });
          wsData.push([label, ...values]);

          if (row.formula_notes) {
            wsData.push(["  → " + row.formula_notes]);
          }
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      if (sheet.years?.length) {
        ws["!cols"] = [{ wch: 35 }, ...sheet.years.map(() => ({ wch: 16 }))];
      }

      const safeName = (sheet.name || "Sheet").substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeName);
    }
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}

async function generatePptxBuffer(aiResult: any, data: PremiumExportRequest): Promise<Buffer> {
  const pptxgen = (await import("pptxgenjs")).default;
  const { resolveThemeColors } = await import("./pdf-html-templates");
  const tc = resolveThemeColors(data.themeColors);

  const pres = new (pptxgen as any)();
  pres.layout = "LAYOUT_WIDE";
  pres.author = data.companyName;
  pres.title = aiResult.presentation_notes || `${data.entityName} — Premium Report`;

  const SLIDE_W = 13.33;
  const SLIDE_H = 7.5;

  for (const slideData of (aiResult.slides || [])) {
    const slide = pres.addSlide();

    if (slideData.type === "title") {
      slide.background = { color: tc.navy };
      slide.addShape("rect", { x: 0, y: 0, w: SLIDE_W, h: 0.05, fill: { color: tc.sage } });
      slide.addText(data.companyName || "", {
        x: 0.6, y: 1.5, w: 12, h: 0.6,
        fontSize: 28, fontFace: "Arial", color: tc.sage, bold: true,
      });
      slide.addText(slideData.title || "", {
        x: 0.6, y: 2.3, w: 12, h: 0.5,
        fontSize: 22, fontFace: "Arial", color: BRAND.WHITE_HEX,
      });
      slide.addText(slideData.subtitle || "", {
        x: 0.6, y: 2.9, w: 8, h: 0.4,
        fontSize: 14, fontFace: "Arial", color: "AAAAAA",
      });
      if (slideData.source_tag) {
        slide.addText(slideData.source_tag, {
          x: SLIDE_W - 5.6, y: 2.9, w: 5, h: 0.4,
          fontSize: 11, fontFace: "Arial", color: tc.sage, bold: true, align: "right",
        });
      }
    } else if (slideData.type === "metrics") {
      slide.addText(slideData.title || "", {
        x: 0.5, y: 0.2, w: 8, h: 0.4,
        fontSize: 20, fontFace: "Arial", color: tc.darkGreen, bold: true,
      });
      slide.addShape("rect", { x: 0.5, y: 0.65, w: 12, h: 0.02, fill: { color: tc.sage } });

      const metrics = slideData.content?.metrics || [];
      const cols = 3;
      const cardW = 3.8;
      const cardH = 1.1;
      metrics.forEach((m: any, i: number) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = 0.5 + col * (cardW + 0.35);
        const y = 0.9 + row * (cardH + 0.15);
        slide.addShape("rect", {
          x, y, w: cardW, h: cardH,
          fill: { color: tc.sectionBg },
          line: { color: tc.sage, width: 1 },
          rectRadius: 0.1,
        });
        const trendColor = m.trend === "up" ? tc.darkGreen :
          m.trend === "down" ? "CC3333" : tc.darkGreen;
        slide.addText(m.value || "", {
          x: x + 0.15, y: y + 0.15, w: cardW - 0.3, h: 0.5,
          fontSize: 18, fontFace: "Arial", color: trendColor, bold: true,
        });
        slide.addText(m.label || "", {
          x: x + 0.15, y: y + 0.6, w: cardW - 0.3, h: 0.35,
          fontSize: 9, fontFace: "Arial", color: tc.gray,
        });
      });
    } else if (slideData.type === "table") {
      slide.addText(slideData.title || "", {
        x: 0.3, y: 0.1, w: 8, h: 0.3,
        fontSize: 14, fontFace: "Arial", color: tc.darkGreen, bold: true,
      });
      if (slideData.source_tag) {
        slide.addText(slideData.source_tag, {
          x: SLIDE_W - 5.3, y: 0.1, w: 5, h: 0.3,
          fontSize: 9, fontFace: "Arial", color: tc.gray, bold: true, align: "right",
        });
      }

      const years = slideData.content?.years || [];
      const rows = slideData.content?.rows || [];
      const tableRows: any[][] = [];

      const headerRow = [
        { text: "", options: { fill: { color: tc.sage }, fontFace: "Arial", fontSize: 8, color: BRAND.WHITE_HEX, bold: true } },
        ...years.map((y: string) => ({
          text: y, options: { fill: { color: tc.sage }, fontFace: "Arial", fontSize: 8, color: BRAND.WHITE_HEX, bold: true, align: "right" as const },
        })),
      ];
      tableRows.push(headerRow);

      rows.forEach((row: any, ri: number) => {
        const isHeader = row.type === "header";
        const isTotal = row.type === "total" || row.type === "subtotal";
        const indent = row.indent ? "  ".repeat(row.indent) : "";
        const bg = isHeader ? tc.sectionBg : ri % 2 === 1 ? tc.altRow : BRAND.WHITE_HEX;

        const labelCell = {
          text: indent + (row.category || ""),
          options: {
            fontFace: "Arial", fontSize: 8,
            color: tc.darkText,
            bold: isHeader || isTotal,
            fill: { color: bg },
          },
        };
        const valCells = (row.values || []).map((v: any) => ({
          text: typeof v === "number" ? (Math.abs(v) >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : Math.abs(v) >= 1_000 ? `$${(v / 1_000).toFixed(0)}K` : v === 0 ? "—" : `$${v}`) : String(v),
          options: {
            fontFace: "Arial", fontSize: 8, color: tc.darkText,
            bold: isTotal, align: "right" as const, fill: { color: bg },
          },
        }));
        tableRows.push([labelCell, ...valCells]);
      });

      if (tableRows.length > 1) {
        const tableW = SLIDE_W - 0.6;
        const labelW = Math.max(2.4, Math.min(3.8, tableW - years.length * 0.9));
        const dataW = years.length > 0 ? (tableW - labelW) / years.length : 1;
        slide.addTable(tableRows, {
          x: 0.3, y: 0.45, w: tableW,
          colW: [labelW, ...years.map(() => dataW)],
          rowH: 0.22, autoPage: true,
        });
      }
    } else if (slideData.type === "summary" || slideData.type === "comparison") {
      slide.addText(slideData.title || "", {
        x: 0.5, y: 0.2, w: 12, h: 0.4,
        fontSize: 20, fontFace: "Arial", color: tc.darkGreen, bold: true,
      });
      slide.addShape("rect", { x: 0.5, y: 0.65, w: 12, h: 0.02, fill: { color: tc.sage } });

      const takeaways = slideData.content?.key_takeaways || [];
      const recs = slideData.content?.recommendations || [];
      let yPos = 1.0;

      if (takeaways.length) {
        slide.addText("Key Takeaways", {
          x: 0.5, y: yPos, w: 6, h: 0.3,
          fontSize: 12, fontFace: "Arial", color: tc.darkGreen, bold: true,
        });
        yPos += 0.35;
        takeaways.forEach((t: string) => {
          slide.addText(`• ${t}`, {
            x: 0.7, y: yPos, w: 11.5, h: 0.3,
            fontSize: 10, fontFace: "Arial", color: tc.darkText,
          });
          yPos += 0.35;
        });
      }

      if (recs.length) {
        yPos += 0.2;
        slide.addText("Recommendations", {
          x: 0.5, y: yPos, w: 6, h: 0.3,
          fontSize: 12, fontFace: "Arial", color: tc.darkGreen, bold: true,
        });
        yPos += 0.35;
        recs.forEach((r: string) => {
          slide.addText(`→ ${r}`, {
            x: 0.7, y: yPos, w: 11.5, h: 0.3,
            fontSize: 10, fontFace: "Arial", color: tc.darkText,
          });
          yPos += 0.35;
        });
      }
    }

    slide.addShape("rect", {
      x: 0, y: SLIDE_H - 0.35, w: SLIDE_W, h: 0.01,
      fill: { color: tc.sage },
    });
    slide.addText(`${data.companyName} — Confidential`, {
      x: 0.3, y: SLIDE_H - 0.32, w: 5, h: 0.25,
      fontSize: 7, fontFace: "Arial", color: "999999", italic: true,
    });
  }

  const arrayBuf = await pres.write({ outputType: "arraybuffer" });
  return Buffer.from(arrayBuf as ArrayBuffer);
}

/* ═══════════════════════════════════════════════════════════════
   PDF SECTION BUILDERS — new structure per plan:
   Cover (optional) → Overview (optional) → [Statement → Chart] × N
   ═══════════════════════════════════════════════════════════════ */

/** Filter out formula/italic rows — these are NEVER exported */
function filterFormulaRows(rows: any[]): any[] {
  return rows.filter(r => !r.isItalic && r.type !== "formula");
}

/** Build theme-aware chart series definitions.
 *  accent = primary theme highlight color (hex without #, e.g. "10B981") */
function buildChartSeriesByStatement(accentHex?: string): Record<string, Array<{ keyword: string; label: string; color: string }>> {
  const accent = accentHex ? `#${accentHex}` : "#10B981";
  return {
    income: [
      { keyword: "total revenue",            label: "Revenue", color: accent    },
      { keyword: "gross operating profit",   label: "GOP",     color: "#3B82F6" },
      { keyword: "net operating income",     label: "NOI",     color: "#F59E0B" },
      { keyword: "adjusted noi",             label: "ANOI",    color: "#6B7280" },
    ],
    cashflow: [
      { keyword: "free cash flow (fcf)",     label: "Cash Flow", color: accent    },
      { keyword: "free cash flow to equity", label: "FCFE",      color: "#8B5CF6" },
    ],
    balance: [
      { keyword: "total assets",      label: "Total Assets",      color: accent    },
      { keyword: "total liabilities", label: "Total Liabilities",  color: "#F4795B" },
      { keyword: "total equity",      label: "Total Equity",       color: "#3B82F6" },
    ],
    investment: [
      { keyword: "net operating income",     label: "NOI",          color: accent    },
      { keyword: "adjusted noi",             label: "ANOI",         color: "#3B82F6" },
      { keyword: "debt service",             label: "Debt Service", color: "#F4795B" },
      { keyword: "free cash flow to equity", label: "FCFE",         color: "#8B5CF6" },
    ],
  };
}

/** Detect which statement type this is from the title */
function detectStatementType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("income")) return "income";
  if (t.includes("cash flow")) return "cashflow";
  if (t.includes("balance")) return "balance";
  if (t.includes("investment")) return "investment";
  return "income";
}

/** Build a LINE CHART section for a statement, matching the UI's chart series and colors */
function buildChartsForStatement(stmt: { title: string; years: string[]; rows: any[] }): any | null {
  const years = stmt.years || [];
  const stmtType = detectStatementType(stmt.title);
  const chartSeries = buildChartSeriesByStatement();
  const seriesDefs = chartSeries[stmtType] || chartSeries.income;

  const series: any[] = [];
  for (const def of seriesDefs) {
    // Find the matching row in the statement data
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

  // 1. Optional cover page
  if (includeCover) {
    sections.push({ type: "cover", title: data.statementType || "Financial Report" });

    // 2. Optional overview (KPI metrics dashboard)
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
  }

  // 3. Statements interleaved with charts
  const statements = data.statements || [];
  if (statements.length) {
    for (const stmt of statements) {
      const isInvestment = (stmt.title || "").toLowerCase().includes("investment");

      // For Investment Analysis: extract top info cards as KPI metrics before the table
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

      // Financial table (formula rows filtered out)
      const filteredRows = filterFormulaRows(stmt.rows).map(r => ({
        category: r.category,
        values: r.values,
        type: r.isHeader ? "header" : r.isBold ? "total" : "data",
        indent: r.indent || 0,
        format: r.format,
      }));

      sections.push({
        type: "financial_table",
        title: stmt.title,
        content: { years: stmt.years, rows: filteredRows },
      });

      // Chart page after each statement
      const chartSection = buildChartsForStatement(stmt);
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

/** AI-designed PDF: LLM acts as graphic designer, code renders the vision */
async function generatePdfWithAiDesign(data: PremiumExportRequest, modelId?: string): Promise<Buffer> {
  const { getPdfDesignPrompt } = await import("./premium-export-prompts");
  const { resolveThemeColors, buildPdfHtml } = await import("./pdf-html-templates");

  const company = data.companyName || "Hospitality Business Group";
  const isLandscape = (data.orientation || "landscape") === "landscape";
  const colors = resolveThemeColors(data.themeColors);

  // Step 1: Ask LLM to design the report layout
  logger.info(`[pdf-design] Asking LLM to design PDF layout...`, "premium-export");
  const designPrompt = getPdfDesignPrompt(data, data.themeColors);
  const designJson = await generateWithGemini(designPrompt, "pdf", modelId);
  logger.info(`[pdf-design] LLM returned design vision: ${designJson.design_vision || ""}`, "premium-export");

  // Step 2: Convert LLM's design vision into section array
  const sections: any[] = [];
  const includeCover = !!data.includeCoverPage;

  // Cover page (if requested)
  if (includeCover && designJson.cover) {
    sections.push({
      type: "cover",
      title: designJson.cover.headline || `${company} — Financial Report`,
      subtitle: designJson.cover.tagline || "",
    });
  }

  // Process LLM-designed pages
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
      // Find the matching statement from the actual data
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
      // Find the statement this chart is for and extract series
      const stmt = (data.statements || []).find(s =>
        s.title.toLowerCase().includes((page.for_statement || "").toLowerCase())
      );
      if (stmt) {
        const chartSection = buildChartsForStatement(stmt);
        if (chartSection) {
          chartSection.title = page.title || chartSection.title;
          // Apply LLM's color intent to series
          if (page.series?.length && chartSection.content?.series) {
            for (const designSeries of page.series) {
              const match = chartSection.content.series.find((s: any) =>
                s.label.toLowerCase().includes(designSeries.label.toLowerCase())
              );
              if (match && designSeries.color_intent) {
                // Map intent to color if provided
              }
            }
          }
          sections.push(chartSection);
        }
      }
    }
  }

  // Fallback: if LLM returned empty pages, use template sections
  if (sections.length < 2) {
    logger.warn(`[pdf-design] LLM returned insufficient sections (${sections.length}), adding template fallback`, "premium-export");
    const templateSections = buildPdfSectionsFromData(data);
    sections.push(...templateSections);
  }

  const reportTitle = designJson.cover?.headline || `${company} — Financial Report`;

  // Step 3: Render to HTML using existing renderers
  const html = buildPdfHtml({ sections, report_title: reportTitle }, {
    orientation: data.orientation || "landscape",
    companyName: company,
    entityName: data.entityName,
    sections,
    reportTitle,
    colors,
  });

  // Step 4: Puppeteer renders to PDF
  const safeCompanyHtml = company.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  return renderPdf(html, {
    width: isLandscape ? "406.4mm" : "215.9mm",
    height: isLandscape ? "228.6mm" : "279.4mm",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `
      <div style="width:100%;font-size:7pt;font-family:Helvetica,Arial,sans-serif;color:#999;padding:0 16mm;">
        <span style="float:left">${safeCompanyHtml}</span>
        <span style="float:right"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        <span style="display:block;text-align:center">CONFIDENTIAL</span>
      </div>`,
    margin: { top: "0mm", bottom: "10mm", left: "0mm", right: "0mm" },
  });
}

/** Template-only PDF (no AI — fallback) */
async function generatePdfBuffer(_aiResult: any, data: PremiumExportRequest): Promise<Buffer> {
  const company = data.companyName || "Hospitality Business Group";
  const isLandscape = (data.orientation || "landscape") === "landscape";

  const sections = buildPdfSectionsFromData(data);
  const reportTitle = data.statementType
    ? `${company} — ${data.statementType}`
    : `${company} — Financial Report`;

  const { resolveThemeColors } = await import("./pdf-html-templates");
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

  return renderPdf(html, {
    width: isLandscape ? "406.4mm" : "215.9mm",
    height: isLandscape ? "228.6mm" : "279.4mm",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `
      <div style="width:100%;font-size:7pt;font-family:Helvetica,Arial,sans-serif;color:#999;padding:0 16mm;">
        <span style="float:left">${safeCompanyHtml}</span>
        <span style="float:right"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        <span style="display:block;text-align:center">CONFIDENTIAL</span>
      </div>`,
    margin: { top: "0mm", bottom: "10mm", left: "0mm", right: "0mm" },
  });
}

async function generateDocxBuffer(aiResult: any, data: PremiumExportRequest): Promise<Buffer> {
  const docxLib = await import("docx");
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, ShadingType } = docxLib;

  const children: any[] = [];

  children.push(new Paragraph({
    children: [new TextRun({ text: data.companyName || "Hospitality Business Group", bold: true, size: 20, color: BRAND.SAGE_HEX, font: "Arial" })],
    spacing: { after: 100 },
  }));

  children.push(new Paragraph({
    children: [new TextRun({ text: aiResult.title || `${data.entityName} — Investor Memo`, bold: true, size: 36, color: BRAND.NAVY_HEX, font: "Arial" })],
    spacing: { after: 100 },
  }));

  if (aiResult.subtitle) {
    children.push(new Paragraph({
      children: [new TextRun({ text: aiResult.subtitle, size: 22, color: BRAND.GRAY_HEX, font: "Arial" })],
      spacing: { after: 200 },
    }));
  }

  children.push(new Paragraph({
    children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, size: 18, color: BRAND.GRAY_HEX, italics: true, font: "Arial" })],
    spacing: { after: 100 },
  }));

  children.push(new Paragraph({
    children: [new TextRun({ text: "Confidential — For authorized recipients only", size: 16, color: BRAND.GRAY_HEX, italics: true, font: "Arial" })],
    spacing: { after: 400 },
    border: { bottom: { color: BRAND.SAGE_HEX, space: 4, style: BorderStyle.SINGLE, size: 6 } },
  }));

  for (const section of (aiResult.sections || [])) {
    const headingLevel = section.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_1;
    children.push(new Paragraph({
      text: section.heading || "",
      heading: headingLevel,
      spacing: { before: 300, after: 150 },
    }));

    for (const content of (section.content || [])) {
      if (content.type === "paragraph") {
        const style = content.style || "normal";
        children.push(new Paragraph({
          children: [new TextRun({
            text: content.text || "",
            bold: style === "bold",
            italics: style === "italic",
            size: 22,
            font: "Arial",
          })],
          spacing: { after: 120 },
        }));
      } else if (content.type === "bullet_list") {
        for (const item of (content.items || [])) {
          children.push(new Paragraph({
            children: [new TextRun({ text: item, size: 22, font: "Arial" })],
            bullet: { level: 0 },
            spacing: { after: 60 },
          }));
        }
      } else if (content.type === "key_value") {
        for (const pair of (content.pairs || [])) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: `${pair.label}: `, bold: true, size: 22, font: "Arial", color: BRAND.GRAY_HEX }),
              new TextRun({ text: pair.value || "N/A", size: 22, font: "Arial" }),
            ],
            spacing: { after: 60 },
          }));
        }
      } else if (content.type === "table" && content.headers?.length) {
        const headerCells = content.headers.map((h: string) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: "FFFFFF", font: "Arial" })] })],
          shading: { type: ShadingType.SOLID, color: BRAND.SAGE_HEX },
        }));

        const dataRows = (content.rows || []).map((row: string[], ri: number) =>
          new TableRow({
            children: row.map((cell: string) => new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: cell || "", size: 18, font: "Arial" })] })],
              shading: ri % 2 === 1 ? { type: ShadingType.SOLID, color: BRAND.ALT_ROW_HEX } : undefined,
            })),
          })
        );

        children.push(new Table({
          rows: [new TableRow({ children: headerCells }), ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }));
        children.push(new Paragraph({ spacing: { after: 200 } }));
      }
    }
  }

  if (aiResult.appendix?.financial_tables?.length) {
    children.push(new Paragraph({
      text: "Appendix: Financial Tables",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }));

    for (const table of aiResult.appendix.financial_tables) {
      children.push(new Paragraph({
        text: table.title || "",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }));

      const years = table.years || [];
      const headerCells = ["", ...years].map((h: string) => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 16, color: "FFFFFF", font: "Arial" })],
          alignment: h ? AlignmentType.RIGHT : AlignmentType.LEFT,
        })],
        shading: { type: ShadingType.SOLID, color: BRAND.SAGE_HEX },
      }));

      const dataRows = (table.rows || []).map((row: any, ri: number) => {
        const indent = row.indent ? "  ".repeat(row.indent) : "";
        const isHeaderRow = row.type === "header";
        const isTotalRow = row.type === "total" || row.type === "subtotal";

        return new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: indent + (row.category || ""),
                  bold: isHeaderRow || isTotalRow,
                  size: 16, font: "Arial",
                })],
              })],
              shading: isHeaderRow ? { type: ShadingType.SOLID, color: BRAND.SECTION_BG_HEX } :
                ri % 2 === 1 ? { type: ShadingType.SOLID, color: BRAND.ALT_ROW_HEX } : undefined,
            }),
            ...(row.values || []).map((v: any) => new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: typeof v === "number" ? (v === 0 ? "—" : v < 0 ? `($${Math.abs(v).toLocaleString()})` : `$${v.toLocaleString()}`) : String(v),
                  bold: isTotalRow,
                  size: 16, font: "Arial",
                })],
                alignment: AlignmentType.RIGHT,
              })],
              shading: isHeaderRow ? { type: ShadingType.SOLID, color: BRAND.SECTION_BG_HEX } :
                ri % 2 === 1 ? { type: ShadingType.SOLID, color: BRAND.ALT_ROW_HEX } : undefined,
            })),
          ],
        });
      });

      children.push(new Table({
        rows: [new TableRow({ children: headerCells }), ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
  }

  const docDocument = new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });

  return await Packer.toBuffer(docDocument);
}

/** Direct Excel generation from data — no AI call. One worksheet per statement. */
async function generateExcelFromData(data: PremiumExportRequest): Promise<Buffer> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const statements = data.statements || [];

  for (const stmt of statements) {
    const rows = filterFormulaRows(stmt.rows);
    const wsData: any[][] = [];

    // Header row: blank label column + year columns
    wsData.push(["", ...stmt.years.map(y => `FY ${y}`)]);

    for (const row of rows) {
      const indent = row.indent ? "  ".repeat(row.indent) : "";
      const label = indent + (row.category || "");
      const values = (row.values || []).map((v: any) => {
        if (typeof v === "number") return v;
        if (typeof v === "string" && v === "\u2014") return "";
        return v;
      });
      wsData.push([label, ...values]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws["!cols"] = [{ wch: 38 }, ...stmt.years.map(() => ({ wch: 16 }))];

    // Bold header row
    const headerRange = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[addr]) {
        ws[addr].s = { font: { bold: true } };
      }
    }

    const safeName = (stmt.title || "Sheet").substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}

/** PNG ZIP: render each PDF section as a separate PNG, bundle in a ZIP. */
async function generatePngZipBuffer(data: PremiumExportRequest): Promise<Buffer> {
  const archiver = (await import("archiver")).default;
  const { buildPdfHtml, resolveThemeColors } = await import("./pdf-html-templates");
  const { renderPng } = await import("../pdf/browser-renderer");

  const company = data.companyName || "Hospitality Business Group";
  const isLandscape = (data.orientation || "landscape") === "landscape";
  const sections = buildPdfSectionsFromData(data);
  const colors = resolveThemeColors(data.themeColors);
  const reportTitle = data.statementType
    ? `${company} \u2014 ${data.statementType}`
    : `${company} \u2014 Financial Report`;

  const pngs: { name: string; buffer: Buffer }[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const html = buildPdfHtml({ sections: [section], report_title: reportTitle }, {
      orientation: data.orientation || "landscape",
      companyName: company,
      entityName: data.entityName,
      sections: [section],
      reportTitle,
      colors,
    });

    const pngBuffer = await renderPng(html, {
      width: isLandscape ? 1536 : 816,
      height: isLandscape ? 864 : 1056,
      scale: 2,
    });

    const idx = String(i + 1).padStart(2, "0");
    const label = (section.title || section.type || "Page").replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-");
    pngs.push({ name: `${idx}-${label}.png`, buffer: pngBuffer });
  }

  // Bundle into ZIP with timeout guard
  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    for (const png of pngs) {
      archive.append(png.buffer, { name: png.name });
    }
    archive.finalize();
  });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("PNG ZIP generation timed out after 30s")), 30_000)
  );
  return Promise.race([zipPromise, timeoutPromise]);
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
  // PDF: LLM-designed layout → HTML → Puppeteer. Falls back to template on AI failure.
  if (data.format === "pdf") {
    try {
      logger.info(`[pdf-design] Using AI designer cascade (${modelId || "gemini-2.5-flash"})...`, "premium-export");
      return await generatePdfWithAiDesign(data, modelId);
    } catch (err: any) {
      logger.warn(`[pdf-design] AI design failed: ${err.message} — falling back to template`, "premium-export");
      return generatePdfBuffer(null, data);
    }
  }

  // Excel: direct data → xlsx (no AI — one worksheet per statement)
  if (data.format === "xlsx") {
    logger.info(`[template] Building Excel directly from data (no AI call)...`, "premium-export");
    return generateExcelFromData(data);
  }

  // PNG ZIP: render each section as PNG, bundle in ZIP (no AI)
  if (data.format === "png") {
    logger.info(`[template] Building PNG ZIP from data (no AI call)...`, "premium-export");
    return generatePngZipBuffer(data);
  }

  // PPTX / DOCX: AI-powered generation via Gemini
  logger.info(`[template] Building ${data.format} prompt...`, "premium-export");
  let prompt: string;
  switch (data.format) {
    case "pptx": prompt = getPptxPrompt(data); break;
    case "docx": prompt = getDocxPrompt(data); break;
    default: throw new Error(`Unsupported format: ${data.format}`);
  }

  logger.info(`[template] Calling AI (${modelId || "default"}) for JSON structure...`, "premium-export");
  const aiResult = await generateWithGemini(prompt, data.format, modelId);
  logger.info(`[template] AI returned valid JSON, generating ${data.format} buffer...`, "premium-export");

  switch (data.format) {
    case "pptx": return generatePptxBuffer(aiResult, data);
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
