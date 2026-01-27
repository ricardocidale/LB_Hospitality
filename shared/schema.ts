import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// --- GLOBAL ASSUMPTIONS TABLE ---
export const globalAssumptions = pgTable("global_assumptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  modelStartDate: text("model_start_date").notNull(),
  companyOpsStartDate: text("company_ops_start_date").notNull().default("2026-06-01"),
  fiscalYearStartMonth: integer("fiscal_year_start_month").notNull().default(1), // 1 = January, 4 = April, etc.
  inflationRate: real("inflation_rate").notNull(),
  fixedCostEscalationRate: real("fixed_cost_escalation_rate").notNull().default(0.03),
  
  // Revenue variables
  baseManagementFee: real("base_management_fee").notNull(),
  incentiveManagementFee: real("incentive_management_fee").notNull(),
  
  // SAFE Funding
  safeTranche1Amount: real("safe_tranche1_amount").notNull().default(800000),
  safeTranche1Date: text("safe_tranche1_date").notNull().default("2026-06-01"),
  safeTranche2Amount: real("safe_tranche2_amount").notNull().default(800000),
  safeTranche2Date: text("safe_tranche2_date").notNull().default("2027-04-01"),
  safeValuationCap: real("safe_valuation_cap").notNull().default(2500000),
  safeDiscountRate: real("safe_discount_rate").notNull().default(0.20),
  
  // Cost variables - Compensation (yearly partner compensation and count)
  partnerCompYear1: real("partner_comp_year1").notNull().default(540000),
  partnerCompYear2: real("partner_comp_year2").notNull().default(540000),
  partnerCompYear3: real("partner_comp_year3").notNull().default(540000),
  partnerCompYear4: real("partner_comp_year4").notNull().default(600000),
  partnerCompYear5: real("partner_comp_year5").notNull().default(600000),
  partnerCompYear6: real("partner_comp_year6").notNull().default(700000),
  partnerCompYear7: real("partner_comp_year7").notNull().default(700000),
  partnerCompYear8: real("partner_comp_year8").notNull().default(800000),
  partnerCompYear9: real("partner_comp_year9").notNull().default(800000),
  partnerCompYear10: real("partner_comp_year10").notNull().default(900000),
  
  partnerCountYear1: integer("partner_count_year1").notNull().default(3),
  partnerCountYear2: integer("partner_count_year2").notNull().default(3),
  partnerCountYear3: integer("partner_count_year3").notNull().default(3),
  partnerCountYear4: integer("partner_count_year4").notNull().default(3),
  partnerCountYear5: integer("partner_count_year5").notNull().default(3),
  partnerCountYear6: integer("partner_count_year6").notNull().default(3),
  partnerCountYear7: integer("partner_count_year7").notNull().default(3),
  partnerCountYear8: integer("partner_count_year8").notNull().default(3),
  partnerCountYear9: integer("partner_count_year9").notNull().default(3),
  partnerCountYear10: integer("partner_count_year10").notNull().default(3),
  
  staffSalary: real("staff_salary").notNull(),
  
  // Cost variables - Fixed overhead
  officeLeaseStart: real("office_lease_start").notNull(),
  professionalServicesStart: real("professional_services_start").notNull(),
  techInfraStart: real("tech_infra_start").notNull(),
  businessInsuranceStart: real("business_insurance_start").notNull(),
  
  // Cost variables - Variable costs
  travelCostPerClient: real("travel_cost_per_client").notNull(),
  itLicensePerClient: real("it_license_per_client").notNull(),
  marketingRate: real("marketing_rate").notNull(),
  miscOpsRate: real("misc_ops_rate").notNull(),
  
  // Portfolio
  commissionRate: real("commission_rate").notNull().default(0.05),
  
  standardAcqPackage: jsonb("standard_acq_package").notNull(),
  debtAssumptions: jsonb("debt_assumptions").notNull(),
  
  // Catering Level F&B Boost Factors
  fullCateringFBBoost: real("full_catering_fb_boost").notNull().default(0.50),
  partialCateringFBBoost: real("partial_catering_fb_boost").notNull().default(0.25),
  
  // Tax Rate (for calculating after-tax company cash flow)
  companyTaxRate: real("company_tax_rate").notNull().default(0.30),
  
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
  costRateIT: real("cost_rate_it").notNull().default(0.005),
  costRateFFE: real("cost_rate_ffe").notNull().default(0.04),
  costRateOther: real("cost_rate_other").notNull().default(0.05),
  
  // Revenue Streams (as % of rooms revenue)
  revShareEvents: real("rev_share_events").notNull().default(0.43),
  revShareFB: real("rev_share_fb").notNull().default(0.22),
  revShareOther: real("rev_share_other").notNull().default(0.07),
  
  // Catering mix (% of events using each catering level)
  fullCateringPercent: real("full_catering_percent").notNull().default(0.40),
  partialCateringPercent: real("partial_catering_percent").notNull().default(0.30),
  
  // Exit Cap Rate (for property valuation)
  exitCapRate: real("exit_cap_rate").notNull().default(0.085),
  
  // Tax Rate (for calculating after-tax free cash flow)
  taxRate: real("tax_rate").notNull().default(0.25),
  
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
