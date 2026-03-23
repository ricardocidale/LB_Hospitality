import { pgTable, text, integer, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";

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

export const scenarioShares = pgTable("scenario_shares", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  scenarioId: integer("scenario_id").notNull().references(() => scenarios.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  grantedByUserId: integer("granted_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("scenario_shares_scenario_target").on(table.scenarioId, table.targetType, table.targetId),
  index("scenario_shares_target_idx").on(table.targetType, table.targetId),
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

export const insertScenarioShareSchema = createInsertSchema(scenarioShares).pick({
  scenarioId: true,
  targetType: true,
  targetId: true,
  grantedByUserId: true,
});

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type UpdateScenario = z.infer<typeof updateScenarioSchema>;
export type ScenarioShare = typeof scenarioShares.$inferSelect;
export type InsertScenarioShare = z.infer<typeof insertScenarioShareSchema>;
