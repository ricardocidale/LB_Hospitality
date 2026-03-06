/**
 * Creates 10 new users (2 per boutique group) with random names, titles, emails, and group assignments.
 * Run with: npx tsx scripts/create-group-users.ts
 */
import bcrypt from "bcryptjs";
import { db } from "../server/db";
import { users, userGroups } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

const DEFAULT_PASSWORD = "Boutique2026!";
const USER_IDS_TO_DELETE = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const NEW_USERS = [
  // ── The Mountain Company — South Asian & West African ───────
  {
    firstName: "Priya",
    lastName: "Nair",
    title: "Director of Operations",
    companyName: "The Mountain Company",
    groupName: "The Mountain Company",
    emailDomain: "themountaincompany.com",
    role: "partner" as const,
  },
  {
    firstName: "Kwame",
    lastName: "Asante",
    title: "Guest Experience Manager",
    companyName: "The Mountain Company",
    groupName: "The Mountain Company",
    emailDomain: "themountaincompany.com",
    role: "partner" as const,
  },

  // ── The Coastal House — Latina & Japanese ──────────────────
  {
    firstName: "Valentina",
    lastName: "Reyes",
    title: "Revenue Manager",
    companyName: "The Coastal House",
    groupName: "The Coastal House",
    emailDomain: "thecoastalhouse.com",
    role: "partner" as const,
  },
  {
    firstName: "Hiroshi",
    lastName: "Tanaka",
    title: "Front Office Director",
    companyName: "The Coastal House",
    groupName: "The Coastal House",
    emailDomain: "thecoastalhouse.com",
    role: "partner" as const,
  },

  // ── The Forest Lodge — Middle Eastern & Brazilian ──────────
  {
    firstName: "Fatima",
    lastName: "Al-Rashid",
    title: "Reservations Manager",
    companyName: "The Forest Lodge",
    groupName: "The Forest Lodge",
    emailDomain: "theforestlodge.org",
    role: "partner" as const,
  },
  {
    firstName: "Mateus",
    lastName: "Oliveira",
    title: "Food & Beverage Director",
    companyName: "The Forest Lodge",
    groupName: "The Forest Lodge",
    emailDomain: "theforestlodge.org",
    role: "partner" as const,
  },

  // ── The Desert Bloom — Senegalese & Mexican ────────────────
  {
    firstName: "Aisha",
    lastName: "Diallo",
    title: "Marketing Director",
    companyName: "The Desert Bloom",
    groupName: "The Desert Bloom",
    emailDomain: "thedesertbloom.com",
    role: "partner" as const,
  },
  {
    firstName: "Tomás",
    lastName: "Herrera",
    title: "Property Manager",
    companyName: "The Desert Bloom",
    groupName: "The Desert Bloom",
    emailDomain: "thedesertbloom.com",
    role: "partner" as const,
  },

  // ── The Urban Loft — Chinese & Polish ──────────────────────
  {
    firstName: "Mei-Ling",
    lastName: "Chen",
    title: "Chief of Staff",
    companyName: "The Urban Loft",
    groupName: "The Urban Loft",
    emailDomain: "theurbanloft.ai",
    role: "partner" as const,
  },
  {
    firstName: "Aleksander",
    lastName: "Nowak",
    title: "Finance Director",
    companyName: "The Urban Loft",
    groupName: "The Urban Loft",
    emailDomain: "theurbanloft.ai",
    role: "partner" as const,
  },
];

async function main() {
  console.log("Deleting previous users...");
  await db.delete(users).where(inArray(users.id, USER_IDS_TO_DELETE));
  console.log("  Deleted user ids:", USER_IDS_TO_DELETE, "\n");

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
    const normalize = (s: string) =>
      s.toLowerCase()
       .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
       .replace(/[^a-z0-9]/g, "");                        // remove hyphens, spaces, dots
    const email = `${normalize(u.firstName)}.${normalize(u.lastName)}@${u.emailDomain}`;
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
