import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../logger";

const TAG = "fk-indexes-001";

/**
 * Adds indexes on foreign key columns used in cascade deletes and joins.
 * Safe to run multiple times — uses IF NOT EXISTS.
 */
export async function runFkIndexes001(): Promise<void> {
  const indexes = [
    `CREATE INDEX IF NOT EXISTS alert_rules_property_id_idx ON alert_rules (property_id)`,
    `CREATE INDEX IF NOT EXISTS notification_logs_alert_rule_id_idx ON notification_logs (alert_rule_id)`,
    `CREATE INDEX IF NOT EXISTS notification_logs_property_id_idx ON notification_logs (property_id)`,
  ];

  for (const ddl of indexes) {
    try {
      await db.execute(sql.raw(ddl));
    } catch (error: any) {
      if (error?.code === "42703" || error?.code === "42P01") {
        logger.info(`[${TAG}] Skipping index (column/table not yet created): ${ddl.slice(0, 60)}…`);
      } else {
        logger.error(`[${TAG}] Migration failed: ${String(error)}`, TAG);
        throw error;
      }
    }
  }
  logger.info(`[${TAG}] FK indexes migration complete`);
}
