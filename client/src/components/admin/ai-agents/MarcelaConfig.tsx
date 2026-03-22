import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  IconBrain,
  IconMic,
  IconPhone,
  IconHistory,
  IconShield,
  IconPalette,
  IconMousePointerClick,
  IconBookOpen,
  IconPlay,
  IconAlertTriangle,
} from "@/components/icons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { motion } from "framer-motion";

import { Orb } from "@/features/ai-agent/components/orb";
import type { AgentState } from "@/features/ai-agent/components/orb";
import { ConversationBar } from "@/features/ai-agent/components/conversation-bar";
import { useTwilioStatus } from "@/features/ai-agent/hooks/use-agent-settings";
import { useAgentConfig } from "@/features/ai-agent/hooks/use-convai-api";
import { useConversations } from "@/features/ai-agent/hooks/use-conversations";
import { useAdminSignedUrl } from "@/features/ai-agent/hooks/use-signed-url";
import { useGlobalAssumptions } from "@/lib/api";
import type { VoiceSettings } from "../marcela/types";

import { LLMSettings } from "../marcela/LLMSettings";
import { TelephonySettings } from "../marcela/TelephonySettings";
import { VoiceSettingsComponent } from "../marcela/VoiceSettings";
import { PromptEditor } from "../marcela/PromptEditor";
import { ConversationHistory } from "../marcela/ConversationHistory";
import { WidgetAppearance } from "../marcela/WidgetAppearance";
import { WidgetInteraction } from "../marcela/WidgetInteraction";
import { KnowledgeBaseCard } from "../marcela/KnowledgeBase";

import { StatusChecklist, type ChecklistItem } from "./agent-shared";
import { GeneralTab } from "./MarcelaGeneralTab";

export interface MarcelaConfigProps {
  draft: VoiceSettings;
  isDirty: boolean;
  updateField: <K extends keyof VoiceSettings>(
    key: K,
    value: VoiceSettings[K],
  ) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function MarcelaConfig({
  draft,
  isDirty,
  updateField,
  onSave,
  isSaving,
}: MarcelaConfigProps) {
  const { data: agentConfig, error: agentConfigError } = useAgentConfig();
  const { data: conversations } = useConversations();
  const {
    data: signedUrl,
    isLoading: signedUrlLoading,
    isError: signedUrlError,
  } = useAdminSignedUrl();
  const { data: healthData } = useQuery<{
    apiKeySet: boolean;
    agentId: string;
    signedUrlTest: string;
    showAiAssistant: boolean;
    marcelaEnabled: boolean;
  }>({
    queryKey: ["admin", "convai-health"],
    queryFn: async () => {
      const res = await fetch("/api/admin/convai/health", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Health check failed");
      return res.json();
    },
    staleTime: 30_000,
    retry: false,
  });
  const { data: twilioStatus } = useTwilioStatus();
  const { data: globalAssumptions } = useGlobalAssumptions();

  const [activeTab, setActiveTab] = useState("general");
  const [testOpen, setTestOpen] = useState(false);
  const [orbAgentState, setOrbAgentState] = useState<AgentState>(null);

  useEffect(() => {
    if (!testOpen) {
      setOrbAgentState(null);
      return;
    }
    const states: AgentState[] = ["thinking", "listening", "talking", "listening"];
    let i = 0;
    setOrbAgentState(states[0]);
    const id = setInterval(() => {
      i = (i + 1) % states.length;
      setOrbAgentState(states[i]);
    }, 2500);
    return () => clearInterval(id);
  }, [testOpen]);

  const companyName = globalAssumptions?.companyName || "the company";
  const agentName = draft.aiAgentName || "AI Agent";
  const elevenLabsOk = !agentConfigError && agentConfig !== undefined;
  const signedUrlOk = !!signedUrl;
  const promptOk = !!(
    agentConfig?.conversation_config?.agent?.prompt?.prompt
  );
  const kbDocs: any[] =
    (agentConfig?.conversation_config?.agent as any)?.knowledge_base ??
    (agentConfig?.conversation_config?.agent?.prompt as any)?.knowledge_base ??
    [];
  const kbOk = kbDocs.length > 0;
  const twilioOk = !!twilioStatus?.connected;
  const agentIdOk = !!draft.marcelaAgentId;

  const checklistItems: ChecklistItem[] = [
    { label: "Agent ID", ok: agentIdOk, tab: "general" },
    { label: "ElevenLabs API", ok: elevenLabsOk, tab: "general" },
    { label: "Signed URL", ok: signedUrlOk },
    { label: "System prompt", ok: promptOk, tab: "intelligence" },
    { label: "Knowledge base", ok: kbOk, tab: "knowledge" },
    { label: "Twilio", ok: twilioOk, tab: "channels" },
  ];

  const tabs = [
    { value: "general", label: "General", icon: IconShield },
    { value: "intelligence", label: "Intelligence", icon: IconBrain },
    { value: "voice", label: "Voice", icon: IconMic },
    { value: "appearance", label: "Appearance", icon: IconPalette },
    { value: "interaction", label: "Interaction", icon: IconMousePointerClick },
    { value: "channels", label: "Channels", icon: IconPhone },
    { value: "knowledge", label: "Knowledge", icon: IconBookOpen },
    { value: "history", label: "History", icon: IconHistory },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-bold text-foreground">
            {agentName} Configuration
          </h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            Intelligence, voice, appearance, channels, and knowledge base.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {draft.marcelaAgentId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTestOpen(true)}
              className="gap-1.5 border-border text-muted-foreground hover:bg-muted"
              data-testid="button-test-conversation"
            >
              <IconPlay className="w-3.5 h-3.5" /> Test
            </Button>
          )}
        </div>
      </div>

      {draft.marcelaAgentId && (
        <StatusChecklist items={checklistItems} onNavigate={setActiveTab} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:grid-cols-8 h-auto p-1 bg-muted border border-border">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="py-2 gap-1.5"
              data-testid={`tab-ai-agent-${t.value}`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden md:inline text-xs">{t.label}</span>
              {t.value === "history" &&
                conversations &&
                conversations.length > 0 && (
                  <span className="min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                    {conversations.length > 99
                      ? "99+"
                      : conversations.length}
                  </span>
                )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6 space-y-6">
          <TabsContent
            value="general"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <GeneralTab
              draft={draft}
              updateField={updateField}
              agentName={agentName}
              agentConfig={agentConfig}
              agentIdOk={agentIdOk}
              elevenLabsOk={elevenLabsOk}
              signedUrlLoading={signedUrlLoading}
              signedUrlError={signedUrlError}
              signedUrl={signedUrl}
              healthData={healthData}
            />
          </TabsContent>

          <TabsContent
            value="intelligence"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <PromptEditor agentName={agentName} companyName={companyName} />
            <LLMSettings draft={draft} updateField={updateField} />
          </TabsContent>

          <TabsContent
            value="voice"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <VoiceSettingsComponent draft={draft} updateField={updateField} />
          </TabsContent>

          <TabsContent
            value="appearance"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <WidgetAppearance />
          </TabsContent>

          <TabsContent
            value="interaction"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <WidgetInteraction draft={draft} updateField={updateField} />
          </TabsContent>

          <TabsContent
            value="channels"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <TelephonySettings
              draft={draft}
              updateField={updateField}
              twilioStatus={twilioStatus}
              companyName={companyName}
            />
          </TabsContent>

          <TabsContent
            value="knowledge"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <KnowledgeBaseCard agentName={agentName} />
          </TabsContent>

          <TabsContent
            value="history"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <ErrorBoundary
              fallback={
                <div className="p-6 rounded-xl border border-accent-pop/20 bg-accent-pop/10 flex flex-col items-center gap-3 text-center">
                  <IconAlertTriangle className="w-8 h-8 text-accent-pop" />
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      Conversation history failed to load
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      An error occurred in this section. Other tabs are
                      unaffected.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="text-xs underline text-muted-foreground hover:text-foreground"
                  >
                    Reload page
                  </Button>
                </div>
              }
            >
              <ConversationHistory />
            </ErrorBoundary>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              Test Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-28 h-28">
              <Orb
                colors={["#9fbca4", "#4a7c5c"]}
                agentState={orbAgentState}
                seed={42}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold font-display">{agentName}</p>
              <p className="text-[11px] text-muted-foreground/60 capitalize">
                {orbAgentState ?? "idle"}
              </p>
            </div>
            {signedUrl ? (
              <>
                <p className="text-xs text-muted-foreground/60 text-center px-2">
                  Live conversation — counts against your ElevenLabs quota.
                </p>
                <ConversationBar
                  signedUrl={signedUrl}
                  agentLabel={agentName}
                />
              </>
            ) : (
              <p className="text-xs text-muted-foreground/60 animate-pulse">
                Generating signed URL...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

