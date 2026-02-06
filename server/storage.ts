import { globalAssumptions, properties, users, sessions, scenarios, loginLogs, designThemes, marketResearch, prospectiveProperties, savedSearches, type GlobalAssumptions, type Property, type InsertGlobalAssumptions, type InsertProperty, type UpdateProperty, type User, type InsertUser, type Session, type Scenario, type InsertScenario, type UpdateScenario, type LoginLog, type InsertLoginLog, type DesignTheme, type InsertDesignTheme, type MarketResearch, type InsertMarketResearch, type ProspectiveProperty, type InsertProspectiveProperty, type SavedSearch, type InsertSavedSearch } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, gte, desc, or, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  updateUserPassword(id: number, passwordHash: string): Promise<void>;
  updateUserProfile(id: number, data: { name?: string; email?: string; company?: string; title?: string }): Promise<User>;
  
  // Sessions
  createSession(userId: number, sessionId: string, expiresAt: Date): Promise<Session>;
  getSession(sessionId: string): Promise<(Session & { user: User }) | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  deleteUserSessions(userId: number): Promise<void>;
  
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
  loadScenario(userId: number, savedAssumptions: any, savedProperties: any[]): Promise<void>;
  
  // Login Logs
  createLoginLog(userId: number, sessionId: string, ipAddress?: string): Promise<LoginLog>;
  updateLogoutTime(sessionId: string): Promise<void>;
  getLoginLogs(): Promise<(LoginLog & { user: User })[]>;
  
  // Design Themes
  getAllDesignThemes(): Promise<DesignTheme[]>;
  getActiveDesignTheme(): Promise<DesignTheme | undefined>;
  getDesignTheme(id: number): Promise<DesignTheme | undefined>;
  createDesignTheme(data: InsertDesignTheme): Promise<DesignTheme>;
  updateDesignTheme(id: number, data: Partial<InsertDesignTheme>): Promise<DesignTheme | undefined>;
  deleteDesignTheme(id: number): Promise<void>;
  setActiveDesignTheme(id: number): Promise<void>;
  
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
        title: data.title,
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
    await db.delete(sessions).where(eq(sessions.userId, id));
  }

  async updateUserProfile(id: number, data: { name?: string; email?: string; company?: string; title?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
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

  async loadScenario(userId: number, savedAssumptions: any, savedProperties: any[]): Promise<void> {
    await db.transaction(async (tx) => {
      // Restore global assumptions
      const existing = await tx.select().from(globalAssumptions)
        .where(eq(globalAssumptions.userId, userId));
      if (existing.length > 0) {
        await tx.update(globalAssumptions).set(savedAssumptions)
          .where(eq(globalAssumptions.userId, userId));
      } else {
        await tx.insert(globalAssumptions).values({ ...savedAssumptions, userId });
      }

      // Delete current properties atomically, then restore saved ones
      const currentProps = await tx.select().from(properties)
        .where(or(eq(properties.userId, userId), isNull(properties.userId)));
      for (const prop of currentProps) {
        await tx.delete(properties).where(eq(properties.id, prop.id));
      }
      for (const prop of savedProperties) {
        const { id, createdAt, updatedAt, ...propData } = prop;
        await tx.insert(properties).values({ ...propData, userId });
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
  
  // Design Themes
  async getAllDesignThemes(): Promise<DesignTheme[]> {
    return await db.select().from(designThemes).orderBy(designThemes.createdAt);
  }
  
  async getActiveDesignTheme(): Promise<DesignTheme | undefined> {
    const [theme] = await db.select().from(designThemes).where(eq(designThemes.isActive, true));
    return theme || undefined;
  }
  
  async getDesignTheme(id: number): Promise<DesignTheme | undefined> {
    const [theme] = await db.select().from(designThemes).where(eq(designThemes.id, id));
    return theme || undefined;
  }
  
  async createDesignTheme(data: InsertDesignTheme): Promise<DesignTheme> {
    const [theme] = await db
      .insert(designThemes)
      .values({
        name: data.name,
        description: data.description,
        isActive: data.isActive || false,
        colors: data.colors,
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
    await db.delete(designThemes).where(eq(designThemes.id, id));
  }
  
  async setActiveDesignTheme(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Deactivate all themes, then activate the selected one
      await tx.update(designThemes).set({ isActive: false });
      await tx.update(designThemes).set({ isActive: true }).where(eq(designThemes.id, id));
    });
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
}

export const storage = new DatabaseStorage();
