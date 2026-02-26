/**
 * Settings.tsx — Systemwide assumptions configuration page.
 *
 * This page lets management-level users configure the "global" variables that
 * drive the entire financial model. Changes are saved to the global_assumptions table 
 * and trigger a full financial recalculation across all properties and dashboards.
 */
import Layout from "@/components/Layout";
import { 
  useGlobalAssumptions, 
  useUpdateGlobalAssumptions, 
  useProperties, 
  useUpdateProperty, 
  useMarketResearch, 
  useResearchQuestions, 
  useCreateResearchQuestion, 
  useUpdateResearchQuestion, 
  useDeleteResearchQuestion 
} from "@/lib/api";
import { Tabs, TabsContent, CurrentThemeTab } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Hotel, Globe, Sliders, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SaveButton } from "@/components/ui/save-button";
import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { parseMoneyInput } from "@/lib/formatters";
import { 
  PortfolioTab, 
  MacroTab, 
  OtherTab, 
  IndustryResearchTab 
} from "@/components/settings";

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
            } catch { /* incomplete SSE chunk */ }
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

  const commonProps = {
    global,
    currentGlobal,
    globalDraft,
    handleGlobalChange,
    handleNestedChange,
    properties,
    propertyDrafts,
    handlePropertyChange,
    handlePropertyMoneyChange,
    handleSaveProperty,
    updatePropertyPending: updateProperty.isPending,
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

          <TabsContent value="portfolio">
            <PortfolioTab {...commonProps} />
          </TabsContent>

          <TabsContent value="macro">
            <MacroTab 
              {...commonProps} 
              setGlobalDraft={setGlobalDraft}
              handleSaveGlobal={handleSaveGlobal}
              updateGlobalPending={updateGlobal.isPending}
            />
          </TabsContent>

          <TabsContent value="other">
            <OtherTab 
              {...commonProps}
              handleSaveGlobal={handleSaveGlobal}
              updateGlobalPending={updateGlobal.isPending}
            />
          </TabsContent>

          <TabsContent value="research">
            <IndustryResearchTab 
              {...commonProps}
              selectedFocusAreas={selectedFocusAreas}
              setSelectedFocusAreas={setSelectedFocusAreas}
              selectedRegions={selectedRegions}
              setSelectedRegions={setSelectedRegions}
              timeHorizon={timeHorizon}
              setTimeHorizon={setTimeHorizon}
              researchQuestions={researchQuestions}
              editingQuestionId={editingQuestionId}
              setEditingQuestionId={setEditingQuestionId}
              editingQuestionText={editingQuestionText}
              setEditingQuestionText={setEditingQuestionText}
              newQuestion={newQuestion}
              setNewQuestion={setNewQuestion}
              isGenerating={isGenerating}
              streamedContent={streamedContent}
              generateResearch={generateResearch}
              createQuestion={createQuestion}
              updateQuestion={updateQuestion}
              deleteQuestion={deleteQuestion}
              FOCUS_AREA_OPTIONS={FOCUS_AREA_OPTIONS}
              REGION_OPTIONS={REGION_OPTIONS}
              TIME_HORIZON_OPTIONS={TIME_HORIZON_OPTIONS}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
