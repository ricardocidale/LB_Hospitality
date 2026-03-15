import { db } from "../db";
import { globalAssumptions, designThemes, properties } from "@shared/schema";
import { isNull, eq, isNotNull, sql, desc } from "drizzle-orm";
import { logger } from "../logger";

async function ensureColumn(table: string, column: string, definition: string): Promise<void> {
  const check = await db.execute(sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = ${table} AND column_name = ${column}
  `);
  if ((check as any).rows?.length === 0 || (Array.isArray(check) && check.length === 0)) {
    await db.execute(sql`ALTER TABLE ${sql.identifier(table)} ADD COLUMN ${sql.identifier(column)} ${sql.raw(definition)}`);
    logger.info(`added ${table}.${column}`, "migration");
  }
}

export async function runProdSync001(): Promise<void> {
  const tag = "prod-sync-001";

  await ensureColumn("users", "hide_tour_prompt", "boolean NOT NULL DEFAULT false");

  const gaRows = await db
    .select({ id: globalAssumptions.id })
    .from(globalAssumptions)
    .where(isNull(globalAssumptions.userId))
    .orderBy(desc(globalAssumptions.id));

  if (gaRows.length > 1) {
    const keepId = gaRows[gaRows.length - 1].id;
    const deleteIds = gaRows.filter(r => r.id !== keepId).map(r => r.id);

    for (const id of deleteIds) {
      await db.delete(globalAssumptions).where(eq(globalAssumptions.id, id));
    }

    logger.info(`${tag}: deleted ${deleteIds.length} duplicate global_assumptions row(s) (kept id=${keepId}, deleted ids=${deleteIds.join(",")})`, "migration");
  } else {
    logger.info(`${tag}: global_assumptions already clean (${gaRows.length} shared row)`, "migration");
  }

  const ownedProps = await db
    .select({ id: properties.id, name: properties.name, userId: properties.userId })
    .from(properties)
    .where(isNotNull(properties.userId));

  if (ownedProps.length > 0) {
    for (const prop of ownedProps) {
      await db.update(properties).set({ userId: null }).where(eq(properties.id, prop.id));
      logger.info(`${tag}: set property "${prop.name}" (id=${prop.id}) userId from ${prop.userId} to NULL (shared)`, "migration");
    }
  } else {
    logger.info(`${tag}: all properties already shared (userId=NULL)`, "migration");
  }

  const dtRows = await db
    .select({ id: designThemes.id, name: designThemes.name })
    .from(designThemes)
    .orderBy(designThemes.id);

  const nameCount: Record<string, number[]> = {};
  for (const row of dtRows) {
    if (!nameCount[row.name]) nameCount[row.name] = [];
    nameCount[row.name].push(row.id);
  }

  let dtDeleted = 0;
  for (const [name, ids] of Object.entries(nameCount)) {
    if (ids.length > 1) {
      const keepId = ids[ids.length - 1];
      for (const id of ids) {
        if (id !== keepId) {
          await db.delete(designThemes).where(eq(designThemes.id, id));
          dtDeleted++;
          logger.info(`${tag}: deleted duplicate design_theme "${name}" id=${id} (kept id=${keepId})`, "migration");
        }
      }
    }
  }

  if (dtDeleted === 0) {
    logger.info(`${tag}: design_themes already clean (no duplicates)`, "migration");
  }

  logger.info(`${tag}: complete`, "migration");
}
