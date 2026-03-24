import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronUp, ChevronDown, Lock, Star, AlertTriangle } from "@/components/icons/themed-icons";
import { IconPlus, IconTrash, IconPencil, IconPalette, IconActivity, IconSparkles, IconType, IconSave } from "@/components/icons";
import { ColorPicker } from "@/components/ui/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDesignThemes, useCreateTheme, useUpdateTheme, useDeleteTheme } from "./useDesignThemes";
import { ThemePreview } from "./ThemePreview";
import type { DesignTheme, DesignColor, IconSetType } from "./types";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, Monitor, Sparkles, Type } from "lucide-react";
import {
  Star as LucideStar, Bell as LucideBell, Search as LucideSearch, Home as LucideHome,
} from "lucide-react";
import {
  Star as PhStar, Bell as PhBell, MagnifyingGlass as PhSearch, House as PhHome,
} from "@phosphor-icons/react";

type ColorModeDefault = "light" | "auto" | "dark";
type BgAnimationDefault = "enabled" | "auto" | "disabled";
type FontPreferenceDefault = "default" | "sans" | "system" | "dyslexic";

interface AppearanceDefaults {
  defaultColorMode: ColorModeDefault | null;
  defaultBgAnimation: BgAnimationDefault | null;
  defaultFontPreference: FontPreferenceDefault | null;
}

function AppearanceDefaultsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: defaults, isLoading } = useQuery<AppearanceDefaults>({
    queryKey: ["appearance-defaults"],
    queryFn: async () => {
      const res = await fetch("/api/appearance-defaults", { credentials: "include" });
      if (!res.ok) return { defaultColorMode: null, defaultBgAnimation: null, defaultFontPreference: null };
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<AppearanceDefaults>) => {
      const res = await fetch("/api/appearance-defaults", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appearance-defaults"] });
      toast({ title: "Defaults Updated", description: "Organization appearance defaults have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update appearance defaults.", variant: "destructive" });
    },
  });

  if (isLoading) return null;

  const colorMode = defaults?.defaultColorMode ?? "light";
  const bgAnimation = defaults?.defaultBgAnimation ?? "auto";
  const fontPref = defaults?.defaultFontPreference ?? "default";

  return (
    <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl border border-border shadow-sm mb-6" data-testid="appearance-defaults-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-display text-foreground">Appearance Defaults</CardTitle>
            <CardDescription className="label-text text-muted-foreground">
              Set organization-wide defaults for color mode, animation, and font. Users inherit these unless they customize their own.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium">Color Mode</Label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "light" as ColorModeDefault, label: "Light", icon: Sun, preview: "bg-white border-border" },
              { value: "auto" as ColorModeDefault, label: "Auto", icon: Monitor, preview: "bg-gradient-to-r from-white to-zinc-800 border-border" },
              { value: "dark" as ColorModeDefault, label: "Dark", icon: Moon, preview: "bg-zinc-900 border-zinc-700" },
            ]).map(({ value, label, icon: Icon, preview }) => {
              const active = colorMode === value;
              return (
                <button
                  key={value}
                  data-testid={`default-color-${value}`}
                  onClick={() => mutation.mutate({ defaultColorMode: value })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <div className={`w-full h-12 rounded-lg ${preview}`} />
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium">App Font</Label>
          <div className="grid grid-cols-4 gap-3">
            {([
              { value: "default" as FontPreferenceDefault, label: "Default", family: "'Inter', sans-serif" },
              { value: "sans" as FontPreferenceDefault, label: "Sans", family: "'DM Sans', sans-serif" },
              { value: "system" as FontPreferenceDefault, label: "System", family: "-apple-system, BlinkMacSystemFont, sans-serif" },
              { value: "dyslexic" as FontPreferenceDefault, label: "Dyslexic", family: "'OpenDyslexic', 'Comic Sans MS', sans-serif" },
            ]).map(({ value, label, family }) => {
              const active = fontPref === value;
              return (
                <button
                  key={value}
                  data-testid={`default-font-${value}`}
                  onClick={() => mutation.mutate({ defaultFontPreference: value })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <span className="text-2xl font-semibold" style={{ fontFamily: family }}>Aa</span>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium">Background Animation</Label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "enabled" as BgAnimationDefault, label: "Enabled", icon: Sparkles },
              { value: "auto" as BgAnimationDefault, label: "Auto", icon: Monitor },
              { value: "disabled" as BgAnimationDefault, label: "Disabled", icon: null },
            ]).map(({ value, label, icon: Icon }) => {
              const active = bgAnimation === value;
              return (
                <button
                  key={value}
                  data-testid={`default-anim-${value}`}
                  onClick={() => mutation.mutate({ defaultBgAnimation: value })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <div className="w-full h-10 rounded-lg bg-muted flex items-center justify-center">
                    {Icon ? <Icon className="w-5 h-5 text-muted-foreground" /> : <span className="text-xs text-muted-foreground">Off</span>}
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Lighten a hex color toward white by factor (0–1). Returns CSS hex with #. */
function softenHex(hex: string, factor = 0.75): string {
  const h = hex.replace(/^#/, "");
  const parse = (i: number) => parseInt(h.slice(i, i + 2), 16) || 0;
  const [r, g, b] = [0, 2, 4].map(parse);
  const s = (c: number) => Math.min(255, Math.round(c + (255 - c) * factor));
  return "#" + [s(r), s(g), s(b)].map(c => c.toString(16).padStart(2, "0")).join("");
}

type NewThemeState = { name: string; description: string; colors: DesignColor[]; iconSet: IconSetType };

const BLANK_THEME: NewThemeState = {
  name: "",
  description: "",
  colors: [{ rank: 1, name: "", hexCode: "#000000", description: "" }],
  iconSet: "lucide",
};

export function ThemeManager() {
  const { data: designThemes, isLoading: themesLoading } = useDesignThemes();
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<DesignTheme | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [newTheme, setNewTheme] = useState<NewThemeState>(BLANK_THEME);

  const createThemeMutation = useCreateTheme({
    onSuccess: () => {
      setThemeDialogOpen(false);
      setNewTheme(BLANK_THEME);
    },
  });
  const updateThemeMutation = useUpdateTheme({
    onSuccess: () => {
      setEditingTheme(null);
    },
  });
  const deleteThemeMutation = useDeleteTheme();

  const activeTheme = designThemes?.find(t => t.isDefault);

  const sortedThemes = [...(designThemes ?? [])].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    if (a.isSystem && !b.isSystem) return -1;
    if (!a.isSystem && b.isSystem) return 1;
    return a.name.localeCompare(b.name);
  });

  const defaultTab = activeTheme ? String(activeTheme.id) : sortedThemes[0] ? String(sortedThemes[0].id) : "";

  const themeForForm = editingTheme ?? newTheme;
  const setThemeForForm = (val: typeof themeForForm) => {
    if (editingTheme) setEditingTheme(val as DesignTheme);
    else setNewTheme(val as NewThemeState);
  };

  return (
    <>
    {activeTheme && (
      <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl border-2 border-primary/30 shadow-lg mb-6" data-testid="current-theme-card">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/8 blur-[80px] animate-pulse" style={{ animationDuration: '5s' }} />
        </div>
        <CardHeader className="relative pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <IconPalette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-display text-foreground">Current Theme</CardTitle>
              <CardDescription className="label-text text-muted-foreground">{activeTheme.name}{activeTheme.description ? ` — ${activeTheme.description}` : ''}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative pt-0">
          {activeTheme.colors.filter(c => c.description?.startsWith('PALETTE:')).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Palette</p>
              <div className="flex gap-2 flex-wrap">
                {activeTheme.colors.filter(c => c.description?.startsWith('PALETTE:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
                  <div key={`active-palette-${idx}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
                    <div className="w-7 h-7 rounded-md border border-border shadow-inner" style={{ backgroundColor: color.hexCode }} />
                    <div>
                      <p className="text-xs font-medium text-foreground">{color.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{color.hexCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTheme.colors.filter(c => c.description?.startsWith('CHART:')).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Charts</p>
              <div className="flex gap-1.5 flex-wrap">
                {activeTheme.colors.filter(c => c.description?.startsWith('CHART:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
                  <div key={`active-chart-${idx}`} className="group relative">
                    <div className="w-8 h-8 rounded-md border border-border shadow-inner cursor-default" style={{ backgroundColor: color.hexCode }} title={`${color.name}: ${color.hexCode}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTheme.colors.filter(c => c.description?.startsWith('EXPORT:')).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Exports</p>
              <div className="flex gap-2 flex-wrap">
                {activeTheme.colors.filter(c => c.description?.startsWith('EXPORT:')).map((color, idx) => {
                  const pale = softenHex(color.hexCode);
                  return (
                    <div key={`active-export-${idx}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted border border-border">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded border border-border/60 opacity-40" style={{ backgroundColor: color.hexCode }} title={`Base: ${color.hexCode}`} />
                        <span className="text-[9px] text-muted-foreground">→</span>
                        <div className="w-7 h-7 rounded-md border border-border shadow-inner" style={{ backgroundColor: pale }} title={`In exports: ${pale}`} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{color.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{pale}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {activeTheme.colors.filter(c => !c.description?.startsWith('PALETTE:') && !c.description?.startsWith('CHART:') && !c.description?.startsWith('EXPORT:')).length > 0 && activeTheme.colors.filter(c => c.description?.startsWith('PALETTE:')).length === 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Colors</p>
              <div className="flex gap-2 flex-wrap">
                {activeTheme.colors.filter(c => !c.description?.startsWith('PALETTE:') && !c.description?.startsWith('CHART:') && !c.description?.startsWith('EXPORT:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
                  <div key={`active-other-${idx}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
                    <div className="w-7 h-7 rounded-md border border-border shadow-inner" style={{ backgroundColor: color.hexCode }} />
                    <div>
                      <p className="text-xs font-medium text-foreground">{color.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{color.hexCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )}

    <div className="mb-6">
      <ThemePreview themeName={activeTheme?.name} iconSet={activeTheme?.iconSet} />
    </div>

    <AppearanceDefaultsSection />

    <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl border border-border shadow-2xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-secondary/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display text-foreground">All Themes</CardTitle>
            <CardDescription className="label-text text-muted-foreground">
              Select, preview, and manage your design themes
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => setThemeDialogOpen(true)} data-testid="button-new-theme">
            <IconPlus className="w-4 h-4" />
            New Theme
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {themesLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
          </div>
        ) : sortedThemes.length > 0 ? (
          <Tabs defaultValue={defaultTab}>
            <TabsList className="flex w-full h-auto flex-wrap gap-1 bg-muted/50 p-1.5 mb-6 rounded-xl">
              {sortedThemes.map(theme => (
                <TabsTrigger
                  key={theme.id}
                  value={String(theme.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  data-testid={`tab-theme-${theme.id}`}
                >
                  <span className="truncate max-w-[120px]">{theme.name}</span>
                  {theme.isDefault && <Star className="w-3 h-3 text-primary shrink-0" />}
                  {theme.isSystem && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                </TabsTrigger>
              ))}
            </TabsList>

            {sortedThemes.map(theme => (
              <TabsContent key={theme.id} value={String(theme.id)} className="mt-0">
                <div className="space-y-5">
                  {/* Theme header + actions */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-lg font-semibold text-foreground">{theme.name}</h3>
                          {theme.isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground">
                              <Star className="w-2.5 h-2.5" /> Active
                            </span>
                          )}
                          {theme.isSystem && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground border border-border">
                              <Lock className="w-2.5 h-2.5" /> Built-in
                            </span>
                          )}
                        </div>
                        {theme.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{theme.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!theme.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateThemeMutation.mutate({ id: theme.id, data: { isDefault: true } })}
                          disabled={updateThemeMutation.isPending}
                          data-testid={`button-activate-${theme.id}`}
                        >
                          <Star className="w-3.5 h-3.5 mr-1" />
                          Set as Default
                        </Button>
                      )}
                      {!theme.isSystem && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTheme(theme)}
                          data-testid={`button-edit-${theme.id}`}
                        >
                          <IconPencil className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      )}
                      {!theme.isSystem && !theme.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteConfirmId(theme.id)}
                          data-testid={`button-delete-${theme.id}`}
                        >
                          <IconTrash className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Status notices */}
                  {theme.isSystem && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border text-sm text-muted-foreground">
                      <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>This is a built-in system theme. You can activate it as the default, but it cannot be edited or deleted.</span>
                    </div>
                  )}
                  {!theme.isSystem && theme.isDefault && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                      <span>This is the currently active theme. To delete it, first activate a different theme.</span>
                    </div>
                  )}

                  {/* Icon set selector */}
                  <div className="flex items-center gap-3" data-testid={`inline-icon-set-selector-${theme.id}`}>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Icons</span>
                    <RadioGroup
                      value={theme.iconSet}
                      onValueChange={(val: string) => {
                        if (!theme.isSystem) {
                          updateThemeMutation.mutate({ id: theme.id, data: { iconSet: val } });
                        }
                      }}
                      className="flex items-center gap-2"
                      disabled={theme.isSystem}
                    >
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${theme.iconSet === "lucide" ? "border-primary/40 bg-primary/5" : "border-border/50 bg-muted/40"} ${theme.isSystem ? "opacity-60" : ""}`}>
                        <RadioGroupItem value="lucide" id={`lucide-${theme.id}`} className="h-3 w-3" data-testid={`radio-lucide-${theme.id}`} disabled={theme.isSystem} />
                        <Label htmlFor={`lucide-${theme.id}`} className="text-[10px] cursor-pointer flex items-center gap-0.5">
                          <LucideStar className="w-3 h-3" /><LucideBell className="w-3 h-3" /><LucideSearch className="w-3 h-3" /><LucideHome className="w-3 h-3" />
                        </Label>
                      </div>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${theme.iconSet === "phosphor" ? "border-primary/40 bg-primary/5" : "border-border/50 bg-muted/40"} ${theme.isSystem ? "opacity-60" : ""}`}>
                        <RadioGroupItem value="phosphor" id={`phosphor-${theme.id}`} className="h-3 w-3" data-testid={`radio-phosphor-${theme.id}`} disabled={theme.isSystem} />
                        <Label htmlFor={`phosphor-${theme.id}`} className="text-[10px] cursor-pointer flex items-center gap-0.5">
                          <PhStar className="w-3 h-3" size={12} /><PhBell className="w-3 h-3" size={12} /><PhSearch className="w-3 h-3" size={12} /><PhHome className="w-3 h-3" size={12} />
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Color swatches */}
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {theme.colors.filter(c => c.description?.startsWith('PALETTE:')).length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Palette</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {theme.colors.filter(c => c.description?.startsWith('PALETTE:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
                            <div key={`palette-${idx}`} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 border border-border/50">
                              <div className="w-5 h-5 rounded border border-border/60 shrink-0" style={{ backgroundColor: color.hexCode }} />
                              <span className="text-[10px] text-foreground font-medium">{color.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {theme.colors.filter(c => c.description?.startsWith('CHART:')).length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Charts</p>
                        <div className="flex gap-1 flex-wrap">
                          {theme.colors.filter(c => c.description?.startsWith('CHART:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
                            <div
                              key={`chart-${idx}`}
                              className="w-6 h-6 rounded border border-border/60"
                              style={{ backgroundColor: color.hexCode }}
                              title={`${color.name}: ${color.hexCode}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {theme.colors.filter(c => c.description?.startsWith('EXPORT:')).length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Exports</p>
                        <div className="flex gap-2 flex-wrap">
                          {theme.colors.filter(c => c.description?.startsWith('EXPORT:')).map((color, idx) => {
                            const pale = softenHex(color.hexCode);
                            return (
                              <div key={`export-${idx}`} className="flex items-center gap-1" title={`${color.name}: pale ${pale}`}>
                                <div className="w-3.5 h-3.5 rounded-sm border border-border/40 opacity-40" style={{ backgroundColor: color.hexCode }} />
                                <span className="text-[8px] text-muted-foreground">→</span>
                                <div className="w-5 h-5 rounded border border-border/60" style={{ backgroundColor: pale }} />
                                <span className="text-[10px] text-muted-foreground ml-0.5">{color.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <p className="text-center text-muted-foreground py-8">No themes found.</p>
        )}
      </CardContent>
    </Card>

    {/* Create / Edit Theme Dialog */}
    <Dialog
      open={themeDialogOpen || !!editingTheme}
      onOpenChange={(open) => {
        if (!open) { setThemeDialogOpen(false); setEditingTheme(null); }
      }}
    >
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTheme ? "Edit Theme" : "Create New Theme"}</DialogTitle>
          <DialogDescription>
            {editingTheme ? "Update this theme's colors and settings." : "Define a new color palette and design system."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="flex items-center gap-2 mb-1"><IconType className="w-4 h-4 text-muted-foreground" />Theme Name</Label>
            <Input
              value={themeForForm.name}
              onChange={e => setThemeForForm({ ...themeForForm, name: e.target.value })}
              placeholder="e.g. Brand Classic"
              data-testid="input-theme-name"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-1"><IconPalette className="w-4 h-4 text-muted-foreground" />Description</Label>
            <Textarea
              value={themeForForm.description}
              onChange={e => setThemeForForm({ ...themeForForm, description: e.target.value })}
              placeholder="Describe the design philosophy and inspiration..."
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-1"><IconPalette className="w-4 h-4 text-muted-foreground" />Icon Set</Label>
            <Select
              value={themeForForm.iconSet}
              onValueChange={(val: IconSetType) => setThemeForForm({ ...themeForForm, iconSet: val })}
            >
              <SelectTrigger data-testid="select-icon-set">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lucide">Lucide (default)</SelectItem>
                <SelectItem value="phosphor">Phosphor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Palette Colors */}
          <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-2"><IconPalette className="w-4 h-4 text-primary" />Palette Colors</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const palette = themeForForm.colors.filter(c => c.description?.startsWith('PALETTE:'));
                  const newColor = { rank: palette.length + 1, name: "", hexCode: "#9FBCA4", description: "PALETTE: " };
                  setThemeForForm({ ...themeForForm, colors: [...themeForForm.colors, newColor] });
                }}
              >
                <IconPlus className="w-3 h-3 mr-1" /> Add Palette Color
              </Button>
            </div>
            <div className="space-y-2">
              {themeForForm.colors
                .map((color, originalIdx) => ({ color, originalIdx }))
                .filter(({ color }) => color.description?.startsWith('PALETTE:'))
                .map(({ color, originalIdx }, displayIdx, arr) => {
                  const moveUp = () => {
                    if (displayIdx === 0) return;
                    const all = [...themeForForm.colors];
                    const prev = arr[displayIdx - 1].originalIdx;
                    [all[prev], all[originalIdx]] = [all[originalIdx], all[prev]];
                    setThemeForForm({ ...themeForForm, colors: all });
                  };
                  const moveDown = () => {
                    if (displayIdx === arr.length - 1) return;
                    const all = [...themeForForm.colors];
                    const next = arr[displayIdx + 1].originalIdx;
                    [all[originalIdx], all[next]] = [all[next], all[originalIdx]];
                    setThemeForForm({ ...themeForForm, colors: all });
                  };
                  return (
                    <div key={originalIdx} className="p-3 rounded-lg border border-border bg-card space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <Button type="button" variant="ghost" size="icon" onClick={moveUp} disabled={displayIdx === 0} className={`h-auto w-auto p-0.5 ${displayIdx === 0 ? 'opacity-30' : ''}`}>
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={moveDown} disabled={displayIdx === arr.length - 1} className={`h-auto w-auto p-0.5 ${displayIdx === arr.length - 1 ? 'opacity-30' : ''}`}>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <Input value={color.name} onChange={e => { const c = [...themeForForm.colors]; c[originalIdx] = { ...c[originalIdx], name: e.target.value }; setThemeForForm({ ...themeForForm, colors: c }); }} placeholder="Color name" className="flex-1" />
                        <div className="w-36">
                          <ColorPicker value={color.hexCode} onChange={nc => { const c = [...themeForForm.colors]; c[originalIdx] = { ...c[originalIdx], hexCode: nc }; setThemeForForm({ ...themeForForm, colors: c }); }} />
                        </div>
                        <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setThemeForForm({ ...themeForForm, colors: themeForForm.colors.filter((_, i) => i !== originalIdx) })}>
                          <IconTrash className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input value={color.description?.replace('PALETTE: ', '') || ''} onChange={e => { const c = [...themeForForm.colors]; c[originalIdx] = { ...c[originalIdx], description: 'PALETTE: ' + e.target.value }; setThemeForForm({ ...themeForForm, colors: c }); }} placeholder="Where to use this color..." className="text-sm" />
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Chart Colors */}
          <div className="p-4 rounded-lg border-2 border-accent/30 bg-accent/5">
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-2"><IconActivity className="w-4 h-4 text-accent" />Chart Colors</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const charts = themeForForm.colors.filter(c => c.description?.startsWith('CHART:'));
                  const newColor = { rank: charts.length + 1, name: "", hexCode: "#3B82F6", description: "CHART: " };
                  setThemeForForm({ ...themeForForm, colors: [...themeForForm.colors, newColor] });
                }}
              >
                <IconPlus className="w-3 h-3 mr-1" /> Add Chart Color
              </Button>
            </div>
            <div className="space-y-2">
              {themeForForm.colors
                .map((color, originalIdx) => ({ color, originalIdx }))
                .filter(({ color }) => color.description?.startsWith('CHART:'))
                .map(({ color, originalIdx }, displayIdx, arr) => {
                  const moveUp = () => {
                    if (displayIdx === 0) return;
                    const all = [...themeForForm.colors];
                    const prev = arr[displayIdx - 1].originalIdx;
                    [all[prev], all[originalIdx]] = [all[originalIdx], all[prev]];
                    setThemeForForm({ ...themeForForm, colors: all });
                  };
                  const moveDown = () => {
                    if (displayIdx === arr.length - 1) return;
                    const all = [...themeForForm.colors];
                    const next = arr[displayIdx + 1].originalIdx;
                    [all[originalIdx], all[next]] = [all[next], all[originalIdx]];
                    setThemeForForm({ ...themeForForm, colors: all });
                  };
                  return (
                    <div key={originalIdx} className="p-3 rounded-lg border border-border bg-card space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <Button type="button" variant="ghost" size="icon" onClick={moveUp} disabled={displayIdx === 0} className={`h-auto w-auto p-0.5 ${displayIdx === 0 ? 'opacity-30' : ''}`}>
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={moveDown} disabled={displayIdx === arr.length - 1} className={`h-auto w-auto p-0.5 ${displayIdx === arr.length - 1 ? 'opacity-30' : ''}`}>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <Input value={color.name} onChange={e => { const c = [...themeForForm.colors]; c[originalIdx] = { ...c[originalIdx], name: e.target.value }; setThemeForForm({ ...themeForForm, colors: c }); }} placeholder="Color name" className="flex-1" />
                        <div className="w-36">
                          <ColorPicker value={color.hexCode} onChange={nc => { const c = [...themeForForm.colors]; c[originalIdx] = { ...c[originalIdx], hexCode: nc }; setThemeForForm({ ...themeForForm, colors: c }); }} />
                        </div>
                        <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setThemeForForm({ ...themeForForm, colors: themeForForm.colors.filter((_, i) => i !== originalIdx) })}>
                          <IconTrash className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input value={color.description?.replace('CHART: ', '') || ''} onChange={e => { const c = [...themeForForm.colors]; c[originalIdx] = { ...c[originalIdx], description: 'CHART: ' + e.target.value }; setThemeForForm({ ...themeForForm, colors: c }); }} placeholder="What this color represents in charts..." className="text-sm" />
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Export Colors */}
          {themeForForm.colors.filter(c => c.description?.startsWith('EXPORT:')).length > 0 && (
            <div className="p-4 rounded-lg border-2 border-secondary/30 bg-secondary/5">
              <div className="mb-3">
                <Label className="flex items-center gap-2"><IconSparkles className="w-4 h-4 text-secondary-foreground/60" />Export Colors</Label>
                <p className="text-[11px] text-muted-foreground mt-1">These colors control how rows appear in PDF, PPTX, and Excel exports. The swatch shows how the color will appear after softening.</p>
              </div>
              <div className="space-y-2">
                {themeForForm.colors
                  .map((color, originalIdx) => ({ color, originalIdx }))
                  .filter(({ color }) => color.description?.startsWith('EXPORT:'))
                  .map(({ color, originalIdx }) => {
                    const pale = softenHex(color.hexCode);
                    return (
                      <div key={originalIdx} className="p-3 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-foreground min-w-[90px]">{color.name}</span>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 border border-border/50 text-[10px] text-muted-foreground">
                            <span>Base</span>
                            <div className="w-4 h-4 rounded border border-border/60" style={{ backgroundColor: color.hexCode }} />
                            <span className="font-mono">{color.hexCode}</span>
                          </div>
                          <span className="text-muted-foreground text-xs">→</span>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 border border-border/50 text-[10px] text-muted-foreground">
                            <span>In exports</span>
                            <div className="w-4 h-4 rounded border border-border/60" style={{ backgroundColor: pale }} />
                            <span className="font-mono">{pale}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground flex-1">Change the base color — the export renderer softens it automatically.</span>
                          <div className="w-36">
                            <ColorPicker
                              value={color.hexCode}
                              onChange={nc => {
                                const c = [...themeForForm.colors];
                                c[originalIdx] = { ...c[originalIdx], hexCode: nc };
                                setThemeForForm({ ...themeForForm, colors: c });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setThemeDialogOpen(false); setEditingTheme(null); }}>Cancel</Button>
          <Button
            onClick={() => {
              if (editingTheme) {
                updateThemeMutation.mutate({ id: editingTheme.id, data: { name: editingTheme.name, description: editingTheme.description, colors: editingTheme.colors, iconSet: editingTheme.iconSet } });
              } else {
                createThemeMutation.mutate(newTheme);
              }
            }}
            disabled={createThemeMutation.isPending || updateThemeMutation.isPending}
          >
            {(createThemeMutation.isPending || updateThemeMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
            {editingTheme ? "Save Changes" : "Create Theme"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={deleteConfirmId !== null} onOpenChange={open => { if (!open) setDeleteConfirmId(null); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Delete Theme
          </DialogTitle>
          <DialogDescription>
            {(() => {
              const t = designThemes?.find(t => t.id === deleteConfirmId);
              return `Are you sure you want to delete "${t?.name}"? This action cannot be undone.`;
            })()}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (deleteConfirmId !== null) {
                deleteThemeMutation.mutate(deleteConfirmId, {
                  onSuccess: () => setDeleteConfirmId(null),
                });
              }
            }}
            disabled={deleteThemeMutation.isPending}
          >
            {deleteThemeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconTrash className="w-4 h-4" />}
            Delete Theme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
