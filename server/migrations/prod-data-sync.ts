import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../logger";
import * as fs from "fs";
import * as path from "path";

const MIGRATION_KEY = "prod-data-sync-v1";

function findSqlFile(): string | null {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "server", "migrations", "prod-data-sync.sql"),
    path.join(cwd, "dist", "server", "migrations", "prod-data-sync.sql"),
    path.join(cwd, "prod-data-sync.sql"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

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

  const sqlFile = findSqlFile();
  if (!sqlFile) {
    logger.info(`${tag}: SQL file not found, skipping`, "migration");
    return;
  }

  logger.info(`${tag}: first run — syncing dev data into production from ${sqlFile}...`, "migration");

  let sqlContent = fs.readFileSync(sqlFile, "utf-8");
  sqlContent = sqlContent
    .replace(/^\s*BEGIN\s*;\s*$/m, "")
    .replace(/^\s*COMMIT\s*;\s*$/m, "");

  await db.execute(sql.raw(sqlContent));

  await db.execute(sql`INSERT INTO _migrations_ran (key) VALUES (${MIGRATION_KEY})`);

  logger.info(`${tag}: complete — data sync finished, will not run again`, "migration");
}
