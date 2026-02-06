import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";

interface ResearchParams {
  type: "property" | "company" | "global";
  propertyContext?: {
    name: string;
    location: string;
    market: string;
    roomCount: number;
    startAdr: number;
    maxOccupancy: number;
    cateringLevel: string;
    type: string;
    purchasePrice?: number;
  };
  boutiqueDefinition: {
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

// Skill file mapping
const SKILL_FILES: Record<string, string> = {
  property: "property-market-research.md",
  company: "company-research.md",
  global: "global-research.md",
};

// Load a skill file content
function loadSkill(type: string): string {
  const skillFile = SKILL_FILES[type];
  if (!skillFile) {
    throw new Error(`Unknown research type: ${type}. Must be 'property', 'company', or 'global'.`);
  }
  const skillPath = join(process.cwd(), ".claude", "skills", skillFile);
  return readFileSync(skillPath, "utf-8");
}

// Load all tool definitions from .claude/tools/
function loadToolDefinitions(): Anthropic.Tool[] {
  const toolsDir = join(process.cwd(), ".claude", "tools");
  const files = readdirSync(toolsDir).filter(f => f.endsWith(".json"));
  return files.map(f => {
    const content = JSON.parse(readFileSync(join(toolsDir, f), "utf-8"));
    return {
      name: content.name,
      description: content.description,
      input_schema: content.input_schema,
    };
  });
}

// Handle tool calls - returns contextual guidance for Claude
function handleToolCall(name: string, input: Record<string, any>): string {
  // Each handler returns a context string that guides Claude to synthesize analysis
  // based on the provided parameters
  switch (name) {
    case "analyze_market":
      return `Provide market overview analysis for ${input.location} (${input.market_region}). Property type: ${input.property_type}, ${input.room_count} rooms. Include tourism volume, hotel supply metrics, demand trends, RevPAR data, and market positioning for boutique hotels in this specific location. Use your knowledge of this market to provide specific, data-backed metrics with industry sources.`;
    case "analyze_adr":
      return `Provide ADR analysis for ${input.location}. Current/target ADR: $${input.current_adr}, ${input.room_count} rooms, ${input.property_level} positioning. Has F&B: ${input.has_fb ?? "unknown"}, Events: ${input.has_events ?? "unknown"}, Wellness: ${input.has_wellness ?? "unknown"}. Include market average ADR, boutique hotel ADR range, at least 4 comparable property ADRs, and a recommended ADR range with rationale.`;
    case "analyze_occupancy": {
      const targetOcc = typeof input.target_occupancy === "number" ? (input.target_occupancy * 100).toFixed(0) : "70";
      return `Provide occupancy analysis for ${input.location}. ${input.room_count || 20} rooms, target ${targetOcc}% stabilized occupancy, ${input.property_level || "luxury"} positioning, catering: ${input.catering_level || "unknown"}. Include market average occupancy, seasonal patterns (4 seasons with rates and notes), and expected ramp-up timeline.`;
    }
    case "analyze_event_demand":
      return `Provide event demand analysis for ${input.location}. ${input.event_locations || 2} event spaces, max capacity ${input.max_event_capacity || 150} guests. Wellness: ${input.has_wellness ?? true}, F&B: ${input.has_fb ?? true}, Privacy: ${input.privacy_level || "high"}, Acreage: ${input.acreage || 5}. Include corporate event demand, wellness retreat potential, wedding/private event demand, estimated event revenue share, and key demand drivers.`;
    case "analyze_cap_rates":
      return `Provide cap rate analysis for ${input.location} (${input.market_region}). ${input.property_level} boutique hotel, ${input.room_count} rooms${input.purchase_price ? `, purchase price $${input.purchase_price.toLocaleString()}` : ""}. Include market cap rate range, boutique-specific range, at least 3 comparable transactions with cap rates and sale years, and a recommended acquisition/exit cap rate range.`;
    case "analyze_competitive_set":
      return `Provide competitive set analysis for ${input.location}. Subject: ${input.room_count} rooms at $${input.current_adr} ADR, ${input.property_level} positioning. Has events: ${input.has_events ?? true}, wellness: ${input.has_wellness ?? true}, F&B: ${input.has_fb ?? true}. Identify 4-6 comparable boutique hotels with room counts, ADRs, and positioning descriptions.`;
    case "analyze_land_value":
      return `Provide land value allocation analysis for ${input.location} (${input.market_region}). Property type: ${input.property_type}, ${input.acreage || 10}+ acres, ${input.room_count || 20} rooms, purchase price: $${(input.purchase_price || 0).toLocaleString()}, building improvements: $${(input.building_improvements || 0).toLocaleString()}, setting: ${input.setting || "rural estate"}. Determine the appropriate percentage of the purchase price attributable to land vs. building/improvements for IRS depreciation purposes. Consider: local land values per acre, ratio of land to total property value in this market, whether the property is in a high-land-value area (urban/resort) vs. lower-value rural setting, comparable hotel land allocations, and county tax assessor land-to-improvement ratios. Provide a recommended land value percentage, market range, assessment methodology, rationale, and key factors.`;
    default:
      return `Unknown tool: ${name}. Please proceed with your analysis.`;
  }
}

// Build user prompt based on research type and context
function buildUserPrompt(params: ResearchParams): string {
  const { type, propertyContext, boutiqueDefinition: bd } = params;
  
  if (type === "property" && propertyContext) {
    return `Analyze the market for this boutique hotel property:
- Property: ${propertyContext.name}
- Location: ${propertyContext.location}
- Market: ${propertyContext.market}
- Room Count: ${propertyContext.roomCount}
- Current ADR: $${propertyContext.startAdr}
- Target Occupancy: ${(propertyContext.maxOccupancy * 100).toFixed(0)}%
- Catering Level: ${propertyContext.cateringLevel}
- Property Type: ${propertyContext.type}
${propertyContext.purchasePrice ? `- Purchase Price: $${propertyContext.purchasePrice.toLocaleString()}` : ""}

Boutique hotel definition: ${bd.description || "Independently operated, design-forward properties with curated guest experiences."}
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
    return `Provide comprehensive research on hotel management company fee structures, GAAP standards, and industry benchmarks for a boutique hotel management company focused on:
1. Base management fee structures and industry norms (ASC 606 revenue recognition)
2. Incentive management fee (IMF) structures and triggers
3. GAAP-compliant fee recognition standards
4. Operating expense ratios by department (USALI format)
5. Management company compensation benchmarks
6. Typical contract terms and duration
Focus specifically on boutique hotels specializing in unique events like wellness retreats, corporate retreats, and experiential hospitality.`;
  }
  
  // global
  return `Provide comprehensive boutique hotel industry research covering:
1. Overall boutique hotel market size, growth, and trends
2. Event-focused hospitality: wellness retreats, corporate events, yoga retreats, relationship/couples retreats market data
3. Financial benchmarks: ADR, occupancy, RevPAR trends for boutique hotels
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
    
    const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(toolBlock => ({
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
