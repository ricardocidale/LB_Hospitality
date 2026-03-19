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
  supportsDual?: boolean;
  stageLabel?: { primary: string; secondary: string };
  recommended?: { vendor: LlmVendor; primary: string; secondary?: string };
}

const RECOMMENDED: Record<string, { vendor: LlmVendor; primary: string; secondary?: string }> = {
  company:       { vendor: "google", primary: "gemini-2.5-flash", secondary: "gemini-2.0-flash" },
  property:      { vendor: "google", primary: "gemini-2.5-flash", secondary: "gemini-2.0-flash" },
  market:        { vendor: "google", primary: "gemini-2.5-flash", secondary: "gemini-2.0-flash" },
  premiumExport: { vendor: "google", primary: "gemini-2.5-pro" },
  aiUtility:     { vendor: "google", primary: "gemini-2.5-flash" },
  chatbot:       { vendor: "google", primary: "gemini-2.5-flash" },
};

const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    key: "company",
    configField: "companyLlm",
    label: "Management Company",
    icon: IconTarget,
    description: "LLM for researching management companies — ICP analysis, financial comparisons, and company intelligence.",
    tab: "research",
    supportsDual: true,
    stageLabel: { primary: "Stage 1 — Reasoning", secondary: "Stage 2 — Workhorse" },
    recommended: RECOMMENDED.company,
  },
  {
    key: "property",
    configField: "propertyLlm",
    label: "Property",
    icon: IconProperties,
    description: "LLM for property-level research — market benchmarks, RevPAR comparisons, and location analysis.",
    tab: "research",
    supportsDual: true,
    stageLabel: { primary: "Stage 1 — Reasoning", secondary: "Stage 2 — Workhorse" },
    recommended: RECOMMENDED.property,
  },
  {
    key: "market",
    configField: "marketLlm",
    label: "Market & Industry",
    icon: IconTrendingUp,
    description: "LLM for broad market intelligence — macro trends, hospitality sector analysis, and competitive landscape.",
    tab: "research",
    supportsDual: true,
    stageLabel: { primary: "Stage 1 — Reasoning", secondary: "Stage 2 — Workhorse" },
    recommended: RECOMMENDED.market,
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
    label: "Rebecca",
    icon: IconMessageCircle,
    description: "LLM powering Rebecca — the conversational AI assistant for portfolio intelligence and property insights.",
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
    subtitle: "Two-stage cascading pipeline per domain. Stage 1 is the frontier reasoning model; Stage 2 is a faster workhorse. Select Dual to enable both.",
  },
  operations: {
    title: "Operations LLMs",
    subtitle: "Models for content writing and general AI utility tasks.",
  },
  assistants: {
    title: "AI Assistants",
    subtitle: "One model per assistant. Configure the vendor and model for each conversational AI.",
  },
  exports: {
    title: "Export LLMs",
    subtitle: "Model for premium-formatted financial documents — XLSX, PPTX, PDF, and DOCX.",
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

function VendorSelect({
  value,
  onValueChange,
  vendors,
  recommendedVendor,
  testId,
}: {
  value: string;
  onValueChange: (v: string) => void;
  vendors: { value: LlmVendor; label: string }[];
  recommendedVendor?: LlmVendor;
  testId: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-card h-9" data-testid={testId}>
        <SelectValue placeholder="Select vendor" />
      </SelectTrigger>
      <SelectContent>
        {vendors.map((v) => (
          <SelectItem key={v.value} value={v.value}>
            <span className="flex items-center gap-2">
              {v.label}
              {recommendedVendor === v.value && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  <IconStar className="w-3 h-3" />
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface TabDefault {
  llmVendor?: LlmVendor;
  primaryLlm?: string;
}

function TabDefaultsSection({
  tabKey,
  defaults,
  onChange,
  models,
  vendors,
}: {
  tabKey: TabKey;
  defaults: TabDefault;
  onChange: (d: TabDefault) => void;
  models: AiModelEntry[];
  vendors: { value: LlmVendor; label: string }[];
}) {
  const vendor = defaults.llmVendor;
  const vendorModels = vendor ? models.filter((m) => m.provider === vendor) : [];
  const model = defaults.primaryLlm || "";

  return (
    <div className="mb-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3" data-testid={`section-tab-defaults-${tabKey}`}>
      <div className="flex items-center gap-2 mb-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tab Default</Label>
        <InfoTooltip text="Default vendor and model applied to all cards in this tab that don't have their own selection." />
      </div>
      <div className="grid gap-4 grid-cols-3">
        <div>
          <Label className="text-xs font-medium mb-1.5 block">Default Vendor</Label>
          <VendorSelect
            value={vendor || ""}
            onValueChange={(v) => onChange({ llmVendor: v as LlmVendor, primaryLlm: "" })}
            vendors={vendors}
            testId={`select-tab-default-vendor-${tabKey}`}
          />
        </div>
        <div>
          <Label className="text-xs font-medium mb-1.5 block">Default Model</Label>
          {vendor ? (
            <Select value={model} onValueChange={(v) => onChange({ ...defaults, primaryLlm: v })}>
              <SelectTrigger className="bg-card h-9" data-testid={`select-tab-default-model-${tabKey}`}>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {model && !vendorModels.some((m) => m.id === model) && (
                  <SelectItem value={model}>{model} (current)</SelectItem>
                )}
                {vendorModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select disabled><SelectTrigger className="bg-card h-9 opacity-50"><SelectValue placeholder="Select vendor first" /></SelectTrigger></Select>
          )}
        </div>
        <div />
      </div>
    </div>
  );
}

function LlmDomainCard({
  domain,
  config,
  tabDefault,
  onChange,
  models,
  vendors,
}: {
  domain: DomainConfig;
  config: ContextLlmConfig;
  tabDefault?: TabDefault;
  onChange: (c: ContextLlmConfig) => void;
  models: AiModelEntry[];
  vendors: { value: LlmVendor; label: string }[];
}) {
  const DomainIcon = domain.icon;
  const mode: LlmMode | undefined = config.llmMode;
  const vendor: LlmVendor | undefined = config.llmVendor;
  const isDual = mode === "dual" && domain.supportsDual;
  const effectiveVendor = vendor || tabDefault?.llmVendor;
  const vendorModels = effectiveVendor ? models.filter((m) => m.provider === effectiveVendor) : [];
  const primaryModel = config.primaryLlm || "";
  const effectiveModel = primaryModel || (vendor ? "" : tabDefault?.primaryLlm || "");
  const isInheritingVendor = !vendor && !!tabDefault?.llmVendor;
  const isInheritingModel = !primaryModel && !vendor && !!tabDefault?.primaryLlm;
  const secondaryModel = config.secondaryLlm || "";
  const secondaryVendor: LlmVendor | undefined = config.secondaryLlmVendor || vendor;
  const secondaryVendorModels = secondaryVendor ? models.filter((m) => m.provider === secondaryVendor) : [];

  const primaryLabel = domain.stageLabel?.primary || "Model";
  const secondaryLabel = domain.stageLabel?.secondary || "Secondary Model";

  const recPrimary = (effectiveVendor && domain.recommended?.vendor === effectiveVendor) ? domain.recommended.primary : undefined;
  const recSecondary = (secondaryVendor && domain.recommended?.vendor === secondaryVendor) ? domain.recommended.secondary : undefined;

  const update = (patch: Partial<ContextLlmConfig>) => {
    onChange({ ...config, ...patch });
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <CardTitle className="flex items-center gap-2 text-sm font-display" data-testid={`text-llm-title-${domain.key}`}>
            <DomainIcon className="w-4 h-4 text-primary shrink-0" />
            {domain.label}
            <InfoTooltip text={domain.description} />
          </CardTitle>
          {(primaryModel || isInheritingModel) && (
            <Badge variant="outline" className={`text-[10px] font-normal shrink-0 hidden sm:inline-flex ${isInheritingModel ? "border-dashed text-muted-foreground" : ""}`}>
              {primaryModel || effectiveModel}{isInheritingModel ? " (default)" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {domain.supportsDual ? (
          <div className="space-y-3">
            <div className="grid gap-4 grid-cols-3">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Vendor</Label>
                <VendorSelect
                  value={vendor || ""}
                  onValueChange={(value) => update({ llmVendor: value as LlmVendor, primaryLlm: "" })}
                  vendors={vendors}
                  recommendedVendor={domain.recommended?.vendor}
                  testId={`select-llm-vendor-${domain.key}`}
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">{primaryLabel}{isInheritingVendor ? " (using default)" : ""}</Label>
                {effectiveVendor ? (
                  <ModelSelectWithRecommendation
                    value={primaryModel}
                    onValueChange={(value) => update({ primaryLlm: value, llmVendor: effectiveVendor })}
                    vendorModels={vendorModels}
                    recommendedId={recPrimary}
                    testId={`select-primary-llm-${domain.key}`}
                  />
                ) : (
                  <Select disabled><SelectTrigger className="bg-card h-9 opacity-50"><SelectValue placeholder="Select vendor first" /></SelectTrigger></Select>
                )}
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Mode</Label>
                <RadioGroup
                  value={mode || ""}
                  onValueChange={(value) => {
                    const newMode = value as LlmMode;
                    if (newMode === "primary-only") {
                      update({ llmMode: newMode, secondaryLlm: "", secondaryLlmVendor: undefined });
                    } else {
                      update({ llmMode: newMode, secondaryLlmVendor: config.secondaryLlmVendor || vendor });
                    }
                  }}
                  className="flex gap-3 h-9 items-center"
                  data-testid={`radio-llm-mode-${domain.key}`}
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="dual" id={`mode-dual-${domain.key}`} data-testid={`radio-mode-dual-${domain.key}`} />
                    <Label htmlFor={`mode-dual-${domain.key}`} className="text-xs font-normal cursor-pointer">Dual</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="primary-only" id={`mode-primary-${domain.key}`} data-testid={`radio-mode-primary-${domain.key}`} />
                    <Label htmlFor={`mode-primary-${domain.key}`} className="text-xs font-normal cursor-pointer">Single</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {isDual && (
              <div className="grid gap-4 grid-cols-3">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Stage 2 Vendor</Label>
                  <VendorSelect
                    value={secondaryVendor || ""}
                    onValueChange={(value) => update({ secondaryLlmVendor: value as LlmVendor, secondaryLlm: "" })}
                    vendors={vendors}
                    recommendedVendor={domain.recommended?.vendor}
                    testId={`select-llm-secondary-vendor-${domain.key}`}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">{secondaryLabel}</Label>
                  <ModelSelectWithRecommendation
                    value={secondaryModel}
                    onValueChange={(value) => update({ secondaryLlm: value })}
                    vendorModels={secondaryVendorModels}
                    recommendedId={recSecondary}
                    testId={`select-secondary-llm-${domain.key}`}
                  />
                </div>
                <div />
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-3">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Vendor{isInheritingVendor ? " (using default)" : ""}</Label>
              <VendorSelect
                value={vendor || ""}
                onValueChange={(value) => update({ llmVendor: value as LlmVendor, primaryLlm: "", llmMode: "primary-only" })}
                vendors={vendors}
                recommendedVendor={domain.recommended?.vendor}
                testId={`select-llm-vendor-${domain.key}`}
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">{primaryLabel}{isInheritingModel ? " (using default)" : ""}</Label>
              {effectiveVendor ? (
                <ModelSelectWithRecommendation
                  value={primaryModel}
                  onValueChange={(value) => update({ primaryLlm: value, llmVendor: effectiveVendor, llmMode: "primary-only" })}
                  vendorModels={vendorModels}
                  recommendedId={recPrimary}
                  testId={`select-primary-llm-${domain.key}`}
                />
              ) : (
                <Select disabled><SelectTrigger className="bg-card h-9 opacity-50"><SelectValue placeholder="Select vendor first" /></SelectTrigger></Select>
              )}
            </div>
            <div />
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
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <IconBrain className="w-3.5 h-3.5" />
          {draft.cachedModelsAt ? (
            <span>Models refreshed {new Date(draft.cachedModelsAt).toLocaleDateString()}</span>
          ) : (
            <span>Using default model list</span>
          )}
        </div>
        <Button
          variant="outline" size="sm" className="gap-1.5 shrink-0 h-8 text-xs"
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
        <div className="mb-4">
          <h3 className="text-sm font-display font-semibold text-foreground" data-testid={`text-tab-title-${activeTab}`}>
            {meta.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-tab-subtitle-${activeTab}`}>
            {meta.subtitle}
          </p>
        </div>

        <TabDefaultsSection
          tabKey={activeTab as TabKey}
          defaults={draft.tabDefaults?.[activeTab] || {}}
          onChange={(d) => {
            setDraft((prev) => ({
              ...prev,
              tabDefaults: { ...prev.tabDefaults, [activeTab]: d },
            }));
            setIsDirty(true);
          }}
          models={models}
          vendors={tabDomains[0]?.useAllVendors ? LLM_VENDORS : RESEARCH_LLM_VENDORS}
        />

        <div className="space-y-3">
          {tabDomains.map((domain) => (
            <LlmDomainCard
              key={domain.key}
              domain={domain}
              config={draft[domain.configField] || {}}
              tabDefault={draft.tabDefaults?.[domain.tab]}
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
