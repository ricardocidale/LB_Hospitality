import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";

export const RESEARCH_SKILLS_DIR = join(process.cwd(), ".claude", "skills", "research");

export const PROPERTY_RESEARCH_SKILLS = [
  "market-overview",
  "adr-analysis",
  "occupancy-analysis",
  "event-demand",
  "catering-analysis",
  "cap-rate-analysis",
  "competitive-set",
  "land-value",
  "operating-costs",
  "property-value-costs",
  "management-service-fees",
  "income-tax",
  "local-economics",
  "insurance-costs",
  "marketing-costs",
];

export const SKILL_FOLDER_MAP: Record<string, string | string[]> = {
  property: PROPERTY_RESEARCH_SKILLS,
  company: "company-research",
  global: "global-research",
};

export const isDev = process.env.NODE_ENV === "development";
export const skillCache = new Map<string, string>();
export let toolCache: Anthropic.Tool[] | null = null;

export const CONFIDENCE_PREAMBLE = `## Confidence Scoring (applies to all recommendations)
Every recommended value must include a "confidence" field:
- **conservative**: Below-market/cautious estimate (higher costs, lower revenues, higher cap rates)
- **moderate**: Market-aligned estimate supported by strong comparable data
- **aggressive**: Above-market/optimistic estimate (lower costs, higher revenues, lower cap rates)

## Deterministic Tools
For any arithmetic (RevPAR, room revenue, NOI, depreciation, debt capacity, cost dollar amounts, occupancy schedules, ADR projections, cap rate valuations), call the appropriate compute_* tool. Never compute financial math in prose.
`;

export function loadSkill(type: string): string {
  if (!isDev) {
    const cached = skillCache.get(type);
    if (cached) return cached;
  }

  const mapping = SKILL_FOLDER_MAP[type];
  if (!mapping) {
    throw new Error(`Unknown research type: ${type}. Must be 'property', 'company', or 'global'.`);
  }

  let content: string;
  if (Array.isArray(mapping)) {
    content = CONFIDENCE_PREAMBLE + mapping
      .map((folder) => {
        const skillPath = join(RESEARCH_SKILLS_DIR, folder, "SKILL.md");
        return readFileSync(skillPath, "utf-8");
      })
      .join("\n\n---\n\n");
  } else {
    const skillPath = join(RESEARCH_SKILLS_DIR, mapping, "SKILL.md");
    content = CONFIDENCE_PREAMBLE + readFileSync(skillPath, "utf-8");
  }

  skillCache.set(type, content);
  return content;
}

export function loadToolDefinitions(): Anthropic.Tool[] {
  if (!isDev && toolCache) return toolCache;

  const tools: Anthropic.Tool[] = [];
  const seen = new Set<string>();

  function scanDir(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith(".json")) {
          const content = JSON.parse(readFileSync(fullPath, "utf-8"));
          if (seen.has(content.name)) {
            console.warn(`Duplicate tool definition skipped: ${content.name} in ${fullPath}`);
            continue;
          }
          seen.add(content.name);
          if (!content.input_schema) {
            continue;
          }
          const schema = content.input_schema;
          if (!schema.type) schema.type = "object";
          if (schema.properties && (typeof schema.properties !== "object" || Array.isArray(schema.properties))) {
            console.warn(`Skipping tool with invalid properties: ${content.name} in ${fullPath}`);
            continue;
          }
          tools.push({
            name: content.name,
            description: content.description,
            input_schema: schema,
          });
        }
      }
    } catch {
    }
  }

  for (const folder of PROPERTY_RESEARCH_SKILLS) {
    scanDir(join(RESEARCH_SKILLS_DIR, folder, "tools"));
  }

  const globalToolsDir = join(process.cwd(), ".claude", "tools");
  scanDir(globalToolsDir); // recursive — covers .claude/tools/research/ too

  toolCache = tools;
  return tools;
}

export function validateSkillFolders(): void {
  const allFolders = [...PROPERTY_RESEARCH_SKILLS, "company-research", "global-research"];
  const missing: string[] = [];

  for (const folder of allFolders) {
    const skillPath = join(RESEARCH_SKILLS_DIR, folder, "SKILL.md");
    if (!existsSync(skillPath)) {
      missing.push(folder);
    }
  }

  if (missing.length > 0) {
    console.error(`Missing research skill folders: ${missing.join(", ")}`);
  }
}
