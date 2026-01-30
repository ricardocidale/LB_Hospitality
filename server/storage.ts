import { globalAssumptions, properties, users, sessions, scenarios, type GlobalAssumptions, type Property, type InsertGlobalAssumptions, type InsertProperty, type UpdateProperty, type User, type InsertUser, type Session, type Scenario, type InsertScenario, type UpdateScenario } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";

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
      return await db.select().from(properties).where(eq(properties.userId, userId)).orderBy(properties.createdAt);
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
}

export const storage = new DatabaseStorage();
