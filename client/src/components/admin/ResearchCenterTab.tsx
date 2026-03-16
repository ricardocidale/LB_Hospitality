import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SaveButton } from "@/components/ui/save-button";
import { Loader2 } from "@/components/icons/themed-icons";
import {
  IconResearch, IconProperties, IconTarget, IconTrendingUp, IconBrain,
} from "@/components/icons";
import { useResearchConfig, useSaveResearchConfig } from "@/lib/api/admin";
import type { ResearchConfig, LlmVendor } from "@shared/schema";
import { FALLBACK_MODELS, mergeConfig } from "./research-center/research-shared";
import { IcpResearchSection } from "./research-center/IcpResearchSection";
import { PropertyResearchSection, MarketResearchSection, LlmSelectionCard } from "./research-center/PropertyMarketSections";

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

  function updateConfig(key: "property" | "global" | "company", updated: import("@shared/schema").ResearchEventConfig) {
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
