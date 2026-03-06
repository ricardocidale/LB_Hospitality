import type { Express } from "express";
import { storage } from "../storage";
import { requireAdmin, requireAuth } from "../auth";
import { userResponse, createUserSchema } from "./helpers";
import { fromZodError } from "zod-validation-error";
import { runFillOnlySync } from "../syncHelpers";
import { z } from "zod";
import type { InsertGlobalAssumptions } from "@shared/schema";
import { getTwilioStatus, sendSMS } from "../integrations/twilio";
import { hashPassword } from "../auth";

export function register(app: Express) {
  // ────────────────────────────────────────────────────────────
  // ADMIN: USER MANAGEMENT
  // Full CRUD for user accounts. Only admins can access these endpoints.
  // Includes role changes, password resets, group/company assignment, and
  // force-logging out users.
  // ────────────────────────────────────────────────────────────

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({ ...userResponse(u), createdAt: u.createdAt, userGroupId: u.userGroupId })));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const validation = createUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      
      const existingUser = await storage.getUserByEmail(validation.data.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const { email, password, role, firstName, lastName, company, companyId, title } = validation.data;
      const { hashPassword } = await import("../auth");
      const passwordHash = await hashPassword(password);
      
      const user = await storage.createUser({
        email,
        passwordHash,
        role,
        firstName,
        lastName,
        company,
        companyId,
        title,
      });

      res.status(201).json(userResponse(user));
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { email, firstName, lastName, company, title, role } = req.body;

      if (role && id === req.user!.id) {
        return res.status(400).json({ error: "You cannot change your own role" });
      }

      const profileData: Record<string, any> = {};
      if (email !== undefined) profileData.email = email;
      if (firstName !== undefined) profileData.firstName = firstName;
      if (lastName !== undefined) profileData.lastName = lastName;
      if (company !== undefined) profileData.company = company;
      if (title !== undefined) profileData.title = title;

      if (Object.keys(profileData).length > 0) {
        await storage.updateUserProfile(id, profileData as any);
      }

      if (role) {
        await storage.updateUserRole(id, role);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      const id = Number(req.params.id);
      
      if (id === req.user!.id) {
        return res.status(400).json({ error: "You cannot change your own role" });
      }

      await storage.updateUserRole(id, role);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (id === req.user!.id) {
        return res.status(400).json({ error: "You cannot delete yourself" });
      }
      
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/admin/users/:id/password", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { password } = req.body;
      if (!password || password.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters" });
      }
      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(id, passwordHash);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  app.patch("/api/admin/users/:id/group", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { groupId } = req.body;
      const user = await storage.assignUserToGroup(id, groupId ?? null);
      res.json(user);
    } catch (error) {
      console.error("Error assigning user to group:", error);
      res.status(500).json({ error: "Failed to assign user to group" });
    }
  });

  app.post("/api/admin/reset-all-passwords", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const defaultHash = await hashPassword("admin");
      let count = 0;
      for (const user of allUsers) {
        await storage.updateUserPassword(user.id, defaultHash);
        count++;
      }
      res.json({ success: true, message: `Reset passwords for ${count} users` });
    } catch (error) {
      console.error("Error resetting all passwords:", error);
      res.status(500).json({ error: "Failed to reset passwords" });
    }
  });

  app.get("/api/admin/checker-activity", requireAdmin, async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const checkerUsers = allUsers.filter(u => u.role === "checker" || u.role === "admin");
      const checkers = [];
      let totalActions = 0, verificationRuns = 0, manualViews = 0, exports = 0, pageVisits = 0, roleChanges = 0;
      const recentActivity: any[] = [];

      for (const user of checkerUsers) {
        const logs = await storage.getActivityLogs({ userId: user.id, limit: 100 });
        const userActions = logs.length;
        const userVerifications = logs.filter(l => l.action === "run-verification").length;
        const userManualViews = logs.filter(l => l.action === "view-manual" || l.entityType === "manual").length;
        const userExports = logs.filter(l => l.action?.includes("export")).length;

        totalActions += userActions;
        verificationRuns += userVerifications;
        manualViews += userManualViews;
        exports += userExports;

        checkers.push({
          id: user.id,
          email: user.email,
          name: user.name,
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
      const { runFillOnlySync: fill } = await import("../syncHelpers");
      const result = await fill();
      res.json({ success: true, message: "Missing values populated", ...result });
    } catch (error: any) {
      console.error("Error seeding production:", error);
      res.status(500).json({ error: error.message || "Fill failed" });
    }
  });

  // ────────────────────────────────────────────────────────────
  // ADMIN: TOOLS
  // ────────────────────────────────────────────────────────────

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
      res.json(logs.map(log => ({
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
      const status = properties.map(p => ({
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
      res.json(sessions.map(s => ({
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
      res.json(logs.map(l => ({
        ...l,
        userName: `${l.user.firstName} ${l.user.lastName}`.trim() || l.user.email,
      })));
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  app.get("/api/admin/voice-settings", requireAdmin, async (_req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });
      res.json({
        marcelaVoiceId: ga.marcelaVoiceId,
        marcelaTtsModel: ga.marcelaTtsModel,
        marcelaSttModel: ga.marcelaSttModel,
        marcelaOutputFormat: ga.marcelaOutputFormat,
        marcelaStability: ga.marcelaStability,
        marcelaSimilarityBoost: ga.marcelaSimilarityBoost,
        marcelaSpeakerBoost: ga.marcelaSpeakerBoost,
        marcelaChunkSchedule: ga.marcelaChunkSchedule,
        marcelaLlmModel: ga.marcelaLlmModel,
        marcelaMaxTokens: ga.marcelaMaxTokens,
        marcelaMaxTokensVoice: ga.marcelaMaxTokensVoice,
        marcelaEnabled: ga.marcelaEnabled,
        showAiAssistant: ga.showAiAssistant,
        marcelaTwilioEnabled: ga.marcelaTwilioEnabled,
        marcelaSmsEnabled: ga.marcelaSmsEnabled,
        marcelaPhoneGreeting: ga.marcelaPhoneGreeting,
      });
    } catch (error) {
      console.error("Error fetching voice settings:", error);
      res.status(500).json({ error: "Failed to fetch voice settings" });
    }
  });

  app.post("/api/admin/voice-settings", requireAdmin, async (req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });
      const allowedFields = [
        "marcelaVoiceId", "marcelaTtsModel", "marcelaSttModel", "marcelaOutputFormat",
        "marcelaStability", "marcelaSimilarityBoost", "marcelaSpeakerBoost",
        "marcelaChunkSchedule", "marcelaLlmModel", "marcelaMaxTokens",
        "marcelaMaxTokensVoice", "marcelaEnabled", "showAiAssistant",
        "marcelaTwilioEnabled", "marcelaSmsEnabled", "marcelaPhoneGreeting",
      ] as const;
      const patch: Partial<Record<string, unknown>> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          patch[field] = req.body[field];
        }
      }
      const updated = await storage.upsertGlobalAssumptions({ ...ga, ...patch } as InsertGlobalAssumptions);
      res.json(updated);
    } catch (error) {
      console.error("Error updating voice settings:", error);
      res.status(500).json({ error: "Failed to update voice settings" });
    }
  });

  app.get("/api/admin/twilio-status", requireAdmin, async (_req, res) => {
    try {
      const status = await getTwilioStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching Twilio status:", error);
      res.json({ connected: false, phoneNumber: null, error: "Failed to check Twilio status" });
    }
  });

  app.get("/api/admin/knowledge-base-status", requireAdmin, async (_req, res) => {
    try {
      const { getKnowledgeBaseStatus } = await import("../knowledge-base");
      res.json(getKnowledgeBaseStatus());
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get knowledge base status" });
    }
  });

  app.post("/api/admin/knowledge-base-reindex", requireAdmin, async (_req, res) => {
    try {
      const { indexKnowledgeBase } = await import("../knowledge-base");
      const result = await indexKnowledgeBase();
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Knowledge base reindex error:", error);
      res.status(500).json({ error: error.message || "Failed to reindex knowledge base" });
    }
  });

  app.post("/api/admin/send-notification", requireAdmin, async (req, res) => {
    try {
      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).json({ error: "Phone number and message are required" });
      }
      const result = await sendSMS(to, message);
      if (result.success) {
        res.json({ success: true, sid: result.sid });
      } else {
        res.status(500).json({ error: result.error || "Failed to send SMS" });
      }
    } catch (error: any) {
      console.error("Error sending notification:", error);
      res.status(500).json({ error: error.message || "Failed to send notification" });
    }
  });
}
