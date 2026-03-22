import { db } from "../db";
import { users, companies, properties, userGroupProperties } from "@shared/schema";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { userGroups } from "@shared/schema";
import { logger } from "../logger";
import seedUsersConfig from "../seed-users.json" with { type: "json" };


export async function seedUsers() {
  const adminSeed = seedUsersConfig.users.find(u => u.role === "admin");
  if (!adminSeed) return;

  const existingAdmin = await db.select().from(users).where(eq(users.email, adminSeed.email)).limit(1);
  if (existingAdmin.length === 0) {
    const password = process.env[adminSeed.envVar] || process.env.PASSWORD_DEFAULT;
    if (!password) {
      logger.warn(`${adminSeed.envVar} not set and no PASSWORD_DEFAULT. Skipping admin seed.`, "seed");
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.insert(users).values({
      email: adminSeed.email,
      passwordHash: hashedPassword,
      firstName: adminSeed.firstName,
      lastName: adminSeed.lastName,
      role: adminSeed.role,
    });
    logger.info(`Created admin user (email: ${adminSeed.email})`, "seed");
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
    const groupsToSeed = seedUsersConfig.seedGroups;

    const groupMap: Record<string, number> = {};
    for (const g of groupsToSeed) {
      const [created] = await db.insert(userGroups).values(g).returning();
      groupMap[g.name] = created.id;
    }

    const allUsers = await db.select().from(users);
    const assignments: Record<string, string> = seedUsersConfig.groupAssignments;

    for (const u of allUsers) {
      const groupName = assignments[u.email];
      if (groupName && groupMap[groupName]) {
        await db.update(users).set({ userGroupId: groupMap[groupName] }).where(eq(users.id, u.id));
      }
    }
    logger.info(`Seeded user groups: ${groupsToSeed.map(g => g.name).join(" + ")}`, "seed");
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

export async function seedUserGroupProperties() {
  const allGroups = await db.select().from(userGroups);
  const sharedGroupName = seedUsersConfig.sharedPropertyGroup;
  const primaryGroup = allGroups.find(g => g.name === sharedGroupName);
  if (!primaryGroup) {
    logger.info(`${sharedGroupName} not found, skipping user_group_properties seed`, "seed");
    return;
  }

  const sharedProps = await db.select({ id: properties.id })
    .from(properties)
    .where(isNull(properties.userId));

  if (sharedProps.length === 0) {
    logger.info("No shared properties found, skipping user_group_properties seed", "seed");
    return;
  }

  let linked = 0;
  for (const prop of sharedProps) {
    const existing = await db.select().from(userGroupProperties)
      .where(
        and(
          eq(userGroupProperties.userGroupId, primaryGroup.id),
          eq(userGroupProperties.propertyId, prop.id),
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userGroupProperties).values({
        userGroupId: primaryGroup.id,
        propertyId: prop.id,
      });
      linked++;
    }
  }
  if (linked > 0) {
    logger.info(`Linked ${linked} properties to '${primaryGroup.name}' user group`, "seed");
  }
}

export async function seedUserCompanyAssignments() {
  const usersWithCompany = await db.select().from(users).where(isNotNull(users.companyId)).limit(1);
  if (usersWithCompany.length > 0) {
    return;
  }

  const companyNameToEmail: Record<string, string[]> = seedUsersConfig.companyAssignments;

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
