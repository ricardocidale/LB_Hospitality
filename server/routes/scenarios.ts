import type { Express } from "express";
import { storage } from "../storage";
import { requireManagementAccess, requireAuth } from "../auth";
import { updateScenarioSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { logActivity, logAndSendError, createScenarioSchema, MAX_SCENARIOS_PER_USER } from "./helpers";

export function register(app: Express) {
  // ────────────────────────────────────────────────────────────
  // SCENARIOS
  // Save/load/clone/export/import scenario snapshots for what-if analysis.
  // ────────────────────────────────────────────────────────────

  app.get("/api/scenarios", requireAuth, async (req, res) => {
    try {
      const scenarios = await storage.getScenariosByUser(req.user!.id);
      res.json(scenarios);
    } catch (error) {
      logAndSendError(res, "Failed to fetch scenarios", error);
    }
  });

  app.post("/api/scenarios", requireManagementAccess, async (req, res) => {
    try {
      const validation = createScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const existing = await storage.getScenariosByUser(req.user!.id);
      if (existing.length >= MAX_SCENARIOS_PER_USER) {
        return res.status(400).json({ error: `Maximum of ${MAX_SCENARIOS_PER_USER} scenarios allowed` });
      }

      // Snapshots of current data
      const assumptions = await storage.getGlobalAssumptions(req.user!.id);
      const properties = await storage.getAllProperties(req.user!.id);
      
      // Bulk fetch fee categories and photos in 2 queries instead of 2N
      const propertyIds = properties.map(p => p.id);
      const [feeCatsByPropId, photosByPropId] = await Promise.all([
        storage.getFeeCategoriesByProperties(propertyIds),
        storage.getPhotosByProperties(propertyIds),
      ]);

      const propertyFeeCategories: Record<string, any[]> = {};
      const propertyPhotos: Record<string, any[]> = {};
      for (const p of properties) {
        propertyFeeCategories[p.name] = feeCatsByPropId[p.id] || [];
        propertyPhotos[p.name] = photosByPropId[p.id] || [];
      }

      const scenario = await storage.createScenario({
        userId: req.user!.id,
        name: validation.data.name,
        description: validation.data.description,
        globalAssumptions: assumptions as any,
        properties: properties as any,
        feeCategories: propertyFeeCategories as any,
        propertyPhotos: propertyPhotos as any,
      });

      logActivity(req, "create", "scenario", scenario.id, scenario.name);
      res.status(201).json(scenario);
    } catch (error) {
      logAndSendError(res, "Failed to create scenario", error);
    }
  });

  app.patch("/api/scenarios/:id", requireManagementAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getScenario(id);
      if (!existing) return res.status(404).json({ error: "Scenario not found" });
      if (existing.userId !== req.user!.id) return res.status(403).json({ error: "Access denied" });

      const validation = updateScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const scenario = await storage.updateScenario(id, validation.data);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });

      logActivity(req, "update", "scenario", id, scenario.name);
      res.json(scenario);
    } catch (error) {
      logAndSendError(res, "Failed to update scenario", error);
    }
  });

  app.post("/api/scenarios/:id/load", requireManagementAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scenario = await storage.getScenario(id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      if (scenario.userId !== req.user!.id) return res.status(403).json({ error: "Access denied" });

      await storage.loadScenario(
        req.user!.id,
        scenario.globalAssumptions as any,
        scenario.properties as any,
        scenario.feeCategories as any,
        (scenario as any).propertyPhotos as any
      );

      logActivity(req, "load", "scenario", id, scenario.name);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to load scenario", error);
    }
  });

  app.delete("/api/scenarios/:id", requireManagementAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scenario = await storage.getScenario(id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      if (scenario.userId !== req.user!.id) return res.status(403).json({ error: "Access denied" });

      if (scenario.name === "Development") {
        return res.status(400).json({ error: "The default Development scenario cannot be deleted" });
      }

      await storage.deleteScenario(id);
      logActivity(req, "delete", "scenario", id, scenario.name);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to delete scenario", error);
    }
  });
}
