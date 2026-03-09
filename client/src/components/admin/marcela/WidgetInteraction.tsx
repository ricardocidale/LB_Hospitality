import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { IconSave, IconMessageSquareText, IconMic, IconEye, IconLanguages, IconThumbsUp, IconTimer, IconToggleLeft, IconMaximize2 } from "@/components/icons";
import { useAgentConfig, useSaveWidgetSettings, type WidgetSettingsPayload } from "./hooks";
import { VoiceSettings } from "./types";

const FEEDBACK_MODES = [
  { value: "none", label: "None" },
  { value: "during", label: "During Conversation" },
  { value: "end", label: "After Conversation" },
];

interface WidgetInteractionProps {
  draft: VoiceSettings;
  updateField: <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => void;
}

export function WidgetInteraction({ draft, updateField }: WidgetInteractionProps) {
  const save = useSaveWidgetSettings();
  const { data: agentConfig } = useAgentConfig();
  const w = agentConfig?.platform_settings?.widget;

  const [d, setD] = useState<WidgetSettingsPayload>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!w) return;
    setD({
      text_input_enabled: w.text_input_enabled ?? true,
      mic_muting_enabled: w.mic_muting_enabled ?? false,
      transcript_enabled: w.transcript_enabled ?? true,
      conversation_mode_toggle_enabled: w.conversation_mode_toggle_enabled ?? false,
      language_selector: w.language_selector ?? true,
      feedback_mode: w.feedback_mode ?? "none",
      dismissible: w.dismissible ?? true,
      default_expanded: w.default_expanded ?? false,
      turn_timeout: draft.marcelaTurnTimeout ?? 7,
    });
  }, [w, draft.marcelaTurnTimeout]);

  const update = <K extends keyof WidgetSettingsPayload>(key: K, value: WidgetSettingsPayload[K]) => {
    setD((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => save.mutate(d, { onSuccess: () => setDirty(false) });

  return (
    <div className="space-y-6">
      {/* Input & Output Features */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center">
                <IconToggleLeft className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Input &amp; Output</CardTitle>
                <CardDescription className="label-text mt-0.5">
                  Control how users interact with the agent — voice, text, transcript, and language.
                </CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={handleSave} disabled={!dirty || save.isPending} className="gap-1.5 shadow-sm">
              {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconSave className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
            <FeatureToggle
              icon={<IconMessageSquareText className="w-4 h-4" />}
              label="Text Input"
              desc="Users can type messages in addition to speaking"
              checked={d.text_input_enabled ?? true}
              onChange={(v) => update("text_input_enabled", v)}
            />
            <FeatureToggle
              icon={<IconMic className="w-4 h-4" />}
              label="Mic Muting"
              desc="Users can mute their microphone during conversation"
              checked={d.mic_muting_enabled ?? false}
              onChange={(v) => update("mic_muting_enabled", v)}
            />
            <FeatureToggle
              icon={<IconEye className="w-4 h-4" />}
              label="Transcript"
              desc="Show real-time conversation transcript"
              checked={d.transcript_enabled ?? true}
              onChange={(v) => update("transcript_enabled", v)}
            />
            <FeatureToggle
              icon={<IconLanguages className="w-4 h-4" />}
              label="Language Selector"
              desc="Show language menu in the widget header"
              checked={d.language_selector ?? true}
              onChange={(v) => update("language_selector", v)}
            />
            <FeatureToggle
              icon={<IconMessageSquareText className="w-4 h-4" />}
              label="Voice / Text Toggle"
              desc="Let users switch between voice and text modes"
              checked={d.conversation_mode_toggle_enabled ?? false}
              onChange={(v) => update("conversation_mode_toggle_enabled", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 flex items-center justify-center">
              <IconThumbsUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Feedback Collection</CardTitle>
              <CardDescription className="label-text mt-0.5">
                When to prompt users for conversation feedback.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-1.5">
            <Label className="label-text font-medium text-xs">Feedback Mode</Label>
            <Select value={d.feedback_mode ?? "none"} onValueChange={(v) => update("feedback_mode", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FEEDBACK_MODES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground/60">
              "During" shows a thumbs-up/down while chatting. "After" shows a rating prompt when the conversation ends.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Behavior */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 flex items-center justify-center">
              <IconTimer className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Behavior</CardTitle>
              <CardDescription className="label-text mt-0.5">
                Turn timing, widget dismissibility, and initial state.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Turn timeout */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="label-text font-medium flex items-center gap-1.5 text-xs">
                <IconTimer className="w-3.5 h-3.5" /> Turn Timeout
              </Label>
              <Badge variant="outline" className="font-mono text-xs">{d.turn_timeout ?? 7}s</Badge>
            </div>
            <Slider
              min={3} max={30} step={1}
              value={[d.turn_timeout ?? 7]}
              onValueChange={([v]) => update("turn_timeout", v)}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>3s — snappy</span>
              <span>30s — patient</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              Seconds of silence before the agent takes its turn. 7-12s works well for financial discussions.
            </p>
          </div>

          <Separator />

          {/* Display toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FeatureToggle
              icon={<IconMaximize2 className="w-4 h-4" />}
              label="Dismissible"
              desc="Users can minimize the widget"
              checked={d.dismissible ?? true}
              onChange={(v) => update("dismissible", v)}
            />
            <FeatureToggle
              icon={<IconMaximize2 className="w-4 h-4" />}
              label="Start Expanded"
              desc="Widget opens expanded on page load"
              checked={d.default_expanded ?? false}
              onChange={(v) => update("default_expanded", v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureToggle({
  icon, label, desc, checked, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-gradient-to-r from-muted/30 to-transparent">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground/60">{icon}</div>
        <div>
          <Label className="label-text font-medium text-xs">{label}</Label>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
