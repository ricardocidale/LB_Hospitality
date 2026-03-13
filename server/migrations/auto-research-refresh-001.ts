import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../logger";

const TAG = "auto-research-refresh-001";

export async function runMigration(): Promise<void> {
  try {
    await db.execute(sql`
      ALTER TABLE global_assumptions
      ADD COLUMN IF NOT EXISTS auto_research_refresh_enabled boolean NOT NULL DEFAULT true
    `);
    logger.info(`[${TAG}] auto_research_refresh_enabled column added (or already existed)`);
  } catch (error: any) {
    logger.error(`[${TAG}] Migration failed: ${String(error)}`, TAG);
    throw error;
  }
}
