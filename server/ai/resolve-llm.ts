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

export { DEFAULT_ANTHROPIC_MODEL } from "@shared/constants";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const DEFAULT_OPENAI_MODEL = "gpt-4.1";
export const DEFAULT_RESEARCH_MODEL = "claude-sonnet-4-5";

const DOMAIN_DEFAULTS: Record<LlmDomain, { vendor: LlmVendor; model: string }> = {
  companyLlm:        { vendor: "google",    model: DEFAULT_GEMINI_MODEL },
  propertyLlm:       { vendor: "google",    model: DEFAULT_GEMINI_MODEL },
  marketLlm:         { vendor: "google",    model: DEFAULT_GEMINI_MODEL },
  reportLlm:         { vendor: "google",    model: DEFAULT_GEMINI_MODEL },
  chatbotLlm:        { vendor: "google",    model: DEFAULT_GEMINI_MODEL },
  premiumExportLlm:  { vendor: "google",    model: DEFAULT_GEMINI_MODEL },
  aiUtilityLlm:      { vendor: "google",    model: DEFAULT_GEMINI_MODEL },
  graphicsLlm:       { vendor: "google",    model: DEFAULT_GEMINI_MODEL },
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
