import { sql } from "drizzle-orm";
import { db } from "../db";

/**
 * Drop all Plaid-related tables. Plaid integration has been removed from the platform.
 * Tables: plaid_categorization_cache, plaid_transactions, plaid_connections
 * Order matters due to foreign key constraints.
 */
export async function runDropPlaid001() {
  try {
    await db.execute(sql`DROP TABLE IF EXISTS plaid_categorization_cache CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS plaid_transactions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS plaid_connections CASCADE`);
    console.info("[INFO] [migration] drop-plaid-001: Plaid tables dropped");
  } catch (error: any) {
    // Tables may already be gone — that's fine
    if (!error.message?.includes("does not exist")) {
      console.error("[ERROR] [migration] drop-plaid-001 failed:", error.message);
    }
  }
}
