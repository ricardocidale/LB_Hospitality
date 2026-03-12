import type { Express, Request, Response } from "express";
import { requireAdmin } from "../auth";
import { cache } from "../cache";
import { type CircuitState } from "../integrations/base";
import { getTwilioHealthCheck } from "../integrations/twilio";
import { getElevenLabsHealthCheck } from "../integrations/elevenlabs";
import { getGmailHealthCheck } from "../integrations/gmail";
import { getStripeHealthCheck } from "../integrations/stripeClient";

interface IntegrationStatusResponse {
  name: string;
  healthy: boolean;
  latencyMs: number;
  lastError?: string;
  lastErrorAt?: number;
  circuitState: CircuitState;
}

export function register(app: Express) {
  app.get("/api/admin/integrations/health", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const checks = await Promise.allSettled([
        getTwilioHealthCheck(),
        getElevenLabsHealthCheck(),
        getGmailHealthCheck(),
        getStripeHealthCheck(),
      ]);

      const results: IntegrationStatusResponse[] = checks.map((result) => {
        if (result.status === "fulfilled") return result.value;
        return {
          name: "unknown",
          healthy: false,
          latencyMs: 0,
          lastError: result.reason?.message || "Health check failed",
          circuitState: "closed" as CircuitState,
        };
      });

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/integrations/cache/stats", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const stats = await cache.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/integrations/cache/clear", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { pattern } = req.body;
      if (pattern) {
        const deleted = await cache.invalidate(pattern);
        res.json({ deleted, pattern });
      } else {
        await cache.clearAll();
        res.json({ cleared: true });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/integrations/cache/clear-property/:propertyId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const projections = await cache.invalidate(`projections:${propertyId}:*`);
      const research = await cache.invalidate(`research:${propertyId}:*`);
      res.json({ deleted: projections + research, propertyId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
