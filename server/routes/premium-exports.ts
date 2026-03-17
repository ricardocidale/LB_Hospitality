import { type Express, type Request, type Response } from "express";
import { getGeminiClient } from "../ai/clients";
import { requireAuth } from "../auth";
import { z } from "zod";
import { AI_GENERATION_TIMEOUT_MS } from "../constants";
import { logger } from "../logger";
import { BRAND, buildFinancialDataContext, getExcelPrompt, getPptxPrompt, getPdfPrompt, getDocxPrompt } from "./premium-export-prompts";
import { logApiCost, estimateCost } from "../middleware/cost-logger";

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

async function generateWithGemini(prompt: string, format: string): Promise<any> {
  const client = getGeminiClient();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("AI generation timed out after 120 seconds")), AI_GENERATION_TIMEOUT_MS)
  );

  const startTime = Date.now();
  const generatePromise = client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const response = await Promise.race([generatePromise, timeoutPromise]);

  const text = response.text;
  if (!text) {
    throw new Error("No text response from Gemini");
  }

  const inTok = response.usageMetadata?.promptTokenCount ?? Math.round(prompt.length / 4);
  const outTok = response.usageMetadata?.candidatesTokenCount ?? Math.round(text.length / 4);
  try { logApiCost({ timestamp: new Date().toISOString(), service: "gemini", model: "gemini-2.5-flash", operation: `premium-export-${format}`, inputTokens: inTok, outputTokens: outTok, estimatedCostUsd: estimateCost("gemini", "gemini-2.5-flash", inTok, outTok), durationMs: Date.now() - startTime, route: "/api/exports/premium" }); } catch {}

  let jsonStr = text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("AI returned invalid JSON — could not parse response");
  }

  validateAIOutput(parsed, format);
  return parsed;
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

async function generatePdfBuffer(aiResult: any, data: PremiumExportRequest): Promise<Buffer> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: data.orientation || "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const NAVY: [number, number, number] = [26, 35, 50];
  const SAGE: [number, number, number] = [159, 188, 164];
  const DK_GREEN: [number, number, number] = [37, 125, 65];
  const GRAY: [number, number, number] = [102, 102, 102];
  const DK_TEXT: [number, number, number] = [61, 61, 61];
  const SEC_BG: [number, number, number] = [239, 245, 240];
  const ALT_ROW: [number, number, number] = [248, 250, 249];
  const WARM_BG: [number, number, number] = [255, 249, 245];
  const CARD_BG: [number, number, number] = [245, 249, 246];

  const company = data.companyName || "Hospitality Business Group";
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const coverPageNumbers = new Set<number>();

  function drawPageChrome() {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, 1.5, "F");
    doc.setFillColor(...SAGE);
    doc.rect(0, 1.5, pageW, 0.8, "F");

    doc.setFillColor(...NAVY);
    doc.rect(0, pageH - 1.5, pageW, 1.5, "F");
    doc.setFillColor(...SAGE);
    doc.rect(0, pageH - 2.3, pageW, 0.8, "F");

    doc.setDrawColor(...SAGE);
    doc.setLineWidth(0.3);
    doc.line(10, 6, 10, pageH - 6);
    doc.line(pageW - 10, 6, pageW - 10, pageH - 6);
  }

  function drawSectionHeader(title: string, subtitle?: string): number {
    drawPageChrome();

    doc.setFillColor(...NAVY);
    doc.rect(16, 10, pageW - 32, 22, "F");
    doc.setFillColor(...SAGE);
    doc.rect(16, 30, pageW - 32, 1.2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 22, 22);

    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...SAGE);
      doc.text(subtitle, 22, 28);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text(company, pageW - 22, 22, { align: "right" });

    return 38;
  }

  function addNewPage() {
    doc.addPage();
  }

  for (let i = 0; i < (aiResult.sections || []).length; i++) {
    const section = aiResult.sections[i];

    if (i > 0) {
      addNewPage();
    }

    if (section.type === "cover") {
      coverPageNumbers.add((doc.internal as any).getNumberOfPages());

      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pageW, pageH, "F");

      doc.setFillColor(...SAGE);
      doc.rect(0, 0, pageW, 3, "F");
      doc.rect(0, pageH - 3, pageW, 3, "F");

      doc.setDrawColor(159, 188, 164, 60);
      doc.setLineWidth(0.15);
      for (let lx = 0; lx < pageW; lx += 12) {
        doc.line(lx, 0, lx, pageH);
      }
      for (let ly = 0; ly < pageH; ly += 12) {
        doc.line(0, ly, pageW, ly);
      }

      doc.setFillColor(...SAGE);
      doc.rect(16, pageH * 0.28, 4, 40, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.setTextColor(255, 255, 255);
      doc.text(company, 28, pageH * 0.32);

      doc.setFillColor(255, 255, 255);
      doc.rect(28, pageH * 0.35, 60, 0.5, "F");

      const reportTitle = aiResult.report_title || section.title || "Financial Report";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(18);
      doc.setTextColor(...SAGE);
      doc.text(reportTitle, 28, pageH * 0.42);

      if (section.subtitle) {
        doc.setFontSize(12);
        doc.setTextColor(180, 200, 185);
        doc.text(section.subtitle, 28, pageH * 0.48);
      }

      doc.setFillColor(40, 50, 65);
      doc.roundedRect(28, pageH * 0.58, 100, 30, 2, 2, "F");
      doc.setDrawColor(...SAGE);
      doc.setLineWidth(0.3);
      doc.roundedRect(28, pageH * 0.58, 100, 30, 2, 2, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...SAGE);
      doc.text("PREPARED", 34, pageH * 0.58 + 8);
      doc.text("DATE", 34, pageH * 0.58 + 18);
      doc.text("CLASSIFICATION", 80, pageH * 0.58 + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(220, 220, 220);
      doc.text(`For ${data.entityName}`, 34, pageH * 0.58 + 13);
      doc.text(dateStr, 34, pageH * 0.58 + 23);
      doc.text("CONFIDENTIAL", 80, pageH * 0.58 + 13);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(120, 130, 140);
      doc.text("This document contains proprietary financial projections. Distribution is restricted to authorized recipients.", 28, pageH * 0.82);

    } else if (section.type === "executive_summary" || section.type === "analysis" || section.type === "notes") {
      let y = drawSectionHeader(
        section.title || "Executive Summary",
        `${company} \u2014 ${data.entityName}`
      );

      const paragraphs = section.content?.paragraphs || section.content?.observations || section.content?.items || [];
      if (paragraphs.length > 0) {
        doc.setFillColor(...WARM_BG);
        const blockH = Math.min(paragraphs.length * 16, pageH - y - 30);
        doc.roundedRect(16, y, pageW - 32, blockH, 2, 2, "F");
        doc.setDrawColor(...SAGE);
        doc.setLineWidth(0.3);
        doc.roundedRect(16, y, pageW - 32, blockH, 2, 2, "S");

        doc.setFillColor(...DK_GREEN);
        doc.rect(16, y, 2, blockH, "F");

        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...DK_TEXT);
        for (const p of paragraphs) {
          const text = typeof p === "string" ? p : `${p.metric}: ${p.insight}`;
          const lines = doc.splitTextToSize(text, pageW - 48);
          for (const line of lines) {
            if (y > pageH - 20) { addNewPage(); drawPageChrome(); y = 15; }
            doc.text(line, 24, y);
            y += 4.5;
          }
          y += 3;
        }
      }

      if (section.content?.highlights) {
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...DK_GREEN);
        doc.text("KEY HIGHLIGHTS", 20, y);
        doc.setDrawColor(...SAGE);
        doc.setLineWidth(0.4);
        doc.line(20, y + 2, 70, y + 2);
        y += 8;

        for (const h of section.content.highlights) {
          if (y > pageH - 20) { addNewPage(); drawPageChrome(); y = 15; }

          doc.setFillColor(...CARD_BG);
          doc.roundedRect(20, y - 3, pageW - 44, 10, 1.5, 1.5, "F");

          doc.setFillColor(...DK_GREEN);
          doc.circle(24, y + 1.5, 1, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...NAVY);
          doc.text(`${h.metric}`, 28, y + 2);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...DK_TEXT);
          doc.text(h.insight || "", 70, y + 2);
          y += 12;
        }
      }

    } else if (section.type === "metrics_dashboard") {
      let y = drawSectionHeader(
        section.title || "Key Performance Indicators",
        `${company} \u2014 Investment Overview`
      );

      const metrics = section.content?.metrics || [];
      const cols = Math.min(metrics.length, 3);
      const gap = 6;
      const cardW = (pageW - 32 - gap * (cols - 1)) / cols;
      const cardH = 28;

      metrics.forEach((m: any, mi: number) => {
        const col = mi % cols;
        const row = Math.floor(mi / cols);
        const x = 16 + col * (cardW + gap);
        const cy = y + row * (cardH + gap);

        if (cy + cardH > pageH - 20) return;

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, cy, cardW, cardH, 3, 3, "F");
        doc.setDrawColor(...SAGE);
        doc.setLineWidth(0.4);
        doc.roundedRect(x, cy, cardW, cardH, 3, 3, "S");

        doc.setFillColor(...DK_GREEN);
        doc.rect(x, cy, cardW, 1.5, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(...DK_GREEN);
        const valText = m.value || "";
        doc.text(valText, x + cardW / 2, cy + 14, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY);
        doc.text(m.label || "", x + cardW / 2, cy + 22, { align: "center" });

        if (m.trend) {
          const arrow = m.trend === "up" ? "\u25B2" : m.trend === "down" ? "\u25BC" : "";
          const trendColor: [number, number, number] = m.trend === "up" ? DK_GREEN : [204, 51, 51];
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...trendColor);
          doc.text(arrow, x + cardW - 8, cy + 6);
        }
      });

    } else if (section.type === "financial_table") {
      let y = drawSectionHeader(
        section.title || "Financial Statement",
        `${company} \u2014 ${data.entityName}`
      );

      const years = section.content?.years || [];
      const rows = section.content?.rows || [];
      if (years.length && rows.length) {
        const numCols = years.length;
        const labelColW = data.orientation === "portrait" ? 40 : 50;
        const availableWidth = pageW - 32;
        const dataColW = (availableWidth - labelColW) / numCols;
        const fontSize = numCols <= 6 ? 7.5 : numCols <= 10 ? 7 : 6;

        const body = rows.map((r: any) => {
          const indent = r.indent ? "  ".repeat(r.indent) : "";
          const vals = (r.values || []).map((v: any) => {
            if (typeof v === "number") {
              if (v === 0) return "\u2014";
              const abs = Math.abs(v);
              const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
              return v < 0 ? `($${s})` : `$${s}`;
            }
            return String(v);
          });
          return [indent + (r.category || ""), ...vals];
        });

        const colStyles: Record<number, any> = { 0: { cellWidth: labelColW } };
        for (let ci = 1; ci <= numCols; ci++) {
          colStyles[ci] = { halign: "right", cellWidth: dataColW, font: "courier" };
        }

        autoTable(doc, {
          startY: y,
          head: [["", ...years.map((yr: any) => `FY ${yr}`)]],
          body,
          margin: { left: 16, right: 16 },
          styles: {
            fontSize,
            cellPadding: { top: 1.8, bottom: 1.8, left: 2, right: 2 },
            overflow: "linebreak",
            font: "helvetica",
            lineColor: [210, 215, 220],
            lineWidth: 0.2,
          },
          headStyles: {
            fillColor: NAVY,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
            lineWidth: 0,
            fontSize: fontSize + 0.5,
          },
          columnStyles: colStyles,
          tableLineColor: SAGE,
          tableLineWidth: 0.5,
          didParseCell: (() => {
            let dataRowIdx = 0;
            let lastRowIndex = -1;
            return (cellData: any) => {
              if (cellData.section !== "body") return;
              const idx = cellData.row.index;
              if (idx >= rows.length) return;
              const row = rows[idx];

              if (row.type === "header" || row.isHeader) {
                cellData.cell.styles.fontStyle = "bold";
                cellData.cell.styles.fillColor = SEC_BG;
                cellData.cell.styles.lineWidth = { top: 0.5 };
                cellData.cell.styles.lineColor = { top: SAGE };
              } else if (row.type === "total" || row.type === "subtotal" || row.isBold) {
                cellData.cell.styles.fontStyle = "bold";
                cellData.cell.styles.lineWidth = { top: 0.4 };
                cellData.cell.styles.lineColor = { top: [180, 185, 190] };
              } else if (row.isItalic || row.type === "formula") {
                cellData.cell.styles.fontStyle = "italic";
                cellData.cell.styles.textColor = GRAY;
                cellData.cell.styles.fontSize = (cellData.cell.styles.fontSize || fontSize) - 0.5;
                if (idx !== lastRowIndex) { dataRowIdx++; lastRowIndex = idx; }
                if (dataRowIdx % 2 === 0) cellData.cell.styles.fillColor = ALT_ROW;
              } else {
                if (idx !== lastRowIndex) { dataRowIdx++; lastRowIndex = idx; }
                if (dataRowIdx % 2 === 0) cellData.cell.styles.fillColor = ALT_ROW;
              }

              if (cellData.column.index > 0 && !row.isHeader && row.type !== "header") {
                cellData.cell.styles.font = "courier";
              }
            };
          })(),
          didDrawPage: () => {
            drawPageChrome();
          },
        });
      }
    }
  }

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);

    if (coverPageNumbers.has(pg)) continue;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(153, 153, 153);
    doc.text(`${company}`, 16, pageH - 5);
    doc.text("CONFIDENTIAL", pageW / 2, pageH - 5, { align: "center" });
    doc.text(`${pg} / ${totalPages}`, pageW - 16, pageH - 5, { align: "right" });
  }

  const arrayBuf = doc.output("arraybuffer");
  return Buffer.from(arrayBuf);
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
  data: PremiumExportRequest
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

  logger.info(`[template] Calling Gemini for JSON structure...`, "premium-export");
  const aiResult = await generateWithGemini(prompt, data.format);
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

      logger.info(`Generating premium ${data.format} via Gemini + template pipeline for "${data.entityName}"...`, "premium-export");
      const buffer = await generateViaTemplatePipeline(data);
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
}
