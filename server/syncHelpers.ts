import type { IStorage } from "./storage";
import {
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_COMMISSION_RATE,
  DEFAULT_SAFE_VALUATION_CAP,
  DEFAULT_SAFE_DISCOUNT_RATE,
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
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_TAX_RATE,
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  SEED_DEBT_ASSUMPTIONS,
} from "../shared/constants";

export interface SyncResults {
  globalAssumptions: { created: number; skipped: number; filled: number };
  properties: { created: number; skipped: number; filled: number };
  propertyFeeCategories: { created: number; skipped: number };
  designThemes: { created: number; skipped: number };
}

export const SEED_GLOBAL_ASSUMPTIONS = {
  modelStartDate: "2026-04-01",
  inflationRate: 0.03,
  baseManagementFee: DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  incentiveManagementFee: DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
  staffSalary: 75000,
  staffTier1MaxProperties: 3,
  staffTier1Fte: 2.5,
  staffTier2MaxProperties: 6,
  staffTier2Fte: 4.5,
  staffTier3Fte: 7.0,
  travelCostPerClient: 12000,
  itLicensePerClient: 3000,
  marketingRate: 0.05,
  miscOpsRate: 0.03,
  officeLeaseStart: 36000,
  professionalServicesStart: 24000,
  techInfraStart: 18000,
  businessInsuranceStart: 12000,
  standardAcqPackage: { monthsToOps: 6, purchasePrice: 3800000, preOpeningCosts: 200000, operatingReserve: 250000, buildingImprovements: 1200000 },
  debtAssumptions: SEED_DEBT_ASSUMPTIONS,
  commissionRate: DEFAULT_COMMISSION_RATE,
  fixedCostEscalationRate: 0.03,
  safeTranche1Amount: 1000000,
  safeTranche1Date: "2026-06-01",
  safeTranche2Amount: 1000000,
  safeTranche2Date: "2027-04-01",
  safeValuationCap: DEFAULT_SAFE_VALUATION_CAP,
  safeDiscountRate: DEFAULT_SAFE_DISCOUNT_RATE,
  companyTaxRate: 0.3,
  companyOpsStartDate: "2026-06-01",
  fiscalYearStartMonth: 1,
  companyName: "L+B Hospitality Company",
  exitCapRate: DEFAULT_EXIT_CAP_RATE,
  salesCommissionRate: DEFAULT_COMMISSION_RATE,
  eventExpenseRate: DEFAULT_EVENT_EXPENSE_RATE,
  otherExpenseRate: DEFAULT_OTHER_EXPENSE_RATE,
  utilitiesVariableSplit: DEFAULT_UTILITIES_VARIABLE_SPLIT,
  partnerCompYear1: 540000, partnerCompYear2: 540000, partnerCompYear3: 540000,
  partnerCompYear4: 600000, partnerCompYear5: 600000, partnerCompYear6: 700000,
  partnerCompYear7: 700000, partnerCompYear8: 800000, partnerCompYear9: 800000, partnerCompYear10: 900000,
  partnerCountYear1: 3, partnerCountYear2: 3, partnerCountYear3: 3, partnerCountYear4: 3, partnerCountYear5: 3,
  partnerCountYear6: 3, partnerCountYear7: 3, partnerCountYear8: 3, partnerCountYear9: 3, partnerCountYear10: 3,
};

export const SEED_PROPERTY_DEFAULTS = {
  costRateRooms: DEFAULT_COST_RATE_ROOMS, costRateFB: DEFAULT_COST_RATE_FB, costRateAdmin: DEFAULT_COST_RATE_ADMIN,
  costRateMarketing: DEFAULT_COST_RATE_MARKETING, costRatePropertyOps: DEFAULT_COST_RATE_PROPERTY_OPS,
  costRateUtilities: DEFAULT_COST_RATE_UTILITIES, costRateInsurance: DEFAULT_COST_RATE_INSURANCE,
  costRateTaxes: DEFAULT_COST_RATE_TAXES, costRateIT: DEFAULT_COST_RATE_IT, costRateFFE: DEFAULT_COST_RATE_FFE,
  costRateOther: DEFAULT_COST_RATE_OTHER, revShareEvents: DEFAULT_REV_SHARE_EVENTS,
  revShareFB: DEFAULT_REV_SHARE_FB, revShareOther: DEFAULT_REV_SHARE_OTHER,
  exitCapRate: DEFAULT_EXIT_CAP_RATE, taxRate: DEFAULT_TAX_RATE,
  dispositionCommission: DEFAULT_COMMISSION_RATE,
  baseManagementFeeRate: DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  incentiveManagementFeeRate: DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
};

export const DEFAULT_FEE_CATEGORIES = [
  { name: "Marketing", rate: 0.02, sortOrder: 1 },
  { name: "IT", rate: 0.01, sortOrder: 2 },
  { name: "Accounting", rate: 0.015, sortOrder: 3 },
  { name: "Reservations", rate: 0.02, sortOrder: 4 },
  { name: "General Management", rate: 0.02, sortOrder: 5 },
];

export function isFieldEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

export function fillMissingFields<T extends Record<string, unknown>>(
  existing: T,
  defaults: Record<string, unknown>,
  excludeKeys: string[] = ["id", "createdAt", "updatedAt", "userId"]
): Partial<T> {
  const updates: Record<string, unknown> = {};
  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (excludeKeys.includes(key)) continue;
    const existingValue = existing[key];
    if (isFieldEmpty(existingValue)) {
      updates[key] = defaultValue;
    }
  }
  return updates as Partial<T>;
}

export async function runFillOnlySync(storage: IStorage, generateResearchValues?: (prop: any) => any): Promise<SyncResults> {
  const results: SyncResults = {
    globalAssumptions: { created: 0, skipped: 0, filled: 0 },
    properties: { created: 0, skipped: 0, filled: 0 },
    propertyFeeCategories: { created: 0, skipped: 0 },
    designThemes: { created: 0, skipped: 0 },
  };

  const existingAssumptions = await storage.getGlobalAssumptions();
  if (!existingAssumptions) {
    await storage.upsertGlobalAssumptions(SEED_GLOBAL_ASSUMPTIONS);
    results.globalAssumptions.created++;
  } else {
    const updates = fillMissingFields(existingAssumptions as any, SEED_GLOBAL_ASSUMPTIONS);
    if (Object.keys(updates).length > 0) {
      await storage.upsertGlobalAssumptions({ ...existingAssumptions, ...updates } as any);
      results.globalAssumptions.filled++;
    } else {
      results.globalAssumptions.skipped++;
    }
  }

  const SEED_PROPERTIES = [
    { ...SEED_PROPERTY_DEFAULTS, name: "The Hudson Estate", streetAddress: "142 Old Post Road", city: "Millbrook", stateProvince: "NY", zipPostalCode: "12545", country: "United States", location: "Hudson Valley, New York", market: "North America", imageUrl: "/images/property-ny.png", status: "Pipeline", acquisitionDate: "2026-06-01", operationsStartDate: "2026-12-01", purchasePrice: 3800000, buildingImprovements: 1200000, preOpeningCosts: 200000, operatingReserve: 250000, roomCount: 20, startAdr: 385, adrGrowthRate: 0.025, startOccupancy: 0.55, maxOccupancy: 0.82, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", costRateFB: 0.085, costRateIT: 0.005, cateringBoostPercent: 0.22, exitCapRate: 0.08, willRefinance: "Yes", refinanceDate: "2029-12-01", refinanceLtv: 0.75, refinanceInterestRate: 0.09, refinanceTermYears: 25, refinanceClosingCostRate: 0.03, revShareEvents: 0.30 },
    { ...SEED_PROPERTY_DEFAULTS, name: "Eden Summit Lodge", streetAddress: "3850 Nordic Valley Road", city: "Eden", stateProvince: "UT", zipPostalCode: "84310", location: "Ogden Valley, Utah", market: "North America", imageUrl: "/images/property-utah.png", status: "Pipeline", acquisitionDate: "2027-01-01", operationsStartDate: "2027-07-01", purchasePrice: 4000000, buildingImprovements: 1200000, preOpeningCosts: 200000, operatingReserve: 250000, roomCount: 20, startAdr: 425, adrGrowthRate: 0.025, startOccupancy: 0.50, maxOccupancy: 0.80, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", costRateFB: 0.085, costRateIT: 0.005, cateringBoostPercent: 0.25, willRefinance: "Yes", refinanceDate: "2030-07-01", refinanceLtv: 0.75, refinanceInterestRate: 0.09, refinanceTermYears: 25, refinanceClosingCostRate: 0.03, revShareEvents: 0.30 },
    { ...SEED_PROPERTY_DEFAULTS, name: "Austin Hillside", streetAddress: "4100 Mount Bonnell Drive", city: "Austin", stateProvince: "TX", zipPostalCode: "78731", location: "Hill Country, Texas", market: "North America", imageUrl: "/images/property-austin.png", status: "Pipeline", acquisitionDate: "2027-04-01", operationsStartDate: "2028-01-01", purchasePrice: 3500000, buildingImprovements: 1100000, preOpeningCosts: 200000, operatingReserve: 250000, roomCount: 20, startAdr: 320, adrGrowthRate: 0.025, startOccupancy: 0.55, maxOccupancy: 0.82, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", costRateFB: 0.09, costRateIT: 0.005, cateringBoostPercent: 0.20, willRefinance: "Yes", refinanceDate: "2031-01-01", refinanceLtv: 0.75, refinanceInterestRate: 0.09, refinanceTermYears: 25, refinanceClosingCostRate: 0.03, revShareEvents: 0.28 },
    { ...SEED_PROPERTY_DEFAULTS, name: "Casa Medellín", streetAddress: "Carrera 43A #7-50, El Poblado", city: "Medellín", stateProvince: "Antioquia", zipPostalCode: "050021", location: "El Poblado, Medellín", market: "Latin America", imageUrl: "/images/property-medellin.png", status: "Pipeline", acquisitionDate: "2026-09-01", operationsStartDate: "2028-07-01", purchasePrice: 3800000, buildingImprovements: 1000000, preOpeningCosts: 200000, operatingReserve: 600000, roomCount: 30, startAdr: 210, adrGrowthRate: 0.04, startOccupancy: 0.50, maxOccupancy: 0.78, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Financed", costRateFB: 0.075, costRateIT: 0.005, cateringBoostPercent: 0.18, exitCapRate: 0.095, acquisitionLTV: 0.60, acquisitionInterestRate: 0.095, acquisitionTermYears: 25, acquisitionClosingCostRate: 0.02, revShareEvents: 0.25 },
    { ...SEED_PROPERTY_DEFAULTS, name: "Blue Ridge Manor", streetAddress: "275 Elk Mountain Scenic Highway", city: "Asheville", stateProvince: "NC", zipPostalCode: "28804", location: "Blue Ridge Mountains, North Carolina", market: "North America", imageUrl: "/images/property-asheville.png", status: "Pipeline", acquisitionDate: "2027-07-01", operationsStartDate: "2028-07-01", purchasePrice: 6000000, buildingImprovements: 1500000, preOpeningCosts: 250000, operatingReserve: 500000, roomCount: 30, startAdr: 375, adrGrowthRate: 0.025, startOccupancy: 0.50, maxOccupancy: 0.80, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Financed", costRateFB: 0.10, costRateIT: 0.005, cateringBoostPercent: 0.25, exitCapRate: 0.09, acquisitionLTV: 0.60, acquisitionInterestRate: 0.09, acquisitionTermYears: 25, acquisitionClosingCostRate: 0.02, revShareEvents: 0.28 },
  ];

  const existingProperties = await storage.getAllProperties();
  const existingByName = new Map(existingProperties.map(p => [p.name, p]));

  for (const propData of SEED_PROPERTIES) {
    const existing = existingByName.get(propData.name);
    if (!existing) {
      let researchValues: any = null;
      if (generateResearchValues) {
        researchValues = generateResearchValues({
          location: propData.location,
          streetAddress: propData.streetAddress,
          city: propData.city,
          stateProvince: propData.stateProvince,
          market: propData.market,
        });
      }
      await storage.createProperty({ ...propData, researchValues } as any);
      results.properties.created++;
    } else {
      const updates = fillMissingFields(existing as any, propData, ["id", "createdAt", "updatedAt", "userId", "name"]);
      if (!existing.researchValues && generateResearchValues) {
        (updates as any).researchValues = generateResearchValues({
          location: existing.location,
          streetAddress: existing.streetAddress,
          city: existing.city,
          stateProvince: existing.stateProvince,
          market: existing.market,
        });
      }
      if (Object.keys(updates).length > 0) {
        await storage.updateProperty(existing.id, updates as any);
        results.properties.filled++;
      } else {
        results.properties.skipped++;
      }
    }
  }

  const allProps = await storage.getAllProperties();
  for (const prop of allProps) {
    const existingCats = await storage.getFeeCategoriesByProperty(prop.id);
    if (existingCats.length === 0) {
      for (const cat of DEFAULT_FEE_CATEGORIES) {
        await storage.createFeeCategory({ propertyId: prop.id, name: cat.name, rate: cat.rate, isActive: true, sortOrder: cat.sortOrder });
        results.propertyFeeCategories.created++;
      }
    } else {
      for (const cat of DEFAULT_FEE_CATEGORIES) {
        const existingCat = existingCats.find(c => c.name === cat.name);
        if (!existingCat) {
          await storage.createFeeCategory({ propertyId: prop.id, name: cat.name, rate: cat.rate, isActive: true, sortOrder: cat.sortOrder });
          results.propertyFeeCategories.created++;
        } else {
          results.propertyFeeCategories.skipped++;
        }
      }
    }
  }

  const existingThemes = await storage.getAllDesignThemes();
  const SEED_THEMES = [
    {
      name: "Fluid Glass",
      description: "Inspired by Apple's iOS design language, Fluid Glass creates a sense of depth and dimension through translucent layers, subtle gradients, and smooth animations.",
      isDefault: true,
      colors: [
        { name: "Sage Green", rank: 1, hexCode: "#9FBCA4", description: "PALETTE: Secondary accent for subtle highlights, card borders, and supporting visual elements." },
        { name: "Deep Green", rank: 2, hexCode: "#257D41", description: "PALETTE: Primary brand color for main action buttons, active navigation items, and key highlights." },
        { name: "Warm Cream", rank: 3, hexCode: "#FFF9F5", description: "PALETTE: Light background for page backgrounds, card surfaces, and warm accents." },
        { name: "Deep Black", rank: 4, hexCode: "#0a0a0f", description: "PALETTE: Dark theme background for navigation sidebars, dark glass panels, and login screens." },
        { name: "Salmon", rank: 5, hexCode: "#F4795B", description: "PALETTE: Accent color for warnings, notifications, and emphasis highlights." },
        { name: "Yellow Gold", rank: 6, hexCode: "#F59E0B", description: "PALETTE: Accent color for highlights, badges, and attention-drawing elements." },
        { name: "Chart Blue", rank: 1, hexCode: "#3B82F6", description: "CHART: Primary chart line color for revenue and key financial metrics." },
        { name: "Chart Red", rank: 2, hexCode: "#EF4444", description: "CHART: Secondary chart line color for expenses and cost-related metrics." },
        { name: "Chart Purple", rank: 3, hexCode: "#8B5CF6", description: "CHART: Tertiary chart line color for cash flow and profitability metrics." },
      ],
    },
    {
      name: "Indigo Blue",
      description: "A bold, professional theme centered on deep indigo-blue tones with cool steel accents. Conveys trust, authority, and modern sophistication — ideal for investor-facing presentations.",
      isDefault: false,
      colors: [
        { name: "Indigo", rank: 1, hexCode: "#4F46E5", description: "PALETTE: Primary brand color for main action buttons, active navigation items, and key highlights." },
        { name: "Deep Navy", rank: 2, hexCode: "#1E1B4B", description: "PALETTE: Dark theme background for navigation sidebars, dark glass panels, and login screens." },
        { name: "Ice White", rank: 3, hexCode: "#F0F4FF", description: "PALETTE: Light background for page backgrounds, card surfaces, and cool accents." },
        { name: "Steel Blue", rank: 4, hexCode: "#64748B", description: "PALETTE: Secondary accent for subtle highlights, card borders, and supporting visual elements." },
        { name: "Coral", rank: 5, hexCode: "#F43F5E", description: "PALETTE: Accent color for warnings, notifications, and emphasis highlights." },
        { name: "Amber", rank: 6, hexCode: "#F59E0B", description: "PALETTE: Accent color for highlights, badges, and attention-drawing elements." },
        { name: "Chart Indigo", rank: 1, hexCode: "#6366F1", description: "CHART: Primary chart line color for revenue and key financial metrics." },
        { name: "Chart Teal", rank: 2, hexCode: "#14B8A6", description: "CHART: Secondary chart line color for expenses and cost-related metrics." },
        { name: "Chart Violet", rank: 3, hexCode: "#A855F7", description: "CHART: Tertiary chart line color for cash flow and profitability metrics." },
      ],
    },
  ];

  const existingNames = new Set(existingThemes.map(t => t.name));
  for (const theme of SEED_THEMES) {
    if (!existingNames.has(theme.name)) {
      await storage.createDesignTheme(theme);
      results.designThemes.created++;
    } else {
      results.designThemes.skipped++;
    }
  }

  return results;
}

