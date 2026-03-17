/**
 * server/middleware/cost-logger.ts — Lightweight API cost logging.
 *
 * Appends one JSON line per external API call to logs/api-costs.jsonl.
 * Fire-and-forget — never blocks the request, never throws.
 *
 * Usage in route handlers:
 *   import { logApiCost, estimateCost } from "../middleware/cost-logger";
 *   logApiCost({ service: "anthropic", model: "claude-sonnet-4-20250514", ... });
 */

import fs from "node:fs";
import path from "node:path";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CostEntry {
  timestamp: string;
  service:
    | "anthropic"
    | "openai"
    | "gemini"
    | "elevenlabs"
    | "replicate"
    | "resend"
    | "twilio"
    | "document-ai"
    | "google-maps"
    | "perplexity";
  model?: string;
  operation: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd: number;
  durationMs?: number;
  userId?: number;
  route: string;
}

// ── Pricing (per 1 M tokens unless noted) ────────────────────────────────────
// Updated 2026-03. Verify quarterly against provider pricing pages.

const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic (per 1M tokens)
  "claude-opus-4-6":             { input: 15.00,  output: 75.00 },
  "claude-sonnet-4-6":           { input: 3.00,   output: 15.00 },
  "claude-sonnet-4-20250514":    { input: 3.00,   output: 15.00 },
  "claude-haiku-4-5-20251001":   { input: 0.80,   output: 4.00 },
  // OpenAI (per 1M tokens)
  "gpt-4o":                      { input: 2.50,   output: 10.00 },
  "gpt-4o-mini":                 { input: 0.15,   output: 0.60 },
  "gpt-image-1":                 { input: 0,      output: 0 },      // image gen — flat fee
  // Gemini (per 1M tokens)
  "gemini-2.5-flash":            { input: 0.15,   output: 0.60 },
  "gemini-2.5-pro":              { input: 1.25,   output: 10.00 },
  "gemini-2.5-flash-image":      { input: 0.15,   output: 0.60 },
  // Perplexity (per 1M tokens — approximate)
  "sonar":                       { input: 1.00,   output: 1.00 },
  "sonar-pro":                   { input: 3.00,   output: 15.00 },
};

// Flat per-unit costs (non-token-based services)
const UNIT_PRICING: Record<string, number> = {
  "elevenlabs-tts":   0.30,   // per 1K characters
  "replicate-image":  0.01,   // per image
  "gpt-image-1":      0.04,   // per image (1024×1024)
  "resend-email":     0.001,  // per email (first 100/day free)
  "twilio-sms":       0.0079, // per SMS segment
  "document-ai-page": 0.01,   // per page
  "google-maps":      0.005,  // per geocode request
};

// ── Cost Estimation ──────────────────────────────────────────────────────────

export function estimateCost(
  service: string,
  model: string | undefined,
  inputTokens: number,
  outputTokens: number,
): number {
  // Try token-based pricing first
  if (model && TOKEN_PRICING[model]) {
    const p = TOKEN_PRICING[model];
    return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
  }

  // Fallback: service-level estimate
  const serviceDefaults: Record<string, { input: number; output: number }> = {
    anthropic:   { input: 3.00,  output: 15.00 },
    openai:      { input: 2.50,  output: 10.00 },
    gemini:      { input: 0.15,  output: 0.60 },
    perplexity:  { input: 1.00,  output: 1.00 },
  };

  if (serviceDefaults[service]) {
    const p = serviceDefaults[service];
    return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
  }

  return 0;
}

/** Look up flat per-unit cost */
export function unitCost(key: string): number {
  return UNIT_PRICING[key] ?? 0;
}

// ── Log Writer ───────────────────────────────────────────────────────────────

const LOG_DIR = path.resolve(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "api-costs.jsonl");

let dirChecked = false;

function ensureDir(): void {
  if (dirChecked) return;
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    // ignore — may already exist
  }
  dirChecked = true;
}

/**
 * Append a cost entry to the log. Fire-and-forget — never throws.
 */
export function logApiCost(entry: CostEntry): void {
  try {
    ensureDir();
    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(LOG_FILE, line);
  } catch {
    // Silent — logging must never break a request
  }
}
