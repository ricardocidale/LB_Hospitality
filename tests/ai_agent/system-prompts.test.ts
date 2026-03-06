/**
 * Tests for Twilio system prompt construction.
 *
 * buildSystemPrompt is not exported from twilio.ts, so we reimplement
 * the same logic here and verify structural properties.
 * If exported in future, switch to direct import.
 */
import { describe, it, expect } from "vitest";

const PHONE_SYSTEM_PROMPT_ADDITION = `

## Phone Conversation Mode
You are currently speaking on a phone call via Twilio. Adjust your responses accordingly:
- Keep responses very concise — aim for 1-3 sentences maximum
- Speak naturally as if on a phone — no markdown, no formatting
- Numbers should be spoken naturally ("two hundred fifty thousand dollars" not "$250,000")
- Avoid lists or complex structures — summarize succinctly
- Use casual phone-friendly transitions: "Sure," "Absolutely," "Let me tell you,"
- If you need to give detailed info, offer to send it via text message instead`;

const SMS_SYSTEM_PROMPT_ADDITION = `

## SMS Conversation Mode
You are responding via text message (SMS). Adjust your responses accordingly:
- Keep responses under 300 characters when possible — SMS should be brief
- No markdown formatting — plain text only
- Be direct and actionable
- Use abbreviations sparingly but accept them from the user
- If the question requires a long answer, give the key point and offer to discuss on a call or the web portal`;

function buildSystemPrompt(channel: "phone" | "sms", isAdmin: boolean): string {
  const base = `You are Marcela, a brilliant hospitality business strategist for Hospitality Business Group. You are warm, confident, and sharp — a trusted advisor. You have deep expertise in hotel acquisitions, revenue management, financial projections, and market analysis.

## CRITICAL: No LLM Calculations
- NEVER perform financial calculations yourself
- ALL calculations must be performed by the platform's coded financial engine
- Direct users to the web portal for computed results`;

  let prompt = base;
  if (channel === "phone") prompt += PHONE_SYSTEM_PROMPT_ADDITION;
  if (channel === "sms") prompt += SMS_SYSTEM_PROMPT_ADDITION;
  if (isAdmin) {
    prompt += `\n\n## Admin Note\nThis user is an administrator with full system access. You can discuss user management, verification, and system configuration.`;
  }
  return prompt;
}

describe("System Prompts — Channel Variants", () => {
  describe("phone channel", () => {
    it("includes base prompt", () => {
      const prompt = buildSystemPrompt("phone", false);
      expect(prompt).toContain("hospitality business strategist");
      expect(prompt).toContain("No LLM Calculations");
    });

    it("includes phone-specific instructions", () => {
      const prompt = buildSystemPrompt("phone", false);
      expect(prompt).toContain("Phone Conversation Mode");
      expect(prompt).toContain("1-3 sentences maximum");
      expect(prompt).toContain("no markdown");
    });

    it("does NOT include SMS instructions", () => {
      const prompt = buildSystemPrompt("phone", false);
      expect(prompt).not.toContain("SMS Conversation Mode");
    });
  });

  describe("sms channel", () => {
    it("includes base prompt", () => {
      const prompt = buildSystemPrompt("sms", false);
      expect(prompt).toContain("hospitality business strategist");
    });

    it("includes SMS-specific instructions", () => {
      const prompt = buildSystemPrompt("sms", false);
      expect(prompt).toContain("SMS Conversation Mode");
      expect(prompt).toContain("300 characters");
      expect(prompt).toContain("plain text only");
    });

    it("does NOT include phone instructions", () => {
      const prompt = buildSystemPrompt("sms", false);
      expect(prompt).not.toContain("Phone Conversation Mode");
    });
  });

  describe("admin flag", () => {
    it("includes admin note when isAdmin is true", () => {
      const prompt = buildSystemPrompt("phone", true);
      expect(prompt).toContain("## Admin Note");
      expect(prompt).toContain("administrator with full system access");
    });

    it("does NOT include admin note when isAdmin is false", () => {
      const prompt = buildSystemPrompt("phone", false);
      expect(prompt).not.toContain("## Admin Note");
    });

    it("works with SMS + admin", () => {
      const prompt = buildSystemPrompt("sms", true);
      expect(prompt).toContain("SMS Conversation Mode");
      expect(prompt).toContain("## Admin Note");
    });
  });

  describe("critical safety rule", () => {
    it("always includes no-calculation directive", () => {
      const phone = buildSystemPrompt("phone", false);
      const sms = buildSystemPrompt("sms", false);
      const admin = buildSystemPrompt("phone", true);

      for (const prompt of [phone, sms, admin]) {
        expect(prompt).toContain("NEVER perform financial calculations yourself");
        expect(prompt).toContain("platform's coded financial engine");
      }
    });
  });
});
