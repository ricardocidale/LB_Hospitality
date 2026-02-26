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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Mic, Volume2, Brain, Settings2, Waves, Zap,
  AudioLines, MessageSquare, Shield, Phone, MessageCircle,
  CheckCircle2, XCircle, Send, Copy, ExternalLink, Loader2,
  BookOpen, RefreshCw
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
  marcelaTwilioEnabled: boolean;
  marcelaSmsEnabled: boolean;
  marcelaPhoneGreeting: string;
}

interface TwilioStatus {
  connected: boolean;
  phoneNumber: string | null;
  error?: string;
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

function KnowledgeBaseCard() {
  const { toast } = useToast();

  const { data: kbStatus, refetch: refetchKB } = useQuery<{
    indexed: boolean;
    chunkCount: number;
    indexedAt: string | null;
  }>({
    queryKey: ["admin", "knowledge-base-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/knowledge-base-status");
      return res.json();
    },
  });

  const reindexMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/knowledge-base-reindex");
      return res.json();
    },
    onSuccess: (data: { chunksIndexed: number; timeMs: number }) => {
      refetchKB();
      toast({
        title: "Knowledge Base Indexed",
        description: `${data.chunksIndexed} chunks indexed in ${(data.timeMs / 1000).toFixed(1)}s`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Indexing Failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <CardTitle className="text-base">Knowledge Base (RAG)</CardTitle>
            <CardDescription>
              Marcela searches this knowledge base to answer questions about the platform
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={kbStatus?.indexed ? "default" : "secondary"}
                className={kbStatus?.indexed ? "bg-green-100 text-green-700" : ""}
                data-testid="badge-kb-status"
              >
                {kbStatus?.indexed ? "Indexed" : "Not Indexed"}
              </Badge>
              {kbStatus?.chunkCount ? (
                <span className="text-sm text-muted-foreground" data-testid="text-kb-chunks">
                  {kbStatus.chunkCount} chunks
                </span>
              ) : null}
            </div>
            {kbStatus?.indexedAt && (
              <p className="text-xs text-muted-foreground">
                Last indexed: {new Date(kbStatus.indexedAt).toLocaleString()}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reindexMutation.mutate()}
            disabled={reindexMutation.isPending}
            data-testid="button-reindex-kb"
          >
            {reindexMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {reindexMutation.isPending ? "Indexing..." : "Reindex"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The knowledge base includes: User Manual, Checker Manual, business model specification,
          market research documents, financial formulas, GAAP rules, and platform guides.
          It is automatically indexed on first use.
        </p>
      </CardContent>
    </Card>
  );
}

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

  const { data: twilioStatus } = useQuery<TwilioStatus>({
    queryKey: ["admin", "twilio-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/twilio-status");
      return res.json();
    },
  });

  const [draft, setDraft] = useState<VoiceSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [testSmsTo, setTestSmsTo] = useState("");
  const [testSmsBody, setTestSmsBody] = useState("Hello from Marcela! This is a test message from Hospitality Business Group.");

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

  const sendTestSms = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/send-notification", {
        to: testSmsTo,
        message: testSmsBody,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Test SMS sent", description: `Message sent to ${testSmsTo}` });
    },
    onError: (err: Error) => {
      toast({ title: "SMS failed", description: err.message, variant: "destructive" });
    },
  });

  const baseUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : "";
  const voiceWebhookUrl = `${baseUrl}/api/twilio/voice/incoming`;
  const smsWebhookUrl = `${baseUrl}/api/twilio/sms/incoming`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Webhook URL copied to clipboard" });
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-display">
                <Phone className="w-5 h-5 text-primary" />
                Telephony & SMS (Twilio)
              </CardTitle>
              <CardDescription className="label-text mt-1">
                Configure phone calls and SMS messaging for Marcela via Twilio.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {twilioStatus?.connected ? (
                <Badge variant="default" className="text-sm gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-sm gap-1">
                  <XCircle className="w-3 h-3" />
                  Not Connected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {twilioStatus?.phoneNumber && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Label className="label-text font-medium text-primary">Twilio Phone Number</Label>
              <p className="text-lg font-mono font-semibold mt-1" data-testid="text-twilio-phone">
                {twilioStatus.phoneNumber}
              </p>
            </div>
          )}

          {!twilioStatus?.connected && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                Twilio is not connected. Please configure the Twilio integration in your Replit project settings to enable phone and SMS features.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div>
              <Label className="label-text font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Phone Calls
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow inbound phone calls to Marcela via Twilio Voice
              </p>
            </div>
            <Switch
              checked={draft.marcelaTwilioEnabled}
              onCheckedChange={(v) => updateField("marcelaTwilioEnabled", v)}
              disabled={!twilioStatus?.connected}
              data-testid="switch-marcela-twilio-enabled"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div>
              <Label className="label-text font-medium flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                SMS Messages
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow inbound SMS messages to Marcela via Twilio SMS
              </p>
            </div>
            <Switch
              checked={draft.marcelaSmsEnabled}
              onCheckedChange={(v) => updateField("marcelaSmsEnabled", v)}
              disabled={!twilioStatus?.connected}
              data-testid="switch-marcela-sms-enabled"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="label-text font-medium">Phone Greeting</Label>
            <Textarea
              value={draft.marcelaPhoneGreeting}
              onChange={(e) => updateField("marcelaPhoneGreeting", e.target.value)}
              placeholder="Hello, this is Marcela..."
              className="bg-white min-h-[80px] text-sm"
              data-testid="textarea-phone-greeting"
            />
            <p className="text-xs text-muted-foreground">
              This message is spoken when someone calls the Twilio number before the conversation begins.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="label-text font-medium flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              Webhook URLs
            </Label>
            <p className="text-xs text-muted-foreground">
              Configure these URLs in your Twilio Console for the phone number's webhook settings.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2.5 bg-muted/50 rounded border font-mono text-xs break-all">
                  <span className="text-muted-foreground">Voice: </span>
                  {voiceWebhookUrl}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  onClick={() => copyToClipboard(voiceWebhookUrl)}
                  data-testid="button-copy-voice-webhook"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2.5 bg-muted/50 rounded border font-mono text-xs break-all">
                  <span className="text-muted-foreground">SMS: </span>
                  {smsWebhookUrl}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  onClick={() => copyToClipboard(smsWebhookUrl)}
                  data-testid="button-copy-sms-webhook"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {twilioStatus?.connected && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="label-text font-medium flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Send Test SMS
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    value={testSmsTo}
                    onChange={(e) => setTestSmsTo(e.target.value)}
                    placeholder="+1234567890"
                    className="bg-white font-mono text-sm"
                    data-testid="input-test-sms-to"
                  />
                  <Textarea
                    value={testSmsBody}
                    onChange={(e) => setTestSmsBody(e.target.value)}
                    placeholder="Test message..."
                    className="bg-white min-h-[60px] text-sm"
                    data-testid="textarea-test-sms-body"
                  />
                  <Button
                    onClick={() => sendTestSms.mutate()}
                    disabled={!testSmsTo.trim() || !testSmsBody.trim() || sendTestSms.isPending}
                    className="gap-2"
                    data-testid="button-send-test-sms"
                  >
                    {sendTestSms.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Test
                  </Button>
                </div>
              </div>
            </>
          )}
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

      <KnowledgeBaseCard />

      <SaveButton
        onClick={() => draft && saveMutation.mutate(draft)}
        disabled={!isDirty}
        isPending={saveMutation.isPending}
      />
    </div>
  );
}
