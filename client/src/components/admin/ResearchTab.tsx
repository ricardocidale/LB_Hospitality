/**
 * ResearchTab.tsx — Admin configuration for AI research events.
 *
 * Per-event control over the three research types (property / company / global):
 *   - Enable / disable the research type
 *   - Focus areas injected as bulleted guidance into the prompt
 *   - Geographic regions scope
 *   - Investment time horizon
 *   - Custom instructions appended to the system prompt
 *   - Custom questions the LLM must address
 *   - Which of the 9 deterministic tools are active (empty = all)
 */
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, Save, FlaskConical, Building2, Globe, MapPin, Plus, X } from "lucide-react";
import { useResearchConfig, useSaveResearchConfig } from "@/lib/api/admin";
import type { ResearchConfig, ResearchEventConfig } from "@shared/schema";

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

// ─── Tag Input ───────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={add} className="h-8 px-2">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
              {tag}
              <button
                type="button"
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

// ─── Event Config Section ────────────────────────────────────────────────────

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
  const Icon = meta.icon;

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
      {/* Enable toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable {meta.label}</Label>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(v) => patch({ enabled: v })}
        />
      </div>

      {config.enabled && (
        <>
          {/* Focus Areas */}
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
            />
          </div>

          {/* Regions */}
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
            />
          </div>

          {/* Time Horizon */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Investment Horizon</Label>
            <Select value={config.timeHorizon ?? "10-year"} onValueChange={(v) => patch({ timeHorizon: v })}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_HORIZONS.map((h) => (
                  <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Instructions</Label>
            <p className="text-xs text-muted-foreground">
              Appended to the system prompt as additional context.
            </p>
            <Textarea
              value={config.customInstructions ?? ""}
              onChange={(e) => patch({ customInstructions: e.target.value })}
              placeholder="e.g. Prioritize markets with strong corporate retreat demand..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Custom Questions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Questions</Label>
            <p className="text-xs text-muted-foreground">
              Specific questions the LLM must address in its research output.
            </p>
            <Textarea
              value={config.customQuestions ?? ""}
              onChange={(e) => patch({ customQuestions: e.target.value })}
              placeholder="e.g. What is the impact of remote work trends on corporate retreat demand?"
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Deterministic Tools */}
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
                        checked={isChecked}
                        onCheckedChange={(v) => {
                          if (allToolsEnabled) {
                            // First selection: enable all except unchecked
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

// ─── Main Tab ────────────────────────────────────────────────────────────────

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
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const types: ResearchType[] = ["property", "company", "global"];

  return (
    <div className="space-y-5">
      {/* Header card */}
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-display">Research Configuration</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Control AI research behavior per event type — tools, focus, context, and questions
                </p>
              </div>
            </div>
            <Button
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

      {/* Per-event accordions */}
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
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="text-left">
                        <span className="text-sm font-medium">{meta.label}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant={config.enabled ? "default" : "secondary"}
                            className="text-[10px] h-4 px-1.5"
                          >
                            {config.enabled ? "enabled" : "disabled"}
                          </Badge>
                          {(config.focusAreas ?? []).length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {config.focusAreas!.length} focus area{config.focusAreas!.length > 1 ? "s" : ""}
                            </span>
                          )}
                          {(config.enabledTools ?? []).length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
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
    </div>
  );
}
