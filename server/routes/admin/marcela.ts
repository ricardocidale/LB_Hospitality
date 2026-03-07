import { type Express } from "express";
import { storage } from "../../storage";
import { requireAdmin, requireAuth } from "../../auth";
import { type InsertGlobalAssumptions } from "@shared/schema";
import { logAndSendError } from "../helpers";
import { getTwilioStatus, sendSMS } from "../../integrations/twilio";
import { getSignedUrl as getElevenLabsSignedUrl, getConvaiAgent, listConvaiConversations, getConvaiConversation, deleteConvaiConversation, updateConvaiAgent, createKBDocumentFromFile } from "../../integrations/elevenlabs";
import { configureMarcelaAgent, buildClientTools, buildServerTools, getBaseUrl } from "../../marcela-agent-config";
import { uploadKnowledgeBase, getKnowledgeDocumentPreview } from "../../marcela-knowledge-base";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export function registerMarcelaRoutes(app: Express) {
  app.get("/api/admin/voice-settings", requireAdmin, async (_req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });
      res.json({
        aiAgentName: ga.aiAgentName,
        marcelaAgentId: ga.marcelaAgentId,
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
        marcelaLanguage: ga.marcelaLanguage,
        marcelaTurnTimeout: ga.marcelaTurnTimeout,
        marcelaAvatarUrl: ga.marcelaAvatarUrl,
        marcelaWidgetVariant: ga.marcelaWidgetVariant,
      });
    } catch (error) {
      logAndSendError(res, "Failed to fetch voice settings", error);
    }
  });

  app.post("/api/admin/voice-settings", requireAdmin, async (req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });
      const allowedFields = [
        "aiAgentName", "marcelaAgentId", "marcelaVoiceId", "marcelaTtsModel", "marcelaSttModel", "marcelaOutputFormat",
        "marcelaStability", "marcelaSimilarityBoost", "marcelaSpeakerBoost",
        "marcelaChunkSchedule", "marcelaLlmModel", "marcelaMaxTokens",
        "marcelaMaxTokensVoice", "marcelaEnabled", "showAiAssistant",
        "marcelaTwilioEnabled", "marcelaSmsEnabled", "marcelaPhoneGreeting", "marcelaLanguage",
        "marcelaTurnTimeout", "marcelaAvatarUrl", "marcelaWidgetVariant",
      ] as const;
      const patch: Partial<Record<string, unknown>> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          patch[field] = req.body[field];
        }
      }
      const updated = await storage.upsertGlobalAssumptions(patch as InsertGlobalAssumptions);
      res.json(updated);
    } catch (error) {
      logAndSendError(res, "Failed to update voice settings", error);
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
      const { getKnowledgeBaseStatus } = await import("../../knowledge-base");
      res.json(getKnowledgeBaseStatus());
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to get knowledge base status", error);
    }
  });

  app.post("/api/admin/knowledge-base-reindex", requireAdmin, async (_req, res) => {
    try {
      const { indexKnowledgeBase } = await import("../../knowledge-base");
      const result = await indexKnowledgeBase();
      res.json({ success: true, ...result });
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to reindex knowledge base", error);
    }
  });

  app.get("/api/marcela/signed-url", requireAuth, async (_req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaAgentId) {
        return res.status(404).json({ error: "Marcela agent not configured" });
      }
      const signedUrl = await getElevenLabsSignedUrl(ga.marcelaAgentId);
      res.json({ signedUrl });
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to get signed URL", error);
    }
  });

  app.get("/api/admin/convai/agent", requireAdmin, async (_req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaAgentId) {
        return res.status(404).json({ error: "Marcela agent not configured" });
      }
      const agent = await getConvaiAgent(ga.marcelaAgentId);
      res.json(agent);
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to fetch agent config", error);
    }
  });

  app.get("/api/admin/convai/conversations", requireAdmin, async (_req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaAgentId) {
        return res.status(404).json({ error: "Marcela agent not configured" });
      }
      const conversations = await listConvaiConversations(ga.marcelaAgentId);
      res.json({ conversations });
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to list conversations", error);
    }
  });

  app.get("/api/admin/convai/conversations/:id", requireAdmin, async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const conversation = await getConvaiConversation(id);
      res.json(conversation);
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to fetch conversation", error);
    }
  });

  app.post("/api/admin/convai/configure-tools", requireAdmin, async (_req, res) => {
    try {
      const result = await configureMarcelaAgent();
      if (result.success) {
        res.json({ success: true, message: "Agent tools configured successfully" });
      } else {
        res.status(500).json({ error: result.error || "Failed to configure agent tools" });
      }
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to configure agent tools", error);
    }
  });

  app.get("/api/admin/convai/knowledge-base/preview", requireAdmin, async (_req, res) => {
    try {
      const preview = getKnowledgeDocumentPreview();
      res.json(preview);
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to generate preview", error);
    }
  });

  app.post("/api/admin/convai/knowledge-base/upload", requireAdmin, async (_req, res) => {
    try {
      const result = await uploadKnowledgeBase();
      if (result.success) {
        res.json({ success: true, documentId: result.documentId, message: "Knowledge base uploaded and attached to agent" });
      } else {
        res.status(500).json({ error: result.error || "Failed to upload knowledge base" });
      }
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to upload knowledge base", error);
    }
  });

  app.patch("/api/admin/convai/agent/prompt", requireAdmin, async (req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaAgentId) {
        return res.status(404).json({ error: "Marcela agent not configured" });
      }
      const { prompt, first_message, language } = req.body;
      const updated = await updateConvaiAgent(ga.marcelaAgentId, {
        conversation_config: {
          agent: {
            prompt: { prompt },
            first_message,
            language,
          },
        },
      });
      // Persist language locally so the widget can read it without an admin API call
      if (language) {
        await storage.upsertGlobalAssumptions({ ...ga, marcelaLanguage: language } as any);
      }
      res.json(updated);
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to update agent prompt", error);
    }
  });

  app.patch("/api/admin/convai/agent/widget-settings", requireAdmin, async (req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaAgentId) return res.status(404).json({ error: "Marcela agent not configured" });

      const { turn_timeout, avatar_url, widget_variant } = req.body;
      const patch: Record<string, unknown> = {};
      if (turn_timeout !== undefined) patch.conversation_config = { turn: { turn_timeout: Number(turn_timeout) } };
      const widgetPatch: Record<string, unknown> = {};
      if (avatar_url !== undefined) widgetPatch.avatar = avatar_url ? { type: "url", url: avatar_url } : null;
      if (widget_variant !== undefined) widgetPatch.variant = widget_variant;
      if (Object.keys(widgetPatch).length) patch.widget = widgetPatch;

      const updated = await updateConvaiAgent(ga.marcelaAgentId, patch);

      // Persist locally
      const dbPatch: Partial<Record<string, unknown>> = {};
      if (turn_timeout !== undefined) dbPatch.marcelaTurnTimeout = Number(turn_timeout);
      if (avatar_url !== undefined) dbPatch.marcelaAvatarUrl = avatar_url;
      if (widget_variant !== undefined) dbPatch.marcelaWidgetVariant = widget_variant;
      if (Object.keys(dbPatch).length) await storage.upsertGlobalAssumptions(dbPatch as any);

      res.json(updated);
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to update widget settings", error);
    }
  });

  app.get("/api/admin/convai/tools-status", requireAdmin, async (_req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaAgentId) {
        return res.status(404).json({ error: "Marcela agent not configured" });
      }
      const agent = await getConvaiAgent(ga.marcelaAgentId);
      const registeredTools = (agent.conversation_config?.agent?.prompt as any)?.tools || [];
      
      const baseUrl = getBaseUrl();
      const clientTools = buildClientTools();
      const serverTools = buildServerTools(baseUrl);
      const allExpectedTools = [...clientTools, ...serverTools];

      const status = allExpectedTools.map(expected => {
        const registered = registeredTools.find((t: any) => t.name === expected.name);
        return {
          name: expected.name,
          type: expected.type,
          description: expected.description,
          registered: !!registered,
        };
      });

      res.json(status);
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to fetch tools status", error);
    }
  });

  app.post("/api/admin/convai/knowledge-base/upload-file", requireAdmin, upload.single("file"), async (req: any, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaAgentId) {
        return res.status(404).json({ error: "Marcela agent not configured" });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const doc = await createKBDocumentFromFile(req.file.originalname, req.file.buffer, req.file.originalname);
      
      // Attach to agent
      const agent = await getConvaiAgent(ga.marcelaAgentId);
      const existingKB = (agent.conversation_config?.agent?.prompt as any)?.knowledge_base || [];
      
      await updateConvaiAgent(ga.marcelaAgentId, {
        conversation_config: {
          agent: {
            prompt: {
              knowledge_base: [
                ...existingKB,
                { type: "file", id: doc.id, name: doc.name },
              ],
            },
          },
        },
      });

      res.json({ success: true, documentId: doc.id, name: doc.name });
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to upload KB file", error);
    }
  });

  app.delete("/api/admin/convai/conversations/:id", requireAdmin, async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await deleteConvaiConversation(id);
      res.json({ success: true });
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to delete conversation", error);
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
      logAndSendError(res, error.message || "Failed to send notification", error);
    }
  });
}
