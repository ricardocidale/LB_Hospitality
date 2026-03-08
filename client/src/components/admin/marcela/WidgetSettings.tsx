import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Save, Loader2, LayoutTemplate, Timer, ImageIcon, Phone, Mic,
  MessageSquareText, Palette,
} from "lucide-react";
import { VoiceSettings } from "./types";
import { Orb } from "@/features/ai-agent/components/orb";
import { BarVisualizer } from "@/features/ai-agent/components/bar-visualizer";
import { Matrix } from "@/features/ai-agent/components/matrix";
import { useSaveWidgetSettings } from "@/features/ai-agent/hooks/use-convai-api";

interface WidgetSettingsProps {
  draft: VoiceSettings;
  updateField: <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => void;
}

const WIDGET_VARIANTS = [
  { value: "elevenlabs", label: "ElevenLabs", desc: "Default embeddable widget", preview: "elevenlabs" },
  { value: "compact", label: "Compact", desc: "Icon + label", preview: null },
  { value: "full", label: "Full", desc: "Expanded panel", preview: null },
  { value: "orb", label: "Orb", desc: "Animated 3D sphere", preview: "orb" },
  { value: "bars", label: "Bars", desc: "Live frequency bars", preview: "bars" },
  { value: "matrix", label: "Matrix", desc: "LED pixel grid", preview: "matrix" },
  { value: "conversation-bar", label: "Voice Bar", desc: "Full voice + text input", preview: "conversation-bar" },
];

export function WidgetSettingsComponent({ draft, updateField }: WidgetSettingsProps) {
  const saveWidgetSettings = useSaveWidgetSettings();
  const [avatarDraft, setAvatarDraft] = useState(draft.marcelaAvatarUrl ?? "");
  const [turnDraft, setTurnDraft] = useState(draft.marcelaTurnTimeout ?? 7);
  const [variantDraft, setVariantDraft] = useState(draft.marcelaWidgetVariant ?? "elevenlabs");
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
                  Choose how the AI agent appears to users on the page.
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {WIDGET_VARIANTS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => { setVariantDraft(v.value); setWidgetDirty(true); }}
                  data-testid={`widget-variant-${v.value}`}
                  className={`p-3 rounded-xl border text-left transition-all ${variantDraft === v.value ? "border-primary bg-muted shadow-sm ring-1 ring-primary/30" : "border-muted-foreground/20 hover:border-border"}`}
                >
                  {v.preview === "elevenlabs" && (
                    <ElevenLabsPreview />
                  )}
                  {v.preview === "orb" && (
                    <div className="w-10 h-10 mb-2">
                      <Orb colors={["#9fbca4", "#4a7c5c"]} agentState="thinking" seed={7} />
                    </div>
                  )}
                  {v.preview === "bars" && (
                    <div className="mb-2">
                      <BarVisualizer
                        state="speaking"
                        barCount={8}
                        demo={true}
                        minHeight={20}
                        maxHeight={100}
                        centerAlign={true}
                        className="h-10 bg-transparent rounded-lg p-0 gap-0.5"
                      />
                    </div>
                  )}
                  {v.preview === "matrix" && (
                    <div className="mb-2">
                      <Matrix
                        rows={5}
                        cols={8}
                        mode="vu"
                        levels={[0.3, 0.5, 0.7, 0.5, 0.3, 0.6, 0.4, 0.8]}
                        size={6}
                        gap={1}
                        palette={{ on: "#4a7c5c", off: "#e8f0ea" }}
                        className="rounded-lg overflow-hidden"
                      />
                    </div>
                  )}
                  {v.preview === "conversation-bar" && (
                    <div className="mb-2 flex items-center gap-1.5 bg-muted/60 border border-border/60 rounded-full px-2.5 py-1.5 w-fit">
                      <Phone className="w-3 h-3 text-muted-foreground/60" />
                      <div className="flex items-end gap-0.5 h-3.5">
                        {[0.4, 0.75, 1, 0.75, 0.4].map((h, idx) => (
                          <div key={idx} className="w-0.5 bg-primary/40 rounded-full" style={{ height: `${h * 14}px` }} />
                        ))}
                      </div>
                      <Mic className="w-3 h-3 text-muted-foreground/40" />
                    </div>
                  )}
                  <p className={`text-xs font-semibold ${variantDraft === v.value ? "text-primary" : "text-foreground"}`}>{v.label}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{v.desc}</p>
                  {v.value === "elevenlabs" && (
                    <Badge variant="secondary" className="mt-1 text-[9px] px-1.5 py-0 h-4">Default</Badge>
                  )}
                </button>
              ))}
            </div>
            {variantDraft === "elevenlabs" && (
              <p className="text-[11px] text-muted-foreground/70 bg-blue-50/60 border border-blue-200/40 rounded-lg px-3 py-2">
                Uses the standard ElevenLabs embeddable widget with built-in chat UI, voice/text toggle, and feedback collection. This is the same widget you would get from the ElevenLabs dashboard.
              </p>
            )}
            {(variantDraft === "orb" || variantDraft === "bars" || variantDraft === "matrix" || variantDraft === "conversation-bar") && (
              <p className="text-[11px] text-muted-foreground/70 bg-blue-50/60 border border-blue-200/40 rounded-lg px-3 py-2">
                {variantDraft === "conversation-bar"
                  ? "Voice Bar replaces the native widget with a full voice + text interface using the @elevenlabs/react SDK (WebRTC)."
                  : "Custom component replaces the native ElevenLabs widget button. Users see the animated visual instead."}
              </p>
            )}
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

function ElevenLabsPreview() {
  return (
    <div className="mb-2 flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-black to-gray-800 flex items-center justify-center shadow-md">
        <MessageSquareText className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}
