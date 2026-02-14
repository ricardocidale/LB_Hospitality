import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { requireAuth } from "../../auth";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are a knowledgeable hospitality business assistant for Hospitality Business Group, a hotel investment and management company. You help team members with:

- Hotel acquisition analysis and due diligence
- Revenue management (ADR, occupancy, RevPAR)
- Financial projections and pro forma analysis
- Market research and competitive analysis
- Operating expense benchmarking
- Cap rate analysis and property valuations
- Food & beverage and events revenue strategies
- Management fee structures and investor returns
- Scenario planning and sensitivity analysis

Be concise, professional, and data-driven. When discussing financial metrics, use industry-standard terminology. If you don't have enough context to give a specific answer, ask clarifying questions. Format responses with markdown when helpful.`;

export function registerChatRoutes(app: Express): void {
  app.get("/api/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id as string);
      const { content } = req.body;

      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }

      await chatStorage.createMessage(conversationId, "user", content.trim());

      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }

      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to get AI response" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}
