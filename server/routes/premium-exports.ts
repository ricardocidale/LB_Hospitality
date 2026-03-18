import { type Express, type Request, type Response } from "express";
import { getGeminiClient } from "../ai/clients";
import { requireAuth } from "../auth";
import { z } from "zod";
import { AI_GENERATION_TIMEOUT_MS } from "../constants";
import { logger } from "../logger";
import { BRAND, buildFinancialDataContext, getExcelPrompt, getPptxPrompt, getPdfPrompt, getDocxPrompt } from "./premium-export-prompts";
import { buildPdfHtml } from "./pdf-html-templates";
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
});

const premiumExportSchema = z.object({
  format: z.enum(["xlsx", "pptx", "pdf", "docx"]),
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
  const pres = new (pptxgen as any)();
  pres.layout = "LAYOUT_WIDE";
  pres.author = data.companyName;
  pres.title = aiResult.presentation_notes || `${data.entityName} — Premium Report`;

  const SLIDE_W = 13.33;
  const SLIDE_H = 7.5;

  for (const slideData of (aiResult.slides || [])) {
    const slide = pres.addSlide();

    if (slideData.type === "title") {
      slide.background = { color: BRAND.NAVY_HEX };
      slide.addShape("rect", { x: 0, y: 0, w: SLIDE_W, h: 0.05, fill: { color: BRAND.SAGE_HEX } });
      slide.addText(data.companyName || "", {
        x: 0.6, y: 1.5, w: 12, h: 0.6,
        fontSize: 28, fontFace: "Arial", color: BRAND.SAGE_HEX, bold: true,
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
          fontSize: 11, fontFace: "Arial", color: BRAND.SAGE_HEX, bold: true, align: "right",
        });
      }
    } else if (slideData.type === "metrics") {
      slide.addText(slideData.title || "", {
        x: 0.5, y: 0.2, w: 8, h: 0.4,
        fontSize: 20, fontFace: "Arial", color: BRAND.DARK_GREEN_HEX, bold: true,
      });
      slide.addShape("rect", { x: 0.5, y: 0.65, w: 12, h: 0.02, fill: { color: BRAND.SAGE_HEX } });

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
          fill: { color: "F5F9F6" },
          line: { color: BRAND.SAGE_HEX, width: 1 },
          rectRadius: 0.1,
        });
        const trendColor = m.trend === "up" ? BRAND.DARK_GREEN_HEX :
          m.trend === "down" ? "CC3333" : BRAND.DARK_GREEN_HEX;
        slide.addText(m.value || "", {
          x: x + 0.15, y: y + 0.15, w: cardW - 0.3, h: 0.5,
          fontSize: 18, fontFace: "Arial", color: trendColor, bold: true,
        });
        slide.addText(m.label || "", {
          x: x + 0.15, y: y + 0.6, w: cardW - 0.3, h: 0.35,
          fontSize: 9, fontFace: "Arial", color: BRAND.GRAY_HEX,
        });
      });
    } else if (slideData.type === "table") {
      slide.addText(slideData.title || "", {
        x: 0.3, y: 0.1, w: 8, h: 0.3,
        fontSize: 14, fontFace: "Arial", color: BRAND.DARK_GREEN_HEX, bold: true,
      });
      if (slideData.source_tag) {
        slide.addText(slideData.source_tag, {
          x: SLIDE_W - 5.3, y: 0.1, w: 5, h: 0.3,
          fontSize: 9, fontFace: "Arial", color: BRAND.GRAY_HEX, bold: true, align: "right",
        });
      }

      const years = slideData.content?.years || [];
      const rows = slideData.content?.rows || [];
      const tableRows: any[][] = [];

      const headerRow = [
        { text: "", options: { fill: { color: BRAND.SAGE_HEX }, fontFace: "Arial", fontSize: 8, color: BRAND.WHITE_HEX, bold: true } },
        ...years.map((y: string) => ({
          text: y, options: { fill: { color: BRAND.SAGE_HEX }, fontFace: "Arial", fontSize: 8, color: BRAND.WHITE_HEX, bold: true, align: "right" as const },
        })),
      ];
      tableRows.push(headerRow);

      rows.forEach((row: any, ri: number) => {
        const isHeader = row.type === "header";
        const isTotal = row.type === "total" || row.type === "subtotal";
        const indent = row.indent ? "  ".repeat(row.indent) : "";
        const bg = isHeader ? BRAND.SECTION_BG_HEX : ri % 2 === 1 ? BRAND.ALT_ROW_HEX : BRAND.WHITE_HEX;

        const labelCell = {
          text: indent + (row.category || ""),
          options: {
            fontFace: "Arial", fontSize: 8,
            color: BRAND.DARK_TEXT_HEX,
            bold: isHeader || isTotal,
            fill: { color: bg },
          },
        };
        const valCells = (row.values || []).map((v: any) => ({
          text: typeof v === "number" ? (Math.abs(v) >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : Math.abs(v) >= 1_000 ? `$${(v / 1_000).toFixed(0)}K` : v === 0 ? "—" : `$${v}`) : String(v),
          options: {
            fontFace: "Arial", fontSize: 8, color: BRAND.DARK_TEXT_HEX,
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
        fontSize: 20, fontFace: "Arial", color: BRAND.DARK_GREEN_HEX, bold: true,
      });
      slide.addShape("rect", { x: 0.5, y: 0.65, w: 12, h: 0.02, fill: { color: BRAND.SAGE_HEX } });

      const takeaways = slideData.content?.key_takeaways || [];
      const recs = slideData.content?.recommendations || [];
      let yPos = 1.0;

      if (takeaways.length) {
        slide.addText("Key Takeaways", {
          x: 0.5, y: yPos, w: 6, h: 0.3,
          fontSize: 12, fontFace: "Arial", color: BRAND.DARK_GREEN_HEX, bold: true,
        });
        yPos += 0.35;
        takeaways.forEach((t: string) => {
          slide.addText(`• ${t}`, {
            x: 0.7, y: yPos, w: 11.5, h: 0.3,
            fontSize: 10, fontFace: "Arial", color: BRAND.DARK_TEXT_HEX,
          });
          yPos += 0.35;
        });
      }

      if (recs.length) {
        yPos += 0.2;
        slide.addText("Recommendations", {
          x: 0.5, y: yPos, w: 6, h: 0.3,
          fontSize: 12, fontFace: "Arial", color: BRAND.DARK_GREEN_HEX, bold: true,
        });
        yPos += 0.35;
        recs.forEach((r: string) => {
          slide.addText(`→ ${r}`, {
            x: 0.7, y: yPos, w: 11.5, h: 0.3,
            fontSize: 10, fontFace: "Arial", color: BRAND.DARK_TEXT_HEX,
          });
          yPos += 0.35;
        });
      }
    }

    slide.addShape("rect", {
      x: 0, y: SLIDE_H - 0.35, w: SLIDE_W, h: 0.01,
      fill: { color: BRAND.SAGE_HEX },
    });
    slide.addText(`${data.companyName} — Confidential`, {
      x: 0.3, y: SLIDE_H - 0.32, w: 5, h: 0.25,
      fontSize: 7, fontFace: "Arial", color: "999999", italic: true,
    });
  }

  const arrayBuf = await pres.write({ outputType: "arraybuffer" });
  return Buffer.from(arrayBuf as ArrayBuffer);
}

let browserInstance: any = null;
let browserLaunchPromise: Promise<any> | null = null;

async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }
  browserLaunchPromise = (async () => {
    try {
      const puppeteer = await import("puppeteer");
      browserInstance = await puppeteer.default.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--font-render-hinting=none",
        ],
      });
      return browserInstance;
    } finally {
      browserLaunchPromise = null;
    }
  })();
  return browserLaunchPromise;
}

async function closeBrowser() {
  if (browserInstance) {
    try { await browserInstance.close(); } catch {}
    browserInstance = null;
  }
}

process.on("SIGTERM", closeBrowser);
process.on("SIGINT", closeBrowser);

async function generatePdfBuffer(aiResult: any, data: PremiumExportRequest): Promise<Buffer> {
  const company = data.companyName || "Hospitality Business Group";
  const isLandscape = (data.orientation || "landscape") === "landscape";

  const html = buildPdfHtml(aiResult, {
    orientation: data.orientation || "landscape",
    companyName: company,
    entityName: data.entityName,
    sections: aiResult.sections || [],
    reportTitle: aiResult.report_title,
  });

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15_000 });

    const pdfBuffer = await page.pdf({
      width: isLandscape ? "297mm" : "210mm",
      height: isLandscape ? "210mm" : "297mm",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `
        <div style="width:100%;font-size:7pt;font-family:Helvetica,Arial,sans-serif;color:#999;padding:0 16mm;display:flex;justify-content:space-between;">
          <span>${company.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}</span>
          <span>CONFIDENTIAL</span>
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
      margin: { top: "0mm", bottom: "8mm", left: "0mm", right: "0mm" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
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

const CONTENT_TYPES: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const FORMAT_EXTENSIONS: Record<string, string> = {
  xlsx: ".xlsx",
  pptx: ".pptx",
  pdf: ".pdf",
  docx: ".docx",
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
  logger.info(`[template] Building ${data.format} prompt...`, "premium-export");
  let prompt: string;
  switch (data.format) {
    case "xlsx": prompt = getExcelPrompt(data); break;
    case "pptx": prompt = getPptxPrompt(data); break;
    case "pdf":  prompt = getPdfPrompt(data); break;
    case "docx": prompt = getDocxPrompt(data); break;
    default: throw new Error(`Unsupported format: ${data.format}`);
  }

  logger.info(`[template] Calling AI (${modelId || "default"}) for JSON structure...`, "premium-export");
  const aiResult = await generateWithGemini(prompt, data.format, modelId);
  logger.info(`[template] AI returned valid JSON, generating ${data.format} buffer...`, "premium-export");

  switch (data.format) {
    case "xlsx": return generateExcelBuffer(aiResult, data);
    case "pptx": return generatePptxBuffer(aiResult, data);
    case "pdf":  return generatePdfBuffer(aiResult, data);
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
    res.json({ available: hasApiKey, formats: ["xlsx", "pptx", "pdf", "docx"] });
  });

  const driveUploadSchema = z.object({
    filename: z.string().min(1).max(200),
    mimeType: z.string().max(100).default("application/octet-stream"),
    base64Data: z.string().max(50_000_000),
  });

  app.post("/api/exports/drive-upload", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = driveUploadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid upload request", details: parsed.error.flatten() });
      }
      const { filename, mimeType, base64Data } = parsed.data;

      const accessToken = process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
      if (!accessToken) {
        return res.status(503).json({ error: "Google Drive is not connected" });
      }

      const boundary = "----ExportBoundary" + Date.now();
      const metadata = JSON.stringify({
        name: filename,
        mimeType: mimeType || "application/octet-stream",
      });

      const bodyParts = [
        `--${boundary}\r\n`,
        `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
        metadata,
        `\r\n--${boundary}\r\n`,
        `Content-Type: ${mimeType || "application/octet-stream"}\r\n`,
        `Content-Transfer-Encoding: base64\r\n\r\n`,
        base64Data,
        `\r\n--${boundary}--`,
      ];

      const uploadResponse = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: bodyParts.join(""),
        }
      );

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        logger.error(`Google Drive upload failed: ${uploadResponse.status} ${errText}`, "premium-export");
        return res.status(uploadResponse.status).json({ error: "Failed to upload to Google Drive" });
      }

      const driveFile = await uploadResponse.json() as { id: string; name: string; webViewLink: string };
      logger.info(`Uploaded to Google Drive: ${driveFile.name} (${driveFile.id})`, "premium-export");
      res.json({ success: true, fileId: driveFile.id, fileName: driveFile.name, webViewLink: driveFile.webViewLink });
    } catch (error: any) {
      logger.error(`Drive upload error: ${error?.message || error}`, "premium-export");
      res.status(500).json({ error: "Failed to upload to Google Drive" });
    }
  });

  app.get("/api/exports/drive-status", requireAuth, async (_req: Request, res: Response) => {
    const hasToken = !!(process.env.GOOGLE_DRIVE_ACCESS_TOKEN);
    res.json({ available: hasToken });
  });
}
