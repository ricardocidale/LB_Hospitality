import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconRadio,
  IconUser,
  IconInfo,
  IconCheckCircle2,
  IconXCircle,
} from "@/components/icons";

import { Orb } from "@/features/ai-agent/components/orb";
import type { VoiceSettings } from "../marcela/types";

export interface GeneralTabProps {
  draft: VoiceSettings;
  updateField: <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => void;
  agentName: string;
  agentConfig: any;
  agentIdOk: boolean;
  elevenLabsOk: boolean;
  signedUrlLoading: boolean;
  signedUrlError: boolean;
  signedUrl: any;
  healthData: any;
}

export function GeneralTab({
  draft,
  updateField,
  agentName,
  agentConfig,
  agentIdOk,
  elevenLabsOk,
  signedUrlLoading,
  signedUrlError,
  signedUrl,
  healthData,
}: GeneralTabProps) {
  return (
    <>
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
              <span className="flex items-center gap-1 text-xs text-primary">
                <IconCheckCircle2 className="w-3.5 h-3.5 text-primary" />
                On
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-accent-pop">
                <IconXCircle className="w-3.5 h-3.5 text-accent-pop" />
                Off — toggle "AI Chat Widget" above
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Agent ID</span>
            {agentIdOk ? (
              <span className="flex items-center gap-1 text-xs text-primary">
                <IconCheckCircle2 className="w-3.5 h-3.5 text-primary" />
                Configured
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconXCircle className="w-3.5 h-3.5 text-destructive/80" />
                Missing
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">API Key</span>
            {healthData?.apiKeySet ? (
              <span className="flex items-center gap-1 text-xs text-primary">
                <IconCheckCircle2 className="w-3.5 h-3.5 text-primary" />
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
              <span className="flex items-center gap-1 text-xs text-primary">
                <IconCheckCircle2 className="w-3.5 h-3.5 text-primary" />
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
              <span className="flex items-center gap-1 text-xs text-primary">
                <IconCheckCircle2 className="w-3.5 h-3.5 text-primary" />
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
    </>
  );
}
