import { db } from "../db";
import { documentExtractions, extractionFields, type DocumentExtraction, type InsertDocumentExtraction, type ExtractionField, type InsertExtractionField } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class DocumentStorage {
  async createDocumentExtraction(data: InsertDocumentExtraction): Promise<DocumentExtraction> {
    const [extraction] = await db.insert(documentExtractions).values(data).returning();
    return extraction;
  }

  async getDocumentExtraction(id: number): Promise<DocumentExtraction | undefined> {
    const [extraction] = await db.select().from(documentExtractions).where(eq(documentExtractions.id, id));
    return extraction;
  }

  async getPropertyExtractions(propertyId: number): Promise<DocumentExtraction[]> {
    return db.select().from(documentExtractions)
      .where(eq(documentExtractions.propertyId, propertyId))
      .orderBy(desc(documentExtractions.createdAt));
  }

  async updateDocumentExtraction(id: number, data: Partial<DocumentExtraction>): Promise<DocumentExtraction> {
    const { id: _id, ...updateData } = data;
    const [updated] = await db.update(documentExtractions)
      .set(updateData)
      .where(eq(documentExtractions.id, id))
      .returning();
    return updated;
  }

  async createExtractionField(data: InsertExtractionField): Promise<ExtractionField> {
    const [field] = await db.insert(extractionFields).values(data).returning();
    return field;
  }

  async createExtractionFields(data: InsertExtractionField[]): Promise<ExtractionField[]> {
    if (data.length === 0) return [];
    return db.insert(extractionFields).values(data).returning();
  }

  async getExtractionFields(extractionId: number): Promise<ExtractionField[]> {
    return db.select().from(extractionFields)
      .where(eq(extractionFields.extractionId, extractionId))
      .orderBy(desc(extractionFields.confidence));
  }

  async updateExtractionFieldStatus(id: number, status: string): Promise<ExtractionField> {
    const [updated] = await db.update(extractionFields)
      .set({ status })
      .where(eq(extractionFields.id, id))
      .returning();
    return updated;
  }

  async bulkUpdateExtractionFieldStatus(extractionId: number, status: string): Promise<void> {
    await db.update(extractionFields)
      .set({ status })
      .where(eq(extractionFields.extractionId, extractionId));
  }

}
