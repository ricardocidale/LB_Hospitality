import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Copy, Check } from "lucide-react";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "./hooks";
import { ADMIN_TEXTAREA } from "./styles";
import {
  type IcpConfig,
  type IcpDescriptive,
  type Priority,
  DEFAULT_ICP_CONFIG,
  DEFAULT_ICP_DESCRIPTIVE,
  PARAMETER_SECTIONS,
  DESCRIPTIVE_SECTIONS,
  PRIORITY_LABELS,
  generateIcpPrompt,
} from "./icp-config";

function PrioritySelect({ value, onChange }: { value: Priority; onChange: (v: Priority) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Priority)}
      className="h-8 rounded border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring min-w-[100px]"
    >
      {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
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
      className="h-8 text-xs bg-card w-[110px] text-right tabular-nums"
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
      className="h-8 text-xs bg-card w-[80px] text-right tabular-nums"
    />
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
          toast({ title: "Saved", description: "ICP profile and generated context saved." });
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
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save
            </Button>
          </div>

          <Tabs defaultValue="parameters" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-9">
              <TabsTrigger value="parameters" className="text-xs" data-testid="tab-parameters">
                Parameters
              </TabsTrigger>
              <TabsTrigger value="descriptive" className="text-xs" data-testid="tab-descriptive">
                Descriptive
              </TabsTrigger>
              <TabsTrigger value="context" className="text-xs" data-testid="tab-context">
                Generated Context
              </TabsTrigger>
            </TabsList>

            <TabsContent value="parameters" className="mt-3">
              <ParametersTab config={config} updateConfig={updateConfig} />
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
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
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

function ParametersTab({
  config,
  updateConfig,
}: {
  config: IcpConfig;
  updateConfig: <K extends keyof IcpConfig>(key: K, value: IcpConfig[K]) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-3">
        All numeric values are editable. Defaults are suggested starting points based on the current portfolio.
      </p>
      {PARAMETER_SECTIONS.map((section) => (
        <details key={section.title} className="group border-b border-border/50">
          <summary className="flex items-center justify-between cursor-pointer py-2 px-1 text-xs font-medium text-foreground/80 hover:text-foreground select-none">
            <span>{section.title}</span>
            <span className="text-[10px] text-muted-foreground group-open:hidden">
              {section.fields.length} fields
            </span>
          </summary>
          <div className="pb-3 pl-1 pr-1">
            <table className="w-full">
              <tbody>
                {section.fields.map((field) => (
                  <tr key={field.key} className="border-b border-border/20 last:border-0">
                    <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap w-[200px]">
                      {field.label}
                    </td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-1.5">
                        {field.type === "priority" ? (
                          <PrioritySelect
                            value={config[field.key as keyof IcpConfig] as Priority}
                            onChange={(v) => updateConfig(field.key as keyof IcpConfig, v as any)}
                          />
                        ) : field.type === "currency" ? (
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
                        {field.suffix && (
                          <span className="text-[10px] text-muted-foreground ml-0.5">{field.suffix}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}
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
