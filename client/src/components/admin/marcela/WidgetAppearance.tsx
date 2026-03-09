import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Card } from "@/components/icons/brand-icons";
import { useAgentConfig, useSaveWidgetSettings, type WidgetSettingsPayload } from "./hooks";

const VARIANTS = [
  { value: "compact", label: "Compact", desc: "Floating bubble, expands on click", icon: IconChevronDown, default: true },
  { value: "full", label: "Full", desc: "Always-visible expanded panel", icon: IconChevronUp, default: false },
  { value: "tiny", label: "Tiny", desc: "Minimal floating icon", icon: IconCheckCircle, default: false },
];

const PLACEMENTS = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom", label: "Bottom Center" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
  { value: "top", label: "Top Center" },
];

export function WidgetAppearance() {
  const save = useSaveWidgetSettings();
  const { data: agentConfig } = useAgentConfig();
  const w = agentConfig?.platform_settings?.widget;

  const [d, setD] = useState<WidgetSettingsPayload>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!w) return;
    setD({
      variant: w.variant ?? "compact",
      placement: w.placement ?? "bottom-right",
      avatar_url: w.avatar?.type === "image" ? w.avatar.url : w.avatar?.type === "url" ? w.avatar.custom_url : "",
      avatar_orb_color_1: w.avatar?.type === "orb" ? w.avatar.color_1 : "#2792dc",
      avatar_orb_color_2: w.avatar?.type === "orb" ? w.avatar.color_2 : "#9ce6e6",
      bg_color: w.bg_color ?? "#ffffff",
      text_color: w.text_color ?? "#000000",
      btn_color: w.btn_color ?? "#000000",
      btn_text_color: w.btn_text_color ?? "#ffffff",
      border_color: w.border_color ?? "#e1e1e1",
      focus_color: w.focus_color ?? "#000000",
    });
  }, [w]);

  const update = <K extends keyof WidgetSettingsPayload>(key: K, value: WidgetSettingsPayload[K]) => {
    setD((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => save.mutate(d, { onSuccess: () => setDirty(false) });
  const useOrb = !d.avatar_url;

  return (
    <div className="space-y-6">
      {/* Layout */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center">
                <IconDashboard className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Widget Size &amp; Position</CardTitle>
                <CardDescription className="label-text mt-0.5">
                  Controls the widget's size variant and screen placement.
                </CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={handleSave} disabled={!dirty || save.isPending} className="gap-1.5 shadow-sm">
              {save.isPending ? <IconLoader className="w-3.5 h-3.5 animate-spin" /> : <IconSave className="w-3.5 h-3.5" />}
              IconSave
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {VARIANTS.map((v) => {
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

          <div className="max-w-xs space-y-1.5">
            <Label className="label-text font-medium flex items-center gap-1.5 text-xs">
              <IconMapPin className="w-3.5 h-3.5" /> Placement
            </Label>
            <Select value={d.placement ?? "bottom-right"} onValueChange={(v) => update("placement", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLACEMENTS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Avatar */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 flex items-center justify-center">
              <IconImage className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Avatar</CardTitle>
              <CardDescription className="label-text mt-0.5">
                Custom image or animated orb with gradient colors.
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
                <img src={d.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-border" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <p className="text-[10px] text-muted-foreground/70">Preview — shown as the widget's avatar.</p>
              </div>
            )}
          </div>
          {useOrb && (
            <div className="space-y-3">
              <Label className="label-text font-medium text-xs">Orb Gradient Colors</Label>
              <div className="flex items-center gap-4">
                <ColorSwatch value={d.avatar_orb_color_1 ?? "#2792dc"} onChange={(v) => update("avatar_orb_color_1", v)} />
                <span className="text-muted-foreground text-xs">→</span>
                <ColorSwatch value={d.avatar_orb_color_2 ?? "#9ce6e6"} onChange={(v) => update("avatar_orb_color_2", v)} />
                <div className="w-10 h-10 rounded-full ml-auto" style={{ background: `linear-gradient(135deg, ${d.avatar_orb_color_1 ?? "#2792dc"}, ${d.avatar_orb_color_2 ?? "#9ce6e6"})` }} />
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
              <IconPalette className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Widget Colors</CardTitle>
              <CardDescription className="label-text mt-0.5">
                Match the widget's color scheme to your brand.
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
            <ColorPicker label="Focus Ring" value={d.focus_color ?? "#000000"} onChange={(v) => update("focus_color", v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded-lg border border-border cursor-pointer" />
      <span className="text-[10px] font-mono text-muted-foreground">{value}</span>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="label-text text-[10px] font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded-md border border-border cursor-pointer" />
        <span className="text-[10px] font-mono text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}
