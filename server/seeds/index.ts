import { db } from "../db";
import { globalAssumptions, marketResearch, properties } from "@shared/schema";
import { seedUsers, seedUserGroups, seedUserGroupProperties } from "./users";
import { seedGlobalAssumptions, seedProperties, seedFeeCategories } from "./properties";
import { seedDefaultLogos, seedCompanies } from "./branding";
import { seedMissingMarketResearch, getHudsonEstateResearch, getEdenSummitResearch, getAustinHillsideResearch, getCasaMedellinResearch, getBlueRidgeResearch } from "./research";
import { seedServiceTemplates } from "./services";
import { seedPropertyPhotos } from "./photos";
import { logger } from "../logger";

export async function seed() {
  const forceReseed = process.argv.includes("--force");
  
  logger.info("Starting database seed...", "seed");

  const existingGlobal = await db.select().from(globalAssumptions).limit(1);
  const existingProperties = await db.select().from(properties).limit(1);

  if (existingGlobal.length > 0 || existingProperties.length > 0) {
    if (forceReseed) {
      logger.info("Force mode: Clearing existing data...", "seed");
      await db.delete(marketResearch);
      await db.delete(properties);
      await db.delete(globalAssumptions);
      logger.info("Existing data cleared.", "seed");
    } else {
      logger.info("Database already has data. Skipping seed to prevent duplicates.", "seed");
      logger.info("To force re-seed, run: npx tsx server/seed.ts --force", "seed");
      return;
    }
  }

  await seedUsers();

  await seedGlobalAssumptions();

  await seedProperties();

  await seedFeeCategories();

  const seededProperties = await db.select().from(properties);
  const propertyMap: Record<string, number> = {};
  for (const p of seededProperties) {
    propertyMap[p.name] = p.id;
  }

  const marketResearchEntries = [
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Jano Grande Ranch"],
      title: "Market Research: Jano Grande Ranch",
      llmModel: "seed-data",
      content: getCasaMedellinResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Loch Sheldrake"],
      title: "Market Research: Loch Sheldrake",
      llmModel: "seed-data",
      content: getEdenSummitResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Belleayre Mountain"],
      title: "Market Research: Belleayre Mountain",
      llmModel: "seed-data",
      content: getHudsonEstateResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Scott's House"],
      title: "Market Research: Scott's House",
      llmModel: "seed-data",
      content: getAustinHillsideResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Lakeview Haven Lodge"],
      title: "Market Research: Lakeview Haven Lodge",
      llmModel: "seed-data",
      content: getBlueRidgeResearch()
    }
  ].filter(e => e.propertyId != null);

  if (marketResearchEntries.length > 0) {
    await db.insert(marketResearch).values(marketResearchEntries);
    logger.info(`Seeded market research for ${marketResearchEntries.length} properties`, "seed");
  }

  await seedDefaultLogos();
  await seedUserGroups();
  await seedCompanies();

  await seedUserGroupProperties();

  await seedServiceTemplates();

  await seedPropertyPhotos();

  logger.info("Database seed completed successfully!", "seed");
}

export {
  seedMissingMarketResearch,
  seedDefaultLogos,
  seedUserGroups,
  seedUserGroupProperties,
  seedCompanies,
  seedServiceTemplates,
  seedPropertyPhotos,
};
