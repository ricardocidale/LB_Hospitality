export const BRAND = {
  NAVY_HEX: "1A2332",
  SAGE_HEX: "9FBCA4",
  DARK_GREEN_HEX: "257D41",
  DARK_TEXT_HEX: "3D3D3D",
  GRAY_HEX: "666666",
  WHITE_HEX: "FFFFFF",
  SECTION_BG_HEX: "EFF5F0",
  ALT_ROW_HEX: "F8FAF9",
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

export function getPdfPrompt(data: ExportDataShape): string {
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
