import { globalAssumptions, scenarios, scenarioShares, propertyFeeCategories, propertyPhotos, companyServiceTemplates, users, type GlobalAssumptions, type InsertGlobalAssumptions, type Scenario, type InsertScenario, type UpdateScenario, type ScenarioShare, type FeeCategory, type InsertFeeCategory, type UpdateFeeCategory, properties } from "@shared/schema";
import { db } from "../db";
import { eq, desc, isNull, inArray, or, and, sql } from "drizzle-orm";
import { stripAutoFields } from "./utils";

export class FinancialStorage {
  async getGlobalAssumptions(userId?: number): Promise<GlobalAssumptions | undefined> {
    const condition = userId
      ? or(eq(globalAssumptions.userId, userId), isNull(globalAssumptions.userId))
      : isNull(globalAssumptions.userId);

    const [result] = await db.select().from(globalAssumptions)
      .where(condition)
      .orderBy(sql`${globalAssumptions.userId} IS NULL ASC`, desc(globalAssumptions.id))
      .limit(1);

    if (result) return result;

    const [fallback] = await db.select().from(globalAssumptions).limit(1);
    return fallback || undefined;
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

  /**
   * Partially update global assumptions by ID. Used for admin-only subsection
   * patches (e.g., Rebecca config) where a full upsert is unnecessary.
   */
  async patchGlobalAssumptions(id: number, patch: Record<string, unknown>): Promise<GlobalAssumptions> {
    const [updated] = await db
      .update(globalAssumptions)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(globalAssumptions.id, id))
      .returning();
    return updated;
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

  /** Duplicate a scenario with " (Copy)" suffix, handling uniqueness. */
  async cloneScenario(id: number, userId: number): Promise<Scenario> {
    const source = await this.getScenario(id);
    if (!source) throw new Error("Scenario not found");

    let baseName = source.name + " (Copy)";
    let name = baseName;
    let attempt = 1;
    const existing = await this.getScenariosByUser(userId);
    const existingNames = new Set(existing.map(s => s.name));
    while (existingNames.has(name)) {
      attempt++;
      name = `${baseName} ${attempt}`;
    }

    const [cloned] = await db.insert(scenarios).values({
      userId,
      name,
      description: source.description,
      globalAssumptions: source.globalAssumptions,
      properties: source.properties,
      scenarioImages: source.scenarioImages,
      feeCategories: source.feeCategories,
      propertyPhotos: source.propertyPhotos,
    } as typeof scenarios.$inferInsert).returning();
    return cloned;
  }

  /** Compute a structured diff between two scenarios for the compare UI. */
  compareScenarios(s1: Scenario, s2: Scenario): {
    scenario1: { id: number; name: string };
    scenario2: { id: number; name: string };
    assumptionDiffs: Array<{ field: string; scenario1: unknown; scenario2: unknown }>;
    propertyDiffs: Array<{ name: string; status: "added" | "removed" | "changed"; changes?: Array<{ field: string; scenario1: unknown; scenario2: unknown }> }>;
  } {
    const SKIP_FIELDS = new Set(["id", "createdAt", "updatedAt", "userId"]);
    const ga1 = (s1.globalAssumptions || {}) as Record<string, unknown>;
    const ga2 = (s2.globalAssumptions || {}) as Record<string, unknown>;
    const allKeys = Array.from(new Set([...Object.keys(ga1), ...Object.keys(ga2)]));
    const assumptionDiffs: Array<{ field: string; scenario1: unknown; scenario2: unknown }> = [];
    for (const key of allKeys) {
      if (SKIP_FIELDS.has(key)) continue;
      const v1 = ga1[key];
      const v2 = ga2[key];
      if (JSON.stringify(v1) !== JSON.stringify(v2)) {
        assumptionDiffs.push({ field: key, scenario1: v1, scenario2: v2 });
      }
    }

    const props1 = (s1.properties || []) as Array<Record<string, unknown>>;
    const props2 = (s2.properties || []) as Array<Record<string, unknown>>;
    const map1 = new Map(props1.map(p => [p.name as string, p]));
    const map2 = new Map(props2.map(p => [p.name as string, p]));
    const allNames = Array.from(new Set([...Array.from(map1.keys()), ...Array.from(map2.keys())]));
    const propertyDiffs: Array<{ name: string; status: "added" | "removed" | "changed"; changes?: Array<{ field: string; scenario1: unknown; scenario2: unknown }> }> = [];

    for (const name of allNames) {
      const p1 = map1.get(name);
      const p2 = map2.get(name);
      if (!p1) { propertyDiffs.push({ name, status: "added" }); continue; }
      if (!p2) { propertyDiffs.push({ name, status: "removed" }); continue; }
      const pKeys = Array.from(new Set([...Object.keys(p1), ...Object.keys(p2)]));
      const changes: Array<{ field: string; scenario1: unknown; scenario2: unknown }> = [];
      for (const k of pKeys) {
        if (SKIP_FIELDS.has(k)) continue;
        if (JSON.stringify(p1[k]) !== JSON.stringify(p2[k])) {
          changes.push({ field: k, scenario1: p1[k], scenario2: p2[k] });
        }
      }
      if (changes.length > 0) propertyDiffs.push({ name, status: "changed", changes });
    }

    return {
      scenario1: { id: s1.id, name: s1.name },
      scenario2: { id: s2.id, name: s2.name },
      assumptionDiffs,
      propertyDiffs,
    };
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

  /** Fetch fee categories for multiple properties in a single query. */
  async getFeeCategoriesByProperties(propertyIds: number[]): Promise<Record<number, FeeCategory[]>> {
    if (propertyIds.length === 0) return {};
    const rows = await db.select().from(propertyFeeCategories)
      .where(inArray(propertyFeeCategories.propertyId, propertyIds))
      .orderBy(propertyFeeCategories.sortOrder);
    const grouped: Record<number, FeeCategory[]> = {};
    for (const row of rows) {
      if (!grouped[row.propertyId]) grouped[row.propertyId] = [];
      grouped[row.propertyId].push(row);
    }
    return grouped;
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
    const existing = await this.getFeeCategoriesByProperty(propertyId);
    if (existing.length > 0) return existing;

    const templates = await db.select().from(companyServiceTemplates).orderBy(companyServiceTemplates.sortOrder);

    if (templates.length > 0) {
      const activeTemplates = templates.filter(t => t.isActive);
      if (activeTemplates.length === 0) return [];
      const values = activeTemplates.map(t => ({
        propertyId,
        name: t.name,
        rate: t.defaultRate,
        sortOrder: t.sortOrder,
      }));
      return await db.insert(propertyFeeCategories).values(values).returning();
    }

    const { DEFAULT_SERVICE_FEE_CATEGORIES } = await import("@shared/constants");
    const values = DEFAULT_SERVICE_FEE_CATEGORIES.map(cat => ({
      propertyId,
      name: cat.name,
      rate: cat.rate,
      sortOrder: cat.sortOrder,
    }));

    return await db.insert(propertyFeeCategories).values(values).returning();
  }

  async shareScenarioWithUser(scenarioId: number, recipientUserId: number, grantedByUserId: number): Promise<ScenarioShare> {
    const [share] = await db
      .insert(scenarioShares)
      .values({ scenarioId, targetType: "user", targetId: recipientUserId, grantedByUserId })
      .onConflictDoNothing()
      .returning();
    return share;
  }

  async shareAllScenariosWithUser(ownerUserId: number, recipientUserId: number): Promise<ScenarioShare[]> {
    return await db.transaction(async (tx) => {
      const owned = await tx.select().from(scenarios).where(eq(scenarios.userId, ownerUserId));
      const results: ScenarioShare[] = [];
      for (const s of owned) {
        const [share] = await tx
          .insert(scenarioShares)
          .values({ scenarioId: s.id, targetType: "user", targetId: recipientUserId, grantedByUserId: ownerUserId })
          .onConflictDoNothing()
          .returning();
        if (share) results.push(share);
      }
      return results;
    });
  }

  async getScenariosSharedWithUser(userId: number): Promise<Array<Scenario & { accessType: string; sharedByUserId: number | null; sharedByName: string | null }>> {
    const user = await db.select().from(users).where(eq(users.id, userId)).then(r => r[0]);
    if (!user) return [];

    const conditions = [
      and(eq(scenarioShares.targetType, "user"), eq(scenarioShares.targetId, userId)),
    ];
    if (user.userGroupId) {
      conditions.push(and(eq(scenarioShares.targetType, "group"), eq(scenarioShares.targetId, user.userGroupId)));
    }
    if (user.companyId) {
      conditions.push(and(eq(scenarioShares.targetType, "company"), eq(scenarioShares.targetId, user.companyId)));
    }

    const shares = await db.select().from(scenarioShares).where(or(...conditions));
    if (shares.length === 0) return [];

    const scenarioIds = Array.from(new Set(shares.map(s => s.scenarioId)));
    const sharedScenarios = await db.select().from(scenarios).where(inArray(scenarios.id, scenarioIds));

    const granterIds = Array.from(new Set(shares.map(s => s.grantedByUserId).filter((id): id is number => id !== null)));
    const granters = granterIds.length > 0
      ? await db.select().from(users).where(inArray(users.id, granterIds))
      : [];
    const granterMap = new Map(granters.map(u => [u.id, u]));

    const shareByScenario = new Map<number, typeof shares[0]>();
    for (const s of shares) {
      if (!shareByScenario.has(s.scenarioId)) shareByScenario.set(s.scenarioId, s);
    }

    return sharedScenarios
      .filter(s => s.userId !== userId)
      .map(s => {
        const share = shareByScenario.get(s.id)!;
        const granter = share.grantedByUserId ? granterMap.get(share.grantedByUserId) : null;
        const granterName = granter ? [granter.firstName, granter.lastName].filter(Boolean).join(" ") || granter.email : null;
        return {
          ...s,
          accessType: `shared_${share.targetType}` as string,
          sharedByUserId: share.grantedByUserId,
          sharedByName: granterName,
        };
      });
  }

  async getSharesForScenario(scenarioId: number): Promise<ScenarioShare[]> {
    return await db.select().from(scenarioShares).where(eq(scenarioShares.scenarioId, scenarioId));
  }
}
