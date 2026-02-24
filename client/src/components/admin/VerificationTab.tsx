import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, PlayCircle, Sparkles, FileDown, Download, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/formatters";
import { formatMoney } from "@/lib/financialEngine";
import { runFullVerification, runKnownValueTestsStructured } from "@/lib/runVerification";
import type { VerificationResult, VerificationHistoryEntry, CheckResult } from "./types";
import type { AuditReport } from "@/lib/financialAuditor";
import type { KnownValueTestResult } from "@/lib/runVerification";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function VerificationTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [verificationResults, setVerificationResults] = useState<VerificationResult | null>(null);
  const [designResults, setDesignResults] = useState<import("./types").DesignCheckResult | null>(null);
  const [aiReview, setAiReview] = useState<string>("");
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: verificationHistory } = useQuery<VerificationHistoryEntry[]>({
    queryKey: ["admin", "verification-history"],
    queryFn: async () => {
      const res = await fetch("/api/admin/verification-history?limit=10", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch verification history");
      return res.json();
    },
  });

  const runVerification = useMutation({
    mutationFn: async () => {
      const [propertiesRes, assumptionsRes] = await Promise.all([
        fetch("/api/properties", { credentials: "include" }),
        fetch("/api/global-assumptions", { credentials: "include" })
      ]);
      
      if (!propertiesRes.ok) throw new Error("Failed to fetch properties");
      if (!assumptionsRes.ok) throw new Error("Failed to fetch global assumptions");
      
      const properties = await propertiesRes.json();
      const globalAssumptions = await assumptionsRes.json();
      
      const comprehensiveResults = runFullVerification(properties, globalAssumptions);
      const knownValueTests = runKnownValueTestsStructured();
      
      const serverRes = await fetch("/api/admin/run-verification", { credentials: "include" });
      if (!serverRes.ok) throw new Error("Server verification failed");
      const serverReport: VerificationResult = await serverRes.json();
      
      return {
        ...serverReport,
        clientAuditWorkpaper: comprehensiveResults.auditWorkpaper,
        clientAuditReports: comprehensiveResults.auditReports,
        clientKnownValueTests: knownValueTests,
      };
    },
    onSuccess: (data) => {
      setVerificationResults(data);
      setExpandedCategories(new Set());
      setAiReview("");
      queryClient.invalidateQueries({ queryKey: ["admin", "verification-history"] });
      toast({
        title: data.summary.auditOpinion === "UNQUALIFIED" ? "Audit Complete - Unqualified Opinion" :
               data.summary.auditOpinion === "QUALIFIED" ? "Audit Complete - Qualified Opinion" :
               "Audit Complete - Issues Found",
        description: `${data.summary.totalChecks} checks run. ${data.summary.criticalIssues} critical issues.`,
        variant: data.summary.auditOpinion === "UNQUALIFIED" ? "default" : "destructive"
      });
    },
    onError: (error: Error) => {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    }
  });

  const runAiVerification = async () => {
    setAiReviewLoading(true);
    setAiReview("");
    try {
      const res = await fetch("/api/admin/ai-verification", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("AI verification failed");
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
            } catch {}
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

  const runDesignCheck = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/run-design-check", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to run design check");
      return res.json();
    },
    onSuccess: (data) => {
      setDesignResults(data);
    },
    onError: (error: Error) => {
      toast({ title: "Design Check Failed", description: error.message, variant: "destructive" });
    },
  });

  const verificationAutoRan = useRef(false);
  useEffect(() => {
    if (!verificationResults && !runVerification.isPending && !verificationAutoRan.current) {
      verificationAutoRan.current = true;
      runVerification.mutate();
    }
  }, []);

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-700";
      case "material": return "bg-yellow-100 text-yellow-700";
      case "minor": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const renderCheckRow = (chk: CheckResult, idx: number) => (
    <div key={idx} className="space-y-1">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
        {chk.passed ? <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-800 text-sm font-medium">{chk.metric}</span>
            {!chk.passed && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${severityColor(chk.severity)}`}>{chk.severity.toUpperCase()}</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-secondary font-mono">{chk.gaapRef}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">{chk.formula}</p>
        </div>
        <div className="text-right shrink-0 ml-2">
          <span className={`text-xs px-2 py-1 rounded font-semibold ${chk.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {chk.passed ? 'PASS' : 'FAIL'}
          </span>
        </div>
      </div>
      {!chk.passed && (
        <div className="ml-8 p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div><span className="text-gray-500">Expected:</span> <span className="font-mono font-semibold">{formatMoney(chk.expected)}</span></div>
            <div><span className="text-gray-500">Actual:</span> <span className="font-mono font-semibold">{formatMoney(chk.actual)}</span></div>
            <div><span className="text-gray-500">Variance:</span> <span className="font-mono font-semibold text-red-600">{formatMoney(chk.variance)} ({chk.variancePct.toFixed(2)}%)</span></div>
          </div>
        </div>
      )}
    </div>
  );

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderGroupedChecks = (checks: CheckResult[], sectionPrefix: string) => {
    const grouped = new Map<string, CheckResult[]>();
    for (const chk of checks) {
      const cat = chk.category || "Other";
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(chk);
    }

    return Array.from(grouped.entries()).map(([category, catChecks]) => {
      const passed = catChecks.filter(c => c.passed).length;
      const failed = catChecks.filter(c => !c.passed).length;
      const hasFails = failed > 0;
      const key = `${sectionPrefix}-${category}`;
      const isExpanded = expandedCategories.has(key) || hasFails;

      return (
        <div key={category} className="space-y-1">
          <button
            onClick={() => toggleCategory(key)}
            data-testid={`accordion-category-${sectionPrefix}-${category.replace(/\s+/g, '-').toLowerCase()}`}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
              hasFails
                ? 'bg-red-50 border-red-200 hover:bg-red-100'
                : 'bg-green-50 border-green-200 hover:bg-green-100'
            }`}
          >
            {isExpanded
              ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
              : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
            }
            {hasFails
              ? <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              : <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
            }
            <span className="text-sm font-semibold text-gray-800 flex-1 text-left">{category}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-secondary bg-green-100 px-2 py-0.5 rounded">{passed} passed</span>
              {failed > 0 && (
                <span className="text-xs font-mono text-red-600 bg-red-100 px-2 py-0.5 rounded">{failed} failed</span>
              )}
            </div>
          </button>
          {isExpanded && (
            <div className="ml-4 space-y-1">
              {catChecks.map((chk, cIdx) => renderCheckRow(chk, cIdx))}
            </div>
          )}
        </div>
      );
    });
  };

  return (<>
    <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-secondary/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display text-gray-900">Independent Financial Verification</CardTitle>
            <CardDescription className="label-text text-gray-600">
              Server-side independent recalculation with GAAP variance analysis
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => runVerification.mutate()} 
              disabled={runVerification.isPending} 
              data-testid="button-run-verification"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-secondary bg-secondary/10 text-secondary font-semibold hover:bg-secondary/20 transition-colors disabled:opacity-50"
            >
              {runVerification.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              Run Verification
            </button>
            {verificationResults && (
              <>
                <button
                  onClick={runAiVerification}
                  disabled={aiReviewLoading}
                  data-testid="button-ai-verification"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#F4795B] bg-[#F4795B]/10 text-[#F4795B] font-semibold hover:bg-[#F4795B]/20 transition-colors disabled:opacity-50"
                >
                  {aiReviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  AI Review
                </button>
                <button
                  onClick={exportVerificationPDF}
                  data-testid="button-export-verification-pdf"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-400 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Export PDF
                </button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        {!verificationResults && !runVerification.isPending && (
          verificationHistory?.[0] ? (
            <div className={`p-5 rounded-2xl border-2 ${
              verificationHistory[0].auditOpinion === "UNQUALIFIED" ? "bg-green-50 border-green-200" :
              verificationHistory[0].auditOpinion === "QUALIFIED" ? "bg-yellow-50 border-yellow-200" :
              "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {verificationHistory[0].auditOpinion === "UNQUALIFIED" ?
                    <CheckCircle2 className="w-7 h-7 text-green-600" /> :
                    verificationHistory[0].auditOpinion === "QUALIFIED" ?
                    <AlertTriangle className="w-7 h-7 text-yellow-600" /> :
                    <XCircle className="w-7 h-7 text-red-600" />
                  }
                  <div>
                    <h3 className="font-display text-base font-bold">Last Run: {verificationHistory[0].auditOpinion}</h3>
                    <p className="text-xs text-gray-500">
                      {verificationHistory[0].passed}/{verificationHistory[0].totalChecks} checks passed on {new Date(verificationHistory[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 label-text">Running fresh verification...</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
              <p className="label-text text-gray-500">Starting verification...</p>
            </div>
          )
        )}

        {runVerification.isPending && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
            <p className="label-text text-gray-500">Running independent recalculation...</p>
          </div>
        )}

        {verificationResults && (
          <>
            <div className={`p-5 rounded-2xl border-2 ${
              verificationResults.summary.auditOpinion === "UNQUALIFIED" ? "bg-green-50 border-green-300" :
              verificationResults.summary.auditOpinion === "QUALIFIED" ? "bg-yellow-50 border-yellow-300" :
              "bg-red-50 border-red-300"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {verificationResults.summary.auditOpinion === "UNQUALIFIED" ? 
                    <CheckCircle2 className="w-8 h-8 text-green-600" /> :
                    verificationResults.summary.auditOpinion === "QUALIFIED" ? 
                    <AlertTriangle className="w-8 h-8 text-yellow-600" /> :
                    <XCircle className="w-8 h-8 text-red-600" />
                  }
                  <div>
                    <h3 className="font-display text-lg font-bold">Audit Opinion: {verificationResults.summary.auditOpinion}</h3>
                    <p className="text-sm text-gray-600">Independent Calculation Verification Report</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  verificationResults.summary.overallStatus === "PASS" ? "bg-green-100 text-green-700" :
                  verificationResults.summary.overallStatus === "WARNING" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  <span className="font-display font-bold">{verificationResults.summary.overallStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 text-center">
                <div className="p-4 rounded-xl bg-white/60 border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-gray-900">{verificationResults.summary.totalChecks}</div>
                  <div className="text-xs text-gray-500 label-text mt-1">Total Checks</div>
                </div>
                <div className="p-4 rounded-xl bg-white/60 border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-secondary">{verificationResults.summary.totalPassed}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Passed</div>
                </div>
                <div className="p-4 rounded-xl bg-white/60 border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-red-600">{verificationResults.summary.totalFailed}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Failed</div>
                </div>
                <div className="p-4 rounded-xl bg-white/60 border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-red-600">{verificationResults.summary.criticalIssues}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Critical</div>
                </div>
                <div className="p-4 rounded-xl bg-white/60 border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-yellow-600">{verificationResults.summary.materialIssues}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Material</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-3 text-right">Verified at: {formatDateTime(verificationResults.timestamp)}</p>
            </div>

            {(aiReview || aiReviewLoading) && (
              <div className="p-5 rounded-2xl bg-[#F4795B]/10 border border-[#F4795B]/30">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6 text-[#F4795B]" />
                  <h3 className="font-display font-semibold text-gray-900">AI Methodology Review</h3>
                  {aiReviewLoading && <Loader2 className="w-4 h-4 animate-spin text-[#F4795B]" />}
                </div>
                <pre className="text-xs font-mono bg-white/80 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-gray-200 max-h-96 overflow-y-auto">
                  {aiReview || "Analyzing verification results..."}
                </pre>
              </div>
            )}

            {verificationResults.clientKnownValueTests && (
              <div className={`p-5 rounded-2xl border-2 ${verificationResults.clientKnownValueTests.passed ? "bg-green-50/60 border-green-200" : "bg-red-50/60 border-red-200"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {verificationResults.clientKnownValueTests.passed ?
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-green-600" /></div> :
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
                    }
                    <div>
                      <h3 className="font-display font-semibold text-gray-900">Known-Value Test Cases</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Independent formula validation against hand-calculated expected values</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${verificationResults.clientKnownValueTests.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {verificationResults.clientKnownValueTests.passed ? "All Passed" : "Issues Found"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(verificationResults.clientKnownValueTests.structured || []).map((testCase, tIdx) => (
                    <div key={tIdx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        {testCase.allPassed ?
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> :
                          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        }
                        <span className="text-sm font-semibold text-gray-800">{testCase.name}</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {testCase.checks.map((check, cIdx) => (
                          <div key={cIdx} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                {check.passed ?
                                  <span className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 text-[10px] font-bold">&#10003;</span> :
                                  <span className="w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 text-[10px] font-bold">&#10007;</span>
                                }
                                <span className="text-sm font-medium text-gray-800">{check.label}</span>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${check.passed ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                                {check.passed ? "Match" : "Mismatch"}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono mb-2 pl-7">{check.formula}</p>
                            <div className="grid grid-cols-2 gap-2 pl-7">
                              <div className="bg-gray-50 rounded-lg px-3 py-2">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Expected</p>
                                <p className="text-sm font-semibold text-gray-800 font-mono">${check.expected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>
                              <div className={`rounded-lg px-3 py-2 ${check.passed ? "bg-green-50/50" : "bg-red-50/50"}`}>
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Calculated</p>
                                <p className={`text-sm font-semibold font-mono ${check.passed ? "text-green-700" : "text-red-700"}`}>${check.calculated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {verificationResults.propertyResults.map((property, pIdx) => (
              <div key={pIdx} className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display text-gray-900 font-semibold">
                    {property.propertyName} <span className="text-gray-500 font-normal text-sm">({property.propertyType})</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-secondary bg-green-50 px-2 py-1 rounded">{property.passed} passed</span>
                    {property.failed > 0 && <span className="text-xs font-mono text-red-600 bg-red-50 px-2 py-1 rounded">{property.failed} failed</span>}
                    {property.criticalIssues > 0 && <span className="text-xs font-mono text-red-700 bg-red-100 px-2 py-1 rounded">{property.criticalIssues} critical</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  {renderGroupedChecks(property.checks, `prop-${pIdx}`)}
                </div>
              </div>
            ))}

            {verificationResults.companyChecks.length > 0 && (
              <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30">
                <h4 className="font-display text-secondary font-semibold mb-3">Management Company Checks</h4>
                <div className="space-y-2">
                  {renderGroupedChecks(verificationResults.companyChecks, "company")}
                </div>
              </div>
            )}

            {verificationResults.consolidatedChecks.length > 0 && (
              <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary/30">
                <h4 className="font-display text-secondary font-semibold mb-3">Consolidated Portfolio Checks</h4>
                <div className="space-y-2">
                  {renderGroupedChecks(verificationResults.consolidatedChecks, "consolidated")}
                </div>
              </div>
            )}

            {verificationResults.clientAuditReports && verificationResults.clientAuditReports.length > 0 && (
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display text-gray-900 font-semibold">Client-Side Audit Reports</h4>
                  {verificationResults.clientAuditWorkpaper && (
                    <button
                      onClick={() => {
                        const blob = new Blob([verificationResults.clientAuditWorkpaper!], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `audit-workpaper-${new Date().toISOString().slice(0,10)}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download Workpaper
                    </button>
                  )}
                </div>
                {verificationResults.clientAuditReports.map((report, rIdx) => (
                  <div key={rIdx} className="mt-4 p-4 bg-white/80 rounded-lg border border-gray-200">
                    <h4 className="font-display font-semibold text-gray-800 mb-2">{report.propertyName}</h4>
                    <div className="space-y-2">
                      {report.sections.map((section, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between p-2 rounded bg-gray-50">
                          <div className="flex items-center gap-2">
                            {section.failed === 0 ? 
                              <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                              section.materialIssues > 0 ?
                              <XCircle className="w-4 h-4 text-red-600" /> :
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            }
                            <span className="text-sm font-medium">{section.name}</span>
                          </div>
                          <span className="text-xs font-mono text-gray-600">{section.passed}/{section.findings.length} passed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>

    {verificationHistory && verificationHistory.length > 0 && (
      <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl mt-6">
        <CardHeader className="relative">
          <CardTitle className="text-lg font-display text-gray-900">Verification History</CardTitle>
          <CardDescription className="label-text text-gray-600">
            Past verification runs with audit opinions
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Checks</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Passed</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Failed</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Opinion</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verificationHistory.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="text-sm font-mono">
                    {new Date(run.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-mono">{run.totalChecks}</TableCell>
                  <TableCell className="text-sm font-mono text-green-700">{run.passed}</TableCell>
                  <TableCell className="text-sm font-mono text-red-600">{run.failed}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                      run.auditOpinion === "UNQUALIFIED" ? "bg-green-100 text-green-700" :
                      run.auditOpinion === "QUALIFIED" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {run.auditOpinion}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                      run.overallStatus === "PASS" ? "bg-green-100 text-green-700" :
                      run.overallStatus === "WARNING" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {run.overallStatus}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )}
    </>
  );
}
