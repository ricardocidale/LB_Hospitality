import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconBrain, IconRefreshCw, IconTarget, IconProperties, IconTrendingUp, IconFileText, IconMessageCircle } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useResearchConfig, useSaveResearchConfig, useRefreshAiModels } from "@/lib/api/admin";
import type { ResearchConfig, ContextLlmConfig, LlmMode, LlmVendor, AiModelEntry } from "@shared/schema";
import { FALLBACK_MODELS, RESEARCH_LLM_VENDORS, LLM_VENDORS, normalizeResearchConfig } from "./research-center/research-shared";
import type { AdminSaveState } from "./types/save-state";

interface LLMsTabProps {
  onSaveStateChange?: (state: AdminSaveState | null) => void;
}

function LlmDomainCard({
  domainKey,
  domainLabel,
  domainIcon: DomainIcon,
  description,
  config,
  onChange,
  models,
  vendors,
  onRefreshModels,
  isRefreshing,
}: {
  domainKey: string;
  domainLabel: string;
  domainIcon: React.ComponentType<{ className?: string }>;
  description: string;
  config: ContextLlmConfig;
  onChange: (c: ContextLlmConfig) => void;
  models: AiModelEntry[];
  vendors: { value: LlmVendor; label: string }[];
  onRefreshModels: () => void;
  isRefreshing: boolean;
}) {
  const mode: LlmMode | undefined = config.llmMode;
  const vendor: LlmVendor | undefined = config.llmVendor;
  const isDual = mode === "dual";
  const vendorModels = vendor ? models.filter((m) => m.provider === vendor) : [];
  const primaryModel = config.primaryLlm || "";
  const secondaryModel = config.secondaryLlm || "";

  const update = (patch: Partial<ContextLlmConfig>) => {
    onChange({ ...config, ...patch });
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-display" data-testid={`text-llm-title-${domainKey}`}>
              <DomainIcon className="w-4 h-4 text-primary" />
              {domainLabel}
              <InfoTooltip text={description} />
            </CardTitle>
          </div>
          <Button
            variant="outline" size="sm" className="gap-1.5"
            disabled={isRefreshing}
            data-testid={`button-refresh-models-${domainKey}`}
            onClick={onRefreshModels}
          >
            {isRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconRefreshCw className="w-3.5 h-3.5" />}
            Refresh Models
          </Button>
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
              <SelectTrigger className="bg-card h-9" data-testid={`select-llm-vendor-${domainKey}`}>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
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
              data-testid={`radio-llm-mode-${domainKey}`}
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="dual" id={`mode-dual-${domainKey}`} data-testid={`radio-mode-dual-${domainKey}`} />
                <Label htmlFor={`mode-dual-${domainKey}`} className="text-xs font-normal cursor-pointer">Dual</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="primary-only" id={`mode-primary-${domainKey}`} data-testid={`radio-mode-primary-${domainKey}`} />
                <Label htmlFor={`mode-primary-${domainKey}`} className="text-xs font-normal cursor-pointer">Primary only</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {vendor && mode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Primary LLM</Label>
              <Select value={primaryModel} onValueChange={(value) => update({ primaryLlm: value })}>
                <SelectTrigger className="bg-card h-9" data-testid={`select-primary-llm-${domainKey}`}>
                  <SelectValue placeholder={vendorModels.length === 0 ? "No models" : "Select model"} />
                </SelectTrigger>
                <SelectContent>
                  {primaryModel && !vendorModels.some((m) => m.id === primaryModel) && (
                    <SelectItem value={primaryModel}>{primaryModel} (current)</SelectItem>
                  )}
                  {vendorModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isDual && (
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Secondary LLM</Label>
                <Select value={secondaryModel} onValueChange={(value) => update({ secondaryLlm: value })}>
                  <SelectTrigger className="bg-card h-9" data-testid={`select-secondary-llm-${domainKey}`}>
                    <SelectValue placeholder={vendorModels.length === 0 ? "No models" : "Select model"} />
                  </SelectTrigger>
                  <SelectContent>
                    {secondaryModel && !vendorModels.some((m) => m.id === secondaryModel) && (
                      <SelectItem value={secondaryModel}>{secondaryModel} (current)</SelectItem>
                    )}
                    {vendorModels.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const DOMAIN_CONFIGS: {
  key: string;
  configField: "companyLlm" | "propertyLlm" | "marketLlm" | "reportLlm" | "chatbotLlm";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  useAllVendors?: boolean;
  group: "research" | "operations";
}[] = [
  {
    key: "company",
    configField: "companyLlm",
    label: "Management Company Research",
    icon: IconTarget,
    description: "LLM for researching management companies — ICP analysis, financial comparisons, and company intelligence.",
    group: "research",
  },
  {
    key: "property",
    configField: "propertyLlm",
    label: "Property Research",
    icon: IconProperties,
    description: "LLM for property-level research — market benchmarks, RevPAR comparisons, and location analysis.",
    group: "research",
  },
  {
    key: "market",
    configField: "marketLlm",
    label: "General Marketing Research",
    icon: IconTrendingUp,
    description: "LLM for broad market intelligence — macro trends, hospitality sector analysis, and competitive landscape.",
    group: "research",
  },
  {
    key: "report",
    configField: "reportLlm",
    label: "Report Generation",
    icon: IconFileText,
    description: "LLM used for generating PDF reports, executive summaries, and investment memos.",
    useAllVendors: true,
    group: "operations",
  },
  {
    key: "chatbot",
    configField: "chatbotLlm",
    label: "Chatbot (Rebecca)",
    icon: IconMessageCircle,
    description: "LLM powering Rebecca and other conversational AI assistants.",
    useAllVendors: true,
    group: "operations",
  },
];

export default function LLMsTab({ onSaveStateChange }: LLMsTabProps) {
  const { toast } = useToast();
  const { data: savedConfig, isLoading } = useResearchConfig();
  const saveMutation = useSaveResearchConfig();
  const refreshModels = useRefreshAiModels();

  const [draft, setDraft] = useState<ResearchConfig>({});
  const [isDirty, setIsDirty] = useState(false);
  const [initialized, setInitialized] = useState(false);

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
      onSave: () => {
        saveMutation.mutate(draft, {
          onSuccess: () => {
            setIsDirty(false);
            toast({ title: "LLM configuration saved" });
          },
          onError: () => {
            toast({ title: "Failed to save", variant: "destructive" });
          },
        });
      },
    });
  }, [isDirty, saveMutation.isPending, draft, onSaveStateChange, saveMutation, toast]);

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

  const researchDomains = DOMAIN_CONFIGS.filter(d => d.group === "research");
  const opsDomains = DOMAIN_CONFIGS.filter(d => d.group === "operations");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconBrain className="w-4 h-4" />
          {draft.cachedModelsAt ? (
            <span>Models last refreshed {new Date(draft.cachedModelsAt).toLocaleDateString()}</span>
          ) : (
            <span>Using default model list</span>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-display font-semibold text-foreground mb-1">Research LLMs</h3>
        <p className="text-xs text-muted-foreground mb-4">Each research process uses a two-level LLM pipeline: a primary reasoning model and an optional secondary workhorse model.</p>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {researchDomains.map((domain) => (
            <LlmDomainCard
              key={domain.key}
              domainKey={domain.key}
              domainLabel={domain.label}
              domainIcon={domain.icon}
              description={domain.description}
              config={draft[domain.configField] || {}}
              onChange={(c) => {
                setDraft((prev) => ({ ...prev, [domain.configField]: c }));
                setIsDirty(true);
              }}
              models={models}
              vendors={domain.useAllVendors ? LLM_VENDORS : RESEARCH_LLM_VENDORS}
              onRefreshModels={handleRefreshModels}
              isRefreshing={refreshModels.isPending}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-display font-semibold text-foreground mb-1">Operations LLMs</h3>
        <p className="text-xs text-muted-foreground mb-4">LLMs used for report generation and conversational AI assistants.</p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {opsDomains.map((domain) => (
            <LlmDomainCard
              key={domain.key}
              domainKey={domain.key}
              domainLabel={domain.label}
              domainIcon={domain.icon}
              description={domain.description}
              config={draft[domain.configField] || {}}
              onChange={(c) => {
                setDraft((prev) => ({ ...prev, [domain.configField]: c }));
                setIsDirty(true);
              }}
              models={models}
              vendors={domain.useAllVendors ? LLM_VENDORS : RESEARCH_LLM_VENDORS}
              onRefreshModels={handleRefreshModels}
              isRefreshing={refreshModels.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
