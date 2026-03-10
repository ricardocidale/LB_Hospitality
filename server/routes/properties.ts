import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireManagementAccess } from "../auth";
import { insertPropertySchema, updatePropertySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { logActivity, logAndSendError } from "./helpers";
import { generateLocationAwareResearchValues } from "../data/researchSeeds";

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
      let props = await storage.getAllProperties(req.user!.id);
      // Apply group visibility filter for non-admin users in a group.
      // Non-admins see only group-assigned properties; fall through to the full
      // list if the group has no explicit property assignments (allowedIds empty).
      const user = req.user!;
      if (user.role !== "admin" && user.userGroupId) {
        const allowedIds = await storage.getGroupPropertyIds(user.userGroupId);
        if (allowedIds.length > 0) {
          props = props.filter((p) => allowedIds.includes(p.id));
        }
      }
      res.json(props);
    } catch (error) {
      logAndSendError(res, "Failed to fetch properties", error);
    }
  });

  // Group property visibility
  app.get("/api/user-groups/:id/properties", requireAuth, async (req, res) => {
    try {
      const ids = await storage.getGroupPropertyIds(Number(req.params.id));
      res.json(ids);
    } catch (error) {
      logAndSendError(res, "Failed to fetch group properties", error);
    }
  });

  app.put("/api/user-groups/:id/properties", requireAuth, async (req, res) => {
    try {
      const propertyIds: number[] = req.body.propertyIds ?? [];
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
      res.json(property);
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
      
      const property = await storage.createProperty({
        ...validation.data,
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

      logActivity(req, "create", "property", property.id, property.name);
      res.status(201).json(property);
    } catch (error) {
      logAndSendError(res, "Failed to create property", error);
    }
  });

  app.patch("/api/properties/:id", requireManagementAccess, async (req, res) => {
    try {
      const validation = updatePropertySchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const property = await storage.updateProperty(Number(req.params.id), validation.data);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      logActivity(req, "update", "property", property.id, property.name, { updates: req.body });
      res.json(property);
    } catch (error) {
      logAndSendError(res, "Failed to update property", error);
    }
  });

  app.delete("/api/properties/:id", requireManagementAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      await storage.deleteProperty(id);
      logActivity(req, "delete", "property", id, property.name);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to delete property", error);
    }
  });

  app.post("/api/properties/:id/seed-research", requireManagementAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
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
      const categories = await storage.getFeeCategoriesByProperty(Number(req.params.id));
      res.json(categories);
    } catch (error) {
      logAndSendError(res, "Failed to fetch fee categories", error);
    }
  });

  app.put("/api/properties/:id/fee-categories", requireAuth, async (req, res) => {
    try {
      const propertyId = Number(req.params.id);
      const categories = req.body as Array<{ id?: number; name: string; rate: number; isActive: boolean; sortOrder: number }>;
      const results = [];
      for (const cat of categories) {
        if (cat.id) {
          const updated = await storage.updateFeeCategory(cat.id, {
            name: cat.name,
            rate: cat.rate,
            isActive: cat.isActive,
            sortOrder: cat.sortOrder,
          });
          if (updated) results.push(updated);
        } else {
          const created = await storage.createFeeCategory({
            propertyId,
            name: cat.name,
            rate: cat.rate,
            isActive: cat.isActive,
            sortOrder: cat.sortOrder,
          });
          results.push(created);
        }
      }
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
