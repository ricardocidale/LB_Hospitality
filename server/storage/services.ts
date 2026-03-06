import { companyServiceTemplates, propertyFeeCategories, properties, type ServiceTemplate, type InsertServiceTemplate, type UpdateServiceTemplate } from "@shared/schema";
import { db } from "../db";
import { eq, isNull } from "drizzle-orm";

export class ServiceStorage {
  async getAllServiceTemplates(): Promise<ServiceTemplate[]> {
    return await db.select().from(companyServiceTemplates).orderBy(companyServiceTemplates.sortOrder);
  }

  async getServiceTemplate(id: number): Promise<ServiceTemplate | undefined> {
    const [template] = await db.select().from(companyServiceTemplates).where(eq(companyServiceTemplates.id, id));
    return template || undefined;
  }

  async createServiceTemplate(data: InsertServiceTemplate): Promise<ServiceTemplate> {
    const [template] = await db.insert(companyServiceTemplates).values(data).returning();
    return template;
  }

  async updateServiceTemplate(id: number, data: UpdateServiceTemplate): Promise<ServiceTemplate | undefined> {
    const [template] = await db
      .update(companyServiceTemplates)
      .set(data)
      .where(eq(companyServiceTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteServiceTemplate(id: number): Promise<void> {
    await db.delete(companyServiceTemplates).where(eq(companyServiceTemplates.id, id));
  }

  /**
   * Sync service templates to all existing properties' fee categories.
   * For each active template, ensures every shared property (userId=NULL)
   * has a matching fee category. Creates missing ones with the template's
   * defaultRate. Does NOT overwrite existing property fee categories
   * (fill-only, respects user-set values).
   *
   * Returns the count of newly created fee categories.
   */
  async syncTemplatesToProperties(): Promise<{ created: number; skipped: number }> {
    const templates = await this.getAllServiceTemplates();
    const activeTemplates = templates.filter(t => t.isActive);
    const allProperties = await db.select().from(properties).where(isNull(properties.userId));

    let created = 0;
    let skipped = 0;

    for (const prop of allProperties) {
      const existingCats = await db.select()
        .from(propertyFeeCategories)
        .where(eq(propertyFeeCategories.propertyId, prop.id));

      const existingNames = new Set(existingCats.map(c => c.name));

      for (const template of activeTemplates) {
        if (existingNames.has(template.name)) {
          skipped++;
          continue;
        }
        await db.insert(propertyFeeCategories).values({
          propertyId: prop.id,
          name: template.name,
          rate: template.defaultRate,
          isActive: true,
          sortOrder: template.sortOrder,
        });
        created++;
      }
    }

    return { created, skipped };
  }
}
