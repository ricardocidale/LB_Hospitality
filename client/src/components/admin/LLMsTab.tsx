import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/icons/themed-icons";
import { CurrentThemeTab } from "@/components/ui/tabs";
import type { CurrentThemeTabItem } from "@/components/ui/tabs";
import {
  IconBrain, IconRefreshCw, IconTarget, IconProperties, IconTrendingUp,
  IconFileText, IconMessageCircle, IconFileDown, IconFileCode, IconFlaskConical,
  IconStar, IconExport, IconSparkles,
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useResearchConfig, useSaveResearchConfig, useRefreshAiModels } from "@/lib/api/admin";
import type { ResearchConfig, ContextLlmConfig, LlmMode, LlmVendor, AiModelEntry } from "@shared/schema";
import { FALLBACK_MODELS, RESEARCH_LLM_VENDORS, LLM_VENDORS, normalizeResearchConfig } from "./research-center/research-shared";
import type { AdminSaveState } from "./types/save-state";

interface LLMsTabProps {
  onSaveStateChange?: (state: AdminSaveState | null) => void;
}

type LlmConfigField = "companyLlm" | "propertyLlm" | "marketLlm" | "reportLlm" | "chatbotLlm" | "premiumExportLlm" | "aiUtilityLlm";
type TabKey = "research" | "operations" | "assistants" | "exports";

interface DomainConfig {
  key: string;
  configField: LlmConfigField;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  useAllVendors?: boolean;
  tab: TabKey;
  stageLabel?: { primary: string; secondary: string };
  recommended?: { vendor: LlmVendor; primary: string; secondary?: string };
}

const RECOMMENDED: Record<string, { vendor: LlmVendor; primary: string; secondary?: string }> = {
  company:       { vendor: "google", primary: "gemini-2.5-flash", secondary: "gemini-2.0-flash" },
  property:      { vendor: "google", primary: "gemini-2.5-flash", secondary: "gemini-2.0-flash" },
  market:        { vendor: "google", primary: "gemini-2.5-flash", secondary: "gemini-2.0-flash" },
  report:        { vendor: "google", primary: "gemini-2.5-flash" },
  chatbot:       { vendor: "google", primary: "gemini-2.5-flash" },
  premiumExport: { vendor: "google", primary: "gemini-2.5-flash" },
  aiUtility:     { vendor: "google", primary: "gemini-2.5-flash" },
};

const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    key: "company",
    configField: "companyLlm",
    label: "Management Company Research",
    icon: IconTarget,
    description: "LLM for researching management companies — ICP analysis, financial comparisons, and company intelligence.",
    tab: "research",
    stageLabel: { primary: "Stage 1 — Reasoning Model", secondary: "Stage 2 — Workhorse Model" },
    recommended: RECOMMENDED.company,
  },
  {
    key: "property",
    configField: "propertyLlm",
    label: "Property Research",
    icon: IconProperties,
    description: "LLM for property-level research — market benchmarks, RevPAR comparisons, and location analysis.",
    tab: "research",
    stageLabel: { primary: "Stage 1 — Reasoning Model", secondary: "Stage 2 — Workhorse Model" },
    recommended: RECOMMENDED.property,
  },
  {
    key: "market",
    configField: "marketLlm",
    label: "Market & Industry Research",
    icon: IconTrendingUp,
    description: "LLM for broad market intelligence — macro trends, hospitality sector analysis, and competitive landscape.",
    tab: "research",
    stageLabel: { primary: "Stage 1 — Reasoning Model", secondary: "Stage 2 — Workhorse Model" },
    recommended: RECOMMENDED.market,
  },
  {
    key: "report",
    configField: "reportLlm",
    label: "Report Generation",
    icon: IconFileText,
    description: "LLM used for generating PDF reports, executive summaries, and investment memos.",
    useAllVendors: true,
    tab: "operations",
    recommended: RECOMMENDED.report,
  },
  {
    key: "aiUtility",
    configField: "aiUtilityLlm",
    label: "AI Utilities",
    icon: IconFileCode,
    description: "LLM for lightweight AI tasks — description rewriting, prompt optimization, and logo prompt enhancement.",
    useAllVendors: true,
    tab: "operations",
    recommended: RECOMMENDED.aiUtility,
  },
  {
    key: "chatbot",
    configField: "chatbotLlm",
    label: "Chatbot (Rebecca)",
    icon: IconMessageCircle,
    description: "LLM powering Rebecca and other conversational AI assistants.",
    useAllVendors: true,
    tab: "assistants",
    recommended: RECOMMENDED.chatbot,
  },
  {
    key: "premiumExport",
    configField: "premiumExportLlm",
    label: "Premium Exports",
    icon: IconFileDown,
    description: "LLM for generating premium-formatted financial documents — XLSX, PPTX, PDF, and DOCX with AI-structured content.",
    useAllVendors: true,
    tab: "exports",
    recommended: RECOMMENDED.premiumExport,
  },
];

const TAB_ITEMS: CurrentThemeTabItem[] = [
  { value: "research", label: "Research", icon: IconFlaskConical },
  { value: "operations", label: "Operations", icon: IconSparkles },
  { value: "assistants", label: "Assistants", icon: IconMessageCircle },
  { value: "exports", label: "Exports", icon: IconExport },
];

const TAB_META: Record<TabKey, { title: string; subtitle: string }> = {
  research: {
    title: "Research LLMs",
    subtitle: "Each research domain uses a two-stage cascading pipeline. Stage 1 is the frontier reasoning model that performs deep analysis. Stage 2 is a faster workhorse that synthesizes tool results. Select Dual mode to enable both stages.",
  },
  operations: {
    title: "Operations LLMs",
    subtitle: "Models used for report generation, content writing, and general AI utility tasks across the platform.",
  },
  assistants: {
    title: "AI Assistants",
    subtitle: "Models powering conversational AI assistants like Rebecca for portfolio analysis and investor Q&A.",
  },
  exports: {
    title: "Export LLMs",
    subtitle: "Models used to generate premium-formatted financial documents. The AI structures raw financial data into professionally formatted XLSX, PPTX, PDF, and DOCX exports.",
  },
};

function ModelSelectWithRecommendation({
  value,
  onValueChange,
  vendorModels,
  recommendedId,
  testId,
}: {
  value: string;
  onValueChange: (v: string) => void;
  vendorModels: AiModelEntry[];
  recommendedId?: string;
  testId: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-card h-9" data-testid={testId}>
        <SelectValue placeholder={vendorModels.length === 0 ? "No models" : "Select model"} />
      </SelectTrigger>
      <SelectContent>
        {value && !vendorModels.some((m) => m.id === value) && (
          <SelectItem value={value}>{value} (current)</SelectItem>
        )}
        {vendorModels.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <span className="flex items-center gap-2">
              {m.label}
              {recommendedId === m.id && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  <IconStar className="w-3 h-3" />
                  Recommended
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LlmDomainCard({
  domain,
  config,
  onChange,
  models,
  vendors,
}: {
  domain: DomainConfig;
  config: ContextLlmConfig;
  onChange: (c: ContextLlmConfig) => void;
  models: AiModelEntry[];
  vendors: { value: LlmVendor; label: string }[];
}) {
  const DomainIcon = domain.icon;
  const mode: LlmMode | undefined = config.llmMode;
  const vendor: LlmVendor | undefined = config.llmVendor;
  const isDual = mode === "dual";
  const vendorModels = vendor ? models.filter((m) => m.provider === vendor) : [];
  const primaryModel = config.primaryLlm || "";
  const secondaryModel = config.secondaryLlm || "";

  const isResearch = domain.tab === "research";
  const primaryLabel = domain.stageLabel?.primary || "Primary LLM";
  const secondaryLabel = domain.stageLabel?.secondary || "Secondary LLM";

  const recPrimary = (vendor && domain.recommended?.vendor === vendor) ? domain.recommended.primary : undefined;
  const recSecondary = (vendor && domain.recommended?.vendor === vendor) ? domain.recommended.secondary : undefined;

  const update = (patch: Partial<ContextLlmConfig>) => {
    onChange({ ...config, ...patch });
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="flex items-center gap-2 text-sm font-display" data-testid={`text-llm-title-${domain.key}`}>
              <DomainIcon className="w-4 h-4 text-primary shrink-0" />
              {domain.label}
              <InfoTooltip text={domain.description} />
            </CardTitle>
            {primaryModel && (
              <Badge variant="outline" className="text-[10px] font-normal shrink-0 hidden sm:inline-flex">
                {primaryModel}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Vendor</Label>
            <Select
              value={vendor || ""}
              onValueChange={(value) => {
                update({ llmVendor: value as LlmVendor, primaryLlm: "", secondaryLlm: "" });
              }}
            >
              <SelectTrigger className="bg-card h-9" data-testid={`select-llm-vendor-${domain.key}`}>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    <span className="flex items-center gap-2">
                      {v.label}
                      {domain.recommended?.vendor === v.value && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          <IconStar className="w-3 h-3" />
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Mode</Label>
            <RadioGroup
              value={mode || ""}
              onValueChange={(value) => update({ llmMode: value as LlmMode })}
              className="flex gap-4 pt-1"
              data-testid={`radio-llm-mode-${domain.key}`}
            >
              {isResearch ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="dual" id={`mode-dual-${domain.key}`} data-testid={`radio-mode-dual-${domain.key}`} />
                    <Label htmlFor={`mode-dual-${domain.key}`} className="text-xs font-normal cursor-pointer">
                      Dual (2-stage cascade)
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="primary-only" id={`mode-primary-${domain.key}`} data-testid={`radio-mode-primary-${domain.key}`} />
                    <Label htmlFor={`mode-primary-${domain.key}`} className="text-xs font-normal cursor-pointer">Single model</Label>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="dual" id={`mode-dual-${domain.key}`} data-testid={`radio-mode-dual-${domain.key}`} />
                    <Label htmlFor={`mode-dual-${domain.key}`} className="text-xs font-normal cursor-pointer">Dual</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="primary-only" id={`mode-primary-${domain.key}`} data-testid={`radio-mode-primary-${domain.key}`} />
                    <Label htmlFor={`mode-primary-${domain.key}`} className="text-xs font-normal cursor-pointer">Primary only</Label>
                  </div>
                </>
              )}
            </RadioGroup>
          </div>
        </div>

        {vendor && mode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">{primaryLabel}</Label>
              <ModelSelectWithRecommendation
                value={primaryModel}
                onValueChange={(value) => update({ primaryLlm: value })}
                vendorModels={vendorModels}
                recommendedId={recPrimary}
                testId={`select-primary-llm-${domain.key}`}
              />
            </div>
            {isDual && (
              <div>
                <Label className="text-xs font-medium mb-1.5 block">{secondaryLabel}</Label>
                <ModelSelectWithRecommendation
                  value={secondaryModel}
                  onValueChange={(value) => update({ secondaryLlm: value })}
                  vendorModels={vendorModels}
                  recommendedId={recSecondary}
                  testId={`select-secondary-llm-${domain.key}`}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LLMsTab({ onSaveStateChange }: LLMsTabProps) {
  const { toast } = useToast();
  const { data: savedConfig, isLoading } = useResearchConfig();
  const saveMutation = useSaveResearchConfig();
  const refreshModels = useRefreshAiModels();

  const [draft, setDraft] = useState<ResearchConfig>({});
  const [isDirty, setIsDirty] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("research");

  // Ref-based save handler to avoid infinite re-render loop (see admin-save-state rule)
  const saveRef = useRef<(() => void) | undefined>(undefined);
  saveRef.current = () => {
    saveMutation.mutate(draft, {
      onSuccess: () => {
        setIsDirty(false);
        toast({ title: "LLM configuration saved" });
      },
      onError: () => {
        toast({ title: "Failed to save", variant: "destructive" });
      },
    });
  };

  useEffect(() => {
    if (savedConfig && !initialized) {
      setDraft(normalizeResearchConfig(savedConfig));
      setInitialized(true);
    }
  }, [savedConfig, initialized]);

  useEffect(() => {
    if (!onSaveStateChange) return;
    if (!isDirty) {
      onSaveStateChange(null);
      return;
    }
    onSaveStateChange({
      isDirty: true,
      isPending: saveMutation.isPending,
      onSave: () => saveRef.current?.(),
    });
    return () => onSaveStateChange(null);
  }, [isDirty, saveMutation.isPending, onSaveStateChange]);

  const models = (draft.cachedModels && draft.cachedModels.length > 0) ? draft.cachedModels : FALLBACK_MODELS;

  const handleRefreshModels = async () => {
    try {
      const result = await refreshModels.mutateAsync();
      setDraft((prev) => ({ ...prev, cachedModels: result.models, cachedModelsAt: result.fetchedAt }));
      setIsDirty(true);
      toast({ title: `Loaded ${result.models.length} models from providers` });
    } catch {
      toast({ title: "Failed to refresh models", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabDomains = DOMAIN_CONFIGS.filter((d) => d.tab === activeTab);
  const meta = TAB_META[activeTab as TabKey];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconBrain className="w-4 h-4" />
          {draft.cachedModelsAt ? (
            <span>Models last refreshed {new Date(draft.cachedModelsAt).toLocaleDateString()}</span>
          ) : (
            <span>Using default model list</span>
          )}
        </div>
        <Button
          variant="outline" size="sm" className="gap-1.5 shrink-0"
          disabled={refreshModels.isPending}
          data-testid="button-refresh-all-models"
          onClick={handleRefreshModels}
        >
          {refreshModels.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconRefreshCw className="w-3.5 h-3.5" />}
          Refresh All Models
        </Button>
      </div>

      <CurrentThemeTab
        tabs={TAB_ITEMS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div>
        <h3 className="text-sm font-display font-semibold text-foreground mb-1" data-testid={`text-tab-title-${activeTab}`}>
          {meta.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-4" data-testid={`text-tab-subtitle-${activeTab}`}>
          {meta.subtitle}
        </p>

        <div className={`grid gap-4 ${tabDomains.length === 1 ? "grid-cols-1 max-w-2xl" : "grid-cols-1 xl:grid-cols-2"}`}>
          {tabDomains.map((domain) => (
            <LlmDomainCard
              key={domain.key}
              domain={domain}
              config={draft[domain.configField] || {}}
              onChange={(c) => {
                setDraft((prev) => ({ ...prev, [domain.configField]: c }));
                setIsDirty(true);
              }}
              models={models}
              vendors={domain.useAllVendors ? LLM_VENDORS : RESEARCH_LLM_VENDORS}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
