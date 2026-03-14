import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { SelfHealingBoundary } from "@/components/ErrorBoundary";
import { PageHeader } from "@/components/ui/page-header";
import { AnimatedPage, AnimatedSection } from "@/components/graphics/motion/AnimatedPage";
import { CurrentThemeTab, type CurrentThemeTabItem } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { SaveButton } from "@/components/ui/save-button";
import { Loader2 } from "lucide-react";
import { IconTarget, IconHotel, IconSparkles, IconCopy, IconPencil, IconTrash, IconRefreshCw, IconWand2, IconBookOpen, IconMapPin, IconFlaskConical, IconFileStack } from "@/components/icons";
import AssetDefinitionTab from "@/components/admin/AssetDefinitionTab";
import CompanyProfileTab from "@/components/company/CompanyProfileTab";
import IcpLocationTab from "@/components/admin/IcpLocationTab";
import IcpResearchTab from "@/components/admin/IcpResearchTab";
import IcpSourcesTab from "@/components/admin/IcpSourcesTab";
import { useGlobalAssumptions, useUpdateAdminConfig } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { AdminSaveState } from "@/components/admin/types/save-state";
import {
  type IcpConfig,
  type IcpDescriptive,
  DEFAULT_ICP_CONFIG,
  DEFAULT_ICP_DESCRIPTIVE,
  generateIcpPrompt,
  generateIcpEssay,
} from "@/components/admin/icp-config";

const ICP_TABS: CurrentThemeTabItem[] = [
  { value: "icp-location", label: "Location", icon: IconMapPin },
  { value: "icp-profile", label: "Property Profile", icon: IconHotel },
  { value: "icp-description", label: "Asset Description", icon: IconTarget },
  { value: "icp-prompt", label: "AI Prompt", icon: IconSparkles },
  { value: "icp-definition", label: "ICP Definition", icon: IconBookOpen },
  { value: "icp-research", label: "Research", icon: IconFlaskConical },
  { value: "icp-sources", label: "Sources", icon: IconFileStack },
];

interface IcpContentProps {
  onSaveStateChange?: (state: AdminSaveState | null) => void;
}

export function IcpContent({ onSaveStateChange }: IcpContentProps) {
  const { data: ga } = useGlobalAssumptions();
  const updateMutation = useUpdateAdminConfig();
  const { toast } = useToast();

  const [editablePrompt, setEditablePrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("icp-location");
  const [defEditing, setDefEditing] = useState(false);
  const [defDraft, setDefDraft] = useState("");

  const [pendingTab, setPendingTab] = useState<string | null>(null);
  // Unified save state from sub-tabs that use AdminSaveState contract
  const tabSaveState = useRef<Record<string, AdminSaveState | null>>({});
  const [, setDirtyTick] = useState(0);
  const localSaveRef = useRef<(() => void) | null>(null);
  const autoGenPromptRef = useRef(false);
  const userClearedPromptRef = useRef(false);

  const handleSubTabSaveState = useCallback((tabKey: string) => {
    return (state: AdminSaveState | null) => {
      tabSaveState.current[tabKey] = state;
      setDirtyTick(t => t + 1);
    };
  }, []);

  const handleLocationSaveState = useMemo(() => handleSubTabSaveState("icp-location"), [handleSubTabSaveState]);
  const handleDescriptionSaveState = useMemo(() => handleSubTabSaveState("icp-description"), [handleSubTabSaveState]);
  const handleProfileSaveState = useMemo(() => handleSubTabSaveState("icp-profile"), [handleSubTabSaveState]);

  const isCurrentTabDirty = useCallback((): boolean => {
    if (activeTab === "icp-prompt" && isEditing) return true;
    if (activeTab === "icp-definition" && defEditing) return true;
    return tabSaveState.current[activeTab]?.isDirty ?? false;
  }, [activeTab, isEditing, defEditing]);

  const saveCurrentTab = useCallback(() => {
    if (activeTab === "icp-prompt" && isEditing) {
      localSaveRef.current?.();
    } else if (activeTab === "icp-definition" && defEditing) {
      localSaveRef.current?.();
    } else {
      tabSaveState.current[activeTab]?.onSave();
    }
  }, [activeTab, isEditing, defEditing]);

  const handleTabSwitch = useCallback((newTab: string) => {
    if (newTab === activeTab) return;
    if (isCurrentTabDirty()) {
      setPendingTab(newTab);
    } else {
      setActiveTab(newTab);
    }
  }, [activeTab, isCurrentTabDirty]);

  // Surface the active sub-tab's dirty state to the parent Admin shell
  const icpDirty = isCurrentTabDirty();
  useEffect(() => {
    if (icpDirty) {
      onSaveStateChange?.({
        isDirty: true,
        isPending: updateMutation.isPending,
        onSave: saveCurrentTab,
      });
    } else {
      onSaveStateChange?.(null);
    }
    return () => onSaveStateChange?.(null);
  }, [icpDirty, updateMutation.isPending, onSaveStateChange, saveCurrentTab]);

  // Dialog: save then navigate (deferred to onSuccess via pendingTabRef)
  const pendingTabRef = useRef<string | null>(null);

  const handleDialogSave = useCallback(() => {
    // Store target tab — the mutation's onSuccess in sub-tab will clear dirty,
    // which triggers re-render and we navigate via the effect below.
    pendingTabRef.current = pendingTab;
    saveCurrentTab();
    setPendingTab(null);
  }, [pendingTab, saveCurrentTab]);

  // Navigate to pending tab after the dirty flag clears (save succeeded)
  useEffect(() => {
    if (pendingTabRef.current && !icpDirty) {
      setActiveTab(pendingTabRef.current);
      pendingTabRef.current = null;
    }
  }, [icpDirty]);

  const handleDialogDiscard = useCallback(() => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }, [pendingTab]);

  useEffect(() => {
    if (!isCurrentTabDirty()) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isCurrentTabDirty]);

  const prompt = ga?.assetDescription || "";

  const config: IcpConfig = useMemo(() => {
    if (ga?.icpConfig) return { ...DEFAULT_ICP_CONFIG, ...(ga.icpConfig as Partial<IcpConfig>) };
    return DEFAULT_ICP_CONFIG;
  }, [ga?.icpConfig]);

  const desc: IcpDescriptive = useMemo(() => {
    if (ga?.icpConfig && (ga.icpConfig as any)?._descriptive) {
      return { ...DEFAULT_ICP_DESCRIPTIVE, ...((ga.icpConfig as any)._descriptive as Partial<IcpDescriptive>) };
    }
    return DEFAULT_ICP_DESCRIPTIVE;
  }, [ga?.icpConfig]);

  const propertyLabel = ga?.propertyLabel || "Boutique Hotel";

  const savedDefinition = (ga?.icpConfig as any)?._definition as string | undefined;

  const essay = useMemo(
    () => generateIcpEssay(config, desc, propertyLabel),
    [config, desc, propertyLabel]
  );

  /** Helper: build icpConfig payload with a single field override (avoids spreading ga) */
  const icpConfigWith = useCallback((overrides: Record<string, any>) => {
    return { ...(ga?.icpConfig as Record<string, any> || {}), ...overrides };
  }, [ga?.icpConfig]);

  const mutateError = useCallback(() => {
    toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
  }, [toast]);

  const handleGenerateDefinition = () => {
    const md = generateIcpEssay(config, desc, propertyLabel);
    updateMutation.mutate(
      { icpConfig: icpConfigWith({ _definition: md }) },
      {
        onSuccess: () => {
          setDefEditing(false);
          toast({ title: "Generated", description: "ICP definition updated from current profile." });
        },
        onError: mutateError,
      }
    );
  };

  const handleSaveDefinition = useCallback(() => {
    updateMutation.mutate(
      { icpConfig: icpConfigWith({ _definition: defDraft }) },
      {
        onSuccess: () => {
          setDefEditing(false);
          toast({ title: "Saved", description: "ICP definition saved." });
        },
        onError: mutateError,
      }
    );
  }, [icpConfigWith, defDraft, updateMutation, toast, mutateError]);

  const handleEditDefinition = () => {
    setDefDraft(savedDefinition || essay || "");
    setDefEditing(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(isEditing ? editablePrompt : prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    userClearedPromptRef.current = false;
    autoGenPromptRef.current = true;
    const generated = generateIcpPrompt(config, desc, propertyLabel);
    updateMutation.mutate(
      { assetDescription: generated },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({ title: "Generated", description: "AI prompt generated from current profile and description." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save generated prompt. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  useEffect(() => {
    if (
      activeTab === "icp-prompt" &&
      !prompt.trim() &&
      ga &&
      !autoGenPromptRef.current &&
      !userClearedPromptRef.current &&
      !updateMutation.isPending
    ) {
      const preview = generateIcpPrompt(config, desc, propertyLabel);
      if (preview.trim()) {
        autoGenPromptRef.current = true;
        handleGenerate();
      } else {
        autoGenPromptRef.current = true;
        toast({
          title: "Insufficient profile data",
          description: "Complete the Property Profile and Asset Description tabs first, then click Generate.",
        });
      }
    }
  }, [activeTab, prompt, ga, config, desc, propertyLabel, updateMutation.isPending]);

  const handleEdit = () => {
    setEditablePrompt(prompt);
    setIsEditing(true);
  };

  const handleSaveEdit = useCallback(() => {
    updateMutation.mutate(
      { assetDescription: editablePrompt },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({ title: "Saved", description: "AI prompt updated." });
        },
        onError: mutateError,
      }
    );
  }, [editablePrompt, updateMutation, toast, mutateError]);

  useEffect(() => {
    if (activeTab === "icp-prompt" && isEditing) {
      localSaveRef.current = handleSaveEdit;
    } else if (activeTab === "icp-definition" && defEditing) {
      localSaveRef.current = handleSaveDefinition;
    } else {
      localSaveRef.current = null;
    }
  }, [activeTab, isEditing, defEditing, handleSaveEdit, handleSaveDefinition]);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditablePrompt("");
  };

  const handleClear = () => {
    userClearedPromptRef.current = true;
    autoGenPromptRef.current = false;
    updateMutation.mutate(
      { assetDescription: "" },
      {
        onSuccess: () => {
          setIsEditing(false);
          setEditablePrompt("");
          toast({ title: "Cleared", description: "AI prompt cleared." });
        },
        onError: mutateError,
      }
    );
  };

  const handleOptimize = async () => {
    const currentPrompt = isEditing ? editablePrompt : prompt;
    if (!currentPrompt.trim()) {
      toast({ title: "Nothing to optimize", description: "Generate or enter a prompt first.", variant: "destructive" });
      return;
    }
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/ai/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: currentPrompt }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to optimize");
      }
      const { optimized } = await res.json();
      updateMutation.mutate(
        { assetDescription: optimized },
        {
          onSuccess: () => {
            setIsEditing(false);
            toast({ title: "Optimized", description: "Prompt has been optimized by AI." });
          },
          onError: mutateError,
        }
      );
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to optimize prompt", variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-4">
      <CurrentThemeTab tabs={ICP_TABS} activeTab={activeTab} onTabChange={handleTabSwitch} />

      <div className="mt-6">
        {activeTab === "icp-location" && (
          <IcpLocationTab onSaveStateChange={handleLocationSaveState} />
        )}

        {activeTab === "icp-profile" && (
          <CompanyProfileTab onSaveStateChange={handleProfileSaveState} />
        )}

        {activeTab === "icp-description" && (
          <AssetDefinitionTab onSaveStateChange={handleDescriptionSaveState} />
        )}

        {activeTab === "icp-prompt" && (
          <Card className="bg-card border border-border/80 shadow-sm" data-testid="card-ai-prompt">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                AI Research Prompt
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                This is the prompt served to the AI research engine. It instructs the LLM on what type of property and investment the ICP is targeting.
                Generate it from the Property Profile and Asset Description, then optionally edit or optimize it.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleGenerate}
                  disabled={updateMutation.isPending}
                  className="text-xs h-8 gap-1.5"
                  data-testid="button-generate-prompt"
                >
                  <IconRefreshCw className="w-3.5 h-3.5" />
                  Generate
                </Button>
                {!isEditing ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEdit}
                    disabled={!prompt}
                    className="text-xs h-8 gap-1.5"
                    data-testid="button-edit-prompt"
                  >
                    <IconPencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                      className="text-xs h-8 gap-1.5"
                      data-testid="button-save-edit"
                    >
                      Save Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="text-xs h-8"
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOptimize}
                  disabled={isOptimizing || (!prompt && !editablePrompt)}
                  className="text-xs h-8 gap-1.5"
                  data-testid="button-optimize-prompt"
                >
                  {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconWand2 className="w-3.5 h-3.5" />}
                  Optimize
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  disabled={!prompt && !editablePrompt}
                  className="text-xs h-8 gap-1.5"
                  data-testid="button-copy-prompt"
                >
                  <IconCopy className="w-3.5 h-3.5" />
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  disabled={!prompt || updateMutation.isPending}
                  className="text-xs h-8 gap-1.5 text-red-500 hover:text-red-600"
                  data-testid="button-clear-prompt"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                  Clear
                </Button>
              </div>

              {isEditing ? (
                <textarea
                  value={editablePrompt}
                  onChange={(e) => setEditablePrompt(e.target.value)}
                  className="w-full min-h-[500px] text-xs leading-relaxed font-mono text-foreground/90 bg-muted/40 border border-border rounded p-4 resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="textarea-ai-prompt"
                />
              ) : prompt ? (
                <pre
                  className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-foreground/90 bg-muted/40 border border-border rounded p-4 max-h-[600px] overflow-y-auto"
                  data-testid="text-ai-prompt"
                >
                  {prompt}
                </pre>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <IconSparkles className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No AI prompt generated yet</p>
                  <p className="text-xs mt-1">
                    Click <strong>Generate</strong> to build the prompt from your Property Profile and Asset Description.
                  </p>
                </div>
              )}

              {(isEditing ? editablePrompt : prompt) && (
                <p className="text-xs text-muted-foreground italic">
                  {(isEditing ? editablePrompt : prompt).length.toLocaleString()} characters
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "icp-definition" && (
          <Card className="bg-card border border-border/80 shadow-sm" data-testid="card-icp-definition">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    ICP Definition
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Human-readable summary of the Ideal Customer Profile. Generate from current settings or edit by hand.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleGenerateDefinition}
                    disabled={updateMutation.isPending}
                    className="text-xs h-8 gap-1.5"
                    data-testid="button-generate-definition"
                  >
                    <IconRefreshCw className="w-3.5 h-3.5" />
                    {savedDefinition ? "Regenerate" : "Generate"}
                  </Button>
                  {!defEditing ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditDefinition}
                      disabled={!savedDefinition && !essay}
                      className="text-xs h-8 gap-1.5"
                      data-testid="button-edit-definition"
                    >
                      <IconPencil className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleSaveDefinition}
                        disabled={updateMutation.isPending}
                        className="text-xs h-8 gap-1.5"
                        data-testid="button-save-definition"
                      >
                        {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDefEditing(false)}
                        className="text-xs h-8"
                        data-testid="button-cancel-definition"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {defEditing ? (
                <textarea
                  value={defDraft}
                  onChange={(e) => setDefDraft(e.target.value)}
                  className="w-full min-h-[400px] text-sm leading-relaxed font-sans text-foreground/90 bg-muted/40 border border-border rounded p-4 resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="textarea-icp-definition"
                />
              ) : savedDefinition ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground/90"
                  data-testid="text-icp-definition"
                >
                  {savedDefinition.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="mb-3 last:mb-0">{paragraph}</p>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <IconBookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No ICP definition generated yet</p>
                  <p className="text-xs mt-1">
                    Click <strong>Generate</strong> to build the definition from your current Property Profile and Asset Description.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "icp-research" && (
          <IcpResearchTab />
        )}

        {activeTab === "icp-sources" && (
          <IcpSourcesTab />
        )}
      </div>

      <AlertDialog open={pendingTab !== null} onOpenChange={(open) => { if (!open) setPendingTab(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes on this tab. Would you like to save them before switching?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTab(null)}>
              Cancel
            </AlertDialogCancel>
            <Button variant="outline" onClick={handleDialogDiscard} data-testid="button-discard-changes">
              Discard
            </Button>
            <Button onClick={handleDialogSave} data-testid="button-save-and-switch">
              Save Changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Icp() {
  const [saveState, setSaveState] = useState<AdminSaveState | null>(null);
  const handleSaveStateChange = useCallback((state: AdminSaveState | null) => {
    setSaveState(state);
  }, []);

  return (
    <Layout>
      <AnimatedPage>
        <div className="space-y-4 p-4 sm:p-6">
          <PageHeader
            title="Ideal Customer Profile (Management Company)"
            subtitle="Define the target property profile and asset description for the portfolio"
            actions={
              saveState ? (
                <SaveButton
                  onClick={saveState.onSave}
                  hasChanges={saveState.isDirty}
                  isPending={saveState.isPending}
                  size="sm"
                  data-testid="button-icp-save"
                />
              ) : undefined
            }
          />
          <AnimatedSection delay={0.1}>
            <SelfHealingBoundary>
              <IcpContent onSaveStateChange={handleSaveStateChange} />
            </SelfHealingBoundary>
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </Layout>
  );
}
