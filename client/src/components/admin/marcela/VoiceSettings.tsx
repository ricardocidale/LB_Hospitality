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
import { Volume2, Waves, AudioLines, Zap, Settings2, Timer, ImageIcon, Loader2, Save, LayoutTemplate } from "lucide-react";
import { VoiceSettings, TTS_MODELS, OUTPUT_FORMATS, STT_MODELS } from "./types";
import { useSaveWidgetSettings, useSaveAgentVoice } from "./hooks";

interface VoiceSettingsProps {
  draft: VoiceSettings;
  updateField: <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => void;
}

export function VoiceSettingsComponent({ draft, updateField }: VoiceSettingsProps) {
  const saveWidgetSettings = useSaveWidgetSettings();
  const saveAgentVoice = useSaveAgentVoice();
  const [avatarDraft, setAvatarDraft] = useState(draft.marcelaAvatarUrl ?? "");
  const [turnDraft, setTurnDraft] = useState(draft.marcelaTurnTimeout ?? 7);
  const [variantDraft, setVariantDraft] = useState(draft.marcelaWidgetVariant ?? "compact");
  const [widgetDirty, setWidgetDirty] = useState(false);
  const [voiceDirty, setVoiceDirty] = useState(false);

  const handleVoiceField = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    updateField(key, value);
    setVoiceDirty(true);
  };

  const handleSaveVoice = () => {
    saveAgentVoice.mutate({
      voice_id: draft.marcelaVoiceId,
      model_id: draft.marcelaTtsModel,
      stability: draft.marcelaStability,
      similarity_boost: draft.marcelaSimilarityBoost,
      use_speaker_boost: draft.marcelaSpeakerBoost,
    }, { onSuccess: () => setVoiceDirty(false) });
  };

  const handleSaveWidget = () => {
    saveWidgetSettings.mutate(
      { turn_timeout: turnDraft, avatar_url: avatarDraft, widget_variant: variantDraft },
      { onSuccess: () => setWidgetDirty(false) }
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-display">
                <Volume2 className="w-5 h-5 text-primary" />
                Text-to-Speech (ElevenLabs)
              </CardTitle>
              <CardDescription className="label-text mt-1">
                Configure the voice synthesis settings for the agent's spoken responses.
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
                Save to ElevenLabs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="label-text font-medium">Voice ID</Label>
              <Input
                value={draft.marcelaVoiceId}
                onChange={(e) => handleVoiceField("marcelaVoiceId", e.target.value)}
                placeholder="ElevenLabs voice ID"
                className="bg-white font-mono text-sm"
                data-testid="input-marcela-voice-id"
              />
              <p className="text-xs text-muted-foreground">Default: Jessica (cgSgspJ2msm6clMCkdW9)</p>
            </div>
            <div className="space-y-2">
              <Label className="label-text font-medium">TTS Model</Label>
              <Select value={draft.marcelaTtsModel} onValueChange={(v) => handleVoiceField("marcelaTtsModel", v)}>
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

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="font-display text-base">Widget Settings</CardTitle>
                <CardDescription className="label-text mt-0.5">
                  Conversation turn timeout and avatar image — pushed directly to ElevenLabs.
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSaveWidget}
              disabled={!widgetDirty || saveWidgetSettings.isPending}
              className="gap-1.5 shadow-sm"
            >
              {saveWidgetSettings.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save to ElevenLabs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="label-text font-medium flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                Turn Timeout
              </Label>
              <Badge variant="outline" className="font-mono text-xs">{turnDraft}s</Badge>
            </div>
            <Slider
              min={3}
              max={30}
              step={1}
              value={[turnDraft]}
              onValueChange={([v]) => { setTurnDraft(v); setWidgetDirty(true); }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3s — snappy</span>
              <span>30s — patient</span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Seconds of silence before the agent takes its turn. 7–12s works well for financial discussions.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="label-text font-medium flex items-center gap-1.5">
              <LayoutTemplate className="w-3.5 h-3.5" />
              Widget Variant
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "tiny", label: "Tiny", desc: "Icon only" },
                { value: "compact", label: "Compact", desc: "Icon + label" },
                { value: "full", label: "Full", desc: "Expanded panel" },
              ].map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => { setVariantDraft(v.value); setWidgetDirty(true); }}
                  className={`p-3 rounded-xl border text-left transition-all ${variantDraft === v.value ? "border-primary bg-primary/5 shadow-sm" : "border-muted-foreground/20 hover:border-primary/30"}`}
                >
                  <p className={`text-xs font-semibold ${variantDraft === v.value ? "text-primary" : "text-foreground"}`}>{v.label}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{v.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="label-text font-medium flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              Avatar Image URL
            </Label>
            <Input
              value={avatarDraft}
              onChange={(e) => { setAvatarDraft(e.target.value); setWidgetDirty(true); }}
              placeholder="https://example.com/avatar.png"
              className="bg-white/60 border-primary/15 focus:border-primary/30 transition-colors"
            />
            {avatarDraft && (
              <div className="flex items-center gap-3 p-3 bg-primary/[0.03] rounded-xl border border-primary/10">
                <img src={avatarDraft} alt="Avatar preview" className="w-10 h-10 rounded-full object-cover border border-primary/20" onError={(e) => (e.currentTarget.style.display = "none")} />
                <p className="text-xs text-muted-foreground/70">Preview — shown as the widget's avatar bubble.</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground/60">
              Direct URL to a square image (PNG or JPG recommended). Appears as the circular avatar in the ElevenLabs chat widget.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
