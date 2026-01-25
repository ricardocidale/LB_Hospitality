import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// --- GLOBAL ASSUMPTIONS TABLE ---
export const globalAssumptions = pgTable("global_assumptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  modelStartDate: text("model_start_date").notNull(),
  inflationRate: real("inflation_rate").notNull(),
  baseManagementFee: real("base_management_fee").notNull(),
  incentiveManagementFee: real("incentive_management_fee").notNull(),
  partnerSalary: real("partner_salary").notNull(),
  staffSalary: real("staff_salary").notNull(),
  travelCostPerClient: real("travel_cost_per_client").notNull(),
  itLicensePerClient: real("it_license_per_client").notNull(),
  marketingRate: real("marketing_rate").notNull(),
  commissionRate: real("commission_rate").notNull().default(0.05),
  miscOpsRate: real("misc_ops_rate").notNull(),
  officeLeaseStart: real("office_lease_start").notNull(),
  professionalServicesStart: real("professional_services_start").notNull(),
  techInfraStart: real("tech_infra_start").notNull(),
  businessInsuranceStart: real("business_insurance_start").notNull(),
  
  standardAcqPackage: jsonb("standard_acq_package").notNull(),
  debtAssumptions: jsonb("debt_assumptions").notNull(),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGlobalAssumptionsSchema = createInsertSchema(globalAssumptions, {
  standardAcqPackage: z.object({
    purchasePrice: z.number(),
    buildingImprovements: z.number(),
    preOpeningCosts: z.number(),
    operatingReserve: z.number(),
    monthsToOps: z.number()
  }),
  debtAssumptions: z.object({
    interestRate: z.number(),
    amortizationYears: z.number(),
    refiLTV: z.number(),
    refiClosingCostRate: z.number(),
    refiInterestRate: z.number().optional(),
    refiAmortizationYears: z.number().optional(),
    refiPeriodYears: z.number().optional(),
    acqLTV: z.number(),
    acqClosingCostRate: z.number()
  })
}).omit({ 
  id: true, 
  updatedAt: true 
});

export const selectGlobalAssumptionsSchema = createSelectSchema(globalAssumptions);

export type GlobalAssumptions = typeof globalAssumptions.$inferSelect;
export type InsertGlobalAssumptions = z.infer<typeof insertGlobalAssumptionsSchema>;

// --- PROPERTIES TABLE ---
export const properties = pgTable("properties", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  market: text("market").notNull(),
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull(),
  
  acquisitionDate: text("acquisition_date").notNull(),
  operationsStartDate: text("operations_start_date").notNull(),
  
  purchasePrice: real("purchase_price").notNull(),
  buildingImprovements: real("building_improvements").notNull(),
  preOpeningCosts: real("pre_opening_costs").notNull(),
  operatingReserve: real("operating_reserve").notNull(),
  
  roomCount: integer("room_count").notNull(),
  startAdr: real("start_adr").notNull(),
  adrGrowthRate: real("adr_growth_rate").notNull(),
  startOccupancy: real("start_occupancy").notNull(),
  maxOccupancy: real("max_occupancy").notNull(),
  occupancyRampMonths: integer("occupancy_ramp_months").notNull(),
  occupancyGrowthStep: real("occupancy_growth_step").notNull(),
  stabilizationMonths: integer("stabilization_months").notNull(),
  
  type: text("type").notNull(),
  cateringLevel: text("catering_level").notNull(),
  
  // Financing fields (for Financed type)
  acquisitionLTV: real("acquisition_ltv"),
  acquisitionInterestRate: real("acquisition_interest_rate"),
  acquisitionTermYears: integer("acquisition_term_years"),
  acquisitionClosingCostRate: real("acquisition_closing_cost_rate"),
  
  // Refinance fields (for Full Equity with refinance)
  willRefinance: text("will_refinance"),
  refinanceDate: text("refinance_date"),
  refinanceLTV: real("refinance_ltv"),
  refinanceInterestRate: real("refinance_interest_rate"),
  refinanceTermYears: integer("refinance_term_years"),
  refinanceClosingCostRate: real("refinance_closing_cost_rate"),
  
  // Operating Cost Rates (should sum to 100%)
  costRateRooms: real("cost_rate_rooms").notNull().default(0.36),
  costRateFB: real("cost_rate_fb").notNull().default(0.15),
  costRateAdmin: real("cost_rate_admin").notNull().default(0.08),
  costRateMarketing: real("cost_rate_marketing").notNull().default(0.05),
  costRatePropertyOps: real("cost_rate_property_ops").notNull().default(0.04),
  costRateUtilities: real("cost_rate_utilities").notNull().default(0.05),
  costRateInsurance: real("cost_rate_insurance").notNull().default(0.02),
  costRateTaxes: real("cost_rate_taxes").notNull().default(0.03),
  costRateIT: real("cost_rate_it").notNull().default(0.02),
  costRateFFE: real("cost_rate_ffe").notNull().default(0.04),
  
  // Revenue Streams (as % of rooms revenue)
  revShareEvents: real("rev_share_events").notNull().default(0.43),
  revShareFB: real("rev_share_fb").notNull().default(0.22),
  revShareOther: real("rev_share_other").notNull().default(0.07),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const updatePropertySchema = insertPropertySchema.partial();

export const selectPropertySchema = createSelectSchema(properties);

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type UpdateProperty = z.infer<typeof updatePropertySchema>;
