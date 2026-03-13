import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { IconFlaskConical, IconDownload, IconRefreshCw } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useGlobalAssumptions } from "@/lib/api";

interface ResearchSection {
  title: string;
  locationKey?: string;
  content: string;
}

interface IcpResearchReport {
  generatedAt: string;
  model: string;
  sections: ResearchSection[];
  extractedMetrics: Record<string, any>;
}

export default function IcpResearchTab() {
  const { data: ga, refetch } = useGlobalAssumptions();
  const { toast } = useToast();

  const [report, setReport] = useState<IcpResearchReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx">("pdf");
  const [exportOrientation, setExportOrientation] = useState<"portrait" | "landscape">("portrait");
  const [isExporting, setIsExporting] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ga?.icpConfig) {
      const cfg = ga.icpConfig as Record<string, any>;
      if (cfg._research) setReport(cfg._research as IcpResearchReport);
    }
  }, [ga?.icpConfig]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setStreamContent("");
    setReport(null);

    try {
      const res = await fetch("/api/research/icp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start research generation");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "content") {
              setStreamContent((prev) => prev + event.data);
              if (streamRef.current) {
                streamRef.current.scrollTop = streamRef.current.scrollHeight;
              }
            } else if (event.type === "done" && event.report) {
              setReport(event.report);
              await refetch();
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch {}
        }
      }

      toast({ title: "Research Complete", description: "ICP market research report has been generated and saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate research", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [refetch, toast]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/research/icp/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ format: exportFormat, orientation: exportOrientation }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `icp-research-report.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: `Report exported as ${exportFormat.toUpperCase()}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const formatMetricValue = (val: any) => {
    if (!val || typeof val !== "object" || !("value" in val)) return null;
    const v = val.value;
    const u = val.unit || "";
    if (u === "USD") return `$${Number(v).toLocaleString()}`;
    if (u === "%") return `${v}%`;
    return `${v} ${u}`.trim();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <IconFlaskConical className="w-4 h-4 text-muted-foreground" />
                ICP Market Research
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                AI-powered market research based on all ICP parameters — locations, property profile, asset description, and ICP definition.
              </p>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="text-xs h-8 gap-1.5"
              data-testid="button-generate-research"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <IconRefreshCw className="w-3.5 h-3.5" />
              )}
              {isGenerating ? "Generating..." : report ? "Regenerate" : "Generate Research"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing markets and generating report...</span>
              </div>
              <div
                ref={streamRef}
                className="max-h-[500px] overflow-y-auto bg-muted/40 border border-border rounded-lg p-4 font-mono text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap"
                data-testid="stream-content"
              >
                {streamContent || "Waiting for response..."}
              </div>
            </div>
          )}

          {!isGenerating && !report && (
            <div className="text-center py-12">
              <IconFlaskConical className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground" data-testid="text-no-research">No research report generated yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click <strong>Generate Research</strong> to produce a comprehensive market analysis based on your ICP configuration.
              </p>
            </div>
          )}

          {!isGenerating && report && (
            <div className="space-y-6" data-testid="research-report">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-muted-foreground">
                  Generated {new Date(report.generatedAt).toLocaleString()} using {report.model}
                </p>
                <div className="flex items-center gap-2">
                  <Select value={exportFormat} onValueChange={(v: "pdf" | "docx") => setExportFormat(v)}>
                    <SelectTrigger className="h-8 w-24 text-xs bg-card" data-testid="select-export-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={exportOrientation} onValueChange={(v: "portrait" | "landscape") => setExportOrientation(v)}>
                    <SelectTrigger className="h-8 w-28 text-xs bg-card" data-testid="select-export-orientation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="text-xs h-8 gap-1.5"
                    data-testid="button-export-research"
                  >
                    {isExporting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <IconDownload className="w-3.5 h-3.5" />
                    )}
                    Export
                  </Button>
                </div>
              </div>

              {report.sections.map((section, idx) => (
                <div key={idx} className="space-y-2" data-testid={`section-${idx}`}>
                  <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-1">
                    {section.title}
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {section.content.split("\n\n").filter(Boolean).map((para, pi) => (
                      <p key={pi} className="text-xs leading-relaxed text-foreground/85 mb-2 last:mb-0">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              {report.extractedMetrics && Object.keys(report.extractedMetrics).length > 0 && (
                <div className="space-y-3" data-testid="extracted-metrics">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-1">
                    Key Extracted Metrics
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(report.extractedMetrics)
                      .filter(([k]) => k !== "locationMetrics")
                      .map(([key, val]) => {
                        const formatted = formatMetricValue(val);
                        if (!formatted) return null;
                        return (
                          <div key={key} className="bg-muted/40 rounded-lg p-3 border border-border/40" data-testid={`metric-${key}`}>
                            <p className="text-lg font-bold text-foreground">{formatted}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{val.description || key}</p>
                          </div>
                        );
                      })}
                  </div>

                  {report.extractedMetrics.locationMetrics &&
                    Array.isArray(report.extractedMetrics.locationMetrics) && (
                      <div className="space-y-3">
                        {report.extractedMetrics.locationMetrics.map((loc: any, li: number) => (
                          <div key={li} className="bg-muted/30 rounded-lg p-3 border border-border/40" data-testid={`location-metric-${li}`}>
                            <h4 className="text-xs font-semibold text-foreground mb-2">{loc.location}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                ["ADR", loc.avgAdr],
                                ["Occupancy", loc.avgOccupancy],
                                ["RevPAR", loc.avgRevPAR],
                                ["Cap Rate", loc.capRate],
                                ["Land/Acre", loc.avgLandCostPerAcre],
                                ["Demand Growth", loc.demandGrowthRate],
                              ].map(([label, metric]) => {
                                const formatted = formatMetricValue(metric);
                                if (!formatted) return null;
                                return (
                                  <div key={label as string} className="text-center">
                                    <p className="text-sm font-bold text-foreground">{formatted}</p>
                                    <p className="text-[10px] text-muted-foreground">{label as string}</p>
                                  </div>
                                );
                              })}
                              {loc.competitiveIntensity && (
                                <div className="text-center">
                                  <p className="text-sm font-bold text-foreground capitalize">{loc.competitiveIntensity}</p>
                                  <p className="text-[10px] text-muted-foreground">Competition</p>
                                </div>
                              )}
                              {loc.investmentRating && (
                                <div className="text-center">
                                  <p className="text-sm font-bold text-foreground">{loc.investmentRating}</p>
                                  <p className="text-[10px] text-muted-foreground">Rating</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
