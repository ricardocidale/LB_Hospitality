import { type Express, type Request, type Response } from "express";
import { getGeminiClient } from "../ai/clients";
import { requireAuth } from "../auth";
import { z } from "zod";
import { AI_GENERATION_TIMEOUT_MS } from "../constants";
import { logger } from "../logger";
import { BRAND, buildFinancialDataContext, getExcelPrompt, getPptxPrompt, getPdfPrompt, getDocxPrompt } from "./premium-export-prompts";
import { resolveThemeColors } from "./pdf-html-templates";
import { logApiCost, estimateCost } from "../middleware/cost-logger";
import { storage } from "../storage";
import { resolveLlm, getVendorService, DEFAULT_GEMINI_MODEL } from "../ai/resolve-llm";
import type { ResearchConfig } from "@shared/schema";
import { aggressiveParse } from "./export-json-utils";
import { generateExcelBuffer, generateExcelFromData } from "./format-generators/excel-generator";
import { generatePptxBuffer } from "./format-generators/pptx-generator";
import { generateDocxBuffer } from "./format-generators/docx-generator";
import { generatePngZipBuffer } from "./format-generators/png-generator";
import { buildPdfSectionsFromData } from "./premium-pdf-pipeline";
import { renderPremiumPdf } from "../pdf/render";

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

function validateAIOutput(result: Record<string, unknown>, format: string): void {
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
  client: ReturnType<typeof getGeminiClient>, prompt: string, format: string, startTime: number, modelId: string
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

async function generateWithGemini(prompt: string, format: string, modelId?: string): Promise<Record<string, unknown>> {
  const client = getGeminiClient();
  const startTime = Date.now();
  const resolvedModel = modelId || DEFAULT_GEMINI_MODEL;

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { text, finishReason } = await callGemini(client, prompt, format, startTime, resolvedModel);
      logger.info(`[attempt ${attempt}] ${resolvedModel} returned ${text.length} chars, finishReason=${finishReason}`, "premium-export");

      const parsed = aggressiveParse(text) as Record<string, unknown>;
      if (attempt > 1) logger.warn(`Premium export: succeeded on retry attempt ${attempt}`);
      validateAIOutput(parsed, format);
      return parsed;
    } catch (err: unknown) {
      lastError = err as Error;
      logger.warn(`[attempt ${attempt}] Parse failed: ${(err as Error).message} — ${attempt < 2 ? "retrying..." : "giving up"}`, "premium-export");
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  throw lastError ?? new Error("AI returned invalid JSON — could not parse response");
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
    logger.info(`[react-pdf] Generating PDF via @react-pdf/renderer...`, "premium-export");
    return renderPremiumPdf(data);
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
