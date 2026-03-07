import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { GlassButton } from "@/components/ui/glass-button";
import { Loader2, FileDown, Database } from "lucide-react";
import { Callout } from "@/components/ui/callout";
import { SECTIONS } from "./constants";
import { TableOfContents } from "./TableOfContents";
import { ManualContent } from "./ManualContent";
import { useManualExports } from "./useManualExports";
import { CheckerManualProps } from "./types";

export default function CheckerManual({ embedded }: CheckerManualProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const {
    exportingManual,
    exportingData,
    handleExportPDF,
    handleFullExport,
    logActivity
  } = useManualExports(SECTIONS);

  useEffect(() => {
    logActivity("view");
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setExpandedSections((prev) => new Set(prev).add(id));
    }
  };

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Layout;

  return (
    <Wrapper>
      <div>
        <div className={embedded ? "space-y-6" : "p-4 md:p-6 space-y-6"}>
          {!embedded && (
            <PageHeader
              title="Checker Manual"
              subtitle="Hospitality Business Group — Verification & Testing Guide"
              actions={
                <div className="flex gap-2">
                  <button 
                    data-testid="btn-export-pdf" 
                    onClick={handleExportPDF} 
                    disabled={exportingManual}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    {exportingManual ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                    Export Manual PDF
                  </button>
                  <button 
                    data-testid="btn-full-export" 
                    onClick={handleFullExport} 
                    disabled={exportingData}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    {exportingData ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                    Full Data Export
                  </button>
                </div>
              }
            />
          )}

          <Callout>
            Always export to Excel and CSV before verifying calculations — this gives you raw numbers to cross-check against formulas.
          </Callout>

          <div className="flex gap-6">
            <TableOfContents sections={SECTIONS} scrollToSection={scrollToSection} />
            <ManualContent
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              sectionRefs={sectionRefs}
            />
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
