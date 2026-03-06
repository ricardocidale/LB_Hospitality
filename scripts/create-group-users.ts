/**
 * Creates 10 new users (2 per boutique group) with random names, titles, emails, and group assignments.
 * Run with: npx tsx scripts/create-group-users.ts
 */
import bcrypt from "bcryptjs";
import { db } from "../server/db";
import { users, userGroups } from "../shared/schema";
import { eq } from "drizzle-orm";

const DEFAULT_PASSWORD = "Boutique2026!";

// Domain TLD choices per company — reflects brand personality
const NEW_USERS = [
  // ── The Mountain Company (group name) ──────────────────────
  {
    firstName: "Sofia",
    lastName: "Brennan",
    title: "Director of Operations",
    companyName: "The Mountain Company",
    groupName: "The Mountain Company",
    emailDomain: "themountaincompany.com",
    role: "partner" as const,
  },
  {
    firstName: "Liam",
    lastName: "Okafor",
    title: "Guest Experience Manager",
    companyName: "The Mountain Company",
    groupName: "The Mountain Company",
    emailDomain: "themountaincompany.com",
    role: "partner" as const,
  },

  // ── The Coastal House ───────────────────────────────────────
  {
    firstName: "Maya",
    lastName: "Hartwell",
    title: "Revenue Manager",
    companyName: "The Coastal House",
    groupName: "The Coastal House",
    emailDomain: "thecoastalhouse.com",
    role: "partner" as const,
  },
  {
    firstName: "Ethan",
    lastName: "Voss",
    title: "Front Office Director",
    companyName: "The Coastal House",
    groupName: "The Coastal House",
    emailDomain: "thecoastalhouse.com",
    role: "partner" as const,
  },

  // ── The Forest Lodge ────────────────────────────────────────
  {
    firstName: "Amara",
    lastName: "Silva",
    title: "Reservations Manager",
    companyName: "The Forest Lodge",
    groupName: "The Forest Lodge",
    emailDomain: "theforestlodge.org",
    role: "partner" as const,
  },
  {
    firstName: "Noah",
    lastName: "Castellan",
    title: "Food & Beverage Director",
    companyName: "The Forest Lodge",
    groupName: "The Forest Lodge",
    emailDomain: "theforestlodge.org",
    role: "partner" as const,
  },

  // ── The Desert Bloom ────────────────────────────────────────
  {
    firstName: "Isabelle",
    lastName: "Fontaine",
    title: "Marketing Director",
    companyName: "The Desert Bloom",
    groupName: "The Desert Bloom",
    emailDomain: "thedesertbloom.com",
    role: "partner" as const,
  },
  {
    firstName: "Marcus",
    lastName: "Tran",
    title: "Property Manager",
    companyName: "The Desert Bloom",
    groupName: "The Desert Bloom",
    emailDomain: "thedesertbloom.com",
    role: "partner" as const,
  },

  // ── The Urban Loft ──────────────────────────────────────────
  {
    firstName: "Zara",
    lastName: "Osei",
    title: "Chief of Staff",
    companyName: "The Urban Loft",
    groupName: "The Urban Loft",
    emailDomain: "theurbanloft.ai",
    role: "partner" as const,
  },
  {
    firstName: "Julian",
    lastName: "Mercer",
    title: "Finance Director",
    companyName: "The Urban Loft",
    groupName: "The Urban Loft",
    emailDomain: "theurbanloft.ai",
    role: "partner" as const,
  },
];

async function main() {
  console.log(`Hashing password...`);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // Build group name → id lookup
  const allGroups = await db.select().from(userGroups);
  const groupMap: Record<string, number> = {};
  for (const g of allGroups) {
    groupMap[g.name] = g.id;
  }
  console.log("Groups found:", Object.keys(groupMap).join(", "), "\n");

  console.log(`Creating 10 users (default password: ${DEFAULT_PASSWORD})\n`);

  for (const u of NEW_USERS) {
    const email = `${u.firstName.toLowerCase()}.${u.lastName.toLowerCase()}@${u.emailDomain}`;
    const groupId = groupMap[u.groupName];

    if (!groupId) {
      console.error(`  SKIP ${email} — group "${u.groupName}" not found`);
      continue;
    }

    try {
      const [created] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          role: u.role,
          firstName: u.firstName,
          lastName: u.lastName,
          company: u.companyName,
          title: u.title,
          userGroupId: groupId,
        })
        .onConflictDoNothing()
        .returning();

      if (created) {
        console.log(`  [${u.groupName}] ${u.firstName} ${u.lastName} <${email}> — ${u.title} (id=${created.id})`);
      } else {
        console.log(`  SKIPPED (already exists): ${email}`);
      }
    } catch (err) {
      console.error(`  FAILED ${email}:`, (err as Error).message);
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
