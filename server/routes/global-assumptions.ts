import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireManagementAccess } from "../auth";
import { insertGlobalAssumptionsSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { logActivity } from "./helpers";

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
      console.error("Error fetching global assumptions:", error);
      res.status(500).json({ error: "Failed to fetch global assumptions" });
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
      console.error("Error updating global assumptions:", error);
      res.status(500).json({ error: "Failed to update global assumptions" });
    }
  });
}
