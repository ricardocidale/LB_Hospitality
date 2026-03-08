import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Loader2, Save, FlaskConical, Building2, Globe, MapPin, Plus, X, Brain, ExternalLink, Library } from "lucide-react";
import { useResearchConfig, useSaveResearchConfig } from "@/lib/api/admin";
import type { ResearchConfig, ResearchEventConfig } from "@shared/schema";
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
  property: { label: "Property Research",   icon: Building2,    description: "Per-property market analysis triggered from property pages" },
  company:  { label: "Company Research",    icon: FlaskConical, description: "Management company fee structures and industry benchmarks" },
  global:   { label: "Global Research",     icon: Globe,        description: "Industry-wide trends, market conditions, and investment outlook" },
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
          <Plus className="w-3.5 h-3.5" />
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
                <X className="w-3 h-3" />
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
              <FlaskConical className="w-3.5 h-3.5 text-muted-foreground" />
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
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
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
          <Library className="w-4 h-4 text-primary" />
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
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
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
                  <X className="w-3.5 h-3.5" />
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

export default function ResearchTab() {
  const { toast } = useToast();
  const { data: savedConfig, isLoading } = useResearchConfig();
  const saveMutation = useSaveResearchConfig();

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
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
                <FlaskConical className="w-5 h-5 text-primary" />
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
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Brain className="w-5 h-5 text-primary" />
            AI Research Model
            <HelpTooltip text="Choose which AI model powers the market research feature. Different models have different strengths — OpenAI GPT models are great for structured data, Claude excels at reasoning, and Gemini offers fast analysis." />
          </CardTitle>
          <CardDescription className="text-xs">Select the AI model used for generating market research reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-sm">
            <Label className="text-sm font-medium flex items-center gap-1">Preferred Model <HelpTooltip text="The AI model used for generating market research. Each model has different strengths for analysis." /></Label>
            <Select
              value={draft.preferredLlm || "gpt-4o"}
              onValueChange={(value) => {
                setDraft(prev => ({ ...prev, preferredLlm: value }));
                setIsDirty(true);
              }}
            >
              <SelectTrigger className="bg-card h-9" data-testid="select-preferred-llm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">OpenAI GPT-4o Mini</SelectItem>
                <SelectItem value="claude-sonnet-4-5">Claude Sonnet 4.5</SelectItem>
                <SelectItem value="claude-haiku-4-5">Claude Haiku 4.5</SelectItem>
                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20">
        <CardContent className="pt-5">
          <Accordion type="multiple" className="space-y-2">
            {types.map((type) => {
              const meta = EVENT_META[type];
              const Icon = meta.icon;
              const config = mergeConfig(draft[type]);

              return (
                <AccordionItem
                  key={type}
                  value={type}
                  className="border border-border/60 rounded-xl px-4 data-[state=open]:border-primary/30"
                  data-testid={`accordion-${type}`}
                >
                  <AccordionTrigger className="py-3 hover:no-underline" data-testid={`trigger-${type}`}>
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="text-left">
                        <span className="text-sm font-medium">{meta.label}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant={config.enabled ? "default" : "secondary"}
                            className="text-[10px] h-4 px-1.5"
                            data-testid={`badge-status-${type}`}
                          >
                            {config.enabled ? "enabled" : "disabled"}
                          </Badge>
                          {(config.focusAreas ?? []).length > 0 && (
                            <span className="text-[10px] text-muted-foreground" data-testid={`text-focus-count-${type}`}>
                              {config.focusAreas!.length} focus area{config.focusAreas!.length > 1 ? "s" : ""}
                            </span>
                          )}
                          {(config.enabledTools ?? []).length > 0 && (
                            <span className="text-[10px] text-muted-foreground" data-testid={`text-tools-count-${type}`}>
                              {config.enabledTools!.length}/{DETERMINISTIC_TOOLS.length} tools
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-1">
                    <EventConfigSection
                      type={type}
                      config={config}
                      onChange={(updated) => updateEvent(type, updated)}
                    />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Library className="w-5 h-5 text-primary" />
            Curated Source Registry
          </CardTitle>
          <CardDescription className="text-xs">
            Manage the list of trusted data sources used by the AI research engine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SourcesSection
            customSources={draft.customSources ?? []}
            onChange={(v) => {
              setDraft(prev => ({ ...prev, customSources: v }));
              setIsDirty(true);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
