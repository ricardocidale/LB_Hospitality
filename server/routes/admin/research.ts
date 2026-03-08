import { type Express } from "express";
import { z } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { storage } from "../../storage";
import { requireAdmin } from "../../auth";
import { type InsertGlobalAssumptions, type ResearchConfig, type AiModelEntry } from "@shared/schema";
import { logAndSendError } from "../helpers";

const researchEventConfigSchema = z.object({
  enabled: z.boolean().optional(),
  focusAreas: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  timeHorizon: z.string().optional(),
  customInstructions: z.string().optional(),
  customQuestions: z.string().optional(),
  enabledTools: z.array(z.string()).optional(),
  refreshIntervalDays: z.number().min(3).max(14).optional(),
}).strict();

const customSourceSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  category: z.string(),
});

const aiModelEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  provider: z.enum(["openai", "anthropic", "google"]),
});

const researchConfigSchema = z.object({
  property: researchEventConfigSchema.optional(),
  company: researchEventConfigSchema.optional(),
  global: researchEventConfigSchema.optional(),
  preferredLlm: z.string().optional(),
  customSources: z.array(customSourceSchema).optional(),
  cachedModels: z.array(aiModelEntrySchema).optional(),
  cachedModelsAt: z.string().optional(),
}).strict();

const CHAT_MODEL_PATTERNS: Record<string, RegExp[]> = {
  openai: [/^gpt-5/, /^gpt-4o/, /^o\d/],
  anthropic: [/^claude-/],
  google: [/^gemini-/],
};

const EXCLUDE_PATTERNS = [
  /embed/i, /tts/i, /whisper/i, /dall-e/i, /image/i, /moderation/i,
  /realtime/i, /audio/i, /computer-use/i, /search/i, /chatgpt/i,
  /instruct/i, /codex/i, /-\d{8}$/, /preview/,
];

function shouldInclude(id: string, provider: string): boolean {
  const patterns = CHAT_MODEL_PATTERNS[provider] ?? [];
  if (!patterns.some(p => p.test(id))) return false;
  if (EXCLUDE_PATTERNS.some(p => p.test(id))) return false;
  return true;
}

function formatLabel(id: string, provider: string): string {
  const prefix = provider === "openai" ? "OpenAI" : provider === "anthropic" ? "Anthropic" : "Google";
  const name = id
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Gpt/g, "GPT")
    .replace(/^O(\d)/, "o$1");
  return `${prefix} ${name}`;
}

async function fetchOpenAIModels(): Promise<AiModelEntry[]> {
  try {
    const client = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    const list = await client.models.list();
    const models: AiModelEntry[] = [];
    for await (const m of list) {
      if (shouldInclude(m.id, "openai")) {
        models.push({ id: m.id, label: formatLabel(m.id, "openai"), provider: "openai" });
      }
    }
    return models.sort((a, b) => a.id.localeCompare(b.id));
  } catch (e) {
    console.error("[research] Failed to fetch OpenAI models:", (e as Error).message);
    return [];
  }
}

async function fetchAnthropicModels(): Promise<AiModelEntry[]> {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const resp = await client.models.list({ limit: 100 });
    const models: AiModelEntry[] = [];
    for (const m of resp.data) {
      if (shouldInclude(m.id, "anthropic")) {
        models.push({ id: m.id, label: formatLabel(m.id, "anthropic"), provider: "anthropic" });
      }
    }
    return models.sort((a, b) => a.id.localeCompare(b.id));
  } catch (e) {
    console.error("[research] Failed to fetch Anthropic models:", (e as Error).message);
    return [];
  }
}

async function fetchGeminiModels(): Promise<AiModelEntry[]> {
  try {
    const client = new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
      httpOptions: {
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      },
    });
    const resp = await client.models.list();
    const models: AiModelEntry[] = [];
    for (const m of resp.page) {
      const id = (m.name ?? "").replace("models/", "");
      if (shouldInclude(id, "google")) {
        models.push({ id, label: formatLabel(id, "google"), provider: "google" });
      }
    }
    return models.sort((a, b) => a.id.localeCompare(b.id));
  } catch (e) {
    console.error("[research] Failed to fetch Gemini models:", (e as Error).message);
    return [];
  }
}

export function registerResearchConfigRoutes(app: Express) {
  app.get("/api/admin/research-config", requireAdmin, async (_req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });
      res.json((ga.researchConfig as ResearchConfig) ?? {});
    } catch (error) {
      logAndSendError(res, "Failed to fetch research config", error);
    }
  });

  app.post("/api/admin/ai-models/refresh", requireAdmin, async (_req, res) => {
    try {
      const [openai, anthropic, google] = await Promise.all([
        fetchOpenAIModels(),
        fetchAnthropicModels(),
        fetchGeminiModels(),
      ]);
      const models = [...anthropic, ...openai, ...google];

      const ga = await storage.getGlobalAssumptions();
      if (ga) {
        const current: ResearchConfig = (ga.researchConfig as ResearchConfig) ?? {};
        const merged: ResearchConfig = {
          ...current,
          cachedModels: models,
          cachedModelsAt: new Date().toISOString(),
        };
        await storage.upsertGlobalAssumptions({ researchConfig: merged } as InsertGlobalAssumptions);
      }

      res.json({ models, fetchedAt: new Date().toISOString() });
    } catch (error) {
      logAndSendError(res, "Failed to refresh AI models", error);
    }
  });

  app.put("/api/admin/research-config", requireAdmin, async (req, res) => {
    try {
      const parsed = researchConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid research config", details: parsed.error.flatten() });
      }

      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });

      const incoming = parsed.data;
      const current: ResearchConfig = (ga.researchConfig as ResearchConfig) ?? {};

      const merged: ResearchConfig = {
        property: incoming.property !== undefined ? { ...current.property, ...incoming.property } : current.property,
        company:  incoming.company  !== undefined ? { ...current.company,  ...incoming.company  } : current.company,
        global:   incoming.global   !== undefined ? { ...current.global,   ...incoming.global   } : current.global,
        preferredLlm: incoming.preferredLlm ?? current.preferredLlm,
        customSources: incoming.customSources ?? current.customSources,
        cachedModels: incoming.cachedModels ?? current.cachedModels,
        cachedModelsAt: incoming.cachedModelsAt ?? current.cachedModelsAt,
      };

      await storage.upsertGlobalAssumptions({ researchConfig: merged } as InsertGlobalAssumptions);
      res.json(merged);
    } catch (error) {
      logAndSendError(res, "Failed to update research config", error);
    }
  });
}
