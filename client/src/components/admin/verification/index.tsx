import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, PlayCircle, Sparkles, FileDown, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/financialEngine";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useVerificationHistory, useRunVerification, useRunDesignCheck } from "./hooks";
import { VerificationResults } from "./VerificationResults";
import { VerificationHistory } from "./VerificationHistory";
import { AIReviewPanel } from "./AIReviewPanel";
import { DesignCheckPanel } from "./DesignCheckPanel";
import type { VerificationResult, DesignCheckResult } from "./types";

export default function VerificationTab() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"results" | "history" | "ai" | "design">("results");
  const [verificationResults, setVerificationResults] = useState<VerificationResult | null>(null);
  const [designResults, setDesignResults] = useState<DesignCheckResult | null>(null);
  const [aiReview, setAiReview] = useState<string>("");
  const [aiReviewLoading, setAiReviewLoading] = useState(false);

  const { data: verificationHistory } = useVerificationHistory();

  const runVerification = useRunVerification((data) => {
    setVerificationResults(data);
    setAiReview("");
  });

  const runDesignCheck = useRunDesignCheck((data) => {
    setDesignResults(data);
  });

  const verificationAutoRan = useRef(false);
  useEffect(() => {
    if (!verificationAutoRan.current) {
      verificationAutoRan.current = true;
      runVerification.mutate();
    }
  }, []);

  const runAiVerification = async () => {
    setAiReviewLoading(true);
    setAiReview("");
    try {
      const res = await fetch("/api/verification/ai-review", { method: "POST", credentials: "include" });
      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json") && !ct.includes("text/event-stream")) {
          throw new Error(`AI verification: server returned ${res.status} (non-JSON)`);
        }
        throw new Error("AI verification failed");
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.content) {
                setAiReview(prev => prev + parsed.content);
              }
            } catch { /* incomplete SSE chunk */ }
          }
        }
      }
    } catch (error: any) {
      toast({ title: "AI Review Failed", description: error.message, variant: "destructive" });
    } finally {
      setAiReviewLoading(false);
    }
  };

  const exportVerificationPDF = () => {
    if (!verificationResults) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Independent Financial Verification Report", pageWidth / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Hospitality Business Company | ${new Date(verificationResults.timestamp).toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });
    y += 12;

    const opinion = verificationResults.summary.auditOpinion;
    const status = verificationResults.summary.overallStatus;
    doc.setFillColor(opinion === "UNQUALIFIED" ? 34 : opinion === "QUALIFIED" ? 200 : 220,
                     opinion === "UNQUALIFIED" ? 125 : opinion === "QUALIFIED" ? 180 : 50,
                     opinion === "UNQUALIFIED" ? 65 : opinion === "QUALIFIED" ? 30 : 50);
    doc.rect(14, y, pageWidth - 28, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Audit Opinion: ${opinion} | Overall Status: ${status}`, pageWidth / 2, y + 8, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 18;

    const s = verificationResults.summary;
    autoTable(doc, {
      startY: y,
      head: [["Total Checks", "Passed", "Failed", "Critical Issues", "Material Issues"]],
      body: [[s.totalChecks, s.totalPassed, s.totalFailed, s.criticalIssues, s.materialIssues]],
      theme: "grid",
      headStyles: { fillColor: [45, 74, 94], fontSize: 9 },
      bodyStyles: { halign: "center", fontSize: 10, fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    if (verificationResults.clientKnownValueTests) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Known-Value Test Cases", 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const testLines = verificationResults.clientKnownValueTests.results.split("\n");
      for (const line of testLines) {
        if (y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 20; }
        doc.text(line, 14, y);
        y += 3.5;
      }
      y += 5;
    }

    for (const propResult of verificationResults.propertyResults) {
      if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${propResult.propertyName} (${propResult.propertyType})`, 14, y);
      y += 2;

      const rows = propResult.checks.map(c => [
        c.passed ? "PASS" : "FAIL",
        c.severity.toUpperCase(),
        c.gaapRef,
        c.metric,
        c.formula.length > 50 ? c.formula.slice(0, 50) + "..." : c.formula,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Status", "Severity", "GAAP Ref", "Metric", "Formula"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [45, 74, 94], fontSize: 7 },
        bodyStyles: { fontSize: 6.5 },
        columnStyles: {
          0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 18 },
          2: { cellWidth: 22 },
          3: { cellWidth: 45 },
        },
        didParseCell: (data: any) => {
          if (data.column.index === 0 && data.cell.raw === "PASS") {
            data.cell.styles.textColor = [34, 125, 65];
          } else if (data.column.index === 0 && data.cell.raw === "FAIL") {
            data.cell.styles.textColor = [220, 50, 50];
          }
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    if (verificationResults.companyChecks.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Management Company Checks", 14, y);
      y += 2;
      const rows = verificationResults.companyChecks.map(c => [
        c.passed ? "PASS" : "FAIL", c.severity.toUpperCase(), c.gaapRef, c.metric, c.formula.length > 50 ? c.formula.slice(0, 50) + "..." : c.formula
      ]);
      autoTable(doc, {
        startY: y, head: [["Status", "Severity", "GAAP Ref", "Metric", "Formula"]], body: rows, theme: "striped",
        headStyles: { fillColor: [45, 74, 94], fontSize: 7 }, bodyStyles: { fontSize: 6.5 },
        columnStyles: { 0: { cellWidth: 14, halign: "center", fontStyle: "bold" }, 1: { cellWidth: 18 }, 2: { cellWidth: 22 }, 3: { cellWidth: 45 } },
        didParseCell: (data: any) => {
          if (data.column.index === 0 && data.cell.raw === "PASS") data.cell.styles.textColor = [34, 125, 65];
          else if (data.column.index === 0 && data.cell.raw === "FAIL") data.cell.styles.textColor = [220, 50, 50];
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    if (verificationResults.consolidatedChecks.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Consolidated Portfolio Checks", 14, y);
      y += 2;
      const rows = verificationResults.consolidatedChecks.map(c => [
        c.passed ? "PASS" : "FAIL", c.severity.toUpperCase(), c.gaapRef, c.metric, c.formula.length > 50 ? c.formula.slice(0, 50) + "..." : c.formula
      ]);
      autoTable(doc, {
        startY: y, head: [["Status", "Severity", "GAAP Ref", "Metric", "Formula"]], body: rows, theme: "striped",
        headStyles: { fillColor: [45, 74, 94], fontSize: 7 }, bodyStyles: { fontSize: 6.5 },
        columnStyles: { 0: { cellWidth: 14, halign: "center", fontStyle: "bold" }, 1: { cellWidth: 18 }, 2: { cellWidth: 22 }, 3: { cellWidth: 45 } },
        didParseCell: (data: any) => {
          if (data.column.index === 0 && data.cell.raw === "PASS") data.cell.styles.textColor = [34, 125, 65];
          else if (data.column.index === 0 && data.cell.raw === "FAIL") data.cell.styles.textColor = [220, 50, 50];
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    if (verificationResults.clientAuditReports && verificationResults.clientAuditReports.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Client-Side GAAP Audit Summary", 14, y);
      y += 5;
      const rows = verificationResults.clientAuditReports.flatMap(report =>
        report.sections.map(sec => [
          report.propertyName,
          sec.name,
          `${sec.passed}/${sec.passed + sec.failed}`,
          sec.failed === 0 ? "PASS" : sec.materialIssues > 0 ? "FAIL" : "WARNING",
        ])
      );
      autoTable(doc, {
        startY: y, head: [["Property", "Audit Section", "Checks", "Status"]], body: rows, theme: "striped",
        headStyles: { fillColor: [45, 74, 94], fontSize: 8 }, bodyStyles: { fontSize: 7 },
        didParseCell: (data: any) => {
          if (data.column.index === 3 && data.cell.raw === "PASS") data.cell.styles.textColor = [34, 125, 65];
          else if (data.column.index === 3 && data.cell.raw === "FAIL") data.cell.styles.textColor = [220, 50, 50];
          else if (data.column.index === 3 && data.cell.raw === "WARNING") data.cell.styles.textColor = [200, 150, 0];
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`Hospitality Business - Verification Report | Page ${p} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
    }

    doc.save(`verification-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-secondary/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>
      
      <CardHeader className="relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-secondary to-gray-800 uppercase">
              GAAP Financial Verification
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium max-w-2xl">
              Independent audit and recalculation of property pro-formas, management fees, and consolidated portfolio returns.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {verificationResults && (
              <button 
                onClick={exportVerificationPDF}
                data-testid="button-export-pdf"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-bold shadow-sm hover:shadow-md hover:border-secondary/20 transition-all group"
              >
                <FileDown className="w-3.5 h-3.5 text-secondary group-hover:scale-110 transition-transform" />
                EXPORT PDF REPORT
              </button>
            )}
            <button 
              onClick={() => runVerification.mutate()} 
              disabled={runVerification.isPending} 
              data-testid="button-run-verification"
              className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-full text-xs font-bold shadow-xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 group"
            >
              {runVerification.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />}
              RUN FULL AUDIT
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-6 p-1 bg-gray-50 rounded-full w-fit border border-gray-100">
          {[
            { id: "results", label: "Verification Results", icon: CheckCircle2 },
            { id: "history", label: "Audit History", icon: Download },
            { id: "ai", label: "AI Narrative", icon: Sparkles },
            { id: "design", label: "Design Coverage", icon: AlertTriangle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === "design" && !designResults) runDesignCheck.mutate();
              }}
              data-testid={`tab-verification-${tab.id}`}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                activeTab === tab.id 
                  ? "bg-white text-secondary shadow-sm" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? "text-secondary" : "text-gray-400"}`} />
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="relative pt-2">
        {runVerification.isPending ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-secondary animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-bold text-gray-900 animate-pulse">Running Financial Audit...</p>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">Performing multi-entity recalculations and GAAP compliance checks across the entire portfolio.</p>
            </div>
          </div>
        ) : (
          <div className="min-h-[400px]">
            {activeTab === "results" && (
              verificationResults ? (
                <div className="space-y-8">
                  {/* Summary Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-100 shadow-inner">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Audit Opinion</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xl font-black ${
                          verificationResults.summary.auditOpinion === 'UNQUALIFIED' ? 'text-secondary' :
                          verificationResults.summary.auditOpinion === 'QUALIFIED' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {verificationResults.summary.auditOpinion}
                        </span>
                        {verificationResults.summary.auditOpinion === 'UNQUALIFIED' ? <CheckCircle2 className="w-5 h-5 text-secondary" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Overall Status</p>
                      <p className={`text-xl font-mono font-black ${
                        verificationResults.summary.overallStatus === 'PASS' ? 'text-secondary' : 'text-red-600'
                      }`}>
                        {verificationResults.summary.overallStatus}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Checks</p>
                      <p className="text-xl font-mono font-black text-gray-900">{verificationResults.summary.totalChecks}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Failures</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-xl font-mono font-black ${verificationResults.summary.totalFailed > 0 ? 'text-red-600' : 'text-secondary'}`}>
                          {verificationResults.summary.totalFailed}
                        </p>
                        {verificationResults.summary.criticalIssues > 0 && (
                          <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
                            {verificationResults.summary.criticalIssues} CRITICAL
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <VerificationResults results={verificationResults} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
                  <PlayCircle className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">Click "Run Full Audit" to start the verification process.</p>
                </div>
              )
            )}

            {activeTab === "history" && verificationHistory && (
              <VerificationHistory history={verificationHistory} />
            )}

            {activeTab === "ai" && (
              <AIReviewPanel 
                review={aiReview} 
                loading={aiReviewLoading} 
                onRun={runAiVerification} 
              />
            )}

            {activeTab === "design" && designResults && (
              <DesignCheckPanel results={designResults} />
            )}
            
            {activeTab === "design" && runDesignCheck.isPending && (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                <p className="text-sm font-medium animate-pulse">Running design coverage analysis...</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
