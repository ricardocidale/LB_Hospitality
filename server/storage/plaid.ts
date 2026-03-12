import { db } from "../db";
import { plaidConnections, plaidTransactions, plaidCategorizationCache } from "@shared/schema";
import type { PlaidConnection, InsertPlaidConnection, PlaidTransaction, InsertPlaidTransaction } from "@shared/schema";
import { eq, and, desc, gte, lte, inArray, sql } from "drizzle-orm";

export class PlaidStorage {
  async createPlaidConnection(data: InsertPlaidConnection): Promise<PlaidConnection> {
    const [connection] = await db.insert(plaidConnections).values(data).returning();
    return connection;
  }

  async getPlaidConnectionsByProperty(propertyId: number): Promise<PlaidConnection[]> {
    return db.select().from(plaidConnections)
      .where(and(eq(plaidConnections.propertyId, propertyId), eq(plaidConnections.isActive, true)))
      .orderBy(desc(plaidConnections.createdAt));
  }

  async getPlaidConnectionById(id: number): Promise<PlaidConnection | undefined> {
    const [connection] = await db.select().from(plaidConnections).where(eq(plaidConnections.id, id));
    return connection;
  }

  async getPlaidConnectionByItemId(itemId: string): Promise<PlaidConnection | undefined> {
    const [connection] = await db.select().from(plaidConnections).where(eq(plaidConnections.itemId, itemId));
    return connection;
  }

  async updatePlaidConnectionSync(id: number, syncCursor: string, lastSyncedAt: Date): Promise<void> {
    await db.update(plaidConnections)
      .set({ syncCursor, lastSyncedAt })
      .where(eq(plaidConnections.id, id));
  }

  async updatePlaidConnectionAccounts(id: number, accountIds: string[], accountNames: string[]): Promise<void> {
    await db.update(plaidConnections)
      .set({ accountIds, accountNames })
      .where(eq(plaidConnections.id, id));
  }

  async updatePlaidConnectionToken(id: number, encryptedAccessToken: string, accessTokenIv: string, accessTokenTag: string): Promise<void> {
    await db.update(plaidConnections)
      .set({ encryptedAccessToken, accessTokenIv, accessTokenTag })
      .where(eq(plaidConnections.id, id));
  }

  async deletePlaidConnection(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(plaidTransactions).where(eq(plaidTransactions.connectionId, id));
      await tx.delete(plaidConnections).where(eq(plaidConnections.id, id));
    });
  }

  async createPlaidTransactions(data: InsertPlaidTransaction[]): Promise<PlaidTransaction[]> {
    if (data.length === 0) return [];
    return db.insert(plaidTransactions).values(data).onConflictDoNothing().returning();
  }

  async getPlaidTransactionsByProperty(propertyId: number, startDate?: string, endDate?: string): Promise<PlaidTransaction[]> {
    const conditions = [eq(plaidTransactions.propertyId, propertyId)];
    if (startDate) conditions.push(gte(plaidTransactions.date, startDate));
    if (endDate) conditions.push(lte(plaidTransactions.date, endDate));

    return db.select().from(plaidTransactions)
      .where(and(...conditions))
      .orderBy(desc(plaidTransactions.date));
  }

  async removePlaidTransactionsByIds(plaidTransactionIds: string[]): Promise<void> {
    if (plaidTransactionIds.length === 0) return;
    await db.delete(plaidTransactions)
      .where(inArray(plaidTransactions.plaidTransactionId, plaidTransactionIds));
  }

  async updatePlaidTransactionCategories(updates: { id: number; usaliCategory: string; usaliDepartment: string; categorizationMethod: string }[]): Promise<void> {
    for (const u of updates) {
      await db.update(plaidTransactions)
        .set({ usaliCategory: u.usaliCategory, usaliDepartment: u.usaliDepartment, categorizationMethod: u.categorizationMethod })
        .where(eq(plaidTransactions.id, u.id));
    }
  }

  async getCategorizationCache(patterns: string[]): Promise<{ descriptionPattern: string; usaliCategory: string; usaliDepartment: string }[]> {
    if (patterns.length === 0) return [];
    return db.select({
      descriptionPattern: plaidCategorizationCache.descriptionPattern,
      usaliCategory: plaidCategorizationCache.usaliCategory,
      usaliDepartment: plaidCategorizationCache.usaliDepartment,
    }).from(plaidCategorizationCache)
      .where(inArray(plaidCategorizationCache.descriptionPattern, patterns));
  }

  async upsertCategorizationCache(entries: { descriptionPattern: string; usaliCategory: string; usaliDepartment: string; source: string }[]): Promise<void> {
    if (entries.length === 0) return;
    await db.insert(plaidCategorizationCache)
      .values(entries)
      .onConflictDoUpdate({
        target: plaidCategorizationCache.descriptionPattern,
        set: {
          usaliCategory: sql`excluded.usali_category`,
          usaliDepartment: sql`excluded.usali_department`,
          source: sql`excluded.source`,
        },
      });
  }
}
