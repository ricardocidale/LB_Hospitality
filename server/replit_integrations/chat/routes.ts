import express, { type Express, type Request, type Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { requireAuth } from "../../auth";
import { storage } from "../../storage";
import {
  transcribeAudio,
  createElevenLabsStreamingTTS,
  MARCELA_VOICE_ID,
} from "../../integrations/elevenlabs";
import { ensureCompatibleFormat } from "../audio/client";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const audioBodyParser = express.json({ limit: "50mb" });

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

**Help & Manuals** — Two comprehensive manuals are available in-app:

*User Manual (16 chapters):*
1. Business Model Overview — Two-entity structure (Management Company + Property SPVs)
2. Business Rules — 7 mandatory financial rules (interest-only on IS, GAAP depreciation, etc.)
3. Capital Structure — Equity, debt, SAFE funding, and investor return paths
4. Dynamic Behavior — Real-time recalculation engine, monthly granularity, multi-level analysis
5. Property Lifecycle — 4 phases: acquisition → operations → refinancing → exit
6. Default Values — Three-tier fallback system, key default assumptions
7. Revenue Calculations — Room revenue as foundation, ancillary streams as percentages
8. Operating Expenses — USALI-compliant cost structure, direct and overhead categories
9. GOP & NOI — Gross Operating Profit and Net Operating Income derivations
10. Debt & Financing — Acquisition loans, monthly payments, refinancing mechanics
11. Free Cash Flow — GAAP indirect method per ASC 230, three-section structure
12. Balance Sheet — Assets = Liabilities + Equity, GAAP-compliant snapshots
13. Investment Returns — Exit valuation via cap rate, IRR, NPV, equity multiples
14. Management Company Financials — Fee revenue, SAFE funding, staffing tiers, P&L
15. Fixed Assumptions — Immutable constants vs. configurable parameters
16. Cross-Verification — Two-layer independent verification system, audit trail

*Checker/Verification Manual (15 chapters):*
1. Application Overview — Architecture and navigation
2–3. Entities — Management Company and Property Portfolio (SPV structure)
4–5. Assumptions — Global and property-level parameters
6. Cash Flow Streams — The 6 cash flow streams per SPV
7. Financial Statements — IS, CF, BS structure and line items
8. Export System — 6 export formats for offline verification
9–11. Supporting — Design, scenarios, profile management
12. Dashboard KPIs — Consolidated portfolio metrics
13. AI Research — Market research tools and Industry Research configuration
14. Property CRUD — Adding/editing/deleting properties
15. Testing Methodology — 7-phase verification workflow

**Administration** — Admin-only page with tabs: Users, Companies, Activity, Verification, User Groups, Logos, Branding, Themes, Navigation, Database. Admins can manage users, assign roles, create user groups with company branding, and run financial verification.

**User Roles:**
- **Admin** — Full access to all features including Administration
- **Partner** — Management-level access (Dashboard, Properties, Company, Settings, Scenarios) but no Administration
- **Checker** — Same as Partner plus access to verification tools and checker manual
- **Investor** — Limited view: Dashboard, Properties, Profile, Help only

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
- When users ask about assumptions, reference the fallback chain: property-specific value → system default

## CRITICAL: No LLM Calculations
- NEVER perform financial calculations yourself (IRR, NPV, depreciation, amortization, cash flows, equity multiples, cap rate valuations, loan payments, tax computations, or any arithmetic involving money)
- ALL calculations must be performed by the platform's coded financial engine — direct users to the appropriate page or feature instead
- If a user asks "what would my IRR be if...?" or "calculate the NOI for..." — explain that the platform's deterministic financial engine handles all calculations for accuracy, and guide them to enter their assumptions on the relevant page to see the computed results
- You may explain formulas, concepts, and methodology, but never produce computed numerical results yourself
- When referencing financial metrics from the portfolio context below, clearly state these are values computed by the platform's financial engine, not your own calculations`;

const ADMIN_SYSTEM_PROMPT_ADDITION = `

## Admin Capabilities (You are speaking with an Admin)
As an admin, this user has full system access. You can help them with administrative tasks:

**User Management:**
- View all registered users, their roles, and login activity
- Guide them to add, edit, or remove users via Admin > Users tab
- Help assign roles (admin, partner, checker, investor) — remind them default role is Partner
- Help assign users to User Groups for branding

**Activity & Security:**
- Report on recent login activity and session information
- Guide them to Admin > Activity tab for login logs and audit trail
- Help them understand checker activity and verification history

**Financial Verification:**
- Help run and interpret the automated verification system
- Explain audit findings, GAAP compliance issues, and workpaper references
- Guide them through the AI-powered verification review in Admin > Verification tab
- Help export verification PDFs for external auditors

**System Configuration:**
- Guide branding setup: logos, themes, company names per User Group
- Help configure navigation visibility and sidebar settings
- Assist with database sync status and seed data management
- Help manage SPV companies and management company configuration

**Data Oversight:**
- Provide summaries of portfolio-wide data (properties, users, assumptions)
- Help interpret verification results and ensure UNQUALIFIED audit opinion
- Guide scenario management and assumption consistency checks

When the admin asks about system status, users, or administrative functions, provide detailed, actionable guidance. You have full visibility into the platform's admin capabilities.`;

const VOICE_SYSTEM_PROMPT_ADDITION = `

## Voice Conversation Mode
You are currently in a voice conversation. Adjust your responses accordingly:
- Keep responses concise and conversational — aim for 2-3 sentences when possible
- Avoid markdown formatting (no bold, no bullet points, no headers) since this will be spoken aloud
- Use natural speech patterns with clear transitions
- Numbers and percentages should be spoken naturally (say "eight and a half percent" not "8.5%")
- Avoid listing more than 3 items — summarize instead
- If a question requires a detailed answer, give a brief summary and offer to elaborate
- Use conversational connectors: "So," "Now," "Here's the thing," "What's interesting is..."`;

async function buildContextPrompt(userId?: number): Promise<string> {
  try {
    const [assumptions, properties, allUsers, allResearch] = await Promise.all([
      storage.getGlobalAssumptions(userId),
      storage.getAllProperties(userId),
      storage.getAllUsers(),
      storage.getAllMarketResearch(userId),
    ]);

    const safeUsers = allUsers.map(({ id, firstName, lastName, email, role, title }) => ({ id, name: [firstName, lastName].filter(Boolean).join(' ') || null, email, role, title }));

    const parts: string[] = [];

    if (assumptions) {
      parts.push(`## Current Portfolio Context`);
      parts.push(`- Company: ${assumptions.companyName || "Hospitality Business Company"}`);
      parts.push(`- Property Type: ${assumptions.propertyLabel || "Boutique Hotel"}`);
      parts.push(`- Projection Years: ${assumptions.projectionYears || 10}`);
      parts.push(`- Inflation Rate: ${assumptions.inflationRate || 3}%`);
      parts.push(`- Base Management Fee: ${assumptions.baseManagementFee || 8.5}%`);
      parts.push(`- Incentive Management Fee: ${assumptions.incentiveManagementFee || 12}%`);
      if (assumptions.assetDefinition) {
        const ad = assumptions.assetDefinition as Record<string, unknown>;
        if (ad.level) parts.push(`- Tier: ${ad.level}`);
        if (ad.minRooms && ad.maxRooms) parts.push(`- Room Range: ${ad.minRooms}–${ad.maxRooms}`);
        if (ad.minAdr && ad.maxAdr) parts.push(`- ADR Range: $${ad.minAdr}–$${ad.maxAdr}`);
      }
    }

    if (properties && properties.length > 0) {
      parts.push(`\n## Properties in Portfolio (${properties.length} total)`);
      for (const p of properties) {
        const details = [`${p.roomCount} rooms`];
        if (p.startAdr) details.push(`ADR $${p.startAdr}`);
        if (p.location) details.push(p.location);
        if (p.purchasePrice) details.push(`$${Number(p.purchasePrice).toLocaleString()} acquisition`);
        parts.push(`- **${p.name}**: ${details.join(", ")}`);
      }
    }

    if (safeUsers.length > 0) {
      parts.push(`\n## Team Members (${safeUsers.length} users)`);
      for (const u of safeUsers) {
        const displayName = u.name || u.email;
        parts.push(`- **${displayName}** — ${u.role}${u.title ? `, ${u.title}` : ""}`);
      }
      const currentUser = userId ? safeUsers.find(u => u.id === userId) : null;
      if (currentUser) {
        parts.push(`\nYou are currently speaking with **${currentUser.name || currentUser.email}** (${currentUser.role}).`);
      }
    }

    if (allResearch && allResearch.length > 0) {
      parts.push(`\n## Latest AI Research (${allResearch.length} reports)`);
      for (const r of allResearch) {
        const dateStr = r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "unknown";
        parts.push(`\n### ${r.title} (${dateStr}, model: ${r.llmModel || "unknown"})`);
        const content = r.content as Record<string, any>;
        if (!content || content.rawResponse) continue;
        if (r.type === "property" && content.marketOverview?.summary) {
          parts.push(`Market: ${content.marketOverview.summary.slice(0, 300)}`);
          if (content.adrAnalysis) {
            parts.push(`ADR: market avg ${content.adrAnalysis.marketAverage || "N/A"}, recommended ${content.adrAnalysis.recommendedRange || "N/A"}`);
          }
          if (content.capRateAnalysis) {
            parts.push(`Cap Rate: market ${content.capRateAnalysis.marketRange || "N/A"}, boutique ${content.capRateAnalysis.boutiqueRange || "N/A"}`);
          }
          if (content.occupancyAnalysis) {
            parts.push(`Occupancy: market avg ${content.occupancyAnalysis.marketAverage || "N/A"}`);
          }
        } else if (r.type === "global" && content.industryOverview) {
          if (content.industryOverview.marketSize) parts.push(`Market Size: ${content.industryOverview.marketSize}`);
          if (content.industryOverview.growthRate) parts.push(`Growth: ${content.industryOverview.growthRate}`);
          if (content.industryOverview.keyTrends?.length) {
            parts.push(`Key Trends: ${content.industryOverview.keyTrends.slice(0, 3).join("; ")}`);
          }
        } else if (r.type === "company" && content.managementFees) {
          if (content.managementFees.baseFee?.recommended) parts.push(`Base Fee: ${content.managementFees.baseFee.recommended}`);
          if (content.managementFees.incentiveFee?.recommended) parts.push(`Incentive Fee: ${content.managementFees.incentiveFee.recommended}`);
        }
      }
    }

    return parts.length > 0 ? "\n\n" + parts.join("\n") : "";
  } catch {
    return "";
  }
}

async function getUserRole(userId?: number): Promise<string> {
  if (!userId) return "partner";
  try {
    const user = await storage.getUserById(userId);
    return user?.role || "partner";
  } catch {
    return "partner";
  }
}

function buildSystemPrompt(isVoice: boolean, isAdmin: boolean): string {
  let prompt = SYSTEM_PROMPT;
  if (isAdmin) prompt += ADMIN_SYSTEM_PROMPT_ADDITION;
  if (isVoice) prompt += VOICE_SYSTEM_PROMPT_ADDITION;
  return prompt;
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
      const [contextPrompt, userRole] = await Promise.all([
        buildContextPrompt(userId),
        getUserRole(userId),
      ]);
      const isAdmin = userRole === "admin";
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: buildSystemPrompt(false, isAdmin) + contextPrompt },
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

  app.post("/api/conversations/:id/voice", requireAuth, audioBodyParser, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id as string);
      const { audio } = req.body;

      if (!audio) {
        return res.status(400).json({ error: "Audio data (base64) is required" });
      }

      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);

      const userTranscript = await transcribeAudio(audioBuffer, `audio.${inputFormat}`);

      if (!userTranscript || !userTranscript.trim()) {
        return res.status(400).json({ error: "Could not transcribe audio. Please try again." });
      }

      await chatStorage.createMessage(conversationId, "user", userTranscript.trim());

      const userId = (req as any).user?.id;
      const [contextPrompt, userRole] = await Promise.all([
        buildContextPrompt(userId),
        getUserRole(userId),
      ]);
      const isAdmin = userRole === "admin";
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: buildSystemPrompt(true, isAdmin) + contextPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ type: "user_transcript", data: userTranscript })}\n\n`);

      const llmStream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 1024,
      });

      let fullResponse = "";
      let ttsStream: { send: (text: string) => void; flush: () => void; close: () => void } | null = null;

      try {
        ttsStream = await createElevenLabsStreamingTTS(
          MARCELA_VOICE_ID,
          (audioBase64: string) => {
            try {
              res.write(`data: ${JSON.stringify({ type: "audio", data: audioBase64 })}\n\n`);
            } catch { /* connection closed */ }
          },
          { outputFormat: "pcm_16000" }
        );
      } catch (ttsError) {
        console.error("ElevenLabs TTS connection failed, falling back to text-only:", ttsError);
      }

      for await (const chunk of llmStream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ type: "transcript", data: delta })}\n\n`);
          if (ttsStream) {
            ttsStream.send(delta);
          }
        }
      }

      if (ttsStream) {
        ttsStream.flush();
        await new Promise(resolve => setTimeout(resolve, 500));
        ttsStream.close();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ type: "done", transcript: fullResponse })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing voice message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to process voice message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process voice message" });
      }
    }
  });
}
