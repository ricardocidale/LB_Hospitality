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
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  IconBot,
  IconMessageCircle,
  IconMic,
  IconBrain,
  IconPhone,
  IconHistory,
  IconShield,
  IconPalette,
  IconMousePointerClick,
  IconBookOpen,
  IconPlay,
  IconCheckCircle2,
  IconXCircle,
  IconRadio,
  IconUser,
  IconInfo,
  IconAlertTriangle,
  IconRefreshCw,
  IconSparkles,
  IconZap,
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Marcela sub-components
import { Orb } from "@/features/ai-agent/components/orb";
import type { AgentState } from "@/features/ai-agent/components/orb";
import { ConversationBar } from "@/features/ai-agent/components/conversation-bar";
import {
  useMarcelaSettings,
  useSaveMarcelaSettings,
  useTwilioStatus,
} from "@/features/ai-agent/hooks/use-agent-settings";
import { useAgentConfig } from "@/features/ai-agent/hooks/use-convai-api";
import { useConversations } from "@/features/ai-agent/hooks/use-conversations";
import { useAdminSignedUrl } from "@/features/ai-agent/hooks/use-signed-url";
import { useGlobalAssumptions } from "./hooks";
import type { VoiceSettings } from "./marcela/types";

// Marcela tab sub-components
import { LLMSettings } from "./marcela/LLMSettings";
import { TelephonySettings } from "./marcela/TelephonySettings";
import { VoiceSettingsComponent } from "./marcela/VoiceSettings";
import { PromptEditor } from "./marcela/PromptEditor";
import { ConversationHistory } from "./marcela/ConversationHistory";
import { WidgetAppearance } from "./marcela/WidgetAppearance";
import { WidgetInteraction } from "./marcela/WidgetInteraction";
import { KnowledgeBaseCard } from "./marcela/KnowledgeBase";
import { SaveButton } from "@/components/ui/save-button";

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PROMPT = `You are Rebecca, a property investment analyst for a boutique hotel management company. You answer questions about the portfolio's properties, financial metrics, and hospitality industry concepts.

You have access to the current portfolio data below. Use it to answer questions accurately. When discussing financials, be precise and cite specific numbers from the data. If asked about something not in the data, say so clearly.

Keep responses concise and professional. Use bullet points for lists. Format dollar amounts with commas. When comparing properties, use clear tables or structured comparisons.

Do not make up data. Only reference what is provided in the context below.`;

type ActiveAgent = "marcela" | "rebecca" | null;

// ── Status Checklist (reused from MarcelaTab) ────────────────────────────────

interface ChecklistItem {
  label: string;
  ok: boolean;
  tab?: string;
}

function StatusChecklist({
  items,
  onNavigate,
}: {
  items: ChecklistItem[];
  onNavigate: (tab: string) => void;
}) {
  return (
    <Card
      className="bg-card border border-border/80 shadow-sm"
      data-testid="card-agent-checklist"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <IconShield className="w-4 h-4 text-muted-foreground" />
          Agent Readiness
        </CardTitle>
        <CardDescription className="label-text mt-0.5">
          All systems must be green for full agent functionality.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={!item.tab}
              onClick={() => item.tab && onNavigate(item.tab)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                item.ok
                  ? "border-green-200/60 bg-green-50/40 text-green-800"
                  : "border-red-200/60 bg-red-50/40 text-red-800"
              } ${item.tab ? "cursor-pointer hover:shadow-sm" : "cursor-default"}`}
              data-testid={`checklist-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {item.ok ? (
                <IconCheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <IconXCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Agent Card ────────────────────────────────────────────────────────────────

interface AgentCardProps {
  name: string;
  type: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isEnabled: boolean;
  isSelected: boolean;
  onToggle: (enabled: boolean) => void;
  onSelect: () => void;
  isToggling?: boolean;
  accentFrom: string;
  accentTo: string;
  orbElement?: React.ReactNode;
}

function AgentCard({
  name,
  type,
  description,
  icon: Icon,
  isActive,
  isEnabled,
  isSelected,
  onToggle,
  onSelect,
  isToggling,
  accentFrom,
  accentTo,
  orbElement,
}: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300",
          "bg-white/80 backdrop-blur-xl border",
          isSelected
            ? "border-primary/40 shadow-[0_0_24px_rgba(var(--primary-rgb,100,100,100),0.12)] ring-1 ring-primary/20"
            : "border-border/60 hover:border-border hover:shadow-md",
          !isEnabled && "opacity-70",
        )}
        onClick={onSelect}
        data-testid={`agent-card-${name.toLowerCase()}`}
      >
        {/* Active gradient overlay */}
        <AnimatePresence>
          {isEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "absolute inset-0 pointer-events-none",
                `bg-gradient-to-br ${accentFrom} ${accentTo}`,
              )}
            />
          )}
        </AnimatePresence>

        <CardContent className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0">
              {/* Icon / Orb */}
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                  isEnabled
                    ? "bg-primary/10 shadow-sm"
                    : "bg-muted/60",
                )}
              >
                {orbElement || (
                  <Icon
                    className={cn(
                      "w-6 h-6 transition-colors duration-300",
                      isEnabled ? "text-primary" : "text-muted-foreground/60",
                    )}
                  />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-display font-bold text-foreground">
                    {name}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0",
                      isEnabled
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {description}
                </p>

                {/* Status indicator */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <motion.div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isEnabled ? "bg-green-500" : "bg-muted-foreground/30",
                    )}
                    animate={
                      isEnabled
                        ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                        : {}
                    }
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      isEnabled ? "text-green-700" : "text-muted-foreground/50",
                    )}
                  >
                    {isEnabled ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Toggle */}
            <div
              className="shrink-0 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              {isToggling ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  checked={isEnabled}
                  onCheckedChange={onToggle}
                  data-testid={`switch-agent-${name.toLowerCase()}`}
                />
              )}
            </div>
          </div>
        </CardContent>

        {/* Selected indicator bar */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left"
            />
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ── Marcela Config Section ───────────────────────────────────────────────────

interface MarcelaConfigProps {
  draft: VoiceSettings;
  isDirty: boolean;
  updateField: <K extends keyof VoiceSettings>(
    key: K,
    value: VoiceSettings[K],
  ) => void;
  onSave: () => void;
  isSaving: boolean;
}

function MarcelaConfig({
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
      {/* Header with save + test */}
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
          <SaveButton
            onClick={onSave}
            disabled={!isDirty}
            isPending={isSaving}
          />
        </div>
      </div>

      {/* Diagnostics checklist */}
      {draft.marcelaAgentId && (
        <StatusChecklist items={checklistItems} onNavigate={setActiveTab} />
      )}

      {/* Tabs */}
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
          {/* General */}
          <TabsContent
            value="general"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <Card className="bg-card border border-border/80 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                      <Orb
                        colors={["#9fbca4", "#4a7c5c"]}
                        agentState={agentConfig ? "thinking" : null}
                        seed={42}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Agent Identity
                      </CardTitle>
                      <CardDescription className="label-text mt-0.5">
                        Core settings for {agentName} — display name, agent ID,
                        and global toggles.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={draft.marcelaEnabled ? "default" : "secondary"}
                    className="text-sm"
                  >
                    {draft.marcelaEnabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IconUser className="w-4 h-4 text-muted-foreground/60" />
                    <Label className="label-text font-medium text-xs uppercase tracking-wider text-muted-foreground/70">
                      Agent Display Name
                    </Label>
                  </div>
                  <Input
                    value={draft.aiAgentName}
                    onChange={(e) =>
                      updateField("aiAgentName", e.target.value)
                    }
                    placeholder="Enter the AI agent's display name"
                    className="bg-card border-border focus:border-border transition-colors max-w-sm"
                    data-testid="input-ai-agent-name"
                  />
                  <p className="text-xs text-muted-foreground/70 pl-6">
                    Shown in the chat widget, phone greetings, and SMS replies.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="label-text font-medium text-xs uppercase tracking-wider text-muted-foreground/70">
                    ElevenLabs Agent ID
                  </Label>
                  <Input
                    value={draft.marcelaAgentId}
                    onChange={(e) =>
                      updateField("marcelaAgentId", e.target.value)
                    }
                    placeholder="Enter your ElevenLabs Agent ID"
                    className="bg-card font-mono text-sm border-border focus:border-border transition-colors"
                    data-testid="input-ai-agent-id"
                  />
                  <p className="text-xs text-muted-foreground/70">
                    Create an agent at{" "}
                    <a
                      href="https://elevenlabs.io/app/conversational-ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground underline"
                    >
                      elevenlabs.io/app/conversational-ai
                    </a>{" "}
                    and paste the Agent ID here.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl border border-muted/60">
                  <div>
                    <Label className="label-text font-medium">
                      AI Chat Widget
                    </Label>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Show the {agentName} chat bubble on all pages for
                      logged-in users
                    </p>
                  </div>
                  <Switch
                    checked={draft.showAiAssistant}
                    onCheckedChange={(v) =>
                      updateField("showAiAssistant", v)
                    }
                    data-testid="switch-show-ai-assistant"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl border border-muted/60">
                  <div>
                    <Label className="label-text font-medium">
                      Voice Conversations
                    </Label>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Allow users to speak with {agentName} using microphone
                      input and audio playback
                    </p>
                  </div>
                  <Switch
                    checked={draft.marcelaEnabled}
                    onCheckedChange={(v) =>
                      updateField("marcelaEnabled", v)
                    }
                    data-testid="switch-ai-agent-enabled"
                  />
                </div>

                {agentConfig?.name && (
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/60">
                    <p className="text-xs text-muted-foreground">
                      ElevenLabs agent name:{" "}
                      <span className="font-semibold text-foreground">
                        {agentConfig.name}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Widget Status */}
            <Card className="bg-card border border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <IconRadio className="w-4 h-4 text-muted-foreground" />{" "}
                  Widget Status
                </CardTitle>
                <CardDescription className="label-text mt-0.5">
                  Live connection diagnostics for the {agentName} widget.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Widget Visible</span>
                  {draft.showAiAssistant ? (
                    <span className="flex items-center gap-1 text-xs text-green-700">
                      <IconCheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      On
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <IconXCircle className="w-3.5 h-3.5 text-amber-400" />
                      Off — toggle "AI Chat Widget" above
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Agent ID</span>
                  {agentIdOk ? (
                    <span className="flex items-center gap-1 text-xs text-green-700">
                      <IconCheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      Configured
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IconXCircle className="w-3.5 h-3.5 text-red-400" />
                      Missing
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">API Key</span>
                  {healthData?.apiKeySet ? (
                    <span className="flex items-center gap-1 text-xs text-green-700">
                      <IconCheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      Set
                    </span>
                  ) : healthData?.apiKeySet === false ? (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <IconXCircle className="w-3.5 h-3.5" />
                      Missing — add ELEVENLABS_API_KEY secret
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground animate-pulse">
                      Checking...
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Signed URL</span>
                  {signedUrlLoading ? (
                    <span className="text-xs text-muted-foreground animate-pulse">
                      Generating...
                    </span>
                  ) : signedUrlError ? (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <IconXCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  ) : signedUrl ? (
                    <span className="flex items-center gap-1 text-xs text-green-700">
                      <IconCheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      Ready
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Unavailable
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    ElevenLabs API
                  </span>
                  {elevenLabsOk ? (
                    <span className="flex items-center gap-1 text-xs text-green-700">
                      <IconCheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <IconXCircle className="w-3.5 h-3.5" />
                      Error
                    </span>
                  )}
                </div>
                {signedUrlError && (
                  <p className="text-xs text-destructive pt-1">
                    {healthData?.apiKeySet === false
                      ? "ELEVENLABS_API_KEY environment secret is not set. Add it in your Replit Secrets."
                      : !agentIdOk
                        ? "Agent ID is not configured. Enter a valid ElevenLabs Agent ID above."
                        : "Check the ElevenLabs agent ID and API key — signed URL generation failed."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tools summary */}
            {agentConfig?.conversation_config?.agent?.prompt?.tools && (
              <div className="flex gap-3 p-3 bg-muted/30 border border-border/60 rounded-lg">
                <IconInfo className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {
                      (
                        agentConfig.conversation_config.agent.prompt
                          .tools as any[]
                      ).length
                    }{" "}
                    tools
                  </span>{" "}
                  registered on ElevenLabs. Tools are managed in the{" "}
                  <a
                    href="https://elevenlabs.io/app/conversational-ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    ElevenLabs dashboard
                  </a>
                  .
                </p>
              </div>
            )}
          </TabsContent>

          {/* Intelligence */}
          <TabsContent
            value="intelligence"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <PromptEditor agentName={agentName} companyName={companyName} />
            <LLMSettings draft={draft} updateField={updateField} />
          </TabsContent>

          {/* Voice */}
          <TabsContent
            value="voice"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <VoiceSettingsComponent draft={draft} updateField={updateField} />
          </TabsContent>

          {/* Appearance */}
          <TabsContent
            value="appearance"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <WidgetAppearance />
          </TabsContent>

          {/* Interaction */}
          <TabsContent
            value="interaction"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <WidgetInteraction draft={draft} updateField={updateField} />
          </TabsContent>

          {/* Channels (Telephony / Twilio) */}
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

          {/* Knowledge Base (new 8th tab) */}
          <TabsContent
            value="knowledge"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <KnowledgeBaseCard agentName={agentName} />
          </TabsContent>

          {/* History */}
          <TabsContent
            value="history"
            className="space-y-6 m-0 focus-visible:outline-none"
          >
            <ErrorBoundary
              fallback={
                <div className="p-6 rounded-xl border border-amber-200/60 bg-amber-50/40 flex flex-col items-center gap-3 text-center">
                  <IconAlertTriangle className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      Conversation history failed to load
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      An error occurred in this section. Other tabs are
                      unaffected.
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-xs underline text-muted-foreground hover:text-foreground"
                  >
                    Reload page
                  </button>
                </div>
              }
            >
              <ConversationHistory />
            </ErrorBoundary>
          </TabsContent>
        </div>
      </Tabs>

      {/* Test Conversation Dialog */}
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

// ── Rebecca Config Section ───────────────────────────────────────────────────

interface RebeccaConfigProps {
  enabled: boolean;
  displayName: string;
  systemPrompt: string;
  onEnabledChange: (v: boolean) => void;
  onDisplayNameChange: (v: string) => void;
  onSystemPromptChange: (v: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

function RebeccaConfig({
  enabled,
  displayName,
  systemPrompt,
  onEnabledChange,
  onDisplayNameChange,
  onSystemPromptChange,
  onSave,
  isSaving,
  isDirty,
}: RebeccaConfigProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header with save */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-bold text-foreground">
            {displayName || "Rebecca"} Configuration
          </h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            Text chat agent — answers portfolio questions using pre-computed
            metrics.
          </p>
        </div>
        <SaveButton onClick={onSave} disabled={!isDirty} isPending={isSaving} />
      </div>

      {/* Settings card */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconMessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Agent Identity
              </CardTitle>
              <CardDescription className="label-text mt-0.5">
                Display settings and behavior for the text chat agent.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl border border-muted/60">
            <div>
              <Label className="label-text font-medium">
                Enable {displayName || "Rebecca"}
              </Label>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Show in sidebar and header for all users
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={onEnabledChange}
              data-testid="switch-rebecca-enabled"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IconUser className="w-4 h-4 text-muted-foreground/60" />
              <Label className="label-text font-medium text-xs uppercase tracking-wider text-muted-foreground/70">
                Display Name
              </Label>
            </div>
            <Input
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              placeholder="Rebecca"
              className="bg-card border-border focus:border-border transition-colors max-w-sm"
              data-testid="input-rebecca-name"
            />
            <p className="text-xs text-muted-foreground/70 pl-6">
              Name shown in the sidebar and chat panel header.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt card */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <IconBrain className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                System Prompt
              </CardTitle>
              <CardDescription className="label-text mt-0.5">
                Customize how {displayName || "Rebecca"} responds. Portfolio
                data is always appended automatically.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            placeholder={DEFAULT_PROMPT}
            rows={10}
            className="font-mono text-xs bg-card border-border"
            data-testid="input-rebecca-prompt"
          />
          <p className="text-[11px] text-muted-foreground/50">
            Leave empty to use the default prompt. Portfolio data is always
            appended automatically.
          </p>
        </CardContent>
      </Card>

      {/* Test Chat Preview */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <IconPlay className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Test Chat Preview
              </CardTitle>
              <CardDescription className="label-text mt-0.5">
                Preview how {displayName || "Rebecca"} will appear to users.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-muted/20 to-muted/5 p-4 space-y-3">
            {/* Mock chat header */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/40">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <IconMessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {displayName || "Rebecca"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {enabled ? "Online" : "Offline"}
                </p>
              </div>
              <div className="ml-auto">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    enabled ? "bg-green-500" : "bg-muted-foreground/30",
                  )}
                />
              </div>
            </div>

            {/* Mock messages */}
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <IconMessageCircle className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                  <p className="text-xs text-foreground">
                    Hello! I am {displayName || "Rebecca"}, your portfolio
                    analyst. How can I help you today?
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-primary/10 rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                  <p className="text-xs text-foreground/80">
                    What is our portfolio's average occupancy rate?
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <IconMessageCircle className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                  <p className="text-xs text-muted-foreground/60 italic">
                    {enabled
                      ? "Ready to answer from live portfolio data..."
                      : "Enable the agent to start responding."}
                  </p>
                </div>
              </div>
            </div>

            {/* Mock input */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <div className="flex-1 bg-muted/30 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground/40">
                  Type a message...
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconSparkles className="w-4 h-4 text-primary/40" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-36 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
      </div>

      {/* Agent cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-xl border border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-28 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Config skeleton */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-card border border-border/80">
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AIAgentsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Marcela data ──────────────────────────────────────────────────────────
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

  // ── Rebecca data ──────────────────────────────────────────────────────────
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

  // ── Active agent selection ────────────────────────────────────────────────
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>(null);
  const [isToggling, setIsToggling] = useState<"marcela" | "rebecca" | null>(
    null,
  );

  // Auto-select active agent based on data
  useEffect(() => {
    if (activeAgent !== null) return;
    const marcelaOn = marcelaDraft?.marcelaEnabled ?? false;
    const rebeccaOn = globalData?.rebeccaEnabled ?? false;
    if (marcelaOn) setActiveAgent("marcela");
    else if (rebeccaOn) setActiveAgent("rebecca");
    else if (marcelaDraft) setActiveAgent("marcela"); // default to Marcela
  }, [marcelaDraft, globalData, activeAgent]);

  // ── Toggle handlers with mutual exclusion ─────────────────────────────────

  const handleToggleMarcela = useCallback(
    async (enabled: boolean) => {
      if (!marcelaDraft) return;
      setIsToggling("marcela");

      try {
        if (enabled) {
          // Enable Marcela, disable Rebecca
          await apiRequest("POST", "/api/admin/voice-settings", {
            ...marcelaDraft,
            marcelaEnabled: true,
          });
          await apiRequest("PATCH", "/api/global-assumptions", {
            rebeccaEnabled: false,
          });
          // Update local state
          setMarcelaDraft({ ...marcelaDraft, marcelaEnabled: true });
          setRebeccaEnabled(false);
          setMarcelaDirty(false);
          setRebeccaDirty(false);
          toast({
            title: "Marcela activated",
            description: "Voice agent enabled. Rebecca has been deactivated.",
          });
        } else {
          // Just disable Marcela
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
        // Invalidate both query sets
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
          // Enable Rebecca, disable Marcela
          await apiRequest("PATCH", "/api/global-assumptions", {
            rebeccaEnabled: true,
          });
          await apiRequest("POST", "/api/admin/voice-settings", {
            ...marcelaDraft,
            marcelaEnabled: false,
            showAiAssistant: false,
          });
          // Update local state
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
          // Just disable Rebecca
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

  // ── Loading / Error ───────────────────────────────────────────────────────

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

  // ── Derived state ─────────────────────────────────────────────────────────

  const marcelaEnabled = marcelaDraft.marcelaEnabled;
  const marcelaAgentName = marcelaDraft.aiAgentName || "Marcela";

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Agent Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AgentCard
          name={marcelaAgentName}
          type="Voice Agent"
          description="ElevenLabs-powered voice assistant with phone, SMS, and web widget support."
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

      {/* Active Agent Config Panel */}
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
