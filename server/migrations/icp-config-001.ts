import { sql } from "drizzle-orm";
import { db } from "../db";
import { log } from "../logging";

export async function runIcpConfigMigration() {
  await db.execute(sql`
    ALTER TABLE global_assumptions
    ADD COLUMN IF NOT EXISTS icp_config jsonb
  `);
  log("info", "[icp-config-001] Migration complete", "server");
}
