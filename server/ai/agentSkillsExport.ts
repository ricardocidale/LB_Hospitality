import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "./clients";

const BETAS = [
  "code-execution-2025-08-25",
  "skills-2025-10-02",
  "files-api-2025-04-14",
] as const;

const SKILL_MAP: Record<string, string> = {
  pdf: "pdf",
  pptx: "pptx",
  docx: "docx",
  xlsx: "xlsx",
};

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

function getClient(apiKey?: string, baseURL?: string): Anthropic {
  // Use centralized singleton when no custom credentials are provided
  if (!apiKey) return getAnthropicClient();
  return new Anthropic({ apiKey, baseURL });
}

function extractFileIds(response: any): string[] {
  const fileIds: string[] = [];

  for (const block of response.content || []) {
    if (block.type === "code_execution_result") {
      const content = block.content || [];
      for (const item of content) {
        if (item.type === "file" && item.file_id) {
          fileIds.push(item.file_id);
        }
      }
    }
    if (block.type === "server_tool_use" && block.input?.file_id) {
      fileIds.push(block.input.file_id);
    }
  }

  if (fileIds.length === 0) {
    const fullText = JSON.stringify(response.content);
    const matches = fullText.match(/file_[a-zA-Z0-9_-]+/g);
    if (matches) {
      const seen: Record<string, boolean> = {};
      for (const m of matches) {
        if (!seen[m]) {
          seen[m] = true;
          fileIds.push(m);
        }
      }
    }
  }

  return fileIds;
}

export async function generateWithAgentSkills(
  options: AgentSkillsExportOptions
): Promise<AgentSkillsResult> {
  const { format, prompt, apiKey, baseURL } = options;
  const client = getClient(apiKey, baseURL);
  const skillId = SKILL_MAP[format];

  if (!skillId) {
    throw new Error(`No Agent Skill available for format: ${format}`);
  }

  console.log(`[agent-skills] Requesting ${format} generation via Agent Skills...`);

  const response = await (client.beta as any).messages.create(
    {
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 16384,
      betas: Array.from(BETAS),
      container: {
        skills: [
          {
            type: "anthropic",
            skill_id: skillId,
            version: "latest",
          },
        ],
      },
      tools: [
        {
          type: "code_execution_20250825",
          name: "code_execution",
        },
      ],
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    },
    {
      headers: {
        "anthropic-beta": BETAS.join(","),
      },
    }
  );

  console.log(`[agent-skills] Response received, extracting files...`);

  const fileIds = extractFileIds(response);

  if (fileIds.length === 0) {
    console.error("[agent-skills] No file IDs found in response. Content blocks:", 
      JSON.stringify(response.content?.map((b: any) => b.type)));
    throw new Error("Agent Skills did not generate any files");
  }

  console.log(`[agent-skills] Found ${fileIds.length} file(s): ${fileIds.join(", ")}`);

  const fileId = fileIds[fileIds.length - 1];

  const fileResponse = await (client.beta as any).files.content(fileId, {
    headers: {
      "anthropic-beta": "files-api-2025-04-14",
    },
  });

  let buffer: Buffer;
  if (Buffer.isBuffer(fileResponse)) {
    buffer = fileResponse;
  } else if (fileResponse instanceof ArrayBuffer) {
    buffer = Buffer.from(fileResponse);
  } else if (typeof fileResponse.arrayBuffer === "function") {
    const ab = await fileResponse.arrayBuffer();
    buffer = Buffer.from(ab);
  } else if (typeof fileResponse.read === "function") {
    buffer = await fileResponse.read();
  } else {
    buffer = Buffer.from(fileResponse);
  }

  console.log(`[agent-skills] File downloaded: ${buffer.length} bytes`);

  if (buffer.length < 100) {
    throw new Error(`Agent Skills generated an unexpectedly small file (${buffer.length} bytes)`);
  }

  return {
    buffer,
    filename: `export.${format}`,
  };
}

export function buildAgentSkillsPrompt(
  format: string,
  financialData: string,
  entityName: string,
  companyName: string,
  memoSections?: Record<string, string | undefined>
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

  if (format === "pdf") {
    return `Create a professional landscape-oriented PDF financial report.

${brandInstructions}

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
