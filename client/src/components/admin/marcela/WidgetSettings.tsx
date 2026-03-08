import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Save, Loader2, LayoutTemplate, Timer, ImageIcon,
  MessageSquareText, Palette, Minimize2, Maximize2, Square,
} from "lucide-react";
import { VoiceSettings } from "./types";
import { useSaveWidgetSettings } from "@/features/ai-agent/hooks/use-convai-api";

interface WidgetSettingsProps {
  draft: VoiceSettings;
  updateField: <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => void;
}

const WIDGET_VARIANTS = [
  {
    value: "compact",
    label: "Compact",
    desc: "Floating bubble with chat panel. Default.",
    icon: Minimize2,
    default: true,
  },
  {
    value: "full",
    label: "Full",
    desc: "Always-visible expanded panel with voice & text.",
    icon: Maximize2,
    default: false,
  },
  {
    value: "tiny",
    label: "Tiny",
    desc: "Minimal floating icon, expands on click.",
    icon: Square,
    default: false,
  },
];

export function WidgetSettingsComponent({ draft, updateField }: WidgetSettingsProps) {
  const saveWidgetSettings = useSaveWidgetSettings();
  const [avatarDraft, setAvatarDraft] = useState(draft.marcelaAvatarUrl ?? "");
  const [turnDraft, setTurnDraft] = useState(draft.marcelaTurnTimeout ?? 7);
  const [variantDraft, setVariantDraft] = useState(draft.marcelaWidgetVariant ?? "compact");
  const [widgetDirty, setWidgetDirty] = useState(false);

  const handleSaveWidget = () => {
    saveWidgetSettings.mutate(
      { turn_timeout: turnDraft, avatar_url: avatarDraft, widget_variant: variantDraft },
      { onSuccess: () => setWidgetDirty(false) }
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center">
                <LayoutTemplate className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Widget Style</CardTitle>
                <CardDescription className="label-text mt-0.5">
                  Choose how the AI agent appears to users. All variants use the native ElevenLabs widget with built-in voice/text, language menus, and feedback.
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSaveWidget}
              disabled={!widgetDirty || saveWidgetSettings.isPending}
              className="gap-1.5 shadow-sm"
              data-testid="button-save-widget-settings"
            >
              {saveWidgetSettings.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="label-text font-medium flex items-center gap-1.5">
              <LayoutTemplate className="w-3.5 h-3.5" />
              Widget Variant
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {WIDGET_VARIANTS.map((v) => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => { setVariantDraft(v.value); setWidgetDirty(true); }}
                    data-testid={`widget-variant-${v.value}`}
                    className={`p-4 rounded-xl border text-left transition-all ${variantDraft === v.value ? "border-primary bg-muted shadow-sm ring-1 ring-primary/30" : "border-muted-foreground/20 hover:border-border"}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-black to-gray-800 flex items-center justify-center shadow-sm">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <p className={`text-xs font-semibold ${variantDraft === v.value ? "text-primary" : "text-foreground"}`}>{v.label}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{v.desc}</p>
                    {v.default && (
                      <Badge variant="secondary" className="mt-1.5 text-[9px] px-1.5 py-0 h-4">Default</Badge>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground/70 bg-blue-50/60 border border-blue-200/40 rounded-lg px-3 py-2">
              All variants use the native ElevenLabs widget with built-in chat UI, voice/text toggle, language menus, feedback collection, and markdown support.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 flex items-center justify-center">
              <Palette className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Widget Appearance</CardTitle>
              <CardDescription className="label-text mt-0.5">
                Turn timeout, avatar image — pushed directly to ElevenLabs.
              </CardDescription>
            </div>
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
              data-testid="slider-widget-turn-timeout"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3s — snappy</span>
              <span>30s — patient</span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Seconds of silence before the agent takes its turn. 7-12s works well for financial discussions.
            </p>
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
              className="bg-card border-border focus:border-border transition-colors"
              data-testid="input-widget-avatar-url"
            />
            {avatarDraft && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/60">
                <img src={avatarDraft} alt="Avatar preview" className="w-10 h-10 rounded-full object-cover border border-border" onError={(e) => (e.currentTarget.style.display = "none")} />
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
