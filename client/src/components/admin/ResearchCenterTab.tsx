import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Loader2, X } from "lucide-react";
import {
  IconSave, IconPlus, IconBrain, IconExternalLink, IconLibrary, IconRefreshCw,
  IconResearch, IconProperties, IconGlobe, IconMapPin, IconTarget,
  IconBuilding, IconTrendingUp, IconSettings, IconDollarSign,
} from "@/components/icons";
import { useResearchConfig, useSaveResearchConfig, useRefreshAiModels } from "@/lib/api/admin";
import type { ResearchConfig, ResearchEventConfig, AiModelEntry } from "@shared/schema";
import { RESEARCH_SOURCES } from "@shared/constants";

// ── Constants ──────────────────────────────────────────────────────────────

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

const EXPANDED_SOURCES = [
  { name: "STR (CoStar)", category: "Hospitality", url: "https://str.com" },
  { name: "PKF Hospitality Research", category: "Hospitality", url: "https://www.pkfhotels.com" },
  { name: "CBRE Hotels Research", category: "Hospitality", url: "https://www.cbre.com/industries/hotels" },
  { name: "HVS", category: "Hospitality", url: "https://hvs.com" },
  { name: "USALI 12th Edition", category: "Hospitality", url: undefined },
  { name: "Real Capital Analytics (MSCI)", category: "Investment", url: "https://www.msci.com/real-capital-analytics" },
  { name: "Preqin", category: "Investment", url: "https://www.preqin.com" },
  { name: "PitchBook", category: "Investment", url: "https://pitchbook.com" },
  { name: "Lodging Econometrics", category: "Investment", url: "https://lodgingeconometrics.com" },
  { name: "Trepp (CMBS)", category: "Investment", url: "https://www.trepp.com" },
  { name: "AHLA Investment Survey", category: "Investment", url: "https://www.ahla.com" },
  { name: "FRED (Federal Reserve)", category: "Economics", url: "https://fred.stlouisfed.org" },
  { name: "BLS", category: "Economics", url: "https://www.bls.gov" },
  { name: "TSA Throughput Data", category: "Economics", url: undefined },
  { name: "IRS Publication 946", category: "Regulatory", url: undefined },
  { name: "SBA 504 Program", category: "Regulatory", url: "https://www.sba.gov" },
];

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

const TIME_HORIZONS = [
  { value: "1-year", label: "1 Year" },
  { value: "3-year", label: "3 Years" },
  { value: "5-year", label: "5 Years" },
  { value: "10-year", label: "10 Years" },
];

const MACRO_INDICATORS = [
  "Interest Rates", "Inflation", "Labor Market", "Travel Demand", "Supply Pipeline",
];

const OPERATIONS_FOCUS = [
  "Fee Benchmarks", "Vendor Analysis", "Overhead Benchmarks", "Competitive Analysis",
];

const PERSONA_TYPES = [
  "Guest Personas", "Investor Profiles", "Lender Profiles", "Owner Profiles",
];

const ICP_DEPTHS = [
  { value: "full", label: "Full" },
  { value: "summary", label: "Summary" },
  { value: "none", label: "None" },
];

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

// ── Reusable Components ────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder, testIdPrefix }: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  testIdPrefix: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
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
            <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
              {tag}
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange(tags.filter((t) => t !== tag))} className="h-4 w-4 hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function DataInputsCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="bg-muted/30 border-border/50">
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="outline" className="text-[11px] font-normal">{item}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EnableToggle({ label, description, enabled, onChange }: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onChange} />
    </div>
  );
}

function CheckboxGroup({ items, selected, onChange }: {
  items: string[];
  selected: string[];
  onChange: (items: string[]) => void;
}) {
  function toggle(item: string, checked: boolean) {
    onChange(checked ? [...selected, item] : selected.filter((s) => s !== item));
  }
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2.5">
          <Checkbox
            id={`cb-${item}`}
            checked={selected.includes(item)}
            onCheckedChange={(v) => toggle(item, !!v)}
          />
          <label htmlFor={`cb-${item}`} className="text-sm cursor-pointer">{item}</label>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Property Research ─────────────────────────────────────────────────

function PropertyTab({ config, onChange }: { config: ResearchEventConfig; onChange: (c: ResearchEventConfig) => void }) {
  function patch(p: Partial<ResearchEventConfig>) { onChange({ ...config, ...p }); }
  const allToolsEnabled = (config.enabledTools ?? []).length === 0;

  function toggleTool(toolName: string, checked: boolean) {
    const current = config.enabledTools ?? [];
    patch({ enabledTools: checked ? [...current, toolName] : current.filter((t) => t !== toolName) });
  }

  return (
    <div className="space-y-5">
      <EnableToggle
        label="Property Research"
        description="Per-property market analysis triggered from property pages"
        enabled={config.enabled}
        onChange={(v) => patch({ enabled: v })}
      />
      {config.enabled && (
        <>
          <DataInputsCard title="Data Inputs" items={["Location", "Room Count", "ADR", "Acquisition Price", "ICP Context"]} />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Deterministic Tools</Label>
            <p className="text-xs text-muted-foreground">Select which calculation tools the LLM can call. Uncheck all = all tools enabled.</p>
            <div className="space-y-2">
              {DETERMINISTIC_TOOLS.map((tool) => {
                const isChecked = allToolsEnabled || (config.enabledTools ?? []).includes(tool.name);
                return (
                  <div key={tool.name} className="flex items-start gap-2.5">
                    <Checkbox
                      id={`prop-${tool.name}`}
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
                    <label htmlFor={`prop-${tool.name}`} className="text-sm cursor-pointer leading-tight">
                      <span className="font-mono text-xs text-muted-foreground">{tool.name}</span>
                      <span className="text-muted-foreground"> — </span>{tool.description}
                    </label>
                  </div>
                );
              })}
            </div>
            {!allToolsEnabled && (
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => patch({ enabledTools: [] })}>
                Reset to all tools enabled
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <IconResearch className="w-3.5 h-3.5 text-muted-foreground" />
              Focus Areas
            </Label>
            <TagInput tags={config.focusAreas ?? []} onChange={(v) => patch({ focusAreas: v })} placeholder="Add focus area (press Enter)" testIdPrefix="prop-focus" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <IconMapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Geographic Regions
            </Label>
            <TagInput tags={config.regions ?? []} onChange={(v) => patch({ regions: v })} placeholder="Add region (press Enter)" testIdPrefix="prop-region" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              Refresh Interval
              <HelpTooltip text="Days before research results are considered stale." />
            </Label>
            <Input
              type="number" min={3} max={14}
              value={config.refreshIntervalDays ?? 7}
              onChange={(e) => patch({ refreshIntervalDays: parseInt(e.target.value) || 7 })}
              className="h-8 text-sm max-w-[200px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Instructions</Label>
            <Textarea
              value={config.customInstructions ?? ""}
              onChange={(e) => patch({ customInstructions: e.target.value })}
              placeholder="e.g. Prioritize markets with strong corporate retreat demand..."
              rows={3} className="text-sm resize-none"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Operations Research ───────────────────────────────────────────────

function OperationsTab({ config, onChange }: { config: ResearchEventConfig; onChange: (c: ResearchEventConfig) => void }) {
  function patch(p: Partial<ResearchEventConfig>) { onChange({ ...config, ...p }); }

  return (
    <div className="space-y-5">
      <EnableToggle
        label="Operations Research"
        description="Management company fee structures, overhead, and industry benchmarks"
        enabled={config.enabled}
        onChange={(v) => patch({ enabled: v })}
      />
      {config.enabled && (
        <>
          <DataInputsCard title="Data Inputs" items={["Company Fee Structure", "Overhead Budget", "Vendor Contracts", "Staffing Data"]} />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Operational Focus Areas</Label>
            <p className="text-xs text-muted-foreground">Toggle which operational dimensions to include in research.</p>
            <CheckboxGroup
              items={OPERATIONS_FOCUS}
              selected={config.focusAreas ?? []}
              onChange={(v) => patch({ focusAreas: v })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Instructions</Label>
            <Textarea
              value={config.customInstructions ?? ""}
              onChange={(e) => patch({ customInstructions: e.target.value })}
              placeholder="e.g. Focus on third-party management fee benchmarks for select-service hotels..."
              rows={3} className="text-sm resize-none"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Marketing Research ────────────────────────────────────────────────

function MarketingTab({ config, onChange }: { config: ResearchEventConfig; onChange: (c: ResearchEventConfig) => void }) {
  function patch(p: Partial<ResearchEventConfig>) { onChange({ ...config, ...p }); }
  // Parse ICP depth from enabledTools (storing as a simple convention: "icp:full", "icp:summary", "icp:none")
  const icpDepth = (config.enabledTools ?? []).find((t) => t.startsWith("icp:"))?.replace("icp:", "") ?? "full";

  function setIcpDepth(depth: string) {
    const filtered = (config.enabledTools ?? []).filter((t) => !t.startsWith("icp:"));
    patch({ enabledTools: [...filtered, `icp:${depth}`] });
  }

  return (
    <div className="space-y-5">
      <EnableToggle
        label="Marketing Research"
        description="Guest demographics, investor profiles, and market persona analysis"
        enabled={config.enabled}
        onChange={(v) => patch({ enabled: v })}
      />
      {config.enabled && (
        <>
          <DataInputsCard title="Data Inputs" items={["ICP Configuration", "Guest Demographics", "Investor Profiles", "Market Regions"]} />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Persona Types</Label>
            <p className="text-xs text-muted-foreground">Select which persona categories to research.</p>
            <CheckboxGroup
              items={PERSONA_TYPES}
              selected={config.focusAreas ?? []}
              onChange={(v) => patch({ focusAreas: v })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <IconMapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Market Regions (from ICP)
            </Label>
            <p className="text-xs text-muted-foreground">Auto-populated from ICP configuration. Add regions in ICP Studio.</p>
            {(config.regions ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(config.regions ?? []).map((r) => (
                  <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No regions configured. Visit ICP Studio to set up market regions.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">ICP Integration Depth</Label>
            <div className="flex gap-3">
              {ICP_DEPTHS.map((d) => (
                <label key={d.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="icp-depth"
                    value={d.value}
                    checked={icpDepth === d.value}
                    onChange={() => setIcpDepth(d.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Questions</Label>
            <Textarea
              value={config.customQuestions ?? ""}
              onChange={(e) => patch({ customQuestions: e.target.value })}
              placeholder="e.g. What are the top guest segments for boutique hotels in the Northeast?"
              rows={3} className="text-sm resize-none"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Industry Research ─────────────────────────────────────────────────

function IndustryTab({ config, onChange }: { config: ResearchEventConfig; onChange: (c: ResearchEventConfig) => void }) {
  function patch(p: Partial<ResearchEventConfig>) { onChange({ ...config, ...p }); }

  return (
    <div className="space-y-5">
      <EnableToggle
        label="Industry Research"
        description="Industry-wide trends, macro indicators, and regulatory environment"
        enabled={config.enabled}
        onChange={(v) => patch({ enabled: v })}
      />
      {config.enabled && (
        <>
          <DataInputsCard title="Data Inputs" items={["Macro Indicators", "Industry Benchmarks", "Regulatory Environment"]} />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Time Horizon</Label>
            <div className="flex gap-3">
              {TIME_HORIZONS.map((h) => (
                <label key={h.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="time-horizon"
                    value={h.value}
                    checked={(config.timeHorizon ?? "10-year") === h.value}
                    onChange={() => patch({ timeHorizon: h.value })}
                    className="accent-primary"
                  />
                  <span className="text-sm">{h.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Macro Indicators</Label>
            <p className="text-xs text-muted-foreground">Toggle which macro dimensions to track.</p>
            <CheckboxGroup
              items={MACRO_INDICATORS}
              selected={config.focusAreas ?? []}
              onChange={(v) => patch({ focusAreas: v })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Questions</Label>
            <Textarea
              value={config.customQuestions ?? ""}
              onChange={(e) => patch({ customQuestions: e.target.value })}
              placeholder="e.g. What is the impact of rising interest rates on hotel cap rates?"
              rows={3} className="text-sm resize-none"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Sources & Models ──────────────────────────────────────────────────

function SourcesModelsTab({ draft, setDraft, setIsDirty }: {
  draft: ResearchConfig;
  setDraft: React.Dispatch<React.SetStateAction<ResearchConfig>>;
  setIsDirty: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const refreshModels = useRefreshAiModels();
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("Hospitality");

  const customSources = draft.customSources ?? [];

  function addSource() {
    if (newName.trim() && newCategory.trim()) {
      setDraft((prev) => ({ ...prev, customSources: [...(prev.customSources ?? []), { name: newName.trim(), url: newUrl.trim() || undefined, category: newCategory.trim() }] }));
      setIsDirty(true);
      setNewName("");
      setNewUrl("");
    }
  }

  function removeSource(idx: number) {
    setDraft((prev) => ({ ...prev, customSources: (prev.customSources ?? []).filter((_, i) => i !== idx) }));
    setIsDirty(true);
  }

  const models = (draft.cachedModels && draft.cachedModels.length > 0) ? draft.cachedModels : FALLBACK_MODELS;
  const grouped = {
    anthropic: models.filter((m) => m.provider === "anthropic"),
    openai: models.filter((m) => m.provider === "openai"),
    google: models.filter((m) => m.provider === "google"),
  };
  const currentModel = draft.preferredLlm || "claude-sonnet-4-6";
  const hasCurrentInList = models.some((m) => m.id === currentModel);

  // Group curated sources by category
  const curatedByCategory: Record<string, typeof EXPANDED_SOURCES> = {};
  for (const src of EXPANDED_SOURCES) {
    (curatedByCategory[src.category] ??= []).push(src);
  }

  return (
    <div className="space-y-6">
      {/* AI Model Selection */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-display">
                <IconBrain className="w-4 h-4 text-primary" />
                AI Research Model
                <HelpTooltip text="Choose which AI model powers market research. Use Refresh Models to pull the latest available." />
              </CardTitle>
              {draft.cachedModelsAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Models last refreshed {new Date(draft.cachedModelsAt).toLocaleDateString()}.
                </p>
              )}
            </div>
            <Button
              variant="outline" size="sm" className="gap-1.5"
              disabled={refreshModels.isPending}
              onClick={async () => {
                try {
                  const result = await refreshModels.mutateAsync();
                  setDraft((prev) => ({ ...prev, cachedModels: result.models, cachedModelsAt: result.fetchedAt }));
                  toast({ title: `Loaded ${result.models.length} models from providers` });
                } catch {
                  toast({ title: "Failed to refresh models", variant: "destructive" });
                }
              }}
            >
              {refreshModels.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconRefreshCw className="w-3.5 h-3.5" />}
              Refresh Models
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Select
              value={currentModel}
              onValueChange={(value) => { setDraft((prev) => ({ ...prev, preferredLlm: value })); setIsDirty(true); }}
            >
              <SelectTrigger className="bg-card h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {!hasCurrentInList && <SelectItem value={currentModel}>{currentModel} (current)</SelectItem>}
                {grouped.anthropic.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Anthropic</div>
                    {grouped.anthropic.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                  </>
                )}
                {grouped.openai.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">OpenAI</div>
                    {grouped.openai.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                  </>
                )}
                {grouped.google.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Google</div>
                    {grouped.google.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Curated Source Registry */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-display">
            <IconLibrary className="w-4 h-4 text-primary" />
            Curated Source Registry
          </CardTitle>
          <CardDescription className="text-xs">16 trusted data sources used by the AI research engine.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(curatedByCategory).map(([category, sources]) => (
              <div key={category}>
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">{category}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sources.map((source) => (
                    <div key={source.name} className="flex flex-col p-2.5 rounded-lg border border-border/50 bg-muted/30">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium">{source.name}</span>
                      </div>
                      {source.url && (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                          {source.url.replace("https://", "").replace("www.", "")}
                          <IconExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Sources */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-display">
            <IconPlus className="w-4 h-4 text-primary" />
            Custom Research Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Hospitality", "Investment", "Economics", "Regulatory", "Operations", "Other"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addSource} size="sm" className="h-8 px-4" disabled={!newName.trim()}>Add Source</Button>
            </div>

            {customSources.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {customSources.map((source, idx) => (
                  <div key={`${source.name}-${idx}`} className="flex flex-col p-2.5 rounded-lg border border-primary/20 bg-white relative group">
                    <Button variant="ghost" size="icon" onClick={() => removeSource(idx)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-6 w-6">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium">{source.name}</span>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider h-4">{source.category}</Badge>
                    </div>
                    {source.url && <span className="text-[10px] text-muted-foreground truncate pr-6">{source.url}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Estimate */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Estimated Cost Per Full Refresh</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-lg font-display font-bold text-foreground">$0.12</p>
              <p className="text-[10px] text-muted-foreground">Property</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-foreground">$0.08</p>
              <p className="text-[10px] text-muted-foreground">Operations</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-foreground">$0.06</p>
              <p className="text-[10px] text-muted-foreground">Marketing</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-foreground">$0.10</p>
              <p className="text-[10px] text-muted-foreground">Industry</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">Estimates based on {currentModel} pricing. Actual costs vary by response length.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface ResearchCenterTabProps {
  initialTab?: string;
}

export default function ResearchCenterTab({ initialTab }: ResearchCenterTabProps) {
  const { toast } = useToast();
  const { data: savedConfig, isLoading } = useResearchConfig();
  const saveMutation = useSaveResearchConfig();

  const [draft, setDraft] = useState<ResearchConfig>({});
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab ?? "property");

  useEffect(() => {
    if (savedConfig) {
      setDraft(savedConfig);
      setIsDirty(false);
    }
  }, [savedConfig]);

  function updateConfig(key: "property" | "company" | "global" | "marketing", updated: ResearchEventConfig) {
    setDraft((prev) => ({ ...prev, [key]: updated }));
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

  return (
    <div className="space-y-5" data-testid="research-center-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconResearch className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground" data-testid="text-research-center-title">Research Center</h2>
            <p className="text-xs text-muted-foreground">Configure AI research behavior across all research dimensions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/admin/icp-studio" className="text-xs text-primary hover:underline flex items-center gap-1">
            <IconTarget className="w-3.5 h-3.5" />
            ICP Studio
          </a>
          <Button
            data-testid="button-save-research"
            onClick={handleSave}
            disabled={!isDirty || saveMutation.isPending}
            size="sm"
            className="gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 h-10">
          <TabsTrigger value="property" className="text-xs gap-1.5" data-testid="tab-property">
            <IconProperties className="w-3.5 h-3.5" />
            Property
          </TabsTrigger>
          <TabsTrigger value="operations" className="text-xs gap-1.5" data-testid="tab-operations">
            <IconBuilding className="w-3.5 h-3.5" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="marketing" className="text-xs gap-1.5" data-testid="tab-marketing">
            <IconTarget className="w-3.5 h-3.5" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="industry" className="text-xs gap-1.5" data-testid="tab-industry">
            <IconTrendingUp className="w-3.5 h-3.5" />
            Industry
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs gap-1.5" data-testid="tab-sources">
            <IconSettings className="w-3.5 h-3.5" />
            Sources & Models
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="property">
            <Card className="bg-white/80 backdrop-blur-xl border-primary/20">
              <CardContent className="pt-5">
                <PropertyTab
                  config={mergeConfig(draft.property)}
                  onChange={(c) => updateConfig("property", c)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations">
            <Card className="bg-white/80 backdrop-blur-xl border-primary/20">
              <CardContent className="pt-5">
                <OperationsTab
                  config={mergeConfig(draft.company)}
                  onChange={(c) => updateConfig("company", c)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketing">
            <Card className="bg-white/80 backdrop-blur-xl border-primary/20">
              <CardContent className="pt-5">
                <MarketingTab
                  config={mergeConfig(draft.marketing)}
                  onChange={(c) => updateConfig("marketing", c)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="industry">
            <Card className="bg-white/80 backdrop-blur-xl border-primary/20">
              <CardContent className="pt-5">
                <IndustryTab
                  config={mergeConfig(draft.global)}
                  onChange={(c) => updateConfig("global", c)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources">
            <SourcesModelsTab draft={draft} setDraft={setDraft} setIsDirty={setIsDirty} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
