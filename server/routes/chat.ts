import { type Express, type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import { buildPropertyContext } from "../ai/buildPropertyContext.js";

/**
 * CONTRACT: This endpoint provides AI chat about portfolio properties.
 * All financial metrics are computed via deterministic tools (calc/dispatch.ts),
 * never inline arithmetic. The LLM interprets pre-computed values only.
 */

function getGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
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
      const { message, history } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const properties = await storage.getAllProperties();
      const global = await storage.getGlobalAssumptions();
      const propertyContext = buildPropertyContext(properties);

      const contextBlock = [
        "PORTFOLIO DATA:",
        propertyContext,
        "",
        `Company: ${(global as any)?.companyName || "Management Company"}`,
        `Properties in Portfolio: ${properties.length}`,
        `Projection Years: ${(global as any)?.projectionYears || 10}`,
        `Inflation Rate: ${((global as any)?.inflationRate || 0.03) * 100}%`,
      ].join("\n");

      const chatHistory = (history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : ("assistant" as const),
        content: msg.content,
      }));

      const systemPrompt = (global as any)?.rebeccaSystemPrompt || DEFAULT_SYSTEM_PROMPT;
      const fullSystemPrompt = `${systemPrompt}\n\n${contextBlock}`;

      const gemini = getGeminiClient();
      const contents = [
        { role: "user" as const, parts: [{ text: fullSystemPrompt }] },
        { role: "model" as const, parts: [{ text: "Understood. I have the portfolio data and will answer questions based on it." }] },
        ...chatHistory.map((msg: { role: string; content: string }) => ({
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
      res.status(500).json({ error: "Failed to generate response" });
    }
  });
}
