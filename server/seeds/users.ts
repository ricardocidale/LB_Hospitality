import { db } from "../db";
import { users, companies } from "@shared/schema";
import { eq, isNull, isNotNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { userGroups } from "@shared/schema";
import { logger } from "../logger";

export async function seedUsers() {
  const existingAdmin = await db.select().from(users).where(eq(users.email, "ricardo.cidale@norfolkgroup.io")).limit(1);
  if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash("admin456", 10);
    await db.insert(users).values({
      email: "ricardo.cidale@norfolkgroup.io",
      passwordHash: hashedPassword,
      firstName: "Ricardo",
      lastName: "Cidale",
      role: "admin",
    });
    logger.info("Created admin user (email: ricardo.cidale@norfolkgroup.io)", "seed");
  }
}

export async function seedUserGroups() {
  const existing = await db.select().from(userGroups);
  const hasDefault = existing.some(g => g.isDefault);

  if (!hasDefault) {
    const existingGeneral = existing.find(g => g.name === "General");
    if (existingGeneral) {
      await db.update(userGroups).set({ isDefault: true }).where(eq(userGroups.id, existingGeneral.id));
      logger.info("Marked existing 'General' group as default", "seed");
    } else {
      await db.insert(userGroups).values({ name: "General", isDefault: true });
      logger.info("Created default 'General' user group", "seed");
    }
  }

  if (existing.length === 0) {
    const groupsToSeed = [
      { name: "KIT Capital Group" },
      { name: "The Norfolk AI Group" },
    ];

    const groupMap: Record<string, number> = {};
    for (const g of groupsToSeed) {
      const [created] = await db.insert(userGroups).values(g).returning();
      groupMap[g.name] = created.id;
    }

    const allUsers = await db.select().from(users);
    const assignments: Record<string, string> = {
      "rosario@kitcapital.com": "KIT Capital Group",
      "kit@kitcapital.com": "KIT Capital Group",
      "lemazniku@icloud.com": "KIT Capital Group",
      "ricardo.cidale@norfolkgroup.io": "The Norfolk AI Group",
      "checker@norfolkgroup.io": "The Norfolk AI Group",
      "wlaruffa@gmail.com": "The Norfolk AI Group",
      "reynaldo.fagundes@norfolk.ai": "The Norfolk AI Group",
    };

    for (const u of allUsers) {
      const groupName = assignments[u.email];
      if (groupName && groupMap[groupName]) {
        await db.update(users).set({ userGroupId: groupMap[groupName] }).where(eq(users.id, u.id));
      }
    }
    logger.info("Seeded user groups: KIT Capital Group + The Norfolk AI Group", "seed");
  }

  const [defaultGroup] = await db.select().from(userGroups).where(eq(userGroups.isDefault, true));
  if (defaultGroup) {
    const unassigned = await db.select().from(users).where(isNull(users.userGroupId));
    if (unassigned.length > 0) {
      await db.update(users).set({ userGroupId: defaultGroup.id }).where(isNull(users.userGroupId));
      logger.info(`Assigned ${unassigned.length} unassigned user(s) to '${defaultGroup.name}' group`, "seed");
    }
  }
}

export async function seedUserCompanyAssignments() {
  const companyNameToEmail: Record<string, string[]> = {
    "The Norfolk AI Group": ["ricardo.cidale@norfolkgroup.io", "checker@norfolkgroup.io", "reynaldo.fagundes@norfolk.ai"],
    "KIT Capital": ["kit@kitcapital.com", "rosario@kitcapital.com", "lemazniku@icloud.com"],
    "Numeratti Endeavors": ["leslie@cidale.com"],
  };

  const allCompanies = await db.select().from(companies);
  const companyMap: Record<string, number> = {};
  for (const c of allCompanies) {
    companyMap[c.name] = c.id;
  }

  let assigned = 0;
  for (const [companyName, emails] of Object.entries(companyNameToEmail)) {
    const companyId = companyMap[companyName];
    if (!companyId) continue;
    for (const email of emails) {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (user && user.companyId !== companyId) {
        await db.update(users).set({ companyId }).where(eq(users.id, user.id));
        assigned++;
      }
    }
  }

  if (assigned > 0) {
    logger.info(`Assigned ${assigned} user(s) to their companies`, "seed");
  }
}
