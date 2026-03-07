import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SaveButton } from "@/components/ui/save-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, MessageSquare, Mic, Brain, Wrench, BookOpen, Phone, User, History, CheckCircle2, XCircle, Activity, Play } from "lucide-react";
import { Orb, AgentState } from "@/components/ui/orb";
import { VoiceSettings } from "./types";
import { useMarcelaSettings, useTwilioStatus, useSaveMarcelaSettings, useAgentConfig, useConversations, useAdminSignedUrl } from "./hooks";
import { KnowledgeBaseCard } from "./KnowledgeBase";
import { LLMSettings } from "./LLMSettings";
import { TelephonySettings } from "./TelephonySettings";
import { VoiceSettingsComponent } from "./VoiceSettings";
import { PromptEditor } from "./PromptEditor";
import { ToolsStatus } from "./ToolsStatus";
import { ConversationHistory } from "./ConversationHistory";

export default function MarcelaTab() {
  const { data: globalData, isLoading } = useMarcelaSettings();
  const { data: twilioStatus } = useTwilioStatus();
  const saveMutation = useSaveMarcelaSettings();
  const { data: agentConfig, error: agentConfigError } = useAgentConfig();
  const { data: conversations } = useConversations();
  const { data: signedUrl } = useAdminSignedUrl();
  const [testOpen, setTestOpen] = useState(false);
  const [orbAgentState, setOrbAgentState] = useState<AgentState>(null);

  const [draft, setDraft] = useState<VoiceSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (globalData && !draft) {
      setDraft({ ...globalData });
    }
  }, [globalData, draft]);

  // Cycle orb animation states while the test dialog is open
  useEffect(() => {
    if (!testOpen) { setOrbAgentState(null); return; }
    const states: AgentState[] = ["thinking", "listening", "talking", "listening"];
    let i = 0;
    setOrbAgentState(states[0]);
    const id = setInterval(() => { i = (i + 1) % states.length; setOrbAgentState(states[i]); }, 2500);
    return () => clearInterval(id);
  }, [testOpen]);

  const updateField = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
    setIsDirty(true);
  };

  const handleSave = () => {
    if (draft) {
      saveMutation.mutate(draft, {
        onSuccess: () => setIsDirty(false),
      });
    }
  };

  if (isLoading || !draft) {
    return (
      <div className="space-y-6 mt-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white border border-gray-200/80">
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

  const agentName = draft.aiAgentName || "AI Agent";

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">AI Agent Configuration</h2>
          <p className="text-muted-foreground text-sm">Manage the {agentName} agent — voice, prompt, tools, knowledge base, and telephony.</p>
        </div>
        <SaveButton
          onClick={handleSave}
          disabled={!isDirty}
          isPending={saveMutation.isPending}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:grid-cols-8 h-auto p-1 bg-gray-100 border border-gray-200">
          <TabsTrigger value="general" className="py-2 gap-2" data-testid="tab-ai-agent-general">
            <Shield className="w-4 h-4" />
            <span className="hidden md:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="prompt" className="py-2 gap-2 relative" data-testid="tab-ai-agent-prompt">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline">Prompt</span>
            {!agentConfig?.conversation_config?.agent?.prompt?.prompt && agentConfig !== undefined && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </TabsTrigger>
          <TabsTrigger value="voice" className="py-2 gap-2" data-testid="tab-ai-agent-voice">
            <Mic className="w-4 h-4" />
            <span className="hidden md:inline">Voice</span>
          </TabsTrigger>
          <TabsTrigger value="llm" className="py-2 gap-2" data-testid="tab-ai-agent-llm">
            <Brain className="w-4 h-4" />
            <span className="hidden md:inline">LLM</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="py-2 gap-2" data-testid="tab-ai-agent-tools">
            <Wrench className="w-4 h-4" />
            <span className="hidden md:inline">Tools</span>
          </TabsTrigger>
          <TabsTrigger value="kb" className="py-2 gap-2" data-testid="tab-ai-agent-kb">
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">KB</span>
          </TabsTrigger>
          <TabsTrigger value="telephony" className="py-2 gap-2" data-testid="tab-ai-agent-telephony">
            <Phone className="w-4 h-4" />
            <span className="hidden md:inline">Telephony</span>
          </TabsTrigger>
          <TabsTrigger value="conversations" className="py-2 gap-2 relative" data-testid="tab-ai-agent-conversations">
            <History className="w-4 h-4" />
            <span className="hidden md:inline">History</span>
            {conversations && conversations.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-gray-600-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                {conversations.length > 99 ? "99+" : conversations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-6">
          <TabsContent value="general" className="space-y-6 m-0 focus-visible:outline-none">
            <Card className="bg-white border border-gray-200/80 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-gray-900">Agent Status</CardTitle>
                      <CardDescription className="label-text mt-0.5">
                        Enable or disable the AI assistant and voice features globally.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={draft.marcelaEnabled ? "default" : "secondary"} className="text-sm">
                    {draft.marcelaEnabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground/60" />
                    <Label className="label-text font-medium text-xs uppercase tracking-wider text-muted-foreground/70">Agent Display Name</Label>
                  </div>
                  <Input
                    value={draft.aiAgentName}
                    onChange={(e) => updateField("aiAgentName", e.target.value)}
                    placeholder="Enter the AI agent's display name"
                    className="bg-white border-gray-200 focus:border-gray-300 transition-colors max-w-sm"
                    data-testid="input-ai-agent-name"
                  />
                  <p className="text-xs text-muted-foreground/70 pl-6">
                    The name shown to users in the chat widget, phone greetings, and SMS replies.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl border border-muted/60">
                  <div>
                    <Label className="label-text font-medium">AI Chat Widget</Label>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Show the {agentName} chat bubble on all pages for logged-in users
                    </p>
                  </div>
                  <Switch
                    checked={draft.showAiAssistant}
                    onCheckedChange={(v) => updateField("showAiAssistant", v)}
                    data-testid="switch-show-ai-assistant"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl border border-muted/60">
                  <div>
                    <Label className="label-text font-medium">Voice Conversations</Label>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Allow users to speak with {agentName} using microphone input and audio playback
                    </p>
                  </div>
                  <Switch
                    checked={draft.marcelaEnabled}
                    onCheckedChange={(v) => updateField("marcelaEnabled", v)}
                    data-testid="switch-ai-agent-enabled"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200/80 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    <Orb
                      colors={["#9fbca4", "#4a7c5c"]}
                      agentState={agentConfig ? "thinking" : null}
                      seed={42}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-gray-900">ElevenLabs Conversational AI</CardTitle>
                    <CardDescription className="label-text mt-0.5">
                      Connect {agentName} to an ElevenLabs agent for voice and text chat with automatic language detection.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="label-text font-medium text-xs uppercase tracking-wider text-muted-foreground/70">Agent ID</Label>
                  <Input
                    value={draft.marcelaAgentId}
                    onChange={(e) => updateField("marcelaAgentId", e.target.value)}
                    placeholder="Enter your ElevenLabs Agent ID"
                    className="bg-white font-mono text-sm border-gray-200 focus:border-gray-300 transition-colors"
                    data-testid="input-ai-agent-id"
                  />
                  <p className="text-xs text-muted-foreground/70">
                    Create an agent at{" "}
                    <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-gray-600 underline">
                      elevenlabs.io/app/conversational-ai
                    </a>
                    {" "}and paste the Agent ID here.
                  </p>
                </div>
                {!draft.marcelaAgentId && (
                  <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-200/60">
                    <p className="text-xs text-amber-800">
                      No Agent ID configured. The {agentName} widget will not appear until an agent is set up.
                    </p>
                  </div>
                )}
                {draft.marcelaAgentId && (
                  <div className="p-3.5 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl border border-green-200/60 space-y-1">
                    <p className="text-xs text-green-800">
                      Agent connected. The ElevenLabs widget will appear as a floating button for all users.
                    </p>
                    {agentConfig?.name && (
                      <p className="text-xs text-green-700 font-medium">
                        ElevenLabs agent name: <span className="font-semibold">{agentConfig.name}</span>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            {draft.marcelaAgentId && (() => {
              const elevenLabsOk = !agentConfigError && agentConfig !== undefined;
              const signedUrlOk = !!signedUrl;
              const promptOk = !!(agentConfig?.conversation_config?.agent?.prompt?.prompt);
              const kbOk = ((agentConfig?.conversation_config?.agent as any)?.knowledge_base?.length ?? 0) > 0;
              const healthItems = [
                { label: "ElevenLabs API", ok: elevenLabsOk },
                { label: "Signed URL", ok: signedUrlOk },
                { label: "System prompt", ok: promptOk },
                { label: "Knowledge base", ok: kbOk },
              ];
              const allHealthy = healthItems.every(h => h.ok);
              return (
                <Card className="bg-white border border-gray-200/80 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-600" />
                        Agent Health
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={allHealthy ? "default" : "outline"} className={allHealthy ? "bg-green-500" : "text-amber-600 border-amber-300 bg-amber-50"}>
                          {allHealthy ? "All systems go" : "Needs attention"}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => setTestOpen(true)} className="gap-1.5 border-gray-200 text-gray-600 hover:bg-gray-50">
                          <Play className="w-3.5 h-3.5" />
                          Test Conversation
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {healthItems.map((item) => (
                        <div key={item.label} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${item.ok ? "border-green-200/60 bg-green-50/50 text-green-800" : "border-amber-200/60 bg-amber-50/50 text-amber-800"}`}>
                          {item.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          <span className="font-medium">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {draft.marcelaAgentId && (() => {
              const hasPrompt = !!(agentConfig?.conversation_config?.agent?.prompt?.prompt);
              const hasKb = (agentConfig?.conversation_config?.agent?.knowledge_base ?? []).length > 0;
              const allDone = hasPrompt && hasKb;
              const checks = [
                { label: "Agent ID configured", done: true },
                { label: "System prompt set", done: hasPrompt, tab: "prompt" },
                { label: "Knowledge base attached", done: hasKb, tab: "kb" },
              ];
              return !allDone ? (
                <Card className="bg-amber-50 border border-amber-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      Setup Checklist
                    </CardTitle>
                    <CardDescription className="label-text mt-0.5">Complete these steps for best results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {checks.map((c) => (
                        <div key={c.label} className="flex items-center gap-3">
                          {c.done
                            ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            : <XCircle className="w-4 h-4 text-amber-400 shrink-0" />}
                          <span className={`text-xs ${c.done ? "text-muted-foreground/60 line-through" : "text-foreground/80"}`}>{c.label}</span>
                          {!c.done && c.tab && (
                            <button
                              type="button"
                              onClick={() => setActiveTab(c.tab!)}
                              className="ml-auto text-[10px] text-gray-600 underline hover:no-underline"
                            >
                              Go fix →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}
          </TabsContent>

          <TabsContent value="prompt" className="space-y-6 m-0 focus-visible:outline-none">
            <PromptEditor agentName={agentName} />
          </TabsContent>

          <TabsContent value="voice" className="space-y-6 m-0 focus-visible:outline-none">
            <VoiceSettingsComponent
              draft={draft}
              updateField={updateField}
            />
          </TabsContent>

          <TabsContent value="llm" className="space-y-6 m-0 focus-visible:outline-none">
            <LLMSettings
              draft={draft}
              updateField={updateField}
            />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6 m-0 focus-visible:outline-none">
            <ToolsStatus agentName={agentName} />
          </TabsContent>

          <TabsContent value="kb" className="space-y-6 m-0 focus-visible:outline-none">
            <KnowledgeBaseCard agentName={agentName} />
          </TabsContent>

          <TabsContent value="telephony" className="space-y-6 m-0 focus-visible:outline-none">
            <TelephonySettings
              draft={draft}
              updateField={updateField}
              twilioStatus={twilioStatus}
            />
          </TabsContent>

          <TabsContent value="conversations" className="space-y-6 m-0 focus-visible:outline-none">
            <ConversationHistory />
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Test Conversation</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {/* Animated orb — cycling states show the visual agent */}
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
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(React as any).createElement("elevenlabs-convai", { "signed-url": signedUrl, variant: "compact" })}
              </>
            ) : (
              <p className="text-xs text-muted-foreground/60 animate-pulse">Generating signed URL…</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
