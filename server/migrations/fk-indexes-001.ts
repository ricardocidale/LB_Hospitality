import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../logger";

const TAG = "fk-indexes-001";

/**
 * Adds indexes on foreign key columns used in cascade deletes and joins.
 * Safe to run multiple times — uses IF NOT EXISTS.
 */
export async function runFkIndexes001(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS alert_rules_property_id_idx ON alert_rules (property_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS notification_logs_alert_rule_id_idx ON notification_logs (alert_rule_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS notification_logs_property_id_idx ON notification_logs (property_id)
    `);

    logger.info(`[${TAG}] FK indexes created (or already existed)`);
  } catch (error: any) {
    logger.error(`[${TAG}] Migration failed: ${String(error)}`, TAG);
    throw error;
  }
}
