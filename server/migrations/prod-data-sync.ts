import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../logger";
import * as fs from "fs";
import * as path from "path";

export async function runProdDataSync(): Promise<void> {
  const tag = "prod-data-sync";

  const check = await db.execute(sql`SELECT count(*) as cnt FROM design_themes WHERE name = 'Studio Noir'`);
  const rows = (check as any).rows ?? check;
  const count = parseInt(rows[0]?.cnt ?? "0", 10);

  if (count > 0) {
    logger.info(`${tag}: Studio Noir theme already exists — skipping full data sync`, "migration");
    return;
  }

  logger.info(`${tag}: Studio Noir theme missing — running full dev→prod data sync...`, "migration");

  const sqlFile = path.join(__dirname, "prod-data-sync.sql");
  if (!fs.existsSync(sqlFile)) {
    logger.info(`${tag}: SQL file not found at ${sqlFile}, skipping`, "migration");
    return;
  }

  const sqlContent = fs.readFileSync(sqlFile, "utf-8");
  await db.execute(sql.raw(sqlContent));

  logger.info(`${tag}: Full data sync complete — production now mirrors dev`, "migration");
}
