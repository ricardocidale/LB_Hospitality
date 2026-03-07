import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SaveButton } from "@/components/ui/save-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Bot, MessageSquare, Mic, Brain, Wrench, BookOpen, Phone, User, History } from "lucide-react";
import { VoiceSettings } from "./types";
import { useMarcelaSettings, useTwilioStatus, useSaveMarcelaSettings, useAgentConfig } from "./hooks";
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
  const { data: agentConfig } = useAgentConfig();

  const [draft, setDraft] = useState<VoiceSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (globalData && !draft) {
      setDraft({ ...globalData });
    }
  }, [globalData, draft]);

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
          <Card key={i} className="bg-white/80 backdrop-blur-xl border-primary/20">
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
        <TabsList className="grid grid-cols-4 md:grid-cols-8 h-auto p-1 bg-white/50 backdrop-blur-sm border border-primary/10">
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
          <TabsTrigger value="conversations" className="py-2 gap-2" data-testid="tab-ai-agent-conversations">
            <History className="w-4 h-4" />
            <span className="hidden md:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-6">
          <TabsContent value="general" className="space-y-6 m-0 focus-visible:outline-none">
            <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-base">Agent Status</CardTitle>
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
                    className="bg-white/60 border-primary/15 focus:border-primary/30 transition-colors max-w-sm"
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

            <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-base">ElevenLabs Conversational AI</CardTitle>
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
                    className="bg-white/60 font-mono text-sm border-primary/15 focus:border-primary/30 transition-colors"
                    data-testid="input-ai-agent-id"
                  />
                  <p className="text-xs text-muted-foreground/70">
                    Create an agent at{" "}
                    <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">
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
    </div>
  );
}
