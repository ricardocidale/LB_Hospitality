import { pgTable, text, integer, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";
import { userGroups, companies } from "./core";
import { properties } from "./properties";

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
  version: integer("version").notNull().default(1),
  baseSnapshotHash: text("base_snapshot_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("scenarios_user_id_idx").on(table.userId),
  unique("scenarios_user_id_name").on(table.userId, table.name),
]);

// --- SCENARIO PROPERTY OVERRIDES TABLE ---
// Stores per-property diffs for each scenario. Instead of duplicating the entire
// property blob in every scenario, we store only the fields that changed from
// the baseline. This enables:
//   - Efficient storage (only changed fields are stored)
//   - Cross-scenario queries (query a field across all scenarios via SQL)
//   - Non-destructive preview (merge base + overrides without modifying live data)
//   - Change tracking (see exactly what changed in each scenario)
//
// The `overrides` JSONB contains only the fields that differ from the baseline
// property snapshot. Example: { "startAdr": 250, "adrGrowthRate": 0.04 }
//
// `changeType` indicates whether the property was added, removed, or modified
// in this scenario relative to the baseline.
export const scenarioPropertyOverrides = pgTable("scenario_property_overrides", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  scenarioId: integer("scenario_id").notNull().references(() => scenarios.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  propertyName: text("property_name").notNull(),
  changeType: text("change_type").notNull().default("modified"),
  overrides: jsonb("overrides").notNull().default({}),
  basePropertySnapshot: jsonb("base_property_snapshot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("spo_scenario_id_idx").on(table.scenarioId),
  index("spo_scenario_property_id_idx").on(table.scenarioId, table.propertyId),
  index("spo_property_name_idx").on(table.propertyName),
  unique("spo_scenario_property_unique").on(table.scenarioId, table.propertyName),
  index("spo_overrides_gin_idx").using("gin", table.overrides),
]);

export const scenarioShares = pgTable("scenario_shares", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  scenarioId: integer("scenario_id").notNull().references(() => scenarios.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  grantedBy: integer("granted_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("scenario_shares_scenario_id_idx").on(table.scenarioId),
  index("scenario_shares_target_idx").on(table.targetType, table.targetId),
  unique("scenario_shares_unique_grant").on(table.scenarioId, table.targetType, table.targetId),
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
  version: true,
  baseSnapshotHash: true,
});

export const insertScenarioPropertyOverrideSchema = createInsertSchema(scenarioPropertyOverrides).pick({
  scenarioId: true,
  propertyId: true,
  propertyName: true,
  changeType: true,
  overrides: true,
  basePropertySnapshot: true,
});

export const updateScenarioSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});

export const selectScenarioSchema = createSelectSchema(scenarios);

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type UpdateScenario = z.infer<typeof updateScenarioSchema>;
export type ScenarioShare = typeof scenarioShares.$inferSelect;
export type ScenarioPropertyOverride = typeof scenarioPropertyOverrides.$inferSelect;
export type InsertScenarioPropertyOverride = z.infer<typeof insertScenarioPropertyOverrideSchema>;
