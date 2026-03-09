import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { 
  IconBookOpen, IconBrain, IconExternalLink, IconGlobe, IconLoader, IconMapPin, IconPlus, IconProperties, IconRefresh, IconResearch, IconSave, IconX } from "@/components/icons/brand-icons";

import { useResearchConfig, useSaveResearchConfig, useRefreshAiModels } from "@/lib/api/admin";
import type { ResearchConfig, ResearchEventConfig, AiModelEntry } from "@shared/schema";
import { RESEARCH_SOURCES } from "@shared/constants";

const TIME_HORIZONS = [
  { value: "5-year",  label: "5-year" },
  { value: "7-year",  label: "7-year" },
  { value: "10-year", label: "10-year" },
  { value: "15-year", label: "15-year" },
];

const DETERMINISTIC_TOOLS = [
  { name: "compute_property_metrics",    description: "RevPAR, room revenue, GOP, NOI margin" },
  { name: "compute_depreciation_basis",  description: "IRS depreciation basis allocation" },
  { name: "compute_debt_capacity",       description: "Debt yield and loan sizing" },
  { name: "compute_occupancy_ramp",      description: "Occupancy ramp modeling" },
  { name: "compute_adr_projection",      description: "ADR growth projections" },
  { name: "compute_cap_rate_valuation",  description: "Exit cap rate valuation" },
  { name: "compute_cost_benchmarks",     description: "USALI cost rate benchmarks" },
  { name: "compute_service_fee",         description: "Service fee calculations" },
  { name: "compute_markup_waterfall",    description: "Markup waterfall" },
];

type ResearchType = "property" | "company" | "global";

const EVENT_META: Record<ResearchType, { label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  property: { label: "Property Research",   icon: IconProperties,    description: "Per-property market analysis triggered from property pages" },
  company:  { label: "Company Research",    icon: IconResearch, description: "Management company fee structures and industry benchmarks" },
  global:   { label: "Global Research",     icon: IconGlobe,        description: "Industry-wide trends, market conditions, and investment outlook" },
};

const DEFAULT_EVENT_CONFIG: ResearchEventConfig = {
  enabled: true,
  focusAreas: [],
  regions: [],
  timeHorizon: "10-year",
  customInstructions: "",
  customQuestions: "",
  enabledTools: [],
};

function mergeConfig(saved: Partial<ResearchEventConfig> | undefined): ResearchEventConfig {
  return { ...DEFAULT_EVENT_CONFIG, ...saved };
}

function TagInput({
  tags,
  onChange,
  placeholder,
  testIdPrefix,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  testIdPrefix: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          data-testid={`input-${testIdPrefix}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
        <Button data-testid={`button-add-${testIdPrefix}`} type="button" size="sm" variant="outline" onClick={add} className="h-8 px-2">
          <IconPlus className="w-3.5 h-3.5" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1" data-testid={`badge-${testIdPrefix}-${tag}`}>
              {tag}
              <button
                type="button"
                data-testid={`button-remove-${testIdPrefix}-${tag}`}
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="hover:text-destructive transition-colors"
              >
                <IconX className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function EventConfigSection({
  type,
  config,
  onChange,
}: {
  type: ResearchType;
  config: ResearchEventConfig;
  onChange: (updated: ResearchEventConfig) => void;
}) {
  const meta = EVENT_META[type];

  function patch(partial: Partial<ResearchEventConfig>) {
    onChange({ ...config, ...partial });
  }

  function toggleTool(toolName: string, checked: boolean) {
    const current = config.enabledTools ?? [];
    patch({
      enabledTools: checked
        ? [...current, toolName]
        : current.filter((t) => t !== toolName),
    });
  }

  const allToolsEnabled = (config.enabledTools ?? []).length === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable {meta.label}</Label>
          <p className="text-xs text-muted-foreground" data-testid={`text-description-${type}`}>{meta.description}</p>
        </div>
        <Switch
          data-testid={`switch-enable-${type}`}
          checked={config.enabled}
          onCheckedChange={(v) => patch({ enabled: v })}
        />
      </div>

      {config.enabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Investment Horizon</Label>
              <Select value={config.timeHorizon ?? "10-year"} onValueChange={(v) => patch({ timeHorizon: v })}>
                <SelectTrigger data-testid={`select-horizon-${type}`} className="w-full h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_HORIZONS.map((h) => (
                    <SelectItem key={h.value} value={h.value} data-testid={`option-horizon-${type}-${h.value}`}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                Refresh Interval (Days)
                <HelpTooltip text="How many days before research results are considered stale and eligible for automatic refresh." />
              </Label>
              <Input
                type="number"
                min={3}
                max={14}
                value={config.refreshIntervalDays ?? 7}
                onChange={(e) => patch({ refreshIntervalDays: parseInt(e.target.value) || 7 })}
                className="h-8 text-sm"
                data-testid={`input-refresh-interval-${type}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <IconResearch className="w-3.5 h-3.5 text-muted-foreground" />
              Focus Areas
            </Label>
            <p className="text-xs text-muted-foreground">
              Injected as bulleted guidance into the research prompt. Leave empty for defaults.
            </p>
            <TagInput
              tags={config.focusAreas ?? []}
              onChange={(v) => patch({ focusAreas: v })}
              placeholder="Add focus area (press Enter)"
              testIdPrefix={`${type}-focus`}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <IconMapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Geographic Regions
            </Label>
            <p className="text-xs text-muted-foreground">
              Restricts market research to these regions. Leave empty for default scope.
            </p>
            <TagInput
              tags={config.regions ?? []}
              onChange={(v) => patch({ regions: v })}
              placeholder="Add region (press Enter)"
              testIdPrefix={`${type}-region`}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Instructions</Label>
            <p className="text-xs text-muted-foreground">
              Appended to the system prompt as additional context.
            </p>
            <Textarea
              data-testid={`textarea-instructions-${type}`}
              value={config.customInstructions ?? ""}
              onChange={(e) => patch({ customInstructions: e.target.value })}
              placeholder="e.g. Prioritize markets with strong corporate retreat demand..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Questions</Label>
            <p className="text-xs text-muted-foreground">
              Specific questions the LLM must address in its research output.
            </p>
            <Textarea
              data-testid={`textarea-questions-${type}`}
              value={config.customQuestions ?? ""}
              onChange={(e) => patch({ customQuestions: e.target.value })}
              placeholder="e.g. What is the impact of remote work trends on corporate retreat demand?"
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {type === "property" && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Deterministic Tools</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select which calculation tools the LLM can call. Uncheck all = all tools enabled.
                </p>
              </div>
              <div className="space-y-2">
                {DETERMINISTIC_TOOLS.map((tool) => {
                  const isChecked = allToolsEnabled || (config.enabledTools ?? []).includes(tool.name);
                  return (
                    <div key={tool.name} className="flex items-start gap-2.5">
                      <Checkbox
                        id={`${type}-${tool.name}`}
                        data-testid={`checkbox-tool-${tool.name}`}
                        checked={isChecked}
                        onCheckedChange={(v) => {
                          if (allToolsEnabled) {
                            const allNames = DETERMINISTIC_TOOLS.map((t) => t.name);
                            patch({ enabledTools: v ? allNames : allNames.filter((n) => n !== tool.name) });
                          } else {
                            toggleTool(tool.name, !!v);
                          }
                        }}
                        className="mt-0.5"
                      />
                      <label htmlFor={`${type}-${tool.name}`} className="text-sm cursor-pointer leading-tight">
                        <span className="font-mono text-xs text-muted-foreground">{tool.name}</span>
                        <span className="text-muted-foreground"> — </span>
                        {tool.description}
                      </label>
                    </div>
                  );
                })}
              </div>
              {!allToolsEnabled && (
                <Button
                  data-testid="button-reset-tools"
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => patch({ enabledTools: [] })}
                >
                  Reset to all tools enabled
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SourcesSection({
  customSources,
  onChange,
}: {
  customSources: { name: string; url?: string; category: string }[];
  onChange: (sources: { name: string; url?: string; category: string }[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("Hospitality");

  function add() {
    if (newName.trim() && newCategory.trim()) {
      onChange([...customSources, { name: newName.trim(), url: newUrl.trim() || undefined, category: newCategory.trim() }]);
      setNewName("");
      setNewUrl("");
    }
  }

  function remove(index: number) {
    onChange(customSources.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <IconBookOpen className="w-4 h-4 text-primary" />
          System Curated Sources
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {RESEARCH_SOURCES.map((source) => (
            <div key={source.name} className="flex flex-col p-3 rounded-xl border border-border/50 bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{source.name}</span>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-4">{source.category}</Badge>
              </div>
              {source.url && (
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                  {source.url.replace("https://", "")}
                  <IconExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <IconPlus className="w-4 h-4 text-primary" />
          Custom Research Sources
        </Label>
        
        <div className="flex flex-wrap gap-3 items-end p-4 rounded-xl border border-dashed border-primary/20 bg-primary/5">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Source Name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Local Planning Dept" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">URL (Optional)</Label>
            <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5 w-32">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Category</Label>
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hospitality">Hospitality</SelectItem>
                <SelectItem value="Economics">Economics</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Regulatory">Regulatory</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add} size="sm" className="h-8 px-4" disabled={!newName.trim()}>
            Add Source
          </Button>
        </div>

        {customSources.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customSources.map((source, idx) => (
              <div key={`${source.name}-${idx}`} className="flex flex-col p-3 rounded-xl border border-primary/20 bg-white relative group">
                <button
                  onClick={() => remove(idx)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <IconX className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{source.name}</span>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider h-4">{source.category}</Badge>
                </div>
                {source.url && (
                  <span className="text-[10px] text-muted-foreground truncate pr-6">{source.url}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const FALLBACK_MODELS: AiModelEntry[] = [
  { id: "claude-opus-4-6", label: "Anthropic Claude Opus 4.6", provider: "anthropic" },
  { id: "claude-sonnet-4-6", label: "Anthropic Claude Sonnet 4.6", provider: "anthropic" },
  { id: "claude-sonnet-4-5", label: "Anthropic Claude Sonnet 4.5", provider: "anthropic" },
  { id: "claude-haiku-4-5", label: "Anthropic Claude Haiku 4.5", provider: "anthropic" },
  { id: "gpt-5.4", label: "OpenAI GPT 5.4", provider: "openai" },
  { id: "gpt-5.4-pro", label: "OpenAI GPT 5.4 Pro", provider: "openai" },
  { id: "o3-pro", label: "OpenAI o3 Pro", provider: "openai" },
  { id: "gemini-2.5-flash", label: "Google Gemini 2.5 Flash", provider: "google" },
];

export default function ResearchTab() {
  const { toast } = useToast();
  const { data: savedConfig, isLoading } = useResearchConfig();
  const saveMutation = useSaveResearchConfig();
  const refreshModels = useRefreshAiModels();

  const [draft, setDraft] = useState<ResearchConfig>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (savedConfig) {
      setDraft(savedConfig);
      setIsDirty(false);
    }
  }, [savedConfig]);

  function updateEvent(type: ResearchType, updated: ResearchEventConfig) {
    setDraft((prev) => ({ ...prev, [type]: updated }));
    setIsDirty(true);
  }

  async function handleSave() {
    try {
      await saveMutation.mutateAsync(draft);
      setIsDirty(false);
      toast({ title: "Research configuration saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" data-testid="status-loading">
        <IconLoader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const types: ResearchType[] = ["property", "company", "global"];

  return (
    <div className="space-y-5" data-testid="research-config-tab">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconResearch className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-display" data-testid="text-research-title">Research Configuration</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Control AI research behavior per event type — tools, focus, context, and questions
                </p>
              </div>
            </div>
            <Button
              data-testid="button-save-research"
              onClick={handleSave}
              disabled={!isDirty || saveMutation.isPending}
              size="sm"
              className="gap-2"
            >
              {saveMutation.isPending ? <IconLoader className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
              Save
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <IconBrain className="w-5 h-5 text-primary" />
                AI Research Model
                <HelpTooltip text="Choose which AI model powers the market research feature. Use Refresh Models to pull the latest available models from OpenAI, Anthropic, and Google." />
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Select the AI model used for generating market research reports.
                {draft.cachedModelsAt && (
                  <span className="text-muted-foreground ml-1">
                    Models last refreshed {new Date(draft.cachedModelsAt).toLocaleDateString()}.
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              data-testid="button-refresh-models"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={refreshModels.isPending}
              onClick={async () => {
                try {
                  const result = await refreshModels.mutateAsync();
                  setDraft(prev => ({
                    ...prev,
                    cachedModels: result.models,
                    cachedModelsAt: result.fetchedAt,
                  }));
                  toast({ title: `Loaded ${result.models.length} models from providers` });
                } catch {
                  toast({ title: "Failed to refresh models", variant: "destructive" });
                }
              }}
            >
              {refreshModels.isPending ? <IconLoader className="w-3.5 h-3.5 animate-spin" /> : <IconRefresh className="w-3.5 h-3.5" />}
              Refresh Models
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label className="text-sm font-medium flex items-center gap-1">Preferred Model <HelpTooltip text="The AI model used for generating market research. Each model has different strengths for analysis." /></Label>
            {(() => {
              const models = (draft.cachedModels && draft.cachedModels.length > 0) ? draft.cachedModels : FALLBACK_MODELS;
              const grouped = {
                anthropic: models.filter(m => m.provider === "anthropic"),
                openai: models.filter(m => m.provider === "openai"),
                google: models.filter(m => m.provider === "google"),
              };

              return (
                <Select
                  value={draft.preferredModelId || ""}
                  onValueChange={(v) => { setDraft(prev => ({ ...prev, preferredModelId: v })); setIsDirty(true); }}
                >
                  <SelectTrigger data-testid="select-research-model" className="bg-card">
                    <SelectValue placeholder="Select an AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(grouped).map(([provider, providerModels]) => (
                      providerModels.length > 0 && (
                        <div key={provider}>
                          <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground bg-muted/30">{provider}</div>
                          {providerModels.map(m => (
                            <SelectItem key={m.id} value={m.id} data-testid={`option-model-${m.id}`}>{m.label}</SelectItem>
                          ))}
                        </div>
                      )
                    ))}
                  </SelectContent>
                </Select>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="property" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-10 p-1 bg-muted/50 border border-border/50">
          {types.map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs gap-2" data-testid={`tab-research-${t}`}>
              {(() => {
                const Icon = EVENT_META[t].icon;
                return <Icon className="w-3.5 h-3.5" />;
              })()}
              {EVENT_META[t].label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="sources" className="text-xs gap-2" data-testid="tab-research-sources">
            <IconBookOpen className="w-3.5 h-3.5" />
            Research Sources
          </TabsTrigger>
        </TabsList>

        {types.map((t) => (
          <TabsContent key={t} value={t} className="mt-4 focus-visible:outline-none">
            <Card className="border-border shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <EventConfigSection
                  type={t}
                  config={mergeConfig(draft[t])}
                  onChange={(updated) => updateEvent(t, updated)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="sources" className="mt-4 focus-visible:outline-none">
          <Card className="border-border shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <SourcesSection
                customSources={draft.customSources ?? []}
                onChange={(v) => { setDraft(prev => ({ ...prev, customSources: v })); setIsDirty(true); }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
