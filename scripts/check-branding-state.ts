import { db } from "../server/db";
import { userGroups, designThemes, logos, users } from "../shared/schema";

async function main() {
  const groups = await db.select().from(userGroups);
  const themes = await db.select().from(designThemes);
  const allLogos = await db.select().from(logos);
  const allUsers = await db.select().from(users);

  console.log("\n=== THEMES ===");
  for (const t of themes) console.log(`  [${t.id}] ${t.name}${t.isDefault ? " (DEFAULT)" : ""}`);

  console.log("\n=== LOGOS ===");
  for (const l of allLogos) console.log(`  [${l.id}] ${l.name}${l.isDefault ? " (DEFAULT)" : ""} — ${l.url}`);

  console.log("\n=== USER GROUPS ===");
  for (const g of groups) {
    const themeName = themes.find(t => t.id === g.themeId)?.name ?? "none";
    const logoName = allLogos.find(l => l.id === g.logoId)?.name ?? "none";
    console.log(`  [${g.id}] ${g.name}${g.isDefault ? " (DEFAULT)" : ""}`);
    console.log(`       theme: ${themeName} (id=${g.themeId ?? "null"})`);
    console.log(`       logo:  ${logoName} (id=${g.logoId ?? "null"})`);
  }

  console.log("\n=== USERS ===");
  for (const u of allUsers) {
    const groupName = groups.find(g => g.id === u.userGroupId)?.name ?? "none";
    console.log(`  [${u.id}] ${u.name} <${u.email}> — group: ${groupName} (id=${u.userGroupId ?? "null"}), themeOverride: ${u.selectedThemeId ?? "none"}`);
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
