import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, jsonb, boolean, index, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// --- USERS TABLE ---
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
  name: text("name"),
  company: text("company"),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = z.object({
  email: z.string(),
  passwordHash: z.string(),
  role: z.string().optional(),
  name: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
});

export const selectUserSchema = createSelectSchema(users);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// --- SESSIONS TABLE ---
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
]);

export type Session = typeof sessions.$inferSelect;

// --- GLOBAL ASSUMPTIONS TABLE ---
export const globalAssumptions = pgTable("global_assumptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  companyName: text("company_name").notNull().default("L+B Hospitality"),
  companyLogo: text("company_logo"),
  modelStartDate: text("model_start_date").notNull(),
  projectionYears: integer("projection_years").notNull().default(10),
  companyOpsStartDate: text("company_ops_start_date").notNull().default("2026-06-01"),
  fiscalYearStartMonth: integer("fiscal_year_start_month").notNull().default(1), // 1 = January, 4 = April, etc.
  inflationRate: real("inflation_rate").notNull(),
  fixedCostEscalationRate: real("fixed_cost_escalation_rate").notNull().default(0.03),
  
  // Revenue variables
  baseManagementFee: real("base_management_fee").notNull(),
  incentiveManagementFee: real("incentive_management_fee").notNull(),
  
  // SAFE Funding
  fundingSourceLabel: text("funding_source_label").notNull().default("SAFE"),
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
  
  // Staffing tiers - FTE headcount based on portfolio size
  staffTier1MaxProperties: integer("staff_tier1_max_properties").notNull().default(3),
  staffTier1Fte: real("staff_tier1_fte").notNull().default(2.5),
  staffTier2MaxProperties: integer("staff_tier2_max_properties").notNull().default(6),
  staffTier2Fte: real("staff_tier2_fte").notNull().default(4.5),
  staffTier3Fte: real("staff_tier3_fte").notNull().default(7.0),
  
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
  
  // Exit & Sale Assumptions (global defaults)
  exitCapRate: real("exit_cap_rate").notNull().default(0.085),
  salesCommissionRate: real("sales_commission_rate").notNull().default(0.05),
  
  // Expense Rates (applied to specific revenue streams)
  eventExpenseRate: real("event_expense_rate").notNull().default(0.65),
  otherExpenseRate: real("other_expense_rate").notNull().default(0.60),
  utilitiesVariableSplit: real("utilities_variable_split").notNull().default(0.60),
  
  // Boutique Hotel Definition
  boutiqueDefinition: jsonb("boutique_definition").notNull().default({
    minRooms: 10,
    maxRooms: 80,
    hasFB: true,
    hasEvents: true,
    hasWellness: true,
    minAdr: 150,
    maxAdr: 600,
    level: "luxury",
    eventLocations: 2,
    maxEventCapacity: 150,
    acreage: 10,
    privacyLevel: "high",
    parkingSpaces: 50,
    description: "Luxury boutique hotels on private estates of 10+ acres, catering to 100+ person exotic, unique, and corporate events in exclusive, secluded settings with full-service F&B, wellness programming, and curated guest experiences."
  }),
  
  // AI Research Settings
  preferredLlm: text("preferred_llm").notNull().default("claude-sonnet-4-5"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("global_assumptions_user_id_idx").on(table.userId),
]);

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
  }),
  boutiqueDefinition: z.object({
    minRooms: z.number(),
    maxRooms: z.number(),
    hasFB: z.boolean(),
    hasEvents: z.boolean(),
    hasWellness: z.boolean(),
    minAdr: z.number(),
    maxAdr: z.number(),
    level: z.enum(["budget", "average", "luxury"]).optional().default("luxury"),
    eventLocations: z.number().optional().default(2),
    maxEventCapacity: z.number().optional().default(150),
    acreage: z.number().optional().default(5),
    privacyLevel: z.enum(["low", "moderate", "high"]).optional().default("high"),
    parkingSpaces: z.number().optional().default(50),
    description: z.string()
  })
}).pick({
  userId: true,
  companyName: true,
  companyLogo: true,
  modelStartDate: true,
  projectionYears: true,
  companyOpsStartDate: true,
  fiscalYearStartMonth: true,
  inflationRate: true,
  fixedCostEscalationRate: true,
  baseManagementFee: true,
  incentiveManagementFee: true,
  safeTranche1Amount: true,
  safeTranche1Date: true,
  safeTranche2Amount: true,
  safeTranche2Date: true,
  safeValuationCap: true,
  safeDiscountRate: true,
  partnerCompYear1: true,
  partnerCompYear2: true,
  partnerCompYear3: true,
  partnerCompYear4: true,
  partnerCompYear5: true,
  partnerCompYear6: true,
  partnerCompYear7: true,
  partnerCompYear8: true,
  partnerCompYear9: true,
  partnerCompYear10: true,
  partnerCountYear1: true,
  partnerCountYear2: true,
  partnerCountYear3: true,
  partnerCountYear4: true,
  partnerCountYear5: true,
  partnerCountYear6: true,
  partnerCountYear7: true,
  partnerCountYear8: true,
  partnerCountYear9: true,
  partnerCountYear10: true,
  staffSalary: true,
  staffTier1MaxProperties: true,
  staffTier1Fte: true,
  staffTier2MaxProperties: true,
  staffTier2Fte: true,
  staffTier3Fte: true,
  officeLeaseStart: true,
  professionalServicesStart: true,
  techInfraStart: true,
  businessInsuranceStart: true,
  travelCostPerClient: true,
  itLicensePerClient: true,
  marketingRate: true,
  miscOpsRate: true,
  commissionRate: true,
  standardAcqPackage: true,
  debtAssumptions: true,
  fullCateringFBBoost: true,
  partialCateringFBBoost: true,
  companyTaxRate: true,
  exitCapRate: true,
  salesCommissionRate: true,
  eventExpenseRate: true,
  otherExpenseRate: true,
  utilitiesVariableSplit: true,
  boutiqueDefinition: true,
  preferredLlm: true,
});

export const selectGlobalAssumptionsSchema = createSelectSchema(globalAssumptions);

export type GlobalAssumptions = typeof globalAssumptions.$inferSelect;
export type InsertGlobalAssumptions = z.infer<typeof insertGlobalAssumptionsSchema>;

// --- PROPERTIES TABLE ---
export const properties = pgTable("properties", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
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
}, (table) => [
  index("properties_user_id_idx").on(table.userId),
]);

export const insertPropertySchema = createInsertSchema(properties).pick({
  userId: true,
  name: true,
  location: true,
  market: true,
  imageUrl: true,
  status: true,
  acquisitionDate: true,
  operationsStartDate: true,
  purchasePrice: true,
  buildingImprovements: true,
  preOpeningCosts: true,
  operatingReserve: true,
  roomCount: true,
  startAdr: true,
  adrGrowthRate: true,
  startOccupancy: true,
  maxOccupancy: true,
  occupancyRampMonths: true,
  occupancyGrowthStep: true,
  stabilizationMonths: true,
  type: true,
  cateringLevel: true,
  acquisitionLTV: true,
  acquisitionInterestRate: true,
  acquisitionTermYears: true,
  acquisitionClosingCostRate: true,
  willRefinance: true,
  refinanceDate: true,
  refinanceLTV: true,
  refinanceInterestRate: true,
  refinanceTermYears: true,
  refinanceClosingCostRate: true,
  costRateRooms: true,
  costRateFB: true,
  costRateAdmin: true,
  costRateMarketing: true,
  costRatePropertyOps: true,
  costRateUtilities: true,
  costRateInsurance: true,
  costRateTaxes: true,
  costRateIT: true,
  costRateFFE: true,
  costRateOther: true,
  revShareEvents: true,
  revShareFB: true,
  revShareOther: true,
  fullCateringPercent: true,
  partialCateringPercent: true,
  exitCapRate: true,
  taxRate: true,
});

export const updatePropertySchema = insertPropertySchema.partial();

export const selectPropertySchema = createSelectSchema(properties);

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type UpdateProperty = z.infer<typeof updatePropertySchema>;

// --- SCENARIOS TABLE ---
export const scenarios = pgTable("scenarios", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  globalAssumptions: jsonb("global_assumptions").notNull(),
  properties: jsonb("properties").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("scenarios_user_id_idx").on(table.userId),
]);

export const insertScenarioSchema = createInsertSchema(scenarios).pick({
  userId: true,
  name: true,
  description: true,
  globalAssumptions: true,
  properties: true,
});

export const updateScenarioSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});

export const selectScenarioSchema = createSelectSchema(scenarios);

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type UpdateScenario = z.infer<typeof updateScenarioSchema>;

// --- LOGIN LOGS TABLE ---
export const loginLogs = pgTable("login_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  loginAt: timestamp("login_at").defaultNow().notNull(),
  logoutAt: timestamp("logout_at"),
  sessionId: text("session_id").notNull(),
  ipAddress: text("ip_address"),
}, (table) => [
  index("login_logs_user_id_idx").on(table.userId),
  index("login_logs_session_id_idx").on(table.sessionId),
  index("login_logs_login_at_idx").on(table.loginAt),
]);

export const insertLoginLogSchema = createInsertSchema(loginLogs).omit({
  id: true,
  loginAt: true,
  logoutAt: true,
});

export type LoginLog = typeof loginLogs.$inferSelect;
export type InsertLoginLog = z.infer<typeof insertLoginLogSchema>;

// --- DESIGN THEMES TABLE ---
export const designThemes = pgTable("design_themes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  colors: jsonb("colors").notNull().$type<DesignColor[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("design_themes_is_active_idx").on(table.isActive),
]);

export interface DesignColor {
  rank: number;
  name: string;
  hexCode: string;
  description: string;
}

export const insertDesignThemeSchema = z.object({
  name: z.string(),
  description: z.string(),
  isActive: z.boolean().optional(),
  colors: z.array(z.object({
    rank: z.number(),
    name: z.string(),
    hexCode: z.string(),
    description: z.string(),
  })),
});

export type DesignTheme = typeof designThemes.$inferSelect;
export type InsertDesignTheme = z.infer<typeof insertDesignThemeSchema>;

// --- MARKET RESEARCH TABLE ---
export const marketResearch = pgTable("market_research", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // "property", "company", "global"
  propertyId: integer("property_id").references(() => properties.id),
  title: text("title").notNull(),
  content: jsonb("content").notNull().$type<Record<string, any>>(),
  llmModel: text("llm_model"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("market_research_user_id_idx").on(table.userId),
  index("market_research_type_idx").on(table.type),
  index("market_research_property_id_idx").on(table.propertyId),
]);

export const insertMarketResearchSchema = createInsertSchema(marketResearch).pick({
  userId: true,
  type: true,
  propertyId: true,
  title: true,
  content: true,
  llmModel: true,
});

export type MarketResearch = typeof marketResearch.$inferSelect;
export type InsertMarketResearch = z.infer<typeof insertMarketResearchSchema>;
