/**
 * Fix group branding gaps:
 * 1. Assign L+B Brand theme to every group with no theme
 * 2. Assign Norfolk AI Blue logo to Norfolk AI Group
 * 3. Assign HBG default logo to KIT Group
 *
 * Run: npx tsx scripts/fix-group-branding.ts
 */
import { db } from "../server/db";
import { userGroups, designThemes, logos } from "../shared/schema";
import { eq, isNull } from "drizzle-orm";

async function main() {
  // Resolve IDs
  const [lbBrand] = await db.select().from(designThemes).where(eq(designThemes.name, "L+B Brand"));
  if (!lbBrand) { console.error("L+B Brand theme not found"); process.exit(1); }

  const [norfolkLogo] = await db.select().from(logos).where(eq(logos.name, "Norfolk AI - Blue"));
  const [hbgLogo] = await db.select().from(logos).where(eq(logos.isDefault, true));

  const allGroups = await db.select().from(userGroups);

  let updated = 0;

  for (const group of allGroups) {
    const updates: Record<string, number | null> = {};

    // Give every group without a theme the L+B Brand default
    if (!group.themeId) {
      updates.themeId = lbBrand.id;
    }

    // Norfolk AI Group → Norfolk AI Blue logo
    if (group.name === "The Norfolk AI Group" && !group.logoId && norfolkLogo) {
      updates.logoId = norfolkLogo.id;
    }

    // KIT Group → HBG default logo (fallback branding until a KIT logo is uploaded)
    if (group.name === "The KIT Group" && !group.logoId && hbgLogo) {
      updates.logoId = hbgLogo.id;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(userGroups).set(updates).where(eq(userGroups.id, group.id));
      console.log(`✓ ${group.name}: updated ${JSON.stringify(updates)}`);
      updated++;
    } else {
      console.log(`  ${group.name}: already fully configured`);
    }
  }

  console.log(`\nDone. ${updated} group(s) updated.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
