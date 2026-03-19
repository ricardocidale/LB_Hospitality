import type { ResearchConfig, ContextLlmConfig, LlmVendor } from "@shared/schema";
import { normalizeModelId, getGeminiClient, getAnthropicClient, getOpenAIClient } from "./clients";

export type LlmDomain =
  | "companyLlm"
  | "propertyLlm"
  | "marketLlm"
  | "reportLlm"
  | "chatbotLlm"
  | "premiumExportLlm"
  | "aiUtilityLlm"
  | "graphicsLlm";

const DOMAIN_DEFAULTS: Record<LlmDomain, { vendor: LlmVendor; model: string }> = {
  companyLlm:        { vendor: "google",    model: "gemini-2.5-flash" },
  propertyLlm:       { vendor: "google",    model: "gemini-2.5-flash" },
  marketLlm:         { vendor: "google",    model: "gemini-2.5-flash" },
  reportLlm:         { vendor: "google",    model: "gemini-2.5-flash" },
  chatbotLlm:        { vendor: "google",    model: "gemini-2.5-flash" },
  premiumExportLlm:  { vendor: "google",    model: "gemini-2.5-pro" },
  aiUtilityLlm:      { vendor: "google",    model: "gemini-2.5-flash" },
  graphicsLlm:       { vendor: "google",    model: "gemini-2.5-flash" },
};

const DOMAIN_TAB: Record<LlmDomain, string> = {
  companyLlm:       "research",
  propertyLlm:      "research",
  marketLlm:        "research",
  reportLlm:        "research",
  chatbotLlm:       "assistants",
  premiumExportLlm: "exports",
  aiUtilityLlm:     "operations",
  graphicsLlm:      "operations",
};

export interface ResolvedLlm {
  vendor: LlmVendor;
  model: string;
  secondaryVendor?: LlmVendor;
  secondaryModel?: string;
  isDual: boolean;
}

export function resolveLlm(
  researchConfig: ResearchConfig | undefined | null,
  domain: LlmDomain
): ResolvedLlm {
  const cfg = researchConfig?.[domain] as ContextLlmConfig | undefined;
  const tabKey = DOMAIN_TAB[domain];
  const tabDef = researchConfig?.tabDefaults?.[tabKey];
  const defaults = DOMAIN_DEFAULTS[domain];

  const vendor: LlmVendor = cfg?.llmVendor || (tabDef?.llmVendor as LlmVendor | undefined) || defaults.vendor;
  const model = normalizeModelId(cfg?.primaryLlm || tabDef?.primaryLlm || defaults.model);
  const isDual = cfg?.llmMode === "dual" && !!cfg.secondaryLlm;
  const secondaryVendor = isDual ? (cfg!.secondaryLlmVendor || vendor) : undefined;
  const secondaryModel = isDual ? normalizeModelId(cfg!.secondaryLlm!) : undefined;

  return { vendor, model, secondaryVendor, secondaryModel, isDual };
}

export function getVendorService(vendor: LlmVendor): "gemini" | "anthropic" | "openai" {
  if (vendor === "google") return "gemini";
  if (vendor === "anthropic") return "anthropic";
  return "openai";
}
