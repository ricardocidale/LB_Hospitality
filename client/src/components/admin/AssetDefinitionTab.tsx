import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, ChevronDown } from "lucide-react";
import { IconSave, IconCopy, IconHelpCircle } from "@/components/icons";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "./hooks";
import { ADMIN_TEXTAREA } from "./styles";
import {
  type IcpConfig,
  type IcpDescriptive,
  type Priority,
  type UnitType,
  DEFAULT_ICP_CONFIG,
  DEFAULT_ICP_DESCRIPTIVE,
  PARAMETER_SECTIONS,
  DESCRIPTIVE_SECTIONS,
  PRIORITY_LABELS,
  UNIT_DEFS,
  generateIcpPrompt,
} from "./icp-config";

function PriorityBadge({ value, onChange }: { value: Priority; onChange?: (v: Priority) => void }) {
  if (onChange) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Priority)}
        className={`h-6 rounded-full border text-[10px] font-medium px-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${
          value === "must"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
            : value === "nice"
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              : "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20"
        }`}
        data-testid="select-priority"
      >
        {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
    );
  }
  return (
    <span className={`inline-flex items-center h-5 rounded-full text-[10px] font-medium px-2 ${
      value === "must"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : value === "nice"
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          : "bg-red-500/10 text-red-500 dark:text-red-400"
    }`}>
      {PRIORITY_LABELS[value]}
    </span>
  );
}

function CurrencyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const display = value >= 1000 ? value.toLocaleString() : String(value);
  const [local, setLocal] = useState(display);

  useEffect(() => {
    setLocal(value >= 1000 ? value.toLocaleString() : String(value));
  }, [value]);

  return (
    <Input
      value={local}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        setLocal(raw ? Number(raw).toLocaleString() : "");
      }}
      onBlur={() => {
        const num = Number(local.replace(/[^0-9]/g, "")) || 0;
        onChange(num);
      }}
      className="h-7 text-xs bg-card w-[110px] text-right tabular-nums"
    />
  );
}

function NumberInput({ value, onChange, step }: { value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <Input
      type="number"
      value={value}
      step={step || 1}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="h-7 text-xs bg-card w-[80px] text-right tabular-nums"
    />
  );
}

function UnitLabel({ unitType, suffix }: { unitType?: UnitType; suffix?: string }) {
  if (unitType && unitType !== "none") {
    const def = UNIT_DEFS[unitType];
    return (
      <span className="text-[10px] text-muted-foreground ml-1 whitespace-nowrap">
        {def.imperial}
      </span>
    );
  }
  if (suffix) {
    return <span className="text-[10px] text-muted-foreground ml-1 whitespace-nowrap">{suffix}</span>;
  }
  return null;
}

function HelpTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors ml-1 shrink-0">
            <IconHelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function AssetDefinitionTab() {
  const { toast } = useToast();
  const { data: ga } = useGlobalAssumptions();
  const updateMutation = useUpdateGlobalAssumptions();

  const [propertyLabel, setPropertyLabel] = useState("");
  const [config, setConfig] = useState<IcpConfig>(DEFAULT_ICP_CONFIG);
  const [desc, setDesc] = useState<IcpDescriptive>(DEFAULT_ICP_DESCRIPTIVE);
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (ga) {
      setPropertyLabel(ga.propertyLabel || "Boutique Hotel");
      if (ga.icpConfig) {
        setConfig({ ...DEFAULT_ICP_CONFIG, ...(ga.icpConfig as Partial<IcpConfig>) });
        if ((ga.icpConfig as any)._descriptive) {
          setDesc({ ...DEFAULT_ICP_DESCRIPTIVE, ...((ga.icpConfig as any)._descriptive as Partial<IcpDescriptive>) });
        }
      }
      setDirty(false);
    }
  }, [ga]);

  const updateConfig = useCallback(<K extends keyof IcpConfig>(key: K, value: IcpConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const updateDesc = useCallback(<K extends keyof IcpDescriptive>(key: K, value: string) => {
    setDesc((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const generatedPrompt = useMemo(
    () => generateIcpPrompt(config, desc, propertyLabel),
    [config, desc, propertyLabel]
  );

  const handleSave = () => {
    const icpConfig = { ...config, _descriptive: desc };
    updateMutation.mutate(
      { propertyLabel, assetDescription: generatedPrompt, icpConfig },
      {
        onSuccess: () => {
          setDirty(false);
          toast({ title: "Saved", description: "Amenities profile and generated context saved." });
        },
      }
    );
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Ideal Customer Profile — Asset Definition
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Define the target property profile with deterministic parameters and descriptive context.
            The generated prompt combines both into an optimized context served to AI research engines.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-md space-y-1">
              <Label className="label-text text-foreground text-xs">ICP Label</Label>
              <Input
                value={propertyLabel}
                onChange={(e) => { setPropertyLabel(e.target.value); setDirty(true); }}
                placeholder="e.g., Boutique Hotel"
                className="bg-card h-8 text-sm"
                data-testid="input-property-label"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={!dirty || updateMutation.isPending}
              size="sm"
              data-testid="button-save-icp"
            >
              <IconSave className="w-3.5 h-3.5 mr-1.5" />
              Save
            </Button>
          </div>

          <Tabs defaultValue="amenities" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-9">
              <TabsTrigger value="amenities" className="text-xs" data-testid="tab-amenities">
                Amenities
              </TabsTrigger>
              <TabsTrigger value="descriptive" className="text-xs" data-testid="tab-descriptive">
                Descriptive
              </TabsTrigger>
              <TabsTrigger value="context" className="text-xs" data-testid="tab-context">
                Generated Context
              </TabsTrigger>
            </TabsList>

            <TabsContent value="amenities" className="mt-3">
              <AmenitiesTab config={config} updateConfig={updateConfig} />
            </TabsContent>

            <TabsContent value="descriptive" className="mt-3">
              <DescriptiveTab desc={desc} updateDesc={updateDesc} />
            </TabsContent>

            <TabsContent value="context" className="mt-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    This is the combined prompt that will be served to the LLM.
                    It merges all parameters and descriptive inputs into an optimized context.
                  </p>
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="text-xs h-7 gap-1">
                    {copied ? <Check className="w-3 h-3" /> : <IconCopy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <pre
                  className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-foreground/90 bg-muted/40 border border-border rounded p-4 max-h-[600px] overflow-y-auto"
                  data-testid="text-generated-context"
                >
                  {generatedPrompt}
                </pre>
                <p className="text-xs text-muted-foreground italic">
                  {generatedPrompt.length.toLocaleString()} characters
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function AmenitiesTab({
  config,
  updateConfig,
}: {
  config: IcpConfig;
  updateConfig: <K extends keyof IcpConfig>(key: K, value: IcpConfig[K]) => void;
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <div className="space-y-0">
      <p className="text-xs text-muted-foreground mb-4">
        All numeric values are editable. Defaults are suggested starting points based on the current portfolio.
        Each feature is marked as <span className="font-medium text-emerald-600 dark:text-emerald-400">Required</span> or <span className="font-medium text-amber-600 dark:text-amber-400">Nice to Have</span>.
      </p>
      {PARAMETER_SECTIONS.map((section, sIdx) => {
        const isOpen = openSections.has(section.title);
        return (
          <div key={section.title} className={`border-b border-border/60 ${sIdx % 2 === 1 ? "bg-muted/20" : ""}`}>
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              className="flex items-center justify-between w-full py-3 px-3 text-left hover:bg-muted/40 transition-colors group"
              data-testid={`accordion-${section.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
            >
              <span className="text-sm font-semibold text-foreground group-hover:text-foreground/90">
                {section.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {section.fields.length} {section.fields.length === 1 ? "feature" : "features"}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isOpen && (
              <div className="px-3 pb-3">
                <table className="w-full">
                  <tbody>
                    {section.fields.map((field, rowIdx) => {
                      const priority: Priority = field.type === "priority"
                        ? (config[field.key as keyof IcpConfig] as Priority)
                        : field.linkedPriority
                          ? (config[field.linkedPriority as keyof IcpConfig] as Priority)
                          : "must";

                      return (
                        <tr
                          key={field.key}
                          className={`border-b border-border/20 last:border-0 ${rowIdx % 2 === 1 ? "bg-muted/30" : ""}`}
                          data-testid={`row-amenity-${field.key}`}
                        >
                          <td className="py-2 pr-2 w-[32px] align-middle">
                            {field.type === "priority" ? (
                              <PriorityBadge
                                value={config[field.key as keyof IcpConfig] as Priority}
                                onChange={(v) => updateConfig(field.key as keyof IcpConfig, v as any)}
                              />
                            ) : (
                              <PriorityBadge value={priority} />
                            )}
                          </td>
                          <td className="py-2 pr-3 text-xs text-foreground/80 whitespace-nowrap align-middle">
                            <div className="flex items-center">
                              <span>{field.label}</span>
                              {field.help && <HelpTooltip text={field.help} />}
                            </div>
                          </td>
                          <td className="py-2 align-middle">
                            {field.type === "priority" ? null : (
                              <div className="flex items-center gap-1.5 justify-end">
                                {field.type === "currency" ? (
                                  <>
                                    <span className="text-xs text-muted-foreground">$</span>
                                    <CurrencyInput
                                      value={config[field.key as keyof IcpConfig] as number}
                                      onChange={(v) => updateConfig(field.key as keyof IcpConfig, v as any)}
                                    />
                                  </>
                                ) : (
                                  <NumberInput
                                    value={config[field.key as keyof IcpConfig] as number}
                                    onChange={(v) => updateConfig(field.key as keyof IcpConfig, v as any)}
                                    step={field.suffix === "%" && !field.key.includes("Share") ? 1 : undefined}
                                  />
                                )}
                                {field.pair && (
                                  <>
                                    <span className="text-[10px] text-muted-foreground">{field.pairLabel}</span>
                                    {field.type === "currency" ? (
                                      <>
                                        <span className="text-xs text-muted-foreground">$</span>
                                        <CurrencyInput
                                          value={config[field.pair as keyof IcpConfig] as number}
                                          onChange={(v) => updateConfig(field.pair as keyof IcpConfig, v as any)}
                                        />
                                      </>
                                    ) : (
                                      <NumberInput
                                        value={config[field.pair as keyof IcpConfig] as number}
                                        onChange={(v) => updateConfig(field.pair as keyof IcpConfig, v as any)}
                                      />
                                    )}
                                  </>
                                )}
                                <UnitLabel unitType={field.unitType} suffix={field.suffix} />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DescriptiveTab({
  desc,
  updateDesc,
}: {
  desc: IcpDescriptive;
  updateDesc: <K extends keyof IcpDescriptive>(key: K, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Qualitative descriptions and preferences. These are combined with the numeric parameters
        to produce the full ICP context.
      </p>
      {DESCRIPTIVE_SECTIONS.map((section) => (
        <div key={section.key} className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground/80">{section.label}</Label>
          <textarea
            value={desc[section.key]}
            onChange={(e) => updateDesc(section.key, e.target.value)}
            rows={section.rows}
            className={ADMIN_TEXTAREA + " text-xs"}
            data-testid={`input-icp-${section.key}`}
          />
          <p className="text-[10px] text-muted-foreground">{section.help}</p>
        </div>
      ))}
    </div>
  );
}
