/**
 * server/ai/clients.ts — Singleton AI SDK clients
 *
 * Centralized lazy-singleton factories for OpenAI, Anthropic, and Gemini.
 * Each client is created once on first use and reused for all subsequent calls.
 * This prevents per-request instantiation overhead (TCP connections, token refresh)
 * and provides a single place to configure base URLs, API versions, etc.
 *
 * Usage:
 *   import { getOpenAIClient, getAnthropicClient, getGeminiClient } from "../ai/clients";
 */
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

// ── OpenAI ──────────────────────────────────────────────

let _openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (_openai) return _openai;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not configured (set AI_INTEGRATIONS_OPENAI_API_KEY)");
  _openai = new OpenAI({
    apiKey,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
  });
  return _openai;
}

// ── Anthropic ────────────────────────────────────────────

let _anthropic: Anthropic | null = null;

/**
 * Returns a shared Anthropic client. Uses ANTHROPIC_API_KEY by default,
 * falling back to AI_INTEGRATIONS_ANTHROPIC_API_KEY (Replit connector alias).
 * Optional baseURL override via AI_INTEGRATIONS_ANTHROPIC_BASE_URL.
 */
export function getAnthropicClient(): Anthropic {
  if (_anthropic) return _anthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic API key not configured (set ANTHROPIC_API_KEY)");
  _anthropic = new Anthropic({
    apiKey,
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || undefined,
  });
  return _anthropic;
}

// ── Google Gemini ────────────────────────────────────────

let _gemini: GoogleGenAI | null = null;

/**
 * Returns a shared Google Gemini client.
 * Optional base URL override via AI_INTEGRATIONS_GEMINI_BASE_URL.
 */
export function getGeminiClient(): GoogleGenAI {
  if (_gemini) return _gemini;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured (set AI_INTEGRATIONS_GEMINI_API_KEY)");
  _gemini = new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion: "",
      baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
    },
  });
  return _gemini;
}
