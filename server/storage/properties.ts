import { properties, type Property, type InsertProperty, type UpdateProperty } from "@shared/schema";
import { db } from "../db";
import { eq, or, isNull } from "drizzle-orm";

export class PropertyStorage {
  /**
   * Get all properties visible to a user. This includes properties they own
   * (userId matches) AND shared/seed properties (userId is null). Shared
   * properties are the initial portfolio that all users can see.
   */
  async getAllProperties(userId?: number): Promise<Property[]> {
    if (userId) {
      return await db.select().from(properties)
        .where(or(eq(properties.userId, userId), isNull(properties.userId)))
        .orderBy(properties.createdAt);
    }
    return await db.select().from(properties).orderBy(properties.createdAt);
  }

  /** Fetch a single property by ID. Returns undefined if not found. */
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  /** Insert a new property into the portfolio. Returns the created record with generated ID. */
  async createProperty(data: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values(data as typeof properties.$inferInsert)
      .returning();
    return property;
  }

  /** Partially update a property's fields. Returns the updated record, or undefined if not found. */
  async updateProperty(id: number, data: UpdateProperty): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  /** Remove a property from the portfolio. Fee categories cascade-delete via FK. */
  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }
}
