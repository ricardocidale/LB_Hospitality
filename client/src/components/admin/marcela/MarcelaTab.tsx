import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SaveButton } from "@/components/ui/save-button";
import { Badge } from "@/components/ui/badge";
import { Shield, Bot } from "lucide-react";
import { VoiceSettings } from "./types";
import { useMarcelaSettings, useTwilioStatus, useSaveMarcelaSettings } from "./hooks";
import { KnowledgeBaseCard } from "./KnowledgeBase";
import { LLMSettings } from "./LLMSettings";
import { TelephonySettings } from "./TelephonySettings";
import { VoiceSettingsComponent } from "./VoiceSettings";

export default function MarcelaTab() {
  const { data: globalData, isLoading } = useMarcelaSettings();
  const { data: twilioStatus } = useTwilioStatus();
  const saveMutation = useSaveMarcelaSettings();

  const [draft, setDraft] = useState<VoiceSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);

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

  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-display">
                <Shield className="w-5 h-5 text-primary" />
                Marcela Status
              </CardTitle>
              <CardDescription className="label-text mt-1">
                Enable or disable the Marcela AI assistant and voice features globally.
              </CardDescription>
            </div>
            <Badge variant={draft.marcelaEnabled ? "default" : "secondary"} className="text-sm">
              {draft.marcelaEnabled ? "Active" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div>
              <Label className="label-text font-medium">AI Chat Widget</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Show the Marcela chat bubble on all pages for logged-in users
              </p>
            </div>
            <Switch
              checked={draft.showAiAssistant}
              onCheckedChange={(v) => updateField("showAiAssistant", v)}
              data-testid="switch-show-ai-assistant"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div>
              <Label className="label-text font-medium">Voice Conversations</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow users to speak with Marcela using microphone input and audio playback
              </p>
            </div>
            <Switch
              checked={draft.marcelaEnabled}
              onCheckedChange={(v) => updateField("marcelaEnabled", v)}
              data-testid="switch-marcela-enabled"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Bot className="w-5 h-5 text-primary" />
            ElevenLabs Conversational AI
          </CardTitle>
          <CardDescription className="label-text mt-1">
            Connect Marcela to your ElevenLabs Conversational AI agent for voice and text chat with automatic language detection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="label-text font-medium">Agent ID</Label>
            <Input
              value={draft.marcelaAgentId}
              onChange={(e) => updateField("marcelaAgentId", e.target.value)}
              placeholder="Enter your ElevenLabs Agent ID"
              data-testid="input-marcela-agent-id"
            />
            <p className="text-xs text-muted-foreground">
              Create an agent at{" "}
              <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                elevenlabs.io/app/conversational-ai
              </a>
              {" "}and paste the Agent ID here. Configure voices (Jessica for English, Sarah for Portuguese) and enable language detection on the ElevenLabs dashboard.
            </p>
          </div>
          {!draft.marcelaAgentId && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                No Agent ID configured. The Marcela widget will not appear until an agent is set up.
              </p>
            </div>
          )}
          {draft.marcelaAgentId && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800">
                Agent connected. The ElevenLabs widget will appear as a floating button for all users.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <TelephonySettings
        draft={draft}
        updateField={updateField}
        twilioStatus={twilioStatus}
      />

      <LLMSettings
        draft={draft}
        updateField={updateField}
      />

      <VoiceSettingsComponent
        draft={draft}
        updateField={updateField}
      />

      <KnowledgeBaseCard />

      <SaveButton
        onClick={handleSave}
        disabled={!isDirty}
        isPending={saveMutation.isPending}
      />
    </div>
  );
}
