import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Save, Loader2, LayoutTemplate, Timer, ImageIcon,
  Palette, Minimize2, Maximize2, Square, MapPin, Info,
  MessageSquareText, Mic, Eye, Languages, ThumbsUp, Paintbrush,
} from "lucide-react";
import { VoiceSettings } from "./types";
import { useAgentConfig } from "@/features/ai-agent/hooks/use-convai-api";
import { useSaveWidgetSettings, type WidgetSettingsPayload } from "@/features/ai-agent/hooks/use-convai-api";

interface WidgetSettingsProps {
  draft: VoiceSettings;
  updateField: <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => void;
}

const WIDGET_VARIANTS = [
  { value: "compact", label: "Compact", desc: "Floating bubble, expands on click", icon: Minimize2, default: true },
  { value: "full", label: "Full", desc: "Always-visible expanded panel", icon: Maximize2, default: false },
  { value: "tiny", label: "Tiny", desc: "Minimal floating icon", icon: Square, default: false },
];

const PLACEMENTS = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom", label: "Bottom Center" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
  { value: "top", label: "Top Center" },
];

const FEEDBACK_MODES = [
  { value: "none", label: "None" },
  { value: "during", label: "During Conversation" },
  { value: "end", label: "After Conversation" },
];

export function WidgetSettingsComponent({ draft, updateField }: WidgetSettingsProps) {
  const saveWidgetSettings = useSaveWidgetSettings();
  const { data: agentConfig } = useAgentConfig();

  // Read current widget config from ElevenLabs agent
  const widgetConfig = agentConfig?.platform_settings?.widget;

  // Local draft state — initialized from ElevenLabs config
  const [d, setD] = useState<WidgetSettingsPayload>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!widgetConfig) return;
    setD({
      variant: widgetConfig.variant ?? "compact",
      placement: widgetConfig.placement ?? "bottom-right",
      dismissible: widgetConfig.dismissible ?? true,
      default_expanded: widgetConfig.default_expanded ?? false,
      avatar_url: widgetConfig.avatar?.type === "image" ? widgetConfig.avatar.url
        : widgetConfig.avatar?.type === "url" ? widgetConfig.avatar.custom_url : "",
      avatar_orb_color_1: widgetConfig.avatar?.type === "orb" ? widgetConfig.avatar.color_1 : "#2792dc",
      avatar_orb_color_2: widgetConfig.avatar?.type === "orb" ? widgetConfig.avatar.color_2 : "#9ce6e6",
      text_input_enabled: widgetConfig.text_input_enabled ?? true,
      mic_muting_enabled: widgetConfig.mic_muting_enabled ?? false,
      transcript_enabled: widgetConfig.transcript_enabled ?? true,
      conversation_mode_toggle_enabled: widgetConfig.conversation_mode_toggle_enabled ?? false,
      language_selector: widgetConfig.language_selector ?? true,
      feedback_mode: widgetConfig.feedback_mode ?? "none",
      bg_color: widgetConfig.bg_color ?? "#ffffff",
      text_color: widgetConfig.text_color ?? "#000000",
      btn_color: widgetConfig.btn_color ?? "#000000",
      btn_text_color: widgetConfig.btn_text_color ?? "#ffffff",
      border_color: widgetConfig.border_color ?? "#e1e1e1",
      focus_color: widgetConfig.focus_color ?? "#000000",
      turn_timeout: draft.marcelaTurnTimeout ?? 7,
    });
  }, [widgetConfig, draft.marcelaTurnTimeout]);

  const update = <K extends keyof WidgetSettingsPayload>(key: K, value: WidgetSettingsPayload[K]) => {
    setD(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    saveWidgetSettings.mutate(d, { onSuccess: () => setDirty(false) });
  };

  const useOrbAvatar = !d.avatar_url;

  return (
    <div className="space-y-6">
      {/* Layout */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center">
                <LayoutTemplate className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Layout &amp; Size</CardTitle>
                <CardDescription className="label-text mt-0.5">
                  Widget variant, placement, and display behavior.
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saveWidgetSettings.isPending}
              className="gap-1.5 shadow-sm"
              data-testid="button-save-widget-settings"
            >
              {saveWidgetSettings.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Variant */}
          <div className="space-y-2">
            <Label className="label-text font-medium">Widget Size</Label>
            <div className="grid grid-cols-3 gap-3">
              {WIDGET_VARIANTS.map((v) => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => update("variant", v.value)}
                    data-testid={`widget-variant-${v.value}`}
                    className={`p-3 rounded-xl border text-left transition-all ${d.variant === v.value ? "border-primary bg-muted shadow-sm ring-1 ring-primary/30" : "border-muted-foreground/20 hover:border-border"}`}
                  >
                    <div className="mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <p className={`text-xs font-semibold ${d.variant === v.value ? "text-primary" : "text-foreground"}`}>{v.label}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{v.desc}</p>
                    {v.default && <Badge variant="secondary" className="mt-1 text-[9px] px-1.5 py-0 h-4">Default</Badge>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Placement + toggles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="label-text font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Placement
              </Label>
              <Select value={d.placement ?? "bottom-right"} onValueChange={(v) => update("placement", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="label-text text-xs">Dismissible</Label>
                <Switch checked={d.dismissible ?? true} onCheckedChange={(v) => update("dismissible", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="label-text text-xs">Start Expanded</Label>
                <Switch checked={d.default_expanded ?? false} onCheckedChange={(v) => update("default_expanded", v)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Turn Timeout */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="label-text font-medium flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                Turn Timeout
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
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center">
              <Eye className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Features</CardTitle>
              <CardDescription className="label-text mt-0.5">
                Toggle widget capabilities — all synced to ElevenLabs.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <FeatureToggle
              icon={<MessageSquareText className="w-3.5 h-3.5" />}
              label="Text Input"
              desc="Users can type messages"
              checked={d.text_input_enabled ?? true}
              onChange={(v) => update("text_input_enabled", v)}
            />
            <FeatureToggle
              icon={<Mic className="w-3.5 h-3.5" />}
              label="Mic Muting"
              desc="Users can mute their mic"
              checked={d.mic_muting_enabled ?? false}
              onChange={(v) => update("mic_muting_enabled", v)}
            />
            <FeatureToggle
              icon={<Eye className="w-3.5 h-3.5" />}
              label="Transcript"
              desc="Show conversation transcript"
              checked={d.transcript_enabled ?? true}
              onChange={(v) => update("transcript_enabled", v)}
            />
            <FeatureToggle
              icon={<Languages className="w-3.5 h-3.5" />}
              label="Language Selector"
              desc="Language menu in widget"
              checked={d.language_selector ?? true}
              onChange={(v) => update("language_selector", v)}
            />
            <FeatureToggle
              icon={<MessageSquareText className="w-3.5 h-3.5" />}
              label="Voice/Text Toggle"
              desc="Switch between voice &amp; text modes"
              checked={d.conversation_mode_toggle_enabled ?? false}
              onChange={(v) => update("conversation_mode_toggle_enabled", v)}
            />
            <div className="space-y-1.5">
              <Label className="label-text font-medium flex items-center gap-1.5 text-xs">
                <ThumbsUp className="w-3.5 h-3.5" />
                Feedback
              </Label>
              <Select value={d.feedback_mode ?? "none"} onValueChange={(v) => update("feedback_mode", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FEEDBACK_MODES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Avatar</CardTitle>
              <CardDescription className="label-text mt-0.5">
                Image URL or animated orb with custom gradient colors.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="label-text font-medium text-xs">Image URL (leave empty for orb)</Label>
            <Input
              value={d.avatar_url ?? ""}
              onChange={(e) => update("avatar_url", e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="bg-card border-border h-8 text-xs"
            />
            {d.avatar_url && (
              <div className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-lg border border-border/60">
                <img src={d.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-border" onError={(e) => (e.currentTarget.style.display = "none")} />
                <p className="text-[10px] text-muted-foreground/70">Preview — shown as the widget's avatar.</p>
              </div>
            )}
          </div>

          {useOrbAvatar && (
            <div className="space-y-3">
              <Label className="label-text font-medium text-xs">Orb Gradient Colors</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={d.avatar_orb_color_1 ?? "#2792dc"}
                    onChange={(e) => update("avatar_orb_color_1", e.target.value)}
                    className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-muted-foreground">{d.avatar_orb_color_1 ?? "#2792dc"}</span>
                </div>
                <span className="text-muted-foreground text-xs">→</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={d.avatar_orb_color_2 ?? "#9ce6e6"}
                    onChange={(e) => update("avatar_orb_color_2", e.target.value)}
                    className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-muted-foreground">{d.avatar_orb_color_2 ?? "#9ce6e6"}</span>
                </div>
                <div
                  className="w-10 h-10 rounded-full ml-auto"
                  style={{ background: `linear-gradient(135deg, ${d.avatar_orb_color_1 ?? "#2792dc"}, ${d.avatar_orb_color_2 ?? "#9ce6e6"})` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Colors */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/15 to-pink-500/5 flex items-center justify-center">
              <Paintbrush className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Widget Colors</CardTitle>
              <CardDescription className="label-text mt-0.5">
                Customize the widget's color scheme to match your brand.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <ColorPicker label="Background" value={d.bg_color ?? "#ffffff"} onChange={(v) => update("bg_color", v)} />
            <ColorPicker label="Text" value={d.text_color ?? "#000000"} onChange={(v) => update("text_color", v)} />
            <ColorPicker label="Button" value={d.btn_color ?? "#000000"} onChange={(v) => update("btn_color", v)} />
            <ColorPicker label="Button Text" value={d.btn_text_color ?? "#ffffff"} onChange={(v) => update("btn_text_color", v)} />
            <ColorPicker label="Border" value={d.border_color ?? "#e1e1e1"} onChange={(v) => update("border_color", v)} />
            <ColorPicker label="Focus" value={d.focus_color ?? "#000000"} onChange={(v) => update("focus_color", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Info note */}
      <div className="flex gap-3 p-3 bg-blue-50/60 border border-blue-200/40 rounded-lg">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-muted-foreground/70">
          Additional customization (text labels, language presets, terms &amp; conditions, markdown settings) can be configured in the <strong>ElevenLabs dashboard</strong> → Agent → Widget tab. Changes there apply automatically.
        </p>
      </div>
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
    <div className="flex items-center justify-between gap-2">
      <div>
        <Label className="label-text font-medium flex items-center gap-1.5 text-xs">
          {icon} {label}
        </Label>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ColorPicker({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="label-text text-[10px] font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-md border border-border cursor-pointer"
        />
        <span className="text-[10px] font-mono text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}
