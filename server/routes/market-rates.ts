/**
 * market-rates routes — CRUD + refresh endpoints for live market rates.
 */
import type { Express, Request, Response } from "express";
import { requireAuth } from "../auth";
import { sendError, logAndSendError } from "./helpers";
import {
  getAllMarketRates,
  getMarketRate,
  upsertMarketRate,
  forceRefreshRate,
  refreshAllStaleRates,
} from "../data/marketRates";

function requireAdmin(req: Request, res: Response, next: Function) {
  if (req.user?.role !== "admin") {
    return sendError(res, 403, "Admin access required");
  }
  next();
}

export function register(app: Express) {
  // GET /api/market-rates — list all rates with staleness status
  app.get("/api/market-rates", requireAuth, async (_req: Request, res: Response) => {
    try {
      const rates = await getAllMarketRates();
      const now = Date.now();

      const enriched = rates.map((r) => {
        const ageMs = r.fetchedAt ? now - new Date(r.fetchedAt).getTime() : Infinity;
        const thresholdMs = (r.maxStalenessHours ?? 24) * 60 * 60 * 1000;
        const stalePct = Math.min(ageMs / thresholdMs, 2); // cap at 200%
        let status: "fresh" | "warning" | "stale" | "missing" = "missing";
        if (r.value == null) status = "missing";
        else if (stalePct < 0.75) status = "fresh";
        else if (stalePct < 1.0) status = "warning";
        else status = "stale";

        return { ...r, status, stalePct: Math.round(stalePct * 100) };
      });

      res.json(enriched);
    } catch (error) {
      logAndSendError(res, "Failed to fetch market rates", error);
    }
  });

  // POST /api/market-rates/:key/refresh — force refresh one rate
  app.post("/api/market-rates/:key/refresh", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const key = String(req.params.key);
      const ok = await forceRefreshRate(key);
      if (!ok) return sendError(res, 404, "Rate not found or could not be refreshed");
      const updated = await getMarketRate(key);
      res.json(updated);
    } catch (error) {
      logAndSendError(res, "Failed to refresh rate", error);
    }
  });

  // POST /api/market-rates/refresh-all — force refresh all stale rates
  app.post("/api/market-rates/refresh-all", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const count = await refreshAllStaleRates();
      res.json({ refreshed: count });
    } catch (error) {
      logAndSendError(res, "Failed to refresh rates", error);
    }
  });

  // PATCH /api/market-rates/:key — admin override
  app.patch("/api/market-rates/:key", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const key = String(req.params.key);
      const existing = await getMarketRate(key);
      if (!existing) return sendError(res, 404, "Rate not found");

      const { value, manualNote } = req.body;
      if (value == null) return sendError(res, 400, "value is required");

      await upsertMarketRate({
        rateKey: key,
        value: parseFloat(value),
        displayValue: String(value),
        source: existing.source,
        isManual: true,
        manualNote: manualNote || null,
        fetchedAt: new Date(),
      });

      const updated = await getMarketRate(key);
      res.json(updated);
    } catch (error) {
      logAndSendError(res, "Failed to update rate", error);
    }
  });
}
