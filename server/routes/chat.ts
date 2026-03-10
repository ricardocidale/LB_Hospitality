import { type Express, type Request, type Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import { computePropertyMetrics } from "../../calc/research/property-metrics";
import type { Property } from "../../shared/schema";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPropertyContext(properties: Property[]): string {
  return properties.map((p: any) => {
    const metrics = computePropertyMetrics({
      room_count: p.roomCount,
      adr: p.startAdr,
      occupancy: p.maxOccupancy,
      cost_rate_rooms: p.costRateRooms,
      cost_rate_fb: p.costRateFB,
      cost_rate_admin: p.costRateAdmin,
      cost_rate_marketing: p.costRateMarketing,
      cost_rate_property_ops: p.costRatePropertyOps,
      cost_rate_utilities: p.costRateUtilities,
      cost_rate_ffe: p.costRateFFE,
      cost_rate_other: p.costRateOther,
      rev_share_events: p.revShareEvents,
      rev_share_fb: p.revShareFB,
      rev_share_other: p.revShareOther,
      catering_boost_pct: p.cateringBoostPercent,
    });
    const totalInvestment = (p.purchasePrice || 0) + (p.buildingImprovements || 0) + (p.preOpeningCosts || 0) + (p.operatingReserve || 0);
    return [
      `Property: ${p.name}`,
      `  Location: ${p.location}`,
      `  Rooms: ${p.roomCount}`,
      `  ADR: $${p.startAdr}`,
      `  Max Occupancy: ${Math.round(p.maxOccupancy * 100)}%`,
      `  Purchase Price: $${(p.purchasePrice || 0).toLocaleString()}`,
      `  Total Investment: $${totalInvestment.toLocaleString()}`,
      `  Type: ${p.type}`,
      `  Status: ${p.status}`,
      `  RevPAR: $${metrics.revpar}`,
      `  Annual Revenue: $${metrics.annual_total_revenue.toLocaleString()}`,
      `  Annual NOI: $${metrics.annual_noi.toLocaleString()}`,
      `  NOI Margin: ${metrics.noi_margin_pct}%`,
      `  GOP Margin: ${metrics.gop_margin_pct}%`,
    ].join("\n");
  }).join("\n\n");
}

const SYSTEM_PROMPT = `You are a helpful property investment assistant for a boutique hotel management company. You answer questions about the portfolio's properties, financial metrics, and hospitality industry concepts.

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

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
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
