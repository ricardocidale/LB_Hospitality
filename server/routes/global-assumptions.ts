import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireManagementAccess, requireAdmin } from "../auth";
import { insertGlobalAssumptionsSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { logActivity, logAndSendError } from "./helpers";
import { z } from "zod";

export function register(app: Express) {
  // ────────────────────────────────────────────────────────────
  // GLOBAL ASSUMPTIONS
  // The "Settings" page: financial model parameters, company info, feature toggles.
  // PUT uses upsert logic (creates on first save, updates thereafter).
  // ────────────────────────────────────────────────────────────

  app.get("/api/global-assumptions", requireAuth, async (req, res) => {
    try {
      const assumptions = await storage.getGlobalAssumptions(req.user!.id);
      res.json(assumptions);
    } catch (error) {
      logAndSendError(res, "Failed to fetch global assumptions", error);
    }
  });

  // PATCH — partial updates for admin-configurable subsections (e.g. Rebecca config)
  const rebeccaPatchSchema = z.object({
    rebeccaEnabled: z.boolean().optional(),
    rebeccaDisplayName: z.string().min(1).max(50).optional(),
    rebeccaSystemPrompt: z.string().max(5000).nullable().optional(),
  });

  app.patch("/api/global-assumptions", requireAdmin, async (req, res) => {
    try {
      const validation = rebeccaPatchSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      const current = await storage.getGlobalAssumptions(req.user!.id);
      if (!current) {
        return res.status(404).json({ error: "Global assumptions not found" });
      }
      // Mutual exclusion: enabling Rebecca disables Marcela
      const patch: Record<string, unknown> = { ...validation.data, updatedAt: new Date() };
      if (validation.data.rebeccaEnabled === true) {
        patch.marcelaEnabled = false;
        patch.showAiAssistant = false;
      }
      const updated = await storage.patchGlobalAssumptions(current.id, patch);
      logActivity(req, "update", "global_assumptions", updated.id, "Rebecca Config");
      res.json(updated);
    } catch (error) {
      logAndSendError(res, "Failed to update global assumptions", error);
    }
  });

  app.put("/api/global-assumptions", requireManagementAccess, async (req, res) => {
    try {
      const validation = insertGlobalAssumptionsSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const assumptions = await storage.upsertGlobalAssumptions(validation.data, req.user!.id);
      logActivity(req, "update", "global_assumptions", assumptions.id, "System Settings");
      res.json(assumptions);
    } catch (error) {
      logAndSendError(res, "Failed to update global assumptions", error);
    }
  });
}
