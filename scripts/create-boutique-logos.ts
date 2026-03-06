/**
 * Creates 5 boutique hotel company logos + user groups.
 * Run with: npx tsx scripts/create-boutique-logos.ts
 */
import { randomUUID } from "crypto";
import { generateImageBuffer } from "../server/replit_integrations/image/client";
import { objectStorageClient, ObjectStorageService } from "../server/replit_integrations/object_storage";
import { db } from "../server/db";
import { logos, userGroups } from "../shared/schema";
import { inArray } from "drizzle-orm";

const LOGO_IDS_TO_DELETE = [6, 7, 8, 9, 10];
const GROUP_IDS_TO_DELETE = [4, 5, 6, 7, 8];

const COMPANIES = [
  {
    name: "The Mountain Company",
    companyName: "The Mountain Company",
    chipColor: "#1E3A5F",
    prompt:
      "Square logo icon for a luxury boutique hotel brand called 'The Mountain Company'. " +
      "A frosted ice chip square background in deep navy blue (#1E3A5F). Centered on it: a minimal white geometric mountain peak silhouette " +
      "with sharp clean lines. Elegant, refined, alpine luxury. No text. Perfect square composition, " +
      "slight glassmorphism on the chip surface, subtle inner glow.",
  },
  {
    name: "The Coastal House",
    companyName: "The Coastal House",
    chipColor: "#1A7A6E",
    prompt:
      "Square logo icon for a luxury boutique hotel brand called 'The Coastal House'. " +
      "A frosted ice chip square background in deep seafoam teal (#1A7A6E). Centered on it: a minimal white stylized wave or lighthouse mark, " +
      "nautical elegance, clean geometric lines. No text. Perfect square composition, " +
      "slight glassmorphism on the chip surface, subtle inner glow.",
  },
  {
    name: "The Forest Lodge",
    companyName: "The Forest Lodge",
    chipColor: "#2D5016",
    prompt:
      "Square logo icon for a luxury boutique hotel brand called 'The Forest Lodge'. " +
      "A frosted ice chip square background in deep forest green (#2D5016). Centered on it: a minimal white stylized pine tree or forest canopy silhouette, " +
      "organic yet refined, wilderness luxury. No text. Perfect square composition, " +
      "slight glassmorphism on the chip surface, subtle inner glow.",
  },
  {
    name: "The Desert Bloom",
    companyName: "The Desert Bloom",
    chipColor: "#8B3A1A",
    prompt:
      "Square logo icon for a luxury boutique hotel brand called 'The Desert Bloom'. " +
      "A frosted ice chip square background in warm terracotta (#8B3A1A). Centered on it: a minimal white stylized saguaro cactus or blooming desert flower, " +
      "sun-baked luxury, clean geometric form. No text. Perfect square composition, " +
      "slight glassmorphism on the chip surface, subtle inner glow.",
  },
  {
    name: "The Urban Loft",
    companyName: "The Urban Loft",
    chipColor: "#2C2C2C",
    prompt:
      "Square logo icon for a luxury boutique hotel brand called 'The Urban Loft'. " +
      "A frosted ice chip square background in deep charcoal (#2C2C2C). Centered on it: a minimal white or gold stylized city skyline or architectural window grid, " +
      "metropolitan sophistication, bold geometry. No text. Perfect square composition, " +
      "slight glassmorphism on the chip surface, subtle inner glow.",
  },
];

async function uploadBuffer(buffer: Buffer): Promise<string> {
  const objectStorageService = new ObjectStorageService();
  const privateDir = objectStorageService.getPrivateObjectDir();
  const objectId = randomUUID();
  const fullPath = `${privateDir}/uploads/${objectId}`;

  const parts = fullPath.startsWith("/") ? fullPath.slice(1).split("/") : fullPath.split("/");
  const bucketName = parts[0];
  const objectName = parts.slice(1).join("/");

  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  await file.save(buffer, { contentType: "image/png" });

  return `/objects/uploads/${objectId}`;
}

async function main() {
  console.log("Deleting old logos and user groups...");
  await db.delete(userGroups).where(inArray(userGroups.id, GROUP_IDS_TO_DELETE));
  await db.delete(logos).where(inArray(logos.id, LOGO_IDS_TO_DELETE));
  console.log("  Deleted groups:", GROUP_IDS_TO_DELETE);
  console.log("  Deleted logos:", LOGO_IDS_TO_DELETE);
  console.log();

  console.log("Creating 5 boutique hotel logos + user groups...\n");

  const createdLogoIds: { [companyName: string]: number } = {};

  for (const company of COMPANIES) {
    console.log(`Generating logo for: ${company.companyName}`);
    try {
      const buffer = await generateImageBuffer(company.prompt, "1024x1024");
      console.log(`  Image generated (${buffer.length} bytes)`);

      const objectPath = await uploadBuffer(buffer);
      console.log(`  Uploaded to: ${objectPath}`);

      const [logo] = await db
        .insert(logos)
        .values({
          name: `${company.name} Logo`,
          companyName: company.companyName,
          url: objectPath,
          isDefault: false,
        })
        .returning();
      console.log(`  Logo registered (id=${logo.id})`);
      createdLogoIds[company.companyName] = logo.id;
    } catch (err) {
      console.error(`  FAILED for ${company.companyName}:`, (err as Error).message);
    }
  }

  console.log("\nCreating user groups...\n");

  for (const company of COMPANIES) {
    const logoId = createdLogoIds[company.companyName];
    try {
      const [group] = await db
        .insert(userGroups)
        .values({
          name: company.companyName,
          companyName: company.companyName,
          logoId: logoId ?? null,
        })
        .returning();
      console.log(`  Created group: ${group.name} (id=${group.id}, logoId=${group.logoId})`);
    } catch (err) {
      console.error(`  FAILED group for ${company.companyName}:`, (err as Error).message);
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
