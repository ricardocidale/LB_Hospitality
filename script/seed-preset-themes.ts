import { db } from "../server/db";
import { designThemes } from "../shared/schema";
import { eq } from "drizzle-orm";
import { PRESET_THEMES } from "../client/src/lib/theme/presets";

async function main() {
  let created = 0;
  let skipped = 0;

  for (const theme of PRESET_THEMES) {
    const existing = await db
      .select()
      .from(designThemes)
      .where(eq(designThemes.name, theme.name));

    if (existing.length > 0) {
      console.log(`  skip  "${theme.name}" (already exists, id=${existing[0].id})`);
      skipped++;
      continue;
    }

    const [inserted] = await db
      .insert(designThemes)
      .values(theme)
      .returning();

    console.log(`  ✓     "${inserted.name}" (id=${inserted.id})`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed preset themes:", err);
  process.exit(1);
});
