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

const LOGO_IDS_TO_DELETE = [11, 12, 13, 14, 15];
const GROUP_IDS_TO_DELETE = [9, 10, 11, 12, 13];

/** Shared ice chip style applied identically to all 5 logos. */
function iceChipPrompt(color: string, icon: string): string {
  return (
    `A single app icon, perfect 1:1 square canvas, white background outside the chip. ` +
    `The chip itself is a rounded-rectangle with very generous rounded corners (corner radius ~28% of width), ` +
    `like a thick physical casino chip or hotel key fob. ` +
    `The chip color is ${color}. ` +
    `Render it with full 3D realism: thick frosted acrylic/ice material, ` +
    `soft beveled edges that catch a cool white specular highlight along the top-left rim, ` +
    `subtle inner ambient glow in the chip center, slight semi-transparent frost texture on the face, ` +
    `and a soft drop shadow beneath the chip giving it clear physical depth and lift off the canvas. ` +
    `Centered on the chip face: ${icon}. ` +
    `The icon is the same size relative to the chip for all logos — occupying ~50% of the chip width, centered. ` +
    `No text. No border. Photorealistic 3D render quality. Consistent composition.`
  );
}

const COMPANIES = [
  {
    name: "The Mountain Company",
    companyName: "The Mountain Company",
    prompt: iceChipPrompt(
      "deep navy blue (#1E3A5F)",
      "a crisp white geometric mountain peak — two sharp triangular peaks, minimalist alpine silhouette"
    ),
  },
  {
    name: "The Coastal House",
    companyName: "The Coastal House",
    prompt: iceChipPrompt(
      "deep seafoam teal (#1A7A6E)",
      "a crisp white stylized lighthouse with a single horizontal wave beneath it, clean nautical geometry"
    ),
  },
  {
    name: "The Forest Lodge",
    companyName: "The Forest Lodge",
    prompt: iceChipPrompt(
      "deep forest green (#2D5016)",
      "a crisp white symmetrical pine tree silhouette — single tall triangle with layered branches, minimal"
    ),
  },
  {
    name: "The Desert Bloom",
    companyName: "The Desert Bloom",
    prompt: iceChipPrompt(
      "warm terracotta (#8B3A1A)",
      "a crisp white saguaro cactus with two upward arms — simple iconic desert silhouette"
    ),
  },
  {
    name: "The Urban Loft",
    companyName: "The Urban Loft",
    prompt: iceChipPrompt(
      "deep charcoal (#2C2C2C)",
      "a crisp white minimal city skyline — three geometric building rectangles of varying heights, bold and clean"
    ),
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
