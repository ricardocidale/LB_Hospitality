export interface ResearchParams {
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
  // Admin-configured per-event overrides (from global_assumptions.researchConfig)
  eventConfig?: {
    enabled?: boolean;
    focusAreas?: string[];
    regions?: string[];
    timeHorizon?: string;
    customInstructions?: string;
    customQuestions?: string;
    enabledTools?: string[];
  };
}

function formatAssetDefinition(bd: ResearchParams["assetDefinition"], label: string): string {
  const features = [
    bd.hasFB && "F&B operations",
    bd.hasEvents && "event hosting",
    bd.hasWellness && "wellness programming",
  ].filter(Boolean).join(", ");
  return `${label} definition: ${bd.description || "Independently operated, design-forward properties with curated guest experiences."}
- Property level: ${bd.level || "luxury"}
- Room range: ${bd.minRooms}–${bd.maxRooms} rooms
- ADR range: $${bd.minAdr}–$${bd.maxAdr}
- Features: ${features || "standard hospitality"}
- Event locations: ${bd.eventLocations ?? 2}
- Max event capacity: ${bd.maxEventCapacity ?? 150} people
- Acreage: ${bd.acreage ?? 5} acres
- Privacy: ${bd.privacyLevel || "high"}
- Parking: ${bd.parkingSpaces ?? 50} spaces`;
}

/** Build the admin-config suffix block appended to all prompt types. */
function buildEventConfigSuffix(ec: ResearchParams["eventConfig"]): string {
  if (!ec) return "";
  let suffix = "";

  const focusAreas = ec.focusAreas?.length ? ec.focusAreas : null;
  const regions = ec.regions?.length ? ec.regions : null;

  if (focusAreas) {
    suffix += `\n\nAdmin-specified focus areas (address all of these):\n`;
    focusAreas.forEach((a) => { suffix += `- ${a}\n`; });
  }
  if (regions) {
    suffix += `\nAdmin-specified geographic scope: ${regions.join(", ")}`;
  }
  if (ec.timeHorizon) {
    suffix += `\nInvestment horizon: ${ec.timeHorizon}`;
  }
  if (ec.customInstructions?.trim()) {
    suffix += `\n\nAdditional context from admin:\n${ec.customInstructions.trim()}`;
  }
  if (ec.customQuestions?.trim()) {
    suffix += `\n\nAdmin-required questions to address:\n${ec.customQuestions.trim()}`;
  }
  return suffix;
}

export function buildUserPrompt(params: ResearchParams): string {
  const { type, propertyContext, assetDefinition: bd, propertyLabel: pl, eventConfig: ec } = params;
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

${formatAssetDefinition(bd, label)}

Use the available tools to gather data on each analysis dimension, then synthesize your findings into the required JSON format. Call each tool to build your analysis, then provide the final synthesized research as a JSON object.

IMPORTANT: For every recommended metric, include a "confidence" field with one of: "conservative" (below-market/cautious), "moderate" (market-aligned with strong comps), or "aggressive" (above-market/optimistic). This applies to adrAnalysis, occupancyAnalysis, capRateAnalysis, cateringAnalysis, landValueAllocation, incomeTaxAnalysis, and every cost category in operatingCostAnalysis, propertyValueCostAnalysis, and managementServiceFeeAnalysis.${buildEventConfigSuffix(ec)}`;
  }

  if (type === "company") {
    return `Provide comprehensive research on hotel management company fee structures, GAAP standards, and industry benchmarks for a ${label.toLowerCase()} management company.

${formatAssetDefinition(bd, label + " asset")}

Research the following areas for management companies that specialize in this type of property:
1. Base management fee structures and industry norms (ASC 606 revenue recognition)
2. Incentive management fee (IMF) structures and triggers
3. GAAP-compliant fee recognition standards
4. Operating expense ratios by department (USALI format)
5. Management company compensation benchmarks
6. Typical contract terms and duration
Focus specifically on management companies specializing in ${label.toLowerCase()} properties with unique events like wellness retreats, corporate retreats, and experiential hospitality.${buildEventConfigSuffix(ec)}`;
  }

  // global
  const rv = params.researchVariables;

  // eventConfig overrides researchVariables when present
  const regions = (ec?.regions?.length ? ec.regions : rv?.regions?.length ? rv.regions : null)
    ?.join(", ") ?? "North America and Latin America";
  const timeHorizon = ec?.timeHorizon || rv?.timeHorizon || "5 years";

  const defaultFocusAreas = [
    "Market Overview & Trends",
    "Event Hospitality (wellness, corporate, yoga, relationship retreats)",
    "Financial Benchmarks (ADR, occupancy, RevPAR)",
    "Cap Rates & Investment Returns",
    "Debt Market Conditions",
    "Emerging Trends",
  ];
  const focusAreas = (ec?.focusAreas?.length ? ec.focusAreas : rv?.focusAreas?.length ? rv.focusAreas : null) ?? defaultFocusAreas;

  let prompt = `Provide comprehensive ${label.toLowerCase()} industry research covering:\n`;
  focusAreas.forEach((area, i) => { prompt += `${i + 1}. ${area}\n`; });

  const features = [
    bd.hasFB && "F&B operations",
    bd.hasEvents && "event hosting",
    bd.hasWellness && "wellness programming",
  ].filter(Boolean).join(", ");

  prompt += `\nResearch Parameters:
- Asset type: ${label} (${bd.level || "luxury"} tier)
- Asset definition: ${bd.description || "Independently operated, design-forward properties with curated guest experiences."}
- Room range: ${bd.minRooms}–${bd.maxRooms} rooms
- ADR range: $${bd.minAdr}–$${bd.maxAdr}
- Features: ${features}
- Target regions: ${regions}
- Investment horizon: ${timeHorizon}`;

  if (rv?.inflationRate != null) {
    prompt += `\n- Assumed inflation rate: ${(rv.inflationRate * 100).toFixed(1)}%`;
  }
  if (rv?.modelDurationYears != null) {
    prompt += `\n- Financial model duration: ${rv.modelDurationYears} years`;
  }

  prompt += `\n\nInclude specific data points, market sizes, growth rates, and cite sources.`;

  // customQuestions: eventConfig takes precedence over researchVariables
  const customQ = ec?.customQuestions?.trim() || rv?.customQuestions;
  if (customQ) {
    prompt += `\n\nAdditional research questions to address:\n${customQ}`;
  }
  if (ec?.customInstructions?.trim()) {
    prompt += `\n\nAdditional context from admin:\n${ec.customInstructions.trim()}`;
  }

  return prompt;
}
