import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Mic, Brain } from "lucide-react";
import { VoiceSettings, LLM_MODELS } from "./types";

interface LLMSettingsProps {
  draft: VoiceSettings;
  updateField: <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => void;
}

export function LLMSettings({ draft, updateField }: LLMSettingsProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Brain className="w-5 h-5 text-primary" />
          Language Model (LLM)
        </CardTitle>
        <CardDescription className="label-text">
          Configure the AI model that powers Marcela's conversation intelligence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="label-text font-medium">Chat Model</Label>
          <Select value={draft.marcelaLlmModel} onValueChange={(v) => updateField("marcelaLlmModel", v)}>
            <SelectTrigger className="bg-white" data-testid="select-marcela-llm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LLM_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <div className="flex items-center gap-2">
                    <span>{m.label}</span>
                    <span className="text-xs text-muted-foreground">— {m.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="label-text font-medium flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Max Tokens (Text)
            </Label>
            <Input
              type="number"
              min={256}
              max={8192}
              value={draft.marcelaMaxTokens}
              onChange={(e) => updateField("marcelaMaxTokens", parseInt(e.target.value) || 2048)}
              className="bg-white"
              data-testid="input-marcela-max-tokens"
            />
            <p className="text-xs text-muted-foreground">Maximum response length for text conversations</p>
          </div>
          <div className="space-y-2">
            <Label className="label-text font-medium flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              Max Tokens (Voice)
            </Label>
            <Input
              type="number"
              min={128}
              max={4096}
              value={draft.marcelaMaxTokensVoice}
              onChange={(e) => updateField("marcelaMaxTokensVoice", parseInt(e.target.value) || 1024)}
              className="bg-white"
              data-testid="input-marcela-max-tokens-voice"
            />
            <p className="text-xs text-muted-foreground">Shorter for voice to keep responses conversational</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
