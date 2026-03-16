/**
 * AIAgentsTab.tsx — Unified AI Agents admin page.
 *
 * Replaces four separate admin sections (Marcela, Rebecca, Knowledge Base, Twilio)
 * with a single premium page featuring:
 *   - Agent toggle bar with mutual exclusion
 *   - Expandable config sections for each agent
 *   - All Marcela sub-tabs + Knowledge Base (8 tabs)
 *   - Rebecca config with matching tab pattern
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  IconMic,
  IconMessageCircle,
  IconAlertTriangle,
  IconRefreshCw,
  IconZap,
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "@/components/icons/themed-icons";
import { motion, AnimatePresence } from "framer-motion";

import { Orb } from "@/features/ai-agent/components/orb";
import {
  useMarcelaSettings,
  useSaveMarcelaSettings,
} from "@/features/ai-agent/hooks/use-agent-settings";
import { useAgentConfig } from "@/features/ai-agent/hooks/use-convai-api";
import type { VoiceSettings } from "./marcela/types";

import { AgentCard, PageSkeleton } from "./ai-agents/agent-shared";
import { MarcelaConfig } from "./ai-agents/MarcelaConfig";
import { RebeccaConfig } from "./ai-agents/RebeccaConfig";

type ActiveAgent = "marcela" | "rebecca" | null;

interface AIAgentsTabProps {
  onSaveStateChange?: (state: import("@/components/admin/types/save-state").AdminSaveState | null) => void;
}

export default function AIAgentsTab({ onSaveStateChange }: AIAgentsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: marcelaData,
    isLoading: marcelaLoading,
    isError: marcelaError,
    refetch: refetchMarcela,
  } = useMarcelaSettings();
  const saveMarcela = useSaveMarcelaSettings();
  const { data: agentConfig } = useAgentConfig();

  const [marcelaDraft, setMarcelaDraft] = useState<VoiceSettings | null>(null);
  const [marcelaDirty, setMarcelaDirty] = useState(false);

  useEffect(() => {
    if (marcelaData && !marcelaDraft) setMarcelaDraft({ ...marcelaData });
  }, [marcelaData, marcelaDraft]);

  const updateMarcelaField = useCallback(
    <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
      if (!marcelaDraft) return;
      setMarcelaDraft({ ...marcelaDraft, [key]: value });
      setMarcelaDirty(true);
    },
    [marcelaDraft],
  );

  const handleSaveMarcela = useCallback(() => {
    if (marcelaDraft)
      saveMarcela.mutate(marcelaDraft, {
        onSuccess: () => setMarcelaDirty(false),
      });
  }, [marcelaDraft, saveMarcela]);

  const { data: globalData, isLoading: globalLoading } = useQuery<
    Record<string, any>
  >({
    queryKey: ["globalAssumptions"],
    queryFn: async () => {
      const res = await fetch("/api/global-assumptions", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const [rebeccaEnabled, setRebeccaEnabled] = useState(false);
  const [rebeccaDisplayName, setRebeccaDisplayName] = useState("Rebecca");
  const [rebeccaSystemPrompt, setRebeccaSystemPrompt] = useState("");
  const [rebeccaInitialized, setRebeccaInitialized] = useState(false);
  const [rebeccaDirty, setRebeccaDirty] = useState(false);

  useEffect(() => {
    if (globalData && !rebeccaInitialized) {
      setRebeccaEnabled(globalData.rebeccaEnabled ?? false);
      setRebeccaDisplayName(globalData.rebeccaDisplayName ?? "Rebecca");
      setRebeccaSystemPrompt(globalData.rebeccaSystemPrompt ?? "");
      setRebeccaInitialized(true);
    }
  }, [globalData, rebeccaInitialized]);

  const saveRebeccaMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/global-assumptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rebeccaEnabled,
          rebeccaDisplayName: rebeccaDisplayName || "Rebecca",
          rebeccaSystemPrompt: rebeccaSystemPrompt || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalAssumptions"] });
      setRebeccaDirty(false);
      toast({ title: "Saved", description: "Rebecca configuration updated." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [activeAgent, setActiveAgent] = useState<ActiveAgent>(null);
  const [isToggling, setIsToggling] = useState<"marcela" | "rebecca" | null>(
    null,
  );

  useEffect(() => {
    if (activeAgent !== null) return;
    const marcelaOn = marcelaDraft?.marcelaEnabled ?? false;
    const rebeccaOn = globalData?.rebeccaEnabled ?? false;
    if (marcelaOn) setActiveAgent("marcela");
    else if (rebeccaOn) setActiveAgent("rebecca");
    else if (marcelaDraft) setActiveAgent("marcela");
  }, [marcelaDraft, globalData, activeAgent]);

  const handleToggleMarcela = useCallback(
    async (enabled: boolean) => {
      if (!marcelaDraft) return;
      setIsToggling("marcela");

      try {
        if (enabled) {
          await apiRequest("POST", "/api/admin/voice-settings", {
            ...marcelaDraft,
            marcelaEnabled: true,
          });
          await apiRequest("PATCH", "/api/global-assumptions", {
            rebeccaEnabled: false,
          });
          setMarcelaDraft({ ...marcelaDraft, marcelaEnabled: true });
          setRebeccaEnabled(false);
          setMarcelaDirty(false);
          setRebeccaDirty(false);
          toast({
            title: "Marcela activated",
            description: "Voice agent enabled. Rebecca has been deactivated.",
          });
        } else {
          await apiRequest("POST", "/api/admin/voice-settings", {
            ...marcelaDraft,
            marcelaEnabled: false,
            showAiAssistant: false,
          });
          setMarcelaDraft({
            ...marcelaDraft,
            marcelaEnabled: false,
            showAiAssistant: false,
          });
          setMarcelaDirty(false);
          toast({
            title: "Marcela deactivated",
            description: "Voice agent disabled.",
          });
        }
        queryClient.invalidateQueries({ queryKey: ["globalAssumptions"] });
        queryClient.invalidateQueries({
          queryKey: ["admin", "voice-settings"],
        });
        queryClient.invalidateQueries({
          queryKey: ["admin", "marcela-signed-url"],
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Toggle failed",
          variant: "destructive",
        });
      } finally {
        setIsToggling(null);
      }
    },
    [marcelaDraft, queryClient, toast],
  );

  const handleToggleRebecca = useCallback(
    async (enabled: boolean) => {
      if (!marcelaDraft) return;
      setIsToggling("rebecca");

      try {
        if (enabled) {
          await apiRequest("PATCH", "/api/global-assumptions", {
            rebeccaEnabled: true,
          });
          await apiRequest("POST", "/api/admin/voice-settings", {
            ...marcelaDraft,
            marcelaEnabled: false,
            showAiAssistant: false,
          });
          setRebeccaEnabled(true);
          setMarcelaDraft({
            ...marcelaDraft,
            marcelaEnabled: false,
            showAiAssistant: false,
          });
          setMarcelaDirty(false);
          setRebeccaDirty(false);
          toast({
            title: "Rebecca activated",
            description: "Text agent enabled. Marcela has been deactivated.",
          });
        } else {
          await apiRequest("PATCH", "/api/global-assumptions", {
            rebeccaEnabled: false,
          });
          setRebeccaEnabled(false);
          setRebeccaDirty(false);
          toast({
            title: "Rebecca deactivated",
            description: "Text agent disabled.",
          });
        }
        queryClient.invalidateQueries({ queryKey: ["globalAssumptions"] });
        queryClient.invalidateQueries({
          queryKey: ["admin", "voice-settings"],
        });
        queryClient.invalidateQueries({
          queryKey: ["admin", "marcela-signed-url"],
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Toggle failed",
          variant: "destructive",
        });
      } finally {
        setIsToggling(null);
      }
    },
    [marcelaDraft, queryClient, toast],
  );

  const marcelaSaveRef = useRef<(() => void) | undefined>(undefined);
  marcelaSaveRef.current = handleSaveMarcela;
  const rebeccaSaveRef = useRef<(() => void) | undefined>(undefined);
  rebeccaSaveRef.current = () => saveRebeccaMutation.mutate();

  useEffect(() => {
    if (activeAgent === "marcela") {
      onSaveStateChange?.({
        isDirty: marcelaDirty,
        isPending: saveMarcela.isPending,
        onSave: () => marcelaSaveRef.current?.(),
      });
    } else if (activeAgent === "rebecca") {
      onSaveStateChange?.({
        isDirty: rebeccaDirty,
        isPending: saveRebeccaMutation.isPending,
        onSave: () => rebeccaSaveRef.current?.(),
      });
    } else {
      onSaveStateChange?.(null);
    }
    return () => onSaveStateChange?.(null);
  }, [activeAgent, marcelaDirty, rebeccaDirty, saveMarcela.isPending, saveRebeccaMutation.isPending, onSaveStateChange]);

  const isLoading = marcelaLoading || globalLoading;

  if (isLoading || (!marcelaError && !marcelaDraft)) {
    return <PageSkeleton />;
  }

  if (marcelaError || !marcelaDraft) {
    return (
      <div className="mt-6 p-8 flex flex-col items-center gap-4 text-center rounded-xl border border-amber-200/60 bg-amber-50/40">
        <IconAlertTriangle className="w-10 h-10 text-amber-500" />
        <div>
          <p className="font-semibold text-foreground">
            Failed to load AI Agent settings
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Check your connection or try again.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchMarcela()}
          className="gap-2"
        >
          <IconRefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  const marcelaEnabled = marcelaDraft.marcelaEnabled;
  const marcelaAgentName = marcelaDraft.aiAgentName || "Marcela";

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
            <IconZap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              AI Agents
            </h2>
            <p className="text-muted-foreground text-sm">
              Configure and manage your AI assistants
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AgentCard
          name={marcelaAgentName}
          type="Voice Agent"
          description="Knowledge-base assistant powered by ElevenLabs. Answers questions about the platform, methodology, and hospitality concepts."
          icon={IconMic}
          isActive={marcelaEnabled}
          isEnabled={marcelaEnabled}
          isSelected={activeAgent === "marcela"}
          onToggle={handleToggleMarcela}
          onSelect={() => setActiveAgent("marcela")}
          isToggling={isToggling === "marcela"}
          accentFrom="from-emerald-500/5"
          accentTo="to-teal-500/3"
          orbElement={
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Orb
                colors={["#9fbca4", "#4a7c5c"]}
                agentState={agentConfig ? "thinking" : null}
                seed={42}
              />
            </div>
          }
        />
        <AgentCard
          name={rebeccaDisplayName || "Rebecca"}
          type="Text Agent"
          description="AI-powered property analysis chatbot. Answers portfolio questions using pre-computed metrics."
          icon={IconMessageCircle}
          isActive={rebeccaEnabled}
          isEnabled={rebeccaEnabled}
          isSelected={activeAgent === "rebecca"}
          onToggle={handleToggleRebecca}
          onSelect={() => setActiveAgent("rebecca")}
          isToggling={isToggling === "rebecca"}
          accentFrom="from-violet-500/5"
          accentTo="to-purple-500/3"
        />
      </div>

      <AnimatePresence mode="wait">
        {activeAgent === "marcela" && (
          <MarcelaConfig
            key="marcela-config"
            draft={marcelaDraft}
            isDirty={marcelaDirty}
            updateField={updateMarcelaField}
            onSave={handleSaveMarcela}
            isSaving={saveMarcela.isPending}
          />
        )}
        {activeAgent === "rebecca" && (
          <RebeccaConfig
            key="rebecca-config"
            enabled={rebeccaEnabled}
            displayName={rebeccaDisplayName}
            systemPrompt={rebeccaSystemPrompt}
            onEnabledChange={(v) => {
              setRebeccaEnabled(v);
              setRebeccaDirty(true);
            }}
            onDisplayNameChange={(v) => {
              setRebeccaDisplayName(v);
              setRebeccaDirty(true);
            }}
            onSystemPromptChange={(v) => {
              setRebeccaSystemPrompt(v);
              setRebeccaDirty(true);
            }}
            onSave={() => saveRebeccaMutation.mutate()}
            isSaving={saveRebeccaMutation.isPending}
            isDirty={rebeccaDirty}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
