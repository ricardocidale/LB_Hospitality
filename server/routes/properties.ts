import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireManagementAccess } from "../auth";
import { insertPropertySchema, updatePropertySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { logActivity } from "./helpers";
import { generateLocationAwareResearchValues } from "../researchSeeds";

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
      const properties = await storage.getAllProperties(req.user!.id);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
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
      console.error("Error fetching property:", error);
      res.status(500).json({ error: "Failed to fetch property" });
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
        userId: req.user!.id,
      });

      // Seed default fee categories for the new property
      await storage.seedDefaultFeeCategories(property.id);
      
      logActivity(req, "create", "property", property.id, property.name);
      res.status(201).json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({ error: "Failed to create property" });
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
      console.error("Error updating property:", error);
      res.status(500).json({ error: "Failed to update property" });
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
      console.error("Error deleting property:", error);
      res.status(500).json({ error: "Failed to delete property" });
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
      console.error("Error seeding research:", error);
      res.status(500).json({ error: "Failed to seed research" });
    }
  });

  // Fee categories for a property
  app.get("/api/properties/:id/fee-categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getFeeCategoriesByProperty(Number(req.params.id));
      res.json(categories);
    } catch (error) {
      console.error("Error fetching fee categories:", error);
      res.status(500).json({ error: "Failed to fetch fee categories" });
    }
  });
}
