/**
 * Settings.tsx — Systemwide assumptions configuration page.
 *
 * This page lets management-level users configure the "global" variables that
 * drive the entire financial model. Unlike CompanyAssumptions (which focuses on
 * the management company's P&L), this page covers:
 *
 * Portfolio tab:
 *   • General Property Description — target property profile used for market
 *     research: room count range, ADR range, amenities (F&B, events, wellness),
 *     property level (budget/average/luxury), event capacity, acreage, privacy
 *   • Standard Acquisition Package — default purchase price, pre-opening costs,
 *     operating reserve, and building improvements for new properties
 *   • Debt Assumptions — LTV ratios (acquisition and refinance), interest rates,
 *     amortization periods, closing cost rates
 *   • Per-property overrides for key financial inputs
 *
 * Macro tab:
 *   • Model timeline — start date, projection years, fiscal year start month
 *   • Inflation and escalation rates
 *   • Display settings (show/hide calculation detail rows)
 *
 * Other tab:
 *   • AI model preference (which LLM to use for research generation)
 *   • Miscellaneous configuration
 *
 * Industry Research tab:
 *   • Configure and trigger AI-powered market research generation
 *   • Select focus areas, regions, and time horizon
 *   • Manage custom research questions
 *   • View streamed research output in real time via SSE
 *
 * Changes are saved to the global_assumptions table and trigger a full
 * financial recalculation across all properties and dashboards.
 */
import Layout from "@/components/Layout";
import { useGlobalAssumptions, useUpdateGlobalAssumptions, useProperties, useUpdateProperty, useMarketResearch, useResearchQuestions, useCreateResearchQuestion, useUpdateResearchQuestion, useDeleteResearchQuestion } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, CurrentThemeTab } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Hotel, Globe, Sliders, Search, RefreshCw, TrendingUp, Landmark, Sparkles, AlertTriangle, Check, Plus, Pencil, Trash2, X, MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { SaveButton } from "@/components/ui/save-button";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { useState, useRef, useCallback } from "react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DEFAULT_COMMISSION_RATE,
  DEFAULT_LTV,
  DEFAULT_ACQ_CLOSING_COST_RATE,
  DEFAULT_REFI_LTV,
  DEFAULT_INTEREST_RATE,
  DEFAULT_REFI_CLOSING_COST_RATE,
} from "@/lib/constants";
import { formatMoneyInput, parseMoneyInput } from "@/lib/formatters";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const FOCUS_AREA_OPTIONS = [
  { id: "market", label: "Market Overview & Trends" },
  { id: "events", label: "Event Hospitality (wellness, corporate, yoga, relationship retreats)" },
  { id: "benchmarks", label: "Financial Benchmarks (ADR, occupancy, RevPAR)" },
  { id: "caprates", label: "Cap Rates & Investment Returns" },
  { id: "debt", label: "Debt Market Conditions" },
  { id: "emerging", label: "Emerging Trends in Experiential Hospitality" },
  { id: "supply", label: "New Supply Pipeline & Construction Activity" },
  { id: "labor", label: "Labor Market & Staffing Trends" },
  { id: "technology", label: "Technology & PropTech Adoption" },
  { id: "sustainability", label: "Sustainability & ESG in Hospitality" },
];

const REGION_OPTIONS = [
  { id: "north_america", label: "North America" },
  { id: "latin_america", label: "Latin America" },
  { id: "europe", label: "Europe" },
  { id: "asia_pacific", label: "Asia Pacific" },
  { id: "middle_east", label: "Middle East & Africa" },
  { id: "caribbean", label: "Caribbean" },
];

const TIME_HORIZON_OPTIONS = [
  { value: "1 year", label: "1 Year" },
  { value: "3 years", label: "3 Years" },
  { value: "5 years", label: "5 Years" },
  { value: "10 years", label: "10 Years" },
];

export default function Settings() {
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: research } = useMarketResearch("global");
  const updateGlobal = useUpdateGlobalAssumptions();
  const updateProperty = useUpdateProperty();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [globalDraft, setGlobalDraft] = useState<any>(null);
  const [propertyDrafts, setPropertyDrafts] = useState<Record<number, any>>({});
  const [settingsTab, setSettingsTab] = useState("portfolio");
  
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(
    FOCUS_AREA_OPTIONS.slice(0, 6).map(o => o.label)
  );
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["North America", "Latin America"]);
  const [timeHorizon, setTimeHorizon] = useState("5 years");
  const { data: researchQuestions = [] } = useResearchQuestions();
  const createQuestion = useCreateResearchQuestion();
  const updateQuestion = useUpdateResearchQuestion();
  const deleteQuestion = useDeleteResearchQuestion();
  const [newQuestion, setNewQuestion] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  if (globalLoading || propertiesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!global || !properties) return null;

  const currentGlobal = globalDraft || global;

  // Generic handler for top-level global assumption fields.
  // Auto-converts string values to numbers unless the field is known to be text
  // (e.g. "preferredLlm", "companyName"). Boolean values pass through directly.
  const handleGlobalChange = (key: string, value: string | boolean) => {
    if (typeof value === "boolean") {
      setGlobalDraft({ ...currentGlobal, [key]: value });
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && key !== "preferredLlm" && key !== "companyName") {
      setGlobalDraft({ ...currentGlobal, [key]: numValue });
    } else {
      setGlobalDraft({ ...currentGlobal, [key]: value });
    }
  };

  // Handler for nested JSON objects like `assetDefinition` and `debtAssumptions`.
  // Merges the changed field into the existing nested object on the draft.
  const handleNestedChange = (parent: string, key: string, value: string | boolean) => {
    if (typeof value === "boolean") {
      setGlobalDraft({
        ...currentGlobal,
        [parent]: { ...(currentGlobal as any)[parent], [key]: value }
      });
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setGlobalDraft({
          ...currentGlobal,
          [parent]: { ...(currentGlobal as any)[parent], [key]: numValue }
        });
      } else {
        setGlobalDraft({
          ...currentGlobal,
          [parent]: { ...(currentGlobal as any)[parent], [key]: value }
        });
      }
    }
  };

  const handlePropertyChange = (id: number, key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setPropertyDrafts({
        ...propertyDrafts,
        [id]: { ...(propertyDrafts[id] || {}), [key]: numValue }
      });
    }
  };

  const handlePropertyMoneyChange = (id: number, key: string, value: string) => {
    const numValue = parseMoneyInput(value);
    setPropertyDrafts({
      ...propertyDrafts,
      [id]: { ...(propertyDrafts[id] || {}), [key]: numValue }
    });
  };

  // Trigger server-side AI research generation and stream results in real time.
  // The server uses Server-Sent Events (SSE) to push partial content as the LLM
  // generates it, so the user can watch the report build progressively.
  const generateResearch = useCallback(async () => {
    setIsGenerating(true);
    setStreamedContent("");
    abortRef.current = new AbortController();
    
    try {
      const response = await fetch("/api/research/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "global",
          researchVariables: {
            focusAreas: selectedFocusAreas,
            regions: selectedRegions,
            timeHorizon,
          },
        }),
        signal: abortRef.current.signal,
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setStreamedContent(accumulated);
              }
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: ["research", "global"] });
              }
            } catch {}
          }
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        toast({ title: "Error", description: "Research generation failed. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [selectedFocusAreas, selectedRegions, timeHorizon, queryClient, toast]);

  const handleSaveGlobal = () => {
    if (globalDraft) {
      updateGlobal.mutate(globalDraft, {
        onSuccess: () => {
          toast({ title: "Saved", description: "Systemwide assumptions updated successfully." });
          setGlobalDraft(null);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save systemwide assumptions.", variant: "destructive" });
        }
      });
    }
  };

  const handleSaveProperty = (id: number) => {
    if (propertyDrafts[id]) {
      updateProperty.mutate({ id, data: propertyDrafts[id] }, {
        onSuccess: () => {
          toast({ title: "Saved", description: "Property updated successfully." });
          setPropertyDrafts({ ...propertyDrafts, [id]: undefined });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save property.", variant: "destructive" });
        }
      });
    }
  };


  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Systemwide Assumptions"
          subtitle="Configure variables driving the financial model"
          variant="dark"
          actions={
            settingsTab !== "research" ? (
              <SaveButton 
                onClick={handleSaveGlobal} 
                disabled={!globalDraft} 
                isPending={updateGlobal.isPending} 
              />
            ) : undefined
          }
        />

        <Tabs value={settingsTab} onValueChange={setSettingsTab} className="w-full">
          <CurrentThemeTab
            tabs={[
              { value: 'portfolio', label: 'Portfolio', icon: Hotel },
              { value: 'macro', label: 'Macro', icon: Globe },
              { value: 'other', label: 'Other', icon: Sliders },
              { value: 'research', label: 'Industry Research', icon: Search }
            ]}
            activeTab={settingsTab}
            onTabChange={setSettingsTab}
          />

          <TabsContent value="portfolio" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Hotel className="w-5 h-5 text-primary" />
                  General Property Description
                  <HelpTooltip text="Defines the target property profile for the portfolio. These parameters guide market research searches, comp set analysis, and financial benchmarks." manualSection="global-assumptions" />
                </CardTitle>
                <CardDescription className="label-text">Characterize the target property profile for the portfolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text flex items-center gap-1">Minimum Rooms <HelpTooltip text="Minimum number of guest rooms for the target property profile. Used to filter market research and comparable properties." /></Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.minRooms ?? 10}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.assetDefinition?.minRooms ?? 10]}
                      onValueChange={(vals) => handleNestedChange("assetDefinition", "minRooms", vals[0].toString())}
                      min={5}
                      max={50}
                      step={5}
                      data-testid="slider-asset-min-rooms"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5</span>
                      <span>50</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text flex items-center gap-1">Maximum Rooms <HelpTooltip text="Maximum number of guest rooms for the target property profile. Defines the upper bound for comp set analysis." /></Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.maxRooms ?? 80}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.assetDefinition?.maxRooms ?? 80]}
                      onValueChange={(vals) => handleNestedChange("assetDefinition", "maxRooms", vals[0].toString())}
                      min={20}
                      max={200}
                      step={10}
                      data-testid="slider-asset-max-rooms"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>20</span>
                      <span>200</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text flex items-center gap-1">Minimum ADR <HelpTooltip text="Minimum Average Daily Rate target. Sets the floor for market research rate comparisons." /></Label>
                      <span className="text-sm font-mono text-primary">${currentGlobal.assetDefinition?.minAdr ?? 150}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.assetDefinition?.minAdr ?? 150]}
                      onValueChange={(vals) => handleNestedChange("assetDefinition", "minAdr", vals[0].toString())}
                      min={50}
                      max={500}
                      step={25}
                      data-testid="slider-asset-min-adr"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$50</span>
                      <span>$500</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text flex items-center gap-1">Maximum ADR <HelpTooltip text="Maximum Average Daily Rate target. Sets the ceiling for market research rate comparisons." /></Label>
                      <span className="text-sm font-mono text-primary">${currentGlobal.assetDefinition?.maxAdr ?? 600}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.assetDefinition?.maxAdr ?? 600]}
                      onValueChange={(vals) => handleNestedChange("assetDefinition", "maxAdr", vals[0].toString())}
                      min={200}
                      max={1500}
                      step={50}
                      data-testid="slider-asset-max-adr"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$200</span>
                      <span>$1,500</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label className="label-text flex items-center gap-1">Food & Beverage (F&B) <HelpTooltip text="Whether target properties include Food & Beverage operations like restaurants and bars." /></Label>
                    <Switch
                      checked={currentGlobal.assetDefinition?.hasFB ?? true}
                      onCheckedChange={(checked) => handleNestedChange("assetDefinition", "hasFB", checked)}
                      data-testid="switch-asset-fb"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label className="label-text flex items-center gap-1">Event Hosting <HelpTooltip text="Whether target properties host events such as weddings, corporate meetings, and social gatherings." /></Label>
                    <Switch
                      checked={currentGlobal.assetDefinition?.hasEvents ?? true}
                      onCheckedChange={(checked) => handleNestedChange("assetDefinition", "hasEvents", checked)}
                      data-testid="switch-asset-events"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label className="label-text flex items-center gap-1">Wellness Programming <HelpTooltip text="Whether target properties include spa or wellness services like massage, yoga, and fitness programs." /></Label>
                    <Switch
                      checked={currentGlobal.assetDefinition?.hasWellness ?? true}
                      onCheckedChange={(checked) => handleNestedChange("assetDefinition", "hasWellness", checked)}
                      data-testid="switch-asset-wellness"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="label-text flex items-center gap-1">Property Level <HelpTooltip text="Service tier classification: Budget, Average, or Luxury. Affects comp set selection and benchmark ranges." /></Label>
                    <RadioGroup
                      value={currentGlobal.assetDefinition?.level ?? "luxury"}
                      onValueChange={(val) => handleNestedChange("assetDefinition", "level", val)}
                      className="flex gap-6"
                      data-testid="radio-asset-level"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="budget" id="level-budget" data-testid="radio-asset-level-budget" />
                        <Label htmlFor="level-budget" className="label-text cursor-pointer">Budget</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="average" id="level-average" data-testid="radio-asset-level-average" />
                        <Label htmlFor="level-average" className="label-text cursor-pointer">Average</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="luxury" id="level-luxury" data-testid="radio-asset-level-luxury" />
                        <Label htmlFor="level-luxury" className="label-text cursor-pointer">Luxury</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label className="label-text flex items-center gap-1">Privacy Level <HelpTooltip text="Level of guest privacy: High for secluded estates, Moderate for suburban settings, Low for urban locations." /></Label>
                    <RadioGroup
                      value={currentGlobal.assetDefinition?.privacyLevel ?? "high"}
                      onValueChange={(val) => handleNestedChange("assetDefinition", "privacyLevel", val)}
                      className="flex gap-6"
                      data-testid="radio-asset-privacy"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="low" id="privacy-low" data-testid="radio-asset-privacy-low" />
                        <Label htmlFor="privacy-low" className="label-text cursor-pointer">Low</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="moderate" id="privacy-moderate" data-testid="radio-asset-privacy-moderate" />
                        <Label htmlFor="privacy-moderate" className="label-text cursor-pointer">Moderate</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="high" id="privacy-high" data-testid="radio-asset-privacy-high" />
                        <Label htmlFor="privacy-high" className="label-text cursor-pointer">High</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text flex items-center gap-1">Event Locations <HelpTooltip text="Number of distinct event spaces available on the property (ballrooms, gardens, terraces, etc.)." /></Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.eventLocations ?? 2}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.assetDefinition?.eventLocations ?? 2]}
                      onValueChange={(vals) => handleNestedChange("assetDefinition", "eventLocations", vals[0].toString())}
                      min={0}
                      max={10}
                      step={1}
                      data-testid="slider-asset-event-locations"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>10</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text flex items-center gap-1">Max Event Capacity <HelpTooltip text="Maximum number of guests that can be accommodated at events across all event spaces." /></Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.maxEventCapacity ?? 150}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.assetDefinition?.maxEventCapacity ?? 150]}
                      onValueChange={(vals) => handleNestedChange("assetDefinition", "maxEventCapacity", vals[0].toString())}
                      min={20}
                      max={500}
                      step={10}
                      data-testid="slider-asset-max-event-capacity"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>20</span>
                      <span>500</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text flex items-center gap-1">Parking Spaces <HelpTooltip text="Number of on-site parking spaces available for guests and event attendees." /></Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.parkingSpaces ?? 50}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.assetDefinition?.parkingSpaces ?? 50]}
                      onValueChange={(vals) => handleNestedChange("assetDefinition", "parkingSpaces", vals[0].toString())}
                      min={0}
                      max={200}
                      step={5}
                      data-testid="slider-asset-parking"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>200</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text flex items-center gap-1">Acreage <HelpTooltip text="Total property land area in acres. Larger acreage typically supports more amenities and privacy." /></Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.acreage ?? 5} acres</span>
                    </div>
                    <Slider
                      value={[currentGlobal.assetDefinition?.acreage ?? 5]}
                      onValueChange={(vals) => handleNestedChange("assetDefinition", "acreage", vals[0].toString())}
                      min={1}
                      max={100}
                      step={1}
                      data-testid="slider-asset-acreage"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 acre</span>
                      <span>100 acres</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="label-text flex items-center gap-1">Definition Summary <HelpTooltip text="Free-text description of the target property concept. Included in AI research prompts for more relevant market analysis." /></Label>
                  <Textarea
                    value={currentGlobal.assetDefinition?.description ?? ""}
                    onChange={(e) => handleNestedChange("assetDefinition", "description", e.target.value)}
                    rows={3}
                    className="bg-white text-sm"
                    data-testid="textarea-boutique-description"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  Disposition — Defaults for New Properties
                  <HelpTooltip text="Default sale commission for newly created properties. Each property can override this in its own settings." manualSection="global-assumptions" />
                </CardTitle>
                <CardDescription className="label-text">Default costs applied to new properties at creation. Override per property in Property Edit.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">Real Estate Commission <HelpTooltip text="Broker commission percentage paid on property sale. Industry standard is 4–6%, split between buyer's and seller's agents." /></Label>
                    <span className="text-sm font-mono text-primary">{((currentGlobal.commissionRate || DEFAULT_COMMISSION_RATE) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.commissionRate || DEFAULT_COMMISSION_RATE) * 100]}
                    onValueChange={(vals) => handleGlobalChange("commissionRate", (vals[0] / 100).toString())}
                    min={0}
                    max={10}
                    step={0.5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  Acquisition Financing — Defaults for New Properties
                  <HelpTooltip text="Default loan terms applied to newly created properties. Each property can override these in its own settings." />
                </CardTitle>
                <CardDescription className="label-text">Default loan terms applied to new properties at creation. Override per property in Property Edit.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">LTV <HelpTooltip text="Loan-to-Value ratio — percentage of purchase price financed by debt. Typical hotel acquisitions use 60–75% LTV." /></Label>
                    <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.acqLTV || DEFAULT_LTV) * 100).toFixed(0)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.acqLTV || DEFAULT_LTV) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "acqLTV", (vals[0] / 100).toString())}
                    min={0}
                    max={90}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>90%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">Interest Rate <HelpTooltip text="Annual interest rate on the acquisition loan. Market rates vary; currently 6–8% for commercial hospitality loans." /></Label>
                    <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.interestRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.interestRate || 0) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "interestRate", (vals[0] / 100).toString())}
                    min={0}
                    max={15}
                    step={0.25}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>0%</span>
                    <span>15%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">Term <HelpTooltip text="Loan amortization period in years. Standard commercial mortgages use 20–30 year amortization." /></Label>
                    <span className="text-sm font-mono text-primary whitespace-nowrap">{currentGlobal.debtAssumptions?.amortizationYears || 25} yrs</span>
                  </div>
                  <Slider 
                    value={[currentGlobal.debtAssumptions?.amortizationYears || 25]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "amortizationYears", vals[0].toString())}
                    min={5}
                    max={30}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="whitespace-nowrap">5 yrs</span>
                    <span className="whitespace-nowrap">30 yrs</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">Closing Costs <HelpTooltip text="Transaction costs as a percentage of loan amount — includes lender fees, legal, appraisal, and title insurance." /></Label>
                    <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.acqClosingCostRate || DEFAULT_ACQ_CLOSING_COST_RATE) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.acqClosingCostRate || DEFAULT_ACQ_CLOSING_COST_RATE) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "acqClosingCostRate", (vals[0] / 100).toString())}
                    min={0}
                    max={5}
                    step={0.25}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>0%</span>
                    <span>5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  Refinancing — Defaults for New Properties
                  <HelpTooltip text="Default refinancing terms applied to newly created properties. Each property can override these in its own settings." manualSection="funding-financing" />
                </CardTitle>
                <CardDescription className="label-text">Default refinancing terms applied to new properties at creation. Override per property in Property Edit.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">Years After Acq. <HelpTooltip text="Number of years after acquisition before refinancing. Typically 2–5 years to allow value appreciation." /></Label>
                    <span className="text-sm font-mono text-primary whitespace-nowrap">{currentGlobal.debtAssumptions?.refiPeriodYears || 3} yrs</span>
                  </div>
                  <Slider 
                    value={[currentGlobal.debtAssumptions?.refiPeriodYears || 3]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiPeriodYears", vals[0].toString())}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">LTV <HelpTooltip text="Refinance Loan-to-Value ratio. Often higher than acquisition LTV (up to 75%) based on appreciated value." /></Label>
                    <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiLTV || DEFAULT_REFI_LTV) * 100).toFixed(0)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.refiLTV || DEFAULT_REFI_LTV) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiLTV", (vals[0] / 100).toString())}
                    min={0}
                    max={80}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>0%</span>
                    <span>80%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">Interest Rate <HelpTooltip text="Annual interest rate for the refinance loan. May differ from acquisition rate based on market conditions." /></Label>
                    <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiInterestRate || DEFAULT_INTEREST_RATE) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.refiInterestRate || DEFAULT_INTEREST_RATE) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiInterestRate", (vals[0] / 100).toString())}
                    min={0}
                    max={15}
                    step={0.25}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>15%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">Term <HelpTooltip text="Refinance loan amortization period in years." /></Label>
                    <span className="text-sm font-mono text-primary whitespace-nowrap">{currentGlobal.debtAssumptions?.refiAmortizationYears || 25} yrs</span>
                  </div>
                  <Slider 
                    value={[currentGlobal.debtAssumptions?.refiAmortizationYears || 25]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiAmortizationYears", vals[0].toString())}
                    min={5}
                    max={30}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>5</span>
                    <span>30</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">Closing Costs <HelpTooltip text="Refinance closing costs as a percentage of the new loan amount." /></Label>
                    <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.refiClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiClosingCostRate", (vals[0] / 100).toString())}
                    min={0}
                    max={5}
                    step={0.25}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <SaveButton 
              onClick={handleSaveGlobal} 
              disabled={!globalDraft} 
              isPending={updateGlobal.isPending} 
            />
          </TabsContent>

          <TabsContent value="macro" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="font-display">Economic Assumptions</CardTitle>
                <CardDescription className="label-text">Market-wide economic factors affecting the model</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="label-text">Fiscal Year Start Month</Label>
                    <HelpTooltip text="The month when the fiscal year begins. Financial statements will group data into fiscal years starting from this month." />
                  </div>
                  <Select
                    value={String(currentGlobal.fiscalYearStartMonth ?? 1)}
                    onValueChange={(val) => setGlobalDraft({ ...currentGlobal, fiscalYearStartMonth: parseInt(val) })}
                  >
                    <SelectTrigger data-testid="select-fiscal-year-month">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="2">February</SelectItem>
                      <SelectItem value="3">March</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">May</SelectItem>
                      <SelectItem value="6">June</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="8">August</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">Inflation Escalator Factor <HelpTooltip text="Annual inflation rate that escalates fixed operating costs (Admin & General, Property Ops, Insurance, Taxes, IT, Utilities-fixed, Other) each year. Fixed costs use Year 1 base dollar amounts × (1 + this rate)^year. Based on CPI forecasts — the Federal Reserve targets 2% annually." manualSection="global-assumptions" /></Label>
                    <span className="text-sm font-mono text-primary">{(currentGlobal.inflationRate * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[currentGlobal.inflationRate * 100]}
                    onValueChange={(vals) => handleGlobalChange("inflationRate", (vals[0] / 100).toString())}
                    min={0}
                    max={10}
                    step={0.1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <SaveButton 
              onClick={handleSaveGlobal} 
              disabled={!globalDraft} 
              isPending={updateGlobal.isPending} 
            />
          </TabsContent>

          <TabsContent value="other" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Sliders className="w-5 h-5 text-primary" />
                  Calculation Transparency
                  <HelpTooltip text="Control whether formula breakdowns and help icons are visible in financial reports. When turned on, tables show expandable rows with step-by-step calculations and help icons explaining each line item. When turned off, tables display clean numbers only — ideal for investor presentations." manualSection="financial-statements" />
                </CardTitle>
                <CardDescription className="label-text">Show or hide the formula verification details and help icons in financial statements.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label className="label-text font-medium flex items-center gap-1">Management Company Reports <HelpTooltip text="When ON, the Company page financial statements show expandable formula rows and help icons that explain how each line item is calculated. Turn OFF for a clean investor-ready view with numbers only." /></Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Income statement, cash flow, and balance sheet on the Company page</p>
                  </div>
                  <Switch
                    checked={currentGlobal.showCompanyCalculationDetails ?? true}
                    onCheckedChange={(checked) => handleGlobalChange("showCompanyCalculationDetails", checked)}
                    data-testid="switch-company-calc-details"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label className="label-text font-medium flex items-center gap-1">Property Reports <HelpTooltip text="When ON, all property-level financial statements show expandable formula rows and help icons that explain how each line item is calculated — including fixed-cost escalation factors and revenue breakdowns. Turn OFF for clean investor presentations across all properties." /></Label>
                    <p className="text-xs text-muted-foreground mt-0.5">All property-level income statements, cash flows, and balance sheets</p>
                  </div>
                  <Switch
                    checked={currentGlobal.showPropertyCalculationDetails ?? true}
                    onCheckedChange={(checked) => handleGlobalChange("showPropertyCalculationDetails", checked)}
                    data-testid="switch-property-calc-details"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  AI Research Model
                  <HelpTooltip text="Choose which AI model powers the market research feature. Different models have different strengths — OpenAI GPT models are great for structured data, Claude excels at reasoning, and Gemini offers fast analysis." />
                </CardTitle>
                <CardDescription className="label-text">Select the AI model used for generating market research reports.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-sm">
                  <Label className="label-text flex items-center gap-1">Preferred Model <HelpTooltip text="The AI model used for generating market research. Each model has different strengths for analysis." /></Label>
                  <Select
                    value={currentGlobal.preferredLlm || "gpt-4o"}
                    onValueChange={(value) => handleGlobalChange("preferredLlm", value)}
                  >
                    <SelectTrigger className="bg-white" data-testid="select-preferred-llm">
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


            <SaveButton 
              onClick={handleSaveGlobal} 
              disabled={!globalDraft} 
              isPending={updateGlobal.isPending} 
            />
          </TabsContent>

          <TabsContent value="research" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Globe className="w-5 h-5 text-primary" />
                  Your Model Context
                  <HelpTooltip text="These values come from your systemwide assumptions and are automatically included in the research prompt so the AI tailors its analysis to your portfolio." />
                </CardTitle>
                <CardDescription className="label-text">These systemwide settings shape your research. Edit them in Portfolio and Macro tabs.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Asset Type</p>
                    <p className="text-sm font-semibold text-gray-900" data-testid="text-research-asset-type">{currentGlobal.propertyLabel || "Boutique Hotel"}</p>
                  </div>
                  <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Tier</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize" data-testid="text-research-tier">{currentGlobal.assetDefinition?.level || "luxury"}</p>
                  </div>
                  <div className="rounded-xl p-3 bg-blue-50 border border-blue-200">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Room Range</p>
                    <p className="text-sm font-semibold text-gray-900" data-testid="text-research-rooms">{currentGlobal.assetDefinition?.minRooms ?? 10}–{currentGlobal.assetDefinition?.maxRooms ?? 80}</p>
                  </div>
                  <div className="rounded-xl p-3 bg-blue-50 border border-blue-200">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">ADR Range</p>
                    <p className="text-sm font-semibold text-gray-900" data-testid="text-research-adr">${currentGlobal.assetDefinition?.minAdr ?? 150}–${currentGlobal.assetDefinition?.maxAdr ?? 600}</p>
                  </div>
                  <div className="rounded-xl p-3 bg-amber-50 border border-amber-200">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Inflation</p>
                    <p className="text-sm font-semibold text-gray-900" data-testid="text-research-inflation">{((currentGlobal.inflationRate ?? 0.03) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="rounded-xl p-3 bg-amber-50 border border-amber-200">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Model Duration</p>
                    <p className="text-sm font-semibold text-gray-900" data-testid="text-research-duration">{currentGlobal.projectionYears ?? 10} years</p>
                  </div>
                  <div className="rounded-xl p-3 bg-gray-50 border border-gray-200 col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Features</p>
                    <div className="flex flex-wrap gap-1.5" data-testid="text-research-features">
                      {currentGlobal.assetDefinition?.hasFB && <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-gray-200">F&B</span>}
                      {currentGlobal.assetDefinition?.hasEvents && <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-gray-200">Events</span>}
                      {currentGlobal.assetDefinition?.hasWellness && <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-gray-200">Wellness</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Search className="w-5 h-5 text-primary" />
                  Research Variables
                  <HelpTooltip text="Configure what the AI should research. Select focus areas, target regions, and time horizon. Add custom questions for specific topics." />
                </CardTitle>
                <CardDescription className="label-text">Customize the scope and focus of AI-generated industry research</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="label-text font-medium">Focus Areas</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FOCUS_AREA_OPTIONS.map((option) => (
                      <div key={option.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`focus-${option.id}`}
                          checked={selectedFocusAreas.includes(option.label)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFocusAreas([...selectedFocusAreas, option.label]);
                            } else {
                              setSelectedFocusAreas(selectedFocusAreas.filter(a => a !== option.label));
                            }
                          }}
                          data-testid={`checkbox-focus-${option.id}`}
                        />
                        <Label htmlFor={`focus-${option.id}`} className="text-sm cursor-pointer flex-1">{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="label-text font-medium">Target Regions</Label>
                    <div className="space-y-2">
                      {REGION_OPTIONS.map((option) => (
                        <div key={option.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={`region-${option.id}`}
                            checked={selectedRegions.includes(option.label)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRegions([...selectedRegions, option.label]);
                              } else {
                                setSelectedRegions(selectedRegions.filter(r => r !== option.label));
                              }
                            }}
                            data-testid={`checkbox-region-${option.id}`}
                          />
                          <Label htmlFor={`region-${option.id}`} className="text-sm cursor-pointer">{option.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="label-text font-medium">Time Horizon</Label>
                    <RadioGroup
                      value={timeHorizon}
                      onValueChange={setTimeHorizon}
                      className="space-y-2"
                      data-testid="radio-time-horizon"
                    >
                      {TIME_HORIZON_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={option.value} id={`horizon-${option.value}`} data-testid={`radio-horizon-${option.value.replace(/\s/g, '-')}`} />
                          <Label htmlFor={`horizon-${option.value}`} className="text-sm cursor-pointer">{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="label-text font-medium flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Custom Research Questions
                    <HelpTooltip text="Add specific research questions or qualifiers for the AI to address. Each question is sent to the AI as part of the research prompt." />
                  </Label>

                  {researchQuestions.length > 0 && (
                    <div className="space-y-2">
                      {researchQuestions.map((q) => (
                        <div key={q.id} className="group flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200 hover:border-primary/30 transition-colors" data-testid={`research-question-${q.id}`}>
                          {editingQuestionId === q.id ? (
                            <div className="flex-1 flex items-start gap-2">
                              <Input
                                value={editingQuestionText}
                                onChange={(e) => setEditingQuestionText(e.target.value)}
                                className="flex-1 text-sm bg-white"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && editingQuestionText.trim()) {
                                    updateQuestion.mutate({ id: q.id, question: editingQuestionText.trim() });
                                    setEditingQuestionId(null);
                                  }
                                  if (e.key === "Escape") setEditingQuestionId(null);
                                }}
                                data-testid={`input-edit-question-${q.id}`}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                                onClick={() => {
                                  if (editingQuestionText.trim()) {
                                    updateQuestion.mutate({ id: q.id, question: editingQuestionText.trim() });
                                  }
                                  setEditingQuestionId(null);
                                }}
                                data-testid={`button-save-question-${q.id}`}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                                onClick={() => setEditingQuestionId(null)}
                                data-testid={`button-cancel-edit-${q.id}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="flex-1 text-sm text-gray-700 pt-0.5">{q.question}</p>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-primary"
                                  onClick={() => {
                                    setEditingQuestionId(q.id);
                                    setEditingQuestionText(q.question);
                                  }}
                                  data-testid={`button-edit-question-${q.id}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-destructive"
                                  onClick={() => deleteQuestion.mutate(q.id)}
                                  data-testid={`button-delete-question-${q.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {researchQuestions.length === 0 && (
                    <p className="text-xs text-gray-400 italic py-2">No custom questions yet. Add one below to guide the AI research.</p>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="e.g., What is the average wellness retreat pricing in Costa Rica?"
                      className="flex-1 text-sm bg-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newQuestion.trim()) {
                          createQuestion.mutate(newQuestion.trim(), {
                            onSuccess: () => setNewQuestion(""),
                          });
                        }
                      }}
                      data-testid="input-new-question"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!newQuestion.trim() || createQuestion.isPending}
                      onClick={() => {
                        if (newQuestion.trim()) {
                          createQuestion.mutate(newQuestion.trim(), {
                            onSuccess: () => setNewQuestion(""),
                          });
                        }
                      }}
                      data-testid="button-add-question"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={generateResearch}
                  disabled={isGenerating || selectedFocusAreas.length === 0 || selectedRegions.length === 0}
                  className="w-full"
                  data-testid="button-generate-research"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? "Analyzing Industry Data..." : "Generate Research"}
                </Button>
              </CardContent>
            </Card>

            {isGenerating && streamedContent && (
              <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Generating Research...
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-gray-500 whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {streamedContent.slice(0, 800)}...
                  </pre>
                </CardContent>
              </Card>
            )}

            {research?.updatedAt && !isGenerating && (
              <p className="text-xs text-gray-400 text-right" data-testid="text-research-updated">
                Last updated: {format(new Date(research.updatedAt), "MMM d, yyyy h:mm a")}
                {research.llmModel && ` · Model: ${research.llmModel}`}
              </p>
            )}

            {(() => {
              const content = research?.content as any;
              const hasResearch = content && !content.rawResponse;
              if (!hasResearch || isGenerating) return null;
              
              return (
                <div className="space-y-5">
                  {content.industryOverview && (
                    <Card className="bg-white/80 backdrop-blur-xl border-emerald-200 shadow-sm">
                      <CardHeader className="pb-3" style={{ borderLeft: "4px solid #257D41" }}>
                        <CardTitle className="flex items-center gap-2 text-base font-display">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-emerald-700" />
                          </div>
                          Industry Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          {content.industryOverview.marketSize && (
                            <div className="rounded-xl p-3 border border-emerald-200 bg-emerald-50">
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Market Size</p>
                              <p className="text-sm font-semibold text-gray-900">{content.industryOverview.marketSize}</p>
                            </div>
                          )}
                          {content.industryOverview.growthRate && (
                            <div className="rounded-xl p-3 border border-emerald-200 bg-emerald-50">
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Growth Rate</p>
                              <p className="text-sm font-semibold text-gray-900">{content.industryOverview.growthRate}</p>
                            </div>
                          )}
                          {content.industryOverview.boutiqueShare && (
                            <div className="rounded-xl p-3 border border-emerald-200 bg-emerald-50">
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Boutique Share</p>
                              <p className="text-sm font-semibold text-gray-900">{content.industryOverview.boutiqueShare}</p>
                            </div>
                          )}
                        </div>
                        {content.industryOverview.keyTrends?.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Key Trends</h4>
                            <ul className="space-y-1.5">
                              {content.industryOverview.keyTrends.map((t: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <span className="text-primary mt-0.5">·</span>
                                  {t}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {content.eventHospitality && (
                    <Card className="bg-white/80 backdrop-blur-xl border-amber-200 shadow-sm">
                      <CardHeader className="pb-3" style={{ borderLeft: "4px solid #D97706" }}>
                        <CardTitle className="flex items-center gap-2 text-base font-display">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-amber-700" />
                          </div>
                          Event & Experience Hospitality
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {content.eventHospitality.wellnessRetreats && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Wellness Retreats</h4>
                              <div className="space-y-2 text-sm">
                                <div><p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Market Size</p><p className="text-gray-800">{content.eventHospitality.wellnessRetreats.marketSize}</p></div>
                                <div><p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Growth</p><p className="text-emerald-600">{content.eventHospitality.wellnessRetreats.growth}</p></div>
                              </div>
                            </div>
                          )}
                          {content.eventHospitality.corporateEvents && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Corporate Events</h4>
                              <div className="space-y-2 text-sm">
                                <div><p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Market Size</p><p className="text-gray-800">{content.eventHospitality.corporateEvents.marketSize}</p></div>
                                <div><p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Growth</p><p className="text-emerald-600">{content.eventHospitality.corporateEvents.growth}</p></div>
                              </div>
                            </div>
                          )}
                          {content.eventHospitality.yogaRetreats && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Yoga Retreats</h4>
                              <div className="space-y-2 text-sm">
                                <div><p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Market Size</p><p className="text-gray-800">{content.eventHospitality.yogaRetreats.marketSize}</p></div>
                                <div><p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Growth</p><p className="text-emerald-600">{content.eventHospitality.yogaRetreats.growth}</p></div>
                              </div>
                            </div>
                          )}
                          {content.eventHospitality.relationshipRetreats && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Relationship Retreats</h4>
                              <div className="space-y-2 text-sm">
                                <div><p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Market Size</p><p className="text-gray-800">{content.eventHospitality.relationshipRetreats.marketSize}</p></div>
                                <div><p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Growth</p><p className="text-emerald-600">{content.eventHospitality.relationshipRetreats.growth}</p></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {content.financialBenchmarks && (
                    <Card className="bg-white/80 backdrop-blur-xl border-blue-200 shadow-sm">
                      <CardHeader className="pb-3" style={{ borderLeft: "4px solid #3B82F6" }}>
                        <CardTitle className="flex items-center gap-2 text-base font-display">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-blue-700" />
                          </div>
                          Financial Benchmarks
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {content.financialBenchmarks.adrTrends?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">ADR Trends</h4>
                            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left p-2.5 text-gray-500 font-medium">Year</th>
                                    <th className="text-right p-2.5 text-gray-500 font-medium">National</th>
                                    <th className="text-right p-2.5 text-gray-500 font-medium">Boutique</th>
                                    <th className="text-right p-2.5 text-gray-500 font-medium">Luxury</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {content.financialBenchmarks.adrTrends.map((r: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-50">
                                      <td className="p-2.5 text-gray-800">{r.year}</td>
                                      <td className="p-2.5 text-right text-gray-800">{r.national}</td>
                                      <td className="p-2.5 text-right text-emerald-600 font-medium">{r.boutique}</td>
                                      <td className="p-2.5 text-right text-gray-800">{r.luxury}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {content.financialBenchmarks.capRates?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Cap Rates</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {content.financialBenchmarks.capRates.map((c: any, i: number) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                  <p className="text-xs text-gray-500">{c.segment}</p>
                                  <p className="text-sm text-gray-800 font-medium">{c.range}</p>
                                  <p className="text-xs text-gray-400">{c.trend}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {content.debtMarket && (
                    <Card className="bg-white/80 backdrop-blur-xl border-cyan-200 shadow-sm">
                      <CardHeader className="pb-3" style={{ borderLeft: "4px solid #0891B2" }}>
                        <CardTitle className="flex items-center gap-2 text-base font-display">
                          <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                            <Landmark className="w-4 h-4 text-cyan-700" />
                          </div>
                          Debt Market Conditions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {content.debtMarket.currentRates && <div className="rounded-xl p-3 border border-cyan-200 bg-cyan-50"><p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Current Rates</p><p className="text-sm font-semibold text-gray-900">{content.debtMarket.currentRates}</p></div>}
                          {content.debtMarket.ltvRange && <div className="rounded-xl p-3 border border-cyan-200 bg-cyan-50"><p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">LTV Range</p><p className="text-sm font-semibold text-gray-900">{content.debtMarket.ltvRange}</p></div>}
                          {content.debtMarket.terms && <div className="rounded-xl p-3 border border-cyan-200 bg-cyan-50"><p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Terms</p><p className="text-sm font-semibold text-gray-900">{content.debtMarket.terms}</p></div>}
                          {content.debtMarket.outlook && <div className="rounded-xl p-3 border border-cyan-200 bg-cyan-50"><p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Outlook</p><p className="text-sm font-semibold text-gray-900">{content.debtMarket.outlook}</p></div>}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {content.sources?.length > 0 && (
                    <Card className="bg-white/80 backdrop-blur-xl border-gray-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-display">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-gray-600" />
                          </div>
                          Sources
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {content.sources.map((s: string, i: number) => (
                            <li key={i} className="text-xs text-gray-500">· {s}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}

            {!research?.content && !isGenerating && (
              <Card className="bg-white/80 backdrop-blur-xl border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Research Data Yet</h3>
                  <p className="text-sm text-gray-500">Configure your research variables above and click "Generate Research" to get AI-powered industry analysis tailored to your portfolio.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
