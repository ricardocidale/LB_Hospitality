import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { executeComputationTool, isComputationTool } from "../calc/dispatch.js";

interface ResearchParams {
  type: "property" | "company" | "global";
  propertyLabel?: string;
  propertyContext?: {
    name: string;
    location: string;
    market: string;
    roomCount: number;
    startAdr: number;
    maxOccupancy: number;
    type: string;
    purchasePrice?: number;
  };
  assetDefinition: {
    minRooms: number;
    maxRooms: number;
    hasFB: boolean;
    hasEvents: boolean;
    hasWellness: boolean;
    minAdr: number;
    maxAdr: number;
    level?: string;
    eventLocations?: number;
    maxEventCapacity?: number;
    acreage?: number;
    privacyLevel?: string;
    parkingSpaces?: number;
    description?: string;
  };
}

const RESEARCH_SKILLS_DIR = join(process.cwd(), ".claude", "skills", "research");

const PROPERTY_RESEARCH_SKILLS = [
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
];

const SKILL_FOLDER_MAP: Record<string, string | string[]> = {
  property: PROPERTY_RESEARCH_SKILLS,
  company: "company-research",
  global: "global-research",
};

type ToolPromptBuilder = (input: Record<string, any>) => string;

const TOOL_PROMPTS: Record<string, ToolPromptBuilder> = {
  analyze_market: (input) =>
    `Provide market overview analysis for ${input.location} (${input.market_region}). Property type: ${input.property_type}, ${input.room_count} rooms. Include tourism volume, hotel supply metrics, demand trends, RevPAR data, and market positioning for comparable properties in this specific location. Use your knowledge of this market to provide specific, data-backed metrics with industry sources.`,

  analyze_adr: (input) =>
    `Provide ADR analysis for ${input.location}. Current/target ADR: $${input.current_adr}, ${input.room_count} rooms, ${input.property_level} positioning. Has F&B: ${input.has_fb ?? "unknown"}, Events: ${input.has_events ?? "unknown"}, Wellness: ${input.has_wellness ?? "unknown"}. Include market average ADR, comparable property ADR range, at least 4 comparable property ADRs, and a recommended ADR range with rationale.`,

  analyze_occupancy: (input) => {
    const targetOcc = typeof input.target_occupancy === "number" ? (input.target_occupancy * 100).toFixed(0) : "70";
    return `Provide occupancy analysis for ${input.location}. ${input.room_count || 20} rooms, target ${targetOcc}% stabilized occupancy, ${input.property_level || "luxury"} positioning. Include market average occupancy, seasonal patterns (4 seasons with rates and notes), and expected ramp-up timeline.`;
  },

  analyze_event_demand: (input) =>
    `Provide event demand analysis for ${input.location}. ${input.event_locations || 2} event spaces, max capacity ${input.max_event_capacity || 150} guests. Wellness: ${input.has_wellness ?? true}, F&B: ${input.has_fb ?? true}, Privacy: ${input.privacy_level || "high"}, Acreage: ${input.acreage || 5}. Include corporate event demand, wellness retreat potential, wedding/private event demand, estimated event revenue share, and key demand drivers.`,

  analyze_cap_rates: (input) =>
    `Provide cap rate analysis for ${input.location} (${input.market_region}). ${input.property_level} hospitality property, ${input.room_count} rooms${input.purchase_price ? `, purchase price $${input.purchase_price.toLocaleString()}` : ""}. Include market cap rate range, comparable property range, at least 3 comparable transactions with cap rates and sale years, and a recommended acquisition/exit cap rate range.`,

  analyze_competitive_set: (input) =>
    `Provide competitive set analysis for ${input.location}. Subject: ${input.room_count} rooms at $${input.current_adr} ADR, ${input.property_level} positioning. Has events: ${input.has_events ?? true}, wellness: ${input.has_wellness ?? true}, F&B: ${input.has_fb ?? true}. Identify 4-6 comparable properties with room counts, ADRs, and positioning descriptions.`,

  analyze_catering: (input) =>
    `Analyze the catering and F&B revenue uplift for a ${input.property_level || "luxury"} hospitality property in ${input.location}. ${input.room_count || 20} rooms, F&B: ${input.has_fb ?? true}, events: ${input.has_events ?? true}, ${input.event_locations || 2} event spaces, max capacity ${input.max_event_capacity || 150} guests, market: ${input.market_region || "North America"}.

IMPORTANT CONTEXT: In our financial model, all revenue categories are expressed as percentages of ROOM REVENUE, not total revenue. The formula is:
- Base F&B Revenue = Room Revenue × F&B Revenue Share (e.g., 22%)
- Total F&B Revenue = Base F&B × (1 + Catering Boost %)

The "catering boost percentage" is the additional uplift to base F&B from catered events. For example, if base F&B is $100K and catering boost is 30%, total F&B = $130K.

If your market research provides total revenue breakdowns (e.g., "F&B is 35% of total revenue"), you must convert: work backwards from total revenue splits to derive what the catering boost would be on top of the base F&B percentage of room revenue.

Determine the recommended catering boost percentage based on:
- Local market event catering penetration rates
- What proportion of events at comparable properties are fully catered (weddings, galas, corporate dinners) vs. partially catered (retreats with some meals) vs. no catering
- F&B revenue multiplier effect from catered events at comparable properties
- Seasonal variation in catered vs. non-catered events
- Property-specific capabilities (kitchen capacity, event spaces, staff)

Provide a recommended catering boost percentage (typically 15%–50%), market range, rationale, event mix breakdown, and key factors specific to this property's market.`,

  analyze_land_value: (input) =>
    `Provide land value allocation analysis for ${input.location} (${input.market_region}). Property type: ${input.property_type}, ${input.acreage || 10}+ acres, ${input.room_count || 20} rooms, purchase price: $${(input.purchase_price || 0).toLocaleString()}, building improvements: $${(input.building_improvements || 0).toLocaleString()}, setting: ${input.setting || "rural estate"}. Determine the appropriate percentage of the purchase price attributable to land vs. building/improvements for IRS depreciation purposes. Consider: local land values per acre, ratio of land to total property value in this market, whether the property is in a high-land-value area (urban/resort) vs. lower-value rural setting, comparable hotel land allocations, and county tax assessor land-to-improvement ratios. Provide a recommended land value percentage, market range, assessment methodology, rationale, and key factors.`,

  analyze_operating_costs: (input) =>
    `Analyze operating cost benchmarks for a ${input.property_level || "luxury"} hotel in ${input.location}. ${input.room_count || 20} rooms, ADR: $${input.current_adr || 300}, F&B: ${input.has_fb ?? true}, Events: ${input.has_events ?? true}, Market: ${input.market_region || "North America"}.

CRITICAL: Different costs have different calculation bases. You MUST provide rates with the correct base:

ROOM REVENUE-BASED (% of Room Revenue):
- Housekeeping: cleaning labor, linens, guest supplies, room maintenance (USALI Rooms Dept)
- F&B Cost of Sales: kitchen labor, food costs, beverages, dining operations (USALI F&B Dept)

TOTAL REVENUE-BASED (% of Total Revenue):
- Admin & General: management salaries, accounting, legal, HR (USALI A&G) — fixed base, escalates with inflation
- Property Ops: engineering, repairs, grounds, facilities (USALI POM) — fixed base, escalates with inflation
- Utilities: electricity, gas, water, sewer (split variable/fixed)
- FF&E Reserve: furniture, fixtures, equipment replacement set-aside (industry standard 3-5%)
- Marketing: property-level advertising, OTA commissions, local promotions (property-level only, brand marketing is management company service)
- IT: WiFi, in-room tech, basic support (property-level only, core IT is management company service)
- Other: miscellaneous operating expenses — fixed base, escalates with inflation

Provide recommended rates for each category, industry ranges, and rationale. Use USALI standards, PKF Trends, STR HOST, and CBRE benchmarks.`,

  analyze_property_value_costs: (input) =>
    `Analyze property value-based costs for a ${input.property_level || "luxury"} hotel in ${input.location}. ${input.room_count || 20} rooms, purchase price: $${(input.purchase_price || 0).toLocaleString()}, building improvements: $${(input.building_improvements || 0).toLocaleString()}, market: ${input.market_region || "North America"}.

These costs are calculated as a percentage of TOTAL PROPERTY VALUE (Purchase Price + Building Improvements), NOT revenue:
- Monthly Cost = (Property Value / 12) × Rate × Annual Escalation Factor

Provide recommended rates for:
1. Insurance: property liability, damage, workers comp, business interruption coverage
2. Property Taxes: real estate taxes and assessments based on local jurisdiction

Include jurisdiction-specific context (local tax rates, assessment ratios, insurance market conditions) and industry benchmarks.`,

  analyze_management_service_fees: (input) =>
    `Analyze management company service fee benchmarks for a ${input.property_level || "luxury"} boutique hotel in ${input.location}. ${input.room_count || 20} rooms, F&B: ${input.has_fb ?? true}, Events: ${input.has_events ?? true}, Market: ${input.market_region || "North America"}.

The management company charges 5 service fee categories, each as a % of Total Revenue:
1. Marketing: brand strategy, digital marketing, loyalty programs, business development
2. IT: PMS systems, accounting systems, network infrastructure, cybersecurity
3. Accounting: financial reporting, budgeting, audit coordination, treasury management
4. Reservations: central reservation system, revenue management, distribution channels
5. General Management: executive oversight, strategic planning, compliance, HR support

Plus an Incentive Management Fee as % of Gross Operating Profit (GOP), paid only when GOP > 0.

Provide recommended rates for each category, total service fee rate, incentive fee rate, industry ranges from management contract databases, and rationale. Consider that smaller boutique properties often pay higher management fee percentages.`,

  analyze_income_tax: (input) =>
    `Analyze income tax rates for a hotel property SPV entity in ${input.location}. Market: ${input.market_region || "North America"}, Entity type: ${input.entity_type || "LLC"}, Property value: $${(input.purchase_price || 0).toLocaleString()}.

Tax is applied to TAXABLE INCOME = NOI - Interest Expense - Depreciation.

Provide:
1. Recommended effective combined tax rate for this jurisdiction
2. Breakdown: federal rate, state/provincial rate, local rate (if applicable)
3. Effective range accounting for deductions and credits
4. SPV entity structure considerations (pass-through vs C-Corp)
5. Any hospitality-specific tax incentives

For US properties: Federal (21% C-Corp or pass-through) + State (0-13.3%) + Local
For Latin America: Country-specific corporate rates (Mexico ~30%, Costa Rica ~30%, etc.)`,
};

const isDev = process.env.NODE_ENV === "development";
const skillCache = new Map<string, string>();
let toolCache: Anthropic.Tool[] | null = null;

function loadSkill(type: string): string {
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
    content = mapping
      .map((folder) => {
        const skillPath = join(RESEARCH_SKILLS_DIR, folder, "SKILL.md");
        return readFileSync(skillPath, "utf-8");
      })
      .join("\n\n---\n\n");
  } else {
    const skillPath = join(RESEARCH_SKILLS_DIR, mapping, "SKILL.md");
    content = readFileSync(skillPath, "utf-8");
  }

  skillCache.set(type, content);
  return content;
}

function loadToolDefinitions(): Anthropic.Tool[] {
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
          tools.push({
            name: content.name,
            description: content.description,
            input_schema: content.input_schema,
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
  scanDir(globalToolsDir);

  toolCache = tools;
  return tools;
}

function validateSkillFolders(): void {
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

validateSkillFolders();

function handleToolCall(name: string, input: Record<string, any>): string {
  const promptBuilder = TOOL_PROMPTS[name];
  if (promptBuilder) {
    return promptBuilder(input);
  }
  const result = executeComputationTool(name, input);
  return result ?? `Unknown tool: ${name}. Please proceed with your analysis.`;
}

// Build user prompt based on research type and context
function buildUserPrompt(params: ResearchParams): string {
  const { type, propertyContext, assetDefinition: bd, propertyLabel: pl } = params;
  const label = pl || "boutique hotel";
  
  if (type === "property" && propertyContext) {
    return `Analyze the market for this ${label.toLowerCase()} property:
- Property: ${propertyContext.name}
- Location: ${propertyContext.location}
- Market: ${propertyContext.market}
- Room Count: ${propertyContext.roomCount}
- Current ADR: $${propertyContext.startAdr}
- Target Occupancy: ${(propertyContext.maxOccupancy * 100).toFixed(0)}%
- Property Type: ${propertyContext.type}
${propertyContext.purchasePrice ? `- Purchase Price: $${propertyContext.purchasePrice.toLocaleString()}` : ""}

${label} definition: ${bd.description || "Independently operated, design-forward properties with curated guest experiences."}
- Property level: ${bd.level || "luxury"}
- Room range: ${bd.minRooms}–${bd.maxRooms} rooms
- ADR range: $${bd.minAdr}–$${bd.maxAdr}
- Features: ${[bd.hasFB && "F&B operations", bd.hasEvents && "event hosting", bd.hasWellness && "wellness programming"].filter(Boolean).join(", ")}
- Event locations: ${bd.eventLocations ?? 2}
- Max event capacity: ${bd.maxEventCapacity ?? 150} people
- Acreage: ${bd.acreage ?? 5} acres
- Privacy: ${bd.privacyLevel || "high"}
- Parking: ${bd.parkingSpaces ?? 50} spaces

Use the available tools to gather data on each analysis dimension, then synthesize your findings into the required JSON format. Call each tool to build your analysis, then provide the final synthesized research as a JSON object.`;
  }
  
  if (type === "company") {
    return `Provide comprehensive research on hotel management company fee structures, GAAP standards, and industry benchmarks for a ${label.toLowerCase()} management company focused on:
1. Base management fee structures and industry norms (ASC 606 revenue recognition)
2. Incentive management fee (IMF) structures and triggers
3. GAAP-compliant fee recognition standards
4. Operating expense ratios by department (USALI format)
5. Management company compensation benchmarks
6. Typical contract terms and duration
Focus specifically on ${label.toLowerCase()}s specializing in unique events like wellness retreats, corporate retreats, and experiential hospitality.`;
  }
  
  // global
  return `Provide comprehensive ${label.toLowerCase()} industry research covering:
1. Overall ${label.toLowerCase()} market size, growth, and trends
2. Event-focused hospitality: wellness retreats, corporate events, yoga retreats, relationship/couples retreats market data
3. Financial benchmarks: ADR, occupancy, RevPAR trends for ${label.toLowerCase()}s
4. Capitalization rates and investment returns
5. Debt market conditions for hotel acquisitions
6. Emerging trends in experiential hospitality
Focus on North America and Latin America markets. Include specific data points, market sizes, growth rates, and cite sources.`;
}

// Main streaming research generation with tool use
export async function* generateResearchWithToolsStream(
  params: ResearchParams,
  anthropic: Anthropic,
  model: string
): AsyncGenerator<{ type: "content" | "done" | "error"; data: string }> {
  const systemPrompt = loadSkill(params.type);
  const tools = loadToolDefinitions();
  const userPrompt = buildUserPrompt(params);
  
  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt }
  ];
  
  const maxIterations = 10;
  let iteration = 0;
  
  while (iteration < maxIterations) {
    iteration++;
    
    const response = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages,
      tools: params.type === "property" ? tools : undefined,
      tool_choice: params.type === "property" ? { type: "auto" } : undefined,
    });
    
    // Check if there are tool use blocks
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ContentBlock & { type: "tool_use" } => 
        block.type === "tool_use"
    );
    
    const textBlocks = response.content.filter(
      (block): block is Anthropic.ContentBlock & { type: "text" } => 
        block.type === "text"
    );
    
    // Stream any text content
    for (const block of textBlocks) {
      if (block.text) {
        yield { type: "content", data: block.text };
      }
    }
    
    // If no tool calls, we're done
    if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
      break;
    }
    
    // Process tool calls
    messages.push({ role: "assistant", content: response.content });
    
    const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((toolBlock) => ({
      type: "tool_result" as const,
      tool_use_id: toolBlock.id,
      content: handleToolCall(toolBlock.name, toolBlock.input as Record<string, any>),
    }));
    
    messages.push({ role: "user", content: toolResults });
  }
  
  yield { type: "done", data: "" };
}

// Non-streaming variant for seeding
export async function generateResearchWithTools(
  params: ResearchParams,
  anthropic: Anthropic,
  model: string
): Promise<Record<string, any>> {
  let fullText = "";
  
  for await (const chunk of generateResearchWithToolsStream(params, anthropic, model)) {
    if (chunk.type === "content") {
      fullText += chunk.data;
    }
  }
  
  try {
    // Extract JSON from the response (may be wrapped in markdown code blocks)
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/) || 
                      fullText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    return { rawResponse: fullText };
  } catch {
    return { rawResponse: fullText };
  }
}

export { loadSkill, loadToolDefinitions, buildUserPrompt, handleToolCall };
export type { ResearchParams };
