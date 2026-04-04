import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireManagementAccess, checkPropertyAccess , getAuthUser } from "../auth";
import { insertPropertySchema, updatePropertySchema, updateFeeCategorySchema, type GlobalAssumptions } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import { logActivity, logAndSendError } from "./helpers";
import { generateLocationAwareResearchValues } from "../data/researchSeeds";
import { processNotificationEvent, evaluateAlertRules } from "../notifications/engine";
import { createEvent } from "../notifications/events";
import { UserRole } from "@shared/constants";
import { invalidateComputeCache } from "../finance/cache";
import {
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_PROPERTY_TAX_RATE,
  DEFAULT_COMMISSION_RATE,
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_START_ADR,
  DEFAULT_ADR_GROWTH_RATE,
  DEFAULT_START_OCCUPANCY,
  DEFAULT_MAX_OCCUPANCY,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_ROOM_COUNT,
  DEFAULT_CATERING_BOOST_PCT,
  DEFAULT_LAND_VALUE_PERCENT,
  DEFAULT_LTV,
  DEFAULT_INTEREST_RATE,
  DEFAULT_TERM_YEARS,
  SEED_DEBT_ASSUMPTIONS,
} from "@shared/constants";

interface DebtAssumptions {
  acqLTV?: number;
  refiLTV?: number;
  interestRate?: number;
  amortizationYears?: number;
  acqClosingCostRate?: number;
  refiClosingCostRate?: number;
}

export function buildPropertyDefaultsFromGlobal(ga?: GlobalAssumptions): Record<string, unknown> {
  const debt = (ga?.debtAssumptions as DebtAssumptions) ?? {};
  return {
    exitCapRate: ga?.exitCapRate ?? DEFAULT_EXIT_CAP_RATE,
    taxRate: ga?.defaultPropertyTaxRate ?? DEFAULT_PROPERTY_TAX_RATE,
    dispositionCommission: ga?.salesCommissionRate ?? DEFAULT_COMMISSION_RATE,
    baseManagementFeeRate: ga?.baseManagementFee ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE,
    incentiveManagementFeeRate: ga?.incentiveManagementFee ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,

    startAdr: ga?.defaultStartAdr ?? DEFAULT_START_ADR,
    adrGrowthRate: ga?.defaultAdrGrowthRate ?? DEFAULT_ADR_GROWTH_RATE,
    startOccupancy: ga?.defaultStartOccupancy ?? DEFAULT_START_OCCUPANCY,
    maxOccupancy: ga?.defaultMaxOccupancy ?? DEFAULT_MAX_OCCUPANCY,
    occupancyRampMonths: ga?.defaultOccupancyRampMonths ?? DEFAULT_OCCUPANCY_RAMP_MONTHS,
    roomCount: ga?.defaultRoomCount ?? DEFAULT_ROOM_COUNT,
    cateringBoostPercent: ga?.defaultCateringBoostPct ?? DEFAULT_CATERING_BOOST_PCT,

    costRateRooms: ga?.defaultCostRateRooms ?? DEFAULT_COST_RATE_ROOMS,
    costRateFB: ga?.defaultCostRateFb ?? DEFAULT_COST_RATE_FB,
    costRateAdmin: ga?.defaultCostRateAdmin ?? DEFAULT_COST_RATE_ADMIN,
    costRateMarketing: ga?.defaultCostRateMarketing ?? DEFAULT_COST_RATE_MARKETING,
    costRatePropertyOps: ga?.defaultCostRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS,
    costRateUtilities: ga?.defaultCostRateUtilities ?? DEFAULT_COST_RATE_UTILITIES,
    costRateTaxes: ga?.defaultCostRateTaxes ?? DEFAULT_COST_RATE_TAXES,
    costRateIT: ga?.defaultCostRateIt ?? DEFAULT_COST_RATE_IT,
    costRateFFE: ga?.defaultCostRateFfe ?? DEFAULT_COST_RATE_FFE,
    costRateOther: ga?.defaultCostRateOther ?? DEFAULT_COST_RATE_OTHER,
    costRateInsurance: ga?.defaultCostRateInsurance ?? DEFAULT_COST_RATE_INSURANCE,

    revShareEvents: ga?.defaultRevShareEvents ?? DEFAULT_REV_SHARE_EVENTS,
    revShareFB: ga?.defaultRevShareFb ?? DEFAULT_REV_SHARE_FB,
    revShareOther: ga?.defaultRevShareOther ?? DEFAULT_REV_SHARE_OTHER,

    landValuePercent: ga?.defaultLandValuePercent ?? DEFAULT_LAND_VALUE_PERCENT,

    acquisitionLTV: debt.acqLTV ?? DEFAULT_LTV,
    acquisitionInterestRate: debt.interestRate ?? DEFAULT_INTEREST_RATE,
    acquisitionTermYears: debt.amortizationYears ?? DEFAULT_TERM_YEARS,
    acquisitionClosingCostRate: debt.acqClosingCostRate ?? SEED_DEBT_ASSUMPTIONS.acqClosingCostRate,
    refinanceLTV: debt.refiLTV ?? DEFAULT_LTV,
    refinanceInterestRate: debt.interestRate ?? DEFAULT_INTEREST_RATE,
    refinanceTermYears: debt.amortizationYears ?? DEFAULT_TERM_YEARS,
    refinanceClosingCostRate: debt.refiClosingCostRate ?? SEED_DEBT_ASSUMPTIONS.refiClosingCostRate,
  };
}

export function register(app: Express) {
  // ────────────────────────────────────────────────────────────
  // PROPERTIES ROUTES
  // Full CRUD + image management + research seeding
  // Each property represents a hotel with full pro forma assumptions.
  // POST /api/properties — creates property + seeds default fee categories
  // POST /api/properties/:id/seed-research — generates AI research values
  // ────────────────────────────────────────────────────────────

  app.get("/api/properties", requireAuth, async (req, res) => {
    try {
      let props = await storage.getAllProperties(getAuthUser(req).id);
      const user = getAuthUser(req);
      if (user.role !== UserRole.ADMIN && user.userGroupId) {
        const allowedIds = await storage.getGroupPropertyIds(user.userGroupId);
        if (allowedIds.length > 0) {
          props = props.filter((p) => allowedIds.includes(p.id));
        }
      }
      const allCats = await storage.getAllFeeCategories();
      const catsByProperty = new Map<number, { name: string; rate: number; isActive: boolean }[]>();
      for (const c of allCats) {
        if (!catsByProperty.has(c.propertyId)) catsByProperty.set(c.propertyId, []);
        catsByProperty.get(c.propertyId)!.push({ name: c.name, rate: c.rate, isActive: c.isActive });
      }
      const enriched = props.map(p => ({
        ...p,
        feeCategories: catsByProperty.get(p.id) ?? [],
      }));
      res.json(enriched);
    } catch (error) {
      logAndSendError(res, "Failed to fetch properties", error);
    }
  });

  // Group property visibility
  app.get("/api/user-groups/:id/properties", requireAuth, async (req, res) => {
    try {
      const groupId = Number(req.params.id);
      const user = getAuthUser(req);
      if (user.role !== UserRole.ADMIN && user.userGroupId !== groupId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const ids = await storage.getGroupPropertyIds(groupId);
      res.json(ids);
    } catch (error) {
      logAndSendError(res, "Failed to fetch group properties", error);
    }
  });

  const groupPropertyIdsSchema = z.object({
    propertyIds: z.array(z.number().int()).default([]),
  });

  app.put("/api/user-groups/:id/properties", requireManagementAccess, async (req, res) => {
    try {
      const parsed = groupPropertyIdsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const { propertyIds } = parsed.data;
      await storage.setGroupProperties(Number(req.params.id), propertyIds);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to update group properties", error);
    }
  });

  app.get("/api/properties/:id", requireAuth, async (req, res) => {
    try {
      const property = await storage.getProperty(Number(req.params.id));
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      const user = getAuthUser(req);
      if (user.role !== UserRole.ADMIN && user.userGroupId) {
        const allowedIds = await storage.getGroupPropertyIds(user.userGroupId);
        if (allowedIds.length > 0 && !allowedIds.includes(property.id)) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      const cats = await storage.getFeeCategoriesByProperty(property.id);
      res.json({
        ...property,
        feeCategories: cats.map(c => ({ name: c.name, rate: c.rate, isActive: c.isActive })),
      });
    } catch (error) {
      logAndSendError(res, "Failed to fetch property", error);
    }
  });

  app.post("/api/properties", requireManagementAccess, async (req, res) => {
    try {
      const validation = insertPropertySchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const globalDefaults = await storage.getGlobalAssumptions();
      const inheritedDefaults = buildPropertyDefaultsFromGlobal(globalDefaults);

      const mergedData: Record<string, unknown> = {};
      for (const [key, globalValue] of Object.entries(inheritedDefaults)) {
        const userValue = (validation.data as Record<string, unknown>)[key];
        if (userValue === undefined || userValue === null) {
          mergedData[key] = globalValue;
        }
      }

      const property = await storage.createProperty({
        ...validation.data,
        ...mergedData,
        userId: null,
      });

      // Seed default fee categories for the new property
      await storage.seedDefaultFeeCategories(property.id);

      // Create initial photo album entry from property image
      if (property.imageUrl) {
        await storage.addPropertyPhoto({
          propertyId: property.id,
          imageUrl: property.imageUrl,
          isHero: true,
        });
      }

      invalidateComputeCache();
      logActivity(req, "create", "property", property.id, property.name);

      processNotificationEvent(createEvent("PROPERTY_IMPORTED", {
        propertyId: property.id,
        propertyName: property.name,
        message: `New property added: ${property.name}`,
        link: `/property/${property.id}`,
      })).catch((err) => console.error("[ERROR] [properties] Notification error:", err?.message || err));

      res.status(201).json(property);
    } catch (error) {
      logAndSendError(res, "Failed to create property", error);
    }
  });

  app.patch("/api/properties/:id", requireManagementAccess, async (req, res) => {
    try {
      const propertyId = Number(req.params.id);
      const hasAccess = await checkPropertyAccess(getAuthUser(req), propertyId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validation = updatePropertySchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const property = await storage.updateProperty(propertyId, validation.data);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      invalidateComputeCache();
      logActivity(req, "update", "property", property.id, property.name, { updates: req.body });

      if (property) {
        const metrics: Record<string, number> = {};
        if (property.exitCapRate != null) metrics.cap_rate = property.exitCapRate;
        if (property.maxOccupancy != null) metrics.occupancy = property.maxOccupancy;
        if (Object.keys(metrics).length > 0) {
          evaluateAlertRules(property, metrics).catch((err) =>
            console.error("[ERROR] [properties] Alert evaluation error:", err?.message || err)
          );
        }
      }

      res.json(property);
    } catch (error) {
      logAndSendError(res, "Failed to update property", error);
    }
  });

  app.delete("/api/properties/:id", requireManagementAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const hasAccess = await checkPropertyAccess(getAuthUser(req), id);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      await storage.deleteProperty(id);
      invalidateComputeCache();
      logActivity(req, "delete", "property", id, property.name);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to delete property", error);
    }
  });

  app.post("/api/properties/:id/seed-research", requireManagementAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const hasAccess = await checkPropertyAccess(getAuthUser(req), id);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      const seededValues = generateLocationAwareResearchValues({
        location: property.location || "Unknown",
        streetAddress: property.streetAddress,
        city: property.city,
        stateProvince: property.stateProvince,
        zipPostalCode: property.zipPostalCode,
        country: property.country,
        market: property.market || "North America",
      });
      const updated = await storage.updateProperty(id, {
        researchValues: seededValues,
      });

      logActivity(req, "seed-research", "property", id, property.name);
      res.json(updated);
    } catch (error) {
      logAndSendError(res, "Failed to seed research", error);
    }
  });

  // Fee categories for a property
  app.get("/api/properties/:id/fee-categories", requireAuth, async (req, res) => {
    try {
      const propertyId = Number(req.params.id);
      if (!(await checkPropertyAccess(getAuthUser(req), propertyId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      const categories = await storage.getFeeCategoriesByProperty(propertyId);
      res.json(categories);
    } catch (error) {
      logAndSendError(res, "Failed to fetch fee categories", error);
    }
  });

  const feeCategoryBatchSchema = z.array(z.object({
    id: z.number().int().optional(),
    name: z.string().min(1),
    rate: z.number().min(0).max(1),
    isActive: z.boolean(),
    sortOrder: z.number().int(),
  }));

  app.put("/api/properties/:id/fee-categories", requireAuth, async (req, res) => {
    try {
      const propertyId = Number(req.params.id);
      if (!(await checkPropertyAccess(getAuthUser(req), propertyId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      const parsed = feeCategoryBatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const categories = parsed.data;
      // Run all category updates/creates in parallel (independent rows)
      const results = (await Promise.all(
        categories.map(async (cat) => {
          if (cat.id) {
            return storage.updateFeeCategory(cat.id, {
              name: cat.name,
              rate: cat.rate,
              isActive: cat.isActive,
              sortOrder: cat.sortOrder,
            });
          } else {
            return storage.createFeeCategory({
              propertyId,
              name: cat.name,
              rate: cat.rate,
              isActive: cat.isActive,
              sortOrder: cat.sortOrder,
            });
          }
        })
      )).filter(Boolean);
      invalidateComputeCache();
      logActivity(req, "update", "fee-categories", propertyId);
      res.json(results);
    } catch (error) {
      logAndSendError(res, "Failed to save fee categories", error);
    }
  });

  app.get("/api/fee-categories/all", requireAuth, async (_req, res) => {
    try {
      const categories = await storage.getAllFeeCategories();
      res.json(categories);
    } catch (error) {
      logAndSendError(res, "Failed to fetch fee categories", error);
    }
  });
}
