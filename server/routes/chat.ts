import { type Express, type Request, type Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import { buildPropertyContext } from "../ai/buildPropertyContext.js";

/**
 * CONTRACT: This endpoint provides AI chat about portfolio properties.
 * All financial metrics are computed via deterministic tools (calc/dispatch.ts),
 * never inline arithmetic. The LLM interprets pre-computed values only.
 */

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: `${systemPrompt}\n\n${contextBlock}`,
        messages: [
          ...chatHistory,
          { role: "user", content: message },
        ],
      });

      const text = response.content[0]?.type === "text"
        ? response.content[0].text
        : "I'm sorry, I couldn't generate a response. Please try again.";
      res.json({ response: text });
    } catch (error: any) {
      console.error("[chat] Error:", error?.message || error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });
}
