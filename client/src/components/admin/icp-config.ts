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
}

export type Priority = "must" | "nice" | "no";

export const PRIORITY_LABELS: Record<Priority, string> = {
  must: "Must Have",
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
};

export interface IcpDescriptive {
  propertyTypes: string;
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

function pr(p: Priority): string {
  return p === "must" ? "MUST HAVE" : p === "nice" ? "NICE TO HAVE" : "EXCLUDED";
}

function fmt$(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function amenityLine(name: string, priority: Priority, detail?: string): string {
  if (priority === "no") return "";
  const tag = priority === "must" ? "(M)" : "(N)";
  return `${tag} ${name}${detail ? ` — ${detail}` : ""}`;
}

export function generateIcpPrompt(c: IcpConfig, d: IcpDescriptive, propertyLabel: string): string {
  const amenities = [
    amenityLine("Swimming pool", c.pool, `min ${c.poolSqFt} sq ft surface area`),
    amenityLine("Second pool / plunge pool", c.secondPool),
    amenityLine("Hot tub / jacuzzi", c.hotTub),
    amenityLine("Spa facility", c.spa, `${c.spaTreatmentRooms} treatment rooms`),
    amenityLine("Sauna", c.sauna),
    amenityLine("Steam room", c.steamRoom),
    amenityLine("Cold plunge", c.coldPlunge),
    amenityLine("Yoga / meditation studio", c.yogaStudio),
    amenityLine("Gym / fitness center", c.gym, `${c.gymSqFtMin}–${c.gymSqFtMax} sq ft`),
    amenityLine("Tennis court", c.tennis, `${c.tennisCourts} court(s)`),
    amenityLine("Pickleball court", c.pickleball, `${c.pickleballCourts} court(s)`),
    amenityLine("Basketball half-court", c.basketball),
    amenityLine("Hiking / walking trails", c.hikingTrails),
    amenityLine("Equestrian facilities", c.horseFacilities, `${c.horseStalls} stalls, ${c.pastureAcres} acres pasture`),
    amenityLine("Vegetable / herb garden", c.garden),
    amenityLine("Vineyard / orchard / olive grove", c.vineyard),
    amenityLine("Casitas / cottages", c.casitas, `${c.casitasCount} units`),
    amenityLine("Barn (events/dining)", c.barn),
    amenityLine("Glamping / A-frames / treehouses", c.glamping),
    amenityLine("Greenhouse / conservatory", c.greenhouse),
    amenityLine("Chapel / ceremony structure", c.chapel),
    amenityLine("Fire pit areas", c.firePit),
    amenityLine("Wine cellar / tasting room", c.wineCellar),
    amenityLine("Game room / media room", c.gameRoom),
    amenityLine("Library / reading room", c.library),
    amenityLine("Outdoor cooking area", c.outdoorKitchen),
  ].filter(Boolean);

  const lines = [
    `IDEAL CUSTOMER PROFILE — ${propertyLabel.toUpperCase()} TARGET DEFINITION`,
    ``,
    `This profile defines the ideal property acquisition target. Each deterministic attribute is classified as MUST HAVE (M) or NICE TO HAVE (N). Use this profile for ADR estimation, revenue mix projection, cost benchmarking, and market analysis.`,
    ``,
    `━━━ PROPERTY TYPE & POSITIONING ━━━`,
    d.propertyTypes,
    ``,
    `━━━ SIZE, CAPACITY & PHYSICAL DIMENSIONS ━━━`,
    ``,
    `Guest Rooms & Suites:`,
    `(M) ${c.roomsMin}–${c.roomsMax} guest rooms or suites (sweet spot: ${c.roomsSweetSpotMin}–${c.roomsSweetSpotMax})`,
    `(M) Minimum ${c.masterSuitesMin} master suites (${c.masterSuiteSqFt}+ sq ft each) with en-suite bathrooms`,
    ``,
    `Bedrooms & Bathrooms (Total Property):`,
    `(M) ${c.bedroomsMin}–${c.bedroomsMax} total bedrooms (guest rooms + staff/owner quarters)`,
    `(M) ${c.bathroomsMin}–${c.bathroomsMax} total bathrooms (at least 1:1 ratio to bedrooms)`,
    `(N) ${c.halfBaths} additional half-baths in public/common areas`,
    ``,
    `Land & Built Area:`,
    `(M) ${c.landAcresMin}–${c.landAcresMax}+ acres total land area`,
    `(M) ${c.builtSqFtMin.toLocaleString()}–${c.builtSqFtMax.toLocaleString()} sq ft usable interior space`,
    ``,
    `Living & Common Areas:`,
    `(M) ${c.livingAreas}+ distinct living/lounge areas for guest use`,
    `(M) Dining area seating ${c.diningCapacityMin}–${c.diningCapacityMax} guests`,
    ``,
    `Event Capacity:`,
    `(M) Indoor: ${c.indoorEventMin}–${c.indoorEventMax} guests`,
    `(M) Outdoor: ${c.outdoorEventMin}–${c.outdoorEventMax} guests`,
    `(M) Parking: ${c.parkingMin}–${c.parkingMax}+ spaces`,
    ``,
    `━━━ OPERATIONAL FACILITIES ━━━`,
    ``,
    `(M) Commercial/semi-commercial kitchen: ${c.kitchenSqFt}+ sq ft with hood ventilation, grease trap, walk-in cooler/freezer, prep area, dish pit, dry storage, receiving dock`,
    `(M) Maintenance workshop and general storage: ${c.maintenanceSqFt}+ sq ft`,
    `(M) Staff quarters or break room: on-site capacity for ${c.staffQuartersMin}–${c.staffQuartersMax} key staff`,
    `(N) Staff housing: ${c.staffHousingUnits} separate units`,
    `(M) Administrative office space (front desk, back office, manager's office)`,
    `(M) Housekeeping storage, laundry room with commercial washers/dryers`,
    `(M) Receiving/loading area for vendor deliveries`,
    ``,
    `━━━ AMENITIES & GUEST FACILITIES ━━━`,
    ``,
    ...amenities,
    `(N) Garage: ${c.garageBays}+ bays`,
    ``,
    `━━━ PROPERTY CONDITION ━━━`,
    ``,
    `(M) Roof age: less than ${c.maxRoofAge} years`,
    `(M) Electrical: ${c.minElectricalAmps}+ amp service`,
    `(M) Renovation/FF&E budget must stay under ${fmt$(c.maxRenovationBudget)}`,
    d.conditionNotes,
    ``,
    `━━━ GROUNDS & TOPOGRAPHY ━━━`,
    ``,
    d.groundsTopography,
    ``,
    `━━━ PRIVACY & SECURITY ━━━`,
    ``,
    `(M) Minimum ${c.minSetbackFt} ft setback from public roads`,
    `(N) Private driveway: ${c.minDrivewayFt}+ ft approach`,
    `(M) Perimeter fencing, walls, hedgerows, or natural tree line for visual/acoustic screening`,
    ``,
    `━━━ LOCATION & ACCESSIBILITY ━━━`,
    ``,
    `(M) Within ${c.maxAirportMin} minutes of a regional/international airport (${c.prefAirportMin} min preferred)`,
    `(M) Within ${c.maxHospitalMin} minutes of a hospital/urgent care (${c.prefHospitalMin} min preferred)`,
    d.locationCharacteristics,
    ``,
    `━━━ PREFERRED GEOGRAPHIES ━━━`,
    ``,
    `United States:`,
    d.usRegions,
    ``,
    `Latin America:`,
    d.latAmRegions,
    ``,
    `EMEA:`,
    d.emeaRegions,
    ``,
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
  ];

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
}

export const PARAMETER_SECTIONS: ParameterSection[] = [
  {
    title: "Guest Rooms & Suites",
    fields: [
      { key: "roomsMin", label: "Rooms (range)", type: "number", pair: "roomsMax", pairLabel: "to" },
      { key: "roomsSweetSpotMin", label: "Sweet spot", type: "number", pair: "roomsSweetSpotMax", pairLabel: "to" },
      { key: "masterSuitesMin", label: "Master suites (min)", type: "number" },
      { key: "masterSuiteSqFt", label: "Master suite size", type: "number", suffix: "sq ft" },
    ],
  },
  {
    title: "Bedrooms, Bathrooms & Areas",
    fields: [
      { key: "bedroomsMin", label: "Bedrooms (range)", type: "number", pair: "bedroomsMax", pairLabel: "to" },
      { key: "bathroomsMin", label: "Bathrooms (range)", type: "number", pair: "bathroomsMax", pairLabel: "to" },
      { key: "halfBaths", label: "Half-baths", type: "number" },
      { key: "livingAreas", label: "Living/lounge areas (min)", type: "number" },
      { key: "diningCapacityMin", label: "Dining capacity", type: "number", pair: "diningCapacityMax", pairLabel: "to" },
    ],
  },
  {
    title: "Land & Built Area",
    fields: [
      { key: "landAcresMin", label: "Land (acres)", type: "number", pair: "landAcresMax", pairLabel: "to" },
      { key: "builtSqFtMin", label: "Built area", type: "number", suffix: "sq ft", pair: "builtSqFtMax", pairLabel: "to" },
    ],
  },
  {
    title: "Event Capacity & Parking",
    fields: [
      { key: "indoorEventMin", label: "Indoor event", type: "number", suffix: "guests", pair: "indoorEventMax", pairLabel: "to" },
      { key: "outdoorEventMin", label: "Outdoor event", type: "number", suffix: "guests", pair: "outdoorEventMax", pairLabel: "to" },
      { key: "parkingMin", label: "Parking spaces", type: "number", pair: "parkingMax", pairLabel: "to" },
    ],
  },
  {
    title: "Operational Facilities",
    fields: [
      { key: "kitchenSqFt", label: "Kitchen (min)", type: "number", suffix: "sq ft" },
      { key: "maintenanceSqFt", label: "Maintenance/storage (min)", type: "number", suffix: "sq ft" },
      { key: "staffQuartersMin", label: "Staff quarters capacity", type: "number", pair: "staffQuartersMax", pairLabel: "to" },
      { key: "staffHousingUnits", label: "Staff housing units", type: "number" },
    ],
  },
  {
    title: "Aquatic & Wellness",
    fields: [
      { key: "pool", label: "Swimming pool", type: "priority" },
      { key: "poolSqFt", label: "Pool area (min)", type: "number", suffix: "sq ft" },
      { key: "secondPool", label: "Second pool / plunge", type: "priority" },
      { key: "hotTub", label: "Hot tub / jacuzzi", type: "priority" },
      { key: "spa", label: "Spa facility", type: "priority" },
      { key: "spaTreatmentRooms", label: "Treatment rooms", type: "number" },
      { key: "sauna", label: "Sauna", type: "priority" },
      { key: "steamRoom", label: "Steam room", type: "priority" },
      { key: "coldPlunge", label: "Cold plunge", type: "priority" },
      { key: "yogaStudio", label: "Yoga / meditation studio", type: "priority" },
    ],
  },
  {
    title: "Fitness & Recreation",
    fields: [
      { key: "gym", label: "Gym / fitness center", type: "priority" },
      { key: "gymSqFtMin", label: "Gym area", type: "number", suffix: "sq ft", pair: "gymSqFtMax", pairLabel: "to" },
      { key: "tennis", label: "Tennis court", type: "priority" },
      { key: "tennisCourts", label: "Tennis courts (qty)", type: "number" },
      { key: "pickleball", label: "Pickleball court", type: "priority" },
      { key: "pickleballCourts", label: "Pickleball courts (qty)", type: "number" },
      { key: "basketball", label: "Basketball half-court", type: "priority" },
      { key: "hikingTrails", label: "Hiking / walking trails", type: "priority" },
    ],
  },
  {
    title: "Equestrian & Agricultural",
    fields: [
      { key: "horseFacilities", label: "Horse facilities", type: "priority" },
      { key: "horseStalls", label: "Horse stalls", type: "number" },
      { key: "pastureAcres", label: "Pasture area", type: "number", suffix: "acres" },
      { key: "garden", label: "Vegetable / herb garden", type: "priority" },
      { key: "vineyard", label: "Vineyard / orchard / olive grove", type: "priority" },
    ],
  },
  {
    title: "Outbuildings & Structures",
    fields: [
      { key: "casitas", label: "Casitas / cottages", type: "priority" },
      { key: "casitasCount", label: "Casitas (qty)", type: "number" },
      { key: "barn", label: "Barn (events/dining)", type: "priority" },
      { key: "glamping", label: "Glamping / A-frames", type: "priority" },
      { key: "greenhouse", label: "Greenhouse", type: "priority" },
      { key: "chapel", label: "Chapel / ceremony structure", type: "priority" },
      { key: "firePit", label: "Fire pit areas", type: "priority" },
      { key: "wineCellar", label: "Wine cellar / tasting room", type: "priority" },
      { key: "gameRoom", label: "Game room / media room", type: "priority" },
      { key: "library", label: "Library / reading room", type: "priority" },
      { key: "outdoorKitchen", label: "Outdoor cooking area", type: "priority" },
      { key: "garageBays", label: "Garage bays", type: "number" },
    ],
  },
  {
    title: "Condition Thresholds",
    fields: [
      { key: "maxRoofAge", label: "Max roof age", type: "number", suffix: "years" },
      { key: "minElectricalAmps", label: "Min electrical service", type: "number", suffix: "amps" },
      { key: "maxRenovationBudget", label: "Max renovation budget", type: "currency" },
    ],
  },
  {
    title: "Privacy & Security",
    fields: [
      { key: "minSetbackFt", label: "Min setback from roads", type: "number", suffix: "ft" },
      { key: "minDrivewayFt", label: "Min driveway approach", type: "number", suffix: "ft" },
    ],
  },
  {
    title: "Location & Accessibility",
    fields: [
      { key: "maxAirportMin", label: "Max to airport", type: "number", suffix: "min" },
      { key: "prefAirportMin", label: "Preferred to airport", type: "number", suffix: "min" },
      { key: "maxHospitalMin", label: "Max to hospital", type: "number", suffix: "min" },
      { key: "prefHospitalMin", label: "Preferred to hospital", type: "number", suffix: "min" },
    ],
  },
  {
    title: "Acquisition & Investment",
    fields: [
      { key: "acquisitionMin", label: "Acquisition price", type: "currency", pair: "acquisitionMax", pairLabel: "to" },
      { key: "acquisitionTargetMin", label: "Target sweet spot", type: "currency", pair: "acquisitionTargetMax", pairLabel: "to" },
      { key: "totalInvestmentMin", label: "Total investment", type: "currency", pair: "totalInvestmentMax", pairLabel: "to" },
      { key: "renovationMin", label: "Renovation/conversion", type: "currency", pair: "renovationMax", pairLabel: "to" },
      { key: "ffePerRoomMin", label: "FF&E per room", type: "currency", pair: "ffePerRoomMax", pairLabel: "to" },
    ],
  },
  {
    title: "Revenue Benchmarks",
    fields: [
      { key: "adrMin", label: "Target ADR", type: "currency", pair: "adrMax", pairLabel: "to", suffix: "/night" },
      { key: "occupancyMin", label: "Stabilized occupancy", type: "number", suffix: "%", pair: "occupancyMax", pairLabel: "to" },
      { key: "occupancyRampMonths", label: "Occupancy ramp", type: "number", suffix: "months" },
      { key: "revParMin", label: "RevPAR target", type: "currency", pair: "revParMax", pairLabel: "to", suffix: "/night" },
    ],
  },
  {
    title: "Revenue Mix (% of Room Revenue)",
    fields: [
      { key: "fbShareMin", label: "Food & Beverage", type: "number", suffix: "%", pair: "fbShareMax", pairLabel: "to" },
      { key: "eventsShareMin", label: "Events", type: "number", suffix: "%", pair: "eventsShareMax", pairLabel: "to" },
      { key: "spaShareMin", label: "Spa & Wellness", type: "number", suffix: "%", pair: "spaShareMax", pairLabel: "to" },
      { key: "otherShareMin", label: "Other services", type: "number", suffix: "%", pair: "otherShareMax", pairLabel: "to" },
      { key: "totalAncillaryMin", label: "Total ancillary", type: "number", suffix: "%", pair: "totalAncillaryMax", pairLabel: "to" },
    ],
  },
  {
    title: "Fee Structure & Returns",
    fields: [
      { key: "baseMgmtFeeMin", label: "Base management fee", type: "number", suffix: "%", pair: "baseMgmtFeeMax", pairLabel: "to" },
      { key: "incentiveFeeMin", label: "Incentive fee (GOP)", type: "number", suffix: "%", pair: "incentiveFeeMax", pairLabel: "to" },
      { key: "exitCapRateMin", label: "Exit cap rate", type: "number", suffix: "%", pair: "exitCapRateMax", pairLabel: "to" },
      { key: "targetIrr", label: "Target IRR (min)", type: "number", suffix: "%" },
      { key: "equityMultipleMin", label: "Equity multiple", type: "number", suffix: "x", pair: "equityMultipleMax", pairLabel: "to" },
      { key: "holdYearsMin", label: "Hold period", type: "number", suffix: "years", pair: "holdYearsMax", pairLabel: "to" },
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
