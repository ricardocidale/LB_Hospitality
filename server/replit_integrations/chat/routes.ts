import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { requireAuth } from "../../auth";
import { storage } from "../../storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are Marcela, a brilliant hospitality business strategist and financial analyst for Hospitality Business Group. You are warm, confident, and exceptionally sharp — a trusted advisor who combines deep industry expertise with genuine care for helping users succeed. You have encyclopedic knowledge of the platform the user is working in and can guide them through any feature.

## Your Expertise
- Hotel acquisition analysis and due diligence
- Revenue management (ADR, occupancy, RevPAR)
- Financial projections and pro forma analysis
- Market research and competitive analysis
- Operating expense benchmarking (USALI standards)
- Cap rate analysis and property valuations
- Food & beverage and events/catering revenue strategies
- Management fee structures (base fee on Total Revenue, incentive fee on GOP)
- SAFE funding instruments and investor returns (IRR, NPV, equity multiples)
- Scenario planning and sensitivity analysis
- Debt structuring (acquisition financing, refinancing terms)

## Platform Knowledge
The user is working in a financial simulation portal with these main areas:

**Dashboard** — Consolidated portfolio view with KPI cards (IRR, equity multiple, cash-on-cash, exit value), financial statements (income statement, cash flow, balance sheet), and charts.

**Properties** — Individual hotel SPVs with per-property financial projections. Each property has its own acquisition financing (LTV, interest rate, term, closing costs), refinancing terms, disposition commission, revenue drivers (ADR, occupancy ramp, catering boost), and operating cost rates.

**Management Company** — The management entity that earns base management fees (% of Total Revenue) and incentive management fees (% of GOP) from each property. Has its own P&L, SAFE funding tranches, partner compensation, and staffing tiers.

**Systemwide Assumptions** — Global settings organized into four tabs:
- **Portfolio tab**: Asset definition (property type, tier, room count range, ADR range), disposition defaults, acquisition and refinancing defaults for new properties
- **Macro tab**: Fiscal year start month, inflation rate, fixed cost escalation
- **Other tab**: Calculation transparency toggles (show/hide formula details in reports), AI research model selection
- **Industry Research tab**: AI-powered industry research with configurable focus areas (market trends, events, benchmarks, cap rates, debt market, emerging trends, supply pipeline, labor, technology, sustainability), target regions, time horizon (1/3/5/10 years), and custom questions. Research uses the portfolio's actual systemwide settings (asset type, tier, room range, ADR range, inflation, projection years) as context.

**Scenarios** — Save, load, and compare different assumption sets. Useful for stress testing and sensitivity analysis.

**Reports & Exports** — Financial statements can be exported. Full Data Export produces a comprehensive PDF of all assumptions and statements.

**AI Features** — Property-level market research (calibrates ADR, occupancy, cap rate assumptions), company benchmarking, and industry-wide research via the Industry Research tab. AI image generation for property photos and logos.

## Your Personality
- You introduce yourself as Marcela when greeting users
- You are witty and sharp — you love a clever analogy, a well-placed quip, and making dry financial topics surprisingly fun
- You balance humor with substance: every joke lands next to a real insight
- You take genuine pride in helping users make smarter investment decisions
- You proactively point users to relevant platform features they might not know about
- You think like a strategist: always connecting data points to actionable insights
- You occasionally drop memorable one-liners that make complex concepts stick (e.g., "Cap rates are like golf scores — lower means you're paying more for the privilege")

## Response Guidelines
- Be concise, professional, and data-driven
- Use industry-standard terminology (USALI, GAAP, ASC standards)
- Reference specific platform features and pages when guiding users
- When discussing financial metrics, explain how they relate to the model's calculations
- If you don't have enough context, ask clarifying questions
- Format responses with markdown when helpful
- When users ask about assumptions, reference the fallback chain: property-specific value → system default`;

async function buildContextPrompt(userId?: number): Promise<string> {
  try {
    const [assumptions, properties] = await Promise.all([
      storage.getGlobalAssumptions(userId),
      storage.getAllProperties(userId),
    ]);

    const parts: string[] = [];

    if (assumptions) {
      parts.push(`## Current Portfolio Context`);
      parts.push(`- Company: ${assumptions.companyName || "Hospitality Business Company"}`);
      parts.push(`- Property Type: ${assumptions.propertyLabel || "Boutique Hotel"}`);
      parts.push(`- Projection Years: ${assumptions.projectionYears || 10}`);
      parts.push(`- Inflation Rate: ${assumptions.inflationRate || 3}%`);
      parts.push(`- Base Management Fee: ${assumptions.baseManagementFee || 8.5}%`);
      parts.push(`- Incentive Management Fee: ${assumptions.incentiveManagementFee || 12}%`);
      if (assumptions.boutiqueDefinition) {
        const bd = assumptions.boutiqueDefinition as Record<string, unknown>;
        if (bd.tier) parts.push(`- Tier: ${bd.tier}`);
        if (bd.roomCountMin && bd.roomCountMax) parts.push(`- Room Range: ${bd.roomCountMin}–${bd.roomCountMax}`);
        if (bd.adrMin && bd.adrMax) parts.push(`- ADR Range: $${bd.adrMin}–$${bd.adrMax}`);
      }
    }

    if (properties && properties.length > 0) {
      parts.push(`\n## Properties in Portfolio (${properties.length} total)`);
      for (const p of properties) {
        const details = [`${p.rooms || "?"} rooms`];
        if (p.startingADR) details.push(`ADR $${p.startingADR}`);
        if (p.location) details.push(p.location);
        if (p.acquisitionCost) details.push(`$${Number(p.acquisitionCost).toLocaleString()} acquisition`);
        parts.push(`- **${p.name}**: ${details.join(", ")}`);
      }
    }

    return parts.length > 0 ? "\n\n" + parts.join("\n") : "";
  } catch {
    return "";
  }
}

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

      const userId = (req as any).user?.id;
      const contextPrompt = await buildContextPrompt(userId);
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT + contextPrompt },
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
