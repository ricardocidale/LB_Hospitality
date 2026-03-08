import { type Express } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { requireAdmin } from "../../auth";
import { type InsertGlobalAssumptions, type ResearchConfig } from "@shared/schema";
import { logAndSendError } from "../helpers";

const researchEventConfigSchema = z.object({
  enabled: z.boolean().optional(),
  focusAreas: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  timeHorizon: z.string().optional(),
  customInstructions: z.string().optional(),
  customQuestions: z.string().optional(),
  enabledTools: z.array(z.string()).optional(),
  refreshIntervalDays: z.number().min(3).max(14).optional(),
}).strict();

const customSourceSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  category: z.string(),
});

const researchConfigSchema = z.object({
  property: researchEventConfigSchema.optional(),
  company: researchEventConfigSchema.optional(),
  global: researchEventConfigSchema.optional(),
  preferredLlm: z.string().optional(),
  customSources: z.array(customSourceSchema).optional(),
}).strict();

export function registerResearchConfigRoutes(app: Express) {
  app.get("/api/admin/research-config", requireAdmin, async (_req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });
      res.json((ga.researchConfig as ResearchConfig) ?? {});
    } catch (error) {
      logAndSendError(res, "Failed to fetch research config", error);
    }
  });

  app.put("/api/admin/research-config", requireAdmin, async (req, res) => {
    try {
      const parsed = researchConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid research config", details: parsed.error.flatten() });
      }

      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });

      const incoming = parsed.data;
      const current: ResearchConfig = (ga.researchConfig as ResearchConfig) ?? {};

      const merged: ResearchConfig = {
        property: incoming.property !== undefined ? { ...current.property, ...incoming.property } : current.property,
        company:  incoming.company  !== undefined ? { ...current.company,  ...incoming.company  } : current.company,
        global:   incoming.global   !== undefined ? { ...current.global,   ...incoming.global   } : current.global,
        preferredLlm: incoming.preferredLlm ?? current.preferredLlm,
        customSources: incoming.customSources ?? current.customSources,
      };

      await storage.upsertGlobalAssumptions({ researchConfig: merged } as InsertGlobalAssumptions);
      res.json(merged);
    } catch (error) {
      logAndSendError(res, "Failed to update research config", error);
    }
  });
}
