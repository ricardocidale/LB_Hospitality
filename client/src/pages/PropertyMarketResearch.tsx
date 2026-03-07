import { useState } from "react";
import Layout from "@/components/Layout";
import { useProperty, useMarketResearch, useGlobalAssumptions } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ExportToolbar } from "@/components/ui/export-toolbar";
import { Loader2, RefreshCw, MapPin, ExternalLink, BookOpen, ArrowLeft, Mail, FileDown } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { downloadResearchPDF, emailResearchPDF } from "@/lib/exports/researchPdfExport";
import { useToast } from "@/hooks/use-toast";
import { useResearchStream } from "@/components/property-research/useResearchStream";
import { ResearchSections } from "@/components/property-research/ResearchSections";

export default function PropertyMarketResearch() {
  const [, params] = useRoute("/property/:id/research");
  const propertyId = parseInt(params?.id || "0");
  const { data: property, isLoading: propertyLoading } = useProperty(propertyId);
  const { data: global } = useGlobalAssumptions();
  const { data: research, isLoading: researchLoading } = useMarketResearch("property", propertyId);
  const [, setLocation] = useLocation();
  const [isEmailing, setIsEmailing] = useState(false);
  const { toast } = useToast();

  const { isGenerating, streamedContent, generateResearch } = useResearchStream({
    property,
    propertyId,
    global,
  });

  if (propertyLoading || researchLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="text-center py-12 text-white/60">Property not found</div>
      </Layout>
    );
  }

  const content = research?.content as any;
  const hasResearch = content && !content.rawResponse;
  const adrValue = property.startAdr ? Math.round(property.startAdr) : null;
  const propertyLabel = global?.propertyLabel || "boutique hotel";
  const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${propertyLabel.toLowerCase()}s near ${property.location}${adrValue ? ` $${adrValue} ADR` : ""}`)}`;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title={`Market Research: ${property.name}`}
          subtitle={`${property.location} · ${property.market} · ${property.roomCount} rooms${adrValue ? ` · $${adrValue} ADR` : ""}`}
          variant="dark"
          backLink={`/property/${property.id}/edit`}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setLocation(`/property/${property.id}/edit`)}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-google-maps"
              >
                <Button variant="default">
                  <MapPin className="w-4 h-4" />
                  Google Maps
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
              <Button
                variant="default"
                onClick={generateResearch}
                disabled={isGenerating}
                data-testid="button-update-research"
                style={isGenerating ? { background: 'linear-gradient(135deg, #F4795B 0%, #e0694e 50%, #d45a40 100%)', opacity: 1 } : undefined}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isGenerating ? "Analyzing..." : "Update Research"}
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
                variant="glass"
                actions={[
                  {
                    label: "Download PDF",
                    icon: <FileDown className="w-3.5 h-3.5" />,
                    onClick: () => downloadResearchPDF({
                      type: "property",
                      title: `Market Research: ${property.name}`,
                      subtitle: `${property.location} · ${property.market} · ${property.roomCount} rooms`,
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
                          type: "property",
                          title: `Market Research: ${property.name}`,
                          subtitle: `${property.location} · ${property.market} · ${property.roomCount} rooms`,
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
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Analyzing market data for {property.name}...</p>
            </div>
            {streamedContent && (
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto bg-muted rounded-lg p-3 border border-border">
                {streamedContent.slice(0, 500)}...
              </pre>
            )}
          </div>
        )}

        {!hasResearch && !isGenerating && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-display text-foreground mb-3">No Market Research Yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
              Generate AI-powered market analysis for <strong>{property.name}</strong>. The research covers ADR benchmarks, occupancy patterns, competitive set, cap rates, operating costs, event demand, and more — all tailored to <strong>{property.location}</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-8 text-left">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-800 mb-1">Market Data</p>
                <p className="text-xs text-emerald-700">ADR, occupancy, RevPAR, and comp set analysis</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                <p className="text-xs font-semibold text-blue-800 mb-1">Cost Benchmarks</p>
                <p className="text-xs text-blue-700">Operating costs, insurance, taxes, and USALI rates</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-1">Assumption Guidance</p>
                <p className="text-xs text-amber-700">Research values appear as clickable badges on the edit page</p>
              </div>
            </div>
            <button
              onClick={generateResearch}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Research
            </button>
          </div>
        )}

        {hasResearch && !isGenerating && <ResearchSections content={content} />}
      </div>
    </Layout>
  );
}
