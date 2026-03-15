import { db } from "../db";
import { users, properties, propertyFeeCategories, scenarios, marketResearch } from "@shared/schema";
import { eq, sql, notInArray, and, ne } from "drizzle-orm";
import { logger } from "../logger";

const TAG = "prod-sync-002";

const CANONICAL_USERS: Record<string, { role: "admin" | "partner" | "checker"; userGroupId: number }> = {
  "ricardo.cidale@norfolkgroup.io": { role: "admin",   userGroupId: 2 },
  "checker@norfolkgroup.io":       { role: "checker", userGroupId: 2 },
  "reynaldo.fagundes@norfolk.ai":  { role: "partner", userGroupId: 2 },
  "kit@kitcapital.com":            { role: "partner", userGroupId: 1 },
  "rosario@kitcapital.com":        { role: "partner", userGroupId: 1 },
  "lemazniku@icloud.com":          { role: "partner", userGroupId: 1 },
  "leslie@cidale.com":             { role: "partner", userGroupId: 3 },
  "wlaruffa@gmail.com":            { role: "partner", userGroupId: 3 },
};

const CANONICAL_FEE_CATEGORIES = [
  { name: "Marketing",                rate: 0.02, sortOrder: 1 },
  { name: "Technology & Reservations", rate: 0.025, sortOrder: 2 },
  { name: "Accounting",               rate: 0.015, sortOrder: 3 },
  { name: "Revenue Management",       rate: 0.01, sortOrder: 4 },
  { name: "General Management",       rate: 0.015, sortOrder: 5 },
];

export interface SyncResult {
  usersFixed: number;
  orphanedFeeCategoriesDeleted: number;
  orphanedResearchDeleted: number;
  scenariosCleaned: number;
  feeCategoriesFixed: number;
}

export async function runProdSync002(): Promise<SyncResult> {
  const result: SyncResult = {
    usersFixed: 0,
    orphanedFeeCategoriesDeleted: 0,
    orphanedResearchDeleted: 0,
    scenariosCleaned: 0,
    feeCategoriesFixed: 0,
  };

  // ── 1. Enforce canonical user roles and groups ──
  const allUsers = await db.select({ id: users.id, email: users.email, role: users.role, userGroupId: users.userGroupId }).from(users);
  for (const user of allUsers) {
    const canonical = CANONICAL_USERS[user.email];
    if (!canonical) continue;

    const fixes: string[] = [];
    if (user.role !== canonical.role) {
      fixes.push(`role ${user.role}→${canonical.role}`);
    }
    if (user.userGroupId !== canonical.userGroupId) {
      fixes.push(`group ${user.userGroupId}→${canonical.userGroupId}`);
    }

    if (fixes.length > 0) {
      await db.update(users).set({
        role: canonical.role,
        userGroupId: canonical.userGroupId,
      }).where(eq(users.id, user.id));
      logger.info(`${TAG}: fixed user "${user.email}" — ${fixes.join(", ")}`, "migration");
      result.usersFixed++;
    }
  }
  if (result.usersFixed === 0) {
    logger.info(`${TAG}: all user roles/groups already canonical`, "migration");
  }

  // ── 2. Clean orphaned fee categories ──
  const validPropertyIds = (await db.select({ id: properties.id }).from(properties)).map(r => r.id);
  if (validPropertyIds.length > 0) {
    const orphanedFees = await db.delete(propertyFeeCategories)
      .where(notInArray(propertyFeeCategories.propertyId, validPropertyIds))
      .returning({ id: propertyFeeCategories.id });
    result.orphanedFeeCategoriesDeleted = orphanedFees.length;
    if (orphanedFees.length > 0) {
      logger.info(`${TAG}: deleted ${orphanedFees.length} orphaned fee category row(s)`, "migration");
    }
  }

  // ── 3. Clean orphaned market research ──
  if (validPropertyIds.length > 0) {
    const orphanedResearch = await db.delete(marketResearch)
      .where(and(
        sql`${marketResearch.propertyId} IS NOT NULL`,
        notInArray(marketResearch.propertyId, validPropertyIds)
      ))
      .returning({ id: marketResearch.id });
    result.orphanedResearchDeleted = orphanedResearch.length;
    if (orphanedResearch.length > 0) {
      logger.info(`${TAG}: deleted ${orphanedResearch.length} orphaned market research row(s)`, "migration");
    }
  }

  // ── 4. Scenario cleanup ──
  // 4a. Delete test artifacts
  const testScenarios = await db.delete(scenarios)
    .where(eq(scenarios.name, "Test Verification Scenario"))
    .returning({ id: scenarios.id });
  if (testScenarios.length > 0) {
    logger.info(`${TAG}: deleted ${testScenarios.length} test verification scenario(s)`, "migration");
    result.scenariosCleaned += testScenarios.length;
  }

  // 4b. Delete "Base" scenarios owned by non-admin users
  const adminUsers = allUsers.filter(u => u.role === "admin" || CANONICAL_USERS[u.email]?.role === "admin");
  const adminIds = adminUsers.map(u => u.id);
  if (adminIds.length > 0) {
    const nonAdminBase = await db.delete(scenarios)
      .where(and(
        eq(scenarios.name, "Base"),
        notInArray(scenarios.userId, adminIds)
      ))
      .returning({ id: scenarios.id, userId: scenarios.userId });
    if (nonAdminBase.length > 0) {
      logger.info(`${TAG}: deleted ${nonAdminBase.length} "Base" scenario(s) from non-admin users`, "migration");
      result.scenariosCleaned += nonAdminBase.length;
    }
  }

  // 4c. Remove duplicate "Development" scenarios per user (keep newest)
  const devScenarios = await db.select({
    id: scenarios.id,
    userId: scenarios.userId,
    createdAt: scenarios.createdAt,
  }).from(scenarios).where(eq(scenarios.name, "Development"));

  const byUser = new Map<number, { id: number; createdAt: Date | null }[]>();
  for (const s of devScenarios) {
    const list = byUser.get(s.userId) || [];
    list.push({ id: s.id, createdAt: s.createdAt });
    byUser.set(s.userId, list);
  }

  for (const [userId, list] of Array.from(byUser)) {
    if (list.length <= 1) continue;
    list.sort((a: { id: number; createdAt: Date | null }, b: { id: number; createdAt: Date | null }) => {
      const ta = a.createdAt ? a.createdAt.getTime() : 0;
      const tb = b.createdAt ? b.createdAt.getTime() : 0;
      return tb - ta;
    });
    const keepId = list[0].id;
    const deleteIds = list.slice(1).map((s: { id: number }) => s.id);
    for (const id of deleteIds) {
      await db.delete(scenarios).where(eq(scenarios.id, id));
    }
    logger.info(`${TAG}: user ${userId} had ${list.length} "Development" scenarios, kept id=${keepId}, deleted ${deleteIds.length}`, "migration");
    result.scenariosCleaned += deleteIds.length;
  }

  if (result.scenariosCleaned === 0) {
    logger.info(`${TAG}: scenarios already clean`, "migration");
  }

  // ── 5. Enforce canonical fee categories per property ──
  for (const prop of await db.select({ id: properties.id, name: properties.name }).from(properties)) {
    const existing = await db.select({
      id: propertyFeeCategories.id,
      name: propertyFeeCategories.name,
      rate: propertyFeeCategories.rate,
      sortOrder: propertyFeeCategories.sortOrder,
    }).from(propertyFeeCategories).where(eq(propertyFeeCategories.propertyId, prop.id));

    const existingByName = new Map(existing.map(e => [e.name, e]));

    for (const canon of CANONICAL_FEE_CATEGORIES) {
      const ex = existingByName.get(canon.name);
      if (!ex) {
        await db.insert(propertyFeeCategories).values({
          propertyId: prop.id,
          name: canon.name,
          rate: canon.rate,
          isActive: true,
          sortOrder: canon.sortOrder,
        });
        logger.info(`${TAG}: added missing fee "${canon.name}" for "${prop.name}"`, "migration");
        result.feeCategoriesFixed++;
      } else if (ex.rate !== canon.rate || ex.sortOrder !== canon.sortOrder) {
        await db.update(propertyFeeCategories).set({
          rate: canon.rate,
          sortOrder: canon.sortOrder,
        }).where(eq(propertyFeeCategories.id, ex.id));
        logger.info(`${TAG}: corrected fee "${canon.name}" for "${prop.name}" (rate: ${ex.rate}→${canon.rate})`, "migration");
        result.feeCategoriesFixed++;
      }
    }
  }
  if (result.feeCategoriesFixed === 0) {
    logger.info(`${TAG}: fee categories already canonical`, "migration");
  }

  logger.info(`${TAG}: complete`, "migration");
  return result;
}
