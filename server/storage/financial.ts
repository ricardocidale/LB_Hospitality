import { globalAssumptions, scenarios, propertyFeeCategories, type GlobalAssumptions, type InsertGlobalAssumptions, type Scenario, type InsertScenario, type UpdateScenario, type FeeCategory, type InsertFeeCategory, type UpdateFeeCategory, properties } from "@shared/schema";
import { db } from "../db";
import { eq, desc, isNull } from "drizzle-orm";

export class FinancialStorage {
  /**
   * Fetch the system-wide financial assumptions. If a userId is provided,
   * returns that user's personal copy; otherwise returns the shared (default) row.
   */
  async getGlobalAssumptions(userId?: number): Promise<GlobalAssumptions | undefined> {
    if (userId) {
      const [userResult] = await db.select().from(globalAssumptions).where(eq(globalAssumptions.userId, userId)).limit(1);
      if (userResult) return userResult;
    }
    const [shared] = await db.select().from(globalAssumptions).where(isNull(globalAssumptions.userId)).orderBy(desc(globalAssumptions.id)).limit(1);
    if (shared) return shared;
    const [any] = await db.select().from(globalAssumptions).limit(1);
    return any || undefined;
  }

  /**
   * Create or update global assumptions. Uses "upsert" logic: if a row already
   * exists for this user, update it; otherwise insert a new one. This is how the
   * Settings page saves — it always calls upsert regardless of whether it's the
   * first save or the hundredth.
   */
  async upsertGlobalAssumptions(data: InsertGlobalAssumptions, userId?: number): Promise<GlobalAssumptions> {
    const existing = await this.getGlobalAssumptions(userId);
    
    if (existing) {
      const { id: _id, createdAt: _ca, updatedAt: _ua, ...safeData } = data as Record<string, unknown>;
      const [updated] = await db
        .update(globalAssumptions)
        .set({ ...safeData, updatedAt: new Date() })
        .where(eq(globalAssumptions.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await db
        .insert(globalAssumptions)
        .values({ 
          ...data as typeof globalAssumptions.$inferInsert, 
          userId 
        })
        .returning();
      return inserted;
    }
  }

  /** List all scenarios belonging to a user, ordered by last update. */
  async getScenariosByUser(userId: number): Promise<Scenario[]> {
    return await db.select().from(scenarios).where(eq(scenarios.userId, userId)).orderBy(scenarios.updatedAt);
  }

  /** Fetch a single scenario by ID, including its full JSON snapshot. */
  async getScenario(id: number): Promise<Scenario | undefined> {
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    return scenario || undefined;
  }

  /** Save a new scenario snapshot (assumptions + properties + images + fee categories). */
  async createScenario(data: InsertScenario): Promise<Scenario> {
    const [scenario] = await db
      .insert(scenarios)
      .values(data as typeof scenarios.$inferInsert)
      .returning();
    return scenario;
  }

  /** Update scenario metadata (name, description). Does not re-snapshot financial data. */
  async updateScenario(id: number, data: UpdateScenario): Promise<Scenario | undefined> {
    const [scenario] = await db
      .update(scenarios)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scenarios.id, id))
      .returning();
    return scenario || undefined;
  }

  /** Delete a scenario. The "Base" scenario is protected by the route handler, not here. */
  async deleteScenario(id: number): Promise<void> {
    await db.delete(scenarios).where(eq(scenarios.id, id));
  }

  /**
   * Restore a saved scenario by replacing the user's current working data
   * (global assumptions + all properties + fee categories) with the snapshot
   * from the scenario. Runs in a transaction so partial loads can't occur.
   */
  async loadScenario(userId: number, savedAssumptions: Record<string, unknown>, savedProperties: Array<Record<string, unknown>>, savedFeeCategories?: Record<string, Array<Record<string, unknown>>>): Promise<void> {
    await db.transaction(async (tx) => {
      const { id: _gaId, createdAt: _gaCreated, updatedAt: _gaUpdated, userId: _gaUser, ...gaData } = savedAssumptions;

      const existingShared = await tx.select().from(globalAssumptions)
        .where(isNull(globalAssumptions.userId));
      if (existingShared.length > 0) {
        await tx.update(globalAssumptions).set({ ...gaData, updatedAt: new Date() })
          .where(eq(globalAssumptions.id, existingShared[existingShared.length - 1].id));
      } else {
        await tx.insert(globalAssumptions).values({ ...gaData, userId: null } as typeof globalAssumptions.$inferInsert);
      }

      const currentProps = await tx.select().from(properties)
        .where(isNull(properties.userId));
      for (const prop of currentProps) {
        await tx.delete(properties).where(eq(properties.id, prop.id));
      }
      for (const prop of savedProperties) {
        const { id, createdAt, updatedAt, userId: _uid, ...propData } = prop;
        const [inserted] = await tx.insert(properties).values({ ...propData, userId: null } as typeof properties.$inferInsert).returning();

        const propName = prop.name as string;
        const feeCats = savedFeeCategories?.[propName];
        if (feeCats && feeCats.length > 0) {
          for (const cat of feeCats) {
            const { id: _catId, propertyId: _propId, createdAt: _catCreated, ...catData } = cat;
            await tx.insert(propertyFeeCategories).values({ ...catData, propertyId: inserted.id } as typeof propertyFeeCategories.$inferInsert);
          }
        }
      }
    });
  }

  /** Fetch all fee categories associated with a property. Used in pro-forma calcs. */
  async getFeeCategoriesByProperty(propertyId: number): Promise<FeeCategory[]> {
    return await db.select().from(propertyFeeCategories).where(eq(propertyFeeCategories.propertyId, propertyId)).orderBy(propertyFeeCategories.sortOrder);
  }

  /** List ALL fee categories across all properties (admin view). */
  async getAllFeeCategories(): Promise<FeeCategory[]> {
    return await db.select().from(propertyFeeCategories).orderBy(propertyFeeCategories.id);
  }

  /** Manually add a new fee category to a property. */
  async createFeeCategory(data: InsertFeeCategory): Promise<FeeCategory> {
    const [cat] = await db.insert(propertyFeeCategories).values(data).returning();
    return cat;
  }

  /** Update a fee category's name, rate, or sort order. */
  async updateFeeCategory(id: number, data: UpdateFeeCategory): Promise<FeeCategory | undefined> {
    const [cat] = await db.update(propertyFeeCategories).set(data).where(eq(propertyFeeCategories.id, id)).returning();
    return cat || undefined;
  }

  /** Remove a fee category. This will affect pro-forma results for the property. */
  async deleteFeeCategory(id: number): Promise<void> {
    await db.delete(propertyFeeCategories).where(eq(propertyFeeCategories.id, id));
  }

  /**
   * Seed a property with the standard set of fee categories if it
   * doesn't have any yet. Called when a property is first accessed to ensure
   * every property has a fee breakdown. Uses DEFAULT_SERVICE_FEE_CATEGORIES
   * from shared/constants.ts.
   */
  async seedDefaultFeeCategories(propertyId: number): Promise<FeeCategory[]> {
    const { DEFAULT_SERVICE_FEE_CATEGORIES } = await import("@shared/constants");
    const existing = await this.getFeeCategoriesByProperty(propertyId);
    if (existing.length > 0) return existing;
    const results: FeeCategory[] = [];
    for (const cat of DEFAULT_SERVICE_FEE_CATEGORIES) {
      const [created] = await db.insert(propertyFeeCategories).values({
        propertyId,
        name: cat.name,
        rate: cat.rate,
        sortOrder: cat.sortOrder,
      }).returning();
      results.push(created);
    }
    return results;
  }
}
