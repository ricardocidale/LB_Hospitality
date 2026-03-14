import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import { useGlobalAssumptions } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/icons";
import { Loader2 } from "lucide-react";
import { ExportMenu, pdfAction, pptxAction } from "@/components/ui/export-toolbar";
import type { ResearchConfig, ResearchEventConfig } from "@shared/schema";
import {
  type IcpConfig,
  type IcpDescriptive,
  DEFAULT_ICP_CONFIG,
  DEFAULT_ICP_DESCRIPTIVE,
  PRIORITY_LABELS,
  type Priority,
} from "@/components/admin/icp-config";
import { useToast } from "@/hooks/use-toast";

function fmt$(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const colors: Record<Priority, string> = {
    must: "bg-emerald-100 text-emerald-800 border-emerald-200",
    major: "bg-blue-100 text-blue-800 border-blue-200",
    nice: "bg-amber-100 text-amber-800 border-amber-200",
    no: "bg-red-100 text-red-800 border-red-200",
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

export default function CompanyResearchCriteria() {
  const { data: global, isLoading } = useGlobalAssumptions();
  const [activeTab, setActiveTab] = useState("company");
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
  const propertyLabel = global.propertyLabel ?? "Boutique Hotel";
  const companyName = global.companyName ?? "Hospitality Business";

  const icpConfig: IcpConfig = {
    ...DEFAULT_ICP_CONFIG,
    ...((global as any).icpConfig && typeof (global as any).icpConfig === "object" ? (global as any).icpConfig : {}),
  };
  const icpDescriptive: IcpDescriptive = {
    ...DEFAULT_ICP_DESCRIPTIVE,
    ...((global as any).icpDescriptive && typeof (global as any).icpDescriptive === "object" ? (global as any).icpDescriptive : {}),
  };
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
  const preferredLlm = researchConfig.preferredLlm || (global as any).preferredLlm || "claude-sonnet-4-5";

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

  const handleExportPDF = async () => {
    try {
      const response = await fetch("/api/premium-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "pdf",
          reportType: "company-research-criteria",
          title: `${companyName} Co. — Research Criteria`,
          data: {
            companyName,
            propertyLabel,
            companyInputs,
            icpConfig,
            icpDescriptive,
            icpQualitative,
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
      a.download = `${companyName.replace(/\s+/g, "-")}-Research-Criteria.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "PDF downloaded successfully." });
    } catch {
      toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
    }
  };

  const handleExportPPTX = async () => {
    try {
      const response = await fetch("/api/premium-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "pptx",
          reportType: "company-research-criteria",
          title: `${companyName} Co. — Research Criteria`,
          data: {
            companyName,
            propertyLabel,
            companyInputs,
            icpConfig,
            icpDescriptive,
            icpQualitative,
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
      a.download = `${companyName.replace(/\s+/g, "-")}-Research-Criteria.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "PowerPoint downloaded successfully." });
    } catch {
      toast({ title: "Export failed", description: "Could not generate PowerPoint.", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <AnimatedPage>
        <div className="space-y-6 max-w-5xl" ref={contentRef}>
          <PageHeader
            title="Research Criteria"
            subtitle={`${companyName} Co. — Management Company Research Parameters`}
            variant="dark"
            backLink="/company/assumptions"
            actions={
              <ExportMenu actions={[pdfAction(handleExportPDF), pptxAction(handleExportPPTX)]} />
            }
          />

          <Card className="bg-primary/5 border-primary/20 p-4" data-testid="criteria-advisory-notice">
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
              <TabsTrigger value="company" data-testid="tab-company-context">
                <IconBuilding className="w-3.5 h-3.5 mr-1.5" />
                Company
              </TabsTrigger>
              <TabsTrigger value="icp" data-testid="tab-icp-profile">
                <IconTarget className="w-3.5 h-3.5 mr-1.5" />
                ICP Profile
              </TabsTrigger>
              <TabsTrigger value="config" data-testid="tab-research-config">
                <IconSettings className="w-3.5 h-3.5 mr-1.5" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="sources" data-testid="tab-sources">
                <IconGlobe className="w-3.5 h-3.5 mr-1.5" />
                Sources & Model
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="icp" className="space-y-4">
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

            <TabsContent value="config" className="space-y-4">
              <Card className="border border-border rounded-lg p-5 space-y-4">
                <SectionHeading icon={IconSettings} title="Admin Research Configuration" />
                <p className="text-xs text-muted-foreground">
                  These settings are managed by your administrator in the Research Center and 
                  shape how the AI conducts its company-level analysis.
                </p>

                {regions.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="label-text text-muted-foreground font-medium text-[11px] uppercase tracking-wide">Geographic Scope</p>
                    <div className="flex flex-wrap gap-1.5">
                      {regions.map((r) => (
                        <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {timeHorizon && (
                  <div className="space-y-1.5">
                    <p className="label-text text-muted-foreground font-medium text-[11px] uppercase tracking-wide">Investment Horizon</p>
                    <p className="text-sm text-foreground">{timeHorizon}</p>
                  </div>
                )}

                {enabledTools.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="label-text text-muted-foreground font-medium text-[11px] uppercase tracking-wide">Enabled Research Tools</p>
                    <div className="flex flex-wrap gap-1.5">
                      {enabledTools.map((tool) => (
                        <Badge key={tool} variant="secondary" className="text-xs">{tool}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {customInstructions && (
                  <div className="space-y-1.5">
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

            <TabsContent value="sources" className="space-y-4">
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

              <Card className="border border-border rounded-lg p-5 space-y-3">
                <SectionHeading icon={IconCpu} title="AI Model" />
                <DataCard label="Preferred Model" value={preferredLlm} />
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="bg-muted/30 border-border p-4" data-testid="criteria-readonly-notice">
            <div className="flex gap-3">
              <IconAlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                These criteria are read-only. To change the ICP profile, visit the ICP Studio 
                in the Admin panel. To adjust the research configuration, update the settings 
                in the Research Center.
              </p>
            </div>
          </Card>
        </div>
      </AnimatedPage>
    </Layout>
  );
}
