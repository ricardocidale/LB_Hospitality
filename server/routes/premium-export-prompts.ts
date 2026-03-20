export const BRAND = {
  NAVY_HEX: "18181B",
  SAGE_HEX: "3F3F46",
  DARK_GREEN_HEX: "10B981",
  DARK_TEXT_HEX: "09090B",
  GRAY_HEX: "E4E4E7",
  WHITE_HEX: "FFFFFF",
  SECTION_BG_HEX: "FFFFFF",
  ALT_ROW_HEX: "F4F4F5",
  LIGHT_GRAY_HEX: "A1A1AA",
  NEGATIVE_RED_HEX: "EF4444",
};

interface ExportDataShape {
  entityName: string;
  companyName?: string;
  format: string;
  orientation?: string;
  version?: string;
  statementType?: string;
  years?: string[];
  rows?: { category: string; values: (string | number)[]; indent?: number; isBold?: boolean; isHeader?: boolean; isItalic?: boolean }[];
  statements?: { title: string; years: string[]; rows: { category: string; values: (string | number)[]; indent?: number; isBold?: boolean; isHeader?: boolean }[] }[];
  metrics?: { label: string; value: string }[];
  memoSections?: { executiveSummary?: string; investmentThesis?: string; marketOverview?: string; financialHighlights?: string; riskFactors?: string; conclusion?: string };
}

export function buildFinancialDataContext(data: ExportDataShape): string {
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

export function getExcelPrompt(data: ExportDataShape): string {
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

export function getPptxPrompt(data: ExportDataShape): string {
  const versionHint = data.version === "extended"
    ? "Include detailed financial tables with all line-item breakdowns."
    : "Show summary-level metrics and key aggregates only.";
  return `You are generating a premium PowerPoint investor presentation. Detail level: ${data.version || "short"}. ${versionHint} Based on the financial data below, produce a JSON structure for slide generation with enhanced layouts.

IMPORTANT STYLING RULES — YOU MUST FOLLOW THESE:
- Do NOT include any color values, hex codes, or color names in your output.
- Do NOT suggest gradients, shadows, or visual effects.
- Colors and styling are applied programmatically by the rendering engine. Your job is ONLY to structure content.
- Focus exclusively on slide types, titles, data organization, and textual content.

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

export function getPdfPrompt(data: ExportDataShape): string {
  const isShort = data.version !== "extended";
  const versionHint = isShort
    ? "SHORT version: include ONLY header rows, bold totals, and key subtotals. Omit individual line-item breakdowns. Keep each financial table compact."
    : "EXTENDED version: include all line-item breakdowns and detailed sub-categories.";
  return `You are generating a data-focused ${data.orientation || "landscape"}-oriented PDF financial report. Detail level: ${data.version || "short"}. ${versionHint}

IMPORTANT RULES:
- This report is DATA ONLY. Do NOT include executive_summary, analysis, or notes sections.
- Only include: cover, metrics_dashboard, and financial_table sections.
- No prose paragraphs, no observations, no written commentary.
- Focus on clean presentation of the financial statements and metrics.

Financial Data:
${buildFinancialDataContext(data)}

Return a JSON object with this structure:
{
  "sections": [
    {
      "type": "cover",
      "title": "Report Title"
    },
    {
      "type": "metrics_dashboard",
      "title": "Key Performance Metrics",
      "content": {
        "metrics": [{"label": "...", "value": "...", "description": "brief 3-5 word description"}]
      }
    },
    {
      "type": "financial_table",
      "title": "Statement Title",
      "content": {
        "years": ["..."],
        "rows": [{"category": "...", "values": [...], "type": "header|data|subtotal|total", "indent": 0}]
      }
    }
  ],
  "report_title": "Full report title",
  "confidential_notice": "Confidential — For authorized recipients only"
}

RESPOND WITH ONLY VALID JSON.`;
}

export function getPdfDesignPrompt(data: ExportDataShape, themeColors?: Array<{name: string; hexCode: string}>): string {
  const isShort = data.version !== "extended";
  const orientation = data.orientation || "landscape";
  const colorPalette = themeColors?.length
    ? themeColors.map(c => `${c.name}: ${c.hexCode}`).join(", ")
    : `Carbon: #${BRAND.NAVY_HEX}, Graphite: #${BRAND.SAGE_HEX}, Emerald: #${BRAND.DARK_GREEN_HEX}, Ink: #${BRAND.DARK_TEXT_HEX}`;

  return `You are a senior graphic designer at a top-tier investment bank. A client handed you this financial data for their hospitality portfolio. Design a ${orientation} PDF report that tells the investment story visually.

Think like a designer, not an engineer:
- What is the hero number? What grabs attention first?
- How does the reader's eye flow through the pages?
- Where do you create visual breathing room (white space)?
- What makes this look like a $100K custom report, not a template?
- Use color psychology: bold accent for wins, subtle neutral for supporting data
- The report should have a narrative arc: setup (cover) → evidence (statements) → conclusion (analysis)

FINANCIAL DATA:
${buildFinancialDataContext(data)}

BRAND PALETTE: ${colorPalette}

VERSION: ${isShort ? "Summary — show only the key totals/headers per statement (like chevrons closed). Clean, executive-level." : "Detailed — show all line items with full breakdowns. Comprehensive analyst-level."}

ORIENTATION: ${orientation} (${orientation === "landscape" ? "406.4mm × 228.6mm, wide format" : "215.9mm × 279.4mm, US Letter"})

STATEMENTS TO INCLUDE: ${data.statements?.map(s => s.title).join(", ") || "Income Statement, Cash Flow, Balance Sheet, Investment Analysis"}

Return a JSON object describing your design vision:
{
  "recommended_orientation": "landscape" | "portrait",
  "design_vision": "2-3 sentence description of the overall visual concept",
  "cover": {
    "headline": "Bold title for the cover",
    "tagline": "Compelling subtitle that highlights the strongest data point",
    "visual_style": "dark_dramatic" | "clean_minimal" | "corporate_elegant"
  },
  "pages": [
    {
      "type": "metrics_dashboard",
      "title": "Page title",
      "design_notes": "How this page should feel visually",
      "hero_metric": "The single most impressive metric to make largest",
      "metrics": [
        { "label": "Metric Name", "value": "Formatted Value", "visual_weight": "hero" | "primary" | "secondary" }
      ],
      "insight_callout": "1 sentence key takeaway for this section"
    },
    {
      "type": "financial_table",
      "statement_title": "Exact title matching one of the statements",
      "design_notes": "How this table should be styled",
      "highlight_categories": ["Row names that deserve visual emphasis"],
      "insight_callout": "1 sentence observation about this statement's data"
    },
    {
      "type": "line_chart",
      "title": "Chart page title",
      "for_statement": "Which statement this chart accompanies",
      "series": [
        { "label": "Series Name", "color_intent": "primary" | "accent" | "muted" | "warn" }
      ],
      "design_notes": "Chart style guidance — area fills, gradient, minimal, bold"
    }
  ]
}

RULES:
- Every financial statement MUST have a table page followed by a line chart page
- The chart series must match real data keys from the statements (Revenue, GOP, NOI, ANOI, CFO, FCFE, Total Assets, etc.)
- Do NOT invent or hallucinate financial numbers — only reference metrics and labels from the data provided
- Investment Analysis section may use a different visual treatment (KPI cards before the table)
- RESPOND WITH ONLY VALID JSON`;
}

export function getDocxPrompt(data: ExportDataShape): string {
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
