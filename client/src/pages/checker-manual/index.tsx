import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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
                  <Button 
                    data-testid="btn-export-pdf" 
                    onClick={handleExportPDF} 
                    disabled={exportingManual}
                    variant="default"
                  >
                    {exportingManual ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                    Export Manual PDF
                  </Button>
                  <Button 
                    data-testid="btn-full-export" 
                    onClick={handleFullExport} 
                    disabled={exportingData}
                    variant="outline"
                  >
                    {exportingData ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                    Full Data Export
                  </Button>
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
