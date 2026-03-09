;

import { IconAlertTriangle, IconBookOpen, IconBuilding, IconDollarSign, IconFileDown, IconFileText, IconLoader, IconMail, IconPackage, IconPeople, IconRefresh, IconTarget, TabsContent } from "@/components/icons/brand-icons";
import { format } from "date-fns";
import { downloadResearchPDF, emailResearchPDF } from "@/lib/exports/researchPdfExport";
import { useToast } from "@/hooks/use-toast";
import {
  CompanyResearchSections,
  useCompanyResearchStream,
  ServiceRevenueTab,
  VendorCostsTab,
  OverheadBenchmarksTab,
  CompetitiveLandscapeTab,
  PartnerCompTab,
} from "@/components/company-research";

const TABS = [
  { value: "fees", label: "Management Fees", icon: IconDollarSign },
  { value: "services", label: "Service Revenue", icon: IconPackage },
  { value: "vendor", label: "Vendor Costs", icon: IconPackage },
  { value: "overhead", label: "Overhead", icon: IconBuilding },
  { value: "competitive", label: "Competitive", icon: IconTarget },
  { value: "partner-comp", label: "Partner Comp", icon: IconPeople },
  { value: "full-research", label: "Full Research", icon: IconFileText },
];

export default function CompanyResearch() {
  const { data: research, isLoading, isError } = useMarketResearch("company");

  const [isEmailing, setIsEmailing] = useState(false);
  const { toast } = useToast();
  const { isGenerating, streamedContent, generateResearch } = useCompanyResearchStream();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <IconLoader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <IconAlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load company research. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  const content = research?.content as any;
  const hasResearch = content && !content.rawResponse;

  return (
    <Layout>
      <AnimatedPage>
      <div className="space-y-6">
        <PageHeader
          title="Management Company Research"
          subtitle="Fee structures, service pricing, overhead benchmarks, and competitive analysis"
          variant="light"
          backLink="/company/assumptions"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9 text-xs font-medium hover:scale-[1.03] active:scale-[0.97] transition-transform"
                onClick={generateResearch}
                disabled={isGenerating}
                data-testid="button-update-research"
              >
                {isGenerating ? <IconLoader className="w-4 h-4 animate-spin" /> : <IconRefresh className="w-4 h-4" />}
                {isGenerating ? "Analyzing..." : "Update AI Research"}
              </Button>
            </div>
          }
        />

        {research?.updatedAt && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground" data-testid="text-last-updated">
              Last updated: {format(new Date(research.updatedAt), "MMM d, yyyy h:mm a")}
              {research.llmModel && ` · Model: ${research.llmModel}`}
            </span>
            {hasResearch && !isGenerating && (
              <ExportToolbar
                variant="light"
                actions={[
                  {
                    label: "Download PDF",
                    icon: <IconFileDown className="w-3.5 h-3.5" />,
                    onClick: () => downloadResearchPDF({
                      type: "company",
                      title: "Management Company Research",
                      subtitle: "Fee structures, service pricing, overhead benchmarks",
                      content,
                      updatedAt: research?.updatedAt,
                      llmModel: research?.llmModel || undefined,
                      promptConditions: (research as any)?.promptConditions || undefined,
                    }),
                    testId: "button-export-research-pdf",
                  },
                  {
                    label: isEmailing ? "Sending..." : "Email PDF",
                    icon: <IconMail className="w-3.5 h-3.5" />,
                    onClick: async () => {
                      if (isEmailing) return;
                      setIsEmailing(true);
                      try {
                        const result = await emailResearchPDF({
                          type: "company",
                          title: "Management Company Research",
                          subtitle: "Fee structures, service pricing, overhead benchmarks",
                          content,
                          updatedAt: research?.updatedAt,
                          llmModel: research?.llmModel || undefined,
                          promptConditions: (research as any)?.promptConditions || undefined,
                        });
                        if (result.success) {
                          toast({ title: "Email sent", description: "Research PDF has been emailed to you." });
                        } else {
                          toast({ title: "Email failed", description: result.error || "Could not send email.", variant: "destructive" });
                        }
                      } catch {
                        toast({ title: "Email failed", description: "Could not send email.", variant: "destructive" });
                      } finally {
                        setIsEmailing(false);
                      }
                    },
                    testId: "button-email-research-pdf",
                  },
                ]}
              />
            )}
          </div>
        )}

        {isGenerating && (
          <div className="bg-card rounded-lg shadow-sm border border-emerald-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <IconLoader className="w-4 h-4 animate-spin text-emerald-700" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Researching management company standards and benchmarks...</p>
            </div>
            {streamedContent && (
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto bg-muted rounded-lg p-3 border border-border">
                {streamedContent.slice(0, 500)}...
              </pre>
            )}
          </div>
        )}

        {!isGenerating && (
          <Tabs defaultValue="fees" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-card border border-border rounded-lg p-1.5">
              {TABS.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-3 py-1.5">
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="fees" className="mt-4">
              {hasResearch && content.managementFees ? (
                <CompanyResearchSections content={{ managementFees: content.managementFees }} />
              ) : (
                <EmptyTabState
                  title="Management Fee Benchmarks"
                  description="Generate AI research to see base and incentive management fee benchmarks, GAAP references, and industry sources."
                  onGenerate={generateResearch}
                />
              )}
            </TabsContent>

            <TabsContent value="services" className="mt-4">
              <ServiceRevenueTab content={content} />
            </TabsContent>

            <TabsContent value="vendor" className="mt-4">
              <VendorCostsTab content={content} />
            </TabsContent>

            <TabsContent value="overhead" className="mt-4">
              <OverheadBenchmarksTab content={content} />
            </TabsContent>

            <TabsContent value="competitive" className="mt-4">
              <CompetitiveLandscapeTab content={content} />
            </TabsContent>

            <TabsContent value="partner-comp" className="mt-4">
              <PartnerCompTab content={content} />
            </TabsContent>

            <TabsContent value="full-research" className="mt-4">
              {hasResearch ? (
                <CompanyResearchSections content={content} />
              ) : (
                <EmptyTabState
                  title="Full AI Research"
                  description="Generate comprehensive AI-powered analysis covering fee structures, GAAP standards, USALI benchmarks, compensation norms, and contract terms."
                  onGenerate={generateResearch}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      </AnimatedPage>
    </Layout>
  );
}

function EmptyTabState({ title, description, onGenerate }: { title: string; description: string; onGenerate: () => void }) {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
        <IconBookOpen className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-display text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      <Button
        onClick={onGenerate}
        variant="default"
        className="gap-2 shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-transform"
      >
        <IconRefresh className="w-4 h-4" />
        Generate Research
      </Button>
    </div>
  );
}
