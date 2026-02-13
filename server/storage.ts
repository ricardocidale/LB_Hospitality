import { globalAssumptions, properties, users, sessions, scenarios, loginLogs, designThemes, logos, assetDescriptions, userGroups, companies, marketResearch, prospectiveProperties, savedSearches, activityLogs, verificationRuns, propertyFeeCategories, type GlobalAssumptions, type Property, type InsertGlobalAssumptions, type InsertProperty, type UpdateProperty, type User, type InsertUser, type Session, type Scenario, type InsertScenario, type UpdateScenario, type LoginLog, type InsertLoginLog, type DesignTheme, type InsertDesignTheme, type Logo, type InsertLogo, type AssetDescription, type InsertAssetDescription, type UserGroup, type InsertUserGroup, type Company, type InsertCompany, type MarketResearch, type InsertMarketResearch, type ProspectiveProperty, type InsertProspectiveProperty, type SavedSearch, type InsertSavedSearch, type ActivityLog, type InsertActivityLog, type VerificationRun, type InsertVerificationRun, type FeeCategory, type InsertFeeCategory, type UpdateFeeCategory } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, lt, gte, lte, desc, or, isNull, type SQL } from "drizzle-orm";

/** Filters for querying activity logs. */
export interface ActivityLogFilters {
  userId?: number;
  entityType?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export interface IStorage {
  // Users
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  updateUserPassword(id: number, passwordHash: string): Promise<void>;
  updateUserProfile(id: number, data: { name?: string; email?: string; company?: string; companyId?: number | null; title?: string }): Promise<User>;
  updateUserSelectedTheme(id: number, themeId: number | null): Promise<User>;
  updateUserRole(id: number, role: string): Promise<void>;
  
  // Sessions
  createSession(userId: number, sessionId: string, expiresAt: Date): Promise<Session>;
  getSession(sessionId: string): Promise<(Session & { user: User }) | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  deleteUserSessions(userId: number): Promise<void>;
  deleteExpiredSessions(): Promise<number>;
  
  // Global Assumptions (per user)
  getGlobalAssumptions(userId?: number): Promise<GlobalAssumptions | undefined>;
  upsertGlobalAssumptions(data: InsertGlobalAssumptions, userId?: number): Promise<GlobalAssumptions>;
  
  // Properties (per user)
  getAllProperties(userId?: number): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(data: InsertProperty): Promise<Property>;
  updateProperty(id: number, data: UpdateProperty): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<void>;
  
  // Scenarios (per user)
  getScenariosByUser(userId: number): Promise<Scenario[]>;
  getScenario(id: number): Promise<Scenario | undefined>;
  createScenario(data: InsertScenario): Promise<Scenario>;
  updateScenario(id: number, data: UpdateScenario): Promise<Scenario | undefined>;
  deleteScenario(id: number): Promise<void>;
  loadScenario(userId: number, savedAssumptions: Record<string, unknown>, savedProperties: Array<Record<string, unknown>>, savedFeeCategories?: Record<string, Array<Record<string, unknown>>>): Promise<void>;
  
  // Login Logs
  createLoginLog(userId: number, sessionId: string, ipAddress?: string): Promise<LoginLog>;
  updateLogoutTime(sessionId: string): Promise<void>;
  getLoginLogs(): Promise<(LoginLog & { user: User })[]>;
  
  // Design Themes (standalone, like logos)
  getAllDesignThemes(): Promise<DesignTheme[]>;
  getDesignTheme(id: number): Promise<DesignTheme | undefined>;
  getDefaultDesignTheme(): Promise<DesignTheme | undefined>;
  createDesignTheme(data: InsertDesignTheme): Promise<DesignTheme>;
  updateDesignTheme(id: number, data: Partial<InsertDesignTheme>): Promise<DesignTheme | undefined>;
  deleteDesignTheme(id: number): Promise<void>;
  
  // Market Research
  getMarketResearch(type: string, userId?: number, propertyId?: number): Promise<MarketResearch | undefined>;
  getAllMarketResearch(userId?: number): Promise<MarketResearch[]>;
  upsertMarketResearch(data: InsertMarketResearch): Promise<MarketResearch>;
  deleteMarketResearch(id: number): Promise<void>;
  
  // Prospective Properties
  getProspectiveProperties(userId: number): Promise<ProspectiveProperty[]>;
  addProspectiveProperty(data: InsertProspectiveProperty): Promise<ProspectiveProperty>;
  deleteProspectiveProperty(id: number, userId: number): Promise<void>;
  updateProspectivePropertyNotes(id: number, userId: number, notes: string): Promise<ProspectiveProperty | undefined>;

  // Saved Searches
  getSavedSearches(userId: number): Promise<SavedSearch[]>;
  addSavedSearch(data: InsertSavedSearch): Promise<SavedSearch>;
  deleteSavedSearch(id: number, userId: number): Promise<void>;

  // Activity Logs
  /** Insert a new activity log entry for user action tracking. */
  createActivityLog(data: InsertActivityLog): Promise<ActivityLog>;
  /** Query activity logs with optional filters (userId, entityType, date range, pagination). */
  getActivityLogs(filters: ActivityLogFilters): Promise<(ActivityLog & { user: User })[]>;
  /** Get a user's own activity logs (limited). */
  getUserActivityLogs(userId: number, limit?: number): Promise<ActivityLog[]>;

  // Verification Runs
  /** Persist a verification run result for historical tracking. */
  createVerificationRun(data: InsertVerificationRun): Promise<VerificationRun>;
  /** List recent verification runs (summary only — results field omitted). */
  getVerificationRuns(limit?: number): Promise<Omit<VerificationRun, 'results'>[]>;
  /** Get a single verification run with full results. */
  getVerificationRun(id: number): Promise<VerificationRun | undefined>;

  // Active Sessions (admin)
  /** List all active (non-expired) sessions with associated user info. */
  getActiveSessions(): Promise<(Session & { user: User })[]>;
  /** Force-logout: delete a specific session by ID. */
  forceDeleteSession(sessionId: string): Promise<void>;

  // Logos
  getAllLogos(): Promise<Logo[]>;
  getLogo(id: number): Promise<Logo | undefined>;
  getDefaultLogo(): Promise<Logo | undefined>;
  createLogo(data: InsertLogo): Promise<Logo>;
  deleteLogo(id: number): Promise<void>;

  // Asset Descriptions
  getAllAssetDescriptions(): Promise<AssetDescription[]>;
  getAssetDescription(id: number): Promise<AssetDescription | undefined>;
  getDefaultAssetDescription(): Promise<AssetDescription | undefined>;
  createAssetDescription(data: InsertAssetDescription): Promise<AssetDescription>;
  deleteAssetDescription(id: number): Promise<void>;
  

  // User Groups
  getAllUserGroups(): Promise<UserGroup[]>;
  getUserGroup(id: number): Promise<UserGroup | undefined>;
  createUserGroup(data: InsertUserGroup): Promise<UserGroup>;
  updateUserGroup(id: number, data: Partial<InsertUserGroup>): Promise<UserGroup>;
  deleteUserGroup(id: number): Promise<void>;
  assignUserToGroup(userId: number, groupId: number | null): Promise<User>;

  // Companies
  getAllCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(data: InsertCompany): Promise<Company>;
  updateCompany(id: number, data: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;

  // Property Fee Categories
  getFeeCategoriesByProperty(propertyId: number): Promise<FeeCategory[]>;
  getAllFeeCategories(): Promise<FeeCategory[]>;
  createFeeCategory(data: InsertFeeCategory): Promise<FeeCategory>;
  updateFeeCategory(id: number, data: UpdateFeeCategory): Promise<FeeCategory | undefined>;
  deleteFeeCategory(id: number): Promise<void>;
  seedDefaultFeeCategories(propertyId: number): Promise<FeeCategory[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
        name: data.name,
        company: data.company,
        companyId: data.companyId,
        title: data.title,
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async deleteUser(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(sessions).where(eq(sessions.userId, id));
      await tx.delete(scenarios).where(eq(scenarios.userId, id));
      await tx.delete(marketResearch).where(eq(marketResearch.userId, id));
      await tx.delete(prospectiveProperties).where(eq(prospectiveProperties.userId, id));
      await tx.delete(savedSearches).where(eq(savedSearches.userId, id));
      await tx.delete(properties).where(eq(properties.userId, id));
      await tx.delete(globalAssumptions).where(eq(globalAssumptions.userId, id));
      await tx.delete(loginLogs).where(eq(loginLogs.userId, id));
      await tx.delete(activityLogs).where(eq(activityLogs.userId, id));
      await tx.delete(verificationRuns).where(eq(verificationRuns.userId, id));
      await tx.delete(users).where(eq(users.id, id));
    });
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
    await db.delete(sessions).where(eq(sessions.userId, id));
  }

  async updateUserProfile(id: number, data: { name?: string; email?: string; company?: string; companyId?: number | null; title?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserSelectedTheme(id: number, themeId: number | null): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ selectedThemeId: themeId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserRole(id: number, role: string): Promise<void> {
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  }

  // Sessions
  async createSession(userId: number, sessionId: string, expiresAt: Date): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({ id: sessionId, userId, expiresAt })
      .returning();
    return session;
  }

  async getSession(sessionId: string): Promise<(Session & { user: User }) | undefined> {
    const [result] = await db
      .select()
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())));
    
    if (!result) return undefined;
    return { ...result.sessions, user: result.users };
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async deleteUserSessions(userId: number): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await db.delete(sessions).where(lt(sessions.expiresAt, new Date())).returning();
    return result.length;
  }

  // Global Assumptions
  async getGlobalAssumptions(userId?: number): Promise<GlobalAssumptions | undefined> {
    if (userId) {
      const [result] = await db.select().from(globalAssumptions).where(eq(globalAssumptions.userId, userId)).limit(1);
      return result || undefined;
    }
    const [result] = await db.select().from(globalAssumptions).limit(1);
    return result || undefined;
  }

  async upsertGlobalAssumptions(data: InsertGlobalAssumptions, userId?: number): Promise<GlobalAssumptions> {
    const existing = await this.getGlobalAssumptions(userId);
    
    if (existing) {
      const [updated] = await db
        .update(globalAssumptions)
        .set({ ...data, updatedAt: new Date() })
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

  // Properties
  async getAllProperties(userId?: number): Promise<Property[]> {
    if (userId) {
      // Return properties belonging to the user OR shared properties (userId is null)
      return await db.select().from(properties)
        .where(or(eq(properties.userId, userId), isNull(properties.userId)))
        .orderBy(properties.createdAt);
    }
    return await db.select().from(properties).orderBy(properties.createdAt);
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async createProperty(data: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values(data as typeof properties.$inferInsert)
      .returning();
    return property;
  }

  async updateProperty(id: number, data: UpdateProperty): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  // Scenarios
  async getScenariosByUser(userId: number): Promise<Scenario[]> {
    return await db.select().from(scenarios).where(eq(scenarios.userId, userId)).orderBy(scenarios.updatedAt);
  }

  async getScenario(id: number): Promise<Scenario | undefined> {
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    return scenario || undefined;
  }

  async createScenario(data: InsertScenario): Promise<Scenario> {
    const [scenario] = await db
      .insert(scenarios)
      .values(data as typeof scenarios.$inferInsert)
      .returning();
    return scenario;
  }

  async updateScenario(id: number, data: UpdateScenario): Promise<Scenario | undefined> {
    const [scenario] = await db
      .update(scenarios)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scenarios.id, id))
      .returning();
    return scenario || undefined;
  }

  async deleteScenario(id: number): Promise<void> {
    await db.delete(scenarios).where(eq(scenarios.id, id));
  }

  async loadScenario(userId: number, savedAssumptions: Record<string, unknown>, savedProperties: Array<Record<string, unknown>>, savedFeeCategories?: Record<string, Array<Record<string, unknown>>>): Promise<void> {
    await db.transaction(async (tx) => {
      const existing = await tx.select().from(globalAssumptions)
        .where(eq(globalAssumptions.userId, userId));
      if (existing.length > 0) {
        await tx.update(globalAssumptions).set(savedAssumptions)
          .where(eq(globalAssumptions.userId, userId));
      } else {
        await tx.insert(globalAssumptions).values({ ...savedAssumptions, userId } as typeof globalAssumptions.$inferInsert);
      }

      const currentProps = await tx.select().from(properties)
        .where(or(eq(properties.userId, userId), isNull(properties.userId)));
      for (const prop of currentProps) {
        await tx.delete(properties).where(eq(properties.id, prop.id));
      }
      for (const prop of savedProperties) {
        const { id, createdAt, updatedAt, ...propData } = prop;
        const [inserted] = await tx.insert(properties).values({ ...propData, userId } as typeof properties.$inferInsert).returning();

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

  // Login Logs
  async createLoginLog(userId: number, sessionId: string, ipAddress?: string): Promise<LoginLog> {
    const [log] = await db
      .insert(loginLogs)
      .values({ userId, sessionId, ipAddress })
      .returning();
    return log;
  }
  
  async updateLogoutTime(sessionId: string): Promise<void> {
    await db
      .update(loginLogs)
      .set({ logoutAt: new Date() })
      .where(eq(loginLogs.sessionId, sessionId));
  }
  
  async getLoginLogs(): Promise<(LoginLog & { user: User })[]> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const results = await db
      .select()
      .from(loginLogs)
      .innerJoin(users, eq(loginLogs.userId, users.id))
      .where(gte(loginLogs.loginAt, ninetyDaysAgo))
      .orderBy(desc(loginLogs.loginAt));
    return results.map(r => ({ ...r.login_logs, user: r.users }));
  }
  
  // Design Themes (per user)
  async getAllDesignThemes(): Promise<DesignTheme[]> {
    return await db.select().from(designThemes).orderBy(designThemes.createdAt);
  }

  async getDesignTheme(id: number): Promise<DesignTheme | undefined> {
    const [theme] = await db.select().from(designThemes).where(eq(designThemes.id, id));
    return theme || undefined;
  }

  async getDefaultDesignTheme(): Promise<DesignTheme | undefined> {
    const [theme] = await db.select().from(designThemes).where(eq(designThemes.isDefault, true));
    return theme || undefined;
  }

  async createDesignTheme(data: InsertDesignTheme): Promise<DesignTheme> {
    const [theme] = await db
      .insert(designThemes)
      .values({
        name: data.name,
        description: data.description,
        colors: data.colors,
        isDefault: data.isDefault || false,
      })
      .returning();
    return theme;
  }

  async updateDesignTheme(id: number, data: Partial<InsertDesignTheme>): Promise<DesignTheme | undefined> {
    const [theme] = await db
      .update(designThemes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(designThemes.id, id))
      .returning();
    return theme || undefined;
  }

  async deleteDesignTheme(id: number): Promise<void> {
    const [theme] = await db.select().from(designThemes).where(eq(designThemes.id, id));
    if (theme?.isDefault) throw new Error("Cannot delete the default theme");
    await db.delete(designThemes).where(eq(designThemes.id, id));
  }
  
  // Market Research
  async getMarketResearch(type: string, userId?: number, propertyId?: number): Promise<MarketResearch | undefined> {
    const conditions = [eq(marketResearch.type, type)];
    if (userId) conditions.push(or(eq(marketResearch.userId, userId), isNull(marketResearch.userId))!);
    if (propertyId) conditions.push(eq(marketResearch.propertyId, propertyId));
    
    const [result] = await db.select().from(marketResearch)
      .where(and(...conditions))
      .orderBy(desc(marketResearch.updatedAt))
      .limit(1);
    return result || undefined;
  }
  
  async getAllMarketResearch(userId?: number): Promise<MarketResearch[]> {
    if (userId) {
      return await db.select().from(marketResearch)
        .where(or(eq(marketResearch.userId, userId), isNull(marketResearch.userId)))
        .orderBy(desc(marketResearch.updatedAt));
    }
    return await db.select().from(marketResearch).orderBy(desc(marketResearch.updatedAt));
  }
  
  async upsertMarketResearch(data: InsertMarketResearch): Promise<MarketResearch> {
    const conditions = [eq(marketResearch.type, data.type!)];
    if (data.userId) conditions.push(eq(marketResearch.userId, data.userId));
    if (data.propertyId) conditions.push(eq(marketResearch.propertyId, data.propertyId));
    
    const [existing] = await db.select().from(marketResearch)
      .where(and(...conditions))
      .limit(1);
    
    if (existing) {
      const [updated] = await db.update(marketResearch)
        .set({ 
          title: data.title, 
          content: data.content, 
          llmModel: data.llmModel,
          updatedAt: new Date() 
        })
        .where(eq(marketResearch.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(marketResearch)
        .values(data as typeof marketResearch.$inferInsert)
        .returning();
      return inserted;
    }
  }
  
  async deleteMarketResearch(id: number): Promise<void> {
    await db.delete(marketResearch).where(eq(marketResearch.id, id));
  }
  
  // Prospective Properties
  async getProspectiveProperties(userId: number): Promise<ProspectiveProperty[]> {
    return await db.select().from(prospectiveProperties)
      .where(eq(prospectiveProperties.userId, userId))
      .orderBy(desc(prospectiveProperties.savedAt));
  }
  
  async addProspectiveProperty(data: InsertProspectiveProperty): Promise<ProspectiveProperty> {
    const existing = await db.select().from(prospectiveProperties)
      .where(and(
        eq(prospectiveProperties.userId, data.userId),
        eq(prospectiveProperties.externalId, data.externalId)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [prop] = await db.insert(prospectiveProperties)
      .values(data as typeof prospectiveProperties.$inferInsert)
      .returning();
    return prop;
  }
  
  async deleteProspectiveProperty(id: number, userId: number): Promise<void> {
    await db.delete(prospectiveProperties)
      .where(and(eq(prospectiveProperties.id, id), eq(prospectiveProperties.userId, userId)));
  }
  
  async updateProspectivePropertyNotes(id: number, userId: number, notes: string): Promise<ProspectiveProperty | undefined> {
    const [prop] = await db.update(prospectiveProperties)
      .set({ notes })
      .where(and(eq(prospectiveProperties.id, id), eq(prospectiveProperties.userId, userId)))
      .returning();
    return prop || undefined;
  }

  // Saved Searches
  async getSavedSearches(userId: number): Promise<SavedSearch[]> {
    return await db.select().from(savedSearches)
      .where(eq(savedSearches.userId, userId))
      .orderBy(desc(savedSearches.savedAt));
  }

  async addSavedSearch(data: InsertSavedSearch): Promise<SavedSearch> {
    const [search] = await db.insert(savedSearches)
      .values(data as typeof savedSearches.$inferInsert)
      .returning();
    return search;
  }

  async deleteSavedSearch(id: number, userId: number): Promise<void> {
    await db.delete(savedSearches)
      .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)));
  }

  // Activity Logs

  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db
      .insert(activityLogs)
      .values(data as typeof activityLogs.$inferInsert)
      .returning();
    return log;
  }

  async getActivityLogs(filters: ActivityLogFilters): Promise<(ActivityLog & { user: User })[]> {
    const conditions: SQL[] = [];
    if (filters.userId) conditions.push(eq(activityLogs.userId, filters.userId));
    if (filters.entityType) conditions.push(eq(activityLogs.entityType, filters.entityType));
    if (filters.from) conditions.push(gte(activityLogs.createdAt, filters.from));
    if (filters.to) conditions.push(lte(activityLogs.createdAt, filters.to));

    const query = db
      .select()
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(activityLogs.createdAt))
      .limit(filters.limit ?? 50)
      .offset(filters.offset ?? 0);

    const results = await query;
    return results.map(r => ({ ...r.activity_logs, user: r.users }));
  }

  async getUserActivityLogs(userId: number, limit = 20): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  // Verification Runs

  async createVerificationRun(data: InsertVerificationRun): Promise<VerificationRun> {
    const [run] = await db
      .insert(verificationRuns)
      .values(data as typeof verificationRuns.$inferInsert)
      .returning();
    return run;
  }

  async getVerificationRuns(limit = 20): Promise<Omit<VerificationRun, 'results'>[]> {
    // Select all columns except 'results' (large JSON payload) for list view
    const rows = await db
      .select({
        id: verificationRuns.id,
        userId: verificationRuns.userId,
        totalChecks: verificationRuns.totalChecks,
        passed: verificationRuns.passed,
        failed: verificationRuns.failed,
        auditOpinion: verificationRuns.auditOpinion,
        overallStatus: verificationRuns.overallStatus,
        createdAt: verificationRuns.createdAt,
      })
      .from(verificationRuns)
      .orderBy(desc(verificationRuns.createdAt))
      .limit(limit);
    return rows;
  }

  async getVerificationRun(id: number): Promise<VerificationRun | undefined> {
    const [run] = await db.select().from(verificationRuns).where(eq(verificationRuns.id, id));
    return run || undefined;
  }

  // Active Sessions (admin)

  async getActiveSessions(): Promise<(Session & { user: User })[]> {
    const results = await db
      .select()
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(gt(sessions.expiresAt, new Date()))
      .orderBy(desc(sessions.createdAt));
    return results.map(r => ({ ...r.sessions, user: r.users }));
  }

  async forceDeleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  // Logos
  async getAllLogos(): Promise<Logo[]> {
    return await db.select().from(logos).orderBy(logos.createdAt);
  }

  async getLogo(id: number): Promise<Logo | undefined> {
    const [logo] = await db.select().from(logos).where(eq(logos.id, id));
    return logo || undefined;
  }

  async getDefaultLogo(): Promise<Logo | undefined> {
    const [logo] = await db.select().from(logos).where(eq(logos.isDefault, true));
    return logo || undefined;
  }

  async createLogo(data: InsertLogo): Promise<Logo> {
    const [logo] = await db.insert(logos).values(data).returning();
    return logo;
  }

  async deleteLogo(id: number): Promise<void> {
    await db.delete(logos).where(eq(logos.id, id));
  }

  // Asset Descriptions
  async getAllAssetDescriptions(): Promise<AssetDescription[]> {
    return await db.select().from(assetDescriptions).orderBy(assetDescriptions.createdAt);
  }

  async getAssetDescription(id: number): Promise<AssetDescription | undefined> {
    const [ad] = await db.select().from(assetDescriptions).where(eq(assetDescriptions.id, id));
    return ad || undefined;
  }

  async getDefaultAssetDescription(): Promise<AssetDescription | undefined> {
    const [ad] = await db.select().from(assetDescriptions).where(eq(assetDescriptions.isDefault, true));
    return ad || undefined;
  }

  async createAssetDescription(data: InsertAssetDescription): Promise<AssetDescription> {
    const [ad] = await db.insert(assetDescriptions).values(data).returning();
    return ad;
  }

  async deleteAssetDescription(id: number): Promise<void> {
    await db.delete(assetDescriptions).where(eq(assetDescriptions.id, id));
  }

  // User Groups
  async getAllUserGroups(): Promise<UserGroup[]> {
    return db.select().from(userGroups).orderBy(userGroups.name);
  }

  async getUserGroup(id: number): Promise<UserGroup | undefined> {
    const [group] = await db.select().from(userGroups).where(eq(userGroups.id, id));
    return group || undefined;
  }

  async createUserGroup(data: InsertUserGroup): Promise<UserGroup> {
    const [group] = await db.insert(userGroups).values(data).returning();
    return group;
  }

  async updateUserGroup(id: number, data: Partial<InsertUserGroup>): Promise<UserGroup> {
    const [group] = await db.update(userGroups).set(data).where(eq(userGroups.id, id)).returning();
    return group;
  }

  async getDefaultUserGroup(): Promise<UserGroup | undefined> {
    const [group] = await db.select().from(userGroups).where(eq(userGroups.isDefault, true));
    return group || undefined;
  }

  async deleteUserGroup(id: number): Promise<void> {
    const [group] = await db.select().from(userGroups).where(eq(userGroups.id, id));
    if (group?.isDefault) throw new Error("Cannot delete the default user group");
    const defaultGroup = await this.getDefaultUserGroup();
    if (!defaultGroup) throw new Error("Cannot delete group: no default group exists to reassign users");
    await db.update(users).set({ userGroupId: defaultGroup.id, updatedAt: new Date() }).where(eq(users.userGroupId, id));
    await db.delete(userGroups).where(eq(userGroups.id, id));
  }

  async assignUserToGroup(userId: number, groupId: number | null): Promise<User> {
    const [user] = await db.update(users).set({ userGroupId: groupId, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    return user;
  }

  // Companies
  async getAllCompanies(): Promise<Company[]> {
    return db.select().from(companies).orderBy(companies.name);
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(data).returning();
    return company;
  }

  async updateCompany(id: number, data: Partial<InsertCompany>): Promise<Company> {
    const [company] = await db.update(companies).set(data).where(eq(companies.id, id)).returning();
    return company;
  }

  async deleteCompany(id: number): Promise<void> {
    await db.update(users).set({ companyId: null, updatedAt: new Date() }).where(eq(users.companyId, id));
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Property Fee Categories
  async getFeeCategoriesByProperty(propertyId: number): Promise<FeeCategory[]> {
    return db.select().from(propertyFeeCategories)
      .where(eq(propertyFeeCategories.propertyId, propertyId))
      .orderBy(propertyFeeCategories.sortOrder);
  }

  async getAllFeeCategories(): Promise<FeeCategory[]> {
    return db.select().from(propertyFeeCategories)
      .orderBy(propertyFeeCategories.propertyId, propertyFeeCategories.sortOrder);
  }

  async createFeeCategory(data: InsertFeeCategory): Promise<FeeCategory> {
    const [cat] = await db.insert(propertyFeeCategories).values(data).returning();
    return cat;
  }

  async updateFeeCategory(id: number, data: UpdateFeeCategory): Promise<FeeCategory | undefined> {
    const [cat] = await db.update(propertyFeeCategories).set(data).where(eq(propertyFeeCategories.id, id)).returning();
    return cat;
  }

  async deleteFeeCategory(id: number): Promise<void> {
    await db.delete(propertyFeeCategories).where(eq(propertyFeeCategories.id, id));
  }

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

export const storage = new DatabaseStorage();
