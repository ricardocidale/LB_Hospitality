import type { Express } from "express";
import { storage } from "../storage";
import { requireManagementAccess, requireAuth } from "../auth";
import { updateScenarioSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { logActivity, createScenarioSchema, MAX_SCENARIOS_PER_USER } from "./helpers";

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
      console.error("Error fetching scenarios:", error);
      res.status(500).json({ error: "Failed to fetch scenarios" });
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
      
      const propertyFeeCategories: Record<string, any[]> = {};
      for (const p of properties) {
        propertyFeeCategories[p.name] = await storage.getFeeCategoriesByProperty(p.id);
      }

      const scenario = await storage.createScenario({
        userId: req.user!.id,
        name: validation.data.name,
        description: validation.data.description,
        globalAssumptions: assumptions as any,
        properties: properties as any,
        feeCategories: propertyFeeCategories as any,
      });

      logActivity(req, "create", "scenario", scenario.id, scenario.name);
      res.status(201).json(scenario);
    } catch (error) {
      console.error("Error creating scenario:", error);
      res.status(500).json({ error: "Failed to create scenario" });
    }
  });

  app.patch("/api/scenarios/:id", requireManagementAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const validation = updateScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const scenario = await storage.updateScenario(id, validation.data);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });

      logActivity(req, "update", "scenario", id, scenario.name);
      res.json(scenario);
    } catch (error) {
      console.error("Error updating scenario:", error);
      res.status(500).json({ error: "Failed to update scenario" });
    }
  });

  app.post("/api/scenarios/:id/load", requireManagementAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scenario = await storage.getScenario(id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });

      await storage.loadScenario(
        req.user!.id,
        scenario.globalAssumptions as any,
        scenario.properties as any,
        scenario.feeCategories as any
      );

      logActivity(req, "load", "scenario", id, scenario.name);
      res.json({ success: true });
    } catch (error) {
      console.error("Error loading scenario:", error);
      res.status(500).json({ error: "Failed to load scenario" });
    }
  });

  app.delete("/api/scenarios/:id", requireManagementAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scenario = await storage.getScenario(id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });

      if (scenario.name === "Development") {
        return res.status(400).json({ error: "The default Development scenario cannot be deleted" });
      }

      await storage.deleteScenario(id);
      logActivity(req, "delete", "scenario", id, scenario.name);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scenario:", error);
      res.status(500).json({ error: "Failed to delete scenario" });
    }
  });
}
