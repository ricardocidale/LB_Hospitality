import { Router, type Request, type Response } from "express";
import { pool } from "../db";
import { getCacheStatus } from "../finance/cache";
import { logger } from "../logger";

const router = Router();
const startedAt = Date.now();

router.get("/api/health/live", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: Math.floor((Date.now() - startedAt) / 1000) });
});

router.get("/api/health/ready", async (_req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    logger.error(`Readiness check failed: ${err instanceof Error ? err.message : err}`, "health");
    res.status(503).json({ status: "not_ready", db: "disconnected" });
  }
});

router.get("/api/health/deep", async (_req: Request, res: Response) => {
  const checks: Record<string, unknown> = {};

  try {
    const result = await pool.query("SELECT NOW() AS server_time");
    checks.database = {
      status: "ok",
      serverTime: result.rows[0]?.server_time,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    };
  } catch (err) {
    checks.database = { status: "error", message: err instanceof Error ? err.message : String(err) };
  }

  const cacheInfo = getCacheStatus();
  checks.cache = {
    status: "ok",
    entries: cacheInfo.size,
    hitRate: cacheInfo.hitRate,
  };

  checks.process = {
    status: "ok",
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    nodeVersion: process.version,
  };

  const allOk = Object.values(checks).every((c: any) => c.status === "ok");
  res.status(allOk ? 200 : 503).json({ status: allOk ? "healthy" : "degraded", checks });
});

export default router;
