import { db } from "../db";
import { users } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { userGroups } from "@shared/schema";

export async function seedUsers() {
  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin")).limit(1);
  if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      email: "admin",
      passwordHash: hashedPassword,
      firstName: "Ricardo",
      lastName: "Cidale",
      role: "admin",
    });
    console.log("Created admin user (email: admin, password: admin123)");
  }
}

export async function seedUserGroups() {
  const existing = await db.select().from(userGroups);
  const hasDefault = existing.some(g => g.isDefault);

  if (!hasDefault) {
    const existingGeneral = existing.find(g => g.name === "General");
    if (existingGeneral) {
      await db.update(userGroups).set({ isDefault: true }).where(eq(userGroups.id, existingGeneral.id));
      console.log("Marked existing 'General' group as default");
    } else {
      await db.insert(userGroups).values({ name: "General", isDefault: true });
      console.log("Created default 'General' user group");
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
      "admin": "The Norfolk AI Group",
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
    console.log("Seeded user groups: KIT Capital Group + The Norfolk AI Group");
  }

  const [defaultGroup] = await db.select().from(userGroups).where(eq(userGroups.isDefault, true));
  if (defaultGroup) {
    const unassigned = await db.select().from(users).where(isNull(users.userGroupId));
    if (unassigned.length > 0) {
      await db.update(users).set({ userGroupId: defaultGroup.id }).where(isNull(users.userGroupId));
      console.log(`Assigned ${unassigned.length} unassigned user(s) to '${defaultGroup.name}' group`);
    }
  }
}
