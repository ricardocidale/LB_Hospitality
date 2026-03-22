import { useState, useRef, useCallback, useMemo } from "react";
import { useExportSave } from "@/hooks/useExportSave";
import Layout from "@/components/Layout";
import { AnimatedPage } from "@/components/graphics/AnimatedPage";
import { useGlobalAssumptions, useUpdateAdminConfig, useMarketResearch, useProperties } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconSettings, IconGlobe, IconAlertCircle, IconTarget, IconBuilding, IconUsers, IconMapPin, IconInfo,
} from "@/components/icons";
import { Loader2 } from "@/components/icons/themed-icons";
import { ExportMenu, pdfAction, pptxAction } from "@/components/ui/export-toolbar";
import type { ResearchConfig, ResearchEventConfig } from "@shared/schema";
import { DEFAULT_ANTHROPIC_MODEL } from "@shared/constants";
import {
  type IcpConfig, type IcpDescriptive,
  DEFAULT_ICP_CONFIG, DEFAULT_ICP_DESCRIPTIVE, generateIcpEssay,
} from "@/components/admin/icp-config";
import { useToast } from "@/hooks/use-toast";
import { IcpProfileTab } from "./icp/IcpProfileTab";
import { IcpMarketContextTab } from "./icp/IcpMarketContextTab";
import { IcpIndustryStandardsTab } from "./icp/IcpIndustryStandardsTab";
import { IcpDataSourcesTab } from "./icp/IcpDataSourcesTab";

export default function CompanyIcpDefinition() {
  const { data: global, isLoading } = useGlobalAssumptions();
  const updateMutation = useUpdateAdminConfig();
  const { data: companyResearch } = useMarketResearch("company");
  const { data: properties = [] } = useProperties();
  const [activeTab, setActiveTab] = useState("icp-profile");
  const [defEditing, setDefEditing] = useState(false);
  const [defDraft, setDefDraft] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { requestSave, SaveDialog } = useExportSave();

  const icpConfig: IcpConfig = useMemo(() => ({
    ...DEFAULT_ICP_CONFIG,
    ...((global as any)?.icpConfig && typeof (global as any).icpConfig === "object" ? (global as any).icpConfig : {}),
  }), [global]);

  const icpDescriptive: IcpDescriptive = useMemo(() => ({
    ...DEFAULT_ICP_DESCRIPTIVE,
    ...((global as any)?.icpDescriptive && typeof (global as any).icpDescriptive === "object" ? (global as any).icpDescriptive : {}),
  }), [global]);

  const propertyLabel = global?.propertyLabel ?? "Boutique Hotel";
  const savedDefinition = (global as any)?.icpConfig?._definition as string | undefined;

  const essay = useMemo(
    () => generateIcpEssay(icpConfig, icpDescriptive, propertyLabel),
    [icpConfig, icpDescriptive, propertyLabel]
  );

  const icpConfigWith = useCallback((overrides: Record<string, any>) => {
    return { ...((global as any)?.icpConfig as Record<string, any> || {}), ...overrides };
  }, [global]);

  const handleGenerateDefinition = () => {
    const md = generateIcpEssay(icpConfig, icpDescriptive, propertyLabel);
    updateMutation.mutate(
      { icpConfig: icpConfigWith({ _definition: md }) } as any,
      {
        onSuccess: () => { setDefEditing(false); toast({ title: "Generated", description: "ICP definition updated from current profile." }); },
        onError: () => { toast({ title: "Error", description: "Failed to generate. Please try again.", variant: "destructive" }); },
      }
    );
  };

  const handleSaveDefinition = useCallback(() => {
    updateMutation.mutate(
      { icpConfig: icpConfigWith({ _definition: defDraft }) } as any,
      {
        onSuccess: () => { setDefEditing(false); toast({ title: "Saved", description: "ICP definition saved." }); },
        onError: () => { toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" }); },
      }
    );
  }, [icpConfigWith, defDraft, updateMutation, toast]);

  const handleEditDefinition = () => {
    setDefDraft(savedDefinition || essay || "");
    setDefEditing(true);
  };

  if (isLoading) {
    return (<Layout><div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>);
  }

  if (!global) {
    return (<Layout><div className="flex flex-col items-center justify-center h-[60vh]"><p className="text-muted-foreground">Failed to load company data.</p></div></Layout>);
  }

  const researchConfig = ((global as any)?.researchConfig as ResearchConfig) ?? {};
  const eventConfig: Partial<ResearchEventConfig> = (researchConfig as any).company ?? {};
  const companyName = global.companyName ?? "Hospitality Business";
  const assetDef = global.assetDefinition as any;
  const icpQualitative: Record<string, string> = (global as any).icpQualitative ?? {};

  const focusAreas = eventConfig.focusAreas?.length ? eventConfig.focusAreas : [
    "Management fee structures (ASC 606)", "Incentive management fee (IMF) triggers",
    "GAAP-compliant fee recognition", "USALI operating expense ratios",
    "Compensation benchmarks", "Contract terms and duration",
    "Company income tax rates", "Cost of equity / WACC inputs",
  ];
  const regions = eventConfig.regions?.length ? eventConfig.regions : [];
  const customInstructions = eventConfig.customInstructions?.trim() || null;
  const enabledTools = eventConfig.enabledTools?.length ? eventConfig.enabledTools : [];
  const customSources = researchConfig.customSources?.length ? researchConfig.customSources : [];
  const timeHorizon = eventConfig.timeHorizon || null;
  const preferredLlm = researchConfig.preferredLlm || (global as any).preferredLlm || DEFAULT_ANTHROPIC_MODEL;

  const companyInputs = [
    { label: "Company Name", value: companyName },
    { label: "Property Label", value: propertyLabel },
    { label: "Asset Level", value: assetDef?.level || "Luxury" },
  ];
  if (assetDef?.minRooms != null && assetDef?.maxRooms != null) companyInputs.push({ label: "Room Range", value: `${assetDef.minRooms}–${assetDef.maxRooms}` });
  if (assetDef?.hasFB) companyInputs.push({ label: "F&B Operations", value: "Included" });
  if (assetDef?.hasEvents) companyInputs.push({ label: "Event Hosting", value: "Included" });
  if (assetDef?.hasWellness) companyInputs.push({ label: "Wellness Programming", value: "Included" });
  if (global.modelStartDate) companyInputs.push({ label: "Model Start", value: new Date(global.modelStartDate).toLocaleDateString() });

  const qualitativeSections = [
    { key: "investmentThesis", label: "Investment Thesis", icon: IconTarget },
    { key: "targetProperty", label: "Target Property Character", icon: IconBuilding },
    { key: "guestExperience", label: "Guest Experience Vision", icon: IconUsers },
    { key: "geographicStrategy", label: "Geographic Strategy", icon: IconMapPin },
    { key: "competitiveEdge", label: "Competitive Edge", icon: IconTarget },
    { key: "brandIdentity", label: "Brand Identity", icon: IconTarget },
  ].filter(s => icpQualitative[s.key]?.trim());

  const researchContent = companyResearch?.content as any;
  const researchSources = researchContent?.sources || researchContent?.references || [];
  const researchMeta = {
    model: companyResearch?.llmModel || null,
    timestamp: companyResearch?.updatedAt ? new Date(companyResearch.updatedAt).toLocaleString() : null,
    tokenCount: researchContent?.tokenCount || researchContent?._meta?.tokenCount || null,
  };

  const exportData = {
    companyName, propertyLabel, companyInputs, icpConfig, icpDescriptive, icpQualitative,
    icpDefinition: savedDefinition || essay,
    qualitativeSections: qualitativeSections.map(s => ({ ...s, content: icpQualitative[s.key] })),
    amenityItems: [], focusAreas, regions, customInstructions, enabledTools, customSources, timeHorizon, preferredLlm,
  };

  const handleExportPDF = async (customFilename?: string) => {
    try {
      const response = await fetch("/api/premium-export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "pdf", reportType: "company-research-criteria", title: `${companyName} Co. — ICP Definition`, data: exportData }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = customFilename || `${companyName.replace(/\s+/g, "-")}-ICP-Definition.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "PDF downloaded successfully." });
    } catch {
      toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
    }
  };

  const handleExportPPTX = async (customFilename?: string) => {
    try {
      const response = await fetch("/api/premium-export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "pptx", reportType: "company-research-criteria", title: `${companyName} Co. — ICP Definition`, data: exportData }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = customFilename || `${companyName.replace(/\s+/g, "-")}-ICP-Definition.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "PowerPoint downloaded successfully." });
    } catch {
      toast({ title: "Export failed", description: "Could not generate PowerPoint.", variant: "destructive" });
    }
  };

  return (
    <Layout>
      {SaveDialog}
      <AnimatedPage>
        <div className="space-y-6 max-w-5xl" ref={contentRef}>
          <PageHeader
            title="ICP Definition"
            subtitle={`${companyName} Co. — Ideal Customer Profile & Research Parameters`}
            variant="dark"
            backLink="/company/assumptions"
            actions={
              <ExportMenu actions={[pdfAction(() => requestSave(`${companyName} ICP Definition`, ".pdf", (f) => handleExportPDF(f))), pptxAction(() => requestSave(`${companyName} ICP Definition`, ".pptx", (f) => handleExportPPTX(f)))]} />
            }
          />

          <Card className="bg-primary/5 border-primary/20 p-4" data-testid="icp-advisory-notice">
            <div className="flex gap-3">
              <IconInfo className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">How company research uses your data</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The AI researcher uses your company profile, ICP definition, and asset class
                  parameters to find relevant management company benchmarks — fee structures,
                  compensation norms, GAAP standards, and operating ratios. Your ICP plays a central
                  role: it tells the AI <span className="font-medium text-foreground">who your target
                  clients are</span>, the property types you manage, and the markets you operate in,
                  so it can accurately size your addressable market and benchmark against comparable
                  management companies.
                </p>
              </div>
            </div>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="icp-profile" data-testid="tab-icp-profile">
                <IconTarget className="w-3.5 h-3.5 mr-1.5" />
                ICP Profile
              </TabsTrigger>
              <TabsTrigger value="market-context" data-testid="tab-market-context">
                <IconBuilding className="w-3.5 h-3.5 mr-1.5" />
                Market Context
              </TabsTrigger>
              <TabsTrigger value="industry-standards" data-testid="tab-industry-standards">
                <IconSettings className="w-3.5 h-3.5 mr-1.5" />
                Industry Standards
              </TabsTrigger>
              <TabsTrigger value="data-sources" data-testid="tab-data-sources">
                <IconGlobe className="w-3.5 h-3.5 mr-1.5" />
                Data Sources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="icp-profile">
              <IcpProfileTab
                icpConfig={icpConfig} icpDescriptive={icpDescriptive} icpQualitative={icpQualitative}
                savedDefinition={savedDefinition} essay={essay}
                defEditing={defEditing} defDraft={defDraft} setDefDraft={setDefDraft}
                onGenerate={handleGenerateDefinition} onEdit={handleEditDefinition}
                onSave={handleSaveDefinition} onCancelEdit={() => setDefEditing(false)}
                isPending={updateMutation.isPending} qualitativeSections={qualitativeSections}
              />
            </TabsContent>

            <TabsContent value="market-context">
              <IcpMarketContextTab global={global} properties={properties} companyInputs={companyInputs} focusAreas={focusAreas} />
            </TabsContent>

            <TabsContent value="industry-standards">
              <IcpIndustryStandardsTab
                preferredLlm={preferredLlm} timeHorizon={timeHorizon} regions={regions}
                enabledTools={enabledTools} customInstructions={customInstructions} icpDescriptive={icpDescriptive}
              />
            </TabsContent>

            <TabsContent value="data-sources">
              <IcpDataSourcesTab customSources={customSources} researchSources={researchSources} researchMeta={researchMeta} />
            </TabsContent>
          </Tabs>

          <Card className="bg-muted/30 border-border p-4" data-testid="criteria-readonly-notice">
            <div className="flex gap-3">
              <IconAlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                The ICP Definition can be generated and edited above. Other tabs are read-only —
                to change the ICP profile parameters, visit the ICP Studio in the Admin panel.
                To adjust the research configuration, update the settings in the Research Center.
              </p>
            </div>
          </Card>
        </div>
      </AnimatedPage>
    </Layout>
  );
}
