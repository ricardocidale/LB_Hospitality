import { useState } from "react";
import Layout from "@/components/Layout";
import { useProperty, useMarketResearch, useGlobalAssumptions } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { GlassButton } from "@/components/ui/glass-button";
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
              <GlassButton
                variant="ghost"
                onClick={() => setLocation(`/property/${property.id}/edit`)}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </GlassButton>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-google-maps"
              >
                <GlassButton variant="primary">
                  <MapPin className="w-4 h-4" />
                  Google Maps
                  <ExternalLink className="w-3 h-3" />
                </GlassButton>
              </a>
              <GlassButton
                variant="primary"
                onClick={generateResearch}
                disabled={isGenerating}
                data-testid="button-update-research"
                style={isGenerating ? { background: 'linear-gradient(135deg, #F4795B 0%, #e0694e 50%, #d45a40 100%)', opacity: 1 } : undefined}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isGenerating ? "Analyzing..." : "Update Research"}
              </GlassButton>
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
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              </div>
              <p className="text-gray-600 text-sm font-medium">Analyzing market data for {property.name}...</p>
            </div>
            {streamedContent && (
              <pre className="text-xs text-gray-500 whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 border border-gray-200">
                {streamedContent.slice(0, 500)}...
              </pre>
            )}
          </div>
        )}

        {!hasResearch && !isGenerating && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Research Data Yet</h3>
            <p className="text-sm text-gray-500 mb-6">Click "Update Research" to generate AI-powered market analysis for this property.</p>
          </div>
        )}

        {hasResearch && !isGenerating && <ResearchSections content={content} />}
      </div>
    </Layout>
  );
}
