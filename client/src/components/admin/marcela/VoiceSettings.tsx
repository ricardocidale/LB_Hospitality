import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Volume2, Waves, AudioLines, Zap, Gauge, Timer, Clock, Settings2, Loader2, Save } from "lucide-react";
import { VoiceSettings, OUTPUT_FORMATS } from "./types";
import { useSaveAgentVoice } from "@/features/ai-agent/hooks/use-convai-api";

interface VoiceSettingsProps {
  draft: VoiceSettings;
  updateField: <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => void;
}

export function VoiceSettingsComponent({ draft, updateField }: VoiceSettingsProps) {
  const saveAgentVoice = useSaveAgentVoice();
  const [voiceDirty, setVoiceDirty] = useState(false);

  const handleVoiceField = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    updateField(key, value);
    setVoiceDirty(true);
  };

  const handleSaveVoice = () => {
    saveAgentVoice.mutate({
      voice_id: draft.marcelaVoiceId,
      stability: draft.marcelaStability,
      similarity_boost: draft.marcelaSimilarityBoost,
      use_speaker_boost: draft.marcelaSpeakerBoost,
      speed: draft.marcelaSpeed,
      agent_output_audio_format: draft.marcelaOutputFormat,
      turn_timeout: draft.marcelaTurnTimeout,
      silence_end_call_timeout: draft.marcelaSilenceEndCallTimeout,
      max_duration_seconds: draft.marcelaMaxDuration,
    }, { onSuccess: () => setVoiceDirty(false) });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                Voice Synthesis
              </CardTitle>
              <CardDescription className="label-text mt-1">
                Core voice settings pushed to ElevenLabs. Fine-tune additional TTS/ASR options in the ElevenLabs dashboard.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {voiceDirty && (
                <Badge variant="outline" className="text-amber-600 border-amber-300/60 bg-amber-50/80 text-xs">
                  Unsaved
                </Badge>
              )}
              <Button size="sm" onClick={handleSaveVoice} disabled={!voiceDirty || saveAgentVoice.isPending} className="gap-1.5 shadow-sm">
                {saveAgentVoice.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="label-text font-medium">Voice ID</Label>
            <Input
              value={draft.marcelaVoiceId}
              onChange={(e) => handleVoiceField("marcelaVoiceId", e.target.value)}
              placeholder="ElevenLabs voice ID"
              className="bg-card font-mono text-sm"
              data-testid="input-marcela-voice-id"
            />
            <p className="text-xs text-muted-foreground">Default: Jessica Anne Bogart (cgSgspJ2msm6clMCkdW9)</p>
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
                onValueChange={([v]) => handleVoiceField("marcelaStability", v)}
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
                onValueChange={([v]) => handleVoiceField("marcelaSimilarityBoost", v)}
                data-testid="slider-marcela-similarity"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>More diverse, less like original</span>
                <span>Closer to original voice</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="label-text font-medium flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" />
                  Speed
                </Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {draft.marcelaSpeed.toFixed(2)}x
                </Badge>
              </div>
              <Slider
                min={0.5}
                max={2.0}
                step={0.05}
                value={[draft.marcelaSpeed]}
                onValueChange={([v]) => handleVoiceField("marcelaSpeed", v)}
                data-testid="slider-marcela-speed"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Slower</span>
                <span>Normal (1.0x)</span>
                <span>Faster</span>
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
              onCheckedChange={(v) => handleVoiceField("marcelaSpeakerBoost", v)}
              data-testid="switch-marcela-speaker-boost"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            Conversation Settings
          </CardTitle>
          <CardDescription className="label-text">
            Timeouts and audio pipeline configuration. Additional turn-taking, ASR, and VAD settings are managed in the ElevenLabs dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="label-text font-medium">Output Format</Label>
            <Select value={draft.marcelaOutputFormat} onValueChange={(v) => handleVoiceField("marcelaOutputFormat", v)}>
              <SelectTrigger className="bg-card" data-testid="select-marcela-output-format">
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

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="label-text font-medium flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                Turn Timeout
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={draft.marcelaTurnTimeout}
                  onChange={(e) => handleVoiceField("marcelaTurnTimeout", parseInt(e.target.value) || 7)}
                  className="bg-card"
                  data-testid="input-marcela-turn-timeout"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">sec</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Wait time for user response before agent speaks again
              </p>
            </div>

            <div className="space-y-2">
              <Label className="label-text font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Silence End Call
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={10}
                  max={600}
                  value={draft.marcelaSilenceEndCallTimeout}
                  onChange={(e) => handleVoiceField("marcelaSilenceEndCallTimeout", parseInt(e.target.value) || 30)}
                  className="bg-card"
                  data-testid="input-marcela-silence-end-call"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">sec</span>
              </div>
              <p className="text-xs text-muted-foreground">
                End call after this many seconds of silence
              </p>
            </div>

            <div className="space-y-2">
              <Label className="label-text font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Max Duration
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={60}
                  max={3600}
                  value={draft.marcelaMaxDuration}
                  onChange={(e) => handleVoiceField("marcelaMaxDuration", parseInt(e.target.value) || 600)}
                  className="bg-card"
                  data-testid="input-marcela-max-duration"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">sec</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum conversation length
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
