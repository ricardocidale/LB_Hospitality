import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { executeComputationTool, isComputationTool } from "../../calc/dispatch.js";

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
  researchVariables?: {
    focusAreas?: string[];
    regions?: string[];
    timeHorizon?: string;
    customQuestions?: string;
    inflationRate?: number;
    modelDurationYears?: number;
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
    `ADR context: ${input.location}, $${input.current_adr} target, ${input.room_count} rooms, ${input.property_level}. F&B: ${input.has_fb ?? "unknown"}, Events: ${input.has_events ?? "unknown"}, Wellness: ${input.has_wellness ?? "unknown"}. Use compute_adr_projection for multi-year projections. Provide market average, comparable ADRs (4+), and recommended range.`,

  analyze_occupancy: (input) => {
    const targetOcc = typeof input.target_occupancy === "number" ? (input.target_occupancy * 100).toFixed(0) : "70";
    return `Occupancy context: ${input.location}, ${input.room_count || 20} rooms, target ${targetOcc}%, ${input.property_level || "luxury"}. Use compute_occupancy_ramp for month-by-month schedule. Provide market average, seasonal patterns (4 seasons), and ramp-up timeline.`;
  },

  analyze_event_demand: (input) =>
    `Provide event demand analysis for ${input.location}. ${input.event_locations || 2} event spaces, max capacity ${input.max_event_capacity || 150} guests. Wellness: ${input.has_wellness ?? true}, F&B: ${input.has_fb ?? true}, Privacy: ${input.privacy_level || "high"}, Acreage: ${input.acreage || 5}. Include corporate event demand, wellness retreat potential, wedding/private event demand, estimated event revenue share, and key demand drivers.`,

  analyze_cap_rates: (input) =>
    `Cap rate context: ${input.location} (${input.market_region}), ${input.property_level}, ${input.room_count} rooms${input.purchase_price ? `, $${input.purchase_price.toLocaleString()}` : ""}. Use compute_cap_rate_valuation for implied value and sensitivity table. Provide market range, comparable transactions (3+), and recommended acquisition/exit range.`,

  analyze_competitive_set: (input) =>
    `Provide competitive set analysis for ${input.location}. Subject: ${input.room_count} rooms at $${input.current_adr} ADR, ${input.property_level} positioning. Has events: ${input.has_events ?? true}, wellness: ${input.has_wellness ?? true}, F&B: ${input.has_fb ?? true}. Identify 4-6 comparable properties with room counts, ADRs, and positioning descriptions.`,

  analyze_catering: (input) =>
    `Catering context: ${input.property_level || "luxury"} property, ${input.location}, ${input.room_count || 20} rooms, ${input.event_locations || 2} event spaces, max ${input.max_event_capacity || 150} guests, F&B: ${input.has_fb ?? true}, events: ${input.has_events ?? true}. Catering boost = uplift to base F&B from catered events (15-50%). Provide raw market data — do NOT convert revenue breakdowns. Include recommended boost %, market range, event mix breakdown.`,

  analyze_land_value: (input) =>
    `Land value context: ${input.location} (${input.market_region}), ${input.property_type}, ${input.acreage || 10}+ acres, ${input.room_count || 20} rooms, $${(input.purchase_price || 0).toLocaleString()} purchase, $${(input.building_improvements || 0).toLocaleString()} improvements, ${input.setting || "rural estate"}. Use compute_depreciation_basis for tax impact. Provide recommended land %, market range, assessment method, and rationale.`,

  analyze_operating_costs: (input) =>
    `Cost context: ${input.property_level || "luxury"} hotel, ${input.location}, ${input.room_count || 20} rooms, ADR $${input.current_adr || 300}, F&B: ${input.has_fb ?? true}, Events: ${input.has_events ?? true}, Market: ${input.market_region || "North America"}. Use compute_cost_benchmarks for dollar amounts from rates. Provide USALI-aligned rates: Room Revenue-based (housekeeping, F&B COGS), Total Revenue-based (admin, ops, utilities, FF&E, marketing, IT, other). Cite PKF Trends, STR HOST, CBRE.`,

  analyze_property_value_costs: (input) =>
    `Property value cost context: ${input.property_level || "luxury"} hotel, ${input.location}, ${input.room_count || 20} rooms, $${(input.purchase_price || 0).toLocaleString()} purchase, $${(input.building_improvements || 0).toLocaleString()} improvements, ${input.market_region || "North America"}. Costs are % of property value, not revenue. Provide insurance and property tax rates with jurisdiction-specific context.`,

  analyze_management_service_fees: (input) =>
    `Service fee context: ${input.property_level || "luxury"} hotel, ${input.location}, ${input.room_count || 20} rooms, F&B: ${input.has_fb ?? true}, Events: ${input.has_events ?? true}, ${input.market_region || "North America"}. 5 categories (% of Total Revenue): Marketing, IT, Accounting, Reservations, General Mgmt. Plus incentive fee (% of GOP). Provide rates, total fee rate, and industry ranges.`,

  analyze_income_tax: (input) =>
    `Tax context: SPV entity in ${input.location}, ${input.market_region || "North America"}, ${input.entity_type || "LLC"}, $${(input.purchase_price || 0).toLocaleString()} property value. Tax = NOI - Interest - Depreciation. Provide combined effective rate, federal/state/local breakdown, entity structure notes, and hospitality-specific incentives.`,
};

const isDev = process.env.NODE_ENV === "development";
const skillCache = new Map<string, string>();
let toolCache: Anthropic.Tool[] | null = null;

const CONFIDENCE_PREAMBLE = `## Confidence Scoring (applies to all recommendations)
Every recommended value must include a "confidence" field:
- **conservative**: Below-market/cautious estimate (higher costs, lower revenues, higher cap rates)
- **moderate**: Market-aligned estimate supported by strong comparable data
- **aggressive**: Above-market/optimistic estimate (lower costs, higher revenues, lower cap rates)

## Deterministic Tools
For any arithmetic (RevPAR, room revenue, NOI, depreciation, debt capacity, cost dollar amounts, occupancy schedules, ADR projections, cap rate valuations), call the appropriate compute_* tool. Never compute financial math in prose.
`;

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
  scanDir(globalToolsDir); // recursive — covers .claude/tools/research/ too

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

async function handleToolCall(name: string, input: Record<string, any>): Promise<string> {
  // Web search — calls external API, requires async
  if (name === "web_search") {
    const { webSearch } = await import("../data/webSearch.js");
    const results = await webSearch(input.query, input.num_results);
    if (results.length === 0) {
      return "Web search is not available or returned no results. Proceed with your existing knowledge.";
    }
    return JSON.stringify(results, null, 2);
  }

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

Use the available tools to gather data on each analysis dimension, then synthesize your findings into the required JSON format. Call each tool to build your analysis, then provide the final synthesized research as a JSON object.

IMPORTANT: For every recommended metric, include a "confidence" field with one of: "conservative" (below-market/cautious), "moderate" (market-aligned with strong comps), or "aggressive" (above-market/optimistic). This applies to adrAnalysis, occupancyAnalysis, capRateAnalysis, cateringAnalysis, landValueAllocation, incomeTaxAnalysis, and every cost category in operatingCostAnalysis, propertyValueCostAnalysis, and managementServiceFeeAnalysis.`;
  }
  
  if (type === "company") {
    return `Provide comprehensive research on hotel management company fee structures, GAAP standards, and industry benchmarks for a ${label.toLowerCase()} management company.

${label} asset definition: ${bd.description || "Independently operated, design-forward properties with curated guest experiences."}
- Property level: ${bd.level || "luxury"}
- Room range: ${bd.minRooms}–${bd.maxRooms} rooms
- ADR range: $${bd.minAdr}–$${bd.maxAdr}
- Features: ${[bd.hasFB && "F&B operations", bd.hasEvents && "event hosting", bd.hasWellness && "wellness programming"].filter(Boolean).join(", ") || "standard hospitality"}
- Event locations: ${bd.eventLocations ?? 2}
- Max event capacity: ${bd.maxEventCapacity ?? 150} people
- Acreage: ${bd.acreage ?? 5} acres
- Privacy: ${bd.privacyLevel || "high"}
- Parking: ${bd.parkingSpaces ?? 50} spaces

Research the following areas for management companies that specialize in this type of property:
1. Base management fee structures and industry norms (ASC 606 revenue recognition)
2. Incentive management fee (IMF) structures and triggers
3. GAAP-compliant fee recognition standards
4. Operating expense ratios by department (USALI format)
5. Management company compensation benchmarks
6. Typical contract terms and duration
Focus specifically on management companies specializing in ${label.toLowerCase()} properties with unique events like wellness retreats, corporate retreats, and experiential hospitality.`;
  }
  
  // global
  const rv = params.researchVariables;
  const regions = rv?.regions?.length ? rv.regions.join(", ") : "North America and Latin America";
  const timeHorizon = rv?.timeHorizon || "5 years";
  
  const defaultFocusAreas = [
    "Market Overview & Trends",
    "Event Hospitality (wellness, corporate, yoga, relationship retreats)",
    "Financial Benchmarks (ADR, occupancy, RevPAR)",
    "Cap Rates & Investment Returns",
    "Debt Market Conditions",
    "Emerging Trends",
  ];
  const focusAreas = rv?.focusAreas?.length ? rv.focusAreas : defaultFocusAreas;
  
  let prompt = `Provide comprehensive ${label.toLowerCase()} industry research covering:\n`;
  focusAreas.forEach((area, i) => {
    prompt += `${i + 1}. ${area}\n`;
  });
  
  prompt += `\nResearch Parameters:
- Asset type: ${label} (${bd.level || "luxury"} tier)
- Asset definition: ${bd.description || "Independently operated, design-forward properties with curated guest experiences."}
- Room range: ${bd.minRooms}–${bd.maxRooms} rooms
- ADR range: $${bd.minAdr}–$${bd.maxAdr}
- Features: ${[bd.hasFB && "F&B operations", bd.hasEvents && "event hosting", bd.hasWellness && "wellness programming"].filter(Boolean).join(", ")}
- Target regions: ${regions}
- Investment horizon: ${timeHorizon}`;
  
  if (rv?.inflationRate != null) {
    prompt += `\n- Assumed inflation rate: ${(rv.inflationRate * 100).toFixed(1)}%`;
  }
  if (rv?.modelDurationYears != null) {
    prompt += `\n- Financial model duration: ${rv.modelDurationYears} years`;
  }
  
  prompt += `\n\nInclude specific data points, market sizes, growth rates, and cite sources.`;
  
  if (rv?.customQuestions) {
    prompt += `\n\nAdditional research questions to address:\n${rv.customQuestions}`;
  }
  
  return prompt;
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
    
    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (toolBlock) => ({
        type: "tool_result" as const,
        tool_use_id: toolBlock.id,
        content: await handleToolCall(toolBlock.name, toolBlock.input as Record<string, any>),
      }))
    );
    
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
  
  return parseResearchJSON(fullText);
}

/**
 * Parse raw LLM text into structured JSON, handling markdown code fences.
 * Returns `{ rawResponse }` if parsing fails.
 */
export function parseResearchJSON(fullText: string): Record<string, any> {
  try {
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

/**
 * Extract key research values from parsed property research JSON into
 * the ResearchValueEntry format used by the property's researchValues column.
 * Returns null if the content is unparsed (rawResponse) or not property research.
 */
export function extractResearchValues(content: Record<string, any>): Record<string, { display: string; mid: number; source: "ai" }> | null {
  if (content.rawResponse) return null;

  const parsePct = (s: string | undefined): number | null => {
    if (!s) return null;
    const m = s.match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : null;
  };
  const parseRange = (s: string | undefined): { low: number; high: number; mid: number } | null => {
    if (!s) return null;
    const nums = s.replace(/[^0-9.,\-–]/g, ' ').split(/[\s–\-]+/).map(x => parseFloat(x.replace(/,/g, ''))).filter(n => !isNaN(n));
    if (nums.length >= 2) return { low: nums[0], high: nums[1], mid: Math.round((nums[0] + nums[1]) / 2) };
    if (nums.length === 1) return { low: nums[0], high: nums[0], mid: nums[0] };
    return null;
  };
  const parseCostRate = (cat: { recommendedRate?: string } | undefined): { display: string; mid: number } | null => {
    if (!cat?.recommendedRate) return null;
    const pct = parsePct(cat.recommendedRate);
    return pct != null ? { display: cat.recommendedRate, mid: pct } : null;
  };
  const entry = (v: { display: string; mid: number } | null): { display: string; mid: number; source: "ai" } | null =>
    v ? { ...v, source: "ai" as const } : null;

  const c = content;
  const vals: Record<string, { display: string; mid: number; source: "ai" } | null> = {};

  // ADR
  const adrRange = parseRange(c.adrAnalysis?.recommendedRange);
  if (adrRange) vals.adr = entry({ display: c.adrAnalysis.recommendedRange, mid: adrRange.mid });

  // Occupancy
  const occText = c.occupancyAnalysis?.rampUpTimeline;
  if (occText) {
    const stabMatch = occText.match(/stabilized occupancy of (\d+)[–\-](\d+)%/);
    if (stabMatch) vals.occupancy = entry({ display: `${stabMatch[1]}%–${stabMatch[2]}%`, mid: Math.round((parseInt(stabMatch[1]) + parseInt(stabMatch[2])) / 2) });
    const initMatch = occText.match(/initial occupancy (?:around |of )?(\d+)[–\-](\d+)%/);
    if (initMatch) vals.startOccupancy = entry({ display: `${initMatch[1]}%–${initMatch[2]}%`, mid: Math.round((parseInt(initMatch[1]) + parseInt(initMatch[2])) / 2) });
    const rampMatch = occText.match(/(\d+)[–\-](\d+) months/);
    if (rampMatch) vals.rampMonths = entry({ display: `${rampMatch[1]}–${rampMatch[2]} mo`, mid: Math.round((parseInt(rampMatch[1]) + parseInt(rampMatch[2])) / 2) });
  }

  // Cap rate
  const capRange = parseRange(c.capRateAnalysis?.recommendedRange);
  if (capRange) vals.capRate = entry({ display: c.capRateAnalysis.recommendedRange, mid: (capRange.low + capRange.high) / 2 });

  // Catering
  const cateringPct = parsePct(c.cateringAnalysis?.recommendedBoostPercent);
  if (cateringPct != null) vals.catering = entry({ display: c.cateringAnalysis.recommendedBoostPercent, mid: cateringPct });

  // Land value
  const landPct = parsePct(c.landValueAllocation?.recommendedPercent);
  if (landPct != null) vals.landValue = entry({ display: c.landValueAllocation.recommendedPercent, mid: landPct });

  // Operating costs
  const oc = c.operatingCostAnalysis;
  if (oc) {
    const m = (k: string, cat: any) => { const v = parseCostRate(cat); if (v) vals[k] = entry(v); };
    m("costHousekeeping", oc.roomRevenueBased?.housekeeping);
    m("costFB", oc.roomRevenueBased?.fbCostOfSales);
    m("costAdmin", oc.totalRevenueBased?.adminGeneral);
    m("costPropertyOps", oc.totalRevenueBased?.propertyOps);
    m("costUtilities", oc.totalRevenueBased?.utilities);
    m("costFFE", oc.totalRevenueBased?.ffeReserve);
    m("costMarketing", oc.totalRevenueBased?.marketing);
    m("costIT", oc.totalRevenueBased?.it);
    m("costOther", oc.totalRevenueBased?.other);
  }

  // Property value costs
  const pvc = c.propertyValueCostAnalysis;
  if (pvc) {
    const v1 = parseCostRate(pvc.insurance); if (v1) vals.costInsurance = entry(v1);
    const v2 = parseCostRate(pvc.propertyTaxes); if (v2) vals.costPropertyTaxes = entry(v2);
  }

  // Management service fees
  const msf = c.managementServiceFeeAnalysis;
  if (msf) {
    const sf = msf.serviceFeeCategories;
    if (sf) {
      const m = (k: string, cat: any) => { const v = parseCostRate(cat); if (v) vals[k] = entry(v); };
      m("svcFeeMarketing", sf.marketing);
      m("svcFeeIT", sf.it);
      m("svcFeeAccounting", sf.accounting);
      m("svcFeeReservations", sf.reservations);
      m("svcFeeGeneralMgmt", sf.generalManagement);
    }
    const incV = parseCostRate(msf.incentiveFee); if (incV) vals.incentiveFee = entry(incV);
  }

  // Income tax
  const ita = c.incomeTaxAnalysis;
  if (ita?.recommendedRate) {
    const v = parseCostRate({ recommendedRate: ita.recommendedRate });
    if (v) vals.incomeTax = entry(v);
  }

  // ADR growth
  const adrGrowth = c.adrAnalysis?.recommendedGrowthRate ?? c.adrAnalysis?.annualGrowthRate;
  if (adrGrowth) { const pct = parsePct(adrGrowth); if (pct != null) vals.adrGrowth = entry({ display: adrGrowth, mid: pct }); }

  // Occupancy step
  const occStep = c.occupancyAnalysis?.recommendedGrowthStep ?? c.occupancyAnalysis?.growthStepPercent;
  if (occStep) { const pct = parsePct(occStep); if (pct != null) vals.occupancyStep = entry({ display: occStep, mid: pct }); }

  // Revenue shares
  const evRev = c.eventDemandAnalysis?.recommendedRevenueShare ?? c.eventDemandAnalysis?.recommendedPercent;
  if (evRev) { const pct = parsePct(evRev); if (pct != null) vals.revShareEvents = entry({ display: evRev, mid: pct }); }
  const fbRev = c.fbRevenueAnalysis?.recommendedPercent ?? c.cateringAnalysis?.fbRevenueShare;
  if (fbRev) { const pct = parsePct(fbRev); if (pct != null) vals.revShareFB = entry({ display: fbRev, mid: pct }); }
  const otherRev = c.ancillaryRevenueAnalysis?.recommendedPercent;
  if (otherRev) { const pct = parsePct(otherRev); if (pct != null) vals.revShareOther = entry({ display: otherRev, mid: pct }); }

  // Sale commission
  const comm = c.dispositionAnalysis?.recommendedCommission ?? c.capRateAnalysis?.saleCommission;
  if (comm) { const pct = parsePct(comm); if (pct != null) vals.saleCommission = entry({ display: comm, mid: pct }); }

  // Filter out nulls
  const result: Record<string, { display: string; mid: number; source: "ai" }> = {};
  for (const [k, v] of Object.entries(vals)) {
    if (v) result[k] = v;
  }
  return Object.keys(result).length > 0 ? result : null;
}

export { loadSkill, loadToolDefinitions, buildUserPrompt, handleToolCall };
export type { ResearchParams };
