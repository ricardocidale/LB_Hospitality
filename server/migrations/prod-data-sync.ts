import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../logger";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const MIGRATION_KEY = "prod-data-sync-v1";

export async function runProdDataSync(): Promise<void> {
  const tag = "prod-data-sync";

  if (process.env.NODE_ENV !== "production") {
    logger.info(`${tag}: skipping in development`, "migration");
    return;
  }

  await db.execute(sql`CREATE TABLE IF NOT EXISTS _migrations_ran (key TEXT PRIMARY KEY, ran_at TIMESTAMPTZ DEFAULT now())`);

  const already = await db.execute(sql`SELECT 1 FROM _migrations_ran WHERE key = ${MIGRATION_KEY}`);
  const alreadyRan = ((already as any).rows ?? already).length > 0;

  if (alreadyRan) {
    logger.info(`${tag}: already ran (${MIGRATION_KEY}) — skipping`, "migration");
    return;
  }

  logger.info(`${tag}: first run — syncing dev data into production...`, "migration");

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const sqlFile = path.join(currentDir, "prod-data-sync.sql");
  if (!fs.existsSync(sqlFile)) {
    logger.info(`${tag}: SQL file not found at ${sqlFile}, skipping`, "migration");
    return;
  }

  const sqlContent = fs.readFileSync(sqlFile, "utf-8");
  await db.execute(sql.raw(sqlContent));

  await db.execute(sql`INSERT INTO _migrations_ran (key) VALUES (${MIGRATION_KEY})`);

  logger.info(`${tag}: complete — data sync finished, will not run again`, "migration");
}
