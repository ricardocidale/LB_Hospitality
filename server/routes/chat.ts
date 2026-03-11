import { type Express, type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import { buildPropertyContext } from "../ai/buildPropertyContext.js";
import { z } from "zod";

/**
 * CONTRACT: This endpoint provides AI chat about portfolio properties.
 * All financial metrics are computed via deterministic tools (calc/dispatch.ts),
 * never inline arithmetic. The LLM interprets pre-computed values only.
 */

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 20;

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(MAX_MESSAGE_LENGTH),
});

const chatRequestSchema = z.object({
  message: z.string().min(1).max(MAX_MESSAGE_LENGTH),
  history: z.array(chatMessageSchema).max(MAX_HISTORY_LENGTH).optional().default([]),
});

function getGeminiClient() {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion: "",
      baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
    },
  });
}

const DEFAULT_SYSTEM_PROMPT = `You are Rebecca, a property investment analyst for a boutique hotel management company. You answer questions about the portfolio's properties, financial metrics, and hospitality industry concepts.

You have access to the current portfolio data below. Use it to answer questions accurately. When discussing financials, be precise and cite specific numbers from the data. If asked about something not in the data, say so clearly.

Keep responses concise and professional. Use bullet points for lists. Format dollar amounts with commas. When comparing properties, use clear tables or structured comparisons.

Do not make up data. Only reference what is provided in the context below.`;

export function register(app: Express) {
  app.post("/api/chat", requireAuth, async (req: Request, res: Response) => {
    try {
      // Validate input with Zod
      const parsed = chatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request: " + parsed.error.issues[0]?.message });
      }
      const { message, history } = parsed.data;

      // Check feature gate
      const global = await storage.getGlobalAssumptions();
      if (!(global as any)?.rebeccaEnabled) {
        return res.status(403).json({ error: "Chat assistant is not enabled" });
      }

      const properties = await storage.getAllProperties();
      const propertyContext = buildPropertyContext(properties);

      const contextBlock = [
        "PORTFOLIO DATA:",
        propertyContext,
        "",
        `Company: ${(global as any)?.companyName ?? "Management Company"}`,
        `Properties in Portfolio: ${properties.length}`,
        `Projection Years: ${(global as any)?.projectionYears ?? 10}`,
        `Inflation Rate: ${((global as any)?.inflationRate ?? 0.03) * 100}%`,
      ].join("\n");

      const chatHistory = history.map((msg) => ({
        role: msg.role === "user" ? "user" : ("model" as const),
        content: msg.content,
      }));

      const systemPrompt = (global as any)?.rebeccaSystemPrompt ?? DEFAULT_SYSTEM_PROMPT;
      const fullSystemPrompt = `${systemPrompt}\n\n${contextBlock}`;

      const gemini = getGeminiClient();
      const contents = [
        { role: "user" as const, parts: [{ text: fullSystemPrompt }] },
        { role: "model" as const, parts: [{ text: "Understood. I have the portfolio data and will answer questions based on it." }] },
        ...chatHistory.map((msg) => ({
          role: (msg.role === "user" ? "user" : "model") as "user" | "model",
          parts: [{ text: msg.content }],
        })),
        { role: "user" as const, parts: [{ text: message }] },
      ];

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { maxOutputTokens: 1024 },
      });

      const text = response.text
        || "I'm sorry, I couldn't generate a response. Please try again.";
      res.json({ response: text });
    } catch (error: any) {
      console.error("[chat] Error:", error?.message || error);
      if (error?.message === "Gemini API key not configured") {
        return res.status(503).json({ error: "Chat service is not available" });
      }
      res.status(500).json({ error: "Failed to generate response" });
    }
  });
}
