import { type Express } from "express";
import { storage } from "../../storage";
import { requireAdmin, requireAuth } from "../../auth";
import { type InsertGlobalAssumptions } from "@shared/schema";
import { logAndSendError } from "../helpers";
import { getTwilioStatus, sendSMS } from "../../integrations/twilio";
import { getSignedUrl as getElevenLabsSignedUrl, getConvaiAgent, listConvaiConversations, getConvaiConversation, deleteConvaiConversation, updateConvaiAgent, createKBDocumentFromFile, getConversationAudio } from "../../integrations/elevenlabs";
import { configureMarcelaAgent, buildClientTools, buildServerTools, getBaseUrl } from "../../ai/marcela-agent-config";
import { uploadKnowledgeBase, getKnowledgeDocumentPreview, getKBSources } from "../../ai/marcela-knowledge-base";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export function registerMarcelaRoutes(app: Express) {
  app.get("/api/admin/knowledge-base/sources", requireAdmin, async (_req, res) => {
    try {
      const sources = await getKBSources();
      res.json({ sources });
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to fetch KB sources", error);
    }
  });

  app.post("/api/admin/convai/knowledge-base/rebuild", requireAdmin, async (req, res) => {
    try {
      const { sources } = req.body;
      const result = await uploadKnowledgeBase(sources);
      if (result.success) {
        res.json({ success: true, documentId: result.documentId, message: "Knowledge base rebuilt and uploaded successfully" });
      } else {
        res.status(500).json({ error: result.error || "Failed to rebuild knowledge base" });
      }
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to rebuild knowledge base", error);
    }
  });
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
        marcelaSpeed: ga.marcelaSpeed,
        marcelaStreamingLatency: ga.marcelaStreamingLatency,
        marcelaTextNormalisation: ga.marcelaTextNormalisation,
        marcelaAsrProvider: ga.marcelaAsrProvider,
        marcelaInputAudioFormat: ga.marcelaInputAudioFormat,
        marcelaBackgroundVoiceDetection: ga.marcelaBackgroundVoiceDetection,
        marcelaTurnEagerness: ga.marcelaTurnEagerness,
        marcelaSpellingPatience: ga.marcelaSpellingPatience,
        marcelaSpeculativeTurn: ga.marcelaSpeculativeTurn,
        marcelaSilenceEndCallTimeout: ga.marcelaSilenceEndCallTimeout,
        marcelaMaxDuration: ga.marcelaMaxDuration,
        marcelaCascadeTimeout: ga.marcelaCascadeTimeout,
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
        "marcelaSpeed", "marcelaStreamingLatency", "marcelaTextNormalisation",
        "marcelaAsrProvider", "marcelaInputAudioFormat", "marcelaBackgroundVoiceDetection",
        "marcelaTurnEagerness", "marcelaSpellingPatience", "marcelaSpeculativeTurn",
        "marcelaSilenceEndCallTimeout", "marcelaMaxDuration", "marcelaCascadeTimeout",
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
      const { getKnowledgeBaseStatus } = await import("../../ai/knowledge-base");
      res.json(getKnowledgeBaseStatus());
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to get knowledge base status", error);
    }
  });

  app.post("/api/admin/knowledge-base-reindex", requireAdmin, async (_req, res) => {
    try {
      const { indexKnowledgeBase } = await import("../../ai/knowledge-base");
      const result = await indexKnowledgeBase();
      res.json({ success: true, ...result });
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to reindex knowledge base", error);
    }
  });

  app.post("/api/marcela/scribe-token", requireAuth, async (_req, res) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) return res.status(503).json({ error: "Service not configured" });
      const response = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
        method: "POST",
        headers: { "xi-api-key": apiKey },
      });
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: text || "Failed to get scribe token" });
      }
      const data = await response.json();
      if (!data.token) return res.status(500).json({ error: "Invalid token response" });
      res.json({ token: data.token });
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to get scribe token", error);
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
      const preview = await getKnowledgeDocumentPreview();
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

  app.patch("/api/admin/convai/agent/llm", requireAdmin, async (req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaAgentId) return res.status(404).json({ error: "Marcela agent not configured" });
      const { llm, max_tokens } = req.body;
      const promptPatch: Record<string, unknown> = {};
      if (llm !== undefined) promptPatch.llm = llm;
      if (max_tokens !== undefined) promptPatch.max_tokens = max_tokens;
      const updated = await updateConvaiAgent(ga.marcelaAgentId, {
        conversation_config: { agent: { prompt: promptPatch } },
      });
      const dbPatch: Partial<Record<string, unknown>> = {};
      if (llm !== undefined) dbPatch.marcelaLlmModel = llm;
      if (max_tokens !== undefined) dbPatch.marcelaMaxTokens = max_tokens;
      if (Object.keys(dbPatch).length) await storage.upsertGlobalAssumptions(dbPatch as any);
      res.json(updated);
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to update LLM settings", error);
    }
  });

  app.patch("/api/admin/convai/agent/voice", requireAdmin, async (req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaAgentId) return res.status(404).json({ error: "Marcela agent not configured" });
      const {
        voice_id, stability, similarity_boost, use_speaker_boost, speed,
        agent_output_audio_format, optimize_streaming_latency, text_normalisation_type,
        asr_provider, user_input_audio_format, background_voice_detection,
        turn_eagerness, spelling_patience, speculative_turn,
        turn_timeout, silence_end_call_timeout,
        max_duration_seconds, cascade_timeout_seconds,
      } = req.body;

      const ttsPatch: Record<string, unknown> = {};
      if (voice_id !== undefined) ttsPatch.voice_id = voice_id;
      if (stability !== undefined) ttsPatch.stability = stability;
      if (similarity_boost !== undefined) ttsPatch.similarity_boost = similarity_boost;
      if (speed !== undefined) ttsPatch.speed = speed;
      if (agent_output_audio_format !== undefined) ttsPatch.agent_output_audio_format = agent_output_audio_format;
      if (optimize_streaming_latency !== undefined) ttsPatch.optimize_streaming_latency = optimize_streaming_latency;
      if (text_normalisation_type !== undefined) ttsPatch.text_normalisation_type = text_normalisation_type;

      const asrPatch: Record<string, unknown> = {};
      if (asr_provider !== undefined) asrPatch.provider = asr_provider;
      if (user_input_audio_format !== undefined) asrPatch.user_input_audio_format = user_input_audio_format;

      const vadPatch: Record<string, unknown> = {};
      if (background_voice_detection !== undefined) vadPatch.background_voice_detection = background_voice_detection;

      const turnPatch: Record<string, unknown> = {};
      if (turn_eagerness !== undefined) turnPatch.turn_eagerness = turn_eagerness;
      if (spelling_patience !== undefined) turnPatch.spelling_patience = spelling_patience;
      if (speculative_turn !== undefined) turnPatch.speculative_turn = speculative_turn;
      if (turn_timeout !== undefined) turnPatch.turn_timeout = turn_timeout;
      if (silence_end_call_timeout !== undefined) turnPatch.silence_end_call_timeout = silence_end_call_timeout;

      const convPatch: Record<string, unknown> = {};
      if (max_duration_seconds !== undefined) convPatch.max_duration_seconds = max_duration_seconds;

      const promptPatch: Record<string, unknown> = {};
      if (cascade_timeout_seconds !== undefined) promptPatch.cascade_timeout_seconds = cascade_timeout_seconds;

      const convaiPatch: Record<string, unknown> = {};
      if (Object.keys(ttsPatch).length) convaiPatch.tts = ttsPatch;
      if (Object.keys(asrPatch).length) convaiPatch.asr = asrPatch;
      if (Object.keys(vadPatch).length) convaiPatch.vad = vadPatch;
      if (Object.keys(turnPatch).length) convaiPatch.turn = turnPatch;
      if (Object.keys(convPatch).length) convaiPatch.conversation = convPatch;
      if (Object.keys(promptPatch).length) convaiPatch.agent = { prompt: promptPatch };

      const updated = Object.keys(convaiPatch).length
        ? await updateConvaiAgent(ga.marcelaAgentId, { conversation_config: convaiPatch })
        : {};

      const dbPatch: Partial<Record<string, unknown>> = {};
      if (voice_id !== undefined) dbPatch.marcelaVoiceId = voice_id;
      if (stability !== undefined) dbPatch.marcelaStability = stability;
      if (similarity_boost !== undefined) dbPatch.marcelaSimilarityBoost = similarity_boost;
      if (use_speaker_boost !== undefined) dbPatch.marcelaSpeakerBoost = use_speaker_boost;
      if (speed !== undefined) dbPatch.marcelaSpeed = speed;
      if (agent_output_audio_format !== undefined) dbPatch.marcelaOutputFormat = agent_output_audio_format;
      if (optimize_streaming_latency !== undefined) dbPatch.marcelaStreamingLatency = optimize_streaming_latency;
      if (text_normalisation_type !== undefined) dbPatch.marcelaTextNormalisation = text_normalisation_type;
      if (asr_provider !== undefined) dbPatch.marcelaAsrProvider = asr_provider;
      if (user_input_audio_format !== undefined) dbPatch.marcelaInputAudioFormat = user_input_audio_format;
      if (background_voice_detection !== undefined) dbPatch.marcelaBackgroundVoiceDetection = background_voice_detection;
      if (turn_eagerness !== undefined) dbPatch.marcelaTurnEagerness = turn_eagerness;
      if (spelling_patience !== undefined) dbPatch.marcelaSpellingPatience = spelling_patience;
      if (speculative_turn !== undefined) dbPatch.marcelaSpeculativeTurn = speculative_turn;
      if (turn_timeout !== undefined) dbPatch.marcelaTurnTimeout = turn_timeout;
      if (silence_end_call_timeout !== undefined) dbPatch.marcelaSilenceEndCallTimeout = silence_end_call_timeout;
      if (max_duration_seconds !== undefined) dbPatch.marcelaMaxDuration = max_duration_seconds;
      if (cascade_timeout_seconds !== undefined) dbPatch.marcelaCascadeTimeout = cascade_timeout_seconds;
      if (Object.keys(dbPatch).length) await storage.upsertGlobalAssumptions(dbPatch as any);
      res.json(updated);
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to update voice settings", error);
    }
  });

  app.get("/api/admin/convai/conversations/:id/audio", requireAdmin, async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { buffer, contentType } = await getConversationAudio(id);
      res.set("Content-Type", contentType);
      res.set("Content-Length", buffer.length.toString());
      res.send(buffer);
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to fetch conversation audio", error);
    }
  });

  app.delete("/api/admin/convai/agent/knowledge-base/:docId", requireAdmin, async (req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaAgentId) return res.status(404).json({ error: "Marcela agent not configured" });
      const docId = Array.isArray(req.params.docId) ? req.params.docId[0] : req.params.docId;
      const agent = await getConvaiAgent(ga.marcelaAgentId);
      const kb: any[] = (agent.conversation_config?.agent as any)?.knowledge_base
        ?? (agent.conversation_config?.agent?.prompt as any)?.knowledge_base ?? [];
      const updatedKb = kb.filter((doc: any) => doc.id !== docId);
      const useTopLevel = !!((agent.conversation_config?.agent as any)?.knowledge_base);
      await updateConvaiAgent(ga.marcelaAgentId, useTopLevel
        ? { conversation_config: { agent: { knowledge_base: updatedKb } } }
        : { conversation_config: { agent: { prompt: { knowledge_base: updatedKb } } } }
      );
      res.json({ success: true });
    } catch (error: any) {
      logAndSendError(res, error.message || "Failed to remove KB document", error);
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
