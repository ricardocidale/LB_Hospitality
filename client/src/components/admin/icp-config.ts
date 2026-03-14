export interface IcpLocationCity {
  name: string;
  radius: number;
}

export interface IcpLocation {
  id: string;
  country: string;
  countryCode: string;
  states: string[];
  cities: IcpLocationCity[];
  notes: string;
}

export interface IcpConfig {
  roomsMin: number;
  roomsMax: number;
  roomsSweetSpotMin: number;
  roomsSweetSpotMax: number;
  masterSuitesMin: number;
  masterSuiteSqFt: number;
  bedroomsMin: number;
  bedroomsMax: number;
  bathroomsMin: number;
  bathroomsMax: number;
  halfBaths: number;
  landAcresMin: number;
  landAcresMax: number;
  builtSqFtMin: number;
  builtSqFtMax: number;
  livingAreas: number;
  diningCapacityMin: number;
  diningCapacityMax: number;
  indoorEventMin: number;
  indoorEventMax: number;
  outdoorEventMin: number;
  outdoorEventMax: number;
  parkingMin: number;
  parkingMax: number;

  kitchenSqFt: number;
  maintenanceSqFt: number;
  staffQuartersMin: number;
  staffQuartersMax: number;
  staffHousingUnits: number;

  pool: Priority;
  poolSqFt: number;
  secondPool: Priority;
  hotTub: Priority;
  spa: Priority;
  spaTreatmentRooms: number;
  sauna: Priority;
  steamRoom: Priority;
  coldPlunge: Priority;
  yogaStudio: Priority;
  gym: Priority;
  gymSqFtMin: number;
  gymSqFtMax: number;
  tennis: Priority;
  tennisCourts: number;
  pickleball: Priority;
  pickleballCourts: number;
  basketball: Priority;
  hikingTrails: Priority;
  horseFacilities: Priority;
  horseStalls: number;
  pastureAcres: number;
  garden: Priority;
  vineyard: Priority;
  casitas: Priority;
  casitasCount: number;
  barn: Priority;
  glamping: Priority;
  greenhouse: Priority;
  chapel: Priority;
  firePit: Priority;
  wineCellar: Priority;
  gameRoom: Priority;
  library: Priority;
  outdoorKitchen: Priority;
  garageBays: number;

  maxRoofAge: number;
  minElectricalAmps: number;
  maxRenovationBudget: number;

  minSetbackFt: number;
  minDrivewayFt: number;

  maxAirportMin: number;
  prefAirportMin: number;
  maxIntlAirportMin: number;
  prefIntlAirportMin: number;
  maxHospitalMin: number;
  prefHospitalMin: number;

  acquisitionMin: number;
  acquisitionMax: number;
  acquisitionTargetMin: number;
  acquisitionTargetMax: number;
  totalInvestmentMin: number;
  totalInvestmentMax: number;
  renovationMin: number;
  renovationMax: number;
  ffePerRoomMin: number;
  ffePerRoomMax: number;
  adrMin: number;
  adrMax: number;
  occupancyMin: number;
  occupancyMax: number;
  occupancyRampMonths: number;
  revParMin: number;
  revParMax: number;
  fbShareMin: number;
  fbShareMax: number;
  eventsShareMin: number;
  eventsShareMax: number;
  spaShareMin: number;
  spaShareMax: number;
  otherShareMin: number;
  otherShareMax: number;
  totalAncillaryMin: number;
  totalAncillaryMax: number;
  baseMgmtFeeMin: number;
  baseMgmtFeeMax: number;
  incentiveFeeMin: number;
  incentiveFeeMax: number;
  exitCapRateMin: number;
  exitCapRateMax: number;
  targetIrr: number;
  equityMultipleMin: number;
  equityMultipleMax: number;
  holdYearsMin: number;
  holdYearsMax: number;
  fbRating: number;
}

export type Priority = "must" | "major" | "nice" | "no";

export const PRIORITY_LABELS: Record<Priority, string> = {
  must: "Required",
  major: "Major Plus",
  nice: "Nice to Have",
  no: "Exclude",
};

export const DEFAULT_ICP_CONFIG: IcpConfig = {
  roomsMin: 10,
  roomsMax: 50,
  roomsSweetSpotMin: 20,
  roomsSweetSpotMax: 30,
  masterSuitesMin: 2,
  masterSuiteSqFt: 400,
  bedroomsMin: 15,
  bedroomsMax: 55,
  bathroomsMin: 15,
  bathroomsMax: 55,
  halfBaths: 3,
  landAcresMin: 5,
  landAcresMax: 100,
  builtSqFtMin: 8000,
  builtSqFtMax: 40000,
  livingAreas: 2,
  diningCapacityMin: 30,
  diningCapacityMax: 60,
  indoorEventMin: 50,
  indoorEventMax: 150,
  outdoorEventMin: 80,
  outdoorEventMax: 200,
  parkingMin: 30,
  parkingMax: 80,

  kitchenSqFt: 1000,
  maintenanceSqFt: 1000,
  staffQuartersMin: 4,
  staffQuartersMax: 8,
  staffHousingUnits: 3,

  pool: "must",
  poolSqFt: 400,
  secondPool: "nice",
  hotTub: "nice",
  spa: "nice",
  spaTreatmentRooms: 3,
  sauna: "nice",
  steamRoom: "nice",
  coldPlunge: "nice",
  yogaStudio: "nice",
  gym: "nice",
  gymSqFtMin: 500,
  gymSqFtMax: 1500,
  tennis: "nice",
  tennisCourts: 1,
  pickleball: "nice",
  pickleballCourts: 2,
  basketball: "nice",
  hikingTrails: "nice",
  horseFacilities: "nice",
  horseStalls: 6,
  pastureAcres: 10,
  garden: "nice",
  vineyard: "nice",
  casitas: "nice",
  casitasCount: 4,
  barn: "nice",
  glamping: "nice",
  greenhouse: "nice",
  chapel: "nice",
  firePit: "nice",
  wineCellar: "nice",
  gameRoom: "nice",
  library: "nice",
  outdoorKitchen: "nice",
  garageBays: 6,

  maxRoofAge: 15,
  minElectricalAmps: 200,
  maxRenovationBudget: 3000000,

  minSetbackFt: 200,
  minDrivewayFt: 500,

  maxAirportMin: 60,
  prefAirportMin: 30,
  maxIntlAirportMin: 120,
  prefIntlAirportMin: 60,
  maxHospitalMin: 30,
  prefHospitalMin: 15,

  acquisitionMin: 2000000,
  acquisitionMax: 8000000,
  acquisitionTargetMin: 3000000,
  acquisitionTargetMax: 5000000,
  totalInvestmentMin: 3000000,
  totalInvestmentMax: 12000000,
  renovationMin: 500000,
  renovationMax: 3000000,
  ffePerRoomMin: 15000,
  ffePerRoomMax: 30000,
  adrMin: 200,
  adrMax: 500,
  occupancyMin: 55,
  occupancyMax: 75,
  occupancyRampMonths: 15,
  revParMin: 130,
  revParMax: 350,
  fbShareMin: 35,
  fbShareMax: 60,
  eventsShareMin: 25,
  eventsShareMax: 50,
  spaShareMin: 8,
  spaShareMax: 15,
  otherShareMin: 5,
  otherShareMax: 12,
  totalAncillaryMin: 40,
  totalAncillaryMax: 70,
  baseMgmtFeeMin: 8,
  baseMgmtFeeMax: 10,
  incentiveFeeMin: 10,
  incentiveFeeMax: 15,
  exitCapRateMin: 8,
  exitCapRateMax: 10,
  targetIrr: 15,
  equityMultipleMin: 2.0,
  equityMultipleMax: 3.0,
  holdYearsMin: 7,
  holdYearsMax: 10,
  fbRating: 4,
};

export type UnitType = "area" | "land" | "distance" | "none";

export interface UnitDef {
  imperial: string;
  metric: string;
  toMetric: (v: number) => number;
  toImperial: (v: number) => number;
}

export const UNIT_DEFS: Record<Exclude<UnitType, "none">, UnitDef> = {
  area: {
    imperial: "sq ft",
    metric: "m²",
    toMetric: (v) => Math.round(v * 0.0929),
    toImperial: (v) => Math.round(v / 0.0929),
  },
  land: {
    imperial: "acres",
    metric: "ha",
    toMetric: (v) => +(v * 0.4047).toFixed(1),
    toImperial: (v) => +(v / 0.4047).toFixed(1),
  },
  distance: {
    imperial: "ft",
    metric: "m",
    toMetric: (v) => Math.round(v * 0.3048),
    toImperial: (v) => Math.round(v / 0.3048),
  },
};

export function dualUnit(value: number, unitType: UnitType, inputMetric: boolean): string {
  if (unitType === "none") return String(value);
  const def = UNIT_DEFS[unitType];
  if (inputMetric) {
    const imp = def.toImperial(value);
    return `${value.toLocaleString()} ${def.metric} (${imp.toLocaleString()} ${def.imperial})`;
  }
  const met = def.toMetric(value);
  return `${value.toLocaleString()} ${def.imperial} (${met.toLocaleString()} ${def.metric})`;
}

export interface IcpDescriptive {
  propertyTypes: string;
  fbLevel: string;
  locationCharacteristics: string;
  usRegions: string;
  latAmRegions: string;
  emeaRegions: string;
  conditionNotes: string;
  groundsTopography: string;
  vendorServices: string;
  regulatoryNotes: string;
  exclusions: string;
  additionalContext: string;
}

export const DEFAULT_ICP_DESCRIPTIVE: IcpDescriptive = {
  propertyTypes: "Luxury boutique hotel, estate hotel, hacienda, lodge, manor, or large private estate suitable for conversion into a full-service hospitality operation. Properties must convey exclusivity, architectural character, and a strong sense of place. Chain-affiliated or conventional box hotels are excluded.",
  fbLevel: "Full-service F&B operation with chef-driven restaurant, bar/lounge program, room service, and event catering. Farm-to-table or locally sourced menus preferred. Breakfast included in rate or available à la carte. Dinner service minimum 5 nights/week. Private dining and wine pairing experiences for up to 20 guests. Commercial kitchen capable of supporting 60+ covers per service. Liquor license required or transferable. Seasonal menus and local partnerships encouraged. F&B revenue target: 35%–60% of room revenue.",
  locationCharacteristics: "Near-total privacy: secluded or estate-like setting, ideally not visible from public roads. Proximity to tourism demand generators (wine regions, mountains, beaches, cultural landmarks, national parks). Walkable or short drive to dining, shopping, and recreation. Rideshare services (Uber/Lyft) must be available in the area. Property accessible by paved road year-round.",
  usRegions: "Northeast: Hudson Valley NY, Berkshires MA, Catskills NY, Litchfield Hills CT\nSoutheast: Asheville NC, Charleston SC, Savannah GA, Florida Gulf Coast, Charlottesville VA\nSouthwest: Austin TX Hill Country, Sedona AZ, Santa Fe NM, Fredericksburg TX\nWest: Napa/Sonoma CA, Park City/Eden UT, Jackson Hole WY, Bend OR",
  latAmRegions: "Colombia: Medellín, Cartagena, Coffee Triangle (Eje Cafetero), Santa Marta/Tayrona, Villa de Leyva\nMexico: San Miguel de Allende, Oaxaca, Riviera Nayarit, Valle de Guadalupe\nCosta Rica: Guanacaste, Central Valley, Osa Peninsula",
  emeaRegions: "France: Provence, Loire Valley, Bordeaux, Côte d'Azur, Dordogne\nUAE: Dubai (Jumeirah, Al Barari, Hatta)\nPortugal: Alentejo, Douro Valley, Algarve\nItaly: Tuscany, Umbria, Amalfi Coast, Lake Como\nSpain: Mallorca, Andalusia, Basque Country",
  conditionNotes: "Property in good to excellent structural condition; cosmetic renovation acceptable but no major structural remediation. No active pest infestation, mold, asbestos, or lead paint issues. Historic or heritage designation acceptable if renovation flexibility exists. Unique architectural provenance preferred (colonial, farmhouse, mid-century modern, Mediterranean).",
  groundsTopography: "Gentle rolling hills, flat meadows, or terraced hillside; no extreme slopes requiring retaining walls. Mature landscaping preferred (established trees, manicured gardens, hedgerows for privacy). Water features valued (pond, creek, lake frontage, fountain). Mountain, valley, ocean, vineyard, or pastoral views. Irrigation system for landscaping preferred.",
  vendorServices: "The management company coordinates third-party vendor services to each property:\n• IT: PMS, channel manager, booking engine, Wi-Fi, POS, security/surveillance, smart room technology\n• Housekeeping: daily staffing, commercial laundry, deep cleaning crews, pest control\n• Grounds: landscaping, pool/spa maintenance, HVAC/mechanical, painting/carpentry\n• Professional: accounting, legal, insurance, marketing/PR, revenue management\n• F&B: food purveyors, beverage distributors, kitchen equipment maintenance",
  regulatoryNotes: "Clear zoning for hospitality/commercial use, or demonstrable path to re-zoning within 6 months. Building permits and renovation regulations must allow conversion within 6–18 months. Fire code compliance or clear path to compliance (sprinklers, exits, alarms). ADA/accessibility compliance or feasible retrofit plan. Health department and food service licensing achievable. Liquor license available or transferable preferred.",
  exclusions: "Properties requiring more than $3M in structural renovation\nUrban high-rise or mid-rise buildings\nProperties in flood zones, wildfire extreme zones, or with unresolved environmental issues\nLocations more than 2 hours from a commercial airport\nProperties below 5 rooms or above 80 rooms\nTimeshare, fractional ownership, or condo-hotel structures\nProperties with active litigation, liens, or title disputes\nGated communities with HOA restrictions on commercial use\nProperties without year-round road access",
  additionalContext: "",
};

function fmt$(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

interface CustomAmenityForPrompt {
  label: string;
  priority: Priority;
}

interface GeneratePromptOptions {
  locations?: IcpLocation[];
  customAmenities?: CustomAmenityForPrompt[];
}

function buildAmenityTiers(c: IcpConfig, du: (v: number, ut: UnitType) => string, customAmenities?: CustomAmenityForPrompt[]): { required: string[]; majorPlus: string[]; niceToHave: string[] } {
  const all: { name: string; priority: Priority; detail?: string }[] = [
    { name: "Swimming pool", priority: c.pool, detail: `min ${du(c.poolSqFt, "area")} surface area` },
    { name: "Second pool / plunge pool", priority: c.secondPool },
    { name: "Hot tub / jacuzzi", priority: c.hotTub },
    { name: "Spa facility", priority: c.spa, detail: `${c.spaTreatmentRooms} treatment rooms` },
    { name: "Sauna", priority: c.sauna },
    { name: "Steam room", priority: c.steamRoom },
    { name: "Cold plunge", priority: c.coldPlunge },
    { name: "Yoga / meditation studio", priority: c.yogaStudio },
    { name: "Gym / fitness center", priority: c.gym, detail: `${du(c.gymSqFtMin, "area")}–${du(c.gymSqFtMax, "area")}` },
    { name: "Tennis court", priority: c.tennis, detail: `${c.tennisCourts} court(s)` },
    { name: "Pickleball court", priority: c.pickleball, detail: `${c.pickleballCourts} court(s)` },
    { name: "Basketball half-court", priority: c.basketball },
    { name: "Hiking / walking trails", priority: c.hikingTrails },
    { name: "Equestrian facilities", priority: c.horseFacilities, detail: `${c.horseStalls} stalls, ${du(c.pastureAcres, "land")} pasture` },
    { name: "Vegetable / herb garden", priority: c.garden },
    { name: "Vineyard / orchard / olive grove", priority: c.vineyard },
    { name: "Casitas / cottages", priority: c.casitas, detail: `${c.casitasCount} units` },
    { name: "Barn (events/dining)", priority: c.barn },
    { name: "Glamping / A-frames / treehouses", priority: c.glamping },
    { name: "Greenhouse / conservatory", priority: c.greenhouse },
    { name: "Chapel / ceremony structure", priority: c.chapel },
    { name: "Fire pit areas", priority: c.firePit },
    { name: "Wine cellar / tasting room", priority: c.wineCellar },
    { name: "Game room / media room", priority: c.gameRoom },
    { name: "Library / reading room", priority: c.library },
    { name: "Outdoor cooking area", priority: c.outdoorKitchen },
  ];

  if (customAmenities) {
    for (const ca of customAmenities) {
      all.push({ name: ca.label, priority: ca.priority });
    }
  }

  const fmt = (a: { name: string; detail?: string }) => a.detail ? `• ${a.name} — ${a.detail}` : `• ${a.name}`;
  return {
    required: all.filter(a => a.priority === "must").map(fmt),
    majorPlus: all.filter(a => a.priority === "major").map(fmt),
    niceToHave: all.filter(a => a.priority === "nice").map(fmt),
  };
}

function buildLocationSection(loc: IcpLocation, index: number, c: IcpConfig, d: IcpDescriptive, propertyLabel: string, amenityTiers: { required: string[]; majorPlus: string[]; niceToHave: string[] }): string[] {
  const lines: string[] = [];
  const label = loc.country || `Location ${index + 1}`;
  const states = Array.isArray(loc.states) ? loc.states : [];
  const cities = Array.isArray(loc.cities) ? loc.cities : [];
  const stateList = states.length > 0 ? states.join(", ") : "All regions";
  const cityList = cities.length > 0
    ? cities.map(c => `${c.name} (${c.radius}-mile radius)`).join(", ")
    : null;

  lines.push(`┌─── LOCATION ${index + 1}: ${label.toUpperCase()} ───┐`);
  lines.push(`Country: ${loc.country} (${loc.countryCode})`);
  lines.push(`States/Provinces: ${stateList}`);
  if (cityList) lines.push(`Target Cities: ${cityList}`);
  if (loc.notes?.trim()) lines.push(`Location Notes: ${loc.notes.trim()}`);
  lines.push(``);

  lines.push(`RESEARCH DIRECTIVES FOR ${label.toUpperCase()}:`);
  lines.push(`For each state/city listed above, research and report on:`);
  lines.push(``);

  lines.push(`1. MARKET ANALYSIS`);
  lines.push(`   • Current boutique/luxury hotel supply within the target areas`);
  lines.push(`   • Average ADR for comparable ${propertyLabel.toLowerCase()} properties ($${c.adrMin}–$${c.adrMax} target)`);
  lines.push(`   • Occupancy rates for luxury independents (${c.occupancyMin}%–${c.occupancyMax}% target)`);
  lines.push(`   • RevPAR benchmarks ($${c.revParMin}–$${c.revParMax} target)`);
  lines.push(`   • Seasonality patterns and peak/off-peak demand drivers`);
  lines.push(`   • Tourism volume trends and growth trajectory`);
  lines.push(``);

  lines.push(`2. COMPETITIVE LANDSCAPE`);
  lines.push(`   • Existing boutique/luxury properties with ${c.roomsMin}–${c.roomsMax} rooms`);
  lines.push(`   • Comparable properties on ${dualUnit(c.landAcresMin, "land", false)}–${dualUnit(c.landAcresMax, "land", false)} parcels`);
  lines.push(`   • Properties offering similar amenity packages (see REQUIRED amenities below)`);
  lines.push(`   • Recent property sales and acquisition prices in the ${fmt$(c.acquisitionMin)}–${fmt$(c.acquisitionMax)} range`);
  lines.push(`   • New supply pipeline and planned developments`);
  lines.push(``);

  lines.push(`3. REQUIRED AMENITIES — these MUST be available or feasible in this market:`);
  if (amenityTiers.required.length > 0) {
    lines.push(...amenityTiers.required.map(a => `   ${a}`));
  } else {
    lines.push(`   (No amenities marked as required)`);
  }
  lines.push(`   → Research: Which of these required amenities are standard vs. differentiating in ${label}?`);
  lines.push(`   → Research: What is the cost to add/build each required amenity in this market?`);
  lines.push(`   → Research: Do any local regulations restrict these amenities (pool permits, liquor licenses, etc.)?`);
  lines.push(``);

  lines.push(`4. MAJOR PLUS AMENITIES — strong value-adds that significantly enhance the property:`);
  if (amenityTiers.majorPlus.length > 0) {
    lines.push(...amenityTiers.majorPlus.map(a => `   ${a}`));
  } else {
    lines.push(`   (No amenities marked as major plus)`);
  }
  lines.push(`   → Research: Which major-plus amenities would command the highest ADR premium in ${label}?`);
  lines.push(`   → Research: What comparable properties in this market offer these amenities?`);
  lines.push(``);

  lines.push(`5. NICE-TO-HAVE AMENITIES — desirable but not deal-breakers:`);
  if (amenityTiers.niceToHave.length > 0) {
    lines.push(...amenityTiers.niceToHave.map(a => `   ${a}`));
  } else {
    lines.push(`   (No amenities marked as nice-to-have)`);
  }
  lines.push(`   → Research: Which nice-to-have amenities align with guest expectations in ${label}?`);
  lines.push(`   → Research: ROI potential for adding these amenities in this specific market?`);
  lines.push(``);

  lines.push(`6. EVENT & F&B MARKET`);
  lines.push(`   • Wedding and social event demand in the area`);
  lines.push(`   • Corporate retreat/team-building market potential`);
  lines.push(`   • F&B revenue opportunity (target: ${c.fbShareMin}%–${c.fbShareMax}% of room revenue)`);
  lines.push(`   • Events revenue potential (target: ${c.eventsShareMin}%–${c.eventsShareMax}% of room revenue)`);
  if (c.spa !== "no") {
    lines.push(`   • Spa & wellness market demand (target: ${c.spaShareMin}%–${c.spaShareMax}% of room revenue)`);
  }
  lines.push(`   • Local F&B scene quality and farm-to-table sourcing availability`);
  lines.push(``);

  lines.push(`7. REGULATORY & FEASIBILITY`);
  lines.push(`   • Zoning requirements for hospitality/commercial use in target areas`);
  lines.push(`   • Permitting timeline and renovation regulations`);
  lines.push(`   • Liquor licensing availability and process`);
  lines.push(`   • Short-term rental and hospitality regulations`);
  lines.push(`   • Environmental or historic preservation considerations`);
  lines.push(``);

  lines.push(`8. ACCESSIBILITY & INFRASTRUCTURE`);
  lines.push(`   • Nearest regional airport (max ${c.maxAirportMin} min, prefer ${c.prefAirportMin} min)`);
  lines.push(`   • Nearest international airport (max ${c.maxIntlAirportMin} min, prefer ${c.prefIntlAirportMin} min)`);
  lines.push(`   • Nearest hospital/urgent care (max ${c.maxHospitalMin} min, prefer ${c.prefHospitalMin} min)`);
  lines.push(`   • Rideshare/transportation availability`);
  lines.push(`   • Year-round road access and weather considerations`);
  lines.push(``);

  lines.push(`9. INVESTMENT CONTEXT`);
  lines.push(`   • Real estate price trends for estate/luxury properties`);
  lines.push(`   • Construction and renovation costs per sq ft in this market`);
  lines.push(`   • Labor market for hospitality staff`);
  lines.push(`   • Property tax rates and incentives`);
  lines.push(`   • Insurance costs and risk factors (flood, wildfire, hurricane)`);
  lines.push(`└─── END LOCATION ${index + 1} ───┘`);
  lines.push(``);

  return lines;
}

export function generateIcpPrompt(c: IcpConfig, d: IcpDescriptive, propertyLabel: string, opts?: GeneratePromptOptions): string {
  const du = (v: number, ut: UnitType) => dualUnit(v, ut, false);
  const locations = opts?.locations ?? [];
  const customAmenities = opts?.customAmenities;

  const amenityTiers = buildAmenityTiers(c, du, customAmenities);

  const lines = [
    `IDEAL CUSTOMER PROFILE — ${propertyLabel.toUpperCase()} TARGET DEFINITION`,
    ``,
    `This profile defines the ideal property acquisition target for a boutique luxury hospitality investment. Each attribute is classified by priority: REQUIRED (must-have, deal-breaker if absent), MAJOR PLUS (strong value-add, significant impact on underwriting), or NICE TO HAVE (desirable but not deal-breaking). Use this profile for per-location market analysis, ADR estimation, revenue mix projection, cost benchmarking, and competitive positioning.`,
    ``,
    `━━━ PROPERTY TYPE & POSITIONING ━━━`,
    d.propertyTypes,
    ``,
    `━━━ FOOD & BEVERAGE ━━━`,
    `F&B Rating: ${c.fbRating}/5`,
    ``,
    d.fbLevel,
    ``,
    `━━━ SIZE, CAPACITY & PHYSICAL DIMENSIONS ━━━`,
    ``,
    `Guest Rooms & Suites:`,
    `• ${c.roomsMin}–${c.roomsMax} guest rooms or suites (sweet spot: ${c.roomsSweetSpotMin}–${c.roomsSweetSpotMax}) [REQUIRED]`,
    `• Minimum ${c.masterSuitesMin} master suites (${du(c.masterSuiteSqFt, "area")}+ each) with en-suite bathrooms [REQUIRED]`,
    ``,
    `Bedrooms & Bathrooms (Total Property):`,
    `• ${c.bedroomsMin}–${c.bedroomsMax} total bedrooms [REQUIRED]`,
    `• ${c.bathroomsMin}–${c.bathroomsMax} total bathrooms (at least 1:1 ratio to bedrooms) [REQUIRED]`,
    `• ${c.halfBaths} additional half-baths in public/common areas [NICE TO HAVE]`,
    ``,
    `Land & Built Area:`,
    `• ${du(c.landAcresMin, "land")}–${du(c.landAcresMax, "land")}+ total land area [REQUIRED]`,
    `• ${du(c.builtSqFtMin, "area")}–${du(c.builtSqFtMax, "area")} usable interior space [REQUIRED]`,
    ``,
    `Living & Common Areas:`,
    `• ${c.livingAreas}+ distinct living/lounge areas for guest use [REQUIRED]`,
    `• Dining area seating ${c.diningCapacityMin}–${c.diningCapacityMax} guests [REQUIRED]`,
    ``,
    `Event Capacity:`,
    `• Indoor: ${c.indoorEventMin}–${c.indoorEventMax} guests [REQUIRED]`,
    `• Outdoor: ${c.outdoorEventMin}–${c.outdoorEventMax} guests [REQUIRED]`,
    `• Parking: ${c.parkingMin}–${c.parkingMax}+ spaces [REQUIRED]`,
    ``,
    `━━━ OPERATIONAL FACILITIES ━━━`,
    ``,
    `• Commercial/semi-commercial kitchen: ${du(c.kitchenSqFt, "area")}+ with hood ventilation, grease trap, walk-in cooler/freezer, prep area, dish pit, dry storage, receiving dock [REQUIRED]`,
    `• Maintenance workshop and general storage: ${du(c.maintenanceSqFt, "area")}+ [REQUIRED]`,
    `• Staff quarters or break room: on-site capacity for ${c.staffQuartersMin}–${c.staffQuartersMax} key staff [REQUIRED]`,
    `• Staff housing: ${c.staffHousingUnits} separate units [NICE TO HAVE]`,
    `• Administrative office space (front desk, back office, manager's office) [REQUIRED]`,
    `• Housekeeping storage, laundry room with commercial washers/dryers [REQUIRED]`,
    `• Receiving/loading area for vendor deliveries [REQUIRED]`,
    ``,
    `━━━ AMENITIES & GUEST FACILITIES (BY PRIORITY) ━━━`,
    ``,
    `IMPORTANT: Amenity priority directly impacts property valuation and underwriting.`,
    `Properties MUST have all REQUIRED amenities or clear feasibility to add them.`,
    `MAJOR PLUS amenities significantly improve ADR potential and competitive positioning.`,
    `NICE TO HAVE amenities enhance the guest experience but do not drive acquisition decisions.`,
    ``,
  ];

  if (amenityTiers.required.length > 0) {
    lines.push(`── REQUIRED (deal-breaker if absent) ──`);
    lines.push(...amenityTiers.required);
    lines.push(``);
  }

  if (amenityTiers.majorPlus.length > 0) {
    lines.push(`── MAJOR PLUS (strong value-add, impacts underwriting) ──`);
    lines.push(...amenityTiers.majorPlus);
    lines.push(``);
  }

  if (amenityTiers.niceToHave.length > 0) {
    lines.push(`── NICE TO HAVE (desirable, enhances guest experience) ──`);
    lines.push(...amenityTiers.niceToHave);
    lines.push(``);
  }

  lines.push(
    `• Garage: ${c.garageBays}+ bays [NICE TO HAVE]`,
    ``,
    `━━━ PROPERTY CONDITION ━━━`,
    ``,
    `• Roof age: less than ${c.maxRoofAge} years [REQUIRED]`,
    `• Electrical: ${c.minElectricalAmps}+ amp service [REQUIRED]`,
    `• Renovation/FF&E budget must stay under ${fmt$(c.maxRenovationBudget)} [REQUIRED]`,
    d.conditionNotes,
    ``,
    `━━━ GROUNDS & TOPOGRAPHY ━━━`,
    ``,
    d.groundsTopography,
    ``,
    `━━━ PRIVACY & SECURITY ━━━`,
    ``,
    `• Minimum ${du(c.minSetbackFt, "distance")} setback from public roads [REQUIRED]`,
    `• Private driveway: ${du(c.minDrivewayFt, "distance")}+ approach [NICE TO HAVE]`,
    `• Perimeter fencing, walls, hedgerows, or natural tree line for visual/acoustic screening [REQUIRED]`,
    ``,
    `━━━ LOCATION & ACCESSIBILITY ━━━`,
    ``,
    `• Within ${c.maxAirportMin} minutes of a regional airport (${c.prefAirportMin} min preferred) [REQUIRED]`,
    `• Within ${c.maxIntlAirportMin} minutes of an international airport (${c.prefIntlAirportMin} min preferred) [REQUIRED]`,
    `• Within ${c.maxHospitalMin} minutes of a hospital/urgent care (${c.prefHospitalMin} min preferred) [REQUIRED]`,
    d.locationCharacteristics,
    ``,
  );

  if (locations.length > 0) {
    lines.push(`━━━ TARGET LOCATIONS — PER-LOCATION RESEARCH ━━━`);
    lines.push(``);
    lines.push(`The following ${locations.length} target location(s) define where research must be conducted.`);
    lines.push(`For EACH location, provide granular, location-specific analysis.`);
    lines.push(`Do NOT generalize across locations — each market has unique dynamics.`);
    lines.push(``);

    for (let i = 0; i < locations.length; i++) {
      lines.push(...buildLocationSection(locations[i], i, c, d, propertyLabel, amenityTiers));
    }
  } else {
    lines.push(`━━━ PREFERRED GEOGRAPHIES ━━━`);
    lines.push(``);
    lines.push(`United States:`);
    lines.push(d.usRegions);
    lines.push(``);
    lines.push(`Latin America:`);
    lines.push(d.latAmRegions);
    lines.push(``);
    lines.push(`EMEA:`);
    lines.push(d.emeaRegions);
    lines.push(``);
  }

  lines.push(
    `━━━ FINANCIAL PARAMETERS ━━━`,
    ``,
    `Acquisition & Investment:`,
    `• Acquisition price: ${fmt$(c.acquisitionMin)}–${fmt$(c.acquisitionMax)} (target: ${fmt$(c.acquisitionTargetMin)}–${fmt$(c.acquisitionTargetMax)})`,
    `• Total investment: ${fmt$(c.totalInvestmentMin)}–${fmt$(c.totalInvestmentMax)}`,
    `• Renovation/conversion: ${fmt$(c.renovationMin)}–${fmt$(c.renovationMax)}`,
    `• FF&E per room: ${fmt$(c.ffePerRoomMin)}–${fmt$(c.ffePerRoomMax)}`,
    ``,
    `Revenue Benchmarks:`,
    `• Target ADR: $${c.adrMin}–$${c.adrMax}/night`,
    `• Stabilized occupancy: ${c.occupancyMin}%–${c.occupancyMax}% (${c.occupancyRampMonths}-month ramp)`,
    `• RevPAR target: $${c.revParMin}–$${c.revParMax}/night`,
    ``,
    `Revenue Mix (as % of Room Revenue):`,
    `• Food & Beverage: ${c.fbShareMin}%–${c.fbShareMax}%`,
    `• Events (weddings, retreats, corporate): ${c.eventsShareMin}%–${c.eventsShareMax}%`,
    `• Spa & Wellness: ${c.spaShareMin}%–${c.spaShareMax}%`,
    `• Other (activities, tours, retail): ${c.otherShareMin}%–${c.otherShareMax}%`,
    `• Total ancillary target: ${c.totalAncillaryMin}%–${c.totalAncillaryMax}% of room revenue`,
    ``,
    `Fee Structure & Returns:`,
    `• Base management fee: ${c.baseMgmtFeeMin}%–${c.baseMgmtFeeMax}% of total revenue`,
    `• Incentive fee: ${c.incentiveFeeMin}%–${c.incentiveFeeMax}% of GOP`,
    `• Exit cap rate: ${c.exitCapRateMin}%–${c.exitCapRateMax}%`,
    `• Target IRR: ${c.targetIrr}%+`,
    `• Equity multiple: ${c.equityMultipleMin}x–${c.equityMultipleMax}x over ${c.holdYearsMin}–${c.holdYearsMax} year hold`,
    ``,
    `━━━ VENDOR & MANAGED SERVICES ━━━`,
    ``,
    d.vendorServices,
    ``,
    `━━━ REGULATORY & COMPLIANCE ━━━`,
    ``,
    d.regulatoryNotes,
    ``,
    `━━━ EXCLUSIONS ━━━`,
    ``,
    d.exclusions,
  );

  if (d.additionalContext.trim()) {
    lines.push(``, `━━━ ADDITIONAL CONTEXT ━━━`, ``, d.additionalContext);
  }

  return lines.join("\n");
}

export interface ParameterSection {
  title: string;
  fields: ParameterField[];
}

export interface ParameterField {
  key: string;
  label: string;
  type: "number" | "currency" | "priority";
  suffix?: string;
  pair?: string;
  pairLabel?: string;
  help?: string;
  unitType?: UnitType;
  linkedPriority?: string;
  defaultPriority?: Priority;
}

export const PARAMETER_SECTIONS: ParameterSection[] = [
  {
    title: "Guest Rooms & Suites",
    fields: [
      { key: "roomsMin", label: "Rooms", type: "number", pair: "roomsMax", pairLabel: "to", defaultPriority: "must", help: "Total number of bookable guest rooms and suites. Range reflects minimum acceptable to maximum manageable inventory." },
      { key: "roomsSweetSpotMin", label: "Sweet spot", type: "number", pair: "roomsSweetSpotMax", pairLabel: "to", defaultPriority: "must", help: "Ideal room count for optimal operations — small enough for boutique feel, large enough for financial viability." },
      { key: "masterSuitesMin", label: "Master suites (min)", type: "number", defaultPriority: "must", help: "Large premium suites with separate living areas, walk-in closets, and luxury en-suite bathrooms." },
      { key: "masterSuiteSqFt", label: "Master suite size", type: "number", unitType: "area", defaultPriority: "must", help: "Minimum floor area per master suite including bedroom, sitting area, and en-suite bathroom." },
    ],
  },
  {
    title: "Bedrooms, Bathrooms & Areas",
    fields: [
      { key: "bedroomsMin", label: "Bedrooms", type: "number", pair: "bedroomsMax", pairLabel: "to", defaultPriority: "must", help: "Total bedrooms across the property including guest rooms, owner/staff quarters, and auxiliary spaces." },
      { key: "bathroomsMin", label: "Bathrooms", type: "number", pair: "bathroomsMax", pairLabel: "to", defaultPriority: "must", help: "Full bathrooms (toilet, sink, shower/tub). Target at least 1:1 ratio with bedrooms." },
      { key: "halfBaths", label: "Half-baths", type: "number", defaultPriority: "nice", help: "Powder rooms in public and common areas (toilet and sink only). Reduces guest traffic through private wings." },
      { key: "livingAreas", label: "Living/lounge areas (min)", type: "number", defaultPriority: "must", help: "Distinct living rooms, lounges, or sitting areas available for guest use. Multiple areas allow programming variety." },
      { key: "diningCapacityMin", label: "Dining capacity", type: "number", pair: "diningCapacityMax", pairLabel: "to", suffix: "guests", defaultPriority: "must", help: "Number of guests the main dining area can seat for a formal meal service." },
    ],
  },
  {
    title: "Land & Built Area",
    fields: [
      { key: "landAcresMin", label: "Land area", type: "number", pair: "landAcresMax", pairLabel: "to", unitType: "land", defaultPriority: "must", help: "Total property land including buildings, gardens, parking, and undeveloped areas." },
      { key: "builtSqFtMin", label: "Built area", type: "number", pair: "builtSqFtMax", pairLabel: "to", unitType: "area", defaultPriority: "must", help: "Total usable interior space across all structures — main building, outbuildings, staff quarters." },
    ],
  },
  {
    title: "Event Capacity & Parking",
    fields: [
      { key: "indoorEventMin", label: "Indoor event capacity", type: "number", pair: "indoorEventMax", pairLabel: "to", suffix: "guests", defaultPriority: "must", help: "Maximum guests for indoor events such as weddings, corporate retreats, and galas." },
      { key: "outdoorEventMin", label: "Outdoor event capacity", type: "number", pair: "outdoorEventMax", pairLabel: "to", suffix: "guests", defaultPriority: "must", help: "Maximum guests for outdoor events on lawns, terraces, or courtyards." },
      { key: "parkingMin", label: "Parking spaces", type: "number", pair: "parkingMax", pairLabel: "to", defaultPriority: "must", help: "On-site parking spots including standard, accessible, and overflow areas." },
    ],
  },
  {
    title: "Food & Beverage",
    fields: [
      { key: "fbRating", label: "F&B Rating (1–5)", type: "number", defaultPriority: "must", help: "Overall F&B operation rating on a 1–5 scale. 1 = continental breakfast only, 2 = limited F&B, 3 = full breakfast + light dinner, 4 = full-service restaurant + bar, 5 = destination dining with celebrity chef and extensive wine program." },
    ],
  },
  {
    title: "Operational Facilities",
    fields: [
      { key: "kitchenSqFt", label: "Kitchen (min)", type: "number", unitType: "area", defaultPriority: "must", help: "Commercial or semi-commercial kitchen with hood ventilation, grease trap, walk-in cooler/freezer, prep and dish areas." },
      { key: "maintenanceSqFt", label: "Maintenance/storage (min)", type: "number", unitType: "area", defaultPriority: "must", help: "Workshop and general storage for maintenance equipment, supplies, and seasonal items." },
      { key: "staffQuartersMin", label: "Staff quarters capacity", type: "number", pair: "staffQuartersMax", pairLabel: "to", suffix: "staff", defaultPriority: "must", help: "On-site break room or quarters capacity for key operational staff during shifts." },
      { key: "staffHousingUnits", label: "Staff housing units", type: "number", defaultPriority: "nice", help: "Separate residential units for live-in staff (manager, chef, groundskeeper). Critical for rural locations." },
    ],
  },
  {
    title: "Aquatic & Wellness",
    fields: [
      { key: "pool", label: "Swimming pool", type: "priority", help: "Primary swimming pool for guest use. Heated pools extend seasonal availability." },
      { key: "poolSqFt", label: "Pool area (min)", type: "number", unitType: "area", linkedPriority: "pool", help: "Minimum surface area of the main pool deck and water area combined." },
      { key: "secondPool", label: "Second pool / plunge", type: "priority", help: "Additional pool, plunge pool, or children's pool. Adds programming flexibility." },
      { key: "hotTub", label: "Hot tub / jacuzzi", type: "priority", help: "Outdoor or indoor hot tub for guest relaxation. Often paired with pool." },
      { key: "spa", label: "Spa facility", type: "priority", help: "Dedicated spa with treatment rooms, relaxation areas. Major ancillary revenue driver." },
      { key: "spaTreatmentRooms", label: "Treatment rooms", type: "number", linkedPriority: "spa", help: "Individual rooms for massage, facials, and body treatments. 2–4 rooms typical for boutique operations." },
      { key: "sauna", label: "Sauna", type: "priority", help: "Dry heat sauna (traditional Finnish or infrared). Enhances wellness offering." },
      { key: "steamRoom", label: "Steam room", type: "priority", help: "Wet steam room for therapeutic use. Often paired with sauna and cold plunge." },
      { key: "coldPlunge", label: "Cold plunge", type: "priority", help: "Cold water immersion pool or tub. Trending wellness amenity for recovery." },
      { key: "yogaStudio", label: "Yoga / meditation studio", type: "priority", help: "Dedicated indoor or covered outdoor space for yoga, meditation, and mindfulness classes." },
    ],
  },
  {
    title: "Fitness & Recreation",
    fields: [
      { key: "gym", label: "Gym / fitness center", type: "priority", help: "On-site fitness facility with cardio and strength equipment. Guest expectation at luxury properties." },
      { key: "gymSqFtMin", label: "Gym area", type: "number", pair: "gymSqFtMax", pairLabel: "to", unitType: "area", linkedPriority: "gym", help: "Floor area for fitness equipment, free weights, and stretching space." },
      { key: "tennis", label: "Tennis court", type: "priority", help: "Regulation or half-size tennis court. Hard court, clay, or grass surface." },
      { key: "tennisCourts", label: "Tennis courts (qty)", type: "number", linkedPriority: "tennis", help: "Number of tennis courts. One court is typical for boutique properties." },
      { key: "pickleball", label: "Pickleball court", type: "priority", help: "Fastest-growing racket sport. Can share space with tennis courts or be standalone." },
      { key: "pickleballCourts", label: "Pickleball courts (qty)", type: "number", linkedPriority: "pickleball", help: "Number of dedicated pickleball courts. Increasingly requested by guests." },
      { key: "basketball", label: "Basketball half-court", type: "priority", help: "Half-court basketball area for recreation. Can double as multi-sport surface." },
      { key: "hikingTrails", label: "Hiking / walking trails", type: "priority", help: "On-property trails through natural areas, gardens, or meadows. Enhances the estate experience." },
    ],
  },
  {
    title: "Equestrian & Agricultural",
    fields: [
      { key: "horseFacilities", label: "Horse facilities", type: "priority", help: "Stables, paddocks, riding arena, and trail access. Major differentiator for estate properties." },
      { key: "horseStalls", label: "Horse stalls", type: "number", linkedPriority: "horseFacilities", help: "Number of individual horse stalls in the stable building." },
      { key: "pastureAcres", label: "Pasture area", type: "number", unitType: "land", linkedPriority: "horseFacilities", help: "Fenced grazing land for horses or livestock." },
      { key: "garden", label: "Vegetable / herb garden", type: "priority", help: "Farm-to-table garden for restaurant use. Guest engagement opportunity." },
      { key: "vineyard", label: "Vineyard / orchard / olive grove", type: "priority", help: "Working vineyard, fruit orchard, or olive grove. Revenue and experience asset." },
    ],
  },
  {
    title: "Outbuildings & Structures",
    fields: [
      { key: "casitas", label: "Casitas / cottages", type: "priority", help: "Detached guest accommodations with private entrances. Premium ADR potential." },
      { key: "casitasCount", label: "Casitas (qty)", type: "number", linkedPriority: "casitas", help: "Number of individual casitas, cottages, or cabins on property." },
      { key: "barn", label: "Barn (events/dining)", type: "priority", help: "Restored barn for events, private dining, or entertainment. Rustic luxury appeal." },
      { key: "glamping", label: "Glamping / A-frames", type: "priority", help: "Luxury camping structures: safari tents, A-frame cabins, treehouses. Unique inventory." },
      { key: "greenhouse", label: "Greenhouse", type: "priority", help: "Greenhouse or conservatory for growing, events, or dining. Year-round use." },
      { key: "chapel", label: "Chapel / ceremony structure", type: "priority", help: "Dedicated ceremony space for weddings, vow renewals, and spiritual events." },
      { key: "firePit", label: "Fire pit areas", type: "priority", help: "Outdoor fire pit with seating for evening gatherings, s'mores, stargazing." },
      { key: "wineCellar", label: "Wine cellar / tasting room", type: "priority", help: "Temperature-controlled wine storage with tasting area for curated experiences." },
      { key: "gameRoom", label: "Game room / media room", type: "priority", help: "Indoor recreation space with billiards, board games, home theater, or arcade." },
      { key: "library", label: "Library / reading room", type: "priority", help: "Quiet reading room or library with curated collection. Classic estate amenity." },
      { key: "outdoorKitchen", label: "Outdoor cooking area", type: "priority", help: "Outdoor kitchen with grill, pizza oven, prep area for alfresco dining and cooking classes." },
      { key: "garageBays", label: "Garage bays", type: "number", help: "Enclosed parking bays for owner vehicles, equipment, or guest use." },
    ],
  },
  {
    title: "Condition Thresholds",
    fields: [
      { key: "maxRoofAge", label: "Max roof age", type: "number", suffix: "years", defaultPriority: "must", help: "Maximum acceptable age of the roofing system. Older roofs require costly replacement ($50K–$200K+)." },
      { key: "minElectricalAmps", label: "Min electrical service", type: "number", suffix: "amps", defaultPriority: "must", help: "Minimum electrical panel amperage. Commercial kitchens and HVAC require 200+ amps." },
      { key: "maxRenovationBudget", label: "Max renovation budget", type: "currency", defaultPriority: "must", help: "Hard cap on total renovation and conversion costs. Properties exceeding this are excluded." },
    ],
  },
  {
    title: "Privacy & Security",
    fields: [
      { key: "minSetbackFt", label: "Min setback from roads", type: "number", unitType: "distance", defaultPriority: "must", help: "Minimum distance from the main building to the nearest public road for visual and acoustic privacy." },
      { key: "minDrivewayFt", label: "Min driveway approach", type: "number", unitType: "distance", defaultPriority: "nice", help: "Length of private driveway from the property entrance to the main building. Longer driveways enhance exclusivity." },
    ],
  },
  {
    title: "Location & Accessibility",
    fields: [
      { key: "maxAirportMin", label: "Max to regional airport", type: "number", suffix: "min", defaultPriority: "must", help: "Maximum drive time to the nearest regional/domestic airport. Beyond this, guest convenience drops sharply." },
      { key: "prefAirportMin", label: "Preferred to regional airport", type: "number", suffix: "min", defaultPriority: "nice", help: "Preferred drive time to regional airport. Shorter times allow for weekend trips and easy access." },
      { key: "maxIntlAirportMin", label: "Max to intl airport", type: "number", suffix: "min", defaultPriority: "must", help: "Maximum drive time to the nearest international airport. Critical for overseas guests and long-haul travelers." },
      { key: "prefIntlAirportMin", label: "Preferred to intl airport", type: "number", suffix: "min", defaultPriority: "nice", help: "Preferred drive time to international airport. Properties closer to international hubs command higher ADR from global clientele." },
      { key: "maxHospitalMin", label: "Max to hospital", type: "number", suffix: "min", defaultPriority: "must", help: "Maximum drive time to nearest hospital or urgent care. Critical for guest safety and insurance." },
      { key: "prefHospitalMin", label: "Preferred to hospital", type: "number", suffix: "min", defaultPriority: "nice", help: "Preferred proximity to medical facilities for added peace of mind." },
    ],
  },
  {
    title: "Acquisition & Investment",
    fields: [
      { key: "acquisitionMin", label: "Acquisition price", type: "currency", pair: "acquisitionMax", pairLabel: "to", defaultPriority: "must", help: "Purchase price range for the property. Excludes renovation and FF&E costs." },
      { key: "acquisitionTargetMin", label: "Target sweet spot", type: "currency", pair: "acquisitionTargetMax", pairLabel: "to", defaultPriority: "must", help: "Preferred acquisition price range within the broader acceptable range." },
      { key: "totalInvestmentMin", label: "Total investment", type: "currency", pair: "totalInvestmentMax", pairLabel: "to", defaultPriority: "must", help: "All-in cost: acquisition + renovation + FF&E + soft costs + working capital." },
      { key: "renovationMin", label: "Renovation/conversion", type: "currency", pair: "renovationMax", pairLabel: "to", defaultPriority: "must", help: "Budget for structural renovation, cosmetic updates, and hospitality conversion." },
      { key: "ffePerRoomMin", label: "FF&E per room", type: "currency", pair: "ffePerRoomMax", pairLabel: "to", defaultPriority: "must", help: "Furniture, fixtures, and equipment budget per guest room. Industry range: $15K–$50K." },
    ],
  },
  {
    title: "Revenue Benchmarks",
    fields: [
      { key: "adrMin", label: "Target ADR", type: "currency", pair: "adrMax", pairLabel: "to", suffix: "/night", defaultPriority: "must", help: "Average Daily Rate — the average revenue per occupied room per night." },
      { key: "occupancyMin", label: "Stabilized occupancy", type: "number", suffix: "%", pair: "occupancyMax", pairLabel: "to", defaultPriority: "must", help: "Expected occupancy rate at stabilization (after ramp-up period). Boutique hotels: 55%–75%." },
      { key: "occupancyRampMonths", label: "Occupancy ramp", type: "number", suffix: "months", defaultPriority: "must", help: "Months from opening to reach stabilized occupancy. Typical: 12–24 months for new operations." },
      { key: "revParMin", label: "RevPAR target", type: "currency", pair: "revParMax", pairLabel: "to", suffix: "/night", defaultPriority: "must", help: "Revenue Per Available Room = ADR × Occupancy. Key performance metric." },
    ],
  },
  {
    title: "Revenue Mix (% of Room Revenue)",
    fields: [
      { key: "fbShareMin", label: "Food & Beverage", type: "number", suffix: "%", pair: "fbShareMax", pairLabel: "to", defaultPriority: "must", help: "F&B revenue as a percentage of room revenue. Includes restaurant, bar, room service, catering." },
      { key: "eventsShareMin", label: "Events", type: "number", suffix: "%", pair: "eventsShareMax", pairLabel: "to", defaultPriority: "must", help: "Event revenue from weddings, corporate retreats, and private functions as % of room revenue." },
      { key: "spaShareMin", label: "Spa & Wellness", type: "number", suffix: "%", pair: "spaShareMax", pairLabel: "to", defaultPriority: "nice", help: "Spa and wellness service revenue as % of room revenue. Includes treatments, memberships." },
      { key: "otherShareMin", label: "Other services", type: "number", suffix: "%", pair: "otherShareMax", pairLabel: "to", defaultPriority: "nice", help: "Other ancillary revenue: activities, tours, retail, equestrian, experiences." },
      { key: "totalAncillaryMin", label: "Total ancillary", type: "number", suffix: "%", pair: "totalAncillaryMax", pairLabel: "to", defaultPriority: "must", help: "Sum of all non-room revenue as % of room revenue. Higher = more diversified income." },
    ],
  },
  {
    title: "Fee Structure & Returns",
    fields: [
      { key: "baseMgmtFeeMin", label: "Base management fee", type: "number", suffix: "%", pair: "baseMgmtFeeMax", pairLabel: "to", defaultPriority: "must", help: "Management fee as % of total revenue. Industry range: 3%–12% depending on services." },
      { key: "incentiveFeeMin", label: "Incentive fee (GOP)", type: "number", suffix: "%", pair: "incentiveFeeMax", pairLabel: "to", defaultPriority: "must", help: "Incentive fee as % of Gross Operating Profit. Aligns manager and owner interests." },
      { key: "exitCapRateMin", label: "Exit cap rate", type: "number", suffix: "%", pair: "exitCapRateMax", pairLabel: "to", defaultPriority: "must", help: "Capitalization rate assumed at disposition. Lower cap rate = higher property value." },
      { key: "targetIrr", label: "Target IRR (min)", type: "number", suffix: "%", defaultPriority: "must", help: "Minimum Internal Rate of Return required for the investment to meet hurdle rate." },
      { key: "equityMultipleMin", label: "Equity multiple", type: "number", suffix: "x", pair: "equityMultipleMax", pairLabel: "to", defaultPriority: "must", help: "Total return on invested equity. 2.0x means investors double their money." },
      { key: "holdYearsMin", label: "Hold period", type: "number", suffix: "years", pair: "holdYearsMax", pairLabel: "to", defaultPriority: "must", help: "Planned investment hold period from acquisition to disposition." },
    ],
  },
];

export interface DescriptiveSection {
  key: keyof IcpDescriptive;
  label: string;
  rows: number;
  help: string;
}

export const DESCRIPTIVE_SECTIONS: DescriptiveSection[] = [
  { key: "propertyTypes", label: "Property Type & Positioning", rows: 4, help: "Target property types, architectural character, exclusions" },
  { key: "fbLevel", label: "Food & Beverage Level", rows: 5, help: "Describe the expected F&B operation level: restaurant concept, service style, cuisine direction, bar program, event catering, and revenue expectations" },
  { key: "locationCharacteristics", label: "Location Characteristics", rows: 4, help: "Privacy requirements, accessibility, tourism demand generators" },
  { key: "usRegions", label: "Preferred US Regions", rows: 5, help: "Markets and sub-markets in the United States" },
  { key: "latAmRegions", label: "Preferred Latin America", rows: 4, help: "Markets and sub-markets in Latin America" },
  { key: "emeaRegions", label: "Preferred EMEA", rows: 5, help: "Markets and sub-markets in Europe, Middle East & Africa" },
  { key: "conditionNotes", label: "Property Condition Notes", rows: 3, help: "Structural condition, historic designation, architectural style" },
  { key: "groundsTopography", label: "Grounds & Topography", rows: 3, help: "Terrain, landscaping, water features, views" },
  { key: "vendorServices", label: "Vendor & Managed Services", rows: 6, help: "Third-party services coordinated through the management company" },
  { key: "regulatoryNotes", label: "Regulatory & Compliance", rows: 4, help: "Zoning, permits, fire code, ADA, licensing requirements" },
  { key: "exclusions", label: "Exclusions", rows: 5, help: "Property types, conditions, or situations that disqualify a target" },
  { key: "additionalContext", label: "Additional Context", rows: 3, help: "Any other context to include in the ICP prompt" },
];

const FB_RATING_LABELS: Record<number, string> = {
  1: "continental breakfast only",
  2: "limited food and beverage with light meal options",
  3: "full breakfast service with light dinner offerings",
  4: "full-service restaurant with bar and lounge program",
  5: "destination dining with chef-driven cuisine, extensive wine program, and private dining experiences",
};

export function generateIcpEssay(c: IcpConfig, d: IcpDescriptive, propertyLabel: string): string {
  const du = (v: number, ut: UnitType) => dualUnit(v, ut, false);
  const fbDesc = FB_RATING_LABELS[c.fbRating] || FB_RATING_LABELS[4];

  const paragraphs: string[] = [];

  paragraphs.push(
    `The ideal acquisition target for ${propertyLabel} is a ${d.propertyTypes.split(".")[0].toLowerCase().trim()}. ` +
    `The property should offer between ${c.roomsMin} and ${c.roomsMax} guest rooms or suites, with a sweet spot of ${c.roomsSweetSpotMin} to ${c.roomsSweetSpotMax} rooms. ` +
    `At minimum, the property must include ${c.masterSuitesMin} master suites of at least ${du(c.masterSuiteSqFt, "area")} each, ` +
    `with a total of ${c.bedroomsMin} to ${c.bedroomsMax} bedrooms and ${c.bathroomsMin} to ${c.bathroomsMax} bathrooms across the property. ` +
    `The land should span ${du(c.landAcresMin, "land")} to ${du(c.landAcresMax, "land")}, ` +
    `with ${du(c.builtSqFtMin, "area")} to ${du(c.builtSqFtMax, "area")} of usable interior space.`
  );

  paragraphs.push(
    `Food and beverage operations are rated at ${c.fbRating} out of 5, reflecting ${fbDesc}. ` +
    `The dining area should seat ${c.diningCapacityMin} to ${c.diningCapacityMax} guests. ` +
    `F&B revenue is targeted at ${c.fbShareMin}% to ${c.fbShareMax}% of room revenue, ` +
    `with events contributing ${c.eventsShareMin}% to ${c.eventsShareMax}%, ` +
    `spa and wellness at ${c.spaShareMin}% to ${c.spaShareMax}%, ` +
    `and other ancillary services at ${c.otherShareMin}% to ${c.otherShareMax}%. ` +
    `Total ancillary revenue should reach ${c.totalAncillaryMin}% to ${c.totalAncillaryMax}% of room revenue.`
  );

  paragraphs.push(
    `The property must accommodate indoor events for ${c.indoorEventMin} to ${c.indoorEventMax} guests ` +
    `and outdoor events for ${c.outdoorEventMin} to ${c.outdoorEventMax} guests, ` +
    `with ${c.parkingMin} to ${c.parkingMax} parking spaces on site. ` +
    `Operational facilities include a commercial kitchen of at least ${du(c.kitchenSqFt, "area")}, ` +
    `maintenance and storage space of ${du(c.maintenanceSqFt, "area")}, ` +
    `and staff quarters for ${c.staffQuartersMin} to ${c.staffQuartersMax} key personnel.`
  );

  const amenityList: string[] = [];
  const amenityNames: [string, Priority][] = [
    ["swimming pool", c.pool], ["spa", c.spa], ["gym", c.gym],
    ["tennis", c.tennis], ["pickleball", c.pickleball],
    ["hiking trails", c.hikingTrails], ["equestrian facilities", c.horseFacilities],
    ["vineyard or orchard", c.vineyard], ["casitas", c.casitas],
  ];
  const required = amenityNames.filter(([, p]) => p === "must").map(([n]) => n);
  const preferred = amenityNames.filter(([, p]) => p === "major" || p === "nice").map(([n]) => n);
  if (required.length > 0 || preferred.length > 0) {
    let s = "";
    if (required.length > 0) s += `Required amenities include ${required.join(", ")}. `;
    if (preferred.length > 0) s += `Preferred amenities include ${preferred.join(", ")}.`;
    amenityList.push(s.trim());
  }
  if (amenityList.length > 0) paragraphs.push(amenityList.join(" "));

  paragraphs.push(
    `The property must be in good to excellent structural condition with a roof no older than ${c.maxRoofAge} years ` +
    `and electrical service of at least ${c.minElectricalAmps} amps. ` +
    `Total renovation budget must remain under ${fmt$(c.maxRenovationBudget)}. ` +
    `A minimum setback of ${du(c.minSetbackFt, "distance")} from public roads is required for privacy.`
  );

  paragraphs.push(
    `The property should be within ${c.maxAirportMin} minutes of a regional airport (preferably ${c.prefAirportMin} minutes) ` +
    `and within ${c.maxIntlAirportMin} minutes of an international airport (preferably ${c.prefIntlAirportMin} minutes). ` +
    `Access to a hospital or urgent care within ${c.maxHospitalMin} minutes is required.`
  );

  paragraphs.push(
    `From a financial perspective, the acquisition price range is ${fmt$(c.acquisitionMin)} to ${fmt$(c.acquisitionMax)}, ` +
    `with a target sweet spot of ${fmt$(c.acquisitionTargetMin)} to ${fmt$(c.acquisitionTargetMax)}. ` +
    `Total investment including renovation and FF&E ranges from ${fmt$(c.totalInvestmentMin)} to ${fmt$(c.totalInvestmentMax)}. ` +
    `The target ADR is $${c.adrMin} to $${c.adrMax} per night, ` +
    `with stabilized occupancy of ${c.occupancyMin}% to ${c.occupancyMax}% after a ${c.occupancyRampMonths}-month ramp-up. ` +
    `The management fee structure includes a base fee of ${c.baseMgmtFeeMin}% to ${c.baseMgmtFeeMax}% of total revenue ` +
    `and an incentive fee of ${c.incentiveFeeMin}% to ${c.incentiveFeeMax}% of GOP. ` +
    `The investment targets a minimum IRR of ${c.targetIrr}%, ` +
    `an equity multiple of ${c.equityMultipleMin}x to ${c.equityMultipleMax}x, ` +
    `over a ${c.holdYearsMin} to ${c.holdYearsMax}-year hold period, ` +
    `with an exit cap rate of ${c.exitCapRateMin}% to ${c.exitCapRateMax}%.`
  );

  if (d.exclusions.trim()) {
    const excl = d.exclusions.split("\n").filter(Boolean).map(e => e.trim().toLowerCase()).slice(0, 5);
    paragraphs.push(`Key exclusions: ${excl.join("; ")}.`);
  }

  return paragraphs.join("\n\n");
}
