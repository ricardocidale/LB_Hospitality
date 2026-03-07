import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMarketResearch } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { ExportToolbar } from "@/components/ui/export-toolbar";
import { Loader2, RefreshCw, BookOpen, ArrowLeft, AlertTriangle, Mail, FileDown, DollarSign, Package, Building2, Target, Users, FileText } from "lucide-react";
import { useLocation } from "wouter";
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
  { value: "fees", label: "Management Fees", icon: DollarSign },
  { value: "services", label: "Service Revenue", icon: Package },
  { value: "vendor", label: "Vendor Costs", icon: Package },
  { value: "overhead", label: "Overhead", icon: Building2 },
  { value: "competitive", label: "Competitive", icon: Target },
  { value: "partner-comp", label: "Partner Comp", icon: Users },
  { value: "full-research", label: "Full Research", icon: FileText },
];

export default function CompanyResearch() {
  const { data: research, isLoading, isError } = useMarketResearch("company");
  const [, setLocation] = useLocation();
  const [isEmailing, setIsEmailing] = useState(false);
  const { toast } = useToast();
  const { isGenerating, streamedContent, generateResearch } = useCompanyResearchStream();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load company research. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  const content = research?.content as any;
  const hasResearch = content && !content.rawResponse;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Management Company Research"
          subtitle="Fee structures, service pricing, overhead benchmarks, and competitive analysis"
          variant="light"
          backLink="/company/assumptions"
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/company/assumptions")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={generateResearch}
                disabled={isGenerating}
                data-testid="button-update-research"
                variant={isGenerating ? "destructive" : "default"}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isGenerating ? "Analyzing..." : "Update AI Research"}
              </Button>
            </div>
          }
        />

        {research?.updatedAt && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400" data-testid="text-last-updated">
              Last updated: {format(new Date(research.updatedAt), "MMM d, yyyy h:mm a")}
              {research.llmModel && ` · Model: ${research.llmModel}`}
            </span>
            {hasResearch && !isGenerating && (
              <ExportToolbar
                variant="light"
                actions={[
                  {
                    label: "Download PDF",
                    icon: <FileDown className="w-3.5 h-3.5" />,
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
                    icon: <Mail className="w-3.5 h-3.5" />,
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
          <div className="bg-white rounded-lg shadow-sm border border-emerald-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              </div>
              <p className="text-gray-600 text-sm font-medium">Researching management company standards and benchmarks...</p>
            </div>
            {streamedContent && (
              <pre className="text-xs text-gray-500 whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 border border-gray-200">
                {streamedContent.slice(0, 500)}...
              </pre>
            )}
          </div>
        )}

        {!isGenerating && (
          <Tabs defaultValue="fees" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-white border border-gray-200 rounded-lg p-1.5">
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
    </Layout>
  );
}

function EmptyTabState({ title, description, onGenerate }: { title: string; description: string; onGenerate: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-display text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      <button
        onClick={onGenerate}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Generate Research
      </button>
    </div>
  );
}
