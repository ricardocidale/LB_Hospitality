import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useMarketResearch } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { ExportToolbar } from "@/components/ui/export-toolbar";
import { Loader2, RefreshCw, BookOpen, ArrowLeft, AlertTriangle, Mail, FileDown } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { downloadResearchPDF, emailResearchPDF } from "@/lib/exports/researchPdfExport";
import { useToast } from "@/hooks/use-toast";
import { CompanyResearchSections } from "@/components/company-research";
import { useCompanyResearchStream } from "@/components/company-research";

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
          subtitle="GAAP standards, fee structures, and industry benchmarks for hotel management"
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
                {isGenerating ? "Analyzing..." : "Update Research"}
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
                      subtitle: "GAAP standards, fee structures, and industry benchmarks",
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
                          subtitle: "GAAP standards, fee structures, and industry benchmarks",
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
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6">
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

        {!hasResearch && !isGenerating && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.1)] border border-primary/20 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-display text-gray-900 mb-3">No Company Research Yet</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-lg mx-auto leading-relaxed">
              Generate AI-powered analysis of hotel management company fee structures, GAAP standards, USALI expense benchmarks, compensation norms, and contract terms.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-8 text-left">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-800 mb-1">Fee Structures</p>
                <p className="text-xs text-emerald-700">Base and incentive management fee benchmarks</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                <p className="text-xs font-semibold text-blue-800 mb-1">GAAP Standards</p>
                <p className="text-xs text-blue-700">ASC 606 revenue recognition and USALI format</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-1">Compensation</p>
                <p className="text-xs text-amber-700">Industry salary, staffing, and overhead benchmarks</p>
              </div>
            </div>
            <button
              onClick={generateResearch}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Research
            </button>
          </div>
        )}

        {hasResearch && !isGenerating && <CompanyResearchSections content={content} />}
      </div>
    </Layout>
  );
}
