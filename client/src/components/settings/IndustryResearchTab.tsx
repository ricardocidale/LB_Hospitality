import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Globe, Search, MessageSquare, Check, X, Pencil, Trash2, RefreshCw, Plus, Loader2 } from "lucide-react";
import { SettingsTabProps } from "./types";

interface IndustryResearchTabProps extends SettingsTabProps {
  selectedFocusAreas: string[];
  setSelectedFocusAreas: (areas: string[]) => void;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  timeHorizon: string;
  setTimeHorizon: (horizon: string) => void;
  researchQuestions: any[];
  editingQuestionId: number | null;
  setEditingQuestionId: (id: number | null) => void;
  editingQuestionText: string;
  setEditingQuestionText: (text: string) => void;
  newQuestion: string;
  setNewQuestion: (question: string) => void;
  isGenerating: boolean;
  streamedContent: string;
  generateResearch: () => void;
  createQuestion: any;
  updateQuestion: any;
  deleteQuestion: any;
  FOCUS_AREA_OPTIONS: { id: string; label: string }[];
  REGION_OPTIONS: { id: string; label: string }[];
  TIME_HORIZON_OPTIONS: { value: string; label: string }[];
}

export function IndustryResearchTab({
  currentGlobal,
  selectedFocusAreas,
  setSelectedFocusAreas,
  selectedRegions,
  setSelectedRegions,
  timeHorizon,
  setTimeHorizon,
  researchQuestions,
  editingQuestionId,
  setEditingQuestionId,
  editingQuestionText,
  setEditingQuestionText,
  newQuestion,
  setNewQuestion,
  isGenerating,
  streamedContent,
  generateResearch,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  FOCUS_AREA_OPTIONS,
  REGION_OPTIONS,
  TIME_HORIZON_OPTIONS,
}: IndustryResearchTabProps) {
  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Globe className="w-5 h-5 text-primary" />
            Your Model Context
            <HelpTooltip text="These values come from your systemwide assumptions and are automatically included in the research prompt so the AI tailors its analysis to your portfolio." />
          </CardTitle>
          <CardDescription className="label-text">These systemwide settings shape your research. Edit them in Portfolio and Macro tabs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Asset Type</p>
              <p className="text-sm font-semibold text-gray-900" data-testid="text-research-asset-type">{currentGlobal.propertyLabel || "Boutique Hotel"}</p>
            </div>
            <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Tier</p>
              <p className="text-sm font-semibold text-gray-900 capitalize" data-testid="text-research-tier">{currentGlobal.assetDefinition?.level || "luxury"}</p>
            </div>
            <div className="rounded-xl p-3 bg-blue-50 border border-blue-200">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Room Range</p>
              <p className="text-sm font-semibold text-gray-900" data-testid="text-research-rooms">{currentGlobal.assetDefinition?.minRooms ?? 10}–{currentGlobal.assetDefinition?.maxRooms ?? 80}</p>
            </div>
            <div className="rounded-xl p-3 bg-blue-50 border border-blue-200">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">ADR Range</p>
              <p className="text-sm font-semibold text-gray-900" data-testid="text-research-adr">${currentGlobal.assetDefinition?.minAdr ?? 150}–${currentGlobal.assetDefinition?.maxAdr ?? 600}</p>
            </div>
            <div className="rounded-xl p-3 bg-amber-50 border border-amber-200">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Inflation</p>
              <p className="text-sm font-semibold text-gray-900" data-testid="text-research-inflation">{((currentGlobal.inflationRate ?? 0.03) * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-xl p-3 bg-amber-50 border border-amber-200">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Model Duration</p>
              <p className="text-sm font-semibold text-gray-900" data-testid="text-research-duration">{currentGlobal.projectionYears ?? 10} years</p>
            </div>
            <div className="rounded-xl p-3 bg-gray-50 border border-gray-200 col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Features</p>
              <div className="flex flex-wrap gap-1.5" data-testid="text-research-features">
                {currentGlobal.assetDefinition?.hasFB && <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-gray-200">F&B</span>}
                {currentGlobal.assetDefinition?.hasEvents && <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-gray-200">Events</span>}
                {currentGlobal.assetDefinition?.hasWellness && <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-gray-200">Wellness</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Search className="w-5 h-5 text-primary" />
            Research Variables
            <HelpTooltip text="Configure what the AI should research. Select focus areas, target regions, and time horizon. Add custom questions for specific topics." />
          </CardTitle>
          <CardDescription className="label-text">Customize the scope and focus of AI-generated industry research</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="label-text font-medium">Focus Areas</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FOCUS_AREA_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={`focus-${option.id}`}
                    checked={selectedFocusAreas.includes(option.label)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFocusAreas([...selectedFocusAreas, option.label]);
                      } else {
                        setSelectedFocusAreas(selectedFocusAreas.filter(a => a !== option.label));
                      }
                    }}
                    data-testid={`checkbox-focus-${option.id}`}
                  />
                  <Label htmlFor={`focus-${option.id}`} className="text-sm cursor-pointer flex-1">{option.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="label-text font-medium">Target Regions</Label>
              <div className="space-y-2">
                {REGION_OPTIONS.map((option) => (
                  <div key={option.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={`region-${option.id}`}
                      checked={selectedRegions.includes(option.label)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRegions([...selectedRegions, option.label]);
                        } else {
                          setSelectedRegions(selectedRegions.filter(r => r !== option.label));
                        }
                      }}
                      data-testid={`checkbox-region-${option.id}`}
                    />
                    <Label htmlFor={`region-${option.id}`} className="text-sm cursor-pointer">{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="label-text font-medium">Time Horizon</Label>
              <RadioGroup
                value={timeHorizon}
                onValueChange={setTimeHorizon}
                className="space-y-2"
                data-testid="radio-time-horizon"
              >
                {TIME_HORIZON_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={option.value} id={`horizon-${option.value}`} data-testid={`radio-horizon-${option.value.replace(/\s/g, '-')}`} />
                    <Label htmlFor={`horizon-${option.value}`} className="text-sm cursor-pointer">{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="label-text font-medium flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Custom Research Questions
              <HelpTooltip text="Add specific research questions or qualifiers for the AI to address. Each question is sent to the AI as part of the research prompt." />
            </Label>

            {researchQuestions.length > 0 && (
              <div className="space-y-2">
                {researchQuestions.map((q) => (
                  <div key={q.id} className="group flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200 hover:border-primary/30 transition-colors" data-testid={`research-question-${q.id}`}>
                    {editingQuestionId === q.id ? (
                      <div className="flex-1 flex items-start gap-2">
                        <Input
                          value={editingQuestionText}
                          onChange={(e) => setEditingQuestionText(e.target.value)}
                          className="flex-1 text-sm bg-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editingQuestionText.trim()) {
                              updateQuestion.mutate({ id: q.id, question: editingQuestionText.trim() });
                              setEditingQuestionId(null);
                            }
                            if (e.key === "Escape") setEditingQuestionId(null);
                          }}
                          data-testid={`input-edit-question-${q.id}`}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                          onClick={() => {
                            if (editingQuestionText.trim()) {
                              updateQuestion.mutate({ id: q.id, question: editingQuestionText.trim() });
                            }
                            setEditingQuestionId(null);
                          }}
                          data-testid={`button-save-question-${q.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                          onClick={() => setEditingQuestionId(null)}
                          data-testid={`button-cancel-edit-${q.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="flex-1 text-sm text-gray-700 pt-0.5">{q.question}</p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-primary hover:bg-white"
                            onClick={() => {
                              setEditingQuestionId(q.id);
                              setEditingQuestionText(q.question);
                            }}
                            data-testid={`button-edit-question-${q.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-destructive hover:bg-white"
                            onClick={() => deleteQuestion.mutate(q.id)}
                            data-testid={`button-delete-question-${q.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                placeholder="Add a custom question (e.g. 'What is the local labor market like for housekeeping staff?')"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newQuestion.trim()) {
                    createQuestion.mutate(newQuestion.trim());
                    setNewQuestion("");
                  }
                }}
                className="bg-white text-sm"
                data-testid="input-new-research-question"
              />
              <Button
                size="sm"
                className="shrink-0"
                disabled={!newQuestion.trim() || createQuestion.isPending}
                onClick={() => {
                  createQuestion.mutate(newQuestion.trim());
                  setNewQuestion("");
                }}
                data-testid="button-add-research-question"
              >
                {createQuestion.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Button
              className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all"
              onClick={generateResearch}
              disabled={isGenerating}
              data-testid="button-trigger-global-research"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating Market Analysis...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Regenerate Industry Research
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-2 uppercase tracking-widest font-medium">
              Powered by {currentGlobal.preferredLlm || "Claude 4.5"} • Average time: 15-20 seconds
            </p>
          </div>
        </CardContent>
      </Card>

      {isGenerating && streamedContent && (
        <Card className="border-primary/30 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              Real-time Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {streamedContent}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
