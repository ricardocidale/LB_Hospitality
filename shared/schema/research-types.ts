export interface ResearchSourceEntry {
  id: string;
  url: string;
  label: string;
  category?: string;
  addedAt: string;
}

export interface ResearchEventConfig {
  enabled: boolean;
  focusAreas: string[];
  regions: string[];
  timeHorizon: string;
  customInstructions: string;
  customQuestions: string;
  enabledTools: string[];
  refreshIntervalDays?: number;
  sources?: ResearchSourceEntry[];
}

export interface AiModelEntry {
  id: string;
  label: string;
  provider: "openai" | "anthropic" | "google" | "xai" | "tesla" | "microsoft";
}

export type LlmMode = "dual" | "primary-only";
export type LlmVendor = "openai" | "anthropic" | "google" | "xai" | "tesla" | "microsoft";

export interface ResearchConfig {
  property?: Partial<ResearchEventConfig>;
  company?:  Partial<ResearchEventConfig>;
  global?:   Partial<ResearchEventConfig>;
  marketing?: Partial<ResearchEventConfig>;
  preferredLlm?: string;
  llmMode?: LlmMode;
  llmVendor?: LlmVendor;
  primaryLlm?: string;
  secondaryLlm?: string;
  customSources?: { name: string; url?: string; category: string }[];
  cachedModels?: AiModelEntry[];
  cachedModelsAt?: string;
}
