import { type Express } from "express";
import { storage } from "../../storage";
import { requireAdmin, requireAuth } from "../../auth";
import { runFillOnlySync } from "../../syncHelpers";

export function registerToolRoutes(app: Express) {
  app.get("/api/admin/checker-activity", requireAdmin, async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const checkerUsers = allUsers.filter((u: any) => u.role === "checker" || u.role === "admin");
      const checkers = [];
      let totalActions = 0, verificationRuns = 0, manualViews = 0, exports = 0, pageVisits = 0, roleChanges = 0;
      const recentActivity: any[] = [];

      for (const user of checkerUsers) {
        const logs = await storage.getActivityLogs({ userId: user.id, limit: 100 });
        const userActions = logs.length;
        const userVerifications = logs.filter((l: any) => l.action === "run-verification").length;
        const userManualViews = logs.filter((l: any) => l.action === "view-manual" || l.entityType === "manual").length;
        const userExports = logs.filter((l: any) => l.action?.includes("export")).length;

        totalActions += userActions;
        verificationRuns += userVerifications;
        manualViews += userManualViews;
        exports += userExports;

        checkers.push({
          id: user.id,
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          totalActions: userActions,
          lastActive: logs[0]?.createdAt ?? null,
          verificationRuns: userVerifications,
          manualViews: userManualViews,
          exports: userExports,
        });

        recentActivity.push(...logs.slice(0, 10));
      }

      recentActivity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({
        checkers,
        summary: { totalActions, verificationRuns, manualViews, exports, pageVisits, roleChanges },
        recentActivity: recentActivity.slice(0, 50),
      });
    } catch (error) {
      console.error("Error fetching checker activity:", error);
      res.status(500).json({ error: "Failed to fetch checker activity" });
    }
  });

  app.post("/api/admin/seed-production", requireAdmin, async (_req, res) => {
    try {
      const { runFillOnlySync: fill } = await import("../../syncHelpers");
      const result = await fill(storage);
      res.json({ success: true, message: "Missing values populated", ...result });
    } catch (error: any) {
      console.error("Error seeding production:", error);
      res.status(500).json({ error: error.message || "Fill failed" });
    }
  });

  app.post("/api/admin/fill-missing-research", requireAdmin, async (req, res) => {
    try {
      const result = await runFillOnlySync(storage);
      res.json(result);
    } catch (error) {
      console.error("Error backfilling research:", error);
      res.status(500).json({ error: "Failed to backfill research" });
    }
  });

  app.get("/api/admin/login-logs", requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getLoginLogs();
      res.json(logs.map((log: any) => ({
        id: log.id,
        email: log.user.email,
        ipAddress: log.ipAddress,
        loginAt: log.loginAt,
        logoutAt: log.logoutAt,
      })));
    } catch (error) {
      console.error("Error fetching login logs:", error);
      res.status(500).json({ error: "Failed to fetch login logs" });
    }
  });

  app.get("/api/admin/health-check", requireAdmin, async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/admin/sync-status", requireAdmin, async (req, res) => {
    try {
      const properties = await storage.getAllProperties(req.user!.id);
      const status = properties.map((p: any) => ({
        id: p.id,
        name: p.name,
        hasResearch: !!p.researchValues,
        lastUpdated: p.updatedAt,
      }));
      res.json(status);
    } catch (error) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ error: "Failed to fetch sync status" });
    }
  });

  app.get("/api/admin/active-sessions", requireAdmin, async (req, res) => {
    try {
      const sessions = await storage.getActiveSessions();
      res.json(sessions.map((s: any) => ({
        id: s.id,
        userId: s.userId,
        email: s.user.email,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
      })));
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch active sessions" });
    }
  });

  app.delete("/api/admin/sessions/:id", requireAdmin, async (req, res) => {
    try {
      await storage.forceDeleteSession(String(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  app.get("/api/activity-logs", requireAuth, async (req, res) => {
    try {
      const { userId, entityType, from, to, limit, offset } = req.query;
      const logs = await storage.getActivityLogs({
        userId: userId ? Number(userId) : undefined,
        entityType: entityType as string,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      });
      res.json(logs.map((l: any) => ({
        ...l,
        userName: `${l.user.firstName} ${l.user.lastName}`.trim() || l.user.email,
      })));
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });
}
