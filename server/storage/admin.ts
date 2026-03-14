import { designThemes, logos, assetDescriptions, userGroups, userGroupProperties, companies, researchQuestions, users, type DesignTheme, type InsertDesignTheme, type Logo, type InsertLogo, type AssetDescription, type InsertAssetDescription, type UserGroup, type InsertUserGroup, type Company, type InsertCompany, type ResearchQuestion, type InsertResearchQuestion, type User } from "@shared/schema";
import { db } from "../db";
import { eq, desc, isNull, inArray } from "drizzle-orm";
import { stripAutoFields } from "./utils";

export class AdminStorage {
  // ── Design Themes ──────────────────────────────────────────────

  /** List all design themes, ordered by creation date. */
  async getAllDesignThemes(): Promise<DesignTheme[]> {
    return await db.select().from(designThemes).orderBy(designThemes.createdAt);
  }

  /** Fetch a single theme by ID. Used when resolving a user's selected theme. */
  async getDesignTheme(id: number): Promise<DesignTheme | undefined> {
    const [theme] = await db.select().from(designThemes).where(eq(designThemes.id, id));
    return theme || undefined;
  }

  /** Get the theme marked as isDefault=true. Fallback when no user/group preference exists. */
  async getDefaultDesignTheme(): Promise<DesignTheme | undefined> {
    const [theme] = await db.select().from(designThemes).where(eq(designThemes.isDefault, true));
    return theme || undefined;
  }

  /** Create a new color theme with a name, description, and array of named colors. */
  async createDesignTheme(data: InsertDesignTheme): Promise<DesignTheme> {
    const [theme] = await db
      .insert(designThemes)
      .values({
        name: data.name,
        description: data.description,
        colors: data.colors,
        isDefault: data.isDefault || false,
      })
      .returning();
    return theme;
  }

  /** Update a theme's name, description, or colors. */
  async updateDesignTheme(id: number, data: Partial<InsertDesignTheme>): Promise<DesignTheme | undefined> {
    const [theme] = await db
      .update(designThemes)
      .set({ ...stripAutoFields(data as Record<string, unknown>), updatedAt: new Date() })
      .where(eq(designThemes.id, id))
      .returning();
    return theme || undefined;
  }

  /** Delete a theme. The default theme is protected and cannot be deleted. */
  async deleteDesignTheme(id: number): Promise<void> {
    const [theme] = await db.select().from(designThemes).where(eq(designThemes.id, id));
    if (theme?.isDefault) throw new Error("Cannot delete the default theme");
    await db.delete(designThemes).where(eq(designThemes.id, id));
  }

  // ── Logos ──────────────────────────────────────────────────

  /** List all uploaded logos, ordered by creation date. */
  async getAllLogos(): Promise<Logo[]> {
    return await db.select().from(logos).orderBy(logos.createdAt);
  }

  /** Fetch a logo by ID. Used when resolving a user group's assigned logo. */
  async getLogo(id: number): Promise<Logo | undefined> {
    const [logo] = await db.select().from(logos).where(eq(logos.id, id));
    return logo || undefined;
  }

  /** Get the logo marked as isDefault=true. Fallback when no group-specific logo exists. */
  async getDefaultLogo(): Promise<Logo | undefined> {
    const [logo] = await db.select().from(logos).where(eq(logos.isDefault, true));
    return logo || undefined;
  }

  /** Register a new logo (name, company name, and object storage URL). */
  async createLogo(data: InsertLogo): Promise<Logo> {
    const [logo] = await db.insert(logos).values(data).returning();
    return logo;
  }

  /** Remove a logo. The default logo is protected by the route handler, not here. */
  async deleteLogo(id: number): Promise<void> {
    await db.delete(logos).where(eq(logos.id, id));
  }

  // ── Property Descriptions ──────────────────────────────────────

  /** List all asset descriptions, ordered by creation date. */
  async getAllAssetDescriptions(): Promise<AssetDescription[]> {
    return await db.select().from(assetDescriptions).orderBy(assetDescriptions.createdAt);
  }

  /** Fetch a single asset description by ID. */
  async getAssetDescription(id: number): Promise<AssetDescription | undefined> {
    const [ad] = await db.select().from(assetDescriptions).where(eq(assetDescriptions.id, id));
    return ad || undefined;
  }

  /** Get the asset description marked as isDefault=true. Used when no group-specific one exists. */
  async getDefaultAssetDescription(): Promise<AssetDescription | undefined> {
    const [ad] = await db.select().from(assetDescriptions).where(eq(assetDescriptions.isDefault, true));
    return ad || undefined;
  }

  /** Create a new asset description (e.g., "Luxury Boutique Hotel on 10+ acres"). */
  async createAssetDescription(data: InsertAssetDescription): Promise<AssetDescription> {
    const [ad] = await db.insert(assetDescriptions).values(data).returning();
    return ad;
  }

  /** Delete an asset description. The default one is protected by the route handler. */
  async deleteAssetDescription(id: number): Promise<void> {
    await db.delete(assetDescriptions).where(eq(assetDescriptions.id, id));
  }

  // ── User Groups ─────────────────────────────────────────────

  /** List all user groups alphabetically. */
  async getAllUserGroups(): Promise<UserGroup[]> {
    return db.select().from(userGroups).orderBy(userGroups.name);
  }

  /** Fetch a single user group by ID. Used to resolve branding for a user. */
  async getUserGroup(id: number): Promise<UserGroup | undefined> {
    const [group] = await db.select().from(userGroups).where(eq(userGroups.id, id));
    return group || undefined;
  }

  /** Create a new user group with optional logo, theme, and asset description links. */
  async createUserGroup(data: InsertUserGroup): Promise<UserGroup> {
    const [group] = await db.insert(userGroups).values(data).returning();
    return group;
  }

  /** Update a group's settings (name, linked logo/theme/asset description). */
  async updateUserGroup(id: number, data: Partial<InsertUserGroup>): Promise<UserGroup> {
    const [group] = await db.update(userGroups).set({ ...stripAutoFields(data as Record<string, unknown>), updatedAt: new Date() } as unknown as typeof userGroups.$inferInsert).where(eq(userGroups.id, id)).returning();
    return group;
  }

  /** Get the group marked as isDefault=true. Users from deleted groups are reassigned here. */
  async getDefaultUserGroup(): Promise<UserGroup | undefined> {
    const [group] = await db.select().from(userGroups).where(eq(userGroups.isDefault, true));
    return group || undefined;
  }

  /**
   * Delete a user group. The default group cannot be deleted. When a non-default
   * group is deleted, all its users are reassigned to the default group so they
   * aren't left orphaned without branding.
   */
  async deleteUserGroup(id: number): Promise<void> {
    const [group] = await db.select().from(userGroups).where(eq(userGroups.id, id));
    if (group?.isDefault) throw new Error("Cannot delete the default user group");
    const defaultGroup = await this.getDefaultUserGroup();
    if (!defaultGroup) throw new Error("Cannot delete group: no default group exists to reassign users");
    await db.update(users).set({ userGroupId: defaultGroup.id, updatedAt: new Date() }).where(eq(users.userGroupId, id));
    await db.delete(userGroups).where(eq(userGroups.id, id));
  }

  /** Assign a user to a group (or remove from a group by passing null). */
  async assignUserToGroup(userId: number, groupId: number | null): Promise<User> {
    const [user] = await db.update(users).set({ userGroupId: groupId, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    return user;
  }

  // ── Companies ───────────────────────────────────────────────

  /** List all companies alphabetically. Includes both management and SPV entities. */
  async getAllCompanies(): Promise<Company[]> {
    return db.select().from(companies).orderBy(companies.name);
  }

  /** Fetch a single company by ID. */
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  /** Register a new company (management company or SPV). */
  async createCompany(data: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(data).returning();
    return company;
  }

  /** Update company details (name, type, description, logo). */
  async updateCompany(id: number, data: Partial<InsertCompany>): Promise<Company> {
    const [company] = await db.update(companies).set({ ...stripAutoFields(data as Record<string, unknown>), updatedAt: new Date() } as unknown as typeof companies.$inferInsert).where(eq(companies.id, id)).returning();
    return company;
  }

  /**
   * Delete a company. First unlinks any users who belong to it (sets companyId
   * to null) so the foreign key doesn't block the delete.
   */
  async deleteCompany(id: number): Promise<void> {
    await db.update(users).set({ companyId: null, updatedAt: new Date() }).where(eq(users.companyId, id));
    await db.delete(companies).where(eq(companies.id, id));
  }

  // ── Research Questions ──────────────────────────────────────

  /** Get all admin-configured research questions, sorted by display order. */
  async getAllResearchQuestions(): Promise<ResearchQuestion[]> {
    return db.select().from(researchQuestions).orderBy(researchQuestions.sortOrder, researchQuestions.id);
  }

  /** Create a new research question. Auto-assigns the next sort order if not provided. */
  async createResearchQuestion(data: InsertResearchQuestion): Promise<ResearchQuestion> {
    const maxOrder = await db.select().from(researchQuestions).orderBy(desc(researchQuestions.sortOrder)).limit(1);
    const nextOrder = (maxOrder[0]?.sortOrder ?? -1) + 1;
    const [q] = await db.insert(researchQuestions).values({
      question: data.question,
      sortOrder: data.sortOrder ?? nextOrder,
    }).returning();
    return q;
  }

  /** Update the text of an existing research question. */
  async updateResearchQuestion(id: number, question: string): Promise<ResearchQuestion | undefined> {
    const [q] = await db.update(researchQuestions).set({ question }).where(eq(researchQuestions.id, id)).returning();
    return q;
  }

  /** Delete a research question. Subsequent AI prompts will no longer include it. */
  async deleteResearchQuestion(id: number): Promise<void> {
    await db.delete(researchQuestions).where(eq(researchQuestions.id, id));
  }

  // ── Group Property Visibility ───────────────────────────────

  /**
   * Get the property IDs a group is allowed to see.
   * Returns an empty array if no restrictions are set (meaning: show all).
   */
  async getGroupPropertyIds(groupId: number): Promise<number[]> {
    const rows = await db
      .select({ propertyId: userGroupProperties.propertyId })
      .from(userGroupProperties)
      .where(eq(userGroupProperties.userGroupId, groupId));
    return rows.map((r) => r.propertyId);
  }

  /**
   * Replace the full set of visible properties for a group.
   * Pass an empty array to remove all restrictions (show everything).
   */
  async setGroupProperties(groupId: number, propertyIds: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(userGroupProperties).where(eq(userGroupProperties.userGroupId, groupId));
      if (propertyIds.length > 0) {
        await tx.insert(userGroupProperties).values(
          propertyIds.map((propertyId) => ({ userGroupId: groupId, propertyId }))
        );
      }
    });
  }
}
