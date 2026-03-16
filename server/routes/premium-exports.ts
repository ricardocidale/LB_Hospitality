import { type Express, type Request, type Response } from "express";
import { getAnthropicClient } from "../ai/clients";
import { requireAuth } from "../auth";
import { z } from "zod";
import { generateWithAgentSkills, buildAgentSkillsPrompt } from "../ai/agentSkillsExport";
import { AI_GENERATION_TIMEOUT_MS } from "../constants";
import { logger } from "../logger";

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

// Using centralized singleton from server/ai/clients.ts

const BRAND = {
  NAVY_HEX: "1A2332",
  SAGE_HEX: "9FBCA4",
  DARK_GREEN_HEX: "257D41",
  DARK_TEXT_HEX: "3D3D3D",
  GRAY_HEX: "666666",
  WHITE_HEX: "FFFFFF",
  SECTION_BG_HEX: "EFF5F0",
  ALT_ROW_HEX: "F8FAF9",
};

function buildFinancialDataContext(data: PremiumExportRequest): string {
  const parts: string[] = [];
  parts.push(`Entity: ${data.entityName}`);
  parts.push(`Company: ${data.companyName}`);

  if (data.metrics?.length) {
    parts.push("\nKey Metrics:");
    data.metrics.forEach(m => parts.push(`  ${m.label}: ${m.value}`));
  }

  if (data.statements?.length) {
    data.statements.forEach(stmt => {
      parts.push(`\n${stmt.title}:`);
      parts.push(`Years: ${stmt.years.join(", ")}`);
      stmt.rows.forEach(row => {
        const indent = row.indent ? "  ".repeat(row.indent) : "";
        const prefix = row.isHeader ? "[SECTION] " : row.isBold ? "[TOTAL] " : "";
        const vals = row.values.map(v =>
          typeof v === "number" ? (v === 0 ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 0 })) : v
        ).join(" | ");
        parts.push(`  ${indent}${prefix}${row.category}: ${vals}`);
      });
    });
  } else if (data.rows?.length && data.years?.length) {
    parts.push(`\n${data.statementType || "Financial Statement"}:`);
    parts.push(`Years: ${data.years.join(", ")}`);
    data.rows.forEach(row => {
      const indent = row.indent ? "  ".repeat(row.indent) : "";
      const prefix = row.isHeader ? "[SECTION] " : row.isBold ? "[TOTAL] " : "";
      const vals = row.values.map(v =>
        typeof v === "number" ? (v === 0 ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 0 })) : v
      ).join(" | ");
      parts.push(`  ${indent}${prefix}${row.category}: ${vals}`);
    });
  }

  return parts.join("\n");
}

function getExcelPrompt(data: PremiumExportRequest): string {
  const versionHint = data.version === "extended"
    ? "Include all line-item breakdowns and detailed sub-categories in each sheet."
    : "Show summary-level totals and key aggregates only.";
  return `You are generating a premium Excel financial workbook. Detail level: ${data.version || "short"}. ${versionHint} Based on the financial data below, produce a JSON structure for Excel generation with enhanced formatting.

Brand palette:
- Navy: #${BRAND.NAVY_HEX} (header backgrounds)
- Sage Green: #${BRAND.SAGE_HEX} (accent, table headers)
- Dark Green: #${BRAND.DARK_GREEN_HEX} (titles, positive values)
- Section Background: #${BRAND.SECTION_BG_HEX}
- Alternating Row: #${BRAND.ALT_ROW_HEX}

Financial Data:
${buildFinancialDataContext(data)}

Return a JSON object with this structure:
{
  "sheets": [
    {
      "name": "Sheet Name",
      "title": "Sheet Title",
      "subtitle": "Optional subtitle",
      "years": ["Year1", "Year2", ...],
      "rows": [
        {
          "category": "Row Label",
          "values": [number or string values],
          "type": "header" | "data" | "subtotal" | "total" | "formula",
          "indent": 0-2,
          "formula_notes": "optional formula explanation"
        }
      ],
      "summary_metrics": [{"label": "...", "value": "..."}],
      "conditional_formatting": [
        {"range": "description", "rule": "positive_green_negative_red" | "data_bars" | "top_bottom"}
      ]
    }
  ],
  "workbook_summary": "Brief description for the summary sheet"
}

Include enhanced formatting instructions like conditional formatting rules, formula notes, and summary metrics that wouldn't be possible with basic client-side generation. Add a summary dashboard sheet if there are multiple financial statements. RESPOND WITH ONLY VALID JSON.`;
}

function getPptxPrompt(data: PremiumExportRequest): string {
  const versionHint = data.version === "extended"
    ? "Include detailed financial tables with all line-item breakdowns."
    : "Show summary-level metrics and key aggregates only.";
  return `You are generating a premium PowerPoint investor presentation. Detail level: ${data.version || "short"}. ${versionHint} Based on the financial data below, produce a JSON structure for slide generation with enhanced layouts.

Brand palette:
- Navy: #${BRAND.NAVY_HEX} (title slide backgrounds)
- Sage Green: #${BRAND.SAGE_HEX} (accent bars, table headers)
- Dark Green: #${BRAND.DARK_GREEN_HEX} (headings, positive values)

Financial Data:
${buildFinancialDataContext(data)}

Return a JSON object with this structure:
{
  "slides": [
    {
      "type": "title" | "metrics" | "table" | "comparison" | "summary",
      "title": "Slide Title",
      "subtitle": "Optional subtitle",
      "source_tag": "e.g. Portfolio — 3 Properties",
      "content": {
        // For metrics slides:
        "metrics": [{"label": "...", "value": "...", "trend": "up" | "down" | "stable"}],
        // For table slides:
        "years": ["..."],
        "rows": [{"category": "...", "values": [...], "type": "header|data|subtotal|total", "indent": 0}],
        // For comparison slides:
        "items": [{"name": "...", "metrics": [{"label": "...", "value": "..."}]}],
        // For summary slides:
        "key_takeaways": ["..."],
        "recommendations": ["..."]
      }
    }
  ],
  "presentation_notes": "Brief description"
}

Add insight slides with key takeaways and recommendations that enhance beyond simple data tables. Include trend indicators on metrics. RESPOND WITH ONLY VALID JSON.`;
}

function getPdfPrompt(data: PremiumExportRequest): string {
  const versionHint = data.version === "extended"
    ? "Include all line-item breakdowns and detailed sub-categories."
    : "Show summary-level totals and key aggregates only.";
  return `You are generating a premium ${data.orientation || "landscape"}-oriented PDF financial report. Detail level: ${data.version || "short"}. ${versionHint}

Brand palette:
- Navy: #${BRAND.NAVY_HEX} (header)
- Sage Green: #${BRAND.SAGE_HEX} (accents)
- Dark Green: #${BRAND.DARK_GREEN_HEX} (titles)

Financial Data:
${buildFinancialDataContext(data)}

Return a JSON object with this structure:
{
  "sections": [
    {
      "type": "cover" | "executive_summary" | "metrics_dashboard" | "financial_table" | "analysis" | "notes",
      "title": "Section Title",
      "content": {
        // For executive_summary:
        "paragraphs": ["..."],
        // For metrics_dashboard:
        "metrics": [{"label": "...", "value": "...", "description": "..."}],
        // For financial_table:
        "years": ["..."],
        "rows": [{"category": "...", "values": [...], "type": "header|data|subtotal|total", "indent": 0}],
        // For analysis:
        "observations": ["..."],
        "highlights": [{"metric": "...", "insight": "..."}],
        // For notes:
        "items": ["..."]
      }
    }
  ],
  "report_title": "Full report title",
  "confidential_notice": "Confidential — For authorized recipients only"
}

Add executive summary and analysis sections with financial insights. Include observations about trends, performance highlights, and notable items. RESPOND WITH ONLY VALID JSON.`;
}

function getDocxPrompt(data: PremiumExportRequest): string {
  const versionHint = data.version === "extended"
    ? "Include comprehensive detail with full line-item breakdowns in appendix tables."
    : "Keep the memo concise with summary-level figures and key aggregates only.";
  return `You are generating a professional investor memo / due diligence report as a Word document. Detail level: ${data.version || "short"}. ${versionHint} Based on the financial data below, produce a JSON structure for DOCX generation.

Brand palette:
- Navy: #${BRAND.NAVY_HEX}
- Sage Green: #${BRAND.SAGE_HEX}
- Dark Green: #${BRAND.DARK_GREEN_HEX}

Financial Data:
${buildFinancialDataContext(data)}

${data.memoSections ? `
Provided memo sections to incorporate:
${Object.entries(data.memoSections).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join("\n")}
` : ""}

Return a JSON object with this structure:
{
  "title": "Document Title",
  "subtitle": "Subtitle or date",
  "sections": [
    {
      "heading": "Section Heading",
      "level": 1 | 2,
      "content": [
        {"type": "paragraph", "text": "...", "style": "normal" | "bold" | "italic"},
        {"type": "bullet_list", "items": ["..."]},
        {"type": "table", "headers": ["..."], "rows": [["..."]]},
        {"type": "key_value", "pairs": [{"label": "...", "value": "..."}]}
      ]
    }
  ],
  "appendix": {
    "financial_tables": [
      {
        "title": "Table Title",
        "years": ["..."],
        "rows": [{"category": "...", "values": [...], "type": "header|data|subtotal|total"}]
      }
    ]
  }
}

Generate a comprehensive investor memo with:
1. Executive Summary with investment thesis
2. Market Overview and positioning
3. Financial Performance Summary with key metrics in narrative form
4. Risk Factors and mitigations
5. Conclusion and recommendation
6. Appendix with detailed financial tables

Write in professional investment memo style. Numbers should be formatted as currency where appropriate. RESPOND WITH ONLY VALID JSON.`;
}

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

async function generateWithAnthropic(prompt: string, format: string): Promise<any> {
  const client = getAnthropicClient();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_GENERATION_TIMEOUT_MS);
  let response;
  try {
    response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    }, { signal: controller.signal as any });
  } catch (err: any) {
    if (err?.name === "AbortError" || controller.signal.aborted) {
      throw new Error("AI generation timed out after 120 seconds");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const textBlock = response.content.find(b => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Anthropic");
  }

  let jsonStr = textBlock.text.trim();
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
  const { jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = (autoTableModule as any).default || autoTableModule;

  const doc = new jsPDF({ orientation: data.orientation || "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const NAVY_RGB: [number, number, number] = [26, 35, 50];
  const SAGE_RGB: [number, number, number] = [159, 188, 164];
  const DARK_GREEN_RGB: [number, number, number] = [37, 125, 65];
  const GRAY_RGB: [number, number, number] = [102, 102, 102];
  const DARK_TEXT_RGB: [number, number, number] = [61, 61, 61];
  const SECTION_BG_RGB: [number, number, number] = [239, 245, 240];
  const ALT_ROW_RGB: [number, number, number] = [248, 250, 249];

  let currentPage = 1;

  function drawHeader() {
    doc.setFillColor(...NAVY_RGB);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setFillColor(...SAGE_RGB);
    doc.rect(0, 26, pageW, 2, "F");
  }

  function addNewPage() {
    doc.addPage();
    currentPage++;
  }

  for (let i = 0; i < (aiResult.sections || []).length; i++) {
    const section = aiResult.sections[i];

    if (i > 0 && section.type !== "cover") {
      addNewPage();
    }

    let y = 15;

    if (section.type === "cover") {
      drawHeader();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(data.companyName || "", 14, 12);
      doc.setFontSize(16);
      doc.text(aiResult.report_title || section.title || "", 14, 20);
      y = 36;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...GRAY_RGB);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 14, y);
      y += 8;

      if (aiResult.confidential_notice) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.text(aiResult.confidential_notice, 14, y);
        y += 8;
      }
    } else if (section.type === "executive_summary" || section.type === "analysis" || section.type === "notes") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...DARK_GREEN_RGB);
      doc.text(section.title || "", 14, y);
      doc.setDrawColor(...SAGE_RGB);
      doc.setLineWidth(0.5);
      doc.line(14, y + 2, 80, y + 2);
      y += 10;

      const paragraphs = section.content?.paragraphs || section.content?.observations || section.content?.items || [];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...DARK_TEXT_RGB);
      for (const p of paragraphs) {
        const lines = doc.splitTextToSize(typeof p === "string" ? p : `${p.metric}: ${p.insight}`, pageW - 28);
        for (const line of lines) {
          if (y > pageH - 15) { addNewPage(); y = 15; }
          doc.text(line, 14, y);
          y += 4.5;
        }
        y += 2;
      }

      if (section.content?.highlights) {
        for (const h of section.content.highlights) {
          if (y > pageH - 15) { addNewPage(); y = 15; }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...GRAY_RGB);
          doc.text(`${h.metric}:`, 18, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(40, 40, 40);
          doc.text(h.insight || "", 70, y);
          y += 5;
        }
      }
    } else if (section.type === "metrics_dashboard") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...DARK_GREEN_RGB);
      doc.text(section.title || "Key Metrics", 14, y);
      y += 8;

      const metrics = section.content?.metrics || [];
      const cardW = (pageW - 38) / 3;
      const cardH = 18;
      metrics.forEach((m: any, mi: number) => {
        const col = mi % 3;
        const row = Math.floor(mi / 3);
        const x = 14 + col * (cardW + 5);
        const cy = y + row * (cardH + 4);

        if (cy + cardH > pageH - 15) return;

        doc.setFillColor(245, 249, 246);
        doc.setDrawColor(...SAGE_RGB);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, cy, cardW, cardH, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...DARK_GREEN_RGB);
        doc.text(m.value || "", x + 4, cy + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...GRAY_RGB);
        doc.text(m.label || "", x + 4, cy + 14);
      });
    } else if (section.type === "financial_table") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...DARK_GREEN_RGB);
      doc.text(section.title || "", 14, y);
      y += 6;

      const years = section.content?.years || [];
      const rows = section.content?.rows || [];
      if (years.length && rows.length) {
        const body = rows.map((r: any) => {
          const indent = r.indent ? "  ".repeat(r.indent) : "";
          const vals = (r.values || []).map((v: any) => {
            if (typeof v === "number") {
              if (v === 0) return "—";
              const abs = Math.abs(v);
              const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
              return v < 0 ? `($${s})` : `$${s}`;
            }
            return String(v);
          });
          return [indent + (r.category || ""), ...vals];
        });

        autoTable(doc, {
          startY: y,
          head: [["", ...years]],
          body,
          theme: "grid",
          styles: { fontSize: 7, cellPadding: 1.5, font: "helvetica", lineColor: [200, 205, 210], lineWidth: 0.25 },
          headStyles: { fillColor: SAGE_RGB, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
          columnStyles: { 0: { cellWidth: 50 }, ...Object.fromEntries(years.map((_: any, i: number) => [i + 1, { halign: "right" }])) },
          tableLineColor: SAGE_RGB,
          tableLineWidth: 0.6,
          didParseCell: ((data: any) => {
            if (data.section !== "body") return;
            const idx = data.row.index;
            if (idx >= rows.length) return;
            const row = rows[idx];
            if (row.type === "header") {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.fillColor = SECTION_BG_RGB;
            } else if (row.type === "total" || row.type === "subtotal") {
              data.cell.styles.fontStyle = "bold";
            } else if (idx % 2 === 1) {
              data.cell.styles.fillColor = ALT_ROW_RGB;
            }
          }),
        });
      }
    }
  }

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...SAGE_RGB);
    doc.setLineWidth(0.4);
    doc.line(14, pageH - 10, pageW - 14, pageH - 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(153, 153, 153);
    doc.text(`${data.companyName} — Confidential`, 14, pageH - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageW - 14, pageH - 6, { align: "right" });
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

const AGENT_SKILLS_FORMATS = new Set(["pdf", "pptx", "docx"]);

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

async function generateViaAgentSkills(
  data: PremiumExportRequest
): Promise<Buffer> {
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic API key not configured");

  logger.info(`[agent-skills] Building prompt for ${data.format}...`, "premium-export");
  const financialContext = buildFinancialDataContext(data);
  const prompt = buildAgentSkillsPrompt(
    data.format,
    financialContext,
    data.entityName,
    data.companyName || "Hospitality Business Group",
    data.memoSections as Record<string, string | undefined> | undefined,
    data.orientation || "landscape",
    data.version || "short"
  );

  logger.info(`[agent-skills] Calling Anthropic Agent Skills API...`, "premium-export");
  const result = await generateWithAgentSkills({
    format: data.format as "pdf" | "pptx" | "docx",
    prompt,
    apiKey,
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  });

  logger.info(`[agent-skills] Got buffer: ${result.buffer.length} bytes`, "premium-export");
  return result.buffer;
}

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

  logger.info(`[template] Calling Anthropic for JSON structure...`, "premium-export");
  const aiResult = await generateWithAnthropic(prompt, data.format);
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
      const useAgentSkills = AGENT_SKILLS_FORMATS.has(data.format);

      let buffer: Buffer;

      if (useAgentSkills) {
        logger.info(`Generating ${data.format} via Agent Skills for "${data.entityName}"...`, "premium-export");
        try {
          buffer = await generateViaAgentSkills(data);
          logger.info(`Agent Skills ${data.format} generated (${buffer.length} bytes)`, "premium-export");
        } catch (skillsError: any) {
          logger.warn(`Agent Skills failed for ${data.format}, falling back to template pipeline. Error: ${skillsError?.message || String(skillsError)}`, "premium-export");
          try {
            buffer = await generateViaTemplatePipeline(data);
            logger.info(`Template fallback ${data.format} generated (${buffer.length} bytes)`, "premium-export");
          } catch (fallbackError: any) {
            logger.error(`Template fallback also failed for ${data.format}. Error: ${fallbackError?.message || String(fallbackError)}`, "premium-export");
            throw new Error(`Export failed: Agent Skills error — ${skillsError?.message || "unknown"}. Fallback error — ${fallbackError?.message || "unknown"}`);
          }
        }
      } else {
        logger.info(`Generating ${data.format} via template pipeline for "${data.entityName}"...`, "premium-export");
        buffer = await generateViaTemplatePipeline(data);
        logger.info(`Template ${data.format} generated (${buffer.length} bytes)`, "premium-export");
      }

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
    const hasApiKey = !!(process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY);
    res.json({ available: hasApiKey, formats: ["xlsx", "pptx", "pdf", "docx"] });
  });
}
