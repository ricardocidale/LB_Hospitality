import { db } from "../db";
import { globalAssumptions, designThemes } from "@shared/schema";
import { isNull, eq, sql } from "drizzle-orm";

export async function runProdSync001(): Promise<void> {
  const tag = "[migration] prod-sync-001";

  const gaRows = await db
    .select({ id: globalAssumptions.id })
    .from(globalAssumptions)
    .where(isNull(globalAssumptions.userId))
    .orderBy(globalAssumptions.id);

  if (gaRows.length > 1) {
    const keepId = gaRows[gaRows.length - 1].id;
    const deleteIds = gaRows.filter(r => r.id !== keepId).map(r => r.id);

    for (const id of deleteIds) {
      await db.delete(globalAssumptions).where(eq(globalAssumptions.id, id));
    }

    console.log(`${tag}: deleted ${deleteIds.length} duplicate global_assumptions row(s) (kept id=${keepId}, deleted ids=${deleteIds.join(",")})`);
  } else {
    console.log(`${tag}: global_assumptions already clean (${gaRows.length} shared row)`);
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
          console.log(`${tag}: deleted duplicate design_theme "${name}" id=${id} (kept id=${keepId})`);
        }
      }
    }
  }

  if (dtDeleted === 0) {
    console.log(`${tag}: design_themes already clean (no duplicates)`);
  }

  console.log(`${tag}: complete`);
}
