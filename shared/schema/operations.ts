import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, jsonb, boolean, index, serial, unique, check, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";
import { properties } from "./properties";
import {
  DEFAULT_MAX_STALENESS_HOURS,
} from "../constants";

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

