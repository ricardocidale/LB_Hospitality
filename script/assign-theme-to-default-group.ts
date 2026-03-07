/**
 * Assign the "L+B Brand" theme to the default user group (isDefault=true).
 * Run: npx tsx scripts/assign-theme-to-default-group.ts
 */
import { db } from "../server/db";
import { userGroups, designThemes } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  // Find the L+B Brand theme
  const [theme] = await db
    .select({ id: designThemes.id, name: designThemes.name })
    .from(designThemes)
    .where(eq(designThemes.name, "L+B Brand"));

  if (!theme) {
    console.error('Theme "L+B Brand" not found. Run seed-lb-brand-theme.ts first.');
    process.exit(1);
  }

  // Find the default user group
  const [defaultGroup] = await db
    .select({ id: userGroups.id, name: userGroups.name, themeId: userGroups.themeId })
    .from(userGroups)
    .where(eq(userGroups.isDefault, true));

  if (!defaultGroup) {
    // Fall back to finding any group named "General"
    const [general] = await db
      .select({ id: userGroups.id, name: userGroups.name, themeId: userGroups.themeId })
      .from(userGroups)
      .where(eq(userGroups.name, "General"));

    if (!general) {
      console.log("No default/General user group found. All users will get the system default theme (L+B Brand) automatically via isDefault=true.");
      process.exit(0);
    }

    await db.update(userGroups).set({ themeId: theme.id }).where(eq(userGroups.id, general.id));
    console.log(`✓ Assigned theme "${theme.name}" (id=${theme.id}) to group "${general.name}" (id=${general.id})`);
    process.exit(0);
  }

  if (defaultGroup.themeId === theme.id) {
    console.log(`Group "${defaultGroup.name}" already uses theme "${theme.name}". Skipping.`);
    process.exit(0);
  }

  await db.update(userGroups).set({ themeId: theme.id }).where(eq(userGroups.id, defaultGroup.id));
  console.log(`✓ Assigned theme "${theme.name}" (id=${theme.id}) to default group "${defaultGroup.name}" (id=${defaultGroup.id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
