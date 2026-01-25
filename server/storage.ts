import { globalAssumptions, properties, type GlobalAssumptions, type Property, type InsertGlobalAssumptions, type InsertProperty, type UpdateProperty } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Global Assumptions
  getGlobalAssumptions(): Promise<GlobalAssumptions | undefined>;
  upsertGlobalAssumptions(data: InsertGlobalAssumptions): Promise<GlobalAssumptions>;
  
  // Properties
  getAllProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(data: InsertProperty): Promise<Property>;
  updateProperty(id: number, data: UpdateProperty): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Global Assumptions
  async getGlobalAssumptions(): Promise<GlobalAssumptions | undefined> {
    const [result] = await db.select().from(globalAssumptions).limit(1);
    return result || undefined;
  }

  async upsertGlobalAssumptions(data: InsertGlobalAssumptions): Promise<GlobalAssumptions> {
    // Check if exists
    const existing = await this.getGlobalAssumptions();
    
    if (existing) {
      // Update
      const [updated] = await db
        .update(globalAssumptions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(globalAssumptions.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert
      const [inserted] = await db
        .insert(globalAssumptions)
        .values(data)
        .returning();
      return inserted;
    }
  }

  // Properties
  async getAllProperties(): Promise<Property[]> {
    return await db.select().from(properties).orderBy(properties.createdAt);
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async createProperty(data: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values(data)
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
}

export const storage = new DatabaseStorage();
