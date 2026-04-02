import { db } from "../db";
import { propertyPhotos, properties } from "@shared/schema";
import { logger } from "../logger";

interface PhotoSeed {
  imageUrl: string;
  caption: string;
  sortOrder: number;
  isHero: boolean;
}

const PROPERTY_PHOTOS: Record<string, PhotoSeed[]> = {
  "The Hudson Estate": [
    { imageUrl: "/images/property-ny.png", caption: "The Hudson Estate — a refined country retreat in the heart of the Hudson Valley", sortOrder: 0, isHero: true },
    { imageUrl: "/images/property-ny-interior.png", caption: "Grand lobby with period furnishings and crystal chandelier", sortOrder: 1, isHero: false },
    { imageUrl: "/images/property-ny-grounds.png", caption: "Manicured gardens and stone pathways through the estate grounds", sortOrder: 2, isHero: false },
  ],
  "Eden Summit Lodge": [
    { imageUrl: "/images/property-utah.png", caption: "Eden Summit Lodge — alpine luxury nestled in Utah's Ogden Valley", sortOrder: 0, isHero: true },
    { imageUrl: "/images/property-utah-interior.png", caption: "Great room with floor-to-ceiling mountain views and stone fireplace", sortOrder: 1, isHero: false },
    { imageUrl: "/images/property-utah-exterior.png", caption: "Timber and stone lodge framed by snow-covered peaks", sortOrder: 2, isHero: false },
  ],
  "Austin Hillside": [
    { imageUrl: "/images/property-austin.png", caption: "Austin Hillside — contemporary Hill Country boutique retreat", sortOrder: 0, isHero: true },
    { imageUrl: "/images/property-austin-interior.png", caption: "Luxury suite with panoramic views of rolling Hill Country terrain", sortOrder: 1, isHero: false },
    { imageUrl: "/images/property-austin-pool.png", caption: "Infinity pool and terrace overlooking the Texas hills at golden hour", sortOrder: 2, isHero: false },
  ],
  "Casa Medellín": [
    { imageUrl: "/images/property-medellin.png", caption: "Casa Medellín — tropical boutique elegance in El Poblado", sortOrder: 0, isHero: true },
    { imageUrl: "/images/property-medellin-courtyard.png", caption: "Lush courtyard garden with colonial architecture and fountain", sortOrder: 1, isHero: false },
    { imageUrl: "/images/property-medellin-terrace.png", caption: "Rooftop terrace with panoramic Andes mountain and city views", sortOrder: 2, isHero: false },
  ],
  "Blue Ridge Manor": [
    { imageUrl: "/images/property-asheville.png", caption: "Blue Ridge Manor — a grand mountain estate in western North Carolina", sortOrder: 0, isHero: true },
    { imageUrl: "/images/property-asheville-suite.png", caption: "Luxury suite with vaulted beams and misty mountain panorama", sortOrder: 1, isHero: false },
    { imageUrl: "/images/property-asheville-porch.png", caption: "Wraparound porch with rocking chairs overlooking layered ridges", sortOrder: 2, isHero: false },
  ],
  "Jano Grande Ranch": [
    { imageUrl: "/images/property-medellin.png", caption: "Jano Grande Ranch — a luxury hacienda in the heart of Antioquia", sortOrder: 0, isHero: true },
    { imageUrl: "/images/property-medellin-interior.png", caption: "Open-air living room with tropical wood beams and garden views", sortOrder: 1, isHero: false },
    { imageUrl: "/images/property-medellin-grounds.png", caption: "Estate grounds with rolling hills and Andes mountain backdrop", sortOrder: 2, isHero: false },
  ],
  "Loch Sheldrake": [
    { imageUrl: "/images/property-loch-sheldrake.png", caption: "Loch Sheldrake — a serene lakeside retreat in Sullivan County", sortOrder: 0, isHero: true },
    { imageUrl: "/images/property-loch-sheldrake-interior.png", caption: "Great room with stone fireplace and panoramic lake views", sortOrder: 1, isHero: false },
    { imageUrl: "/images/property-loch-sheldrake-lake.png", caption: "Tranquil lake setting with dock and autumn foliage", sortOrder: 2, isHero: false },
  ],
  "Belleayre Mountain": [
    { imageUrl: "/images/property-belleayre.png", caption: "Belleayre Mountain — alpine luxury in the Western Catskills", sortOrder: 0, isHero: true },
    { imageUrl: "/images/property-belleayre-suite.png", caption: "Luxury suite with vaulted timber ceiling and mountain vista", sortOrder: 1, isHero: false },
    { imageUrl: "/images/property-belleayre-exterior.png", caption: "Timber and stone lodge nestled in forested mountain slopes", sortOrder: 2, isHero: false },
  ],
  "Scott's House": [
    { imageUrl: "/images/property-eden.png", caption: "Scott's House — a modern mountain retreat in Ogden Valley", sortOrder: 0, isHero: true },
    { imageUrl: "/images/property-eden-interior.png", caption: "Open floor plan with exposed beams and Wasatch Range views", sortOrder: 1, isHero: false },
    { imageUrl: "/images/property-eden-exterior.png", caption: "Timber and stone facade framed by snow-covered peaks", sortOrder: 2, isHero: false },
  ],
  "Lakeview Haven Lodge": [
    { imageUrl: "/images/property-huntsville.png", caption: "Lakeview Haven Lodge — lakefront tranquility in Ogden Valley", sortOrder: 0, isHero: true },
    { imageUrl: "/images/property-huntsville-interior.png", caption: "Great room overlooking Pineview Reservoir at golden hour", sortOrder: 1, isHero: false },
    { imageUrl: "/images/property-huntsville-lake.png", caption: "Lodge deck with kayaks and mountain reflections on the lake", sortOrder: 2, isHero: false },
  ],
  "San Diego": [
    { imageUrl: "/images/property-cartagena.png", caption: "San Diego — colonial elegance in Cartagena's walled city", sortOrder: 0, isHero: true },
    { imageUrl: "/images/property-cartagena-courtyard.png", caption: "Colonial courtyard with bougainvillea and central fountain", sortOrder: 1, isHero: false },
    { imageUrl: "/images/property-cartagena-rooftop.png", caption: "Rooftop terrace with Caribbean Sea and old city panorama", sortOrder: 2, isHero: false },
  ],
  "Medellin Duplex": [
    { imageUrl: "/images/medellin-duplex-1.jpeg", caption: "Open-concept living and dining area with Calacatta marble island and floating staircase", sortOrder: 0, isHero: true },
    { imageUrl: "/images/medellin-duplex-2.jpeg", caption: "Chef's kitchen with marble waterfall island and panoramic Andes mountain views", sortOrder: 1, isHero: false },
    { imageUrl: "/images/medellin-duplex-3.jpeg", caption: "Master suite with floor-to-ceiling windows overlooking Medellín's skyline and mountains", sortOrder: 2, isHero: false },
  ],
};

export async function seedPropertyPhotos() {
  const existing = await db.select().from(propertyPhotos).limit(1);
  if (existing.length > 0) return;

  const allProperties = await db.select().from(properties);

  let count = 0;
  for (const prop of allProperties) {
    const photoSet = PROPERTY_PHOTOS[prop.name];
    if (!photoSet) continue;

    for (const photo of photoSet) {
      await db.insert(propertyPhotos).values({
        propertyId: prop.id,
        imageUrl: photo.imageUrl,
        caption: photo.caption,
        sortOrder: photo.sortOrder,
        isHero: photo.isHero,
      });
      count++;
    }
  }

  logger.info(`Seeded ${count} property photos for ${allProperties.length} properties`, "seed");
}
