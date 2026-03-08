import { type Express } from "express";
import { storage } from "../../storage";
import { requireAdmin } from "../../auth";
import { type InsertGlobalAssumptions, type ResearchConfig } from "@shared/schema";
import { logAndSendError } from "../helpers";

export function registerResearchConfigRoutes(app: Express) {
  // GET /api/admin/research-config — return current per-event research configuration
  app.get("/api/admin/research-config", requireAdmin, async (_req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });
      res.json((ga.researchConfig as ResearchConfig) ?? {});
    } catch (error) {
      logAndSendError(res, "Failed to fetch research config", error);
    }
  });

  // PUT /api/admin/research-config — merge patch into researchConfig and persist
  app.put("/api/admin/research-config", requireAdmin, async (req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });

      const incoming: ResearchConfig = req.body ?? {};
      const current: ResearchConfig = (ga.researchConfig as ResearchConfig) ?? {};

      // Deep-merge: incoming event config overwrites current event config per type
      const merged: ResearchConfig = {
        property: incoming.property !== undefined ? { ...current.property, ...incoming.property } : current.property,
        company:  incoming.company  !== undefined ? { ...current.company,  ...incoming.company  } : current.company,
        global:   incoming.global   !== undefined ? { ...current.global,   ...incoming.global   } : current.global,
      };

      await storage.upsertGlobalAssumptions({ researchConfig: merged } as InsertGlobalAssumptions);
      res.json(merged);
    } catch (error) {
      logAndSendError(res, "Failed to update research config", error);
    }
  });
}
