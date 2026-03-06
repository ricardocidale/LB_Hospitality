import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ManualSection } from "./types";

export function useManualExports(sections: ManualSection[]) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exportingManual, setExportingManual] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  const logActivity = (action: string, metadata?: Record<string, unknown>) => {
    fetch("/api/activity-logs/manual-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, metadata }),
      credentials: "include",
    }).catch(() => { /* fire-and-forget activity log */ });
  };

  const handleExportPDF = async () => {
    if (exportingManual) return;
    setExportingManual(true);
    logActivity("export-manual-pdf", {
      exportType: "manual-pdf",
      sectionCount: sections.length,
      exportedAt: new Date().toISOString(),
    });
    try {
      const { exportManualPDF } = await import("@/lib/exports/checkerManualExport");
      const result = await exportManualPDF({ email: user?.email, role: user?.role });
      if (result.success) {
        toast({ title: "Manual Exported", description: "PDF has been downloaded." });
      } else {
        toast({ title: "Export Failed", description: result.error || "Could not generate PDF.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Export Failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setExportingManual(false);
    }
  };

  const handleFullExport = async () => {
    if (exportingData) return;
    setExportingData(true);
    try {
      const { exportFullData } = await import("@/lib/exports/checkerManualExport");
      const result = await exportFullData({ email: user?.email, role: user?.role });

      logActivity("full-data-export", {
        exportType: "full-data",
        status: result.status,
        propertyCount: result.propertyCount,
        statementsGenerated: result.includedStatements.length,
        companyIncluded: result.companyIncluded,
        warningCount: result.warnings.length,
        warnings: result.warnings.length > 0 ? result.warnings : undefined,
        projectionYears: result.projectionYears,
        exportedAt: result.exportTimestamp,
      });

      if (!result.success) {
        const msg = result.error || result.warnings.join(". ") || "Export failed";
        toast({ title: result.status === "error" ? "Export Error" : "No Data", description: msg, variant: "destructive" });
      } else if (result.warnings.length > 0) {
        toast({
          title: "Export Complete (with warnings)",
          description: `${result.warnings.length} warning(s) found. Check the Summary page at the end of the PDF.`,
        });
      } else {
        toast({ title: "Full Data Export Complete", description: "PDF with all assumptions, financials, and completeness report has been downloaded." });
      }
    } catch (err) {
      logActivity("full-data-export", { exportType: "full-data", status: "error", exportedAt: new Date().toISOString() });
      toast({ title: "Export Failed", description: "Could not generate full data export.", variant: "destructive" });
    } finally {
      setExportingData(false);
    }
  };

  return {
    exportingManual,
    exportingData,
    handleExportPDF,
    handleFullExport,
    logActivity
  };
}
