import type { Express } from "express";
import { storage } from "../storage";
import { requireManagementAccess, requireAuth } from "../auth";
import { updateScenarioSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import { logActivity, logAndSendError, createScenarioSchema, MAX_SCENARIOS_PER_USER } from "./helpers";

function requireScenarioPermission(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  if (!req.user.canManageScenarios) {
    return res.status(403).json({ error: "Scenario management is disabled for your account" });
  }
  next();
}

export function register(app: Express) {
  app.get("/api/scenarios", requireAuth, async (req, res) => {
    try {
      const scenarios = await storage.getScenariosByUser(req.user!.id);
      res.json(scenarios);
    } catch (error) {
      logAndSendError(res, "Failed to fetch scenarios", error);
    }
  });

  app.post("/api/scenarios", requireManagementAccess, requireScenarioPermission, async (req, res) => {
    try {
      const validation = createScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const existing = await storage.getScenariosByUser(req.user!.id);
      if (existing.length >= MAX_SCENARIOS_PER_USER) {
        return res.status(400).json({ error: `Maximum of ${MAX_SCENARIOS_PER_USER} scenarios allowed` });
      }

      const assumptions = await storage.getGlobalAssumptions(req.user!.id);
      const properties = await storage.getAllProperties(req.user!.id);
      
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

  app.patch("/api/scenarios/:id", requireManagementAccess, requireScenarioPermission, async (req, res) => {
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

  app.delete("/api/scenarios/:id", requireManagementAccess, requireScenarioPermission, async (req, res) => {
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

  app.post("/api/scenarios/:id/clone", requireManagementAccess, requireScenarioPermission, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scenario = await storage.getScenario(id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      if (scenario.userId !== req.user!.id) return res.status(403).json({ error: "Access denied" });

      const existing = await storage.getScenariosByUser(req.user!.id);
      if (existing.length >= MAX_SCENARIOS_PER_USER) {
        return res.status(400).json({ error: `Maximum of ${MAX_SCENARIOS_PER_USER} scenarios allowed` });
      }

      const cloned = await storage.cloneScenario(id, req.user!.id);
      logActivity(req, "clone", "scenario", cloned.id, cloned.name);
      res.status(201).json(cloned);
    } catch (error) {
      logAndSendError(res, "Failed to clone scenario", error);
    }
  });

  app.get("/api/scenarios/:id/export", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scenario = await storage.getScenario(id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      if (scenario.userId !== req.user!.id) return res.status(403).json({ error: "Access denied" });

      const exportData: Record<string, unknown> = {
        name: scenario.name,
        description: scenario.description,
        globalAssumptions: scenario.globalAssumptions,
        properties: scenario.properties,
        feeCategories: scenario.feeCategories,
      };

      logActivity(req, "export", "scenario", id, scenario.name);
      const filename = scenario.name.replace(/[^a-zA-Z0-9-_ ]/g, "") + ".json";
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.json(exportData);
    } catch (error) {
      logAndSendError(res, "Failed to export scenario", error);
    }
  });

  const importScenarioSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).nullable().optional(),
    globalAssumptions: z.record(z.unknown()),
    properties: z.array(z.record(z.unknown())),
    feeCategories: z.record(z.array(z.record(z.unknown()))).optional(),
  });

  app.post("/api/scenarios/import", requireManagementAccess, requireScenarioPermission, async (req, res) => {
    try {
      const validation = importScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const existing = await storage.getScenariosByUser(req.user!.id);
      if (existing.length >= MAX_SCENARIOS_PER_USER) {
        return res.status(400).json({ error: `Maximum of ${MAX_SCENARIOS_PER_USER} scenarios allowed` });
      }

      const data = validation.data;
      const scenario = await storage.createScenario({
        userId: req.user!.id,
        name: data.name,
        description: data.description ?? null,
        globalAssumptions: data.globalAssumptions as any,
        properties: data.properties as any,
        feeCategories: (data.feeCategories || {}) as any,
      });

      logActivity(req, "import", "scenario", scenario.id, scenario.name);
      res.status(201).json(scenario);
    } catch (error) {
      logAndSendError(res, "Failed to import scenario", error);
    }
  });

  app.get("/api/scenarios/:id1/compare/:id2", requireAuth, async (req, res) => {
    try {
      const id1 = Number(req.params.id1);
      const id2 = Number(req.params.id2);
      const [s1, s2] = await Promise.all([
        storage.getScenario(id1),
        storage.getScenario(id2),
      ]);
      if (!s1 || !s2) return res.status(404).json({ error: "Scenario not found" });
      if (s1.userId !== req.user!.id || s2.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const result = storage.compareScenarios(s1, s2);
      res.json(result);
    } catch (error) {
      logAndSendError(res, "Failed to compare scenarios", error);
    }
  });
}
