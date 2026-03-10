import { globalAssumptions, scenarios, propertyFeeCategories, propertyPhotos, type GlobalAssumptions, type InsertGlobalAssumptions, type Scenario, type InsertScenario, type UpdateScenario, type FeeCategory, type InsertFeeCategory, type UpdateFeeCategory, properties } from "@shared/schema";
import { db } from "../db";
import { eq, desc, isNull, inArray } from "drizzle-orm";
import { stripAutoFields } from "./utils";

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
      const [updated] = await db
        .update(globalAssumptions)
        .set({ ...stripAutoFields(data as Record<string, unknown>), updatedAt: new Date() })
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
      .set({ ...stripAutoFields(data as Record<string, unknown>), updatedAt: new Date() })
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
  async loadScenario(userId: number, savedAssumptions: Record<string, unknown>, savedProperties: Array<Record<string, unknown>>, savedFeeCategories?: Record<string, Array<Record<string, unknown>>>, savedPropertyPhotos?: Record<string, Array<Record<string, unknown>>>): Promise<void> {
    await db.transaction(async (tx) => {
      const { id: _gaId, createdAt: _gaCreated, updatedAt: _gaUpdated, userId: _gaUser, ...gaData } = savedAssumptions;

      const existingShared = await tx.select().from(globalAssumptions)
        .where(isNull(globalAssumptions.userId))
        .orderBy(desc(globalAssumptions.id));
      if (existingShared.length > 0) {
        await tx.update(globalAssumptions).set({ ...gaData, updatedAt: new Date() })
          .where(eq(globalAssumptions.id, existingShared[0].id));
      } else {
        await tx.insert(globalAssumptions).values({ ...gaData, userId: null } as typeof globalAssumptions.$inferInsert);
      }

      await tx.delete(properties).where(isNull(properties.userId));

      const insertedProperties: Array<{ id: number; name: string }> = [];
      for (const prop of savedProperties) {
        const { id, createdAt, updatedAt, userId: _uid, ...propData } = prop;
        const [inserted] = await tx.insert(properties).values({ ...propData, userId: null } as typeof properties.$inferInsert).returning();
        insertedProperties.push({ id: inserted.id, name: prop.name as string });
      }

      if (savedFeeCategories) {
        const feeCategoryValues: any[] = [];
        for (const prop of insertedProperties) {
          const feeCats = savedFeeCategories[prop.name];
          if (feeCats && feeCats.length > 0) {
            for (const cat of feeCats) {
              const { id: _catId, propertyId: _propId, createdAt: _catCreated, ...catData } = cat;
              feeCategoryValues.push({ ...catData, propertyId: prop.id });
            }
          }
        }

        if (feeCategoryValues.length > 0) {
          // Clean up old fee categories for these properties first to avoid duplicates
          const propIds = insertedProperties.map(p => p.id);
          await tx.delete(propertyFeeCategories).where(inArray(propertyFeeCategories.propertyId, propIds));
          await tx.insert(propertyFeeCategories).values(feeCategoryValues as any);
        }
      }

      // Restore property photos
      if (savedPropertyPhotos) {
        const photoValues: any[] = [];
        for (const prop of insertedProperties) {
          const photos = savedPropertyPhotos[prop.name];
          if (photos && photos.length > 0) {
            for (const photo of photos) {
              const { id: _photoId, propertyId: _propId, createdAt: _created, ...photoData } = photo;
              photoValues.push({ ...photoData, propertyId: prop.id });
            }
          }
        }
        if (photoValues.length > 0) {
          const propIds = insertedProperties.map(p => p.id);
          await tx.delete(propertyPhotos).where(inArray(propertyPhotos.propertyId, propIds));
          await tx.insert(propertyPhotos).values(photoValues as any);
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
    const [cat] = await db.update(propertyFeeCategories).set(stripAutoFields(data as Record<string, unknown>)).where(eq(propertyFeeCategories.id, id)).returning();
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

    const values = DEFAULT_SERVICE_FEE_CATEGORIES.map(cat => ({
      propertyId,
      name: cat.name,
      rate: cat.rate,
      sortOrder: cat.sortOrder,
    }));

    return await db.insert(propertyFeeCategories).values(values).returning();
  }
}
