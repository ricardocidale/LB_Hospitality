import { useState, useRef, useCallback, useMemo } from "react";
import { useExportSave } from "@/hooks/useExportSave";
import Layout from "@/components/Layout";
import { AnimatedPage } from "@/components/graphics/AnimatedPage";
import { useGlobalAssumptions, useUpdateAdminConfig, useMarketResearch, useProperties } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconDatabase,
  IconSettings,
  IconGlobe,
  IconAlertCircle,
  IconFileText,
  IconTarget,
  IconCpu,
  IconExternalLink,
  IconInfo,
  IconUsers,
  IconBuilding,
  IconDollarSign,
  IconMapPin,
  IconRefreshCw,
  IconPencil,
  IconBookOpen,
} from "@/components/icons";
import { Loader2 } from "@/components/icons/themed-icons";
import { ExportMenu, pdfAction, pptxAction } from "@/components/ui/export-toolbar";
import type { ResearchConfig, ResearchEventConfig } from "@shared/schema";
import { DEFAULT_ANTHROPIC_MODEL } from "@shared/constants";
import {
  type IcpConfig,
  type IcpDescriptive,
  DEFAULT_ICP_CONFIG,
  DEFAULT_ICP_DESCRIPTIVE,
  PRIORITY_LABELS,
  type Priority,
  generateIcpEssay,
} from "@/components/admin/icp-config";
import { useToast } from "@/hooks/use-toast";

function fmt$(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const colors: Record<Priority, string> = {
    must: "bg-primary/15 text-primary border-primary/20",
    major: "bg-chart-1/15 text-chart-1 border-chart-1/20",
    nice: "bg-accent-pop/15 text-accent-pop border-accent-pop/20",
    no: "bg-destructive/15 text-destructive border-destructive/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${colors[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

function DataCard({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <Card className="bg-muted/30 border-border p-3 space-y-1">
      <div className="flex items-center gap-2">
        <p className="label-text text-muted-foreground uppercase tracking-wide text-[11px]">{label}</p>
        {badge}
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </Card>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: React.ComponentType<any>; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

const BENCHMARK_SOURCES = [
  {
    name: "HVS Management Agreement Study",
    description: "Industry-standard benchmarks for hotel management agreements — base fees, incentive fees, contract terms, and operator compensation structures.",
  },
  {
    name: "USALI (Uniform System of Accounts for the Lodging Industry)",
    description: "Standardized chart of accounts and departmental operating expense ratios for hotel financial reporting and benchmarking.",
  },
  {
    name: "CBRE Hotels Research",
    description: "Cap rate surveys, lending benchmarks, transaction data, and market-level performance metrics for hotel real estate.",
  },
  {
    name: "STR (Smith Travel Research)",
    description: "Occupancy, ADR, RevPAR trends, ramp-up benchmarks, and competitive set performance data for the lodging industry.",
  },
];

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
        onSuccess: () => {
          setDefEditing(false);
          toast({ title: "Generated", description: "ICP definition updated from current profile." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to generate. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  const handleSaveDefinition = useCallback(() => {
    updateMutation.mutate(
      { icpConfig: icpConfigWith({ _definition: defDraft }) } as any,
      {
        onSuccess: () => {
          setDefEditing(false);
          toast({ title: "Saved", description: "ICP definition saved." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
        },
      }
    );
  }, [icpConfigWith, defDraft, updateMutation, toast]);

  const handleEditDefinition = () => {
    setDefDraft(savedDefinition || essay || "");
    setDefEditing(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!global) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Failed to load company data.</p>
        </div>
      </Layout>
    );
  }

  const researchConfig = ((global as any)?.researchConfig as ResearchConfig) ?? {};
  const eventConfig: Partial<ResearchEventConfig> = (researchConfig as any).company ?? {};
  const assetDef = global.assetDefinition as any;
  const companyName = global.companyName ?? "Hospitality Business";

  const icpQualitative: Record<string, string> = (global as any).icpQualitative ?? {};

  const focusAreas = eventConfig.focusAreas?.length ? eventConfig.focusAreas : [
    "Management fee structures (ASC 606)",
    "Incentive management fee (IMF) triggers",
    "GAAP-compliant fee recognition",
    "USALI operating expense ratios",
    "Compensation benchmarks",
    "Contract terms and duration",
    "Company income tax rates",
    "Cost of equity / WACC inputs",
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
  if (assetDef?.minRooms != null && assetDef?.maxRooms != null) {
    companyInputs.push({ label: "Room Range", value: `${assetDef.minRooms}–${assetDef.maxRooms}` });
  }
  if (assetDef?.hasFB) companyInputs.push({ label: "F&B Operations", value: "Included" });
  if (assetDef?.hasEvents) companyInputs.push({ label: "Event Hosting", value: "Included" });
  if (assetDef?.hasWellness) companyInputs.push({ label: "Wellness Programming", value: "Included" });
  if (global.modelStartDate) {
    companyInputs.push({ label: "Model Start", value: new Date(global.modelStartDate).toLocaleDateString() });
  }

  const qualitativeSections = [
    { key: "investmentThesis", label: "Investment Thesis", icon: IconTarget },
    { key: "targetProperty", label: "Target Property Character", icon: IconBuilding },
    { key: "guestExperience", label: "Guest Experience Vision", icon: IconUsers },
    { key: "geographicStrategy", label: "Geographic Strategy", icon: IconMapPin },
    { key: "competitiveEdge", label: "Competitive Edge", icon: IconTarget },
    { key: "brandIdentity", label: "Brand Identity", icon: IconFileText },
  ].filter(s => icpQualitative[s.key]?.trim());

  const amenityItems: Array<{ name: string; priority: Priority; detail?: string }> = [
    { name: "Swimming Pool", priority: icpConfig.pool, detail: `${icpConfig.poolSqFt} sq ft` },
    { name: "Spa Facility", priority: icpConfig.spa, detail: `${icpConfig.spaTreatmentRooms} rooms` },
    { name: "Yoga Studio", priority: icpConfig.yogaStudio },
    { name: "Gym / Fitness", priority: icpConfig.gym },
    { name: "Tennis", priority: icpConfig.tennis, detail: `${icpConfig.tennisCourts} court(s)` },
    { name: "Pickleball", priority: icpConfig.pickleball, detail: `${icpConfig.pickleballCourts} court(s)` },
    { name: "Equestrian", priority: icpConfig.horseFacilities, detail: `${icpConfig.horseStalls} stalls` },
    { name: "Casitas", priority: icpConfig.casitas, detail: `${icpConfig.casitasCount} units` },
    { name: "Vineyard / Orchard", priority: icpConfig.vineyard },
    { name: "Barn (Events)", priority: icpConfig.barn },
    { name: "Glamping", priority: icpConfig.glamping },
    { name: "Chapel", priority: icpConfig.chapel },
  ].filter(a => a.priority !== "no");

  const researchContent = companyResearch?.content as any;
  const researchSources = researchContent?.sources || researchContent?.references || [];
  const researchMeta = {
    model: companyResearch?.llmModel || null,
    timestamp: companyResearch?.updatedAt ? new Date(companyResearch.updatedAt).toLocaleString() : null,
    tokenCount: researchContent?.tokenCount || researchContent?._meta?.tokenCount || null,
  };

  const handleExportPDF = async (customFilename?: string) => {
    try {
      const response = await fetch("/api/premium-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "pdf",
          reportType: "company-research-criteria",
          title: `${companyName} Co. — ICP Definition`,
          data: {
            companyName,
            propertyLabel,
            companyInputs,
            icpConfig,
            icpDescriptive,
            icpQualitative,
            icpDefinition: savedDefinition || essay,
            qualitativeSections: qualitativeSections.map(s => ({ ...s, content: icpQualitative[s.key] })),
            amenityItems,
            focusAreas,
            regions,
            customInstructions,
            enabledTools,
            customSources,
            timeHorizon,
            preferredLlm,
          },
        }),
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "pptx",
          reportType: "company-research-criteria",
          title: `${companyName} Co. — ICP Definition`,
          data: {
            companyName,
            propertyLabel,
            companyInputs,
            icpConfig,
            icpDescriptive,
            icpQualitative,
            icpDefinition: savedDefinition || essay,
            qualitativeSections: qualitativeSections.map(s => ({ ...s, content: icpQualitative[s.key] })),
            amenityItems,
            focusAreas,
            regions,
            customInstructions,
            enabledTools,
            customSources,
            timeHorizon,
            preferredLlm,
          },
        }),
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
                <p className="text-sm font-medium text-foreground">
                  How company research uses your data
                </p>
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

            {/* ── ICP Profile Tab ── */}
            <TabsContent value="icp-profile" className="space-y-4">
              <Card className="border border-border rounded-lg overflow-hidden" data-testid="card-icp-definition">
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
                        Click <strong>Generate</strong> to build the definition from your current ICP profile settings.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {qualitativeSections.length > 0 && (
                <Card className="border border-border rounded-lg p-5 space-y-4">
                  <SectionHeading icon={IconTarget} title="Strategic Vision" />
                  <p className="text-xs text-muted-foreground">
                    Qualitative ICP descriptions that define your target client profile and inform
                    market sizing.
                  </p>
                  <div className="space-y-4">
                    {qualitativeSections.map((section) => (
                      <div key={section.key} className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <section.icon className="w-4 h-4 text-primary/70" />
                          <h4 className="text-sm font-medium text-foreground">{section.label}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {icpQualitative[section.key]}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconBuilding} title="Physical Property Parameters" />
                <p className="text-xs text-muted-foreground">
                  Quantitative ICP parameters that define the ideal property target — used by the
                  AI to benchmark operating costs, revenue mix, and investment returns.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="criteria-icp-physical">
                  <DataCard label="Room Count" value={`${icpConfig.roomsMin}–${icpConfig.roomsMax}`} />
                  <DataCard label="Sweet Spot" value={`${icpConfig.roomsSweetSpotMin}–${icpConfig.roomsSweetSpotMax} rooms`} />
                  <DataCard label="Land Area" value={`${icpConfig.landAcresMin}–${icpConfig.landAcresMax} acres`} />
                  <DataCard label="Built Area" value={`${icpConfig.builtSqFtMin.toLocaleString()}–${icpConfig.builtSqFtMax.toLocaleString()} sq ft`} />
                  <DataCard label="Indoor Event Capacity" value={`${icpConfig.indoorEventMin}–${icpConfig.indoorEventMax} guests`} />
                  <DataCard label="Outdoor Event Capacity" value={`${icpConfig.outdoorEventMin}–${icpConfig.outdoorEventMax} guests`} />
                  <DataCard label="Dining Capacity" value={`${icpConfig.diningCapacityMin}–${icpConfig.diningCapacityMax} guests`} />
                  <DataCard label="Parking" value={`${icpConfig.parkingMin}–${icpConfig.parkingMax} spaces`} />
                </div>
              </Card>

              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconDollarSign} title="Financial Parameters" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="criteria-icp-financial">
                  <DataCard label="Acquisition Range" value={`${fmt$(icpConfig.acquisitionMin)}–${fmt$(icpConfig.acquisitionMax)}`} />
                  <DataCard label="Target Acquisition" value={`${fmt$(icpConfig.acquisitionTargetMin)}–${fmt$(icpConfig.acquisitionTargetMax)}`} />
                  <DataCard label="Total Investment" value={`${fmt$(icpConfig.totalInvestmentMin)}–${fmt$(icpConfig.totalInvestmentMax)}`} />
                  <DataCard label="Renovation Budget" value={`${fmt$(icpConfig.renovationMin)}–${fmt$(icpConfig.renovationMax)}`} />
                  <DataCard label="FF&E per Room" value={`${fmt$(icpConfig.ffePerRoomMin)}–${fmt$(icpConfig.ffePerRoomMax)}`} />
                  <DataCard label="Target ADR" value={`$${icpConfig.adrMin}–$${icpConfig.adrMax}`} />
                  <DataCard label="Stabilized Occupancy" value={`${icpConfig.occupancyMin}%–${icpConfig.occupancyMax}%`} />
                  <DataCard label="RevPAR Target" value={`$${icpConfig.revParMin}–$${icpConfig.revParMax}`} />
                  <DataCard label="Base Mgmt Fee" value={`${icpConfig.baseMgmtFeeMin}%–${icpConfig.baseMgmtFeeMax}%`} />
                  <DataCard label="Incentive Fee" value={`${icpConfig.incentiveFeeMin}%–${icpConfig.incentiveFeeMax}%`} />
                  <DataCard label="Exit Cap Rate" value={`${icpConfig.exitCapRateMin}%–${icpConfig.exitCapRateMax}%`} />
                  <DataCard label="Target IRR" value={`${icpConfig.targetIrr}%+`} />
                  <DataCard label="Equity Multiple" value={`${icpConfig.equityMultipleMin}x–${icpConfig.equityMultipleMax}x`} />
                  <DataCard label="Hold Period" value={`${icpConfig.holdYearsMin}–${icpConfig.holdYearsMax} years`} />
                </div>
              </Card>

              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconDollarSign} title="Revenue Mix Targets" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="criteria-icp-revenue">
                  <DataCard label="F&B Share" value={`${icpConfig.fbShareMin}%–${icpConfig.fbShareMax}% of room revenue`} />
                  <DataCard label="Events Share" value={`${icpConfig.eventsShareMin}%–${icpConfig.eventsShareMax}% of room revenue`} />
                  <DataCard label="Spa & Wellness" value={`${icpConfig.spaShareMin}%–${icpConfig.spaShareMax}% of room revenue`} />
                  <DataCard label="Other Ancillary" value={`${icpConfig.otherShareMin}%–${icpConfig.otherShareMax}% of room revenue`} />
                  <DataCard label="Total Ancillary Target" value={`${icpConfig.totalAncillaryMin}%–${icpConfig.totalAncillaryMax}%`} />
                </div>
              </Card>

              {amenityItems.length > 0 && (
                <Card className="border border-border rounded-lg p-5 space-y-4">
                  <SectionHeading icon={IconTarget} title="Required Amenities & Facilities" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="criteria-icp-amenities">
                    {amenityItems.map((item, i) => (
                      <DataCard
                        key={i}
                        label={item.name}
                        value={item.detail || "—"}
                        badge={<PriorityBadge priority={item.priority} />}
                      />
                    ))}
                  </div>
                </Card>
              )}

              {icpDescriptive.locationDetails && (
                <Card className="border border-border rounded-lg p-5 space-y-4">
                  <SectionHeading icon={IconMapPin} title="Details about Location" />
                  <div className="space-y-1.5">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{icpDescriptive.locationDetails}</p>
                  </div>
                </Card>
              )}

              {(icpDescriptive.exclusions || icpDescriptive.regulatoryNotes) && (
                <Card className="border border-border rounded-lg p-5 space-y-4">
                  <SectionHeading icon={IconAlertCircle} title="Exclusions & Regulatory" />
                  {icpDescriptive.regulatoryNotes && (
                    <div className="space-y-1.5">
                      <p className="label-text text-muted-foreground font-medium text-[11px] uppercase tracking-wide">Regulatory Notes</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{icpDescriptive.regulatoryNotes}</p>
                    </div>
                  )}
                  {icpDescriptive.exclusions && (
                    <div className="space-y-1.5 mt-4">
                      <p className="label-text text-muted-foreground font-medium text-[11px] uppercase tracking-wide">Exclusions</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{icpDescriptive.exclusions}</p>
                    </div>
                  )}
                </Card>
              )}
            </TabsContent>

            {/* ── Market Context Tab ── */}
            <TabsContent value="market-context" className="space-y-4">
              <Card className="bg-accent-pop/5 border-accent-pop/20 p-4" data-testid="context-advisory-note">
                <div className="flex gap-3">
                  <IconInfo className="w-5 h-5 text-accent-pop dark:text-accent-pop shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Context vs. Benchmarked Values</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The values below are used as <span className="font-medium text-foreground">context</span> for
                      the AI researcher — they describe your company and portfolio so the AI can find relevant benchmarks.
                      The AI <span className="font-medium text-foreground">does not modify</span> these values; instead,
                      it benchmarks your management fees, operating costs, and compensation against industry standards.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconDatabase} title="Company Context" />
                <p className="text-xs text-muted-foreground">
                  These company-level details shape the AI's understanding of your management
                  entity and the asset class you specialize in.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="criteria-company-context">
                  {companyInputs.map((input, i) => (
                    <DataCard key={i} label={input.label} value={input.value} />
                  ))}
                  <DataCard label="Property Count" value={`${properties.length} properties`} />
                  {properties.length > 0 && (
                    <DataCard
                      label="Portfolio Markets"
                      value={Array.from(new Set(properties.map(p => p.location).filter(Boolean))).join(", ") || "—"}
                    />
                  )}
                </div>
              </Card>

              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconDollarSign} title="Fee Structures" />
                <p className="text-xs text-muted-foreground">
                  Management fee rates applied across the portfolio — the AI benchmarks these
                  against industry standards (HVS, CBRE).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="criteria-fee-structures">
                  <DataCard label="Base Management Fee" value={`${global.baseManagementFee}%`} />
                  <DataCard label="Incentive Management Fee" value={`${global.incentiveManagementFee}%`} />
                  <DataCard label="Marketing Rate" value={`${global.marketingRate}%`} />
                  <DataCard label="Misc Ops Rate" value={`${global.miscOpsRate}%`} />
                </div>
              </Card>

              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconBuilding} title="Overhead Structure" />
                <p className="text-xs text-muted-foreground">
                  Fixed overhead costs that define the management company's operational cost base.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="criteria-overhead">
                  <DataCard label="Office Lease" value={fmt$(global.officeLeaseStart)} />
                  <DataCard label="Professional Services" value={fmt$(global.professionalServicesStart)} />
                  <DataCard label="Tech Infrastructure" value={fmt$(global.techInfraStart)} />
                  <DataCard label="Travel per Client" value={fmt$(global.travelCostPerClient)} />
                  <DataCard label="IT License per Client" value={fmt$(global.itLicensePerClient)} />
                </div>
              </Card>

              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconUsers} title="Staffing Model" />
                <p className="text-xs text-muted-foreground">
                  Staffing tiers and compensation structure for the management company.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="criteria-staffing">
                  <DataCard label="Staff Salary (avg)" value={fmt$(global.staffSalary)} />
                  <DataCard label="Partner Count (Yr 1)" value={`${global.partnerCountYear1} partners`} />
                  <DataCard label="Partner Comp (Yr 1)" value={fmt$(global.partnerCompYear1)} />
                  <DataCard label="Tier 1 (≤ props)" value={`≤${global.staffTier1MaxProperties} → ${global.staffTier1Fte} FTE`} />
                  <DataCard label="Tier 2 (≤ props)" value={`≤${global.staffTier2MaxProperties} → ${global.staffTier2Fte} FTE`} />
                  <DataCard label="Tier 3 (above)" value={`${global.staffTier3Fte} FTE`} />
                </div>
              </Card>

              {assetDef?.description && (
                <Card className="border border-border rounded-lg p-5 space-y-3">
                  <SectionHeading icon={IconFileText} title="Asset Class Description" />
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {assetDef.description}
                  </p>
                </Card>
              )}

              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconDollarSign} title="Research Focus Areas" />
                <p className="text-xs text-muted-foreground">
                  The AI researcher covers these specific domains for management company analysis.
                </p>
                <div className="space-y-1.5">
                  {focusAreas.map((area, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-1.5 px-3 rounded-md bg-muted/30">
                      <span className="text-xs font-mono text-primary/60 w-5">{i + 1}.</span>
                      <span className="text-sm text-foreground">{area}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {(global as any).portfolioLocations && Array.isArray((global as any).portfolioLocations) && (global as any).portfolioLocations.length > 0 && (
                <Card className="border border-border rounded-lg p-5 space-y-4">
                  <SectionHeading icon={IconMapPin} title="Portfolio Locations / Markets" />
                  <div className="flex flex-wrap gap-1.5">
                    {((global as any).portfolioLocations as string[]).map((loc, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{loc}</Badge>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* ── Industry Standards Tab ── */}
            <TabsContent value="industry-standards" className="space-y-4">
              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconFileText} title="Seed Benchmark Sources" />
                <p className="text-xs text-muted-foreground">
                  These authoritative industry sources provide the foundational benchmarks that drive
                  the AI's company-level research analysis.
                </p>
                <div className="space-y-3">
                  {BENCHMARK_SOURCES.map((source, i) => (
                    <div key={i} className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <IconFileText className="w-4 h-4 text-primary/70" />
                        <h4 className="text-sm font-medium text-foreground">{source.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {source.description}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconSettings} title="Admin Research Configuration" />
                <p className="text-xs text-muted-foreground">
                  These settings are managed by your administrator in the Research Center and
                  shape how the AI conducts its company-level analysis.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <DataCard label="Preferred LLM" value={preferredLlm} />
                  {timeHorizon && <DataCard label="Investment Horizon" value={timeHorizon} />}
                </div>

                {regions.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    <p className="label-text text-muted-foreground font-medium text-[11px] uppercase tracking-wide">Geographic Scope</p>
                    <div className="flex flex-wrap gap-1.5">
                      {regions.map((r) => (
                        <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {enabledTools.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    <p className="label-text text-muted-foreground font-medium text-[11px] uppercase tracking-wide">Enabled Research Tools</p>
                    <div className="flex flex-wrap gap-1.5">
                      {enabledTools.map((tool) => (
                        <Badge key={tool} variant="secondary" className="text-xs">{tool}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {customInstructions && (
                  <div className="space-y-1.5 mt-3">
                    <p className="label-text text-muted-foreground font-medium text-[11px] uppercase tracking-wide">Custom Instructions</p>
                    <Card className="bg-muted/50 border-border p-3">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{customInstructions}</p>
                    </Card>
                  </div>
                )}

                {!regions.length && !timeHorizon && !enabledTools.length && !customInstructions && (
                  <p className="text-sm text-muted-foreground italic">
                    No custom research configuration has been set. The AI will use its default
                    research methodology for management company analysis.
                  </p>
                )}
              </Card>

              {icpDescriptive.vendorServices && (
                <Card className="border border-border rounded-lg p-5 space-y-3">
                  <SectionHeading icon={IconSettings} title="Managed Vendor Services" />
                  <p className="text-xs text-muted-foreground">
                    Third-party vendor services the management company coordinates for each property.
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {icpDescriptive.vendorServices}
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* ── Data Sources Tab ── */}
            <TabsContent value="data-sources" className="space-y-4">
              {customSources.length > 0 && (
                <Card className="border border-border rounded-lg p-5 space-y-4">
                  <SectionHeading icon={IconGlobe} title="Curated Sources" />
                  <p className="text-xs text-muted-foreground">
                    These sources are provided to the AI as reference material for its analysis.
                  </p>
                  <div className="space-y-2">
                    {customSources.map((source, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="text-xs shrink-0">{source.category}</Badge>
                          <span className="text-sm text-foreground truncate">{source.name}</span>
                        </div>
                        {source.url && (
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors shrink-0" data-testid={`link-source-${i}`}>
                            <IconExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {customSources.length === 0 && (
                <Card className="border border-border rounded-lg p-5 space-y-3">
                  <SectionHeading icon={IconGlobe} title="Curated Sources" />
                  <p className="text-sm text-muted-foreground italic">
                    No custom sources have been configured. The AI uses its built-in knowledge
                    of hospitality industry databases, USALI standards, and management company benchmarks.
                  </p>
                </Card>
              )}

              {Array.isArray(researchSources) && researchSources.length > 0 && (
                <Card className="border border-border rounded-lg p-5 space-y-4">
                  <SectionHeading icon={IconExternalLink} title="Sources from Last Research Run" />
                  <p className="text-xs text-muted-foreground">
                    External references cited in the most recent company research generation.
                  </p>
                  <div className="space-y-2">
                    {researchSources.map((source: any, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {source.category && (
                            <Badge variant="outline" className="text-xs shrink-0">{source.category}</Badge>
                          )}
                          <span className="text-sm text-foreground truncate">{source.name || source.title || source.url}</span>
                        </div>
                        {(source.url || source.link) && (
                          <a href={source.url || source.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors shrink-0">
                            <IconExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconCpu} title="Generation Metadata" />
                <p className="text-xs text-muted-foreground">
                  Details from the most recent company research generation run.
                </p>
                {researchMeta.model || researchMeta.timestamp ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {researchMeta.model && <DataCard label="Model" value={researchMeta.model} />}
                    {researchMeta.timestamp && <DataCard label="Generated" value={researchMeta.timestamp} />}
                    {researchMeta.tokenCount != null && <DataCard label="Tokens" value={researchMeta.tokenCount.toLocaleString()} />}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No company research has been generated yet. Run research from the Company Assumptions page to populate this data.
                  </p>
                )}
              </Card>
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
