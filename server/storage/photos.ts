import { propertyPhotos, properties, type PropertyPhoto, type InsertPropertyPhoto, type UpdatePropertyPhoto } from "@shared/schema";
import { db } from "../db";
import { eq, and, asc } from "drizzle-orm";
import { stripAutoFields } from "./utils";

export class PhotoStorage {
  /** Get all photos for a property, ordered by sortOrder. */
  async getPropertyPhotos(propertyId: number): Promise<PropertyPhoto[]> {
    return await db.select().from(propertyPhotos)
      .where(eq(propertyPhotos.propertyId, propertyId))
      .orderBy(asc(propertyPhotos.sortOrder));
  }

  /** Get the hero photo for a property. */
  async getHeroPhoto(propertyId: number): Promise<PropertyPhoto | undefined> {
    const [photo] = await db.select().from(propertyPhotos)
      .where(and(eq(propertyPhotos.propertyId, propertyId), eq(propertyPhotos.isHero, true)));
    return photo || undefined;
  }

  /** Add a photo to a property's album. Auto-sets as hero if it's the first photo. */
  async addPropertyPhoto(data: InsertPropertyPhoto): Promise<PropertyPhoto> {
    // Check if property has any photos — if not, this becomes the hero
    const existing = await db.select().from(propertyPhotos)
      .where(eq(propertyPhotos.propertyId, data.propertyId));

    const isFirst = existing.length === 0;
    const [photo] = await db.insert(propertyPhotos)
      .values({
        ...data,
        isHero: isFirst ? true : (data.isHero ?? false),
        sortOrder: data.sortOrder ?? existing.length,
      } as typeof propertyPhotos.$inferInsert)
      .returning();

    // If this is the hero, sync to properties.imageUrl
    if (photo.isHero) {
      await syncHeroToProperty(data.propertyId, photo.imageUrl);
    }

    return photo;
  }

  /** Update a photo's caption or sort order. */
  async updatePropertyPhoto(id: number, data: UpdatePropertyPhoto): Promise<PropertyPhoto | undefined> {
    const [photo] = await db.update(propertyPhotos)
      .set(stripAutoFields(data as Record<string, unknown>))
      .where(eq(propertyPhotos.id, id))
      .returning();
    return photo || undefined;
  }

  /** Delete a photo. If it was the hero, promote the next photo. */
  async deletePropertyPhoto(id: number): Promise<void> {
    // Get the photo before deleting to check if it's hero
    const [photo] = await db.select().from(propertyPhotos)
      .where(eq(propertyPhotos.id, id));
    if (!photo) return;

    await db.delete(propertyPhotos).where(eq(propertyPhotos.id, id));

    // If deleted photo was hero, promote the first remaining photo
    if (photo.isHero) {
      const remaining = await db.select().from(propertyPhotos)
        .where(eq(propertyPhotos.propertyId, photo.propertyId))
        .orderBy(asc(propertyPhotos.sortOrder))
        .limit(1);

      if (remaining.length > 0) {
        await db.update(propertyPhotos)
          .set({ isHero: true })
          .where(eq(propertyPhotos.id, remaining[0].id));
        await syncHeroToProperty(photo.propertyId, remaining[0].imageUrl);
      }
    }
  }

  /** Set a specific photo as hero, clearing hero from all others. Syncs to properties.imageUrl. */
  async setHeroPhoto(propertyId: number, photoId: number): Promise<void> {
    // Clear all heroes for this property
    await db.update(propertyPhotos)
      .set({ isHero: false })
      .where(eq(propertyPhotos.propertyId, propertyId));

    // Set the new hero
    const [hero] = await db.update(propertyPhotos)
      .set({ isHero: true })
      .where(and(eq(propertyPhotos.id, photoId), eq(propertyPhotos.propertyId, propertyId)))
      .returning();

    if (hero) {
      await syncHeroToProperty(propertyId, hero.imageUrl);
    }
  }

  /** Bulk reorder photos by providing ordered array of photo IDs. */
  async reorderPhotos(propertyId: number, orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(propertyPhotos)
        .set({ sortOrder: i })
        .where(and(eq(propertyPhotos.id, orderedIds[i]), eq(propertyPhotos.propertyId, propertyId)));
    }
  }

}

/** Sync hero photo URL to properties.imageUrl for backward compatibility. */
async function syncHeroToProperty(propertyId: number, imageUrl: string): Promise<void> {
  await db.update(properties)
    .set({ imageUrl, updatedAt: new Date() })
    .where(eq(properties.id, propertyId));
}
