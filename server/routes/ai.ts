import { type Express, type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../auth";
import { z } from "zod";

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

const rewriteSchema = z.object({
  text: z.string().min(1).max(5000),
  propertyName: z.string().optional(),
  location: z.string().optional(),
  roomCount: z.number().optional(),
});

export function register(app: Express) {
  app.post("/api/ai/rewrite-description", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = rewriteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }
      const { text, propertyName, location, roomCount } = parsed.data;

      const context = [
        propertyName && `Property: ${propertyName}`,
        location && `Location: ${location}`,
        roomCount && `Rooms: ${roomCount}`,
      ].filter(Boolean).join(". ");

      const prompt = `You are a professional hospitality real estate copywriter. Rewrite the following property description to be polished, compelling, and professional. Keep the same factual content but improve clarity, flow, and appeal. Write in third person. Keep it concise (2-3 paragraphs max). Do not add fictional details — only enhance what is provided.

${context ? `Context: ${context}\n\n` : ""}Original description:
${text}

Rewritten description:`;

      const gemini = getGeminiClient();
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 1024 },
      });

      const rewritten = response.text?.trim();
      if (!rewritten) {
        return res.status(500).json({ error: "No response from AI" });
      }
      res.json({ rewritten });
    } catch (error: any) {
      console.error("[ai/rewrite] Error:", error?.message || error);
      if (error?.message === "Gemini API key not configured") {
        return res.status(503).json({ error: "AI service is not available" });
      }
      res.status(500).json({ error: "Failed to rewrite description" });
    }
  });
}
