const BRAND = {
  NAVY: "#1A2332",
  SAGE: "#9FBCA4",
  DARK_GREEN: "#257D41",
  SECTION_BG: "#EFF5F0",
  ALT_ROW: "#F8FAF9",
  DARK_TEXT: "#3D3D3D",
  GRAY: "#666666",
  WHITE: "#FFFFFF",
};

export interface AgentSkillsExportOptions {
  format: "pdf" | "pptx" | "docx";
  prompt: string;
  apiKey: string;
  baseURL?: string;
}

export interface AgentSkillsResult {
  buffer: Buffer;
  filename: string;
}

export async function generateWithAgentSkills(
  _options: AgentSkillsExportOptions
): Promise<AgentSkillsResult> {
  console.warn(`[agent-skills] Agent Skills beta APIs are not available via the current AI proxy. Falling back to template pipeline.`);
  throw new Error("Agent Skills beta APIs not supported by current AI proxy");
}

export function buildAgentSkillsPrompt(
  format: string,
  financialData: string,
  entityName: string,
  companyName: string,
  memoSections?: Record<string, string | undefined>,
  orientation: "landscape" | "portrait" = "landscape",
  version: "short" | "extended" = "short"
): string {
  const brandInstructions = `
Use this exact brand palette throughout:
- Primary Navy: ${BRAND.NAVY} (headers, title backgrounds)
- Sage Green: ${BRAND.SAGE} (accents, table header backgrounds, divider lines)
- Dark Green: ${BRAND.DARK_GREEN} (section headings, positive values)
- Section Background: ${BRAND.SECTION_BG} (section header rows in tables)
- Alternating Row: ${BRAND.ALT_ROW} (every other data row)
- Body Text: ${BRAND.DARK_TEXT}
- Secondary Text: ${BRAND.GRAY}
- Font: Arial throughout

Company: ${companyName}
Entity: ${entityName}
Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
`;

  const versionInstructions = version === "extended"
    ? "Include all line-item breakdowns, sub-categories, and detailed financial tables with full row-level data."
    : "Show summary-level figures only — top-level totals and key aggregates without line-item breakdowns.";

  if (format === "pdf") {
    return `Create a professional ${orientation}-oriented PDF financial report.

${brandInstructions}

Report detail level: ${version === "extended" ? "Extended" : "Short"}
${versionInstructions}

Design requirements:
- Cover page with Navy background, company name in Sage, report title in White
- "Confidential — For authorized recipients only" notice
- Key Metrics dashboard section with rounded metric cards (Sage border, light green fill)
- Financial tables with Sage header row (white text), alternating row shading, proper number formatting
- Currency values: use $X,XXX format, negatives in parentheses ($X,XXX)
- Zero values displayed as em-dash (—)
- Bold section headers and total/subtotal rows
- Indented sub-line items (2-space indent per level)
- Executive summary with trend analysis and observations
- Page footers: "${companyName} — Confidential" left-aligned, "Page X of Y" right-aligned
- Sage green divider line above footer

Financial Data:
${financialData}`;
  }

  if (format === "pptx") {
    return `Create a professional widescreen (16:9) PowerPoint investor presentation.

${brandInstructions}

Report detail level: ${version === "extended" ? "Extended" : "Short"}
${versionInstructions}

Slide design requirements:
1. Title Slide: Navy background, Sage accent bar at top, company name in Sage, title in White, subtitle below
2. Key Metrics Slide: metric cards in a 3-column grid, each with rounded border (Sage), large value in Dark Green, label in Gray. Include trend arrows (▲ up / ▼ down)
3. Financial Table Slides: Sage header row with white bold text, alternating row shading, section headers in Section Background color. Currency formatting: $X.XM or $X,XXX. Bold totals/subtotals.
4. Summary/Takeaways Slide: bullet points for key takeaways, arrow (→) prefix for recommendations
5. Every slide: Sage divider line near bottom, "${companyName} — Confidential" footer in small gray italic

Table formatting rules:
- First column (labels) left-aligned, wider (≈30% of table width)
- Data columns right-aligned
- Section header rows: bold, Section Background fill
- Total/subtotal rows: bold
- Zero values: em-dash (—)
- Negative values: parentheses

Financial Data:
${financialData}`;
  }

  if (format === "docx") {
    const memoContent = memoSections
      ? Object.entries(memoSections)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : "";

    return `Create a professional Word document investor memo / due diligence report.

${brandInstructions}

Report detail level: ${version === "extended" ? "Extended" : "Short"}
${versionInstructions}

Document structure:
1. Header: Company name in Sage, document title in large Navy bold, subtitle with date, "Confidential" notice, Sage divider border
2. Executive Summary — investment thesis and key highlights
3. Market Overview — positioning and competitive landscape
4. Financial Performance — narrative with key metrics inline, reference the data below
5. Risk Factors — identified risks with mitigations
6. Conclusion — recommendation summary
7. Appendix — detailed financial tables

Formatting rules:
- Heading 1: Dark Green, bold
- Heading 2: Dark Green, slightly smaller
- Body text: Arial 11pt
- Bullet lists for key points
- Key-value pairs for metrics (bold label, normal value)
- Financial tables: Sage header row (white text), alternating row shading, right-aligned numbers
- Currency: $X,XXX format, negatives in parentheses
- Page margins: 1 inch all sides

${memoContent ? `\nProvided memo content to incorporate:\n${memoContent}\n` : ""}

Financial Data:
${financialData}`;
  }

  throw new Error(`Unsupported format for Agent Skills prompt: ${format}`);
}
