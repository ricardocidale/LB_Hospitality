/**
 * shared/schema.ts — Database Schema & Type Definitions
 *
 * This file defines every PostgreSQL table in the system using Drizzle ORM.
 * It is the single source of truth for the data model — both the server and
 * client import types from here.
 *
 * Business context: This is a hospitality investment platform that models
 * boutique hotel portfolios. The schema supports:
 *   - Multi-user authentication with role-based access (admin, partner, checker, investor)
 *   - Portfolio of hotel properties with detailed financial assumptions
 *   - A management company that charges fees across properties
 *   - Scenario snapshots for what-if analysis
 *   - AI-generated market research
 *   - Design theming and white-label branding per user group
 *   - Full audit trail via activity logs and verification run history
 *
 * For each table, the file also exports:
 *   - An insert schema (Zod validation for creating new records)
 *   - TypeScript types for select (reading) and insert (writing)
 *
 * Column defaults reference constants from shared/constants.ts to ensure
 * consistency between the DB schema, the financial engine, and seed data.
 */
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, jsonb, boolean, index, serial, unique, check, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  DEFAULT_SAFE_VALUATION_CAP,
  DEFAULT_SAFE_DISCOUNT_RATE,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
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
  DEFAULT_COST_OF_EQUITY,
  DEFAULT_TAX_RATE,
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
  DEFAULT_LAND_VALUE_PERCENT,
  DEFAULT_COMMISSION_RATE,
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_SERVICE_MARKUP,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  DEFAULT_FIXED_COST_ESCALATION_RATE,
  DEFAULT_COMPANY_TAX_RATE,
  DEFAULT_PROJECTION_YEARS,
  DEFAULT_MARCELA_STABILITY,
  DEFAULT_MARCELA_SIMILARITY_BOOST,
  DEFAULT_MARCELA_MAX_TOKENS,
  DEFAULT_MARCELA_MAX_TOKENS_VOICE,
  DEFAULT_MARCELA_TURN_TIMEOUT,
  DEFAULT_MARCELA_SPEED,
  DEFAULT_MARCELA_STREAMING_LATENCY,
  DEFAULT_MARCELA_SILENCE_END_CALL_TIMEOUT,
  DEFAULT_MARCELA_MAX_DURATION,
  DEFAULT_MARCELA_CASCADE_TIMEOUT,
  DEFAULT_MAX_STALENESS_HOURS,
  DEFAULT_INFLATION_RATE,
  DEFAULT_AR_DAYS,
  DEFAULT_AP_DAYS,
  DEFAULT_REINVESTMENT_RATE,
  DEFAULT_COST_SEG_5YR_PCT,
  DEFAULT_COST_SEG_7YR_PCT,
  DEFAULT_COST_SEG_15YR_PCT,
  DEFAULT_ALERT_COOLDOWN_MINUTES,
  DEFAULT_AI_AGENT_VOICE_ID,
  DEFAULT_STAFF_TIER1_MAX_PROPERTIES,
  DEFAULT_STAFF_TIER2_MAX_PROPERTIES,
} from "./constants";

// --- COMPANIES TABLE ---
// Represents legal entities in the system. There are two types:
//   - "management": The hospitality management company that operates hotels
//   - "spv": Special Purpose Vehicle — a separate LLC created for each property
//     to isolate liability (standard practice in real estate private equity)
export const companies = pgTable("companies", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  type: text("type").notNull().default("spv"),
  description: text("description"),
  logoId: integer("logo_id").references(() => logos.id, { onDelete: "set null" }),
  themeId: integer("theme_id").references(() => designThemes.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCompanySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["management", "spv"]).optional().default("spv"),
  description: z.string().nullable().optional(),
  logoId: z.number().nullable().optional(),
  themeId: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

// --- LOGOS TABLE ---
// Stores company/brand logos for white-label presentation. Each logo has a
// companyName field so that the displayed brand name changes along with the logo.
// One logo is marked isDefault and used as the fallback when no group-specific logo exists.
export const logos = pgTable("logos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  companyName: text("company_name").notNull().default("Hospitality Business Group"),
  url: text("url").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLogoSchema = z.object({
  name: z.string(),
  companyName: z.string(),
  url: z.string(),
  isDefault: z.boolean().optional(),
});

export type Logo = typeof logos.$inferSelect;
export type InsertLogo = z.infer<typeof insertLogoSchema>;

// --- RESEARCH VALUE TYPES ---
// When AI research is generated for a property, the LLM produces numeric estimates
// (e.g. market ADR, RevPAR, cap rates) along with display labels. Each value tracks
// its source: "ai" (generated by LLM), "seed" (pre-populated defaults),
// "market" (live API data from FRED/BLS/etc.), or "none".
export const researchValueSourceEnum = z.enum(["ai", "seed", "market", "none"]);
export type ResearchValueSource = z.infer<typeof researchValueSourceEnum>;

export const researchValueEntrySchema = z.object({
  display: z.string(),
  mid: z.number(),
  source: researchValueSourceEnum,
  sourceName: z.string().optional(),   // e.g. "FRED SOFR", "HVS 2025", "AI Jan 2026"
  sourceDate: z.string().optional(),   // ISO date of when the data was published/fetched
});
export type ResearchValueEntry = z.infer<typeof researchValueEntrySchema>;

export const researchValueMapSchema = z.record(z.string(), researchValueEntrySchema);
export type ResearchValueMap = z.infer<typeof researchValueMapSchema>;

// --- ASSET DESCRIPTIONS TABLE ---
// Stores reusable descriptions of the target asset class (e.g., "Luxury Boutique Hotel
// on 10+ acres"). These descriptions are fed to the AI research engine so it generates
// market data relevant to the exact type of property the fund is targeting.
export const assetDescriptions = pgTable("asset_descriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssetDescriptionSchema = z.object({
  name: z.string(),
  isDefault: z.boolean().optional(),
});

export type AssetDescription = typeof assetDescriptions.$inferSelect;
export type InsertAssetDescription = z.infer<typeof insertAssetDescriptionSchema>;

// --- USER GROUPS TABLE ---
// Groups allow white-label branding per audience. Each group can have its own
// logo, color theme, and asset description. When a user belongs to a group,
// the UI renders that group's branding instead of the system default.
// Example: "Investor Portal" group sees a different logo than the internal team.
export const userGroups = pgTable("user_groups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  logoId: integer("logo_id").references(() => logos.id, { onDelete: "set null" }),
  themeId: integer("theme_id").references(() => designThemes.id, { onDelete: "set null" }),
  assetDescriptionId: integer("asset_description_id").references(() => assetDescriptions.id, { onDelete: "set null" }),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("user_groups_logo_id_idx").on(table.logoId),
  index("user_groups_theme_id_idx").on(table.themeId),
]);

export const insertUserGroupSchema = z.object({
  name: z.string().min(1),
  logoId: z.number().nullable().optional(),
  themeId: z.number().nullable().optional(),
  assetDescriptionId: z.number().nullable().optional(),
});

export type UserGroup = typeof userGroups.$inferSelect;
export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;

// --- USER GROUP PROPERTIES TABLE ---
// Controls which properties each user group can see. If a group has NO rows
// here, all properties are visible (safe default — backward compatible).
// If rows exist, only those property IDs are visible to the group's members.
// Admin users always bypass this filter.
export const userGroupProperties = pgTable("user_group_properties", {
  userGroupId: integer("user_group_id").notNull().references(() => userGroups.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.userGroupId, t.propertyId] })]);

// --- USERS TABLE ---
// Every person who can log in. Roles control what they can see and do:
//   - "admin": full access — manage users, properties, assumptions, run verifications
//   - "partner": management team — can edit properties and assumptions
//   - "checker": independent auditor — read-only access plus verification tools
//   - "investor": limited view — sees dashboard and reports but cannot edit
// Each user optionally belongs to a company (SPV) and a user group (branding).
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("partner"), // "admin", "partner", "checker", "investor"
  firstName: text("first_name"),
  lastName: text("last_name"),
  company: text("company"),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
  title: text("title"),
  userGroupId: integer("user_group_id").references(() => userGroups.id, { onDelete: "set null" }),
  selectedThemeId: integer("selected_theme_id").references(() => designThemes.id, { onDelete: "set null" }),
  phoneNumber: text("phone_number"),
  hideTourPrompt: boolean("hide_tour_prompt").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("users_company_id_idx").on(table.companyId),
  index("users_user_group_id_idx").on(table.userGroupId),
]);

export const VALID_USER_ROLES = ["admin", "partner", "checker", "investor"] as const;
export type UserRole = typeof VALID_USER_ROLES[number];

export const insertUserSchema = z.object({
  email: z.string(),
  passwordHash: z.string().nullable().optional(),
  role: z.enum(VALID_USER_ROLES).optional().default("partner"),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  companyId: z.number().nullable().optional(),
  title: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  userGroupId: z.number().nullable().optional(),
});

export const selectUserSchema = createSelectSchema(users);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// --- SESSIONS TABLE ---
// Cookie-based sessions for authentication. Each session has an expiration date;
// expired sessions are cleaned up hourly by the server. Deleting a session = logout.
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
]);

export type Session = typeof sessions.$inferSelect;

// --- GLOBAL ASSUMPTIONS TABLE ---
// The "Settings" page in the UI. Contains every system-wide financial assumption
// that drives the pro forma model — from management company compensation and
// overhead to funding instrument terms and debt assumptions.
//
// Key sections:
//   - Company identity (name, logo, property label)
//   - Model timeline (start date, projection years, fiscal year)
//   - Management fees (base % of revenue + incentive % of GOP)
//   - Funding instrument (tranche amounts, optional valuation cap, optional discount rate)
//   - Partner compensation (yearly salary schedule for up to 10 years)
//   - Staffing tiers (FTE headcount scales with portfolio size)
//   - Fixed overhead (office lease, professional services, tech, insurance)
//   - Variable costs (travel, IT licenses, marketing, misc ops)
//   - Debt assumptions (acquisition and refinance LTV, interest rate, etc.)
//   - Exit assumptions (cap rate, commission, tax rate)
//   - Feature toggles (which sidebar items and features are visible)
//
// Per-user: each user can have their own assumptions (for scenario isolation).
// If a user has no specific assumptions, the system falls back to the shared row.

// --- RESEARCH CONFIGURATION TYPES ---
// Stored as JSONB in global_assumptions.researchConfig.
// Controls per-event AI research behavior: which tools run, what context is injected.
export interface ResearchSourceEntry {
  id: string;
  url: string;
  label: string;
  category?: string;
  addedAt: string;
}

export interface ResearchEventConfig {
  enabled: boolean;               // whether this research type is active
  focusAreas: string[];           // injected into prompt as bulleted focus areas
  regions: string[];              // geographic scope guidance
  timeHorizon: string;            // e.g. "5-year", "10-year"
  customInstructions: string;     // free-text context appended to the system prompt
  customQuestions: string;        // specific questions the LLM must address
  enabledTools: string[];         // subset of tool names; empty array = all tools enabled
  refreshIntervalDays?: number;   // days before research is considered stale (default: 7)
  sources?: ResearchSourceEntry[]; // per-process source library
}

export interface AiModelEntry {
  id: string;
  label: string;
  provider: "openai" | "anthropic" | "google" | "xai" | "tesla" | "microsoft";
}

export type LlmMode = "dual" | "primary-only";
export type LlmVendor = "openai" | "anthropic" | "google" | "xai" | "tesla" | "microsoft";

export interface ResearchConfig {
  property?: Partial<ResearchEventConfig>;
  company?:  Partial<ResearchEventConfig>;
  global?:   Partial<ResearchEventConfig>;
  marketing?: Partial<ResearchEventConfig>;
  preferredLlm?: string;
  llmMode?: LlmMode;
  llmVendor?: LlmVendor;
  primaryLlm?: string;
  secondaryLlm?: string;
  customSources?: { name: string; url?: string; category: string }[];
  cachedModels?: AiModelEntry[];
  cachedModelsAt?: string;
}

export const globalAssumptions = pgTable("global_assumptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull().default("Hospitality Business"),
  companyLogo: text("company_logo"), // Legacy URL fallback — branding chain: companyLogoId FK → companyLogo URL → default asset
  companyLogoId: integer("company_logo_id").references(() => logos.id, { onDelete: "set null" }), // Preferred: normalized FK to logos table
  propertyLabel: text("property_label").notNull().default("Boutique Hotel"),
  assetDescription: text("asset_description"),
  assetLogoId: integer("asset_logo_id").references(() => logos.id, { onDelete: "set null" }),
  modelStartDate: text("model_start_date").notNull(),
  projectionYears: integer("projection_years").notNull().default(DEFAULT_PROJECTION_YEARS),
  companyOpsStartDate: text("company_ops_start_date").notNull().default("2026-06-01"),
  fiscalYearStartMonth: integer("fiscal_year_start_month").notNull().default(1), // 1 = January, 4 = April, etc.
  inflationRate: real("inflation_rate").notNull().default(DEFAULT_INFLATION_RATE),
  fixedCostEscalationRate: real("fixed_cost_escalation_rate").notNull().default(DEFAULT_FIXED_COST_ESCALATION_RATE),

  // Company-specific inflation rate (nullable — NULL means use global inflationRate)
  companyInflationRate: real("company_inflation_rate"),
  
  // Revenue variables
  baseManagementFee: real("base_management_fee").notNull(),
  incentiveManagementFee: real("incentive_management_fee").notNull(),
  
  // Funding Instrument (column names use 'safe_' prefix for DB compatibility — do not rename)
  fundingSourceLabel: text("funding_source_label").notNull().default("Funding Vehicle"),
  safeTranche1Amount: real("safe_tranche1_amount").notNull().default(800000),
  safeTranche1Date: text("safe_tranche1_date").notNull().default("2026-06-01"),
  safeTranche2Amount: real("safe_tranche2_amount").notNull().default(800000),
  safeTranche2Date: text("safe_tranche2_date").notNull().default("2027-04-01"),
  safeValuationCap: real("safe_valuation_cap").notNull().default(DEFAULT_SAFE_VALUATION_CAP),
  safeDiscountRate: real("safe_discount_rate").notNull().default(DEFAULT_SAFE_DISCOUNT_RATE),
  
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
  staffTier1MaxProperties: integer("staff_tier1_max_properties").notNull().default(DEFAULT_STAFF_TIER1_MAX_PROPERTIES),
  staffTier1Fte: real("staff_tier1_fte").notNull().default(2.5),
  staffTier2MaxProperties: integer("staff_tier2_max_properties").notNull().default(DEFAULT_STAFF_TIER2_MAX_PROPERTIES),
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
  
  // Portfolio — acquisition-side broker commission (applied during portfolio modeling)
  commissionRate: real("commission_rate").notNull().default(DEFAULT_COMMISSION_RATE),
  
  standardAcqPackage: jsonb("standard_acq_package").notNull(),
  debtAssumptions: jsonb("debt_assumptions").notNull(),
  
  
  // Tax Rate (for calculating after-tax company cash flow)
  companyTaxRate: real("company_tax_rate").notNull().default(DEFAULT_COMPANY_TAX_RATE),
  
  // WACC — Cost of Equity (user-provided, not CAPM-derived; default 18% for private hospitality)
  costOfEquity: real("cost_of_equity").notNull().default(DEFAULT_COST_OF_EQUITY),

  // Exit & Sale Assumptions (global defaults) — disposition-side broker commission (applied at property sale/exit)
  exitCapRate: real("exit_cap_rate").notNull().default(DEFAULT_EXIT_CAP_RATE),
  salesCommissionRate: real("sales_commission_rate").notNull().default(DEFAULT_COMMISSION_RATE), // Distinct from commissionRate: this is exit/sale, that is acquisition
  
  // Expense Rates (applied to specific revenue streams)
  eventExpenseRate: real("event_expense_rate").notNull().default(DEFAULT_EVENT_EXPENSE_RATE),
  otherExpenseRate: real("other_expense_rate").notNull().default(DEFAULT_OTHER_EXPENSE_RATE),
  utilitiesVariableSplit: real("utilities_variable_split").notNull().default(DEFAULT_UTILITIES_VARIABLE_SPLIT),
  
  // ICP Configuration — structured numeric/toggle parameters for Ideal Customer Profile
  icpConfig: jsonb("icp_config").$type<Record<string, any>>(),

  // Asset Definition
  assetDefinition: jsonb("asset_definition").notNull().default({
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

  // Management Company Contact & Identity
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  companyWebsite: text("company_website"),
  companyEin: text("company_ein"),
  companyFoundingYear: integer("company_founding_year"),

  // Management Company Location
  companyStreetAddress: text("company_street_address"),
  companyCity: text("company_city"),
  companyStateProvince: text("company_state_province"),
  companyCountry: text("company_country"),
  companyZipPostalCode: text("company_zip_postal_code"),

  // Display Settings
  showCompanyCalculationDetails: boolean("show_company_calculation_details").notNull().default(true),
  showPropertyCalculationDetails: boolean("show_property_calculation_details").notNull().default(true),

  // Sidebar Visibility (admin-controlled, applies to non-admin users)
  sidebarPropertyFinder: boolean("sidebar_property_finder").notNull().default(true),
  sidebarSensitivity: boolean("sidebar_sensitivity").notNull().default(true),
  sidebarFinancing: boolean("sidebar_financing").notNull().default(true),
  sidebarCompare: boolean("sidebar_compare").notNull().default(true),
  sidebarTimeline: boolean("sidebar_timeline").notNull().default(true),
  sidebarMapView: boolean("sidebar_map_view").notNull().default(false),
  sidebarExecutiveSummary: boolean("sidebar_executive_summary").notNull().default(true),
  sidebarScenarios: boolean("sidebar_scenarios").notNull().default(true),
  sidebarUserManual: boolean("sidebar_user_manual").notNull().default(true),
  sidebarResearch: boolean("sidebar_research").notNull().default(true),

  // Feature Toggles
  showAiAssistant: boolean("show_ai_assistant").notNull().default(false),
  
  // AI Agent Configuration
  aiAgentName: text("ai_agent_name").notNull().default("Marcela"),
  
  // ElevenLabs Conversational AI Agent
  marcelaAgentId: text("marcela_agent_id").notNull().default(""),
  
  // Marcela Voice Configuration (ElevenLabs)
  marcelaVoiceId: text("marcela_voice_id").notNull().default(DEFAULT_AI_AGENT_VOICE_ID),
  marcelaTtsModel: text("marcela_tts_model").notNull().default("eleven_flash_v2_5"),
  marcelaSttModel: text("marcela_stt_model").notNull().default("scribe_v1"),
  marcelaOutputFormat: text("marcela_output_format").notNull().default("pcm_16000"),
  marcelaStability: real("marcela_stability").notNull().default(DEFAULT_MARCELA_STABILITY),
  marcelaSimilarityBoost: real("marcela_similarity_boost").notNull().default(DEFAULT_MARCELA_SIMILARITY_BOOST),
  marcelaSpeakerBoost: boolean("marcela_speaker_boost").notNull().default(false),
  marcelaChunkSchedule: text("marcela_chunk_schedule").notNull().default("120,160,250,290"),
  marcelaLlmModel: text("marcela_llm_model").notNull().default("gemini-2.0-flash-lite"),
  marcelaMaxTokens: integer("marcela_max_tokens").notNull().default(DEFAULT_MARCELA_MAX_TOKENS),
  marcelaMaxTokensVoice: integer("marcela_max_tokens_voice").notNull().default(DEFAULT_MARCELA_MAX_TOKENS_VOICE),
  marcelaEnabled: boolean("marcela_enabled").notNull().default(true),

  marcelaTwilioEnabled: boolean("marcela_twilio_enabled").notNull().default(false),
  marcelaSmsEnabled: boolean("marcela_sms_enabled").notNull().default(false),
  marcelaPhoneGreeting: text("marcela_phone_greeting").notNull().default("Hello, this is Marcela from Hospitality Business Group. How can I help you today?"),
  marcelaLanguage: text("marcela_language").notNull().default("en"),
  marcelaTurnTimeout: integer("marcela_turn_timeout").notNull().default(DEFAULT_MARCELA_TURN_TIMEOUT),
  marcelaAvatarUrl: text("marcela_avatar_url").notNull().default(""),
  marcelaWidgetVariant: text("marcela_widget_variant").notNull().default("elevenlabs"),
  marcelaSpeed: real("marcela_speed").notNull().default(DEFAULT_MARCELA_SPEED),
  marcelaStreamingLatency: integer("marcela_streaming_latency").notNull().default(DEFAULT_MARCELA_STREAMING_LATENCY),
  marcelaTextNormalisation: text("marcela_text_normalisation").notNull().default("auto"),
  marcelaAsrProvider: text("marcela_asr_provider").notNull().default("scribe_realtime"),
  marcelaInputAudioFormat: text("marcela_input_audio_format").notNull().default("pcm_16000"),
  marcelaBackgroundVoiceDetection: boolean("marcela_background_voice_detection").notNull().default(true),
  marcelaTurnEagerness: text("marcela_turn_eagerness").notNull().default("auto"),
  marcelaSpellingPatience: text("marcela_spelling_patience").notNull().default("auto"),
  marcelaSpeculativeTurn: boolean("marcela_speculative_turn").notNull().default(true),
  marcelaSilenceEndCallTimeout: integer("marcela_silence_end_call_timeout").notNull().default(DEFAULT_MARCELA_SILENCE_END_CALL_TIMEOUT),
  marcelaMaxDuration: integer("marcela_max_duration").notNull().default(DEFAULT_MARCELA_MAX_DURATION),
  marcelaCascadeTimeout: integer("marcela_cascade_timeout").notNull().default(DEFAULT_MARCELA_CASCADE_TIMEOUT),

  // Rebecca — Gemini-powered text chatbot
  rebeccaEnabled: boolean("rebecca_enabled").notNull().default(false),
  rebeccaDisplayName: text("rebecca_display_name").notNull().default("Rebecca"),
  rebeccaSystemPrompt: text("rebecca_system_prompt"),

  // Research Configuration — per-event admin control over AI research behavior
  researchConfig: jsonb("research_config").$type<ResearchConfig>().default({}),

  lastFullResearchRefresh: timestamp("last_full_research_refresh"),

  autoResearchRefreshEnabled: boolean("auto_research_refresh_enabled").notNull().default(false),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("global_assumptions_user_id_idx").on(table.userId),
  check("ga_projection_years_range", sql`${table.projectionYears} >= 1 AND ${table.projectionYears} <= 30`),
  check("ga_inflation_rate_range", sql`${table.inflationRate} >= 0 AND ${table.inflationRate} <= 1`),
  check("ga_base_mgmt_fee_range", sql`${table.baseManagementFee} >= 0 AND ${table.baseManagementFee} <= 1`),
  check("ga_incentive_mgmt_fee_range", sql`${table.incentiveManagementFee} >= 0 AND ${table.incentiveManagementFee} <= 1`),
  check("ga_commission_rate_range", sql`${table.commissionRate} >= 0 AND ${table.commissionRate} <= 1`),
  check("ga_company_tax_rate_range", sql`${table.companyTaxRate} >= 0 AND ${table.companyTaxRate} <= 1`),
  check("ga_exit_cap_rate_range", sql`${table.exitCapRate} > 0 AND ${table.exitCapRate} <= 1`),
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
  assetDefinition: z.object({
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
  }).optional()
}).pick({
  userId: true,
  companyName: true,
  companyLogo: true,
  companyLogoId: true,
  companyPhone: true,
  companyEmail: true,
  companyWebsite: true,
  companyEin: true,
  companyFoundingYear: true,
  companyStreetAddress: true,
  companyCity: true,
  companyStateProvince: true,
  companyCountry: true,
  companyZipPostalCode: true,
  propertyLabel: true,
  assetDescription: true,
  assetLogoId: true,
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
  companyTaxRate: true,
  costOfEquity: true,
  exitCapRate: true,
  salesCommissionRate: true,
  eventExpenseRate: true,
  otherExpenseRate: true,
  utilitiesVariableSplit: true,
  icpConfig: true,
  assetDefinition: true,
  preferredLlm: true,
  sidebarPropertyFinder: true,
  sidebarSensitivity: true,
  sidebarFinancing: true,
  sidebarCompare: true,
  sidebarTimeline: true,
  sidebarMapView: true,
  sidebarExecutiveSummary: true,
  sidebarScenarios: true,
  sidebarUserManual: true,
  showAiAssistant: true,
  aiAgentName: true,
  marcelaAgentId: true,
  marcelaVoiceId: true,
  marcelaTtsModel: true,
  marcelaSttModel: true,
  marcelaOutputFormat: true,
  marcelaStability: true,
  marcelaSimilarityBoost: true,
  marcelaSpeakerBoost: true,
  marcelaChunkSchedule: true,
  marcelaLlmModel: true,
  marcelaMaxTokens: true,
  marcelaMaxTokensVoice: true,
  marcelaEnabled: true,
  marcelaTwilioEnabled: true,
  marcelaSmsEnabled: true,
  marcelaPhoneGreeting: true,
  marcelaLanguage: true,
  marcelaTurnTimeout: true,
  marcelaAvatarUrl: true,
  marcelaWidgetVariant: true,
  marcelaSpeed: true,
  marcelaStreamingLatency: true,
  marcelaTextNormalisation: true,
  marcelaAsrProvider: true,
  marcelaInputAudioFormat: true,
  marcelaBackgroundVoiceDetection: true,
  marcelaTurnEagerness: true,
  marcelaSpellingPatience: true,
  marcelaSpeculativeTurn: true,
  marcelaSilenceEndCallTimeout: true,
  marcelaMaxDuration: true,
  marcelaCascadeTimeout: true,
  rebeccaEnabled: true,
  rebeccaDisplayName: true,
  rebeccaSystemPrompt: true,
  researchConfig: true,
  autoResearchRefreshEnabled: true,
  companyInflationRate: true,
  fundingSourceLabel: true,
  showCompanyCalculationDetails: true,
  showPropertyCalculationDetails: true,
  sidebarResearch: true,
  lastFullResearchRefresh: true,
});

export const selectGlobalAssumptionsSchema = createSelectSchema(globalAssumptions);

export type GlobalAssumptions = typeof globalAssumptions.$inferSelect;
export type InsertGlobalAssumptions = z.infer<typeof insertGlobalAssumptionsSchema>;

// --- PROPERTIES TABLE ---
// Each row represents a single hotel property in the portfolio. This is the most
// data-rich table — it contains everything needed to generate a complete monthly
// pro forma: acquisition costs, revenue assumptions, operating cost rates,
// financing terms, and exit/disposition parameters.
//
// Key financial concepts:
//   - ADR (Average Daily Rate): price per room per night
//   - Occupancy: percentage of available rooms sold (starts low, ramps up)
//   - RevPAR: Revenue Per Available Room = ADR × Occupancy
//   - NOI (Net Operating Income): Total Revenue − Operating Expenses
//   - Cap Rate: NOI / Property Value (used to compute exit price)
//   - LTV (Loan-to-Value): percentage of property value financed by debt
//
// The "type" field determines the capital structure:
//   - "Full Equity": purchased entirely with cash
//   - "Financed": purchased with a mortgage (acquisitionLTV, interest rate, etc.)
// The "willRefinance" field enables a refinance event where existing debt is
// replaced with new debt, potentially pulling equity out of the property.
export const properties = pgTable("properties", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location").notNull(),
  streetAddress: text("street_address"),
  city: text("city"),
  stateProvince: text("state_province"),
  zipPostalCode: text("zip_postal_code"),
  country: text("country"),
  market: text("market").notNull(),
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("Pipeline"),
  
  acquisitionDate: text("acquisition_date").notNull(),
  operationsStartDate: text("operations_start_date").notNull(),
  
  purchasePrice: real("purchase_price").notNull(),
  buildingImprovements: real("building_improvements").notNull(),
  landValuePercent: real("land_value_percent").notNull().default(DEFAULT_LAND_VALUE_PERCENT),
  preOpeningCosts: real("pre_opening_costs").notNull(),
  operatingReserve: real("operating_reserve").notNull(),
  
  roomCount: integer("room_count").notNull(),
  startAdr: real("start_adr").notNull(),
  adrGrowthRate: real("adr_growth_rate").notNull(),
  startOccupancy: real("start_occupancy").notNull(),
  maxOccupancy: real("max_occupancy").notNull(),
  occupancyRampMonths: integer("occupancy_ramp_months").notNull(),
  occupancyGrowthStep: real("occupancy_growth_step").notNull(),
  stabilizationMonths: integer("stabilization_months").notNull().default(36),
  
  type: text("type").notNull(),
  
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
  costRateRooms: real("cost_rate_rooms").notNull().default(DEFAULT_COST_RATE_ROOMS),
  costRateFB: real("cost_rate_fb").notNull().default(DEFAULT_COST_RATE_FB),
  costRateAdmin: real("cost_rate_admin").notNull().default(DEFAULT_COST_RATE_ADMIN),
  costRateMarketing: real("cost_rate_marketing").notNull().default(DEFAULT_COST_RATE_MARKETING),
  costRatePropertyOps: real("cost_rate_property_ops").notNull().default(DEFAULT_COST_RATE_PROPERTY_OPS),
  costRateUtilities: real("cost_rate_utilities").notNull().default(DEFAULT_COST_RATE_UTILITIES),
  costRateInsurance: real("cost_rate_insurance").notNull().default(DEFAULT_COST_RATE_INSURANCE),
  costRateTaxes: real("cost_rate_taxes").notNull().default(DEFAULT_COST_RATE_TAXES),
  costRateIT: real("cost_rate_it").notNull().default(DEFAULT_COST_RATE_IT),
  costRateFFE: real("cost_rate_ffe").notNull().default(DEFAULT_COST_RATE_FFE),
  costRateOther: real("cost_rate_other").notNull().default(DEFAULT_COST_RATE_OTHER),
  
  // Revenue Streams (as % of room revenue)
  revShareEvents: real("rev_share_events").notNull().default(DEFAULT_REV_SHARE_EVENTS),
  revShareFB: real("rev_share_fb").notNull().default(DEFAULT_REV_SHARE_FB),
  revShareOther: real("rev_share_other").notNull().default(DEFAULT_REV_SHARE_OTHER),
  
  // Catering boost (percentage uplift applied to F&B revenue)
  cateringBoostPercent: real("catering_boost_percent").notNull().default(DEFAULT_CATERING_BOOST_PCT),
  
  // Exit Cap Rate (for property valuation)
  exitCapRate: real("exit_cap_rate").notNull().default(DEFAULT_EXIT_CAP_RATE),
  
  // Tax Rate (for calculating after-tax free cash flow)
  taxRate: real("tax_rate").notNull().default(DEFAULT_TAX_RATE),

  // Per-property inflation rate (nullable — NULL means use global default)
  inflationRate: real("inflation_rate"),
  
  // Disposition (per-property sale commission)
  dispositionCommission: real("disposition_commission").notNull().default(DEFAULT_COMMISSION_RATE),

  // Refinance years after acquisition (when refinancing should occur)
  refinanceYearsAfterAcquisition: integer("refinance_years_after_acquisition"),

  // Management Company Fee Rates (per-property, charged by management company)
  baseManagementFeeRate: real("base_management_fee_rate").notNull().default(DEFAULT_BASE_MANAGEMENT_FEE_RATE),
  incentiveManagementFeeRate: real("incentive_management_fee_rate").notNull().default(DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE),

  // Working capital
  arDays: integer("ar_days").default(DEFAULT_AR_DAYS),
  apDays: integer("ap_days").default(DEFAULT_AP_DAYS),

  // MIRR
  reinvestmentRate: real("reinvestment_rate").default(DEFAULT_REINVESTMENT_RATE),

  // Day-count convention
  dayCountConvention: text("day_count_convention").default('30/360'),

  // Escalation method
  escalationMethod: text("escalation_method").default('annual'),

  // Cost segregation
  costSegEnabled: boolean("cost_seg_enabled").default(false),
  costSeg5yrPct: real("cost_seg_5yr_pct").default(DEFAULT_COST_SEG_5YR_PCT),
  costSeg7yrPct: real("cost_seg_7yr_pct").default(DEFAULT_COST_SEG_7YR_PCT),
  costSeg15yrPct: real("cost_seg_15yr_pct").default(DEFAULT_COST_SEG_15YR_PCT),

  description: text("description"),

  latitude: real("latitude"),
  longitude: real("longitude"),

  researchValues: jsonb("research_values").$type<Record<string, ResearchValueEntry>>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("properties_user_id_idx").on(table.userId),
  check("prop_room_count_positive", sql`${table.roomCount} > 0`),
  check("prop_start_adr_positive", sql`${table.startAdr} > 0`),
  check("prop_start_occupancy_range", sql`${table.startOccupancy} >= 0 AND ${table.startOccupancy} <= 1`),
  check("prop_max_occupancy_range", sql`${table.maxOccupancy} >= 0 AND ${table.maxOccupancy} <= 1`),
  check("prop_occupancy_growth_range", sql`${table.occupancyGrowthStep} >= 0 AND ${table.occupancyGrowthStep} <= 1`),
  check("prop_tax_rate_range", sql`${table.taxRate} >= 0 AND ${table.taxRate} <= 1`),
  check("prop_exit_cap_rate_range", sql`${table.exitCapRate} > 0 AND ${table.exitCapRate} <= 1`),
  check("prop_base_mgmt_fee_range", sql`${table.baseManagementFeeRate} >= 0 AND ${table.baseManagementFeeRate} <= 1`),
  check("prop_incentive_mgmt_fee_range", sql`${table.incentiveManagementFeeRate} >= 0 AND ${table.incentiveManagementFeeRate} <= 1`),
]);

export const insertPropertySchema = createInsertSchema(properties).pick({
  userId: true,
  name: true,
  location: true,
  streetAddress: true,
  city: true,
  stateProvince: true,
  zipPostalCode: true,
  country: true,
  market: true,
  imageUrl: true,
  status: true,
  acquisitionDate: true,
  operationsStartDate: true,
  purchasePrice: true,
  buildingImprovements: true,
  landValuePercent: true,
  preOpeningCosts: true,
  operatingReserve: true,
  roomCount: true,
  startAdr: true,
  adrGrowthRate: true,
  startOccupancy: true,
  maxOccupancy: true,
  occupancyRampMonths: true,
  occupancyGrowthStep: true,
  type: true,
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
  cateringBoostPercent: true,
  exitCapRate: true,
  taxRate: true,
  dispositionCommission: true,
  refinanceYearsAfterAcquisition: true,
  baseManagementFeeRate: true,
  incentiveManagementFeeRate: true,
  arDays: true,
  apDays: true,
  reinvestmentRate: true,
  dayCountConvention: true,
  escalationMethod: true,
  costSegEnabled: true,
  costSeg5yrPct: true,
  costSeg7yrPct: true,
  costSeg15yrPct: true,
  description: true,
  latitude: true,
  longitude: true,
  researchValues: true,
});

export const updatePropertySchema = insertPropertySchema.partial();

export const selectPropertySchema = createSelectSchema(properties);

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type UpdateProperty = z.infer<typeof updatePropertySchema>;

// --- COMPANY SERVICE TEMPLATES TABLE ---
// Company-level templates defining which services the management company provides
// to properties. Each template has a service model (centralized or direct) and a
// cost-plus markup percentage. These templates are the source of truth for:
//   1. Seeding new property_fee_categories when a property is created
//   2. Determining the company's cost-of-service in generateCompanyProForma()
// Admin can add/remove categories from the Admin > Centralized Services tab.
export const companyServiceTemplates = pgTable("company_service_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  defaultRate: real("default_rate").notNull().default(0),
  serviceModel: text("service_model").notNull().default('centralized'),
  serviceMarkup: real("service_markup").notNull().default(DEFAULT_SERVICE_MARKUP),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  check("service_template_rate_range", sql`${table.defaultRate} >= 0 AND ${table.defaultRate} <= 1`),
  check("service_template_markup_range", sql`${table.serviceMarkup} >= 0 AND ${table.serviceMarkup} <= 1`),
  check("service_template_model_check", sql`${table.serviceModel} IN ('centralized', 'direct')`),
]);

export const insertServiceTemplateSchema = createInsertSchema(companyServiceTemplates).pick({
  name: true,
  defaultRate: true,
  serviceModel: true,
  serviceMarkup: true,
  isActive: true,
  sortOrder: true,
});

export const updateServiceTemplateSchema = z.object({
  name: z.string().optional(),
  defaultRate: z.number().min(0).max(1).optional(),
  serviceModel: z.enum(['centralized', 'direct']).optional(),
  serviceMarkup: z.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export type ServiceTemplate = typeof companyServiceTemplates.$inferSelect;
export type InsertServiceTemplate = z.infer<typeof insertServiceTemplateSchema>;
export type UpdateServiceTemplate = z.infer<typeof updateServiceTemplateSchema>;

// --- PROPERTY FEE CATEGORIES TABLE ---
// Granular breakdown of the management company's base fee for each property.
// Instead of a single 8.5% base fee, each property can itemize fees by service
// (Marketing, IT, Accounting, Reservations, General Management). The sum of
// all active category rates should approximate the base management fee rate.
// Auto-seeded with DEFAULT_SERVICE_FEE_CATEGORIES when a property is first created.
export const propertyFeeCategories = pgTable("property_fee_categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  rate: real("rate").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("fee_categories_property_id_idx").on(table.propertyId),
  check("fee_cat_rate_range", sql`${table.rate} >= 0 AND ${table.rate} <= 1`),
]);

export const insertFeeCategorySchema = createInsertSchema(propertyFeeCategories).pick({
  propertyId: true,
  name: true,
  rate: true,
  isActive: true,
  sortOrder: true,
});

export const updateFeeCategorySchema = z.object({
  name: z.string().optional(),
  rate: z.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export type FeeCategory = typeof propertyFeeCategories.$inferSelect;
export type InsertFeeCategory = z.infer<typeof insertFeeCategorySchema>;
export type UpdateFeeCategory = z.infer<typeof updateFeeCategorySchema>;

// --- PROPERTY PHOTOS TABLE ---
// Each property can have multiple photos stored in an album. One photo is marked
// as the "hero" (isHero=true) and its URL is synced to properties.imageUrl for
// backward compatibility with all existing display locations and exports.
export const propertyPhotos = pgTable("property_photos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  isHero: boolean("is_hero").notNull().default(false),
  variants: jsonb("variants").$type<{
    thumb?: string;
    card?: string;
    hero?: string;
    full?: string;
    original?: string;
  }>(),
  generationStyle: text("generation_style"),
  beforePhotoId: integer("before_photo_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("property_photos_property_id_idx").on(table.propertyId),
]);

export const insertPropertyPhotoSchema = createInsertSchema(propertyPhotos).pick({
  propertyId: true,
  imageUrl: true,
  caption: true,
  sortOrder: true,
  isHero: true,
  variants: true,
  generationStyle: true,
  beforePhotoId: true,
});

export const updatePropertyPhotoSchema = z.object({
  caption: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isHero: z.boolean().optional(),
  variants: z.object({
    thumb: z.string().optional(),
    card: z.string().optional(),
    hero: z.string().optional(),
    full: z.string().optional(),
    original: z.string().optional(),
  }).nullable().optional(),
});

export type PropertyPhoto = typeof propertyPhotos.$inferSelect;
export type InsertPropertyPhoto = z.infer<typeof insertPropertyPhotoSchema>;
export type UpdatePropertyPhoto = z.infer<typeof updatePropertyPhotoSchema>;

// --- SCENARIOS TABLE ---
// A scenario is a complete snapshot of the financial model at a point in time.
// It captures the global assumptions, all properties (with their individual
// overrides), property images, and fee categories. Users can create multiple
// scenarios to compare "what-if" analyses (e.g., "Base", "Aggressive Growth",
// "Conservative Exit"). Loading a scenario replaces the user's current working
// data with the snapshot. The "Base" scenario is auto-created and cannot be deleted.
export const scenarios = pgTable("scenarios", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  globalAssumptions: jsonb("global_assumptions").notNull(),
  properties: jsonb("properties").notNull(),
  scenarioImages: jsonb("scenario_images"),
  feeCategories: jsonb("fee_categories"),
  propertyPhotos: jsonb("property_photos"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("scenarios_user_id_idx").on(table.userId),
  unique("scenarios_user_id_name").on(table.userId, table.name),
]);

export const insertScenarioSchema = createInsertSchema(scenarios).pick({
  userId: true,
  name: true,
  description: true,
  globalAssumptions: true,
  properties: true,
  scenarioImages: true,
  feeCategories: true,
  propertyPhotos: true,
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
// Audit trail of every login/logout event. Tracks session ID, IP address,
// and timestamps. Used by the admin panel to monitor access patterns and
// for security review. Records are retained for 90 days (queried with a
// 90-day lookback in storage.getLoginLogs).
export const loginLogs = pgTable("login_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
// Color themes for the UI. Each theme has an ordered list of named colors
// (primary, secondary, accent, etc.) that the frontend applies as CSS variables.
// One theme is marked isDefault and used when no user/group preference exists.
// Admins can create, edit, and delete themes via the admin panel.
export const designThemes = pgTable("design_themes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  colors: jsonb("colors").notNull().$type<DesignColor[]>(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export interface DesignColor {
  rank: number;
  name: string;
  hexCode: string;
  description: string;
}

export const insertDesignThemeSchema = z.object({
  name: z.string(),
  description: z.string(),
  colors: z.array(z.object({
    rank: z.number(),
    name: z.string(),
    hexCode: z.string(),
    description: z.string(),
  })),
  isDefault: z.boolean().optional(),
});

export type DesignTheme = typeof designThemes.$inferSelect;
export type InsertDesignTheme = z.infer<typeof insertDesignThemeSchema>;

// --- MARKET RESEARCH TABLE ---
// Stores AI-generated market research reports. Three types:
//   - "property": research specific to one hotel (comp set, local market data)
//   - "company": research about the management company's positioning
//   - "global": industry-wide trends and benchmarks
// The content JSONB holds the structured research output from the LLM.
// promptConditions records what inputs were sent to the AI for reproducibility.
export const marketResearch = pgTable("market_research", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "property", "company", "global"
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: jsonb("content").notNull().$type<Record<string, any>>(),
  promptConditions: jsonb("prompt_conditions").$type<Record<string, any>>(),
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
  promptConditions: true,
  llmModel: true,
});

export type MarketResearch = typeof marketResearch.$inferSelect;
export type InsertMarketResearch = z.infer<typeof insertMarketResearchSchema>;

// --- PROSPECTIVE PROPERTIES TABLE ---
// Properties found via the Property Finder (external real estate search API)
// that a user has "favorited" for further evaluation. These are not yet part
// of the portfolio — they're candidates. Each has an externalId from the
// listing source (e.g., Realtor.com property ID) and optional user notes.
// Unique constraint prevents saving the same listing twice per user.
export const prospectiveProperties = pgTable("prospective_properties", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  externalId: text("external_id").notNull(),
  source: text("source").notNull().default("realty-in-us"),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  price: real("price"),
  beds: integer("beds"),
  baths: real("baths"),
  sqft: real("sqft"),
  lotSizeAcres: real("lot_size_acres"),
  propertyType: text("property_type"),
  imageUrl: text("image_url"),
  listingUrl: text("listing_url"),
  notes: text("notes"),
  rawData: jsonb("raw_data").$type<Record<string, any>>(),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
}, (table) => [
  index("prospective_props_user_id_idx").on(table.userId),
  index("prospective_props_external_id_idx").on(table.externalId),
  unique("prospective_props_user_external_source").on(table.userId, table.externalId, table.source),
]);

export const insertProspectivePropertySchema = z.object({
  userId: z.number(),
  externalId: z.string(),
  source: z.string().optional(),
  address: z.string(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  beds: z.number().nullable().optional(),
  baths: z.number().nullable().optional(),
  sqft: z.number().nullable().optional(),
  lotSizeAcres: z.number().nullable().optional(),
  propertyType: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  listingUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  rawData: z.record(z.any()).nullable().optional(),
});

export type ProspectiveProperty = typeof prospectiveProperties.$inferSelect;
export type InsertProspectiveProperty = z.infer<typeof insertProspectivePropertySchema>;

// --- SAVED SEARCHES TABLE ---
// Persists a user's property search criteria (location, price range, beds, lot size)
// so they can quickly re-run frequent searches in the Property Finder.
export const savedSearches = pgTable("saved_searches", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location").notNull(),
  priceMin: text("price_min"),
  priceMax: text("price_max"),
  bedsMin: text("beds_min"),
  lotSizeMin: text("lot_size_min"),
  propertyType: text("property_type"),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
}, (table) => [
  index("saved_searches_user_id_idx").on(table.userId),
]);

export const insertSavedSearchSchema = z.object({
  userId: z.number(),
  name: z.string().min(1),
  location: z.string().min(1),
  priceMin: z.string().nullable().optional(),
  priceMax: z.string().nullable().optional(),
  bedsMin: z.string().nullable().optional(),
  lotSizeMin: z.string().nullable().optional(),
  propertyType: z.string().nullable().optional(),
});

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;

// --- ACTIVITY LOGS TABLE ---
// Tracks all user actions across the system: property CRUD, assumption changes,
// scenario operations, verification runs, user management, and image generation.
// This is the core audit trail for the operational layer.
export const activityLogs = pgTable("activity_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  /** Action performed: create, update, delete, load, save, run, export */
  action: text("action").notNull(),
  /** Entity type affected: property, scenario, global_assumptions, user, verification, image */
  entityType: text("entity_type").notNull(),
  /** ID of the affected entity (nullable for global operations like verification runs) */
  entityId: integer("entity_id"),
  /** Human-readable name of the entity (e.g. "The Hudson Estate", "Base scenario") */
  entityName: text("entity_name"),
  /** Additional context: changed fields, old/new values, audit metadata */
  metadata: jsonb("metadata"),
  /** Client IP address at time of action */
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("activity_logs_user_id_created_at_idx").on(table.userId, table.createdAt),
  index("activity_logs_entity_type_entity_id_idx").on(table.entityType, table.entityId),
]);

export const insertActivityLogSchema = z.object({
  userId: z.number(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.number().nullable().optional(),
  entityName: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// --- VERIFICATION RUNS TABLE ---
// Persists the results of each independent financial verification run.
// Enables verification history, trend tracking, and audit compliance.
// Results JSONB stores the full check array from calculationChecker.ts.
export const verificationRuns = pgTable("verification_runs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  /** Total number of checks executed */
  totalChecks: integer("total_checks").notNull(),
  /** Number of checks that passed */
  passed: integer("passed").notNull(),
  /** Number of checks that failed */
  failed: integer("failed").notNull(),
  /** Audit opinion: UNQUALIFIED (clean), QUALIFIED (minor issues), ADVERSE (critical) */
  auditOpinion: text("audit_opinion").notNull(),
  /** Overall status: PASS, WARNING, or FAIL */
  overallStatus: text("overall_status").notNull(),
  /** Full verification results (property results, company checks, consolidated checks) */
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("verification_runs_user_id_idx").on(table.userId),
  index("verification_runs_created_at_idx").on(table.createdAt),
]);

// --- CHAT TABLES ---
// Supports the AI chat assistant feature. Conversations hold a thread of messages
// between the user and the AI. This is standard chat persistence boilerplate.
export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  channel: text("channel").notNull().default("web"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("conversations_user_id_idx").on(table.userId),
]);

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("messages_conversation_id_idx").on(table.conversationId),
]);

export const insertVerificationRunSchema = z.object({
  userId: z.number(),
  totalChecks: z.number(),
  passed: z.number(),
  failed: z.number(),
  auditOpinion: z.string(),
  overallStatus: z.string(),
  results: z.any(),
});

export type VerificationRun = typeof verificationRuns.$inferSelect;
export type InsertVerificationRun = z.infer<typeof insertVerificationRunSchema>;

// --- RESEARCH QUESTIONS TABLE ---
// Admin-defined questions that get injected into every AI research prompt.
// This lets the team customize what the AI focuses on without editing code.
// Questions are sorted by sortOrder and appended to the user's custom questions.
export const researchQuestions = pgTable("research_questions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  question: text("question").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResearchQuestionSchema = z.object({
  question: z.string().min(1),
  sortOrder: z.number().optional(),
});

export type ResearchQuestion = typeof researchQuestions.$inferSelect;
export type InsertResearchQuestion = z.infer<typeof insertResearchQuestionSchema>;

// --- MARKET RATES TABLE ---
// Stores live economic/financial rates fetched from external APIs (FRED, BLS,
// Frankfurter) or manually entered by an admin. Each rate has a staleness
// threshold; the background refresh loop only re-fetches when the rate exceeds it.
export const marketRates = pgTable("market_rates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  rateKey: text("rate_key").notNull().unique(),
  value: real("value"),
  displayValue: text("display_value"),
  source: text("source").notNull(),          // 'fred', 'bls', 'frankfurter', 'admin_manual'
  sourceUrl: text("source_url"),
  seriesId: text("series_id"),               // e.g. FRED series 'FEDFUNDS'
  publishedAt: timestamp("published_at"),
  fetchedAt: timestamp("fetched_at"),
  isManual: boolean("is_manual").notNull().default(false),
  manualNote: text("manual_note"),
  maxStalenessHours: integer("max_staleness_hours").notNull().default(DEFAULT_MAX_STALENESS_HOURS),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMarketRateSchema = z.object({
  rateKey: z.string().min(1),
  value: z.number().nullable().optional(),
  displayValue: z.string().nullable().optional(),
  source: z.string().min(1),
  sourceUrl: z.string().nullable().optional(),
  seriesId: z.string().nullable().optional(),
  publishedAt: z.date().nullable().optional(),
  fetchedAt: z.date().nullable().optional(),
  isManual: z.boolean().optional(),
  manualNote: z.string().nullable().optional(),
  maxStalenessHours: z.number().optional(),
});

export type MarketRate = typeof marketRates.$inferSelect;
export type InsertMarketRate = z.infer<typeof insertMarketRateSchema>;

// --- NOTIFICATION EVENT TYPES ---
export const NOTIFICATION_EVENT_TYPES = [
  "DSCR_BREACH",
  "RESEARCH_COMPLETE",
  "REPORT_SHARED",
  "PROPERTY_IMPORTED",
  "CHECKER_FAILURE",
  "OCCUPANCY_BREACH",
  "CAP_RATE_BREACH",
  "NOI_VARIANCE_BREACH",
] as const;
export type NotificationEventType = typeof NOTIFICATION_EVENT_TYPES[number];

export const NOTIFICATION_CHANNELS = ["email", "slack"] as const;
export type NotificationChannel = typeof NOTIFICATION_CHANNELS[number];

export const ALERT_OPERATORS = ["<", ">", "=", "!="] as const;
export type AlertOperator = typeof ALERT_OPERATORS[number];

export const ALERT_METRICS = ["dscr", "cap_rate", "occupancy", "noi_variance"] as const;
export type AlertMetric = typeof ALERT_METRICS[number];

export const ALERT_SCOPES = ["all", "specific", "portfolio"] as const;
export type AlertScope = typeof ALERT_SCOPES[number];

// --- ALERT RULES TABLE ---
export const alertRules = pgTable("alert_rules", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  metric: text("metric").notNull(),
  operator: text("operator").notNull(),
  threshold: real("threshold").notNull(),
  scope: text("scope").notNull().default("all"),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  cooldownMinutes: integer("cooldown_minutes").notNull().default(DEFAULT_ALERT_COOLDOWN_MINUTES),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("alert_rules_property_id_idx").on(table.propertyId),
]);

export const insertAlertRuleSchema = z.object({
  name: z.string().min(1),
  metric: z.enum(ALERT_METRICS),
  operator: z.enum(ALERT_OPERATORS),
  threshold: z.number(),
  scope: z.enum(ALERT_SCOPES).optional().default("all"),
  propertyId: z.number().nullable().optional(),
  cooldownMinutes: z.number().optional().default(DEFAULT_ALERT_COOLDOWN_MINUTES),
  isActive: z.boolean().optional().default(true),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;

// --- NOTIFICATION LOGS TABLE ---
export const notificationLogs = pgTable("notification_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eventType: text("event_type").notNull(),
  channel: text("channel").notNull(),
  recipient: text("recipient"),
  subject: text("subject"),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  alertRuleId: integer("alert_rule_id").references(() => alertRules.id, { onDelete: "set null" }),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("notification_logs_event_type_idx").on(table.eventType),
  index("notification_logs_status_idx").on(table.status),
  index("notification_logs_created_at_idx").on(table.createdAt),
  index("notification_logs_alert_rule_id_idx").on(table.alertRuleId),
  index("notification_logs_property_id_idx").on(table.propertyId),
]);

export const insertNotificationLogSchema = z.object({
  eventType: z.string(),
  channel: z.string(),
  recipient: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  status: z.string().optional().default("pending"),
  errorMessage: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  alertRuleId: z.number().nullable().optional(),
  propertyId: z.number().nullable().optional(),
  retryCount: z.number().optional().default(0),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = z.input<typeof insertNotificationLogSchema>;

// --- NOTIFICATION PREFERENCES TABLE ---
export const notificationPreferences = pgTable("notification_preferences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  channel: text("channel").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("notification_pref_unique").on(table.userId, table.eventType, table.channel),
  index("notification_prefs_user_id_idx").on(table.userId),
]);

export const insertNotificationPreferenceSchema = z.object({
  userId: z.number(),
  eventType: z.string(),
  channel: z.string(),
  enabled: z.boolean().optional().default(true),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;

// --- NOTIFICATION SETTINGS TABLE ---
export const notificationSettings = pgTable("notification_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNotificationSettingSchema = createInsertSchema(notificationSettings).pick({
  settingKey: true,
  settingValue: true,
});

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingSchema>;

// --- PLAID CONNECTIONS TABLE ---
// Stores Plaid Link connections for bank account reconciliation.
// Access tokens are encrypted at rest using AES-256-GCM — the database
// stores only ciphertext, IV, and auth tag. The plaintext token never
// touches PostgreSQL. Each connection is scoped to a property + user for
// row-level access control.
export const plaidConnections = pgTable("plaid_connections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().unique(),
  institutionName: text("institution_name").notNull(),
  institutionId: text("institution_id"),
  encryptedAccessToken: text("encrypted_access_token").notNull(),
  accessTokenIv: text("access_token_iv").notNull(),
  accessTokenTag: text("access_token_tag").notNull(),
  accountIds: text("account_ids").array().notNull().default([]),
  accountNames: text("account_names").array().notNull().default([]),
  lastSyncedAt: timestamp("last_synced_at"),
  syncCursor: text("sync_cursor"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("plaid_connections_user_id_idx").on(table.userId),
  index("plaid_connections_property_id_idx").on(table.propertyId),
]);

export const insertPlaidConnectionSchema = z.object({
  userId: z.number(),
  propertyId: z.number(),
  itemId: z.string(),
  institutionName: z.string(),
  institutionId: z.string().nullable().optional(),
  encryptedAccessToken: z.string(),
  accessTokenIv: z.string(),
  accessTokenTag: z.string(),
  accountIds: z.array(z.string()).optional(),
  accountNames: z.array(z.string()).optional(),
});

export type PlaidConnection = typeof plaidConnections.$inferSelect;
export type InsertPlaidConnection = z.infer<typeof insertPlaidConnectionSchema>;

// --- PLAID TRANSACTIONS TABLE ---
// Bank transactions fetched via Plaid's transaction sync API, categorized
// into USALI departments for reconciliation against pro forma projections.
// Transaction data is stored only in PostgreSQL — never cached in Redis.
export const plaidTransactions = pgTable("plaid_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  connectionId: integer("connection_id").notNull().references(() => plaidConnections.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  plaidTransactionId: text("plaid_transaction_id").notNull().unique(),
  date: text("date").notNull(),
  name: text("name").notNull(),
  merchantName: text("merchant_name"),
  amount: real("amount").notNull(),
  isoCurrencyCode: text("iso_currency_code").default("USD"),
  category: text("category"),
  categoryId: text("category_id"),
  personalFinanceCategory: text("personal_finance_category"),
  usaliCategory: text("usali_category"),
  usaliDepartment: text("usali_department"),
  categorizationMethod: text("categorization_method"),
  pending: boolean("pending").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("plaid_transactions_connection_id_idx").on(table.connectionId),
  index("plaid_transactions_property_id_idx").on(table.propertyId),
  index("plaid_transactions_date_idx").on(table.date),
]);

export const insertPlaidTransactionSchema = z.object({
  connectionId: z.number(),
  propertyId: z.number(),
  plaidTransactionId: z.string(),
  date: z.string(),
  name: z.string(),
  merchantName: z.string().nullable().optional(),
  amount: z.number(),
  isoCurrencyCode: z.string().optional(),
  category: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  personalFinanceCategory: z.string().nullable().optional(),
  usaliCategory: z.string().nullable().optional(),
  usaliDepartment: z.string().nullable().optional(),
  categorizationMethod: z.string().nullable().optional(),
  pending: z.boolean().optional(),
});

export type PlaidTransaction = typeof plaidTransactions.$inferSelect;
export type InsertPlaidTransaction = z.infer<typeof insertPlaidTransactionSchema>;

// --- PLAID CATEGORIZATION CACHE TABLE ---
// Caches AI-generated USALI categorizations so identical transaction
// descriptions are categorized consistently without redundant API calls.
export const plaidCategorizationCache = pgTable("plaid_categorization_cache", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  descriptionPattern: text("description_pattern").notNull().unique(),
  usaliCategory: text("usali_category").notNull(),
  usaliDepartment: text("usali_department").notNull(),
  source: text("source").notNull().default("ai"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PlaidCategorizationCache = typeof plaidCategorizationCache.$inferSelect;

// --- DOCUMENT EXTRACTIONS TABLE ---
// Tracks OCR extraction jobs from uploaded financial documents (P&L, appraisals, STR reports).
// Each extraction links a source document to a property and records the processing status.
export const documentExtractions = pgTable("document_extractions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileContentType: text("file_content_type").notNull(),
  objectPath: text("object_path").notNull(),
  documentType: text("document_type").notNull().default("general"),
  status: text("status").notNull().default("pending"),
  rawExtractionData: jsonb("raw_extraction_data"),
  errorMessage: text("error_message"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("doc_extractions_property_id_idx").on(table.propertyId),
  index("doc_extractions_user_id_idx").on(table.userId),
]);

export const insertDocumentExtractionSchema = z.object({
  propertyId: z.number(),
  userId: z.number(),
  fileName: z.string(),
  fileContentType: z.string(),
  objectPath: z.string(),
  documentType: z.string().optional(),
  status: z.string().optional(),
});

export type DocumentExtraction = typeof documentExtractions.$inferSelect;
export type InsertDocumentExtraction = z.infer<typeof insertDocumentExtractionSchema>;

// --- EXTRACTION FIELDS TABLE ---
// Individual fields extracted from a document. Each field maps to a property financial
// assumption (e.g., roomsRevenue, costRateRooms). Includes confidence scores and approval status.
export const extractionFields = pgTable("extraction_fields", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  extractionId: integer("extraction_id").notNull().references(() => documentExtractions.id, { onDelete: "cascade" }),
  fieldName: text("field_name").notNull(),
  fieldLabel: text("field_label").notNull(),
  extractedValue: text("extracted_value").notNull(),
  mappedPropertyField: text("mapped_property_field"),
  confidence: real("confidence").notNull().default(0),
  status: text("status").notNull().default("pending"),
  currentValue: text("current_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("extraction_fields_extraction_id_idx").on(table.extractionId),
]);

export const insertExtractionFieldSchema = z.object({
  extractionId: z.number(),
  fieldName: z.string(),
  fieldLabel: z.string(),
  extractedValue: z.string(),
  mappedPropertyField: z.string().nullable().optional(),
  confidence: z.number().optional(),
  status: z.string().optional(),
  currentValue: z.string().nullable().optional(),
});

export type ExtractionField = typeof extractionFields.$inferSelect;
export type InsertExtractionField = z.infer<typeof insertExtractionFieldSchema>;

// --- DOCUSIGN ENVELOPES TABLE ---
// Tracks DocuSign signing ceremonies. Each envelope links to a property and contains
// status updates from webhook events (sent → delivered → viewed → signed → completed).
export const docusignEnvelopes = pgTable("docusign_envelopes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  envelopeId: text("envelope_id"),
  templateType: text("template_type").notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  status: text("status").notNull().default("created"),
  statusHistory: jsonb("status_history").$type<Array<{ status: string; timestamp: string }>>().notNull().default([]),
  signedDocumentPath: text("signed_document_path"),
  templateData: jsonb("template_data"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("docusign_envelopes_property_id_idx").on(table.propertyId),
  index("docusign_envelopes_user_id_idx").on(table.userId),
  index("docusign_envelopes_envelope_id_idx").on(table.envelopeId),
]);

export const insertDocusignEnvelopeSchema = z.object({
  propertyId: z.number(),
  userId: z.number(),
  envelopeId: z.string().nullable().optional(),
  templateType: z.string(),
  recipientName: z.string(),
  recipientEmail: z.string().email(),
  status: z.string().optional(),
  templateData: z.any().optional(),
});

export type DocusignEnvelope = typeof docusignEnvelopes.$inferSelect;
export type InsertDocusignEnvelope = z.infer<typeof insertDocusignEnvelopeSchema>;
