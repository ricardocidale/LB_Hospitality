import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Volume2, Waves, AudioLines, Zap, Settings2 } from "lucide-react";
import { VoiceSettings, TTS_MODELS, OUTPUT_FORMATS, STT_MODELS } from "./types";

interface VoiceSettingsProps {
  draft: VoiceSettings;
  updateField: <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => void;
}

export function VoiceSettingsComponent({ draft, updateField }: VoiceSettingsProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Volume2 className="w-5 h-5 text-primary" />
            Text-to-Speech (ElevenLabs)
          </CardTitle>
          <CardDescription className="label-text">
            Configure the voice synthesis settings for the agent's spoken responses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="label-text font-medium">Voice ID</Label>
              <Input
                value={draft.marcelaVoiceId}
                onChange={(e) => updateField("marcelaVoiceId", e.target.value)}
                placeholder="ElevenLabs voice ID"
                className="bg-white font-mono text-sm"
                data-testid="input-marcela-voice-id"
              />
              <p className="text-xs text-muted-foreground">Default: Jessica (cgSgspJ2msm6clMCkdW9)</p>
            </div>
            <div className="space-y-2">
              <Label className="label-text font-medium">TTS Model</Label>
              <Select value={draft.marcelaTtsModel} onValueChange={(v) => updateField("marcelaTtsModel", v)}>
                <SelectTrigger className="bg-white" data-testid="select-marcela-tts-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TTS_MODELS.map((m) => (
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
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="label-text font-medium flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5" />
                  Stability
                </Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {draft.marcelaStability.toFixed(2)}
                </Badge>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[draft.marcelaStability]}
                onValueChange={([v]) => updateField("marcelaStability", v)}
                data-testid="slider-marcela-stability"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>More variable & expressive</span>
                <span>More stable & consistent</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="label-text font-medium flex items-center gap-1.5">
                  <AudioLines className="w-3.5 h-3.5" />
                  Similarity Boost
                </Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {draft.marcelaSimilarityBoost.toFixed(2)}
                </Badge>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[draft.marcelaSimilarityBoost]}
                onValueChange={([v]) => updateField("marcelaSimilarityBoost", v)}
                data-testid="slider-marcela-similarity"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>More diverse, less like original</span>
                <span>Closer to original voice</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div>
              <Label className="label-text font-medium flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Speaker Boost
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Amplifies voice clarity at the cost of slightly higher latency
              </p>
            </div>
            <Switch
              checked={draft.marcelaSpeakerBoost}
              onCheckedChange={(v) => updateField("marcelaSpeakerBoost", v)}
              data-testid="switch-marcela-speaker-boost"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Settings2 className="w-5 h-5 text-primary" />
            Advanced Audio Settings
          </CardTitle>
          <CardDescription className="label-text">
            Low-level audio pipeline configuration for streaming and transcription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="label-text font-medium">Output Format</Label>
              <Select value={draft.marcelaOutputFormat} onValueChange={(v) => updateField("marcelaOutputFormat", v)}>
                <SelectTrigger className="bg-white" data-testid="select-marcela-output-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTPUT_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <div className="flex items-center gap-2">
                        <span>{f.label}</span>
                        <span className="text-xs text-muted-foreground">— {f.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="label-text font-medium">STT Model</Label>
              <Select value={draft.marcelaSttModel} onValueChange={(v) => updateField("marcelaSttModel", v)}>
                <SelectTrigger className="bg-white" data-testid="select-marcela-stt-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STT_MODELS.map((m) => (
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
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="label-text font-medium">Chunk Length Schedule</Label>
            <Input
              value={draft.marcelaChunkSchedule}
              onChange={(e) => updateField("marcelaChunkSchedule", e.target.value)}
              placeholder="120,160,250,290"
              className="bg-white font-mono text-sm"
              data-testid="input-marcela-chunk-schedule"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated chunk sizes (in characters) for WebSocket streaming latency optimization.
              Smaller initial values reduce time to first audio.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
