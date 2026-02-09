import { db } from "./db";
import { globalAssumptions, marketResearch, properties, users } from "@shared/schema";
import {
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_TAX_RATE,
  DEFAULT_COMMISSION_RATE,
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_SAFE_VALUATION_CAP,
  DEFAULT_SAFE_DISCOUNT_RATE,
} from "@shared/constants";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

// Default debt assumptions for seed data (matches routes.ts SEED_DEBT_ASSUMPTIONS)
const SEED_DEBT_ASSUMPTIONS = {
  acqLTV: 0.75,
  refiLTV: 0.75,
  interestRate: 0.09,
  amortizationYears: 25,
  acqClosingCostRate: 0.02,
  refiClosingCostRate: 0.03,
} as const;

async function seed() {
  const forceReseed = process.argv.includes("--force");
  
  console.log("Starting database seed...");

  // Check if data already exists
  const existingGlobal = await db.select().from(globalAssumptions).limit(1);
  const existingProperties = await db.select().from(properties).limit(1);

  if (existingGlobal.length > 0 || existingProperties.length > 0) {
    if (forceReseed) {
      console.log("Force mode: Clearing existing data...");
      await db.delete(marketResearch);
      await db.delete(properties);
      await db.delete(globalAssumptions);
      console.log("Existing data cleared.");
    } else {
      console.log("Database already has data. Skipping seed to prevent duplicates.");
      console.log("To force re-seed, run: npx tsx server/seed.ts --force");
      return;
    }
  }

  // Seed admin user
  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin")).limit(1);
  if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      email: "admin",
      passwordHash: hashedPassword,
      name: "Administrator",
      role: "admin",
    });
    console.log("Created admin user (email: admin, password: admin123)");
  }

  // Seed global assumptions with current development data
  await db.insert(globalAssumptions).values({
    modelStartDate: "2026-04-01",
    companyOpsStartDate: "2026-06-01",
    fiscalYearStartMonth: 1,
    inflationRate: 0.03,
    fixedCostEscalationRate: 0.03,
    baseManagementFee: 0.05,
    incentiveManagementFee: 0.15,
    safeTranche1Amount: 1000000,
    safeTranche1Date: "2026-06-01",
    safeTranche2Amount: 1000000,
    safeTranche2Date: "2027-04-01",
    safeValuationCap: DEFAULT_SAFE_VALUATION_CAP,
    safeDiscountRate: DEFAULT_SAFE_DISCOUNT_RATE,
    partnerCompYear1: 540000,
    partnerCompYear2: 540000,
    partnerCompYear3: 540000,
    partnerCompYear4: 600000,
    partnerCompYear5: 600000,
    partnerCompYear6: 700000,
    partnerCompYear7: 700000,
    partnerCompYear8: 800000,
    partnerCompYear9: 800000,
    partnerCompYear10: 900000,
    partnerCountYear1: 3,
    partnerCountYear2: 3,
    partnerCountYear3: 3,
    partnerCountYear4: 3,
    partnerCountYear5: 3,
    partnerCountYear6: 3,
    partnerCountYear7: 3,
    partnerCountYear8: 3,
    partnerCountYear9: 3,
    partnerCountYear10: 3,
    staffSalary: 75000,
    officeLeaseStart: 36000,
    professionalServicesStart: 24000,
    techInfraStart: 18000,
    businessInsuranceStart: 12000,
    travelCostPerClient: 12000,
    itLicensePerClient: 3000,
    marketingRate: 0.05,
    miscOpsRate: 0.03,
    commissionRate: DEFAULT_COMMISSION_RATE,
    standardAcqPackage: {
      monthsToOps: 6,
      purchasePrice: 2300000,
      preOpeningCosts: 150000,
      operatingReserve: 200000,
      buildingImprovements: 800000,
    },
    debtAssumptions: SEED_DEBT_ASSUMPTIONS,
    companyTaxRate: 0.3,
    companyName: "Hospitality Business Company",
    exitCapRate: DEFAULT_EXIT_CAP_RATE,
    salesCommissionRate: DEFAULT_COMMISSION_RATE,
    eventExpenseRate: DEFAULT_EVENT_EXPENSE_RATE,
    otherExpenseRate: DEFAULT_OTHER_EXPENSE_RATE,
    utilitiesVariableSplit: DEFAULT_UTILITIES_VARIABLE_SPLIT,
  });
  console.log("Seeded global assumptions");

  // Seed properties with current development data
  await db.insert(properties).values([
    {
      name: "The Hudson Estate",
      location: "Upstate New York",
      market: "North America",
      imageUrl: "/images/property-ny.png",
      status: "Development",
      acquisitionDate: "2026-06-01",
      operationsStartDate: "2026-12-01",
      purchasePrice: 2300000,
      buildingImprovements: 800000,
      preOpeningCosts: 150000,
      operatingReserve: 200000,
      roomCount: 20,
      startAdr: 330,
      adrGrowthRate: 0.025,
      startOccupancy: 0.6,
      maxOccupancy: 0.9,
      occupancyRampMonths: DEFAULT_OCCUPANCY_RAMP_MONTHS,
      occupancyGrowthStep: 0.05,
      stabilizationMonths: 36,
      type: "Full Equity",

      willRefinance: "Yes",
      refinanceDate: "2029-12-01",
      costRateRooms: DEFAULT_COST_RATE_ROOMS,
      costRateFB: 0.30,  // Upscale NY market, efficient sourcing (USALI: 28-35% for full-service boutique)
      costRateAdmin: DEFAULT_COST_RATE_ADMIN,
      costRateMarketing: DEFAULT_COST_RATE_MARKETING,
      costRatePropertyOps: DEFAULT_COST_RATE_PROPERTY_OPS,
      costRateUtilities: DEFAULT_COST_RATE_UTILITIES,
      costRateInsurance: DEFAULT_COST_RATE_INSURANCE,
      costRateTaxes: DEFAULT_COST_RATE_TAXES,
      costRateIT: DEFAULT_COST_RATE_IT,
      costRateFFE: DEFAULT_COST_RATE_FFE,
      costRateOther: DEFAULT_COST_RATE_OTHER,
      revShareEvents: DEFAULT_REV_SHARE_EVENTS,
      revShareFB: DEFAULT_REV_SHARE_FB,
      revShareOther: DEFAULT_REV_SHARE_OTHER,
      cateringBoostPercent: 0.28,
      exitCapRate: DEFAULT_EXIT_CAP_RATE,
      taxRate: DEFAULT_TAX_RATE,
    },
    {
      name: "Eden Summit Lodge",
      location: "Eden, Utah",
      market: "North America",
      imageUrl: "/images/property-utah.png",
      status: "Acquisition",
      acquisitionDate: "2027-01-01",
      operationsStartDate: "2027-07-01",
      purchasePrice: 2300000,
      buildingImprovements: 800000,
      preOpeningCosts: 150000,
      operatingReserve: 200000,
      roomCount: 20,
      startAdr: 390,
      adrGrowthRate: 0.025,
      startOccupancy: 0.6,
      maxOccupancy: 0.9,
      occupancyRampMonths: DEFAULT_OCCUPANCY_RAMP_MONTHS,
      occupancyGrowthStep: 0.05,
      stabilizationMonths: 36,
      type: "Full Equity",

      willRefinance: "Yes",
      refinanceDate: "2030-07-01",
      costRateRooms: DEFAULT_COST_RATE_ROOMS,
      costRateFB: 0.28,  // Premium ski resort, higher markups on F&B (USALI: 25-32% for luxury mountain)
      costRateAdmin: DEFAULT_COST_RATE_ADMIN,
      costRateMarketing: DEFAULT_COST_RATE_MARKETING,
      costRatePropertyOps: DEFAULT_COST_RATE_PROPERTY_OPS,
      costRateUtilities: DEFAULT_COST_RATE_UTILITIES,
      costRateInsurance: DEFAULT_COST_RATE_INSURANCE,
      costRateTaxes: DEFAULT_COST_RATE_TAXES,
      costRateIT: DEFAULT_COST_RATE_IT,
      costRateFFE: DEFAULT_COST_RATE_FFE,
      costRateOther: DEFAULT_COST_RATE_OTHER,
      revShareEvents: DEFAULT_REV_SHARE_EVENTS,
      revShareFB: DEFAULT_REV_SHARE_FB,
      revShareOther: DEFAULT_REV_SHARE_OTHER,
      cateringBoostPercent: 0.38,
      exitCapRate: DEFAULT_EXIT_CAP_RATE,
      taxRate: DEFAULT_TAX_RATE,
    },
    {
      name: "Austin Hillside",
      location: "Austin, Texas",
      market: "North America",
      imageUrl: "/images/property-austin.png",
      status: "Acquisition",
      acquisitionDate: "2027-04-01",
      operationsStartDate: "2028-01-01",
      purchasePrice: 2300000,
      buildingImprovements: 800000,
      preOpeningCosts: 150000,
      operatingReserve: 200000,
      roomCount: 20,
      startAdr: 270,
      adrGrowthRate: 0.025,
      startOccupancy: 0.6,
      maxOccupancy: 0.9,
      occupancyRampMonths: DEFAULT_OCCUPANCY_RAMP_MONTHS,
      occupancyGrowthStep: 0.05,
      stabilizationMonths: 36,
      type: "Full Equity",

      willRefinance: "Yes",
      refinanceDate: "2031-01-01",
      costRateRooms: DEFAULT_COST_RATE_ROOMS,
      costRateFB: 0.33,  // Competitive urban F&B market, higher ingredient costs (USALI: 31-35% for mid-tier)
      costRateAdmin: DEFAULT_COST_RATE_ADMIN,
      costRateMarketing: DEFAULT_COST_RATE_MARKETING,
      costRatePropertyOps: DEFAULT_COST_RATE_PROPERTY_OPS,
      costRateUtilities: DEFAULT_COST_RATE_UTILITIES,
      costRateInsurance: DEFAULT_COST_RATE_INSURANCE,
      costRateTaxes: DEFAULT_COST_RATE_TAXES,
      costRateIT: DEFAULT_COST_RATE_IT,
      costRateFFE: DEFAULT_COST_RATE_FFE,
      costRateOther: DEFAULT_COST_RATE_OTHER,
      revShareEvents: DEFAULT_REV_SHARE_EVENTS,
      revShareFB: DEFAULT_REV_SHARE_FB,
      revShareOther: DEFAULT_REV_SHARE_OTHER,
      cateringBoostPercent: 0.25,
      exitCapRate: DEFAULT_EXIT_CAP_RATE,
      taxRate: DEFAULT_TAX_RATE,
    },
    {
      name: "Casa Medellín",
      location: "Medellín, Colombia",
      market: "Latin America",
      imageUrl: "/images/property-medellin.png",
      status: "Acquisition",
      acquisitionDate: "2026-09-01",
      operationsStartDate: "2028-07-01",
      purchasePrice: 3500000,
      buildingImprovements: 800000,
      preOpeningCosts: 150000,
      operatingReserve: 200000,
      roomCount: 30,
      startAdr: 180,
      adrGrowthRate: 0.04,
      startOccupancy: 0.6,
      maxOccupancy: 0.9,
      occupancyRampMonths: DEFAULT_OCCUPANCY_RAMP_MONTHS,
      occupancyGrowthStep: 0.05,
      stabilizationMonths: 36,
      type: "Financed",
      acquisitionLTV: 0.75,
      acquisitionInterestRate: 0.09,
      acquisitionTermYears: 25,
      acquisitionClosingCostRate: 0.02,

      costRateRooms: DEFAULT_COST_RATE_ROOMS,
      costRateFB: 0.25,  // Lower LatAm ingredient costs, favorable labor economics (USALI: 28-30% LatAm)
      costRateAdmin: DEFAULT_COST_RATE_ADMIN,
      costRateMarketing: DEFAULT_COST_RATE_MARKETING,
      costRatePropertyOps: DEFAULT_COST_RATE_PROPERTY_OPS,
      costRateUtilities: DEFAULT_COST_RATE_UTILITIES,
      costRateInsurance: DEFAULT_COST_RATE_INSURANCE,
      costRateTaxes: DEFAULT_COST_RATE_TAXES,
      costRateIT: DEFAULT_COST_RATE_IT,
      costRateFFE: DEFAULT_COST_RATE_FFE,
      costRateOther: DEFAULT_COST_RATE_OTHER,
      revShareEvents: DEFAULT_REV_SHARE_EVENTS,
      revShareFB: DEFAULT_REV_SHARE_FB,
      revShareOther: DEFAULT_REV_SHARE_OTHER,
      cateringBoostPercent: 0.35,
      exitCapRate: DEFAULT_EXIT_CAP_RATE,
      taxRate: DEFAULT_TAX_RATE,
    },
    {
      name: "Blue Ridge Manor",
      location: "Asheville, North Carolina",
      market: "North America",
      imageUrl: "/images/property-asheville.png",
      status: "Acquisition",
      acquisitionDate: "2027-07-01",
      operationsStartDate: "2028-07-01",
      purchasePrice: 3500000,
      buildingImprovements: 800000,
      preOpeningCosts: 150000,
      operatingReserve: 200000,
      roomCount: 30,
      startAdr: 342,
      adrGrowthRate: 0.025,
      startOccupancy: 0.6,
      maxOccupancy: 0.9,
      occupancyRampMonths: DEFAULT_OCCUPANCY_RAMP_MONTHS,
      occupancyGrowthStep: 0.05,
      stabilizationMonths: 36,
      type: "Financed",
      acquisitionLTV: 0.75,
      acquisitionInterestRate: 0.09,
      acquisitionTermYears: 25,
      acquisitionClosingCostRate: 0.02,

      costRateRooms: DEFAULT_COST_RATE_ROOMS,
      costRateFB: 0.32,  // Farm-to-table Asheville, standard full-service rate (USALI: 30-35% for boutique)
      costRateAdmin: DEFAULT_COST_RATE_ADMIN,
      costRateMarketing: DEFAULT_COST_RATE_MARKETING,
      costRatePropertyOps: DEFAULT_COST_RATE_PROPERTY_OPS,
      costRateUtilities: DEFAULT_COST_RATE_UTILITIES,
      costRateInsurance: DEFAULT_COST_RATE_INSURANCE,
      costRateTaxes: DEFAULT_COST_RATE_TAXES,
      costRateIT: DEFAULT_COST_RATE_IT,
      costRateFFE: DEFAULT_COST_RATE_FFE,
      costRateOther: DEFAULT_COST_RATE_OTHER,
      revShareEvents: DEFAULT_REV_SHARE_EVENTS,
      revShareFB: DEFAULT_REV_SHARE_FB,
      revShareOther: DEFAULT_REV_SHARE_OTHER,
      cateringBoostPercent: 0.42,
      exitCapRate: DEFAULT_EXIT_CAP_RATE,
      taxRate: DEFAULT_TAX_RATE,
    },
  ]);
  console.log("Seeded 5 properties");

  const seededProperties = await db.select().from(properties);
  const propertyMap: Record<string, number> = {};
  for (const p of seededProperties) {
    propertyMap[p.name] = p.id;
  }

  await db.insert(marketResearch).values([
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["The Hudson Estate"],
      title: "Market Research: The Hudson Estate",
      llmModel: "seed-data",
      content: {
        marketOverview: {
          summary: "The Hudson Valley luxury hospitality market has experienced significant growth driven by weekend tourism from New York City. The region has seen a 15% increase in boutique hotel development over the past three years, with strong demand from affluent NYC residents seeking accessible rural retreats. The area benefits from a growing farm-to-table culinary scene, expanding arts and culture programming, and proximity to the metro area.",
          keyMetrics: [
            { label: "Tourism Volume", value: "4.2M annual visitors to Hudson Valley region", source: "Hudson Valley Tourism Board, 2025" },
            { label: "Hotel Supply", value: "32 boutique properties (under 50 rooms) within 30-mile radius", source: "STR Global, 2025" },
            { label: "RevPAR", value: "$136.40 market average, $245+ for boutique segment", source: "STR Global, 2025" },
            { label: "Market Growth", value: "8.2% YoY RevPAR growth in boutique segment", source: "CBRE Hotels Research, 2025" }
          ]
        },
        adrAnalysis: {
          marketAverage: "$220",
          boutiqueRange: "$280–$380",
          recommendedRange: "$310–$350",
          rationale: "The Hudson Estate's 20-room boutique positioning with partial catering supports ADR in the upper-mid range of the boutique segment. The property's estate setting and proximity to NYC justify premium pricing above market average while remaining competitive with established luxury peers.",
          comparables: [
            { name: "Hasbrouck House", adr: "$295", type: "Boutique Inn" },
            { name: "Hutton Brickyards", adr: "$350", type: "Luxury Boutique" },
            { name: "Troutbeck", adr: "$425", type: "Luxury Estate" },
            { name: "The Chatwal", adr: "$310", type: "Boutique Lodge" }
          ]
        },
        occupancyAnalysis: {
          marketAverage: "62%",
          seasonalPattern: [
            { season: "Summer (Jun–Aug)", occupancy: "80–85%", notes: "Peak season driven by NYC weekend getaways and outdoor activities" },
            { season: "Fall (Sep–Nov)", occupancy: "85–90%", notes: "Highest demand period due to foliage tourism and harvest events" },
            { season: "Winter (Dec–Feb)", occupancy: "40–50%", notes: "Trough season; holiday events and ski-adjacent demand provide a floor" },
            { season: "Spring (Mar–May)", occupancy: "60–70%", notes: "Shoulder season with gradual ramp driven by wedding bookings" }
          ],
          rampUpTimeline: "Expect 18–24 months to reach stabilized occupancy of 75–80%, with initial occupancy around 55–60% in the first six months of operations."
        },
        eventDemand: {
          corporateEvents: "Strong demand from NYC-based companies for executive retreats, off-site meetings, and team-building programs. The 2-hour drive from Manhattan makes it ideal for 1–2 night corporate bookings.",
          wellnessRetreats: "Growing segment driven by wellness tourism trends. Weekend yoga retreats, meditation workshops, and detox programs attract high-value guests willing to pay premium rates.",
          weddingsPrivate: "Significant demand for intimate weddings (50–100 guests) and private celebrations. The estate setting provides a compelling venue for upscale events.",
          estimatedEventRevShare: "40–45% of total revenue from events and F&B combined",
          keyDrivers: [
            "Proximity to NYC metro area (2-hour drive, 8M+ potential guests)",
            "Growing corporate retreat market post-pandemic",
            "Hudson Valley's established reputation as a culinary and arts destination",
            "Limited competition for high-end intimate event spaces in the region",
            "Expanding wellness tourism trend among affluent demographics"
          ]
        },
        cateringAnalysis: {
          recommendedBoostPercent: "28%",
          marketRange: "22% - 35%",
          rationale: "The Hudson Estate's event mix skews toward partially catered corporate retreats and wellness weekends, with fully catered weddings comprising a smaller share. Hudson Valley comparable properties report F&B revenue at approximately 28–30% of room revenue when including catering uplift, versus a base F&B share of ~22%. This implies a catering boost of roughly 28%. The property's partial-catering positioning and strong but not dominant wedding market support a boost in the mid-range.",
          factors: [
            "Corporate retreats (40% of events) typically include 1–2 catered meals per day, not full-service catering",
            "Hudson Valley wedding market is competitive but intimate estate weddings command full catering at premium per-head rates",
            "Wellness retreats (25% of events) generally include healthy meal programming, driving moderate F&B uplift",
            "Seasonal pattern: fall weddings and summer corporate events drive peak catering demand (Sep–Oct highest)",
            "Comparable properties (Troutbeck, Hasbrouck House) report catering contributing 25–32% uplift to base F&B"
          ],
          eventMixBreakdown: {
            fullyCatered: "30% of events (weddings, milestone celebrations, corporate dinners)",
            partiallyCatered: "45% of events (retreats with some meals, corporate meetings with lunch)",
            noCatering: "25% of events (room-only bookings, self-catered private gatherings)"
          }
        },
        capRateAnalysis: {
          marketRange: "7.5%–9.5%",
          boutiqueRange: "7.0%–8.5%",
          recommendedRange: "7.5%–8.5%",
          rationale: "Boutique hotels in established leisure markets typically trade at tighter cap rates due to premium ADR and strong RevPAR. The Hudson Valley's proximity to NYC provides a demand floor that reduces risk, supporting cap rates in the lower end of the range.",
          comparables: [
            { name: "Hasbrouck House", capRate: "8.2%", saleYear: "2023", notes: "18-room boutique inn, Hudson NY" },
            { name: "Hutton Brickyards", capRate: "7.5%", saleYear: "2022", notes: "Luxury boutique resort, Kingston NY" },
            { name: "Buttermilk Falls Inn", capRate: "8.8%", saleYear: "2024", notes: "Boutique inn with event space, Milton NY" },
            { name: "Audrey's Farmhouse", capRate: "7.8%", saleYear: "2023", notes: "Boutique property, Wallkill NY" }
          ]
        },
        competitiveSet: [
          { name: "Hasbrouck House", rooms: "18", adr: "$295", positioning: "Boutique inn with restaurant, art-focused programming" },
          { name: "Hutton Brickyards", rooms: "31", adr: "$350", positioning: "Luxury boutique resort on the Hudson River with glamping" },
          { name: "Troutbeck", rooms: "37", adr: "$425", positioning: "Luxury country estate with spa, farm, and event spaces" },
          { name: "The Chatwal", rooms: "12", adr: "$310", positioning: "Intimate boutique lodge with fine dining" }
        ],
        landValueAllocation: {
          recommendedPercent: "30%",
          marketRange: "25% - 35%",
          assessmentMethod: "County tax assessor ratio and comparable rural estate sales",
          rationale: "The Hudson Estate's 15-acre rural setting in the Hudson Valley commands moderate land values due to proximity to NYC (2 hours) and the region's growing popularity as a luxury leisure destination. Rural estates in Ulster/Dutchess counties typically show 25-35% land allocation, with the higher end reflecting premium waterfront or scenic parcels. At 30%, the allocation reflects the property's desirable but not ultra-premium rural location, balancing substantial acreage value against significant building and improvement investments.",
          factors: [
            "15-acre rural estate with mature landscaping and scenic views commands premium land values relative to smaller parcels in the Hudson Valley",
            "Ulster/Dutchess County tax assessor records show average land-to-improvement ratios of 28-33% for hospitality properties in the region",
            "Comparable rural estate sales in the Hudson Valley (2022-2024) show land allocations ranging from 25% to 38% depending on acreage and waterfront access",
            "Property's distance from NYC (2 hours) places it in a secondary market tier, supporting moderate rather than high land allocation",
            "Significant building improvements and renovation costs reduce the relative share attributable to land"
          ]
        },
        risks: [
          { risk: "Seasonal revenue concentration", mitigation: "Develop winter programming (holiday packages, fireside retreats, cross-country ski partnerships) and corporate retreat packages to boost off-season occupancy to 50%+" },
          { risk: "NYC accessibility disruptions", mitigation: "Diversify marketing to include Albany, Connecticut, and New Jersey markets; develop midweek corporate packages less dependent on weekend traffic" },
          { risk: "Competition from new boutique openings", mitigation: "Differentiate through unique estate experience, curated programming, and loyalty/membership programs; secure early market positioning before new supply enters" },
          { risk: "Staffing challenges in rural market", mitigation: "Offer competitive compensation with housing stipends, partner with local hospitality programs, and implement seasonal staffing models" }
        ],
        sources: [
          "STR Global – Hudson Valley Hotel Performance Report, 2025",
          "CBRE Hotels Research – Northeast Boutique Hotel Investment Outlook, 2025",
          "HVS – Hudson Valley Lodging Market Analysis, 2024",
          "PKF Hospitality Research – Boutique Hotel Trends Report, 2025",
          "Hudson Valley Tourism Board – Annual Visitor Statistics, 2025",
          "Highland Group – Boutique Hotel Cap Rate Survey, 2024"
        ]
      }
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Eden Summit Lodge"],
      title: "Market Research: Eden Summit Lodge",
      llmModel: "seed-data",
      content: {
        marketOverview: {
          summary: "The Ogden Valley/Eden market in Utah is a rapidly growing ski and outdoor recreation destination anchored by Powder Mountain and Snowbasin resorts. The area has seen accelerated development following Powder Mountain's acquisition and master-plan community development. Year-round outdoor recreation including skiing, mountain biking, hiking, and fly fishing supports a dual-season demand profile, though winter remains the dominant revenue driver.",
          keyMetrics: [
            { label: "Tourism Volume", value: "1.8M annual skier visits to Ogden Valley resorts", source: "Utah Office of Tourism, 2025" },
            { label: "Hotel Supply", value: "14 boutique/luxury properties within Ogden Valley corridor", source: "STR Global, 2025" },
            { label: "RevPAR", value: "$169.00 market average, $310+ for luxury lodge segment", source: "STR Global, 2025" },
            { label: "Market Growth", value: "12.5% YoY RevPAR growth driven by resort development", source: "CBRE Hotels Research, 2025" }
          ]
        },
        adrAnalysis: {
          marketAverage: "$260",
          boutiqueRange: "$320–$450",
          recommendedRange: "$370–$410",
          rationale: "Eden Summit Lodge's full-catering luxury positioning in a supply-constrained ski market supports premium ADR. The property's proximity to Powder Mountain and Snowbasin, combined with full F&B capabilities, justifies pricing at the upper end of the boutique range.",
          comparables: [
            { name: "Snowpine Lodge", adr: "$420", type: "Ski-in/out Luxury" },
            { name: "Hotel Park City", adr: "$380", type: "Boutique Resort" },
            { name: "Waldorf Astoria Park City", adr: "$450", type: "Luxury" },
            { name: "Blue Sky Ranch", adr: "$395", type: "Luxury Ranch" }
          ]
        },
        occupancyAnalysis: {
          marketAverage: "65%",
          seasonalPattern: [
            { season: "Ski Season (Dec–Mar)", occupancy: "85–95%", notes: "Peak season driven by skiing at Powder Mountain and Snowbasin; holiday weeks at 95%+" },
            { season: "Summer (Jun–Sep)", occupancy: "70–80%", notes: "Growing segment with mountain biking, hiking, fly fishing, and event bookings" },
            { season: "Fall (Oct–Nov)", occupancy: "45–55%", notes: "Shoulder season; fall colors and hunting provide moderate demand" },
            { season: "Spring (Apr–May)", occupancy: "45–55%", notes: "Mud season with lowest demand; spring skiing in April provides some support" }
          ],
          rampUpTimeline: "Expect 12–18 months to reach stabilized occupancy of 78–82%, with strong initial demand during ski season (75%+) and gradual summer ramp over two seasons."
        },
        eventDemand: {
          corporateEvents: "Strong demand from Salt Lake City corporate market (35-minute drive) for executive retreats, sales kickoffs, and team-building events. The mountain setting and full catering capabilities make it ideal for immersive multi-day programs.",
          wellnessRetreats: "Significant opportunity for ski and wellness retreat packages combining outdoor activities with spa services, yoga, and mindfulness programming. Year-round demand potential.",
          weddingsPrivate: "Growing mountain wedding market with demand for intimate ceremonies (40–80 guests) in scenic alpine settings. Summer and early fall are peak wedding seasons.",
          estimatedEventRevShare: "42–48% of total revenue from events and F&B combined",
          keyDrivers: [
            "Salt Lake City corporate market within 45-minute drive (tech, finance, outdoor industry HQs)",
            "Powder Mountain and Snowbasin resort proximity creating built-in demand",
            "Utah's growing reputation as a luxury outdoor recreation destination",
            "Limited luxury lodging supply in Eden/Ogden Valley vs. Park City",
            "Year-round outdoor recreation supporting dual-season revenue model"
          ]
        },
        cateringAnalysis: {
          recommendedBoostPercent: "38%",
          marketRange: "30% - 45%",
          rationale: "Eden Summit Lodge's full-catering positioning in a supply-constrained ski market supports a higher catering boost. Mountain resorts in the Wasatch Range report F&B revenue at 30–33% of room revenue including catering, versus a base F&B share of ~22%. The property's full kitchen capability, multi-day corporate retreat format (3-meal programs), and growing mountain wedding market drive strong catering penetration. Ski lodge properties in comparable markets (Park City, Jackson Hole) report 35–45% catering uplift to base F&B.",
          factors: [
            "Full-catering capability allows 3-meal-per-day corporate retreat programs, maximizing per-event F&B revenue",
            "Mountain wedding market (35% of events) commands full-service catering with premium per-head pricing ($150–$250/guest)",
            "Ski season events (Dec–Mar) see near-100% catering participation due to limited dining alternatives in Eden",
            "Corporate retreats from Salt Lake City tech companies (40% of events) typically book all-inclusive packages",
            "Comparable properties (Snowpine Lodge, Stein Eriksen) report catering contributing 35–42% uplift to base F&B"
          ],
          eventMixBreakdown: {
            fullyCatered: "45% of events (weddings, corporate multi-day retreats with all meals, galas)",
            partiallyCatered: "35% of events (day meetings with lunch, wellness retreats with some meals)",
            noCatering: "20% of events (ski group room-only bookings, self-catered groups)"
          }
        },
        capRateAnalysis: {
          marketRange: "7.0%–9.0%",
          boutiqueRange: "7.0%–8.0%",
          recommendedRange: "7.0%–8.0%",
          rationale: "Supply-constrained mountain resort markets with strong demand drivers command tighter cap rates. Eden's proximity to SLC and ongoing resort development at Powder Mountain provide additional value support compared to more remote mountain destinations.",
          comparables: [
            { name: "Snowpine Lodge", capRate: "7.2%", saleYear: "2022", notes: "Luxury ski lodge, Alta UT" },
            { name: "Washington School House", capRate: "7.5%", saleYear: "2023", notes: "Boutique hotel, Park City UT" },
            { name: "Blue Sky Ranch", capRate: "7.8%", saleYear: "2024", notes: "Luxury ranch resort, Wanship UT" },
            { name: "Hotel Park City", capRate: "7.4%", saleYear: "2023", notes: "Boutique resort, Park City UT" }
          ]
        },
        competitiveSet: [
          { name: "Snowpine Lodge", rooms: "47", adr: "$420", positioning: "Ski-in/out luxury lodge at Alta with full-service spa and dining" },
          { name: "Hotel Park City", rooms: "62", adr: "$380", positioning: "Boutique resort with golf, spa, and mountain activities" },
          { name: "Waldorf Astoria Park City", rooms: "175", adr: "$450", positioning: "Full-service luxury resort with ski access and multiple restaurants" },
          { name: "Blue Sky Ranch", rooms: "46", adr: "$395", positioning: "Luxury adventure ranch with horseback riding, fly fishing, and spa" }
        ],
        landValueAllocation: {
          recommendedPercent: "25%",
          marketRange: "20% - 30%",
          assessmentMethod: "Comparable mountain resort sales and Summit County assessor data",
          rationale: "Eden Summit Lodge's mountain setting near Powder Mountain places it in a market where land values are significant but tempered by terrain challenges and limited development potential on steep slopes. Mountain resort properties in northern Utah typically allocate 20-30% to land, with ski-adjacent parcels commanding higher ratios. At 25%, the allocation reflects the property's 12-acre mountain site with valuable ski proximity but acknowledges that building construction costs in mountain environments are substantially higher than flatland, reducing the land's proportional share.",
          factors: [
            "Mountain terrain with limited buildable area reduces per-acre land value compared to flat resort parcels, despite ski area proximity",
            "Summit County assessor records show average land allocations of 22-28% for hospitality properties in the Ogden Valley area",
            "Comparable mountain resort transactions (Snowpine Lodge, Blue Sky Ranch) show land allocations of 20-28% depending on ski access and elevation",
            "Higher-than-average construction costs for mountain building (foundation, access roads, snow load engineering) increase the building-to-land ratio",
            "Growing demand for non-Park City mountain experiences is increasing land values in the Eden/Huntsville corridor"
          ]
        },
        risks: [
          { risk: "Extreme seasonality (ski-dependent revenue)", mitigation: "Invest in summer programming (mountain biking, fly fishing, wellness retreats) and corporate retreat packages to build 70%+ summer occupancy" },
          { risk: "Climate change and snow variability", mitigation: "Partner with resorts that have robust snowmaking; diversify into non-snow winter activities (snowshoeing, winter wellness); develop year-round revenue streams" },
          { risk: "Infrastructure limitations in Eden", mitigation: "Work with local authorities on road improvements; provide shuttle services to SLC airport; invest in on-site amenities to reduce need for off-property travel" },
          { risk: "Competition from Park City luxury supply", mitigation: "Position as an authentic, intimate mountain experience vs. Park City's resort commercialization; emphasize exclusivity, privacy, and full-catering capabilities" }
        ],
        sources: [
          "STR Global – Utah Mountain Resort Market Performance, 2025",
          "CBRE Hotels Research – Mountain Resort Investment Outlook, 2025",
          "HVS – Ogden Valley Lodging Market Feasibility Study, 2024",
          "PKF Hospitality Research – Ski Resort Hotel Trends, 2025",
          "Utah Office of Tourism – Annual Tourism Report, 2025",
          "Highland Group – Mountain Resort Cap Rate Analysis, 2024"
        ]
      }
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Austin Hillside"],
      title: "Market Research: Austin Hillside",
      llmModel: "seed-data",
      content: {
        marketOverview: {
          summary: "Austin's hospitality market continues to benefit from strong tech industry growth, a vibrant cultural scene, and major events like SXSW and ACL. The boutique hotel segment has seen rapid expansion but demand has kept pace, driven by the city's position as a top U.S. relocation destination. The Hill Country setting offers differentiation from downtown competitors, with growing demand for experiential stays that combine Austin's creative culture with natural surroundings.",
          keyMetrics: [
            { label: "Tourism Volume", value: "32.4M annual visitors to Austin metro area", source: "Austin Convention & Visitors Bureau, 2025" },
            { label: "Hotel Supply", value: "48 boutique/lifestyle properties in metro Austin", source: "STR Global, 2025" },
            { label: "RevPAR", value: "$112.50 market average, $198+ for boutique segment", source: "STR Global, 2025" },
            { label: "Market Growth", value: "6.8% YoY RevPAR growth in boutique segment", source: "CBRE Hotels Research, 2025" }
          ]
        },
        adrAnalysis: {
          marketAverage: "$195",
          boutiqueRange: "$220–$340",
          recommendedRange: "$255–$285",
          rationale: "Austin Hillside's 20-room boutique positioning with partial catering in the Hill Country supports mid-range boutique pricing. While below luxury peers like Hotel Saint Cecilia, the property's experiential positioning and tech-industry demand support healthy ADR growth potential.",
          comparables: [
            { name: "Hotel Saint Cecilia", adr: "$450", type: "Luxury Boutique" },
            { name: "South Congress Hotel", adr: "$280", type: "Lifestyle" },
            { name: "Hotel Magdalena", adr: "$310", type: "Boutique" },
            { name: "Carpenter Hotel", adr: "$245", type: "Boutique" }
          ]
        },
        occupancyAnalysis: {
          marketAverage: "70%",
          seasonalPattern: [
            { season: "SXSW/ACL Periods (Mar, Oct)", occupancy: "95%+", notes: "Major event periods command premium rates and near-100% occupancy" },
            { season: "Spring/Fall (Apr–May, Sep–Nov)", occupancy: "75–85%", notes: "Strong shoulder seasons with corporate travel and pleasant weather" },
            { season: "Summer (Jun–Aug)", occupancy: "55–65%", notes: "Heat-driven dip in leisure travel; corporate demand provides a floor" },
            { season: "Winter (Dec–Feb)", occupancy: "60–70%", notes: "Holiday events and New Year travel; corporate kickoffs in January" }
          ],
          rampUpTimeline: "Expect 12–18 months to reach stabilized occupancy of 72–76%, benefiting from Austin's strong year-round demand base and event calendar."
        },
        eventDemand: {
          corporateEvents: "Exceptional demand from Austin's tech sector for executive retreats, product launches, and team offsites. Companies like Tesla, Apple, Google, and Meta drive consistent corporate event bookings year-round.",
          wellnessRetreats: "Growing demand for tech-focused wellness retreats combining digital detox, outdoor activities, and mindfulness. Austin's health-conscious culture supports premium wellness programming.",
          weddingsPrivate: "Strong demand for Hill Country weddings and private celebrations. Austin's music and culinary scene adds unique event programming opportunities.",
          estimatedEventRevShare: "40–46% of total revenue from events and F&B combined",
          keyDrivers: [
            "Austin's booming tech industry driving corporate retreat demand (150+ tech company HQs)",
            "SXSW, ACL, and Formula 1 creating peak demand periods with premium pricing power",
            "Austin's position as #1 U.S. relocation destination driving new visitor demand",
            "Growing wellness and experiential travel trends among tech demographics",
            "Hill Country setting providing differentiation from downtown hotel competition"
          ]
        },
        cateringAnalysis: {
          recommendedBoostPercent: "25%",
          marketRange: "20% - 32%",
          rationale: "Austin Hillside's Hill Country positioning supports moderate catering uplift. While Austin's tech scene drives strong corporate retreat demand, many events are partially catered (lunch-only meetings, cocktail receptions) rather than full multi-meal programs. The competitive Austin F&B scene means guests often explore local restaurants for dinner, reducing full-catering penetration. Comparable Hill Country properties report F&B at 27–28% of room revenue including catering versus a 22% base, implying a ~25% boost.",
          factors: [
            "Austin's vibrant restaurant scene reduces demand for on-site dinner catering at corporate events",
            "Tech company offsites (45% of events) typically book partial catering: breakfast, lunch, and coffee service",
            "Hill Country weddings (25% of events) command full catering but represent a smaller share of the event mix",
            "SXSW and ACL festival periods drive room-only bookings with minimal F&B attachment",
            "Comparable properties (Camp Lucy, Travaasa) report catering contributing 22–30% uplift to base F&B"
          ],
          eventMixBreakdown: {
            fullyCatered: "25% of events (weddings, executive dinners, multi-day wellness retreats)",
            partiallyCatered: "40% of events (corporate day meetings with lunch, cocktail receptions)",
            noCatering: "35% of events (festival period room-only, self-organized group stays)"
          }
        },
        capRateAnalysis: {
          marketRange: "7.0%–8.5%",
          boutiqueRange: "7.0%–8.0%",
          recommendedRange: "7.5%–8.5%",
          rationale: "Austin's strong demand fundamentals and population growth support attractive cap rates for boutique properties, though recent supply additions have moderated compression. The Hill Country location may carry a slight premium vs. downtown due to lower barrier to entry but also less established demand pattern.",
          comparables: [
            { name: "Hotel Magdalena", capRate: "7.2%", saleYear: "2023", notes: "Boutique hotel, South Austin" },
            { name: "Carpenter Hotel", capRate: "7.8%", saleYear: "2024", notes: "Boutique hotel, downtown Austin" },
            { name: "Lone Star Court", capRate: "8.1%", saleYear: "2023", notes: "Boutique hotel, Domain area" },
            { name: "Commodore Perry Estate", capRate: "7.5%", saleYear: "2022", notes: "Luxury boutique, Hyde Park" }
          ]
        },
        competitiveSet: [
          { name: "Hotel Saint Cecilia", rooms: "14", adr: "$450", positioning: "Ultra-luxury rock & roll boutique with celebrity cachet" },
          { name: "South Congress Hotel", rooms: "83", adr: "$280", positioning: "Lifestyle hotel anchoring SoCo district with rooftop pool and restaurants" },
          { name: "Hotel Magdalena", rooms: "89", adr: "$310", positioning: "Lake Austin boutique by Lake Flato architects with pool club" },
          { name: "Carpenter Hotel", rooms: "93", adr: "$245", positioning: "Design-forward boutique in converted 1930s building" }
        ],
        landValueAllocation: {
          recommendedPercent: "35%",
          marketRange: "30% - 40%",
          assessmentMethod: "Travis County Appraisal District records and comparable Hill Country sales",
          rationale: "Austin Hillside's location in the Texas Hill Country west of downtown Austin places it in one of the highest land-value growth markets in the United States. Travis County has seen land values appreciate 40-60% since 2020, driven by tech industry growth and population influx. The property's 10-acre Hill Country setting commands premium per-acre pricing due to views, privacy, and proximity to both downtown Austin and the Hill Country wine/dining corridor. At 35%, the allocation reflects Austin's elevated land costs while acknowledging substantial building and improvement investments needed for boutique hospitality conversion.",
          factors: [
            "Travis County Appraisal District data shows land-to-improvement ratios of 32-40% for commercial hospitality properties in west Austin/Hill Country",
            "Austin land values have appreciated dramatically (40-60% since 2020), increasing the land component relative to building improvements",
            "10-acre Hill Country parcels with views and privacy command $150,000-$250,000 per acre in the Lake Travis/Bee Cave corridor",
            "Proximity to downtown Austin (20 minutes) and Hill Country attractions creates dual-market land premium",
            "High land allocation reduces depreciable basis but reflects accurate market conditions per IRS guidelines"
          ]
        },
        risks: [
          { risk: "Hotel construction boom creating oversupply", mitigation: "Differentiate through Hill Country experiential positioning vs. downtown commodity hotels; focus on high-value corporate and wellness segments less price-sensitive to new supply" },
          { risk: "Seasonal event dependence (SXSW, ACL)", mitigation: "Build year-round corporate retreat pipeline and wellness programming; develop midweek packages targeting remote workers and digital nomads" },
          { risk: "Extreme summer heat reducing leisure demand", mitigation: "Create indoor/evening-focused summer programming (culinary experiences, music events, spa packages); offer attractive summer corporate rates" },
          { risk: "Tech industry cyclicality affecting corporate demand", mitigation: "Diversify client base across industries; target healthcare, government, and education sectors; develop leisure and wedding revenue streams" }
        ],
        sources: [
          "STR Global – Austin Hotel Market Performance Report, 2025",
          "CBRE Hotels Research – Texas Boutique Hotel Investment Report, 2025",
          "HVS – Austin Lodging Market Overview, 2024",
          "PKF Hospitality Research – Urban Boutique Hotel Performance Trends, 2025",
          "Austin Convention & Visitors Bureau – Tourism Impact Study, 2025",
          "Highland Group – Sun Belt Hotel Cap Rate Survey, 2024"
        ]
      }
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Casa Medellín"],
      title: "Market Research: Casa Medellín",
      llmModel: "seed-data",
      content: {
        marketOverview: {
          summary: "Medellín has emerged as one of Latin America's most dynamic hospitality markets, driven by digital nomad migration, medical tourism, and the city's transformation into a global innovation hub. The El Poblado and Laureles neighborhoods anchor the luxury boutique segment, with international visitor arrivals growing 22% year-over-year. The city's spring-like climate, low cost of living, and improving infrastructure make it increasingly attractive for both short-stay tourism and extended-stay guests.",
          keyMetrics: [
            { label: "Tourism Volume", value: "1.4M international visitors to Medellín annually", source: "ProColombia Tourism Statistics, 2025" },
            { label: "Hotel Supply", value: "22 boutique/lifestyle properties in El Poblado and Laureles", source: "STR Global LATAM, 2025" },
            { label: "RevPAR", value: "$69.60 market average, $128+ for boutique segment (USD)", source: "STR Global LATAM, 2025" },
            { label: "Market Growth", value: "18.3% YoY RevPAR growth in boutique segment (USD terms)", source: "CBRE Hotels Americas, 2025" }
          ]
        },
        adrAnalysis: {
          marketAverage: "$120",
          boutiqueRange: "$140–$250",
          recommendedRange: "$170–$195",
          rationale: "Casa Medellín's 30-room full-catering positioning in the emerging luxury segment justifies mid-to-upper boutique pricing. The larger room count and full F&B capabilities support group bookings and events, while the market's rapid growth trajectory provides strong ADR growth potential in USD terms.",
          comparables: [
            { name: "The Charlee", adr: "$210", type: "Lifestyle Luxury" },
            { name: "Click Clack", adr: "$185", type: "Boutique" },
            { name: "Perlería Hotel", adr: "$165", type: "Boutique" },
            { name: "Los Patios Hostal Boutique", adr: "$145", type: "Boutique" }
          ]
        },
        occupancyAnalysis: {
          marketAverage: "58%",
          seasonalPattern: [
            { season: "High Season (Dec–Mar)", occupancy: "75–85%", notes: "Peak tourism period with holiday travel, Feria de las Flores overflow, and North American winter escapes" },
            { season: "Shoulder Season (Apr–May, Oct–Nov)", occupancy: "55–65%", notes: "Moderate demand with business travel and digital nomad arrivals" },
            { season: "Mid-Year (Jun–Sep)", occupancy: "50–60%", notes: "Steady demand from digital nomads and medical tourism; local holiday weekends provide spikes" },
            { season: "Feria de las Flores (Aug)", occupancy: "85–90%", notes: "Major festival period commands premium rates" }
          ],
          rampUpTimeline: "Expect 18–24 months to reach stabilized occupancy of 65–70%, with initial occupancy around 45–50% as the property builds reputation in the international market."
        },
        eventDemand: {
          corporateEvents: "Emerging demand from international companies hosting Latin American team gatherings, remote work retreats, and innovation workshops. Medellín's tech ecosystem (Ruta N) drives local corporate event demand.",
          wellnessRetreats: "Strong and growing demand for wellness retreats combining yoga, meditation, plant medicine ceremonies, and holistic health programming. The city's climate and natural surroundings support year-round wellness tourism.",
          weddingsPrivate: "Growing destination wedding market for international couples seeking unique, affordable luxury. Colombian cultural events and family celebrations also drive private event bookings.",
          estimatedEventRevShare: "38–44% of total revenue from events and F&B combined",
          keyDrivers: [
            "Digital nomad influx creating demand for extended-stay and co-working retreat experiences",
            "Medical tourism market driving health-conscious travel to Medellín",
            "Growing international recognition of Medellín as an innovation and culture hub",
            "Favorable USD-to-COP exchange rate making luxury accessible to international guests",
            "Year-round spring-like climate eliminating seasonal weather risk"
          ]
        },
        cateringAnalysis: {
          recommendedBoostPercent: "35%",
          marketRange: "28% - 42%",
          rationale: "Casa Medellín's 30-room full-catering positioning in the emerging Colombian luxury market supports a strong catering boost. International guests and destination events heavily rely on on-site F&B due to unfamiliarity with local dining options and security preferences for staying on-property. Colombian cultural events (weddings, quinceañeras) are traditionally fully catered celebrations. The favorable labor cost environment allows high-quality full-service catering at margins above North American norms. Comparable luxury properties in Medellín report F&B at 30–32% of room revenue including catering, versus a 22% base.",
          factors: [
            "International guests (60%+) strongly prefer on-site dining, driving higher F&B attachment rates than U.S. properties",
            "Colombian wedding and social event culture emphasizes full-service catering with elaborate multi-course meals",
            "Wellness retreats (30% of events) include full meal programs (farm-to-table, juice cleanses, health cuisine)",
            "Favorable labor costs allow premium catering services at higher margins than North American markets",
            "Limited luxury dining alternatives near the property increases on-site F&B capture rate"
          ],
          eventMixBreakdown: {
            fullyCatered: "40% of events (destination weddings, Colombian celebrations, corporate galas)",
            partiallyCatered: "40% of events (wellness retreats with meal programs, digital nomad co-working events)",
            noCatering: "20% of events (extended-stay digital nomads, local business meetings)"
          }
        },
        capRateAnalysis: {
          marketRange: "9.0%–11.0%",
          boutiqueRange: "9.5%–11.0%",
          recommendedRange: "9.5%–10.5%",
          rationale: "Colombian hospitality assets trade at wider cap rates reflecting country risk, currency volatility, and emerging market premiums. However, Medellín's rapid tourism growth and improving infrastructure are compressing spreads vs. historical norms. Full-service boutique properties with international appeal command the tighter end of the range.",
          comparables: [
            { name: "The Charlee Hotel", capRate: "9.8%", saleYear: "2023", notes: "Lifestyle luxury hotel, El Poblado" },
            { name: "Click Clack Medellín", capRate: "10.2%", saleYear: "2024", notes: "Boutique hotel, El Poblado" },
            { name: "Hotel Dann Carlton", capRate: "10.5%", saleYear: "2023", notes: "Full-service hotel, El Poblado" },
            { name: "Movich Hotels portfolio", capRate: "9.5%", saleYear: "2022", notes: "Boutique portfolio, multiple Colombian cities" }
          ]
        },
        competitiveSet: [
          { name: "The Charlee", rooms: "42", adr: "$210", positioning: "Lifestyle luxury rooftop scene with pool, restaurant, and nightlife" },
          { name: "Click Clack", rooms: "60", adr: "$185", positioning: "Design-forward boutique with co-working spaces and rooftop bar" },
          { name: "Perlería Hotel", rooms: "15", adr: "$165", positioning: "Intimate boutique with curated art collection and personalized service" },
          { name: "Los Patios Hostal Boutique", rooms: "22", adr: "$145", positioning: "Colonial-style boutique with courtyard gardens and local cultural programming" }
        ],
        landValueAllocation: {
          recommendedPercent: "20%",
          marketRange: "15% - 25%",
          assessmentMethod: "Colombian cadastral records (catastro) and comparable El Poblado property sales",
          rationale: "Casa Medellín's location in the El Poblado district of Medellín represents a market where land costs are significantly lower relative to total investment compared to US markets. Colombian land values in upscale urban neighborhoods like El Poblado are moderate by international standards, while building costs for luxury hospitality conversions are disproportionately high due to imported materials, specialized labor, and international design standards. At 20%, the allocation reflects Medellín's favorable land-to-building economics while acknowledging that El Poblado commands premium pricing within the Colombian market.",
          factors: [
            "Colombian cadastral (catastro) valuations in El Poblado show land-to-total ratios of 18-25% for commercial hospitality properties",
            "Building renovation and luxury conversion costs in Colombia are disproportionately high relative to land, as materials and specialized finishes are often imported",
            "El Poblado land values have appreciated significantly (20-30% since 2022) but remain well below comparable US urban markets",
            "International investment in Medellín hospitality has increased building standards and costs, further reducing the land proportion",
            "Lower land allocation increases depreciable basis, improving tax efficiency for the foreign investment structure"
          ]
        },
        risks: [
          { risk: "Political and regulatory risk in Colombia", mitigation: "Engage local legal counsel for compliance; structure ownership through appropriate corporate vehicles; maintain relationships with local government and tourism authorities" },
          { risk: "Currency fluctuation (COP/USD)", mitigation: "Price rooms in USD for international guests; implement natural hedging through USD-denominated revenue streams; maintain operating reserves in hard currency" },
          { risk: "Infrastructure and utility reliability", mitigation: "Invest in backup power systems, water treatment, and internet redundancy; build relationships with reliable local service providers" },
          { risk: "Safety perception among international travelers", mitigation: "Implement robust security protocols; partner with reputable travel agencies and review platforms; invest in positive PR and influencer marketing to counter outdated perceptions" }
        ],
        sources: [
          "STR Global LATAM – Colombia Hotel Performance Report, 2025",
          "CBRE Hotels Americas – Latin America Boutique Hotel Investment Outlook, 2025",
          "HVS – Medellín Lodging Market Assessment, 2024",
          "ProColombia – International Tourism Statistics, 2025",
          "JLL Hotels & Hospitality – Colombia Hospitality Market Overview, 2025",
          "Highland Group – Emerging Market Hotel Cap Rate Survey, 2024"
        ]
      }
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Blue Ridge Manor"],
      title: "Market Research: Blue Ridge Manor",
      llmModel: "seed-data",
      content: {
        marketOverview: {
          summary: "Asheville, North Carolina has established itself as one of the Southeast's premier arts, wellness, and culinary destinations. The Blue Ridge Mountains setting, combined with a thriving brewery and farm-to-table scene, attracts affluent visitors year-round with peak demand during fall foliage season. The boutique hotel segment has matured significantly, with strong demand from both leisure travelers and corporate retreat groups seeking mountain settings within driving distance of major Southeast metros.",
          keyMetrics: [
            { label: "Tourism Volume", value: "11.8M annual visitors to Buncombe County", source: "Explore Asheville Convention & Visitors Bureau, 2025" },
            { label: "Hotel Supply", value: "38 boutique/independent properties within Asheville metro", source: "STR Global, 2025" },
            { label: "RevPAR", value: "$140.70 market average, $258+ for boutique segment", source: "STR Global, 2025" },
            { label: "Market Growth", value: "7.4% YoY RevPAR growth in boutique segment", source: "CBRE Hotels Research, 2025" }
          ]
        },
        adrAnalysis: {
          marketAverage: "$210",
          boutiqueRange: "$275–$400",
          recommendedRange: "$325–$360",
          rationale: "Blue Ridge Manor's 30-room full-catering estate positioning in the Blue Ridge Mountains supports upper-mid boutique pricing. The larger room count enables group and event bookings at scale while the full F&B capability and mountain setting justify premium rates competitive with established luxury peers.",
          comparables: [
            { name: "The Omni Grove Park Inn", adr: "$350", type: "Historic Resort" },
            { name: "Inn on Biltmore Estate", adr: "$395", type: "Luxury" },
            { name: "Foundry Hotel", adr: "$320", type: "Boutique" },
            { name: "Grand Bohemian Hotel", adr: "$305", type: "Boutique" }
          ]
        },
        occupancyAnalysis: {
          marketAverage: "67%",
          seasonalPattern: [
            { season: "Fall Foliage (Sep–Nov)", occupancy: "90–95%", notes: "Highest demand period driven by Blue Ridge Parkway foliage tourism; October commands highest rates" },
            { season: "Summer (Jun–Aug)", occupancy: "75–85%", notes: "Strong family and leisure travel; music festivals and outdoor events drive demand" },
            { season: "Spring (Mar–May)", occupancy: "65–75%", notes: "Growing season with wildflower tourism, wedding bookings, and corporate retreats" },
            { season: "Winter (Dec–Feb)", occupancy: "45–55%", notes: "Holiday events and ski-adjacent demand from nearby slopes; wellness retreat programming provides a floor" }
          ],
          rampUpTimeline: "Expect 15–20 months to reach stabilized occupancy of 74–78%, with strong initial demand during fall season (80%+) and steady growth across other seasons."
        },
        eventDemand: {
          corporateEvents: "Growing demand from Charlotte, Atlanta, and Raleigh-Durham corporate markets for executive retreats and team building in a mountain setting. The 2–3 hour drive from multiple major metros creates an accessible yet removed retreat environment.",
          wellnessRetreats: "Asheville's established wellness community supports strong year-round demand for yoga retreats, meditation workshops, sound healing, and holistic health programming. The mountain setting and local wellness practitioners provide a deep talent pool.",
          weddingsPrivate: "Exceptional demand for mountain weddings and destination celebrations. Asheville consistently ranks among the top U.S. wedding destinations, with demand for venues accommodating 60–120 guests in scenic settings.",
          estimatedEventRevShare: "44–50% of total revenue from events and F&B combined",
          keyDrivers: [
            "Multiple major metro areas within 2–3 hour drive (Charlotte, Atlanta, Raleigh-Durham, Greenville)",
            "Asheville's established reputation as a top U.S. wellness and culinary destination",
            "Blue Ridge Parkway's status as the most-visited National Park Service site driving tourism",
            "Growing corporate retreat market among Southeast tech and finance companies",
            "Strong wedding destination market with year-round demand for mountain venues"
          ]
        },
        cateringAnalysis: {
          recommendedBoostPercent: "42%",
          marketRange: "35% - 50%",
          rationale: "Blue Ridge Manor's 30-room estate in Asheville commands the highest catering boost in the portfolio. Asheville is a top-tier U.S. wedding destination with exceptionally high full-catering penetration, and the property's mountain estate setting makes it a premier venue for fully catered celebrations. The city's nationally recognized culinary scene (farm-to-table, craft beverage) enhances F&B programming and justifies premium catering pricing. Comparable Asheville properties report F&B at 31–35% of room revenue including catering, versus a 22% base, implying a 40–50% boost for estate-style properties.",
          factors: [
            "Asheville ranks among top 10 U.S. wedding destinations — mountain estate weddings (40% of events) are almost always fully catered",
            "Nationally recognized culinary scene enables premium farm-to-table catering at $175–$300 per guest",
            "Corporate retreats from Charlotte/Atlanta (30% of events) book all-inclusive packages including 3 daily meals",
            "Wellness retreats (20% of events) include full meal programs leveraging local organic/artisanal food suppliers",
            "Property's remote mountain setting means guests dine on-site for nearly all meals, maximizing F&B capture"
          ],
          eventMixBreakdown: {
            fullyCatered: "50% of events (mountain weddings, corporate retreats with all meals, wellness programs)",
            partiallyCatered: "30% of events (day meetings with lunch, partial retreat packages)",
            noCatering: "20% of events (room-only leisure guests, small self-catered gatherings)"
          }
        },
        capRateAnalysis: {
          marketRange: "7.5%–9.0%",
          boutiqueRange: "7.5%–8.5%",
          recommendedRange: "7.5%–8.5%",
          rationale: "Asheville's established tourism market, strong brand recognition, and diverse demand drivers support attractive cap rates for boutique properties. The market's maturity and proven performance reduce risk premiums compared to emerging destinations, though seasonal concentration adds a modest premium.",
          comparables: [
            { name: "Foundry Hotel", capRate: "7.8%", saleYear: "2023", notes: "Boutique hotel, downtown Asheville" },
            { name: "Grand Bohemian Hotel", capRate: "7.5%", saleYear: "2022", notes: "Boutique hotel, Biltmore Village" },
            { name: "The Restoration", capRate: "8.2%", saleYear: "2024", notes: "Boutique hotel, Charleston SC (comparable market)" },
            { name: "Old Edwards Inn", capRate: "7.9%", saleYear: "2023", notes: "Luxury boutique, Highlands NC" }
          ]
        },
        competitiveSet: [
          { name: "The Omni Grove Park Inn", rooms: "510", adr: "$350", positioning: "Iconic historic resort with spa, golf, and Blue Ridge Mountain views" },
          { name: "Inn on Biltmore Estate", rooms: "210", adr: "$395", positioning: "Luxury hotel within Biltmore Estate with exclusive estate access" },
          { name: "Foundry Hotel", rooms: "87", adr: "$320", positioning: "Adaptive reuse boutique in Arts District with rooftop bar and local programming" },
          { name: "Grand Bohemian Hotel", rooms: "104", adr: "$305", positioning: "Art-focused boutique in Biltmore Village with gallery, spa, and dining" }
        ],
        landValueAllocation: {
          recommendedPercent: "28%",
          marketRange: "22% - 32%",
          assessmentMethod: "Buncombe County tax assessor records and comparable Blue Ridge estate sales",
          rationale: "Blue Ridge Manor's 18-acre mountain estate setting near Asheville sits in a market where land values have steadily appreciated due to the region's growing tourism economy and limited supply of large estate parcels. Buncombe County land-to-improvement ratios for hospitality properties average 24-30%, with larger acreage parcels trending higher. At 28%, the allocation reflects the property's substantial acreage and scenic Blue Ridge Mountain setting while recognizing that building improvements for a full-service boutique hotel represent the majority of total value.",
          factors: [
            "Buncombe County tax assessor records show land allocations of 24-30% for commercial hospitality properties in the greater Asheville area",
            "18-acre mountain estate parcels with views and privacy are increasingly scarce, commanding premium per-acre pricing of $80,000-$120,000",
            "Comparable Blue Ridge estate sales (Old Edwards Inn, Highlands NC; Blackberry Farm, TN) show land allocations of 25-32%",
            "Asheville's growing tourism market has driven 15-20% land value appreciation since 2021, supporting a higher land allocation",
            "Property's distance from downtown Asheville (30 minutes) moderates land values compared to in-town hospitality properties"
          ]
        },
        risks: [
          { risk: "Seasonal concentration in fall foliage period", mitigation: "Develop four-season programming including winter wellness retreats, spring wildflower packages, and summer music/culinary events; target corporate retreat market for year-round bookings" },
          { risk: "Short-term rental competition on platforms like Airbnb", mitigation: "Differentiate through full-service hospitality, curated experiences, and event capabilities that STRs cannot replicate; support local STR regulation efforts; emphasize service quality and consistency" },
          { risk: "Limited commercial airlift to Asheville Regional Airport", mitigation: "Partner with ground transportation services from Charlotte and Greenville-Spartanburg airports; develop packages that include transfer services; market to drive-in markets within 3-hour radius" },
          { risk: "Rising property costs in Asheville market", mitigation: "Lock in favorable acquisition terms early; implement efficiency-driven operations to maintain margins; explore phased renovation approach to manage capital expenditure" }
        ],
        sources: [
          "STR Global – Asheville Hotel Market Performance Report, 2025",
          "CBRE Hotels Research – Southeast Boutique Hotel Investment Outlook, 2025",
          "HVS – Western North Carolina Lodging Market Analysis, 2024",
          "PKF Hospitality Research – Mountain Resort Performance Trends, 2025",
          "Explore Asheville Convention & Visitors Bureau – Tourism Economic Impact Study, 2025",
          "Highland Group – Southeast Hotel Cap Rate Survey, 2024"
        ]
      }
    }
  ]);
  console.log("Seeded market research for 5 properties");

  console.log("Database seed completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
