import { type Express, type Request, type Response } from "express";
import { getAnthropicClient, getGeminiClient } from "../ai/clients";
import { requireAuth } from "../auth";
import { z } from "zod";

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

  const optimizeSchema = z.object({
    prompt: z.string().min(1).max(50000),
  });

  app.post("/api/ai/optimize-prompt", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = optimizeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }
      const { prompt } = parsed.data;

      const anthropic = getAnthropicClient();

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: `You are a prompt engineering expert specializing in hospitality investment research. Your task is to optimize the following Ideal Customer Profile (ICP) prompt so it produces the best possible results when used to instruct an LLM performing market research on boutique luxury hotel investment opportunities.

Rules:
- Keep ALL factual data, ranges, numbers, and specifications exactly as provided
- Restructure for clarity and LLM comprehension
- Use markdown formatting (headers, bullet lists, bold for key terms)
- Add clear section delineators
- Optimize the language for precision — remove ambiguity, strengthen classification tags
- Ensure the prompt reads as a structured brief that an AI research agent can follow step-by-step
- Do NOT add fictional data or change any numeric ranges
- Do NOT remove any sections — every piece of information must be preserved
- Output ONLY the optimized prompt, no commentary

Original prompt to optimize:

${prompt}`,
          },
        ],
      });

      const optimized = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
      if (!optimized) {
        return res.status(500).json({ error: "No response from AI" });
      }
      res.json({ optimized });
    } catch (error: any) {
      console.error("[ai/optimize-prompt] Error:", error?.message || error);
      res.status(500).json({ error: "Failed to optimize prompt" });
    }
  });
}
