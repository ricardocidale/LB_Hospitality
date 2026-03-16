import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { SaveButton } from "@/components/ui/save-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, X, ChevronDown, ChevronRight } from "@/components/icons/themed-icons";
import {
  IconPlus, IconBrain, IconExternalLink, IconRefreshCw,
  IconResearch, IconProperties, IconMapPin, IconTarget,
  IconTrendingUp, IconFlaskConical, IconDownload, IconSparkles,
  IconCopy, IconPencil, IconTrash, IconWand2,
  IconLink, IconFile, IconFileText, IconUpload, IconGlobe,
} from "@/components/icons";
import { useResearchConfig, useSaveResearchConfig, useRefreshAiModels } from "@/lib/api/admin";
import { useGlobalAssumptions, useUpdateAdminConfig } from "@/lib/api";
import type { ResearchConfig, ResearchEventConfig, ResearchSourceEntry, AiModelEntry, LlmMode, LlmVendor } from "@shared/schema";
import {
  type IcpConfig,
  type IcpDescriptive,
  DEFAULT_ICP_CONFIG,
  DEFAULT_ICP_DESCRIPTIVE,
  generateIcpPrompt,
} from "./icp-config";

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

const FALLBACK_MODELS: AiModelEntry[] = [
  { id: "claude-opus-4-6", label: "Anthropic Claude Opus 4.6", provider: "anthropic" },
  { id: "claude-opus-4-5", label: "Anthropic Claude Opus 4.5", provider: "anthropic" },
  { id: "claude-sonnet-4-5", label: "Anthropic Claude Sonnet 4.5", provider: "anthropic" },
  { id: "claude-haiku-4-5", label: "Anthropic Claude Haiku 4.5", provider: "anthropic" },
  { id: "claude-opus-4-1", label: "Anthropic Claude Opus 4.1", provider: "anthropic" },
  { id: "claude-opus-4", label: "Anthropic Claude Opus 4", provider: "anthropic" },
  { id: "claude-sonnet-4", label: "Anthropic Claude Sonnet 4", provider: "anthropic" },
  { id: "gpt-5.4", label: "OpenAI GPT 5.4", provider: "openai" },
  { id: "gpt-5.4-pro", label: "OpenAI GPT 5.4 Pro", provider: "openai" },
  { id: "o3", label: "OpenAI o3", provider: "openai" },
  { id: "o3-pro", label: "OpenAI o3 Pro", provider: "openai" },
  { id: "o4-mini", label: "OpenAI o4 Mini", provider: "openai" },
  { id: "gemini-3.1-pro-preview", label: "Google Gemini 3.1 Pro Preview", provider: "google" },
  { id: "gemini-3-flash-preview", label: "Google Gemini 3 Flash Preview", provider: "google" },
  { id: "gemini-2.5-flash", label: "Google Gemini 2.5 Flash", provider: "google" },
  { id: "gemini-2.0-flash", label: "Google Gemini 2.0 Flash", provider: "google" },
  { id: "grok-4", label: "xAI Grok 4", provider: "xai" },
  { id: "grok-4-fast", label: "xAI Grok 4 Fast", provider: "xai" },
  { id: "grok-3", label: "xAI Grok 3", provider: "xai" },
  { id: "grok-3-mini", label: "xAI Grok 3 Mini", provider: "xai" },
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

function CollapsibleSection({ title, icon, description, defaultOpen, children }: {
  title: string;
  icon: React.ReactNode;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <Card className="bg-card border border-border/80 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-t-lg"
        data-testid={`section-toggle-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <CardContent className="pt-0 pb-5">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

interface UrlSource {
  id: string;
  url: string;
  label: string;
  addedAt: string;
}

interface FileSource {
  id: string;
  name: string;
  size: number;
  type: string;
  origin: "local" | "google-drive";
  objectPath?: string;
  driveUrl?: string;
  addedAt: string;
}

interface IcpSources {
  urls: UrlSource[];
  files: FileSource[];
  allowUnrestricted?: boolean;
}

interface PromptQuestion {
  id: string;
  question: string;
  sortOrder: number;
}

interface PromptBuilderConfig {
  questions: PromptQuestion[];
  additionalInstructions: string;
  context: {
    location: boolean;
    propertyProfile: boolean;
    propertyDescription: boolean;
    questions: boolean;
    additionalInstructions: boolean;
    financialResults: boolean;
  };
}

const DEFAULT_PROMPT_BUILDER: PromptBuilderConfig = {
  questions: [],
  additionalInstructions: "",
  context: {
    location: true,
    propertyProfile: true,
    propertyDescription: true,
    questions: true,
    additionalInstructions: true,
    financialResults: false,
  },
};

const DEFAULT_ICP_MGMT_QUESTIONS: PromptQuestion[] = [
  {
    id: "default-mkt",
    question: "What are the Industry Benchmark Ranges (min–max %) for Marketing fees charged by hotel management companies as a percentage of Total Revenue? The app default is 2.0% of Total Revenue for Marketing. Please provide the benchmark range (low–high %), explain what revenue base this percentage is applied to, describe how the fee is calculated within the USALI waterfall, identify factors that influence where a specific property falls within the range (property size, market tier, brand strength, service model), and cite sources (HVS Fee Survey, CBRE, STR, JLL, AHLA).",
    sortOrder: 0,
  },
  {
    id: "default-techres",
    question: "What are the Industry Benchmark Ranges (min–max %) for Technology & Reservations fees charged by hotel management companies as a percentage of Total Revenue? The app default is 2.0% of Total Revenue for Technology & Reservations. This category covers IT systems (PMS, booking engine, Wi-Fi, cybersecurity), central reservations (CRS, call center, group bookings), and channel distribution. Please provide the benchmark range (low–high %), explain what revenue base this percentage is applied to, describe how the fee is calculated within the USALI waterfall, identify factors that influence where a specific property falls within the range (property size, market tier, brand strength, service model), and cite sources (HVS Fee Survey, CBRE, STR, JLL, AHLA).",
    sortOrder: 1,
  },
  {
    id: "default-acct",
    question: "What are the Industry Benchmark Ranges (min–max %) for Accounting fees charged by hotel management companies as a percentage of Total Revenue? The app default is 1.5% of Total Revenue for Accounting. Please provide the benchmark range (low–high %), explain what revenue base this percentage is applied to, describe how the fee is calculated within the USALI waterfall, identify factors that influence where a specific property falls within the range (property size, market tier, brand strength, service model), and cite sources (HVS Fee Survey, CBRE, STR, JLL, AHLA).",
    sortOrder: 2,
  },
  {
    id: "default-revmgmt",
    question: "What are the Industry Benchmark Ranges (min–max %) for Revenue Management fees charged by hotel management companies as a percentage of Total Revenue? The app default is 1.0% of Total Revenue for Revenue Management. This category covers dynamic pricing, yield management, demand forecasting, competitive set analysis, and RevPAR optimization. Please provide the benchmark range (low–high %), explain what revenue base this percentage is applied to, describe how the fee is calculated within the USALI waterfall, identify factors that influence where a specific property falls within the range (property size, market tier, revenue complexity, service model), and cite sources (HVS Fee Survey, CBRE, STR, JLL, AHLA).",
    sortOrder: 3,
  },
  {
    id: "default-gm",
    question: "What are the Industry Benchmark Ranges (min–max %) for General Management fees charged by hotel management companies as a percentage of Total Revenue? The app default is 1.5% of Total Revenue for General Management. Please provide the benchmark range (low–high %), explain what revenue base this percentage is applied to, describe how the fee is calculated within the USALI waterfall, identify factors that influence where a specific property falls within the range (property size, market tier, brand strength, service model), and cite sources (HVS Fee Survey, CBRE, STR, JLL, AHLA).",
    sortOrder: 4,
  },
  {
    id: "default-procurement",
    question: "What are the Industry Benchmark Ranges (min–max %) for Procurement fees charged by hotel management companies as a percentage of Total Revenue? The app default is 1.0% of Total Revenue for Procurement. This category covers centralized purchasing, vendor negotiation, supply chain management, GPO coordination, and cost optimization. Please provide the benchmark range (low–high %), explain what revenue base this percentage is applied to, describe how the fee is calculated within the USALI waterfall, identify factors that influence where a specific property falls within the range (portfolio size, purchasing volume, vendor relationships, service model), and cite sources (HVS Fee Survey, CBRE, STR, JLL, AHLA).",
    sortOrder: 5,
  },
  {
    id: "default-basefee",
    question: "What are the Industry Benchmark Ranges (min–max %) for the overall Base Management Fee charged by hotel management companies as a percentage of Total Revenue? The app default is 8.5% of Total Revenue. This fee represents the aggregate compensation for day-to-day hotel operations and is the sum of all service category fees. Please provide the benchmark range (low–high %), explain what revenue base this percentage is applied to, describe how the base management fee is calculated in the USALI waterfall, identify factors that influence where a specific property or management company falls within the range (property size, market tier, brand strength, full-service vs. limited-service, chain scale), and cite sources (HVS Fee Survey, CBRE, STR, JLL, AHLA).",
    sortOrder: 8,
  },
  {
    id: "default-incentive",
    question: "What are the Industry Benchmark Ranges (min–max %) for the Incentive Management Fee charged by hotel management companies as a percentage of Gross Operating Profit (GOP)? The app default is 12% of GOP. Please explain how GOP is calculated (Total Revenue minus Total Operating Expenses per USALI), describe the typical GOP hurdle or owner's priority return that must be met before the incentive fee is triggered, provide the benchmark range (low–high %), identify factors that influence where a specific property or company falls within the range (property performance, owner negotiation leverage, management company track record, market conditions), and cite sources (HVS Fee Survey, CBRE, STR, JLL, AHLA).",
    sortOrder: 9,
  },
  {
    id: "default-markup",
    question: "What are the Industry Benchmark Ranges (min–max %) for the centralized service markup (cost-plus pass-through) applied by hotel management companies on services they procure on behalf of properties? The app default is a 20% markup. Please explain the cost-plus pass-through model (management company procures a service externally and passes the cost through to the property with a markup), provide the benchmark range (low–high %), identify factors that influence where a specific markup falls within the range (volume discounts, service type, management company scale, competitive landscape), and cite sources (HVS Fee Survey, CBRE, STR, JLL, AHLA).",
    sortOrder: 10,
  },
];

interface ResearchSection {
  title: string;
  locationKey?: string;
  content: string;
}

interface IcpResearchReport {
  generatedAt: string;
  model: string;
  sections: ResearchSection[];
  extractedMetrics: Record<string, any>;
}

const DEFAULT_URL_SEEDS: UrlSource[] = [
  { id: "default-str", url: "https://str.com", label: "STR", addedAt: new Date().toISOString() },
  { id: "default-cbre", url: "https://www.cbre.com/industries/hotels", label: "CBRE Hotels", addedAt: new Date().toISOString() },
  { id: "default-hvs", url: "https://hvs.com", label: "HVS", addedAt: new Date().toISOString() },
  { id: "default-jll", url: "https://www.jll.com/en/industries/hotels-and-hospitality", label: "JLL Hotels", addedAt: new Date().toISOString() },
  { id: "default-hnn", url: "https://hotelnewsnow.com", label: "Hotel News Now", addedAt: new Date().toISOString() },
  { id: "default-hnet", url: "https://www.hospitalitynet.org", label: "Hospitality Net", addedAt: new Date().toISOString() },
  { id: "default-pkf", url: "https://www.pkfhotels.com", label: "PKF", addedAt: new Date().toISOString() },
  { id: "default-fred", url: "https://fred.stlouisfed.org", label: "FRED", addedAt: new Date().toISOString() },
  { id: "default-ahla", url: "https://www.ahla.com", label: "AHLA", addedAt: new Date().toISOString() },
  { id: "default-lodging", url: "https://lodgingmagazine.com", label: "Lodging Magazine", addedAt: new Date().toISOString() },
];

const DEFAULT_SOURCES: IcpSources = { urls: [], files: [] };

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const PROPERTY_DEFAULT_SOURCES: ResearchSourceEntry[] = [
  { id: "prop-str", url: "https://str.com", label: "STR (CoStar)", category: "Hospitality", addedAt: new Date().toISOString() },
  { id: "prop-cbre", url: "https://www.cbre.com/industries/hotels", label: "CBRE Hotels", category: "Hospitality", addedAt: new Date().toISOString() },
  { id: "prop-hvs", url: "https://hvs.com", label: "HVS", category: "Hospitality", addedAt: new Date().toISOString() },
  { id: "prop-pkf", url: "https://www.pkfhotels.com", label: "PKF Hospitality", category: "Hospitality", addedAt: new Date().toISOString() },
  { id: "prop-rca", url: "https://www.msci.com/real-capital-analytics", label: "Real Capital Analytics (MSCI)", category: "Investment", addedAt: new Date().toISOString() },
];

const MARKET_DEFAULT_SOURCES: ResearchSourceEntry[] = [
  { id: "mkt-fred", url: "https://fred.stlouisfed.org", label: "FRED (Federal Reserve)", category: "Economics", addedAt: new Date().toISOString() },
  { id: "mkt-bls", url: "https://www.bls.gov", label: "BLS", category: "Economics", addedAt: new Date().toISOString() },
  { id: "mkt-preqin", url: "https://www.preqin.com", label: "Preqin", category: "Investment", addedAt: new Date().toISOString() },
  { id: "mkt-trepp", url: "https://www.trepp.com", label: "Trepp (CMBS)", category: "Investment", addedAt: new Date().toISOString() },
  { id: "mkt-ahla", url: "https://www.ahla.com", label: "AHLA", category: "Industry", addedAt: new Date().toISOString() },
  { id: "mkt-lodging", url: "https://lodgingeconometrics.com", label: "Lodging Econometrics", category: "Industry", addedAt: new Date().toISOString() },
];

function SourceLibrary({ sources, onChange, testIdPrefix, defaultSources }: {
  sources: ResearchSourceEntry[];
  onChange: (sources: ResearchSourceEntry[]) => void;
  testIdPrefix: string;
  defaultSources: ResearchSourceEntry[];
}) {
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (sources.length === 0 && defaultSources.length > 0) {
      onChange([...defaultSources]);
    }
  }, []);

  function handleAdd() {
    const trimmedUrl = newUrl.trim();
    if (!trimmedUrl || !isValidUrl(trimmedUrl)) return;
    if (sources.some((s) => s.url === trimmedUrl)) return;
    onChange([
      ...sources,
      {
        id: `src-${Date.now()}`,
        url: trimmedUrl,
        label: newLabel.trim() || new URL(trimmedUrl).hostname,
        addedAt: new Date().toISOString(),
      },
    ]);
    setNewUrl("");
    setNewLabel("");
  }

  function handleRemove(id: string) {
    onChange(sources.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-1.5">
        <IconLink className="w-3.5 h-3.5 text-muted-foreground" />
        Source Library
      </Label>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">URL</Label>
          <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com/report" className="h-8 text-xs bg-card" onKeyDown={(e) => e.key === "Enter" && handleAdd()} data-testid={`input-${testIdPrefix}-url`} />
        </div>
        <div className="w-40 space-y-1">
          <Label className="text-xs">Label</Label>
          <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Optional" className="h-8 text-xs bg-card" onKeyDown={(e) => e.key === "Enter" && handleAdd()} data-testid={`input-${testIdPrefix}-label`} />
        </div>
        <Button size="sm" variant="outline" onClick={handleAdd} disabled={!newUrl.trim()} className="h-8 text-xs gap-1" data-testid={`button-add-${testIdPrefix}`}>
          <IconPlus className="w-3 h-3" />
          Add
        </Button>
      </div>
      {sources.length > 0 ? (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {sources.map((source) => (
            <div key={source.id} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/20 group hover:bg-muted/40 transition-colors" data-testid={`${testIdPrefix}-source-${source.id}`}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <IconGlobe className="w-3 h-3 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{source.label}</p>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline truncate block">{source.url}</a>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <IconExternalLink className="w-3 h-3" />
                </a>
                <button onClick={() => handleRemove(source.id)} className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" data-testid={`remove-${testIdPrefix}-${source.id}`}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic py-2">No sources configured.</p>
      )}
    </div>
  );
}

function IcpResearchSection({ enabled, onToggle }: { enabled: boolean; onToggle: (v: boolean) => void }) {
  const { data: ga, refetch } = useGlobalAssumptions();
  const updateMutation = useUpdateAdminConfig();
  const { toast } = useToast();

  const [report, setReport] = useState<IcpResearchReport | null>(null);
  const [researchMarkdown, setResearchMarkdown] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx">("pdf");
  const [exportOrientation, setExportOrientation] = useState<"portrait" | "landscape">("portrait");
  const [isExporting, setIsExporting] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);

  const [editablePrompt, setEditablePrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [sources, setSources] = useState<IcpSources>(DEFAULT_SOURCES);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [urlSearch, setUrlSearch] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [driveName, setDriveName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const seededRef = useRef(false);

  const [promptBuilder, setPromptBuilder] = useState<PromptBuilderConfig>(DEFAULT_PROMPT_BUILDER);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");

  const [activeSubTab, setActiveSubTab] = useState<"ai-prompt" | "icp-ai-prompt" | "research-text" | "research-markdown" | "sources">("ai-prompt");

  const prompt = ga?.assetDescription || "";

  const config: IcpConfig = (() => {
    if (ga?.icpConfig) return { ...DEFAULT_ICP_CONFIG, ...(ga.icpConfig as Partial<IcpConfig>) };
    return DEFAULT_ICP_CONFIG;
  })();

  const desc: IcpDescriptive = (() => {
    if (ga?.icpConfig && (ga.icpConfig as any)?._descriptive) {
      return { ...DEFAULT_ICP_DESCRIPTIVE, ...((ga.icpConfig as any)._descriptive as Partial<IcpDescriptive>) };
    }
    return DEFAULT_ICP_DESCRIPTIVE;
  })();

  const propertyLabel = ga?.propertyLabel || "Boutique Hotel";

  const promptOpts = {
    locations: ((ga?.icpConfig as any)?._locations ?? []) as import("./icp-config").IcpLocation[],
    customAmenities: ((ga?.icpConfig as any)?._customAmenities ?? []) as { label: string; priority: import("./icp-config").Priority }[],
  };

  useEffect(() => {
    if (ga?.icpConfig) {
      const cfg = ga.icpConfig as Record<string, any>;
      if (cfg._research) setReport(cfg._research as IcpResearchReport);
      if (cfg._researchMarkdown) setResearchMarkdown(cfg._researchMarkdown as string);
      if (cfg._promptBuilder) {
        setPromptBuilder({ ...DEFAULT_PROMPT_BUILDER, ...(cfg._promptBuilder as Partial<PromptBuilderConfig>) });
      }
    }
  }, [ga?.icpConfig]);

  useEffect(() => {
    if (!ga) return;
    if (seededRef.current || updateMutation.isPending) return;
    const cfg = (ga.icpConfig as Record<string, any>) || {};

    const needSourcesSeed = !cfg._sources;
    const savedPb = cfg._promptBuilder as Partial<PromptBuilderConfig> | undefined;
    const needQuestionsSeed = !savedPb || !Array.isArray(savedPb.questions) || savedPb.questions.length === 0;

    if (cfg._sources) {
      setSources(cfg._sources as IcpSources);
    }

    if (!needSourcesSeed && !needQuestionsSeed) return;

    seededRef.current = true;
    const existing = { ...cfg };
    const messages: string[] = [];

    if (needSourcesSeed) {
      const seededSources: IcpSources = { urls: [...DEFAULT_URL_SEEDS], files: [] };
      setSources(seededSources);
      existing._sources = seededSources;
      messages.push("10 default research sources");
    }

    if (needQuestionsSeed) {
      const seededPb: PromptBuilderConfig = {
        ...DEFAULT_PROMPT_BUILDER,
        ...savedPb,
        questions: [...DEFAULT_ICP_MGMT_QUESTIONS],
      };
      setPromptBuilder(seededPb);
      existing._promptBuilder = seededPb;
      messages.push("11 default Industry Benchmark Ranges questions");
    }

    updateMutation.mutate(
      { icpConfig: existing },
      {
        onSuccess: () => {
          toast({ title: "Defaults Loaded", description: `${messages.join(" and ")} have been added.` });
        },
      }
    );
  }, [ga?.icpConfig]);

  const saveSources = (updated: IcpSources) => {
    const existing = (ga?.icpConfig as Record<string, any>) || {};
    updateMutation.mutate(
      { icpConfig: { ...existing, _sources: updated } },
      {
        onSuccess: () => {
          toast({ title: "Saved", description: "Research sources updated." });
        },
      }
    );
  };

  const mutateError = useCallback(() => {
    toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
  }, [toast]);

  const savePromptBuilder = useCallback((updated: PromptBuilderConfig) => {
    const existing = (ga?.icpConfig as Record<string, any>) || {};
    updateMutation.mutate(
      { icpConfig: { ...existing, _promptBuilder: updated } },
      {
        onSuccess: () => {
          toast({ title: "Saved", description: "Prompt builder configuration updated." });
        },
        onError: mutateError,
      }
    );
  }, [ga?.icpConfig, updateMutation, toast, mutateError]);

  const handleAddQuestion = () => {
    const text = newQuestionText.trim();
    if (!text) return;
    const updated = {
      ...promptBuilder,
      questions: [...promptBuilder.questions, { id: `q-${Date.now()}`, question: text, sortOrder: promptBuilder.questions.length }],
    };
    setPromptBuilder(updated);
    setNewQuestionText("");
    savePromptBuilder(updated);
  };

  const handleEditQuestion = (id: string) => {
    const q = promptBuilder.questions.find((q) => q.id === id);
    if (!q) return;
    setEditingQuestionId(id);
    setEditingQuestionText(q.question);
  };

  const handleSaveEditQuestion = () => {
    if (!editingQuestionId || !editingQuestionText.trim()) return;
    const updated = {
      ...promptBuilder,
      questions: promptBuilder.questions.map((q) =>
        q.id === editingQuestionId ? { ...q, question: editingQuestionText.trim() } : q
      ),
    };
    setPromptBuilder(updated);
    setEditingQuestionId(null);
    setEditingQuestionText("");
    savePromptBuilder(updated);
  };

  const handleCopyQuestion = (id: string) => {
    const q = promptBuilder.questions.find((q) => q.id === id);
    if (!q) return;
    const updated = {
      ...promptBuilder,
      questions: [...promptBuilder.questions, { id: `q-${Date.now()}`, question: q.question, sortOrder: promptBuilder.questions.length }],
    };
    setPromptBuilder(updated);
    savePromptBuilder(updated);
    toast({ title: "Copied", description: "Question duplicated." });
  };

  const handleDeleteQuestion = (id: string) => {
    const updated = {
      ...promptBuilder,
      questions: promptBuilder.questions.filter((q) => q.id !== id),
    };
    setPromptBuilder(updated);
    savePromptBuilder(updated);
  };

  const handleReinsertDefaults = () => {
    const existingIds = new Set(promptBuilder.questions.map((q) => q.id));
    const missing = DEFAULT_ICP_MGMT_QUESTIONS.filter((dq) => !existingIds.has(dq.id));
    if (missing.length === 0) {
      toast({ title: "No Changes", description: "All default Industry Benchmark Ranges questions are already present." });
      return;
    }
    const nextOrder = promptBuilder.questions.length;
    const reinserted = missing.map((q, i) => ({ ...q, sortOrder: nextOrder + i }));
    const updated = {
      ...promptBuilder,
      questions: [...promptBuilder.questions, ...reinserted],
    };
    setPromptBuilder(updated);
    savePromptBuilder(updated);
    toast({ title: "Defaults Restored", description: `${missing.length} default question${missing.length > 1 ? "s" : ""} re-inserted.` });
  };

  const handleContextChange = (key: keyof PromptBuilderConfig["context"], checked: boolean) => {
    const updated = {
      ...promptBuilder,
      context: { ...promptBuilder.context, [key]: checked },
    };
    setPromptBuilder(updated);
    savePromptBuilder(updated);
  };

  const handleInstructionsChange = useCallback((value: string) => {
    setPromptBuilder((prev) => ({ ...prev, additionalInstructions: value }));
  }, []);

  const handleSaveInstructions = () => {
    savePromptBuilder(promptBuilder);
  };

  const handleGenerate = () => {
    const generated = generateIcpPrompt(config, desc, propertyLabel, promptOpts);
    updateMutation.mutate(
      { assetDescription: generated },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({ title: "Generated", description: "AI prompt generated from current profile and description." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save generated prompt.", variant: "destructive" });
        },
      }
    );
  };

  const handleEdit = () => {
    setEditablePrompt(prompt);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(
      { assetDescription: editablePrompt },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({ title: "Saved", description: "AI prompt updated." });
        },
        onError: mutateError,
      }
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditablePrompt("");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(isEditing ? editablePrompt : prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    updateMutation.mutate(
      { assetDescription: "" },
      {
        onSuccess: () => {
          setIsEditing(false);
          setEditablePrompt("");
          toast({ title: "Cleared", description: "AI prompt cleared." });
        },
        onError: mutateError,
      }
    );
  };

  const handleOptimize = async () => {
    const currentPrompt = isEditing ? editablePrompt : prompt;
    if (!currentPrompt.trim()) {
      toast({ title: "Nothing to optimize", description: "Generate or enter a prompt first.", variant: "destructive" });
      return;
    }
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/ai/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: currentPrompt }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to optimize");
      }
      const { optimized } = await res.json();
      updateMutation.mutate(
        { assetDescription: optimized },
        {
          onSuccess: () => {
            setIsEditing(false);
            toast({ title: "Optimized", description: "Prompt has been optimized by AI." });
          },
          onError: mutateError,
        }
      );
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to optimize prompt", variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateResearch = useCallback(async () => {
    setIsGenerating(true);
    setStreamContent("");
    setReport(null);
    setResearchMarkdown("");

    try {
      const res = await fetch("/api/research/icp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ promptBuilder: promptBuilder }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start research generation");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "content") {
              setStreamContent((prev) => prev + event.data);
              if (streamRef.current) {
                streamRef.current.scrollTop = streamRef.current.scrollHeight;
              }
            } else if (event.type === "done" && event.report) {
              setReport(event.report);
              if (event.markdown) setResearchMarkdown(event.markdown);
              await refetch();
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch {}
        }
      }

      toast({ title: "Research Complete", description: "ICP Management Co market research report has been generated and saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate research", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [refetch, toast, promptBuilder]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/research/icp/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ format: exportFormat, orientation: exportOrientation }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `icp-research-report.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: `Report exported as ${exportFormat.toUpperCase()}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!researchMarkdown) return;
    const blob = new Blob([researchMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "icp-research-report.md";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Research exported as Markdown." });
  };

  const formatMetricValue = (val: any) => {
    if (!val || typeof val !== "object" || !("value" in val)) return null;
    const v = val.value;
    const u = val.unit || "";
    if (u === "USD") return `$${Number(v).toLocaleString()}`;
    if (u === "%") return `${v}%`;
    return `${v} ${u}`.trim();
  };

  const handleAddUrl = () => {
    const trimmedUrl = newUrl.trim();
    if (!trimmedUrl) return;
    if (!isValidUrl(trimmedUrl)) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL starting with http:// or https://", variant: "destructive" });
      return;
    }
    if (sources.urls.some((s) => s.url === trimmedUrl)) {
      toast({ title: "Duplicate", description: "This URL is already in your sources.", variant: "destructive" });
      return;
    }
    const updated: IcpSources = {
      ...sources,
      urls: [
        ...sources.urls,
        {
          id: `url-${Date.now()}`,
          url: trimmedUrl,
          label: newLabel.trim() || new URL(trimmedUrl).hostname,
          addedAt: new Date().toISOString(),
        },
      ],
    };
    setSources(updated);
    saveSources(updated);
    setNewUrl("");
    setNewLabel("");
  };

  const handleRemoveUrl = (id: string) => {
    const updated: IcpSources = {
      ...sources,
      urls: sources.urls.filter((u) => u.id !== id),
    };
    setSources(updated);
    saveSources(updated);
  };

  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const newFiles: FileSource[] = [];
      for (const file of Array.from(files)) {
        const res = await fetch("/api/uploads/direct", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: await file.arrayBuffer().then((b) => new Uint8Array(b)),
        });

        let objectPath = "";
        if (res.ok) {
          const data = await res.json();
          objectPath = data.url || data.objectPath || "";
        }

        newFiles.push({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          origin: "local",
          objectPath,
          addedAt: new Date().toISOString(),
        });
      }

      const updated: IcpSources = {
        ...sources,
        files: [...sources.files, ...newFiles],
      };
      setSources(updated);
      saveSources(updated);
      toast({ title: "Files Added", description: `${newFiles.length} file(s) added to research sources.` });
    } catch (err: any) {
      toast({ title: "Upload Error", description: err.message || "Failed to upload files", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddGoogleDrive = () => {
    const trimmedUrl = driveUrl.trim();
    if (!trimmedUrl) return;
    if (!isValidUrl(trimmedUrl)) {
      toast({ title: "Invalid URL", description: "Please enter a valid Google Drive link.", variant: "destructive" });
      return;
    }
    if (sources.files.some((f) => f.driveUrl === trimmedUrl)) {
      toast({ title: "Duplicate", description: "This Google Drive file is already in your sources.", variant: "destructive" });
      return;
    }
    const name = driveName.trim() || trimmedUrl.split("/").pop() || "Google Drive File";
    const updated: IcpSources = {
      ...sources,
      files: [
        ...sources.files,
        {
          id: `gdrive-${Date.now()}`,
          name,
          size: 0,
          type: "application/google-drive",
          origin: "google-drive",
          driveUrl: trimmedUrl,
          addedAt: new Date().toISOString(),
        },
      ],
    };
    setSources(updated);
    saveSources(updated);
    setDriveUrl("");
    setDriveName("");
  };

  const handleRemoveFile = (id: string) => {
    const updated: IcpSources = {
      ...sources,
      files: sources.files.filter((f) => f.id !== id),
    };
    setSources(updated);
    saveSources(updated);
  };

  const filteredUrls = urlSearch.trim()
    ? sources.urls.filter(
        (u) =>
          u.url.toLowerCase().includes(urlSearch.toLowerCase()) ||
          u.label.toLowerCase().includes(urlSearch.toLowerCase())
      )
    : sources.urls;

  return (
    <div className="space-y-4">
      <EnableToggle
        label="ICP Management Co Research"
        description="AI-powered research using the ICP Management Co definition to identify acquisition targets"
        enabled={enabled}
        onChange={onToggle}
      />
      {!enabled ? null : (<>
      <div className="flex gap-2 border-b border-border/50 pb-2 overflow-x-auto">
        {([
          { key: "ai-prompt", label: "AI Prompt" },
          { key: "icp-ai-prompt", label: "ICP AI Prompt" },
          { key: "research-text", label: "Research Text" },
          { key: "research-markdown", label: "Research Markdown" },
          { key: "sources", label: "Sources" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveSubTab(tab.key as typeof activeSubTab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === tab.key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            data-testid={`subtab-icp-${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "ai-prompt" && (
        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Research Questions</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Define the questions the ICP AI Prompt should answer when generating research.
            </p>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="e.g. What are the average ADR ranges by location for boutique luxury hotels?"
                className="h-9 text-xs bg-card"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddQuestion(); } }}
                data-testid="input-new-question"
              />
            </div>
            <Button size="sm" variant="default" onClick={handleAddQuestion} disabled={!newQuestionText.trim() || updateMutation.isPending} className="h-9 text-xs gap-1.5" data-testid="button-add-question">
              <IconPlus className="w-3.5 h-3.5" />
              Add Question
            </Button>
            <Button size="sm" variant="outline" onClick={handleReinsertDefaults} disabled={updateMutation.isPending} className="h-9 text-xs gap-1.5" data-testid="button-reinsert-defaults">
              <IconRefreshCw className="w-3.5 h-3.5" />
              Re-insert Default Questions
            </Button>
          </div>

          {promptBuilder.questions.length > 0 ? (
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {promptBuilder.questions.map((q, idx) => (
                <div key={q.id} className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-border/60 bg-muted/20 group hover:bg-muted/40 transition-colors" data-testid={`question-${q.id}`}>
                  <span className="text-[10px] font-bold text-muted-foreground mt-0.5 shrink-0 w-5">{idx + 1}.</span>
                  {editingQuestionId === q.id ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editingQuestionText}
                        onChange={(e) => setEditingQuestionText(e.target.value)}
                        className="h-8 text-xs bg-card"
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEditQuestion(); }}
                        autoFocus
                        data-testid="input-edit-question"
                      />
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="default" onClick={handleSaveEditQuestion} className="text-xs h-7" data-testid="button-save-edit-question">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingQuestionId(null)} className="text-xs h-7">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="flex-1 text-xs text-foreground/90 leading-relaxed">{q.question}</p>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditQuestion(q.id)} className="text-muted-foreground hover:text-primary p-0.5" data-testid={`edit-question-${q.id}`}>
                          <IconPencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleCopyQuestion(q.id)} className="text-muted-foreground hover:text-primary p-0.5" data-testid={`copy-question-${q.id}`}>
                          <IconCopy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="text-muted-foreground hover:text-red-500 p-0.5" data-testid={`delete-question-${q.id}`}>
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <IconResearch className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No research questions defined yet. Add questions above.</p>
            </div>
          )}

          <div className="pt-4 border-t border-border/40 space-y-3">
            <div>
              <Label className="text-sm font-medium">Additional Instructions</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Custom instructions to guide how the AI builds the research prompt and report.
              </p>
            </div>
            <Textarea
              value={promptBuilder.additionalInstructions}
              onChange={(e) => handleInstructionsChange(e.target.value)}
              onBlur={handleSaveInstructions}
              placeholder="e.g. Focus on luxury boutique segment specifically, highlight competitive landscape per market, include fee ranges for management and incentive fees..."
              rows={4}
              className="text-xs resize-none bg-card"
              data-testid="textarea-additional-instructions"
            />
          </div>

          <div className="pt-4 border-t border-border/40 space-y-3">
            <div>
              <Label className="text-sm font-medium">Context for ICP AI Prompt</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select which data sources the AI should use to build the ICP AI Prompt and generate research.
              </p>
            </div>
            <div className="space-y-2.5">
              {([
                { key: "location" as const, label: "Location", desc: "Target countries, states, cities, and radii" },
                { key: "propertyProfile" as const, label: "Property Profile", desc: "Room counts, ADR, occupancy, financial targets" },
                { key: "propertyDescription" as const, label: "Property Description", desc: "Property types, F&B levels, exclusions" },
                { key: "questions" as const, label: "Questions", desc: "Research questions defined above" },
                { key: "additionalInstructions" as const, label: "Additional Instructions", desc: "Custom instructions written above" },
                { key: "financialResults" as const, label: "Financial Results", desc: "Current financial reports for the Management Company" },
              ]).map((item) => (
                <div key={item.key} className="flex items-start gap-2.5">
                  <Checkbox
                    id={`ctx-${item.key}`}
                    checked={promptBuilder.context[item.key]}
                    onCheckedChange={(v) => handleContextChange(item.key, !!v)}
                    className="mt-0.5"
                    data-testid={`checkbox-context-${item.key}`}
                  />
                  <label htmlFor={`ctx-${item.key}`} className="cursor-pointer leading-tight">
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground block">{item.desc}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "icp-ai-prompt" && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">ICP AI Research Prompt</h4>
            <p className="text-xs text-muted-foreground mt-1">
              This prompt is generated from your AI Prompt configuration and served to the AI research engine.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="default" onClick={handleGenerate} disabled={updateMutation.isPending} className="text-xs h-8 gap-1.5" data-testid="button-generate-prompt">
              <IconRefreshCw className="w-3.5 h-3.5" />
              Generate
            </Button>
            {!isEditing ? (
              <Button size="sm" variant="outline" onClick={handleEdit} disabled={!prompt} className="text-xs h-8 gap-1.5" data-testid="button-edit-prompt">
                <IconPencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="default" onClick={handleSaveEdit} disabled={updateMutation.isPending} className="text-xs h-8 gap-1.5" data-testid="button-save-edit">
                  Save Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="text-xs h-8" data-testid="button-cancel-edit">
                  Cancel
                </Button>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={handleOptimize} disabled={isOptimizing || (!prompt && !editablePrompt)} className="text-xs h-8 gap-1.5" data-testid="button-optimize-prompt">
              {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconWand2 className="w-3.5 h-3.5" />}
              Optimize
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCopy} disabled={!prompt && !editablePrompt} className="text-xs h-8 gap-1.5" data-testid="button-copy-prompt">
              <IconCopy className="w-3.5 h-3.5" />
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClear} disabled={!prompt || updateMutation.isPending} className="text-xs h-8 gap-1.5 text-red-500 hover:text-red-600" data-testid="button-clear-prompt">
              <IconTrash className="w-3.5 h-3.5" />
              Clear
            </Button>
          </div>

          {isEditing ? (
            <textarea
              value={editablePrompt}
              onChange={(e) => setEditablePrompt(e.target.value)}
              className="w-full min-h-[500px] text-xs leading-relaxed font-mono text-foreground/90 bg-muted/40 border border-border rounded p-4 resize-y focus:outline-none focus:ring-1 focus:ring-ring"
              data-testid="textarea-ai-prompt"
            />
          ) : prompt ? (
            <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-foreground/90 bg-muted/40 border border-border rounded p-4 max-h-[600px] overflow-y-auto" data-testid="text-ai-prompt">
              {prompt}
            </pre>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <IconSparkles className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No ICP AI prompt generated yet</p>
              <p className="text-xs mt-1">Click <strong>Generate</strong> to build the prompt from your AI Prompt configuration.</p>
            </div>
          )}

          {(isEditing ? editablePrompt : prompt) && (
            <p className="text-xs text-muted-foreground italic">
              {(isEditing ? editablePrompt : prompt).length.toLocaleString()} characters
            </p>
          )}
        </div>
      )}

      {activeSubTab === "research-text" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <IconFlaskConical className="w-4 h-4 text-muted-foreground" />
                Research Text
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Formatted market research with charts and metrics. Export as PDF.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="default" onClick={handleGenerateResearch} disabled={isGenerating} className="text-xs h-8 gap-1.5" data-testid="button-generate-research">
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconRefreshCw className="w-3.5 h-3.5" />}
                {isGenerating ? "Generating..." : report ? "Regenerate" : "Generate Research"}
              </Button>
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing markets and generating report...</span>
              </div>
              <div ref={streamRef} className="max-h-[500px] overflow-y-auto bg-muted/40 border border-border rounded-lg p-4 font-mono text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap" data-testid="stream-content">
                {streamContent || "Waiting for response..."}
              </div>
            </div>
          )}

          {!isGenerating && !report && (
            <div className="text-center py-12">
              <IconFlaskConical className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground" data-testid="text-no-research">No research report generated yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click <strong>Generate Research</strong> to produce a market analysis.</p>
            </div>
          )}

          {!isGenerating && report && (
            <div className="space-y-6" data-testid="research-report">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-muted-foreground">
                  Generated {new Date(report.generatedAt).toLocaleString()} using {report.model}
                </p>
                <div className="flex items-center gap-2">
                  <Select value={exportFormat} onValueChange={(v: "pdf" | "docx") => setExportFormat(v)}>
                    <SelectTrigger className="h-8 w-24 text-xs bg-card" data-testid="select-export-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={exportOrientation} onValueChange={(v: "portrait" | "landscape") => setExportOrientation(v)}>
                    <SelectTrigger className="h-8 w-28 text-xs bg-card" data-testid="select-export-orientation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={handleExport} disabled={isExporting} className="text-xs h-8 gap-1.5" data-testid="button-export-research">
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconDownload className="w-3.5 h-3.5" />}
                    Export
                  </Button>
                </div>
              </div>

              {report.sections.map((section, idx) => (
                <div key={idx} className="space-y-2" data-testid={`section-${idx}`}>
                  <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-1">{section.title}</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {section.content.split("\n\n").filter(Boolean).map((para, pi) => (
                      <p key={pi} className="text-xs leading-relaxed text-foreground/85 mb-2 last:mb-0">{para}</p>
                    ))}
                  </div>
                </div>
              ))}

              {report.extractedMetrics && Object.keys(report.extractedMetrics).length > 0 && (
                <div className="space-y-3" data-testid="extracted-metrics">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-1">Key Extracted Metrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(report.extractedMetrics)
                      .filter(([k]) => k !== "locationMetrics")
                      .map(([key, val]) => {
                        const formatted = formatMetricValue(val);
                        if (!formatted) return null;
                        return (
                          <div key={key} className="bg-muted/40 rounded-lg p-3 border border-border/40" data-testid={`metric-${key}`}>
                            <p className="text-lg font-bold text-foreground">{formatted}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{val.description || key}</p>
                          </div>
                        );
                      })}
                  </div>

                  {report.extractedMetrics.locationMetrics && Array.isArray(report.extractedMetrics.locationMetrics) && (
                    <div className="space-y-3">
                      {report.extractedMetrics.locationMetrics.map((loc: any, li: number) => (
                        <div key={li} className="bg-muted/30 rounded-lg p-3 border border-border/40" data-testid={`location-metric-${li}`}>
                          <h4 className="text-xs font-semibold text-foreground mb-2">{loc.location}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              ["ADR", loc.avgAdr], ["Occupancy", loc.avgOccupancy], ["RevPAR", loc.avgRevPAR],
                              ["Cap Rate", loc.capRate], ["Land/Acre", loc.avgLandCostPerAcre], ["Demand Growth", loc.demandGrowthRate],
                            ].map(([label, metric]) => {
                              const formatted = formatMetricValue(metric);
                              if (!formatted) return null;
                              return (
                                <div key={label as string} className="text-center">
                                  <p className="text-sm font-bold text-foreground">{formatted}</p>
                                  <p className="text-[10px] text-muted-foreground">{label as string}</p>
                                </div>
                              );
                            })}
                            {loc.competitiveIntensity && (
                              <div className="text-center">
                                <p className="text-sm font-bold text-foreground capitalize">{loc.competitiveIntensity}</p>
                                <p className="text-[10px] text-muted-foreground">Competition</p>
                              </div>
                            )}
                            {loc.investmentRating && (
                              <div className="text-center">
                                <p className="text-sm font-bold text-foreground">{loc.investmentRating}</p>
                                <p className="text-[10px] text-muted-foreground">Rating</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === "research-markdown" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <IconFileText className="w-4 h-4 text-muted-foreground" />
                Research Markdown
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Raw markdown output from the AI research engine. Export as .md file.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="default" onClick={handleGenerateResearch} disabled={isGenerating} className="text-xs h-8 gap-1.5" data-testid="button-regenerate-markdown">
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconRefreshCw className="w-3.5 h-3.5" />}
                {isGenerating ? "Generating..." : researchMarkdown ? "Regenerate" : "Generate"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportMarkdown} disabled={!researchMarkdown} className="text-xs h-8 gap-1.5" data-testid="button-export-markdown">
                <IconDownload className="w-3.5 h-3.5" />
                Export .md
              </Button>
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating markdown research report...</span>
              </div>
              <div ref={streamRef} className="max-h-[500px] overflow-y-auto bg-muted/40 border border-border rounded-lg p-4 font-mono text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap" data-testid="stream-markdown">
                {streamContent || "Waiting for response..."}
              </div>
            </div>
          )}

          {!isGenerating && !researchMarkdown && (
            <div className="text-center py-12">
              <IconFileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground" data-testid="text-no-markdown">No markdown research generated yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click <strong>Generate</strong> to produce a markdown research report.</p>
            </div>
          )}

          {!isGenerating && researchMarkdown && (
            <div className="space-y-2" data-testid="research-markdown-content">
              <p className="text-xs text-muted-foreground">
                {researchMarkdown.length.toLocaleString()} characters
              </p>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-foreground/90 bg-muted/40 border border-border rounded p-4 max-h-[700px] overflow-y-auto" data-testid="text-research-markdown">
                {researchMarkdown}
              </pre>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "sources" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <IconGlobe className="w-3.5 h-3.5 text-muted-foreground" />
                Allow Unrestricted Search
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, the AI can search beyond the listed sources. When disabled, research is restricted to sources below.
              </p>
            </div>
            <Switch
              checked={sources.allowUnrestricted ?? false}
              onCheckedChange={(v) => {
                const updated = { ...sources, allowUnrestricted: v };
                setSources(updated);
                saveSources(updated);
              }}
              data-testid="switch-allow-unrestricted"
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <IconLink className="w-4 h-4 text-muted-foreground" />
              URL Sources
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hospitality industry databases, market reports, investment research (STR, HVS, CBRE, PKF).
            </p>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">URL</Label>
              <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com/market-report" className="h-9 text-xs bg-card" onKeyDown={(e) => e.key === "Enter" && handleAddUrl()} data-testid="input-new-url" />
            </div>
            <div className="w-48 space-y-1">
              <Label className="text-xs">Label (optional)</Label>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Market Report 2025" className="h-9 text-xs bg-card" onKeyDown={(e) => e.key === "Enter" && handleAddUrl()} data-testid="input-url-label" />
            </div>
            <Button size="sm" variant="default" onClick={handleAddUrl} disabled={!newUrl.trim() || updateMutation.isPending} className="h-9 text-xs gap-1.5" data-testid="button-add-url">
              <IconPlus className="w-3.5 h-3.5" />
              Add
            </Button>
          </div>

          {sources.urls.length > 3 && (
            <Input value={urlSearch} onChange={(e) => setUrlSearch(e.target.value)} placeholder="Search sources..." className="h-8 text-xs bg-muted/30" data-testid="input-search-urls" />
          )}

          {filteredUrls.length > 0 ? (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {filteredUrls.map((source) => (
                <div key={source.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/60 bg-muted/20 group hover:bg-muted/40 transition-colors" data-testid={`url-source-${source.id}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <IconGlobe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{source.label}</p>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline truncate block">{source.url}</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <IconExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => handleRemoveUrl(source.id)} className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" data-testid={`remove-url-${source.id}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <IconLink className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No URL sources added yet</p>
            </div>
          )}

          <div className="pt-4 border-t border-border/40">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <IconFile className="w-4 h-4 text-muted-foreground" />
              File Sources
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">Upload documents or add Google Drive links.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2 p-3 rounded-lg border border-dashed border-border/60 bg-muted/10">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <IconUpload className="w-3.5 h-3.5" />
                Local Files
              </Label>
              <input ref={fileInputRef} type="file" multiple onChange={handleLocalFileSelect} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.pptx,.rtf" data-testid="input-file-upload" />
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full text-xs h-8 gap-1.5" data-testid="button-upload-local">
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconUpload className="w-3.5 h-3.5" />}
                {isUploading ? "Uploading..." : "Choose Files"}
              </Button>
              <p className="text-[10px] text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, PPTX</p>
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-dashed border-border/60 bg-muted/10">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                Google Drive
              </Label>
              <Input value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..." className="h-8 text-xs bg-card" data-testid="input-drive-url" />
              <div className="flex gap-1.5">
                <Input value={driveName} onChange={(e) => setDriveName(e.target.value)} placeholder="File name (optional)" className="h-8 text-xs bg-card flex-1" data-testid="input-drive-name" />
                <Button size="sm" variant="outline" onClick={handleAddGoogleDrive} disabled={!driveUrl.trim() || updateMutation.isPending} className="h-8 text-xs gap-1" data-testid="button-add-drive">
                  <IconPlus className="w-3 h-3" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {sources.files.length > 0 && (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {sources.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/60 bg-muted/20 group hover:bg-muted/40 transition-colors" data-testid={`file-source-${file.id}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {file.origin === "google-drive" ? (
                      <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z" />
                        <polyline points="14,2 14,8 20,8" />
                      </svg>
                    ) : (
                      <IconFileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {file.origin === "google-drive" ? "Google Drive" : "Local upload"}
                        {file.size > 0 && ` · ${formatFileSize(file.size)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {file.driveUrl && (
                      <a href={file.driveUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <IconExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button onClick={() => handleRemoveFile(file.id)} className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" data-testid={`remove-file-${file.id}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </>)}
    </div>
  );
}

function PropertyResearchSection({ config, onChange }: { config: ResearchEventConfig; onChange: (c: ResearchEventConfig) => void }) {
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
        description="Per-property market analysis: RevPAR, ADR, occupancy, cap rates against market benchmarks"
        enabled={config.enabled}
        onChange={(v) => patch({ enabled: v })}
      />
      {config.enabled && (
        <>
          <DataInputsCard title="Data Inputs" items={["Location", "Room Count", "ADR", "Acquisition Price", "ICP Management Co Context"]} />

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
              <InfoTooltip text="Days before research results are considered stale." />
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

          <SourceLibrary
            sources={config.sources ?? []}
            onChange={(s) => patch({ sources: s })}
            testIdPrefix="prop-src"
            defaultSources={PROPERTY_DEFAULT_SOURCES}
          />
        </>
      )}
    </div>
  );
}

function MarketResearchSection({ config, onChange }: { config: ResearchEventConfig; onChange: (c: ResearchEventConfig) => void }) {
  function patch(p: Partial<ResearchEventConfig>) { onChange({ ...config, ...p }); }

  return (
    <div className="space-y-5">
      <EnableToggle
        label="Market Research"
        description="Macro real estate and hospitality market analysis: trends, economic indicators, supply/demand dynamics"
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
            <Label className="text-sm font-medium">Custom Instructions</Label>
            <Textarea
              value={config.customInstructions ?? ""}
              onChange={(e) => patch({ customInstructions: e.target.value })}
              placeholder="e.g. Focus on interest rate impact on hotel cap rates, analyze supply pipeline risk..."
              rows={3} className="text-sm resize-none"
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

          <SourceLibrary
            sources={config.sources ?? []}
            onChange={(s) => patch({ sources: s })}
            testIdPrefix="mkt-src"
            defaultSources={MARKET_DEFAULT_SOURCES}
          />
        </>
      )}
    </div>
  );
}

const LLM_VENDORS: { value: LlmVendor; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google" },
  { value: "anthropic", label: "Anthropic" },
  { value: "xai", label: "xAI" },
  { value: "tesla", label: "Tesla" },
  { value: "microsoft", label: "Microsoft" },
];

function LlmSelectionCard({ draft, setDraft, setIsDirty }: {
  draft: ResearchConfig;
  setDraft: React.Dispatch<React.SetStateAction<ResearchConfig>>;
  setIsDirty: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const refreshModels = useRefreshAiModels();

  const models = (draft.cachedModels && draft.cachedModels.length > 0) ? draft.cachedModels : FALLBACK_MODELS;
  const mode: LlmMode | undefined = draft.llmMode;
  const vendor: LlmVendor | undefined = draft.llmVendor;
  const isDual = mode === "dual";

  const vendorModels = vendor ? models.filter((m) => m.provider === vendor) : [];

  const primaryModel = draft.primaryLlm || draft.preferredLlm || "";
  const secondaryModel = draft.secondaryLlm || "";

  const updateField = (patch: Partial<ResearchConfig>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-display">
              <IconBrain className="w-4 h-4 text-primary" />
              LLM Selection
              <InfoTooltip text="Configure the AI model architecture for research. Choose between a dual-model setup (reasoning + workhorse) or a single primary model." />
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
            data-testid="button-refresh-models"
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
            Update LLM List
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label className="text-xs font-medium mb-2 block">Model Architecture</Label>
          <RadioGroup
            value={mode || ""}
            onValueChange={(value) => updateField({ llmMode: value as LlmMode })}
            className="flex flex-col gap-2"
            data-testid="radio-llm-mode"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="dual" id="llm-mode-dual" data-testid="radio-llm-mode-dual" />
              <Label htmlFor="llm-mode-dual" className="text-sm font-normal cursor-pointer">
                Primary reasoning + Secondary workhorse
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="primary-only" id="llm-mode-primary" data-testid="radio-llm-mode-primary" />
              <Label htmlFor="llm-mode-primary" className="text-sm font-normal cursor-pointer">
                Primary reasoning only
              </Label>
            </div>
          </RadioGroup>
        </div>

        {mode && (
          <>
            <div className="max-w-md">
              <Label className="text-xs font-medium mb-1.5 block">Vendor</Label>
              <Select
                value={vendor || ""}
                onValueChange={(value) => {
                  updateField({ llmVendor: value as LlmVendor, primaryLlm: "", secondaryLlm: "", preferredLlm: "" });
                }}
              >
                <SelectTrigger className="bg-card h-9" data-testid="select-llm-vendor">
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {LLM_VENDORS.map((v) => (
                    <SelectItem key={v.value} value={v.value} data-testid={`select-vendor-${v.value}`}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {vendor && (
              <>
                <div className="max-w-md">
                  <Label className="text-xs font-medium mb-1.5 block">Primary Reasoning LLM</Label>
                  <Select
                    value={primaryModel}
                    onValueChange={(value) => updateField({ primaryLlm: value, preferredLlm: value })}
                  >
                    <SelectTrigger className="bg-card h-9" data-testid="select-primary-llm">
                      <SelectValue placeholder={vendorModels.length === 0 ? "No models available for this vendor" : "Select primary model"} />
                    </SelectTrigger>
                    <SelectContent>
                      {primaryModel && !vendorModels.some((m) => m.id === primaryModel) && (
                        <SelectItem value={primaryModel}>{primaryModel} (current)</SelectItem>
                      )}
                      {vendorModels.map((m) => (
                        <SelectItem key={m.id} value={m.id} data-testid={`select-primary-model-${m.id}`}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isDual && (
                  <div className="max-w-md">
                    <Label className="text-xs font-medium mb-1.5 block">Secondary Workhorse LLM</Label>
                    <Select
                      value={secondaryModel}
                      onValueChange={(value) => updateField({ secondaryLlm: value })}
                    >
                      <SelectTrigger className="bg-card h-9" data-testid="select-secondary-llm">
                        <SelectValue placeholder={vendorModels.length === 0 ? "No models available for this vendor" : "Select secondary model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {secondaryModel && !vendorModels.some((m) => m.id === secondaryModel) && (
                          <SelectItem value={secondaryModel}>{secondaryModel} (current)</SelectItem>
                        )}
                        {vendorModels.map((m) => (
                          <SelectItem key={m.id} value={m.id} data-testid={`select-secondary-model-${m.id}`}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface ResearchCenterTabProps {
  initialTab?: string;
  onSaveStateChange?: (state: import("@/components/admin/types/save-state").AdminSaveState | null) => void;
}

export default function ResearchCenterTab({ onSaveStateChange }: ResearchCenterTabProps) {
  const { toast } = useToast();
  const { data: savedConfig, isLoading } = useResearchConfig();
  const saveMutation = useSaveResearchConfig();

  const [draft, setDraft] = useState<ResearchConfig>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (savedConfig) {
      const { marketing, ...rest } = savedConfig as ResearchConfig & { marketing?: unknown };
      const normalized = { ...rest };
      if (!normalized.llmMode && normalized.preferredLlm) {
        normalized.llmMode = "primary-only";
        normalized.primaryLlm = normalized.preferredLlm;
        const allModels = (normalized.cachedModels && normalized.cachedModels.length > 0) ? normalized.cachedModels : FALLBACK_MODELS;
        const match = allModels.find((m) => m.id === normalized.preferredLlm);
        if (match) {
          normalized.llmVendor = match.provider as LlmVendor;
        }
      }
      setDraft(normalized);
      setIsDirty(false);
    }
  }, [savedConfig]);

  function updateConfig(key: "property" | "global" | "company", updated: ResearchEventConfig) {
    setDraft((prev) => ({ ...prev, [key]: updated }));
    setIsDirty(true);
  }

  async function handleSave() {
    try {
      const toSave = { ...draft };
      if (toSave.primaryLlm) {
        toSave.preferredLlm = toSave.primaryLlm;
      }
      if (toSave.llmMode === "primary-only") {
        toSave.secondaryLlm = undefined;
      }
      await saveMutation.mutateAsync(toSave);
      setDraft(toSave);
      setIsDirty(false);
      toast({ title: "Research configuration saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  }

  const saveRef = useRef<(() => void) | undefined>(undefined);
  saveRef.current = handleSave;

  useEffect(() => {
    onSaveStateChange?.({
      isDirty,
      isPending: saveMutation.isPending,
      onSave: () => saveRef.current?.(),
    });
    return () => onSaveStateChange?.(null);
  }, [isDirty, saveMutation.isPending, onSaveStateChange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="research-center-tab">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <IconResearch className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground" data-testid="text-research-center-title">Research Center</h2>
          <p className="text-xs text-muted-foreground">Strategic intelligence hub — company research, property benchmarks, market analysis, and AI engine configuration</p>
        </div>
      </div>

      <Tabs defaultValue="icp" className="w-full">
        <TabsList className="justify-start w-full h-auto flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="icp" className="gap-1.5 text-xs" data-testid="tab-icp-management-co">
            <IconTarget className="w-3.5 h-3.5" />
            ICP Management Co
          </TabsTrigger>
          <TabsTrigger value="properties" className="gap-1.5 text-xs" data-testid="tab-properties">
            <IconProperties className="w-3.5 h-3.5" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="general-market" className="gap-1.5 text-xs" data-testid="tab-general-market">
            <IconTrendingUp className="w-3.5 h-3.5" />
            General Market
          </TabsTrigger>
          <TabsTrigger value="llm" className="gap-1.5 text-xs" data-testid="tab-llm">
            <IconBrain className="w-3.5 h-3.5" />
            LLM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="icp" className="mt-4 space-y-5">
          <IcpResearchSection
            enabled={mergeConfig(draft.company).enabled}
            onToggle={(v) => updateConfig("company", { ...mergeConfig(draft.company), enabled: v })}
          />
          <div className="flex justify-end pb-8">
            <SaveButton
              onClick={handleSave}
              isPending={saveMutation.isPending}
              hasChanges={isDirty}
              data-testid="button-save-icp-config"
            />
          </div>
        </TabsContent>

        <TabsContent value="properties" className="mt-4 space-y-5">
          <PropertyResearchSection
            config={mergeConfig(draft.property)}
            onChange={(c) => updateConfig("property", c)}
          />
          <div className="flex justify-end pb-8">
            <SaveButton
              onClick={handleSave}
              isPending={saveMutation.isPending}
              hasChanges={isDirty}
              data-testid="button-save-property-config"
            />
          </div>
        </TabsContent>

        <TabsContent value="general-market" className="mt-4 space-y-5">
          <MarketResearchSection
            config={mergeConfig(draft.global)}
            onChange={(c) => updateConfig("global", c)}
          />
          <div className="flex justify-end pb-8">
            <SaveButton
              onClick={handleSave}
              isPending={saveMutation.isPending}
              hasChanges={isDirty}
              data-testid="button-save-market-config"
            />
          </div>
        </TabsContent>

        <TabsContent value="llm" className="mt-4 space-y-5">
          <LlmSelectionCard draft={draft} setDraft={setDraft} setIsDirty={setIsDirty} />
          <p className="text-xs text-muted-foreground italic" data-testid="text-llm-note">
            {draft.llmMode === "dual"
              ? "Two models are configured: a primary reasoning LLM for deep analysis and report synthesis, and a secondary workhorse LLM for bulk data tasks. Both are shared across all three research processes."
              : draft.llmMode === "primary-only"
                ? "A single primary reasoning model is configured and shared across all three research processes (ICP Management Co, Properties, General Market)."
                : "Select a model architecture above to configure the LLM(s) used across all three research processes."}
          </p>
          <div className="flex justify-end pb-8">
            <SaveButton
              onClick={() => {
                if (!draft.llmMode) {
                  toast({ title: "Please select a model architecture before saving", variant: "destructive" });
                  return;
                }
                const effectivePrimary = draft.primaryLlm || draft.preferredLlm;
                if (!draft.llmVendor || !effectivePrimary) {
                  toast({ title: "Please select a vendor and primary model before saving", variant: "destructive" });
                  return;
                }
                if (draft.llmMode === "dual" && !draft.secondaryLlm) {
                  toast({ title: "Please select a secondary workhorse model for dual-model mode", variant: "destructive" });
                  return;
                }
                handleSave();
              }}
              isPending={saveMutation.isPending}
              hasChanges={isDirty}
              data-testid="button-save-llm-config"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
