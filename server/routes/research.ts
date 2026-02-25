import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin, isApiRateLimited } from "../auth";
import { researchGenerateSchema, logActivity } from "./helpers";
import { fromZodError } from "zod-validation-error";
import { generateResearchWithToolsStream, buildUserPrompt } from "../aiResearch";
import { sendResearchEmail } from "../integrations/gmail";
import Anthropic from "@anthropic-ai/sdk";

export function register(app: Express) {
  // ────────────────────────────────────────────────────────────
  // MARKET RESEARCH
  // AI-powered research generation using Claude/GPT/Gemini. Streams responses
  // via Server-Sent Events (SSE) and persists results to the database.
  // POST /api/email-research-pdf — emails a PDF report via Gmail integration.
  // ────────────────────────────────────────────────────────────

  app.get("/api/market-research", requireAuth, async (req, res) => {
    try {
      const { type, propertyId } = req.query;
      const research = await storage.getMarketResearch(
        type as string,
        req.user!.id,
        propertyId ? Number(propertyId) : undefined
      );
      res.json(research || null);
    } catch (error) {
      console.error("Error fetching research:", error);
      res.status(500).json({ error: "Failed to fetch research" });
    }
  });

  app.post("/api/market-research/generate", requireAuth, async (req, res) => {
    try {
      const validation = researchGenerateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const { type, propertyId, propertyContext, assetDefinition, researchVariables } = validation.data;

      // Rate limit: 5 research generations per minute
      if (isApiRateLimited(req.user!.id, "market-research", 5)) {
        return res.status(429).json({ error: "Rate limit exceeded. Please wait a minute." });
      }

      const ga = await storage.getGlobalAssumptions(req.user!.id);
      const model = ga?.preferredLlm || "claude-3-5-sonnet-20241022";

      // Initialize AI clients
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      // SSE Header setup
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const params = {
        type,
        propertyContext: propertyContext as any,
        assetDefinition: assetDefinition as any,
        researchVariables,
        propertyLabel: ga?.propertyLabel,
      };

      const stream = generateResearchWithToolsStream(
        params,
        anthropic,
        model
      );

      let fullContent = "";
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        if (chunk.type === "content") {
          fullContent += chunk.data;
        }
        if (chunk.type === "done") {
          // Persist the final result
          await storage.upsertMarketResearch({
            userId: req.user!.id,
            propertyId,
            type,
            title: `${type === 'property' ? 'Property' : type === 'company' ? 'Company' : 'Global'} Research`,
            content: { rawResponse: fullContent },
          });
          logActivity(req, "generate", "market_research", propertyId, type);
        }
      }

      res.end();
    } catch (error) {
      console.error("Research generation error:", error);
      res.write(`data: ${JSON.stringify({ type: "error", message: "Generation failed" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/email-research-pdf", requireAuth, async (req, res) => {
    try {
      const { email, propertyId, content } = req.body;
      if (!email || !content) {
        return res.status(400).json({ error: "Email and content required" });
      }

      await sendResearchEmail(email, "Market Research Report", content);
      logActivity(req, "email-pdf", "market_research", propertyId, "PDF Report");
      res.json({ success: true });
    } catch (error) {
      console.error("Error emailing PDF:", error);
      res.status(500).json({ error: "Failed to email PDF" });
    }
  });

  // Research Questions CRUD
  app.get("/api/research-questions", requireAuth, async (req, res) => {
    try {
      const questions = await storage.getAllResearchQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching research questions:", error);
      res.status(500).json({ error: "Failed to fetch research questions" });
    }
  });

  app.post("/api/research-questions", requireAdmin, async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) return res.status(400).json({ error: "Question required" });
      const q = await storage.createResearchQuestion({ question });
      res.status(201).json(q);
    } catch (error) {
      console.error("Error creating research question:", error);
      res.status(500).json({ error: "Failed to create research question" });
    }
  });

  app.patch("/api/research-questions/:id", requireAdmin, async (req, res) => {
    try {
      const { question } = req.body;
      const q = await storage.updateResearchQuestion(Number(req.params.id), question);
      res.json(q);
    } catch (error) {
      console.error("Error updating research question:", error);
      res.status(500).json({ error: "Failed to update research question" });
    }
  });

  app.delete("/api/research-questions/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteResearchQuestion(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting research question:", error);
      res.status(500).json({ error: "Failed to delete research question" });
    }
  });
}
