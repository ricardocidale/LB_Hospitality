import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ChevronUp, ChevronDown } from "@/components/icons/themed-icons";
import { IconPlus, IconTrash, IconPencil, IconPalette, IconActivity, IconSparkles, IconType, IconSave } from "@/components/icons";
import { ColorPicker } from "@/components/ui/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDesignThemes, useCreateTheme, useUpdateTheme, useDeleteTheme } from "./useDesignThemes";
import { ThemePreview } from "./ThemePreview";
import type { DesignTheme, DesignColor, IconSetType } from "./types";
import {
  Star as LucideStar, Bell as LucideBell, Search as LucideSearch, Home as LucideHome,
} from "lucide-react";
import {
  Star as PhStar, Bell as PhBell, MagnifyingGlass as PhSearch, House as PhHome,
} from "@phosphor-icons/react";

export function ThemeManager() {
  const { data: designThemes, isLoading: themesLoading } = useDesignThemes();
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<DesignTheme | null>(null);
  const [newTheme, setNewTheme] = useState<{ name: string; description: string; colors: DesignColor[]; iconSet: IconSetType }>({
    name: "",
    description: "",
    colors: [{ rank: 1, name: "", hexCode: "#000000", description: "" }],
    iconSet: "lucide",
  });

  const createThemeMutation = useCreateTheme({
    onSuccess: () => {
      setThemeDialogOpen(false);
      setNewTheme({ name: "", description: "", colors: [{ rank: 1, name: "", hexCode: "#000000", description: "" }], iconSet: "lucide" });
    },
  });
  const updateThemeMutation = useUpdateTheme({
    onSuccess: () => setEditingTheme(null),
  });
  const deleteThemeMutation = useDeleteTheme();

  const activeTheme = designThemes?.find(t => t.isDefault);

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
          {activeTheme.colors.filter(c => !c.description?.startsWith('PALETTE:') && !c.description?.startsWith('CHART:')).length > 0 && activeTheme.colors.filter(c => c.description?.startsWith('PALETTE:')).length === 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Colors</p>
              <div className="flex gap-2 flex-wrap">
                {activeTheme.colors.filter(c => !c.description?.startsWith('PALETTE:') && !c.description?.startsWith('CHART:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
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
              Define color palettes and design systems for your application
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => setThemeDialogOpen(true)}
          >
            <IconPlus className="w-4 h-4" />
            New Theme
          </Button>
        </div>
      </CardHeader>

        <CardContent className="relative space-y-6">
          {themesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
            </div>
          ) : designThemes && designThemes.length > 0 ? (
            <div className="space-y-3">
              {designThemes.map((theme) => (
                <div key={theme.id} className={`p-3 rounded-xl border hover-lift ${theme.isDefault ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-display text-sm text-foreground font-semibold truncate">{theme.name}</h3>
                      {theme.isDefault && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground shrink-0">Default</span>
                      )}
                      {theme.description && (
                        <span className="text-xs text-muted-foreground truncate hidden sm:inline">— {theme.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingTheme(theme)}>
                        <IconPencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteThemeMutation.mutate(theme.id)}
                        disabled={theme.isDefault}
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2" data-testid={`inline-icon-set-selector-${theme.id}`}>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Icons</span>
                    <RadioGroup
                      value={theme.iconSet}
                      onValueChange={(val: string) => updateThemeMutation.mutate({ id: theme.id, data: { iconSet: val } })}
                      className="flex items-center gap-2"
                    >
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${theme.iconSet === "lucide" ? "border-primary/40 bg-primary/5" : "border-border/50 bg-muted/40"}`}>
                        <RadioGroupItem value="lucide" id={`lucide-${theme.id}`} className="h-3 w-3" data-testid={`radio-lucide-${theme.id}`} />
                        <Label htmlFor={`lucide-${theme.id}`} className="text-[10px] cursor-pointer flex items-center gap-0.5">
                          <LucideStar className="w-3 h-3" /><LucideBell className="w-3 h-3" /><LucideSearch className="w-3 h-3" /><LucideHome className="w-3 h-3" />
                        </Label>
                      </div>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${theme.iconSet === "phosphor" ? "border-primary/40 bg-primary/5" : "border-border/50 bg-muted/40"}`}>
                        <RadioGroupItem value="phosphor" id={`phosphor-${theme.id}`} className="h-3 w-3" data-testid={`radio-phosphor-${theme.id}`} />
                        <Label htmlFor={`phosphor-${theme.id}`} className="text-[10px] cursor-pointer flex items-center gap-0.5">
                          <PhStar className="w-3 h-3" size={12} /><PhBell className="w-3 h-3" size={12} /><PhSearch className="w-3 h-3" size={12} /><PhHome className="w-3 h-3" size={12} />
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {theme.colors.filter(c => c.description?.startsWith('PALETTE:')).length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-0.5">Palette</span>
                        {theme.colors.filter(c => c.description?.startsWith('PALETTE:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
                          <div key={`palette-${idx}`} className="group relative flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-muted/60 border border-border/50">
                            <div className="w-5 h-5 rounded border border-border/60 shrink-0" style={{ backgroundColor: color.hexCode }} />
                            <span className="text-[11px] text-foreground font-medium">{color.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">{color.hexCode}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {theme.colors.filter(c => c.description?.startsWith('CHART:')).length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-0.5">Charts</span>
                        {theme.colors.filter(c => c.description?.startsWith('CHART:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
                          <div
                            key={`chart-${idx}`}
                            className="w-5 h-5 rounded border border-border/60 cursor-default"
                            style={{ backgroundColor: color.hexCode }}
                            title={`${color.name}: ${color.hexCode}`}
                          />
                        ))}
                      </div>
                    )}

                    {theme.colors.filter(c => !c.description?.startsWith('PALETTE:') && !c.description?.startsWith('CHART:')).length > 0
                      && theme.colors.filter(c => c.description?.startsWith('PALETTE:')).length === 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-0.5">Colors</span>
                        {theme.colors.filter(c => !c.description?.startsWith('PALETTE:') && !c.description?.startsWith('CHART:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
                          <div key={`other-${idx}`} className="flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-muted/60 border border-border/50">
                            <div className="w-5 h-5 rounded border border-border/60 shrink-0" style={{ backgroundColor: color.hexCode }} />
                            <span className="text-[11px] text-foreground font-medium">{color.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">{color.hexCode}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <IconPalette className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="label-text text-muted-foreground">No design themes yet. Create your first theme to define your color palette.</p>
            </div>
          )}
        </CardContent>
    </Card>

    <Dialog open={themeDialogOpen || !!editingTheme} onOpenChange={(open) => { if (!open) { setThemeDialogOpen(false); setEditingTheme(null); } }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTheme ? "Edit Design Theme" : "Create Design Theme"}</DialogTitle>
          <DialogDescription>
            Define your design system colors and when to use them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="flex items-center gap-2 mb-1"><IconSparkles className="w-4 h-4 text-muted-foreground" />Theme Name</Label>
            <Input
              value={editingTheme ? editingTheme.name : newTheme.name}
              onChange={(e) => editingTheme
                ? setEditingTheme({ ...editingTheme, name: e.target.value })
                : setNewTheme({ ...newTheme, name: e.target.value })
              }
              placeholder="e.g., Fluid Glass"
            />
          </div>
          <div>
            <Label className="flex items-center gap-2 mb-1"><IconType className="w-4 h-4 text-muted-foreground" />Description</Label>
            <textarea
              className="w-full min-h-[80px] p-3 border border-border rounded-lg text-sm resize-none bg-background text-foreground"
              value={editingTheme ? editingTheme.description : newTheme.description}
              onChange={(e) => editingTheme
                ? setEditingTheme({ ...editingTheme, description: e.target.value })
                : setNewTheme({ ...newTheme, description: e.target.value })
              }
              placeholder="Describe the design philosophy and inspiration..."
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-1"><IconPalette className="w-4 h-4 text-muted-foreground" />Icon Set</Label>
            <Select
              value={editingTheme ? editingTheme.iconSet : newTheme.iconSet}
              onValueChange={(val: IconSetType) => editingTheme
                ? setEditingTheme({ ...editingTheme, iconSet: val })
                : setNewTheme({ ...newTheme, iconSet: val })
              }
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

          <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-2"><IconPalette className="w-4 h-4 text-primary" />Palette Colors</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const paletteColors = (editingTheme?.colors || newTheme.colors).filter(c => c.description?.startsWith('PALETTE:'));
                  const newColor = { rank: paletteColors.length + 1, name: "", hexCode: "#9FBCA4", description: "PALETTE: " };
                  if (editingTheme) {
                    setEditingTheme({ ...editingTheme, colors: [...editingTheme.colors, newColor] });
                  } else {
                    setNewTheme({ ...newTheme, colors: [...newTheme.colors, newColor] });
                  }
                }}
              >
                <IconPlus className="w-3 h-3 mr-1" /> Add Palette Color
              </Button>
            </div>

            <div className="space-y-2">
              {(editingTheme ? editingTheme.colors : newTheme.colors)
                .map((color, originalIdx) => ({ color, originalIdx }))
                .filter(({ color }) => color.description?.startsWith('PALETTE:'))
                .map(({ color, originalIdx }, displayIdx, arr) => {
                  const moveUp = () => {
                    if (displayIdx === 0) return;
                    const allColors = editingTheme ? [...editingTheme.colors] : [...newTheme.colors];
                    const prevOriginalIdx = arr[displayIdx - 1].originalIdx;
                    [allColors[prevOriginalIdx], allColors[originalIdx]] = [allColors[originalIdx], allColors[prevOriginalIdx]];
                    if (editingTheme) setEditingTheme({ ...editingTheme, colors: allColors });
                    else setNewTheme({ ...newTheme, colors: allColors });
                  };
                  const moveDown = () => {
                    if (displayIdx === arr.length - 1) return;
                    const allColors = editingTheme ? [...editingTheme.colors] : [...newTheme.colors];
                    const nextOriginalIdx = arr[displayIdx + 1].originalIdx;
                    [allColors[originalIdx], allColors[nextOriginalIdx]] = [allColors[nextOriginalIdx], allColors[originalIdx]];
                    if (editingTheme) setEditingTheme({ ...editingTheme, colors: allColors });
                    else setNewTheme({ ...newTheme, colors: allColors });
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
                      <Input value={color.name} onChange={(e) => { const c = editingTheme ? [...editingTheme.colors] : [...newTheme.colors]; c[originalIdx] = { ...c[originalIdx], name: e.target.value }; if (editingTheme) setEditingTheme({ ...editingTheme, colors: c }); else setNewTheme({ ...newTheme, colors: c }); }} placeholder="Color name" className="flex-1" />
                      <div className="w-36">
                        <ColorPicker value={color.hexCode} onChange={(nc) => { const c = editingTheme ? [...editingTheme.colors] : [...newTheme.colors]; c[originalIdx] = { ...c[originalIdx], hexCode: nc }; if (editingTheme) setEditingTheme({ ...editingTheme, colors: c }); else setNewTheme({ ...newTheme, colors: c }); }} />
                      </div>
                      <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { const f = (editingTheme ? editingTheme.colors : newTheme.colors).filter((_, i) => i !== originalIdx); if (editingTheme) setEditingTheme({ ...editingTheme, colors: f }); else setNewTheme({ ...newTheme, colors: f }); }}>
                        <IconTrash className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input value={color.description?.replace('PALETTE: ', '') || ''} onChange={(e) => { const c = editingTheme ? [...editingTheme.colors] : [...newTheme.colors]; c[originalIdx] = { ...c[originalIdx], description: 'PALETTE: ' + e.target.value }; if (editingTheme) setEditingTheme({ ...editingTheme, colors: c }); else setNewTheme({ ...newTheme, colors: c }); }} placeholder="Where to use this color..." className="text-sm" />
                  </div>
                  );
                })}
            </div>
          </div>

          <div className="p-4 rounded-lg border-2 border-accent/30 bg-accent/5">
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-2"><IconActivity className="w-4 h-4 text-accent" />Chart Colors</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const chartColors = (editingTheme?.colors || newTheme.colors).filter(c => c.description?.startsWith('CHART:'));
                  const newColor = { rank: chartColors.length + 1, name: "", hexCode: "#3B82F6", description: "CHART: " };
                  if (editingTheme) {
                    setEditingTheme({ ...editingTheme, colors: [...editingTheme.colors, newColor] });
                  } else {
                    setNewTheme({ ...newTheme, colors: [...newTheme.colors, newColor] });
                  }
                }}
              >
                <IconPlus className="w-3 h-3 mr-1" /> Add Chart Color
              </Button>
            </div>

            <div className="space-y-2">
              {(editingTheme ? editingTheme.colors : newTheme.colors)
                .map((color, originalIdx) => ({ color, originalIdx }))
                .filter(({ color }) => color.description?.startsWith('CHART:'))
                .map(({ color, originalIdx }, displayIdx, arr) => {
                  const moveUp = () => {
                    if (displayIdx === 0) return;
                    const allColors = editingTheme ? [...editingTheme.colors] : [...newTheme.colors];
                    const prevOriginalIdx = arr[displayIdx - 1].originalIdx;
                    [allColors[prevOriginalIdx], allColors[originalIdx]] = [allColors[originalIdx], allColors[prevOriginalIdx]];
                    if (editingTheme) setEditingTheme({ ...editingTheme, colors: allColors });
                    else setNewTheme({ ...newTheme, colors: allColors });
                  };
                  const moveDown = () => {
                    if (displayIdx === arr.length - 1) return;
                    const allColors = editingTheme ? [...editingTheme.colors] : [...newTheme.colors];
                    const nextOriginalIdx = arr[displayIdx + 1].originalIdx;
                    [allColors[originalIdx], allColors[nextOriginalIdx]] = [allColors[nextOriginalIdx], allColors[originalIdx]];
                    if (editingTheme) setEditingTheme({ ...editingTheme, colors: allColors });
                    else setNewTheme({ ...newTheme, colors: allColors });
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
                      <Input value={color.name} onChange={(e) => { const c = editingTheme ? [...editingTheme.colors] : [...newTheme.colors]; c[originalIdx] = { ...c[originalIdx], name: e.target.value }; if (editingTheme) setEditingTheme({ ...editingTheme, colors: c }); else setNewTheme({ ...newTheme, colors: c }); }} placeholder="Color name" className="flex-1" />
                      <div className="w-36">
                        <ColorPicker value={color.hexCode} onChange={(nc) => { const c = editingTheme ? [...editingTheme.colors] : [...newTheme.colors]; c[originalIdx] = { ...c[originalIdx], hexCode: nc }; if (editingTheme) setEditingTheme({ ...editingTheme, colors: c }); else setNewTheme({ ...newTheme, colors: c }); }} />
                      </div>
                      <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { const f = (editingTheme ? editingTheme.colors : newTheme.colors).filter((_, i) => i !== originalIdx); if (editingTheme) setEditingTheme({ ...editingTheme, colors: f }); else setNewTheme({ ...newTheme, colors: f }); }}>
                        <IconTrash className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input value={color.description?.replace('CHART: ', '') || ''} onChange={(e) => { const c = editingTheme ? [...editingTheme.colors] : [...newTheme.colors]; c[originalIdx] = { ...c[originalIdx], description: 'CHART: ' + e.target.value }; if (editingTheme) setEditingTheme({ ...editingTheme, colors: c }); else setNewTheme({ ...newTheme, colors: c }); }} placeholder="What this color represents in charts..." className="text-sm" />
                  </div>
                  );
                })}
            </div>
          </div>
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
            {editingTheme ? "Save" : "Create Theme"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
