import type { Express } from "express";
import { requireAuth, requireAdmin } from "../auth";
import { logAndSendError } from "./helpers";
import { insertAlertRuleSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { NotificationStorage } from "../storage/notifications";
import { testSlackWebhook } from "../integrations/slack";
import { testSendGridConnection, sendReportShareEmail, sendScenarioSummaryEmail } from "../integrations/sendgrid";
import { processNotificationEvent } from "../notifications/engine";
import { createEvent } from "../notifications/events";

const notificationStorage = new NotificationStorage();

export function register(app: Express) {
  // --- Alert Rules CRUD ---
  app.get("/api/notifications/alert-rules", requireAdmin, async (_req, res) => {
    try {
      const rules = await notificationStorage.getAllAlertRules();
      res.json(rules);
    } catch (error) {
      logAndSendError(res, "Failed to fetch alert rules", error);
    }
  });

  app.post("/api/notifications/alert-rules", requireAdmin, async (req, res) => {
    try {
      const validation = insertAlertRuleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const rule = await notificationStorage.createAlertRule(validation.data);
      res.status(201).json(rule);
    } catch (error) {
      logAndSendError(res, "Failed to create alert rule", error);
    }
  });

  app.patch("/api/notifications/alert-rules/:id", requireAdmin, async (req, res) => {
    try {
      const rule = await notificationStorage.updateAlertRule(Number(req.params.id), req.body);
      if (!rule) return res.status(404).json({ error: "Rule not found" });
      res.json(rule);
    } catch (error) {
      logAndSendError(res, "Failed to update alert rule", error);
    }
  });

  app.delete("/api/notifications/alert-rules/:id", requireAdmin, async (req, res) => {
    try {
      await notificationStorage.deleteAlertRule(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to delete alert rule", error);
    }
  });

  // --- Notification Logs ---
  app.get("/api/notifications/logs", requireAdmin, async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 100;
      const logs = await notificationStorage.getNotificationLogs(limit);
      res.json(logs);
    } catch (error) {
      logAndSendError(res, "Failed to fetch notification logs", error);
    }
  });

  // --- Notification Settings ---
  app.get("/api/notifications/settings", requireAdmin, async (_req, res) => {
    try {
      const settings = await notificationStorage.getAllNotificationSettings();
      const result: Record<string, string | null> = {};
      for (const s of settings) {
        result[s.settingKey] = s.settingValue;
      }
      res.json(result);
    } catch (error) {
      logAndSendError(res, "Failed to fetch notification settings", error);
    }
  });

  app.put("/api/notifications/settings", requireAdmin, async (req, res) => {
    try {
      const updates = req.body as Record<string, string | null>;
      for (const [key, value] of Object.entries(updates)) {
        if (key === "slack_webhook_url" && value && !value.startsWith("https://hooks.slack.com/")) {
          return res.status(400).json({ error: "Invalid Slack webhook URL" });
        }
        await notificationStorage.setNotificationSetting(key, value);
      }
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to update notification settings", error);
    }
  });

  // --- Notification Preferences (per-user) ---
  app.get("/api/notifications/preferences", requireAuth, async (req, res) => {
    try {
      const prefs = await notificationStorage.getNotificationPreferences(req.user!.id);
      res.json(prefs);
    } catch (error) {
      logAndSendError(res, "Failed to fetch notification preferences", error);
    }
  });

  app.put("/api/notifications/preferences", requireAuth, async (req, res) => {
    try {
      const { eventType, channel, enabled } = req.body;
      if (!eventType || !channel) {
        return res.status(400).json({ error: "eventType and channel required" });
      }
      await notificationStorage.upsertNotificationPreference(req.user!.id, eventType, channel, enabled);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to update notification preference", error);
    }
  });

  // --- Test integrations ---
  app.post("/api/notifications/test-slack", requireAdmin, async (req, res) => {
    try {
      const { webhookUrl } = req.body;
      if (!webhookUrl) return res.status(400).json({ error: "webhookUrl required" });
      if (!webhookUrl.startsWith("https://hooks.slack.com/")) {
        return res.status(400).json({ error: "Invalid Slack webhook URL. Must start with https://hooks.slack.com/" });
      }
      const result = await testSlackWebhook(webhookUrl);
      res.json(result);
    } catch (error) {
      logAndSendError(res, "Failed to test Slack webhook", error);
    }
  });

  app.post("/api/notifications/test-sendgrid", requireAdmin, async (_req, res) => {
    try {
      const result = await testSendGridConnection();
      res.json(result);
    } catch (error) {
      logAndSendError(res, "Failed to test SendGrid connection", error);
    }
  });

  // --- Share via Email ---
  app.post("/api/notifications/share-report", requireAuth, async (req, res) => {
    try {
      const { to, propertyName, metrics, message, attachmentBase64, attachmentFilename } = req.body;
      if (!to || !propertyName) {
        return res.status(400).json({ error: "Recipient email and property name required" });
      }

      await sendReportShareEmail({ to, propertyName, metrics: metrics || {}, message, attachmentBase64, attachmentFilename });

      const { NotificationStorage: NS } = await import("../storage/notifications");
      const ns = new NS();
      await ns.createNotificationLog({
        eventType: "REPORT_SHARED",
        channel: "email",
        recipient: to,
        subject: `Report: ${propertyName}`,
        status: "sent",
        metadata: { propertyName },
      });

      const slackUrl = await ns.getNotificationSetting("slack_webhook_url");
      if (slackUrl) {
        const event = createEvent("REPORT_SHARED", {
          propertyName,
          message: `Report shared with ${to}`,
        });
        const { sendSlackNotification } = await import("../integrations/slack");
        await sendSlackNotification(slackUrl, event).catch(() => {});
      }

      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to share report via email", error);
    }
  });

  app.post("/api/notifications/share-scenarios", requireAuth, async (req, res) => {
    try {
      const { to, scenarios, message } = req.body;
      if (!to || !scenarios?.length) {
        return res.status(400).json({ error: "Recipient email and scenarios required" });
      }

      await sendScenarioSummaryEmail({ to, scenarios, message });
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to share scenario summary", error);
    }
  });
}
