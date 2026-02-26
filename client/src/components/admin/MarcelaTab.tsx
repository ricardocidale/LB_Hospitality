import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaveButton } from "@/components/ui/save-button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Mic, Volume2, Brain, Settings2, Waves, Zap,
  AudioLines, MessageSquare, Shield
} from "lucide-react";

interface VoiceSettings {
  marcelaVoiceId: string;
  marcelaTtsModel: string;
  marcelaSttModel: string;
  marcelaOutputFormat: string;
  marcelaStability: number;
  marcelaSimilarityBoost: number;
  marcelaSpeakerBoost: boolean;
  marcelaChunkSchedule: string;
  marcelaLlmModel: string;
  marcelaMaxTokens: number;
  marcelaMaxTokensVoice: number;
  marcelaEnabled: boolean;
  showAiAssistant: boolean;
}

const TTS_MODELS = [
  { value: "eleven_flash_v2_5", label: "Flash v2.5", description: "Lowest latency, ideal for real-time streaming" },
  { value: "eleven_flash_v2", label: "Flash v2", description: "Low latency, good quality" },
  { value: "eleven_multilingual_v2", label: "Multilingual v2", description: "High quality, supports 29 languages" },
  { value: "eleven_turbo_v2_5", label: "Turbo v2.5", description: "Balanced latency and quality" },
  { value: "eleven_turbo_v2", label: "Turbo v2", description: "Fast generation with good quality" },
  { value: "eleven_monolingual_v1", label: "Monolingual v1", description: "English only, reliable quality" },
];

const STT_MODELS = [
  { value: "scribe_v1", label: "Scribe v1", description: "ElevenLabs native transcription" },
];

const OUTPUT_FORMATS = [
  { value: "pcm_16000", label: "PCM 16kHz", description: "16-bit PCM at 16kHz — optimal for real-time streaming" },
  { value: "pcm_22050", label: "PCM 22.05kHz", description: "16-bit PCM at 22.05kHz — higher quality" },
  { value: "pcm_24000", label: "PCM 24kHz", description: "16-bit PCM at 24kHz — studio quality" },
  { value: "pcm_44100", label: "PCM 44.1kHz", description: "16-bit PCM at 44.1kHz — CD quality" },
  { value: "mp3_44100_128", label: "MP3 128kbps", description: "Compressed audio, higher latency" },
  { value: "ulaw_8000", label: "μ-law 8kHz", description: "Telephony standard" },
];

const LLM_MODELS = [
  { value: "gpt-4.1", label: "GPT-4.1", description: "Latest OpenAI model — best reasoning" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini", description: "Faster, more economical" },
  { value: "gpt-4.1-nano", label: "GPT-4.1 Nano", description: "Fastest, most economical" },
  { value: "gpt-4o", label: "GPT-4o", description: "Previous flagship model" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Compact but capable" },
];

export default function MarcelaTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: globalData, isLoading } = useQuery<VoiceSettings>({
    queryKey: ["admin", "voice-settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/voice-settings");
      return res.json();
    },
  });

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

  const saveMutation = useMutation({
    mutationFn: async (settings: VoiceSettings) => {
      const res = await apiRequest("POST", "/api/admin/voice-settings", settings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "voice-settings"] });
      queryClient.invalidateQueries({ queryKey: ["global-assumptions"] });
      setIsDirty(false);
      toast({ title: "Marcela settings saved", description: "Voice configuration updated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

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

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Volume2 className="w-5 h-5 text-primary" />
            Text-to-Speech (ElevenLabs)
          </CardTitle>
          <CardDescription className="label-text">
            Configure the voice synthesis settings for Marcela's spoken responses.
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

      <SaveButton
        onClick={() => draft && saveMutation.mutate(draft)}
        disabled={!isDirty}
        isPending={saveMutation.isPending}
      />
    </div>
  );
}
