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
  locationDetails: string;
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
  locationDetails: `United States — Northeast
Hudson Valley NY: rolling meadows with wildflower borders, stone walls, and seasonal foliage; properties often feature heritage gardens and creek-side walking paths. Guests arrive via tree-lined country lanes with views of the Catskill escarpment.
Berkshires MA: mist-draped hills, mature birch and maple canopy, spring-fed ponds; estate settings with manicured lawns, sculpture gardens, and covered bridges. Autumn foliage draws peak-season visitors.
Catskills NY: forested mountain slopes with rushing creeks, hemlock groves, and wide valley views; rustic-luxe appeal with firepit clearings and trout streams on-property.
Litchfield Hills CT: pastoral horse country with white-fenced paddocks, colonial stone walls, and gentle hills; village greens and covered bridges within a short drive.

United States — Southeast
Asheville NC: Blue Ridge panoramas, rhododendron-lined drives, and cool mountain air; properties sit among old-growth hardwoods with long-range layered mountain views.
Charleston SC: live-oak allées draped in Spanish moss, tidal marshes, and warm coastal breezes; historic brick and ironwork lend timeless architectural character.
Savannah GA: garden squares, fountain courtyards, and jasmine-scented walkways; properties benefit from the city's walkable historic district and coastal island proximity.
Charlottesville VA: rolling Piedmont countryside, vineyard-studded hills, and Blue Ridge foothills; estates often feature boxwood gardens, spring houses, and farm-to-table orchards.

United States — Southwest
Austin TX Hill Country: limestone bluffs, spring-fed swimming holes, and live-oak savannas; sunset views over the Pedernales River valley with wildflower meadows in spring.
Sedona AZ: red-rock buttes, juniper-dotted mesas, and dramatic canyon light at golden hour; properties framed by Cathedral Rock or Boynton Canyon vistas.
Santa Fe NM: high-desert light, adobe architecture, piñon-pine hillsides, and distant Sangre de Cristo peaks; aromatic sage and lavender gardens surround courtyard estates.
Fredericksburg TX: peach orchards, rolling ranchland, and German-heritage stone farmsteads; wildflower-season draws visitors to hillside estates with panoramic views.

United States — West
Napa/Sonoma CA: vineyard-framed estates with lavender-lined drives, mature olive groves, and sunset views over rolling hills; morning fog burns off to reveal orderly vine rows and distant coastal ridges.
Park City/Eden UT: alpine meadows, aspen groves that shimmer gold in autumn, and ski-in/ski-out proximity; summer wildflower trails and mountain-lake reflections.
Jackson Hole WY: Grand Teton backdrop, sage-covered flats, and Snake River corridor; properties offer big-sky drama with elk and moose sightings at dawn.
Bend OR: Cascade peaks, ponderosa-pine forests, and high-desert river canyons; year-round outdoor culture with mountain views from nearly every vantage.

Latin America
Medellín, Colombia: eternal-spring climate in a lush Andean valley; properties perched on hillsides with coffee-farm panoramas and flowering bougainvillea terraces.
Cartagena, Colombia: Caribbean sea breezes, coral-stone ramparts, and bougainvillea-draped colonial courtyards; rooftop terraces overlook the old walled city and harbor.
Coffee Triangle, Colombia: emerald-green coffee plantations cascading down volcanic slopes; hacienda estates with hummingbird gardens and mountain-mist mornings.
San Miguel de Allende, Mexico: cobblestone streets, baroque-colonial facades, and rooftop views of the Parroquia; terraced gardens with fountain courtyards and jacaranda canopy.
Oaxaca, Mexico: Sierra Madre valleys, agave fields, and ancient Zapotec ruins nearby; courtyard haciendas with bougainvillea walls and mezcal-tasting patios.
Guanacaste, Costa Rica: Pacific-coast dry forest transitioning to tropical beach; howler monkeys, sunset surf breaks, and open-air estate living year-round.

Europe, Middle East & Africa
Provence, France: lavender fields, cypress-lined lanes, and honey-stone mas farmhouses; cicada-song summers with views of Mont Ventoux or the Luberon ridge.
Tuscany, Italy: undulating hills striped with olive groves and vineyards, medieval stone villas, and golden-hour light that painters have chased for centuries.
Douro Valley, Portugal: terraced vineyards cascading to the river, quintas with azulejo-tiled facades, and port-wine heritage lending old-world romance.
Mallorca, Spain: Serra de Tramuntana mountain backdrop, turquoise coves, and centuries-old finca estates surrounded by almond and citrus orchards.
Dubai, UAE (Al Barari): lush desert-garden enclave with over 1,200 species of tropical plants, private lagoons, and spa-resort tranquility minutes from the city center.`,
  conditionNotes: "Property in good to excellent structural condition; cosmetic renovation acceptable but no major structural remediation. No active pest infestation, mold, asbestos, or lead paint issues. Historic or heritage designation acceptable if renovation flexibility exists. Unique architectural provenance preferred (colonial, farmhouse, mid-century modern, Mediterranean).",
  groundsTopography: "Gentle rolling hills, flat meadows, or terraced hillside; no extreme slopes requiring retaining walls. Mature landscaping preferred (established trees, manicured gardens, hedgerows for privacy). Water features valued (pond, creek, lake frontage, fountain). Mountain, valley, ocean, vineyard, or pastoral views. Irrigation system for landscaping preferred.",
  vendorServices: "The management company coordinates third-party vendor services to each property:\n• IT: PMS, channel manager, booking engine, Wi-Fi, POS, security/surveillance, smart room technology\n• Housekeeping: daily staffing, commercial laundry, deep cleaning crews, pest control\n• Grounds: landscaping, pool/spa maintenance, HVAC/mechanical, painting/carpentry\n• Professional: accounting, legal, insurance, marketing/PR, revenue management\n• F&B: food purveyors, beverage distributors, kitchen equipment maintenance",
  regulatoryNotes: "Clear zoning for hospitality/commercial use, or demonstrable path to re-zoning within 6 months. Building permits and renovation regulations must allow conversion within 6–18 months. Fire code compliance or clear path to compliance (sprinklers, exits, alarms). ADA/accessibility compliance or feasible retrofit plan. Health department and food service licensing achievable. Liquor license available or transferable preferred.",
  exclusions: "Properties requiring more than $3M in structural renovation\nUrban high-rise or mid-rise buildings\nProperties in flood zones, wildfire extreme zones, or with unresolved environmental issues\nLocations more than 2 hours from a commercial airport\nProperties below 5 rooms or above 80 rooms\nTimeshare, fractional ownership, or condo-hotel structures\nProperties with active litigation, liens, or title disputes\nGated communities with HOA restrictions on commercial use\nProperties without year-round road access",
  additionalContext: "",
};


export { generateIcpPrompt } from "./icp-prompt-builder";


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
      { key: "masterSuitesMin", label: "Master suites", type: "number", defaultPriority: "must", help: "Minimum count. Large premium suites with separate living areas, walk-in closets, and luxury en-suite bathrooms." },
      { key: "masterSuiteSqFt", label: "Master suite size", type: "number", unitType: "area", defaultPriority: "must", help: "Minimum floor area per master suite including bedroom, sitting area, and en-suite bathroom." },
    ],
  },
  {
    title: "Bedrooms, Bathrooms & Areas",
    fields: [
      { key: "bedroomsMin", label: "Bedrooms", type: "number", pair: "bedroomsMax", pairLabel: "to", defaultPriority: "must", help: "Total bedrooms across the property including guest rooms, owner/staff quarters, and auxiliary spaces." },
      { key: "bathroomsMin", label: "Bathrooms", type: "number", pair: "bathroomsMax", pairLabel: "to", defaultPriority: "must", help: "Full bathrooms (toilet, sink, shower/tub). Target at least 1:1 ratio with bedrooms." },
      { key: "halfBaths", label: "Half-baths", type: "number", defaultPriority: "nice", help: "Powder rooms in public and common areas (toilet and sink only). Reduces guest traffic through private wings." },
      { key: "livingAreas", label: "Living/lounge areas", type: "number", defaultPriority: "must", help: "Minimum count. Distinct living rooms, lounges, or sitting areas available for guest use. Multiple areas allow programming variety." },
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
      { key: "fbRating", label: "F&B Rating", type: "number", defaultPriority: "must", help: "Rated on a 1–5 scale. 1 = continental breakfast only, 2 = limited F&B, 3 = full breakfast + light dinner, 4 = full-service restaurant + bar, 5 = destination dining with celebrity chef and extensive wine program." },
    ],
  },
  {
    title: "Operational Facilities",
    fields: [
      { key: "kitchenSqFt", label: "Kitchen", type: "number", unitType: "area", defaultPriority: "must", help: "Minimum area. Commercial or semi-commercial kitchen with hood ventilation, grease trap, walk-in cooler/freezer, prep and dish areas." },
      { key: "maintenanceSqFt", label: "Maintenance/storage", type: "number", unitType: "area", defaultPriority: "must", help: "Minimum area. Workshop and general storage for maintenance equipment, supplies, and seasonal items." },
      { key: "staffQuartersMin", label: "Staff quarters capacity", type: "number", pair: "staffQuartersMax", pairLabel: "to", suffix: "staff", defaultPriority: "must", help: "On-site break room or quarters capacity for key operational staff during shifts." },
      { key: "staffHousingUnits", label: "Staff housing units", type: "number", defaultPriority: "nice", help: "Separate residential units for live-in staff (manager, chef, groundskeeper). Critical for rural locations." },
    ],
  },
  {
    title: "Aquatic & Wellness",
    fields: [
      { key: "pool", label: "Swimming pool", type: "priority", help: "Primary swimming pool for guest use. Heated pools extend seasonal availability." },
      { key: "poolSqFt", label: "Pool area", type: "number", unitType: "area", linkedPriority: "pool", help: "Minimum surface area of the main pool deck and water area combined." },
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
      { key: "tennisCourts", label: "Tennis courts", type: "number", linkedPriority: "tennis", help: "Quantity of tennis courts. One court is typical for boutique properties." },
      { key: "pickleball", label: "Pickleball court", type: "priority", help: "Fastest-growing racket sport. Can share space with tennis courts or be standalone." },
      { key: "pickleballCourts", label: "Pickleball courts", type: "number", linkedPriority: "pickleball", help: "Quantity of dedicated pickleball courts. Increasingly requested by guests." },
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
      { key: "casitasCount", label: "Casitas", type: "number", linkedPriority: "casitas", help: "Quantity of individual casitas, cottages, or cabins on property." },
      { key: "barn", label: "Barn", type: "priority", help: "Used for events and dining. Restored barn for events, private dining, or entertainment. Rustic luxury appeal." },
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
      { key: "maxRoofAge", label: "Max roof age", type: "number", suffix: "years", defaultPriority: "must", help: "Maximum acceptable roof age in years. Older roofs require costly replacement ($50K–$200K+)." },
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
      { key: "incentiveFeeMin", label: "Incentive fee", type: "number", suffix: "%", pair: "incentiveFeeMax", pairLabel: "to", defaultPriority: "must", help: "Based on Gross Operating Profit (GOP). Incentive fee as % of GOP. Aligns manager and owner interests." },
      { key: "exitCapRateMin", label: "Exit cap rate", type: "number", suffix: "%", pair: "exitCapRateMax", pairLabel: "to", defaultPriority: "must", help: "Capitalization rate assumed at disposition. Lower cap rate = higher property value." },
      { key: "targetIrr", label: "Target IRR", type: "number", suffix: "%", defaultPriority: "must", help: "Minimum threshold. Minimum Internal Rate of Return required for the investment to meet hurdle rate." },
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
  { key: "locationDetails", label: "Details about Location", rows: 12, help: "Rich descriptive details about what makes each target location desirable — ambiance, scenery, unique natural features, guest arrival experience, seasonal flora, and other location-specific character notes" },
  { key: "conditionNotes", label: "Property Condition Notes", rows: 3, help: "Structural condition, historic designation, architectural style" },
  { key: "groundsTopography", label: "Grounds & Topography", rows: 3, help: "Terrain, landscaping, water features, views" },
  { key: "vendorServices", label: "Vendor & Managed Services", rows: 6, help: "Third-party services coordinated through the management company" },
  { key: "regulatoryNotes", label: "Regulatory & Compliance", rows: 4, help: "Zoning, permits, fire code, ADA, licensing requirements" },
  { key: "exclusions", label: "Exclusions", rows: 5, help: "Property types, conditions, or situations that disqualify a target" },
  { key: "additionalContext", label: "Additional Context", rows: 3, help: "Any other context to include in the ICP prompt" },
];

function fmt$(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

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
