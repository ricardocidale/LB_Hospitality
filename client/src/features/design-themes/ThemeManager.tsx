import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Pencil, Palette, Activity, Sparkles, Type, ChevronUp, ChevronDown, Save } from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
import { useDesignThemes, useCreateTheme, useUpdateTheme, useDeleteTheme, useActivateTheme } from "./useDesignThemes";
import type { DesignTheme, DesignColor } from "./types";

export function ThemeManager() {
  const { data: designThemes, isLoading: themesLoading } = useDesignThemes();
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<DesignTheme | null>(null);
  const [newTheme, setNewTheme] = useState<{ name: string; description: string; colors: DesignColor[] }>({
    name: "",
    description: "",
    colors: [{ rank: 1, name: "", hexCode: "#000000", description: "" }],
  });

  const createThemeMutation = useCreateTheme({
    onSuccess: () => {
      setThemeDialogOpen(false);
      setNewTheme({ name: "", description: "", colors: [{ rank: 1, name: "", hexCode: "#000000", description: "" }] });
    },
  });
  const updateThemeMutation = useUpdateTheme({
    onSuccess: () => setEditingTheme(null),
  });
  const deleteThemeMutation = useDeleteTheme();
  const activateThemeMutation = useActivateTheme();

  return (
    <>
    <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#9FBCA4]/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#257D41]/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display text-gray-900">Design Themes</CardTitle>
            <CardDescription className="label-text text-gray-600">
              Define color palettes and design systems for your application
            </CardDescription>
          </div>
          <button
            onClick={() => setThemeDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#257D41] bg-[#257D41]/10 text-[#257D41] font-semibold hover:bg-[#257D41]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Theme
          </button>
        </div>
      </CardHeader>

        <CardContent className="relative space-y-6">
          {themesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto text-[#257D41] animate-spin" />
            </div>
          ) : designThemes && designThemes.length > 0 ? (
            <div className="space-y-4">
              {designThemes.map((theme) => (
                <div key={theme.id} className={`p-5 rounded-2xl border-2 ${theme.isActive ? 'border-[#257D41] bg-[#9FBCA4]/10' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-lg text-gray-900 font-semibold">{theme.name}</h3>
                        {theme.isActive && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#257D41] text-white">Active</span>
                        )}
                        {theme.userId === null && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">System</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 max-w-2xl">{theme.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!theme.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => activateThemeMutation.mutate(theme.id)}
                          className="text-[#257D41] border-[#257D41] hover:bg-[#257D41]/10"
                        >
                          Set Active
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setEditingTheme(theme)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => deleteThemeMutation.mutate(theme.id)}
                        disabled={theme.isActive}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Palette Colors */}
                  {theme.colors.filter(c => c.description?.startsWith('PALETTE:')).length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Palette className="w-4 h-4 text-[#257D41]" />
                        <h4 className="font-display text-sm font-semibold text-gray-700">Palette Colors</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {theme.colors.filter(c => c.description?.startsWith('PALETTE:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
                          <div key={`palette-${idx}`} className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className="w-10 h-10 rounded-lg border border-gray-300 shadow-inner"
                                style={{ backgroundColor: color.hexCode }}
                              />
                              <div>
                                <p className="font-medium text-sm text-gray-900">{color.name}</p>
                                <p className="font-mono text-xs text-gray-500">{color.hexCode}</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{color.description?.replace('PALETTE: ', '')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chart Colors */}
                  {theme.colors.filter(c => c.description?.startsWith('CHART:')).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-[#3B82F6]" />
                        <h4 className="font-display text-sm font-semibold text-gray-700">Chart Colors</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {theme.colors.filter(c => c.description?.startsWith('CHART:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
                          <div key={`chart-${idx}`} className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className="w-10 h-10 rounded-lg border border-gray-300 shadow-inner"
                                style={{ backgroundColor: color.hexCode }}
                              />
                              <div>
                                <p className="font-medium text-sm text-gray-900">{color.name}</p>
                                <p className="font-mono text-xs text-gray-500">{color.hexCode}</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{color.description?.replace('CHART: ', '')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legacy/Other Colors (no prefix) */}
                  {theme.colors.filter(c => !c.description?.startsWith('PALETTE:') && !c.description?.startsWith('CHART:')).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {theme.colors.filter(c => !c.description?.startsWith('PALETTE:') && !c.description?.startsWith('CHART:')).sort((a, b) => a.rank - b.rank).map((color, idx) => (
                        <div key={`other-${idx}`} className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-10 h-10 rounded-lg border border-gray-300 shadow-inner"
                              style={{ backgroundColor: color.hexCode }}
                            />
                            <div>
                              <p className="font-medium text-sm text-gray-900">{color.name}</p>
                              <p className="font-mono text-xs text-gray-500">{color.hexCode}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{color.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="label-text text-gray-500">No design themes yet. Create your first theme to define your color palette.</p>
            </div>
          )}
        </CardContent>
    </Card>

    {/* Theme Create/Edit Dialog */}
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
            <Label className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-gray-500" />Theme Name</Label>
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
            <Label className="flex items-center gap-2 mb-1"><Type className="w-4 h-4 text-gray-500" />Description</Label>
            <textarea
              className="w-full min-h-[80px] p-3 border rounded-lg text-sm resize-none"
              value={editingTheme ? editingTheme.description : newTheme.description}
              onChange={(e) => editingTheme
                ? setEditingTheme({ ...editingTheme, description: e.target.value })
                : setNewTheme({ ...newTheme, description: e.target.value })
              }
              placeholder="Describe the design philosophy and inspiration..."
            />
          </div>

          {/* Palette Colors Section */}
          <div className="p-4 rounded-lg border-2 border-[#9FBCA4]/50 bg-[#9FBCA4]/5">
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-2"><Palette className="w-4 h-4 text-[#257D41]" />Palette Colors</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-[#257D41] text-[#257D41] hover:bg-[#257D41]/10"
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
                <Plus className="w-3 h-3 mr-1" /> Add Palette Color
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
                  <div key={originalIdx} className="p-3 rounded-lg border bg-white space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={moveUp} disabled={displayIdx === 0} className={`p-0.5 rounded hover:bg-gray-200 ${displayIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        </button>
                        <button type="button" onClick={moveDown} disabled={displayIdx === arr.length - 1} className={`p-0.5 rounded hover:bg-gray-200 ${displayIdx === arr.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      <Input value={color.name} onChange={(e) => { const c = editingTheme ? [...editingTheme.colors] : [...newTheme.colors]; c[originalIdx] = { ...c[originalIdx], name: e.target.value }; if (editingTheme) setEditingTheme({ ...editingTheme, colors: c }); else setNewTheme({ ...newTheme, colors: c }); }} placeholder="Color name" className="flex-1" />
                      <div className="w-36">
                        <ColorPicker value={color.hexCode} onChange={(nc) => { const c = editingTheme ? [...editingTheme.colors] : [...newTheme.colors]; c[originalIdx] = { ...c[originalIdx], hexCode: nc }; if (editingTheme) setEditingTheme({ ...editingTheme, colors: c }); else setNewTheme({ ...newTheme, colors: c }); }} />
                      </div>
                      <Button type="button" size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => { const f = (editingTheme ? editingTheme.colors : newTheme.colors).filter((_, i) => i !== originalIdx); if (editingTheme) setEditingTheme({ ...editingTheme, colors: f }); else setNewTheme({ ...newTheme, colors: f }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input value={color.description?.replace('PALETTE: ', '') || ''} onChange={(e) => { const c = editingTheme ? [...editingTheme.colors] : [...newTheme.colors]; c[originalIdx] = { ...c[originalIdx], description: 'PALETTE: ' + e.target.value }; if (editingTheme) setEditingTheme({ ...editingTheme, colors: c }); else setNewTheme({ ...newTheme, colors: c }); }} placeholder="Where to use this color..." className="text-sm" />
                  </div>
                  );
                })}
            </div>
          </div>

          {/* Chart Colors Section */}
          <div className="p-4 rounded-lg border-2 border-[#3B82F6]/50 bg-[#3B82F6]/5">
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-2"><Activity className="w-4 h-4 text-[#3B82F6]" />Chart Colors</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6]/10"
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
                <Plus className="w-3 h-3 mr-1" /> Add Chart Color
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
                  <div key={originalIdx} className="p-3 rounded-lg border bg-white space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={moveUp} disabled={displayIdx === 0} className={`p-0.5 rounded hover:bg-gray-200 ${displayIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        </button>
                        <button type="button" onClick={moveDown} disabled={displayIdx === arr.length - 1} className={`p-0.5 rounded hover:bg-gray-200 ${displayIdx === arr.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      <Input value={color.name} onChange={(e) => { const c = editingTheme ? [...editingTheme.colors] : [...newTheme.colors]; c[originalIdx] = { ...c[originalIdx], name: e.target.value }; if (editingTheme) setEditingTheme({ ...editingTheme, colors: c }); else setNewTheme({ ...newTheme, colors: c }); }} placeholder="Color name" className="flex-1" />
                      <div className="w-36">
                        <ColorPicker value={color.hexCode} onChange={(nc) => { const c = editingTheme ? [...editingTheme.colors] : [...newTheme.colors]; c[originalIdx] = { ...c[originalIdx], hexCode: nc }; if (editingTheme) setEditingTheme({ ...editingTheme, colors: c }); else setNewTheme({ ...newTheme, colors: c }); }} />
                      </div>
                      <Button type="button" size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => { const f = (editingTheme ? editingTheme.colors : newTheme.colors).filter((_, i) => i !== originalIdx); if (editingTheme) setEditingTheme({ ...editingTheme, colors: f }); else setNewTheme({ ...newTheme, colors: f }); }}>
                        <Trash2 className="w-4 h-4" />
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
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              if (editingTheme) {
                updateThemeMutation.mutate({ id: editingTheme.id, data: { name: editingTheme.name, description: editingTheme.description, colors: editingTheme.colors } });
              } else {
                createThemeMutation.mutate(newTheme);
              }
            }}
            disabled={createThemeMutation.isPending || updateThemeMutation.isPending}
          >
            {(createThemeMutation.isPending || updateThemeMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingTheme ? "Save Changes" : "Create Theme"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
