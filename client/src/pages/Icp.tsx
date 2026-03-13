import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { AnimatedPage, AnimatedSection } from "@/components/graphics/motion/AnimatedPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { IconTarget, IconHotel, IconSparkles, IconCopy, IconPencil, IconTrash, IconRefreshCw, IconWand2, IconBookOpen, IconMapPin, IconFlaskConical, IconFileStack } from "@/components/icons";
import AssetDefinitionTab from "@/components/admin/AssetDefinitionTab";
import CompanyProfileTab from "@/components/company/CompanyProfileTab";
import IcpLocationTab from "@/components/admin/IcpLocationTab";
import IcpResearchTab from "@/components/admin/IcpResearchTab";
import IcpSourcesTab from "@/components/admin/IcpSourcesTab";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  type IcpConfig,
  type IcpDescriptive,
  DEFAULT_ICP_CONFIG,
  DEFAULT_ICP_DESCRIPTIVE,
  generateIcpPrompt,
  generateIcpEssay,
} from "@/components/admin/icp-config";

export function IcpContent() {
  const { data: ga } = useGlobalAssumptions();
  const updateMutation = useUpdateGlobalAssumptions();
  const { toast } = useToast();

  const [editablePrompt, setEditablePrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const essay = useMemo(
    () => generateIcpEssay(config, desc, propertyLabel),
    [config, desc, propertyLabel]
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(isEditing ? editablePrompt : prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    const generated = generateIcpPrompt(config, desc, propertyLabel);
    updateMutation.mutate(
      { assetDescription: generated },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({ title: "Generated", description: "AI prompt generated from current profile and description." });
        },
      }
    );
  };

  const handleEdit = () => {
    setEditablePrompt(prompt);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(
      { assetDescription: editablePrompt },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({ title: "Saved", description: "AI prompt updated." });
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditablePrompt("");
  };

  const handleClear = () => {
    updateMutation.mutate(
      { assetDescription: "" },
      {
        onSuccess: () => {
          setIsEditing(false);
          setEditablePrompt("");
          toast({ title: "Cleared", description: "AI prompt cleared." });
        },
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
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full grid grid-cols-7 h-10 max-w-5xl">
          <TabsTrigger value="location" className="text-sm gap-1.5" data-testid="tab-icp-location">
            <IconMapPin className="w-4 h-4" />
            Location
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-sm gap-1.5" data-testid="tab-icp-profile">
            <IconHotel className="w-4 h-4" />
            Property Profile
          </TabsTrigger>
          <TabsTrigger value="description" className="text-sm gap-1.5" data-testid="tab-icp-description">
            <IconTarget className="w-4 h-4" />
            Asset Description
          </TabsTrigger>
          <TabsTrigger value="prompt" className="text-sm gap-1.5" data-testid="tab-icp-prompt">
            <IconSparkles className="w-4 h-4" />
            AI Prompt
          </TabsTrigger>
          <TabsTrigger value="definition" className="text-sm gap-1.5" data-testid="tab-icp-definition">
            <IconBookOpen className="w-4 h-4" />
            ICP Definition
          </TabsTrigger>
          <TabsTrigger value="research" className="text-sm gap-1.5" data-testid="tab-icp-research">
            <IconFlaskConical className="w-4 h-4" />
            Research
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-sm gap-1.5" data-testid="tab-icp-sources">
            <IconFileStack className="w-4 h-4" />
            Sources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="location" className="mt-6">
          <IcpLocationTab />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <CompanyProfileTab />
        </TabsContent>

        <TabsContent value="description" className="mt-6">
          <AssetDefinitionTab />
        </TabsContent>

        <TabsContent value="prompt" className="mt-6">
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
                  <>
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
                  </>
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
        </TabsContent>

        <TabsContent value="definition" className="mt-6">
          <Card className="bg-card border border-border/80 shadow-sm" data-testid="card-icp-definition">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                ICP Definition
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Human-readable summary of the Ideal Customer Profile, generated from the Property Profile and Asset Description parameters.
              </p>
            </CardHeader>
            <CardContent>
              {essay ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground/90"
                  data-testid="text-icp-definition"
                >
                  {essay.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="mb-3 last:mb-0">{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-4 text-center">
                  Configure the Asset Description parameters to see the ICP definition.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="mt-6">
          <IcpResearchTab />
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <IcpSourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Icp() {
  return (
    <Layout>
      <AnimatedPage>
        <div className="space-y-4 p-4 sm:p-6">
          <PageHeader
            title="Ideal Customer Profile (Management Company)"
            subtitle="Define the target property profile and asset description for the portfolio"
          />
          <AnimatedSection delay={0.1}>
            <IcpContent />
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </Layout>
  );
}
