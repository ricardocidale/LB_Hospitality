import { db } from "../db";
import { globalAssumptions, marketResearch, properties } from "@shared/schema";
import { seedUsers, seedUserGroups } from "./users";
import { seedGlobalAssumptions, seedProperties, seedFeeCategories } from "./properties";
import { seedDefaultLogos, seedCompanies } from "./branding";
import { seedMissingMarketResearch, getHudsonEstateResearch, getEdenSummitResearch, getAustinHillsideResearch, getCasaMedellinResearch, getBlueRidgeResearch } from "./research";
import { seedServiceTemplates } from "./services";
import { logger } from "../logger";

export async function seed() {
  const forceReseed = process.argv.includes("--force");
  
  logger.info("Starting database seed...", "seed");

  // Check if data already exists
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

  // Seed admin user
  await seedUsers();

  // Seed global assumptions
  await seedGlobalAssumptions();

  // Seed properties
  await seedProperties();

  // Seed fee categories
  await seedFeeCategories();

  // Seed market research
  const seededProperties = await db.select().from(properties);
  const propertyMap: Record<string, number> = {};
  for (const p of seededProperties) {
    propertyMap[p.name] = p.id;
  }

  const marketResearchEntries = [
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["The Hudson Estate"],
      title: "Market Research: The Hudson Estate",
      llmModel: "seed-data",
      content: getHudsonEstateResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Eden Summit Lodge"],
      title: "Market Research: Eden Summit Lodge",
      llmModel: "seed-data",
      content: getEdenSummitResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Austin Hillside"],
      title: "Market Research: Austin Hillside",
      llmModel: "seed-data",
      content: getAustinHillsideResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Casa Medellín"],
      title: "Market Research: Casa Medellín",
      llmModel: "seed-data",
      content: getCasaMedellinResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Blue Ridge Manor"],
      title: "Market Research: Blue Ridge Manor",
      llmModel: "seed-data",
      content: getBlueRidgeResearch()
    }
  ];
  await db.insert(marketResearch).values(marketResearchEntries);
  logger.info(`Seeded market research for ${marketResearchEntries.length} properties`, "seed");

  // Seed branding & groups
  await seedDefaultLogos();
  await seedUserGroups();
  await seedCompanies();

  // Seed service templates
  await seedServiceTemplates();

  logger.info("Database seed completed successfully!", "seed");
}

export {
  seedMissingMarketResearch,
  seedDefaultLogos,
  seedUserGroups,
  seedCompanies,
  seedServiceTemplates,
};


