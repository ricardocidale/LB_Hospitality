import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { GlassButton } from "@/components/ui/glass-button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ChevronDown,
  ChevronRight,
  FileDown,
  Database,
  BookOpen,
  Building2,
  Hotel,
  Settings,
  Sliders,
  DollarSign,
  FileText,
  Download,
  Palette,
  FolderOpen,
  UserCircle,
  BarChart3,
  Brain,
  Plus,
  FlaskConical,
  Calculator,
  Briefcase,
  PieChart,
  Landmark,
  BookOpenCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const sections = [
  { id: "app-overview", title: "1. Application Overview", icon: BookOpen },
  { id: "mgmt-company", title: "2. Management Company", icon: Building2 },
  { id: "property-portfolio", title: "3. Property Portfolio (SPVs)", icon: Hotel },
  { id: "global-assumptions", title: "4. Global Assumptions", icon: Settings },
  { id: "property-assumptions", title: "5. Property-Level Assumptions", icon: Sliders },
  { id: "cashflow-streams", title: "6. Cash Flow Streams", icon: DollarSign },
  { id: "financial-statements", title: "7. Financial Statements", icon: FileText },
  { id: "export-system", title: "8. Export System", icon: Download },
  { id: "design-config", title: "9. Design Configuration", icon: Palette },
  { id: "scenario-mgmt", title: "10. Scenario Management", icon: FolderOpen },
  { id: "my-profile", title: "11. My Profile", icon: UserCircle },
  { id: "dashboard-kpis", title: "12. Dashboard & KPIs", icon: BarChart3 },
  { id: "ai-research", title: "13. AI Research & Calibration", icon: Brain },
  { id: "property-crud", title: "14. Property CRUD & Images", icon: Plus },
  { id: "testing-methodology", title: "15. Testing Methodology", icon: FlaskConical },
  { id: "property-formulas", title: "16. Property Financial Formulas", icon: Calculator },
  { id: "company-formulas", title: "17. Management Company Formulas", icon: Briefcase },
  { id: "consolidated-formulas", title: "18. Consolidated Portfolio Formulas", icon: PieChart },
  { id: "investment-returns", title: "19. Investment Returns (DCF/FCF/IRR)", icon: Landmark },
  { id: "funding-financing", title: "20. Funding, Financing & Refinancing", icon: DollarSign },
  { id: "glossary", title: "21. Glossary", icon: BookOpenCheck },
];

function ManualTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/10">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-white/90 font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="bg-white/5 border-t border-white/10 hover:bg-white/[0.08] transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-white/80">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-4">
      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-amber-200/90 text-sm font-medium">{children}</p>
    </div>
  );
}

function SectionCard({
  id,
  title,
  icon: Icon,
  expanded,
  onToggle,
  sectionRef,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div ref={sectionRef} id={id} className="scroll-mt-24">
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
        <button
          data-testid={`section-toggle-${id}`}
          onClick={onToggle}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[#9FBCA4]" />
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronRight className="w-5 h-5 text-white/60" />
          )}
        </button>
        {expanded && (
          <CardContent className="pt-0 pb-6 px-5 space-y-4">
            {children}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function CheckerManual() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exportingManual, setExportingManual] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const logActivity = (action: string, metadata?: Record<string, unknown>) => {
    fetch("/api/activity-logs/manual-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, metadata }),
      credentials: "include",
    }).catch(() => {});
  };

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

  const handleExportPDF = async () => {
    if (exportingManual) return;
    setExportingManual(true);
    logActivity("export-manual-pdf", {
      exportType: "manual-pdf",
      sectionCount: sections.length,
      exportedAt: new Date().toISOString(),
    });
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();

      doc.setFillColor(26, 35, 50);
      doc.rect(0, 0, pageW, 60, "F");
      doc.setFillColor(159, 188, 164);
      doc.rect(0, 56, pageW, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("L+B Hospitality Group", 14, 25);
      doc.setFontSize(14);
      doc.setTextColor(159, 188, 164);
      doc.text("Checker Manual — Verification & Testing Guide", 14, 38);
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.text(`Generated: ${new Date().toLocaleDateString()} | User: ${user?.email || "checker"}`, 14, 50);

      let y = 70;
      const addSection = (title: string, rows: string[][]) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(37, 125, 65);
        doc.text(title, 14, y);
        y += 6;
        if (rows.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [rows[0]],
            body: rows.slice(1),
            theme: "grid",
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [26, 46, 61], textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [245, 245, 245] },
          });
          y = (doc as any).lastAutoTable.finalY + 8;
        }
      };

      addSection("Table of Contents", [
        ["#", "Section"],
        ...sections.map((s, i) => [String(i + 1), s.title]),
      ]);

      addSection("Key Property Formulas", [
        ["ID", "Formula", "Expression"],
        ["F-P-01", "Available Rooms", "Room Count × 30.5"],
        ["F-P-02", "Sold Rooms", "Available Rooms × Occupancy Rate"],
        ["F-P-03", "Room Revenue", "ADR × Sold Rooms"],
        ["F-P-08", "GOP", "Total Revenue − Total Operating Expenses"],
        ["F-P-10", "NOI", "GOP − Mgmt Fees − FF&E Reserve"],
        ["F-P-11", "Depreciable Basis", "Price × (1 − Land%) + Improvements"],
        ["F-P-12", "Monthly Depreciation", "Depreciable Basis / 27.5 / 12"],
        ["F-P-14", "Net Income", "NOI − Interest − Depreciation − Tax"],
        ["F-P-15", "CFO", "Net Income + Depreciation"],
      ]);

      addSection("Key Company Formulas", [
        ["ID", "Formula", "Expression"],
        ["F-C-01", "Base Fee Revenue", "Σ(Property Revenue × Base Rate)"],
        ["F-C-02", "Incentive Fee Revenue", "Σ(max(0, Property GOP × Incentive Rate))"],
        ["F-C-04", "Net Income", "Total Revenue − Total Expenses"],
        ["F-C-05", "Cash Flow", "Net Income + SAFE Funding"],
      ]);

      addSection("Investment Return Formulas", [
        ["ID", "Formula", "Expression"],
        ["F-R-01", "FCF", "NOI − Tax − CapEx"],
        ["F-R-02", "FCFE", "NOI − Debt Service − Tax"],
        ["F-R-04", "IRR", "Solve: Σ(FCFE_t/(1+r)^t) = Equity₀"],
        ["F-R-05", "Exit Value", "Terminal NOI / Cap Rate"],
        ["F-R-07", "Equity Multiple", "Total Distributions / Equity"],
      ]);

      addSection("Financing Formulas", [
        ["ID", "Formula", "Expression"],
        ["F-F-01", "Loan Amount", "Purchase Price × LTV"],
        ["F-F-02", "PMT", "P × [r(1+r)^n / ((1+r)^n − 1)]"],
        ["F-F-05", "Refi Value", "Stabilized NOI / Cap Rate"],
        ["F-F-07", "Refi Proceeds", "New Loan − Old Balance − Closing Costs"],
      ]);

      addSection("Mandatory Business Rules", [
        ["Rule", "Description"],
        ["BC-01", "Company operations cannot begin before SAFE funding is received"],
        ["BC-02", "Property cannot operate before acquisition and funding"],
        ["BC-03", "Cash balances must never go negative for any entity"],
        ["BC-04", "All properties must be debt-free at exit"],
        ["BC-05", "Distributions cannot cause negative cash"],
      ]);

      addSection("Testing Methodology", [
        ["Phase", "Focus", "Key Tests"],
        ["Phase 1", "Simple Scenarios", "Single property, all-cash, verify revenue/expense/GOP/NOI"],
        ["Phase 2", "Moderate", "Multiple properties, financing, refi, global changes, scenarios"],
        ["Phase 3", "Edge Cases", "Zero revenue, 100% LTV, extreme cap rates, mid-year acquisition"],
      ]);

      doc.save("LB_Checker_Manual.pdf");
      toast({ title: "Manual Exported", description: "PDF has been downloaded." });
    } catch (err) {
      toast({ title: "Export Failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setExportingManual(false);
    }
  };

  const handleFullExport = async () => {
    if (exportingData) return;
    setExportingData(true);
    const exportTimestamp = new Date().toISOString();
    try {
      const [
        { default: jsPDF },
        { default: autoTable },
        { generatePropertyProForma, generateCompanyProForma, formatMoney },
        { aggregatePropertyByYear },
      ] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        import("@/lib/financialEngine"),
        import("@/lib/yearlyAggregator"),
      ]);

      const [propertiesRes, globalRes] = await Promise.all([
        apiRequest("GET", "/api/properties"),
        apiRequest("GET", "/api/global-assumptions"),
      ]);
      const properties = await propertiesRes.json();
      const global = await globalRes.json();

      const warnings: string[] = [];

      if (!properties?.length) warnings.push("No properties found in database");
      if (!global) warnings.push("Global assumptions not found");
      if (!properties?.length || !global) {
        toast({ title: "No Data", description: warnings.join(". "), variant: "destructive" });
        logActivity("full-data-export", { exportType: "full-data", status: "failed", warnings, exportedAt: exportTimestamp });
        return;
      }

      const projYears = global.projectionYears ?? 10;
      const projMonths = projYears * 12;

      const requiredGlobalFields = [
        "modelStartDate", "companyOpsStartDate", "inflationRate",
        "baseManagementFee", "safeTranche1Amount", "exitCapRate",
      ];
      const missingGlobal = requiredGlobalFields.filter(f => global[f] === null || global[f] === undefined || global[f] === "");
      if (missingGlobal.length > 0) warnings.push(`Missing global fields: ${missingGlobal.join(", ")}`);

      const requiredPropertyFields = ["name", "location", "roomCount", "startAdr", "purchasePrice"];
      properties.forEach((p: any, idx: number) => {
        const missing = requiredPropertyFields.filter(f => p[f] === null || p[f] === undefined || p[f] === "");
        if (missing.length > 0) warnings.push(`Property "${p.name || `#${idx + 1}`}" missing: ${missing.join(", ")}`);
        if ((p.roomCount ?? 0) <= 0) warnings.push(`Property "${p.name}" has invalid room count`);
        if ((p.purchasePrice ?? 0) <= 0) warnings.push(`Property "${p.name}" has invalid purchase price`);
      });

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();

      doc.setFillColor(26, 35, 50);
      doc.rect(0, 0, pageW, 40, "F");
      doc.setFillColor(159, 188, 164);
      doc.rect(0, 37, pageW, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("L+B Hospitality Group — Full Data Export", 14, 18);
      doc.setFontSize(9);
      doc.setTextColor(159, 188, 164);
      doc.text(`Generated: ${new Date().toLocaleString()} | User: ${user?.email || "unknown"} (${user?.role || "unknown"}) | Properties: ${properties.length}`, 14, 30);

      let y = 50;

      if (warnings.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(220, 80, 60);
        doc.text("DATA COMPLETENESS WARNINGS", 14, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(180, 60, 40);
        warnings.forEach(w => {
          if (y > 185) { doc.addPage(); y = 20; }
          doc.text(`• ${w}`, 18, y);
          y += 4;
        });
        y += 4;
      }

      const addTable = (title: string, head: string[], rows: string[][]) => {
        if (y > 170) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(37, 125, 65);
        doc.text(title, 14, y);
        y += 5;
        autoTable(doc, {
          startY: y,
          head: [head],
          body: rows,
          theme: "grid",
          styles: { fontSize: 6.5, cellPadding: 1.5 },
          headStyles: { fillColor: [26, 46, 61], textColor: [255, 255, 255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      };

      addTable("Global Assumptions", ["Parameter", "Value"], [
        ["Company Name", global.companyName || "L+B Hospitality"],
        ["Model Start Date", global.modelStartDate || "—"],
        ["Projection Years", String(projYears)],
        ["Company Ops Start", global.companyOpsStartDate || "—"],
        ["Fiscal Year Start Month", String(global.fiscalYearStartMonth ?? 1)],
        ["Inflation Rate", `${((global.inflationRate ?? 0.03) * 100).toFixed(1)}%`],
        ["Fixed Cost Escalation", `${((global.fixedCostEscalationRate ?? 0.03) * 100).toFixed(1)}%`],
        ["Base Management Fee", `${((global.baseManagementFee ?? 0.05) * 100).toFixed(1)}%`],
        ["Incentive Management Fee", `${((global.incentiveManagementFee ?? 0.15) * 100).toFixed(1)}%`],
        ["SAFE Tranche 1", formatMoney(global.safeTranche1Amount ?? 0)],
        ["SAFE Tranche 1 Date", global.safeTranche1Date || "—"],
        ["SAFE Tranche 2", formatMoney(global.safeTranche2Amount ?? 0)],
        ["SAFE Tranche 2 Date", global.safeTranche2Date || "—"],
        ["Exit Cap Rate", `${((global.exitCapRate ?? 0.08) * 100).toFixed(1)}%`],
        ["Sales Commission", `${((global.salesCommissionRate ?? 0.02) * 100).toFixed(1)}%`],
        ["Company Tax Rate", `${((global.companyTaxRate ?? 0.21) * 100).toFixed(1)}%`],
        ["Partner Base Compensation", formatMoney(global.partnerBaseCompensation ?? 15000)],
        ["Partner Comp Cap", formatMoney(global.partnerCompensationCap ?? 30000)],
      ]);

      addTable("Properties Summary", ["Name", "Location", "Rooms", "ADR", "Occupancy", "Purchase Price", "LTV", "Status"],
        properties.map((p: any) => [
          p.name,
          p.location || "—",
          String(p.roomCount ?? 0),
          formatMoney(p.startAdr ?? 0),
          `${((p.startOccupancy ?? 0) * 100).toFixed(0)}%`,
          formatMoney(p.purchasePrice ?? 0),
          p.acquisitionLTV ? `${(p.acquisitionLTV * 100).toFixed(0)}%` : "Cash",
          p.status || "active",
        ])
      );

      const includedStatements: string[] = [];
      let propertyErrors = 0;

      properties.forEach((p: any) => {
        try {
          const financials = generatePropertyProForma(p, global, projMonths);
          const yearly = aggregatePropertyByYear(financials, projYears);
          const yearHeaders = ["Line Item", ...Array.from({ length: projYears }, (_, i) => `Year ${i + 1}`)];

          addTable(`${p.name} — Income Statement`, yearHeaders, [
            ["Room Revenue", ...yearly.map(yr => formatMoney(yr.revenueRooms))],
            ["F&B Revenue", ...yearly.map(yr => formatMoney(yr.revenueFB))],
            ["Other Revenue", ...yearly.map(yr => formatMoney(yr.revenueOther))],
            ["Total Revenue", ...yearly.map(yr => formatMoney(yr.revenueTotal))],
            ["Total Expenses", ...yearly.map(yr => formatMoney(yr.totalExpenses))],
            ["GOP", ...yearly.map(yr => formatMoney(yr.gop))],
            ["Base Mgmt Fee", ...yearly.map(yr => formatMoney(yr.feeBase))],
            ["Incentive Mgmt Fee", ...yearly.map(yr => formatMoney(yr.feeIncentive))],
            ["NOI", ...yearly.map(yr => formatMoney(yr.noi))],
            ["Depreciation", ...yearly.map(yr => formatMoney(yr.depreciationExpense))],
            ["Net Income", ...yearly.map(yr => formatMoney(yr.netIncome))],
          ]);
          includedStatements.push(`${p.name} — Income Statement`);

          addTable(`${p.name} — Cash Flow`, yearHeaders, [
            ["Interest Expense", ...yearly.map(yr => formatMoney(yr.interestExpense))],
            ["Principal Payment", ...yearly.map(yr => formatMoney(yr.principalPayment))],
            ["Total Debt Service", ...yearly.map(yr => formatMoney(yr.debtPayment))],
            ["Operating Cash Flow", ...yearly.map(yr => formatMoney(yr.operatingCashFlow))],
            ["Total Cash Flow", ...yearly.map(yr => formatMoney(yr.cashFlow))],
            ["Ending Cash", ...yearly.map(yr => formatMoney(yr.endingCash))],
          ]);
          includedStatements.push(`${p.name} — Cash Flow`);
        } catch (e) {
          propertyErrors++;
          warnings.push(`Failed to generate financials for "${p.name}": ${e instanceof Error ? e.message : "unknown error"}`);
        }
      });

      let companyIncluded = false;
      try {
        const companyData = generateCompanyProForma(properties, global, projMonths);
        const companyYearly: Record<string, number[]> = {};
        const keys = ["totalRevenue", "totalExpenses", "netIncome", "endingCash", "safeFunding"] as const;
        keys.forEach(k => { companyYearly[k] = Array(projYears).fill(0); });
        companyData.forEach((m: any, i: number) => {
          const yr = Math.floor(i / 12);
          if (yr < projYears) {
            keys.forEach(k => {
              if (k === "endingCash") companyYearly[k][yr] = m[k];
              else companyYearly[k][yr] += m[k];
            });
          }
        });

        const cYearHeaders = ["Line Item", ...Array.from({ length: projYears }, (_, i) => `Year ${i + 1}`)];
        addTable("Management Company — Summary", cYearHeaders, [
          ["Total Revenue", ...companyYearly.totalRevenue.map(v => formatMoney(v))],
          ["Total Expenses", ...companyYearly.totalExpenses.map(v => formatMoney(v))],
          ["Net Income", ...companyYearly.netIncome.map(v => formatMoney(v))],
          ["SAFE Funding", ...companyYearly.safeFunding.map(v => formatMoney(v))],
          ["Ending Cash", ...companyYearly.endingCash.map(v => formatMoney(v))],
        ]);
        includedStatements.push("Management Company — Summary");
        companyIncluded = true;
      } catch (e) {
        warnings.push(`Failed to generate Management Company financials: ${e instanceof Error ? e.message : "unknown error"}`);
      }

      doc.addPage();
      y = 20;
      doc.setFillColor(26, 35, 50);
      doc.rect(0, 0, pageW, 15, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("Export Summary & Completeness Report", 14, 11);
      y = 25;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const summaryLines = [
        `Export Timestamp: ${new Date().toLocaleString()}`,
        `Exported By: ${user?.email || "unknown"} (Role: ${user?.role || "unknown"})`,
        `Projection Period: ${projYears} years (${projMonths} months)`,
        `Properties Included: ${properties.length}`,
        `Financial Statements Generated: ${includedStatements.length}`,
        `Management Company Included: ${companyIncluded ? "Yes" : "No"}`,
        `Global Assumptions: Included`,
        `Warnings: ${warnings.length}`,
      ];
      summaryLines.forEach(line => {
        doc.text(line, 14, y);
        y += 5;
      });
      y += 3;

      addTable("Included Financial Statements", ["#", "Statement"], 
        includedStatements.map((s, i) => [String(i + 1), s])
      );

      if (warnings.length > 0) {
        addTable("Data Completeness Warnings", ["#", "Warning"],
          warnings.map((w, i) => [String(i + 1), w])
        );
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(37, 125, 65);
        if (y > 185) { doc.addPage(); y = 20; }
        doc.text("ALL DATA COMPLETE — No warnings detected.", 14, y);
      }

      doc.save("LB_Full_Data_Export.pdf");

      logActivity("full-data-export", {
        exportType: "full-data",
        status: warnings.length > 0 ? "completed-with-warnings" : "completed",
        propertyCount: properties.length,
        statementsGenerated: includedStatements.length,
        companyIncluded,
        warningCount: warnings.length,
        warnings: warnings.length > 0 ? warnings : undefined,
        projectionYears: projYears,
        exportedAt: exportTimestamp,
      });

      if (warnings.length > 0) {
        toast({
          title: "Export Complete (with warnings)",
          description: `${warnings.length} warning(s) found. Check the Summary page at the end of the PDF.`,
        });
      } else {
        toast({ title: "Full Data Export Complete", description: "PDF with all assumptions, financials, and completeness report has been downloaded." });
      }
    } catch (err) {
      logActivity("full-data-export", { exportType: "full-data", status: "error", exportedAt: exportTimestamp });
      toast({ title: "Export Failed", description: "Could not generate full data export.", variant: "destructive" });
    } finally {
      setExportingData(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-[#1a2332] via-[#1e2a3a] to-[#1a2832]">
        <div className="p-4 md:p-6 space-y-6">
          <PageHeader
            title="Checker Manual"
            subtitle="L+B Hospitality Group — Verification & Testing Guide"
            actions={
              <div className="flex gap-2">
                <GlassButton data-testid="btn-export-pdf" onClick={handleExportPDF} disabled={exportingManual}>
                  {exportingManual ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                  Export Manual PDF
                </GlassButton>
                <GlassButton data-testid="btn-full-export" onClick={handleFullExport} disabled={exportingData}>
                  {exportingData ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                  Full Data Export
                </GlassButton>
              </div>
            }
          />

          <Callout>
            Always export to Excel and CSV before verifying calculations — this gives you raw numbers to cross-check against formulas.
          </Callout>

          <div className="flex gap-6">
            {/* Table of Contents Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Table of Contents</h3>
                    <nav className="space-y-1">
                      {sections.map((s) => (
                        <button
                          key={s.id}
                          data-testid={`toc-${s.id}`}
                          onClick={() => scrollToSection(s.id)}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors truncate"
                        >
                          {s.title}
                        </button>
                      ))}
                    </nav>
                  </div>
                </Card>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 space-y-4 min-w-0">
              {/* Section 1: Application Overview */}
              <SectionCard
                id="app-overview"
                title="1. Application Overview"
                icon={BookOpen}
                expanded={expandedSections.has("app-overview")}
                onToggle={() => toggleSection("app-overview")}
                sectionRef={(el) => { sectionRefs.current["app-overview"] = el; }}
              >
                <p className="text-white/70 text-sm">Two-entity architecture — Management Company (service co) + Property SPVs. All calculations client-side, no hardcoded values, configurable assumptions with centralized constants as fallbacks.</p>
                <ManualTable
                  headers={["Navigation Section", "Purpose", "Route"]}
                  rows={[
                    ["Dashboard", "Portfolio overview with KPI cards and consolidated financials", "/"],
                    ["Properties", "Individual property SPV details and financials", "/portfolio"],
                    ["Management Co.", "Management company financials and assumptions", "/company"],
                    ["Property Finder", "Search and save prospective properties", "/property-finder"],
                    ["Sensitivity Analysis", "Variable sensitivity testing", "/sensitivity"],
                    ["Financing Analysis", "Debt and equity analysis tools", "/financing"],
                    ["Systemwide Assumptions", "Model-wide configurable parameters", "/settings"],
                    ["My Profile", "Account management", "/profile"],
                    ["My Scenarios", "Save/load assumption snapshots", "/scenarios"],
                    ["Administration", "User management, verification, design checks", "/admin"],
                    ["Methodology", "Financial calculation documentation", "/methodology"],
                  ]}
                />
              </SectionCard>

              {/* Section 2: Management Company */}
              <SectionCard
                id="mgmt-company"
                title="2. Management Company"
                icon={Building2}
                expanded={expandedSections.has("mgmt-company")}
                onToggle={() => toggleSection("mgmt-company")}
                sectionRef={(el) => { sectionRefs.current["mgmt-company"] = el; }}
              >
                <p className="text-white/70 text-sm">Service company, NOT a property owner. Revenue: Base Fee (% of Total Revenue) + Incentive Fee (% of GOP). Funded via SAFE notes (Tranche 1 gates operations — Business Rule #1).</p>
                <ManualTable
                  headers={["Expense Category", "Calculation", "Escalation"]}
                  rows={[
                    ["Partner Compensation", "partnerCompYearN × partnerCount / 12", "Per-year schedule"],
                    ["Staff Compensation", "headcountYearN × avgStaffSalary / 12", "Per-year schedule"],
                    ["Office Lease", "Annual / 12 × (1 + escalation)^year", "Fixed cost escalation"],
                    ["Professional Services", "Annual / 12 × (1 + escalation)^year", "Fixed cost escalation"],
                    ["Tech Infrastructure", "Annual / 12 × (1 + escalation)^year", "Fixed cost escalation"],
                    ["Business Insurance", "Annual / 12 × (1 + escalation)^year", "Fixed cost escalation"],
                    ["Travel", "Properties × cost/client / 12 × (1 + inflation)^year", "Inflation"],
                    ["IT Licensing", "Properties × cost/client / 12 × (1 + inflation)^year", "Inflation"],
                    ["Marketing", "Portfolio Revenue × rate × (1 + inflation)^year", "Inflation"],
                    ["Misc Operations", "Portfolio Revenue × rate × (1 + inflation)^year", "Inflation"],
                  ]}
                />
                <Callout>Management fees appear as REVENUE for the Management Company and as EXPENSES for each Property SPV.</Callout>
              </SectionCard>

              {/* Section 3: Property Portfolio */}
              <SectionCard
                id="property-portfolio"
                title="3. Property Portfolio (SPVs)"
                icon={Hotel}
                expanded={expandedSections.has("property-portfolio")}
                onToggle={() => toggleSection("property-portfolio")}
                sectionRef={(el) => { sectionRefs.current["property-portfolio"] = el; }}
              >
                <p className="text-white/70 text-sm">Each property is an independent SPV with its own financials. Investor returns come from: FCF distributions, refinancing proceeds, and exit proceeds.</p>
                <ManualTable
                  headers={["Name", "Location", "Rooms", "Starting ADR", "Financing", "Status"]}
                  rows={[
                    ["The Hudson Estate", "Hudson Valley, NY", "22", "$395", "Financed", "Operating"],
                    ["Eden Summit Lodge", "Park City, UT", "18", "$450", "Financed", "Development"],
                    ["Austin Hillside", "Austin, TX", "15", "$325", "Full Equity", "Acquisition"],
                    ["Casa Medellín", "Medellín, Colombia", "20", "$185", "Financed", "Development"],
                    ["Blue Ridge Manor", "Asheville, NC", "16", "$310", "Financed", "Operating"],
                  ]}
                />
              </SectionCard>

              {/* Section 4: Global Assumptions */}
              <SectionCard
                id="global-assumptions"
                title="4. Global Assumptions"
                icon={Settings}
                expanded={expandedSections.has("global-assumptions")}
                onToggle={() => toggleSection("global-assumptions")}
                sectionRef={(el) => { sectionRefs.current["global-assumptions"] = el; }}
              >
                <p className="text-white/70 text-sm mb-2">Model-wide parameters accessible via Settings page. Changing any global assumption triggers instant client-side recalculation of every financial statement.</p>
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Model Parameters</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["companyName", "Display name for management company", "L+B Hospitality Company", "text", "Both"],
                    ["companyLogo", "URL to uploaded company logo", "null", "URL", "Both"],
                    ["propertyLabel", "Label for property type throughout UI", "Boutique Hotel", "text", "Both"],
                    ["modelStartDate", "First month of the financial model", "2026-04-01", "date", "Both"],
                    ["projectionYears", "Number of years to project", "10", "count", "Both"],
                    ["companyOpsStartDate", "Date Management Company begins operations", "2026-06-01", "date", "Mgmt Co."],
                    ["fiscalYearStartMonth", "Month number when fiscal year begins (1=Jan)", "1", "count (1–12)", "Both"],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Inflation & Escalation</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["inflationRate", "Annual inflation rate for salaries and variable costs", "3%", "%", "Both"],
                    ["fixedCostEscalationRate", "Annual escalation for Mgmt Co. fixed overhead", "3%", "%", "Mgmt Co."],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Management Fees</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["baseManagementFee", "Base fee as % of property Total Revenue", "5%", "%", "Both"],
                    ["incentiveManagementFee", "Incentive fee as % of property GOP", "15%", "%", "Both"],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">SAFE Funding</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["fundingSourceLabel", "Label for funding instrument type", "SAFE", "text", "Mgmt Co."],
                    ["safeTranche1Amount", "Amount of first SAFE tranche", "$1,000,000", "$", "Mgmt Co."],
                    ["safeTranche1Date", "Disbursement date for first tranche", "2026-06-01", "date", "Mgmt Co."],
                    ["safeTranche2Amount", "Amount of second SAFE tranche", "$1,000,000", "$", "Mgmt Co."],
                    ["safeTranche2Date", "Disbursement date for second tranche", "2027-04-01", "date", "Mgmt Co."],
                    ["safeValuationCap", "Max pre-money valuation for SAFE conversion", "$2,500,000", "$", "Mgmt Co."],
                    ["safeDiscountRate", "Discount rate for SAFE equity conversion", "20%", "%", "Mgmt Co."],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Partner Compensation (per year)</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["partnerCompYear1–3", "Annual comp pool (years 1–3)", "$540,000", "$/year", "Mgmt Co."],
                    ["partnerCompYear4–5", "Annual comp pool (years 4–5)", "$600,000", "$/year", "Mgmt Co."],
                    ["partnerCompYear6–7", "Annual comp pool (years 6–7)", "$700,000", "$/year", "Mgmt Co."],
                    ["partnerCompYear8–9", "Annual comp pool (years 8–9)", "$800,000", "$/year", "Mgmt Co."],
                    ["partnerCompYear10", "Annual comp pool (year 10)", "$900,000", "$/year", "Mgmt Co."],
                    ["partnerCountYear1–10", "Partner headcount each year", "3", "count", "Mgmt Co."],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Staffing</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["staffSalary", "Average annual salary per staff FTE", "$75,000", "$/year", "Mgmt Co."],
                    ["staffTier1MaxProperties", "Max properties for Tier 1 staffing", "3", "count", "Mgmt Co."],
                    ["staffTier1Fte", "FTE headcount at Tier 1", "2.5", "FTE", "Mgmt Co."],
                    ["staffTier2MaxProperties", "Max properties for Tier 2 staffing", "6", "count", "Mgmt Co."],
                    ["staffTier2Fte", "FTE headcount at Tier 2", "4.5", "FTE", "Mgmt Co."],
                    ["staffTier3Fte", "FTE headcount at Tier 3 (>6 properties)", "7.0", "FTE", "Mgmt Co."],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Fixed Overhead (Management Company)</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["officeLeaseStart", "Annual office lease cost (Year 1)", "$36,000", "$/year", "Mgmt Co."],
                    ["professionalServicesStart", "Annual legal/accounting/advisory (Year 1)", "$24,000", "$/year", "Mgmt Co."],
                    ["techInfraStart", "Annual technology infrastructure (Year 1)", "$18,000", "$/year", "Mgmt Co."],
                    ["businessInsuranceStart", "Annual business insurance (Year 1)", "$12,000", "$/year", "Mgmt Co."],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Variable Costs (Management Company)</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["travelCostPerClient", "Annual travel cost per managed property", "$12,000", "$/property/yr", "Mgmt Co."],
                    ["itLicensePerClient", "Annual IT licensing per managed property", "$3,000", "$/property/yr", "Mgmt Co."],
                    ["marketingRate", "Marketing spend as % of portfolio revenue", "5%", "%", "Mgmt Co."],
                    ["miscOpsRate", "Misc operations as % of portfolio revenue", "3%", "%", "Mgmt Co."],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Revenue Variables (Property Expense Rates)</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["eventExpenseRate", "Expense rate applied to Event Revenue", "65%", "%", "Properties"],
                    ["otherExpenseRate", "Expense rate applied to Other Revenue", "60%", "%", "Properties"],
                    ["utilitiesVariableSplit", "Portion of utilities treated as variable", "60%", "%", "Properties"],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Exit & Sale</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["exitCapRate", "Cap rate for terminal value calculation", "8.5%", "%", "Properties"],
                    ["salesCommissionRate", "Broker commission at disposition", "5%", "%", "Properties"],
                    ["companyTaxRate", "Corporate income tax rate for Mgmt Co.", "30%", "%", "Mgmt Co."],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Debt Assumptions</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["interestRate", "Default loan interest rate (acquisition)", "9%", "%", "Properties"],
                    ["amortizationYears", "Default loan amortization period", "25", "years", "Properties"],
                    ["acqLTV", "Default acquisition loan-to-value ratio", "75%", "%", "Properties"],
                    ["acqClosingCostRate", "Closing costs as % of acquisition loan", "2%", "%", "Properties"],
                    ["refiLTV", "Default refinance loan-to-value ratio", "75%", "%", "Properties"],
                    ["refiClosingCostRate", "Closing costs as % of refinance loan", "3%", "%", "Properties"],
                    ["refiInterestRate", "Interest rate on refinance loan", "—", "%", "Properties"],
                    ["refiAmortizationYears", "Amortization for refinance loan", "—", "years", "Properties"],
                    ["refiPeriodYears", "Years after ops start before refi eligibility", "—", "years", "Properties"],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Standard Acquisition Package</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit", "Affects"]}
                  rows={[
                    ["purchasePrice", "Default property purchase price", "$2,300,000", "$", "Properties"],
                    ["buildingImprovements", "Default renovation budget", "$800,000", "$", "Properties"],
                    ["preOpeningCosts", "Pre-opening expenses", "$150,000", "$", "Properties"],
                    ["operatingReserve", "Cash reserve for initial operations", "$200,000", "$", "Properties"],
                    ["monthsToOps", "Months from acquisition to ops start", "6", "months", "Properties"],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Boutique Definition</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit"]}
                  rows={[
                    ["minRooms / maxRooms", "Room count range", "10 – 80", "count"],
                    ["hasFB / hasEvents / hasWellness", "Amenity flags", "true", "boolean"],
                    ["minAdr / maxAdr", "Target ADR range", "$150 – $600", "$"],
                    ["level", "Service level classification", "luxury", "enum"],
                    ["eventLocations", "Number of distinct event spaces", "2", "count"],
                    ["maxEventCapacity", "Maximum event guest capacity", "150", "count"],
                    ["acreage", "Minimum property acreage", "10", "acres"],
                    ["privacyLevel", "Guest privacy classification", "high", "enum"],
                    ["parkingSpaces", "Minimum parking spaces", "50", "count"],
                  ]}
                />
              </SectionCard>

              {/* Section 5: Property-Level Assumptions */}
              <SectionCard
                id="property-assumptions"
                title="5. Property-Level Assumptions"
                icon={Sliders}
                expanded={expandedSections.has("property-assumptions")}
                onToggle={() => toggleSection("property-assumptions")}
                sectionRef={(el) => { sectionRefs.current["property-assumptions"] = el; }}
              >
                <p className="text-white/70 text-sm mb-2">Fallback chain: Property-specific value → Global assumption → DEFAULT constant from shared/constants.ts</p>
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Identity & Timing</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit"]}
                  rows={[
                    ["name", "Property display name", "— (required)", "text"],
                    ["location", "City/region description", "— (required)", "text"],
                    ["market", "Geographic market classification", "— (required)", "text"],
                    ["status", "Current lifecycle stage", "— (required)", "text"],
                    ["type", "Capital structure (Full Equity / Financed)", "— (required)", "text"],
                    ["acquisitionDate", "Date property is acquired", "— (required)", "date"],
                    ["operationsStartDate", "Date hotel operations begin", "— (required)", "date"],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Capital Structure</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit"]}
                  rows={[
                    ["purchasePrice", "Property acquisition price", "$2,300,000", "$"],
                    ["buildingImprovements", "Renovation / improvement budget", "$800,000", "$"],
                    ["landValuePercent", "Non-depreciable land allocation", "25%", "%"],
                    ["preOpeningCosts", "Pre-opening expenses", "$150,000", "$"],
                    ["operatingReserve", "Cash reserve for initial operations", "$200,000", "$"],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Revenue Drivers</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit"]}
                  rows={[
                    ["roomCount", "Number of guest rooms", "10", "count"],
                    ["startAdr", "Average Daily Rate at ops start", "$250", "$/night"],
                    ["adrGrowthRate", "Annual ADR growth rate", "3%", "%"],
                    ["startOccupancy", "Occupancy rate at ops start", "55%", "%"],
                    ["maxOccupancy", "Maximum stabilized occupancy", "85%", "%"],
                    ["occupancyRampMonths", "Months between occupancy growth steps", "6", "months"],
                    ["occupancyGrowthStep", "Occupancy increase per ramp step", "5%", "%"],
                    ["stabilizationMonths", "Months from ops start to stabilization", "24", "months"],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Revenue Shares & Cost Rates</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit"]}
                  rows={[
                    ["revShareEvents", "Event revenue as % of Room Revenue", "43%", "%"],
                    ["revShareFB", "F&B revenue as % of Room Revenue", "22%", "%"],
                    ["revShareOther", "Other revenue as % of Room Revenue", "7%", "%"],
                    ["cateringBoostPercent", "Uplift applied to base F&B revenue", "30%", "%"],
                    ["costRateRooms", "Rooms Department expense", "36%", "% of Revenue"],
                    ["costRateFB", "F&B Department expense", "32%", "% of Revenue"],
                    ["costRateAdmin", "Administrative & General", "8%", "% of Revenue"],
                    ["costRateMarketing", "Sales & Marketing", "5%", "% of Revenue"],
                    ["costRatePropertyOps", "Property Operations & Maintenance", "4%", "% of Revenue"],
                    ["costRateUtilities", "Utilities", "5%", "% of Revenue"],
                    ["costRateInsurance", "Property Insurance", "2%", "% of Revenue"],
                    ["costRateTaxes", "Property Taxes", "3%", "% of Revenue"],
                    ["costRateIT", "Information Technology", "2%", "% of Revenue"],
                    ["costRateFFE", "FF&E Reserve", "4%", "% of Revenue"],
                    ["costRateOther", "Other / Miscellaneous", "5%", "% of Revenue"],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Financing (Acquisition + Refi)</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit"]}
                  rows={[
                    ["acquisitionLTV", "Loan-to-value at acquisition", "75%", "%"],
                    ["acquisitionInterestRate", "Interest rate on acquisition loan", "9%", "%"],
                    ["acquisitionTermYears", "Amortization period", "25", "years"],
                    ["acquisitionClosingCostRate", "Closing costs as % of loan", "2%", "%"],
                    ["willRefinance", "Whether property will refinance", "null", "Yes/No"],
                    ["refinanceDate", "Target date for refinance", "null", "date"],
                    ["refinanceLTV", "LTV at refinance", "75%", "%"],
                    ["refinanceInterestRate", "Interest rate on refi loan", "9%", "%"],
                    ["refinanceTermYears", "Amortization for refi loan", "25", "years"],
                    ["refinanceClosingCostRate", "Closing costs as % of refi loan", "3%", "%"],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Exit & Tax</h3>
                <ManualTable
                  headers={["Variable", "Description", "Default", "Unit"]}
                  rows={[
                    ["exitCapRate", "Cap rate for terminal value", "8.5%", "%"],
                    ["taxRate", "Income / capital gains tax rate", "25%", "%"],
                  ]}
                />
              </SectionCard>

              {/* Section 6: Cash Flow Streams */}
              <SectionCard
                id="cashflow-streams"
                title="6. Cash Flow Streams"
                icon={DollarSign}
                expanded={expandedSections.has("cashflow-streams")}
                onToggle={() => toggleSection("cashflow-streams")}
                sectionRef={(el) => { sectionRefs.current["cashflow-streams"] = el; }}
              >
                <p className="text-white/70 text-sm">Each property SPV generates multiple interacting cash flow streams that must reconcile across Income Statement, Balance Sheet, and Cash Flow Statement.</p>
                <ManualTable
                  headers={["Stream", "When", "Formula Reference", "Impact"]}
                  rows={[
                    ["A. Equity Injection", "Year 0 (acquisition)", "F-F-09", "CFF — Total Cost minus Loan Amount"],
                    ["B. Acquisition Financing", "Year 0 proceeds; monthly service", "F-F-01 to F-F-07", "CFF (proceeds & principal); IS (interest)"],
                    ["C. Post-Stabilization Refinancing", "After stabilization period", "F-F-10 to F-F-14", "CFF (net proceeds); IS (new interest)"],
                    ["D. Exit / Disposition", "Terminal year", "F-R-05, F-R-06", "CFI — NOI / Cap Rate, net of commission and debt"],
                    ["E. Management Fee Linkage", "Monthly", "F-C-01, F-C-02", "Dual-entry: property expense ↔ company revenue"],
                  ]}
                />
                <h3 className="text-white/90 text-sm font-semibold mt-4 mb-2">Mandatory Business Rules</h3>
                <ManualTable
                  headers={["Rule #", "Name", "Description"]}
                  rows={[
                    ["BR-1", "SAFE Funding Gate", "Tranche 1 must be received before Management Company can begin operations"],
                    ["BR-2", "Fee Linkage", "Management fees appear as expense on Property IS and revenue on Company IS — must net to zero in consolidated view"],
                    ["BR-3", "Stabilization Prerequisite", "Refinancing cannot occur until property reaches stabilized occupancy"],
                    ["BR-4", "Balance Sheet Identity", "Assets = Liabilities + Equity must hold every period for every property"],
                    ["BR-5", "Cash Reconciliation", "Beginning Cash + Net Change = Ending Cash must hold every period"],
                  ]}
                />
              </SectionCard>

              {/* Section 7: Financial Statements */}
              <SectionCard
                id="financial-statements"
                title="7. Financial Statements"
                icon={FileText}
                expanded={expandedSections.has("financial-statements")}
                onToggle={() => toggleSection("financial-statements")}
                sectionRef={(el) => { sectionRefs.current["financial-statements"] = el; }}
              >
                <ManualTable
                  headers={["Statement", "Entity", "Key Line Items", "GAAP Reference"]}
                  rows={[
                    ["Income Statement", "Property", "Revenue, Expenses, GOP, NOI, Net Income", "ASC 606"],
                    ["Balance Sheet", "Property", "Assets, Liabilities, Equity", "ASC 360"],
                    ["Cash Flow", "Property", "CFO, CFI, CFF, Net Change", "ASC 230"],
                    ["Income Statement", "Company", "Fee Revenue, OpEx, Net Income", "—"],
                    ["Cash Flow", "Company", "Net Income, SAFE Funding", "—"],
                    ["Consolidated IS", "Portfolio", "Sum across all properties", "ASC 810"],
                    ["Consolidated CF", "Portfolio", "Aggregated cash flows", "ASC 810"],
                    ["Investment Analysis", "Both", "FCF, FCFE, IRR, MOIC", "—"],
                  ]}
                />
              </SectionCard>

              {/* Section 8: Export System */}
              <SectionCard
                id="export-system"
                title="8. Export System"
                icon={Download}
                expanded={expandedSections.has("export-system")}
                onToggle={() => toggleSection("export-system")}
                sectionRef={(el) => { sectionRefs.current["export-system"] = el; }}
              >
                <ManualTable
                  headers={["Format", "Extension", "Best For", "How to Use"]}
                  rows={[
                    ["PDF", ".pdf", "Formal reports", "Export Menu → PDF"],
                    ["Excel", ".xlsx", "Offline formula verification", "Export Menu → Excel"],
                    ["CSV", ".csv", "Import to other tools", "Export Menu → CSV"],
                    ["PowerPoint", ".pptx", "Investor presentations", "Export Menu → PowerPoint"],
                    ["Chart PNG", ".png", "Document embedding", "Export Menu → Chart Image"],
                    ["Table PNG", ".png", "Document embedding", "Export Menu → Table Image"],
                  ]}
                />
                <Callout>CHECKER TIP: Always export to Excel or CSV FIRST. Rebuild calculations independently in a spreadsheet to verify the engine's output.</Callout>
              </SectionCard>

              {/* Section 9: Design Configuration */}
              <SectionCard
                id="design-config"
                title="9. Design Configuration"
                icon={Palette}
                expanded={expandedSections.has("design-config")}
                onToggle={() => toggleSection("design-config")}
                sectionRef={(el) => { sectionRefs.current["design-config"] = el; }}
              >
                <ManualTable
                  headers={["Element", "Value"]}
                  rows={[
                    ["Primary Color", "Sage Green (#9FBCA4)"],
                    ["Secondary Color", "Green (#257D41)"],
                    ["Background", "Warm Off-White (#FFF9F5)"],
                    ["Accent", "Coral (#E07A5F)"],
                    ["Heading Font", "Playfair Display (serif)"],
                    ["Body Font", "Inter (sans-serif)"],
                    ["Dark Theme", "Glass effect with backdrop blur"],
                    ["Light Theme", "Clean white cards for assumption pages"],
                  ]}
                />
              </SectionCard>

              {/* Section 10: Scenario Management */}
              <SectionCard
                id="scenario-mgmt"
                title="10. Scenario Management"
                icon={FolderOpen}
                expanded={expandedSections.has("scenario-mgmt")}
                onToggle={() => toggleSection("scenario-mgmt")}
                sectionRef={(el) => { sectionRefs.current["scenario-mgmt"] = el; }}
              >
                <ManualTable
                  headers={["Action", "Description", "Effect"]}
                  rows={[
                    ["Save", "Snapshot current assumptions + properties", "Creates named copy"],
                    ["Load", "Restore saved scenario", "Replaces current state"],
                    ["Update", "Modify scenario name/description", "Metadata only"],
                    ["Delete", "Remove scenario permanently", "Cannot be undone"],
                  ]}
                />
                <Callout>Save a baseline scenario before any testing. Create separate test scenarios for each verification round.</Callout>
              </SectionCard>

              {/* Section 11: My Profile */}
              <SectionCard
                id="my-profile"
                title="11. My Profile"
                icon={UserCircle}
                expanded={expandedSections.has("my-profile")}
                onToggle={() => toggleSection("my-profile")}
                sectionRef={(el) => { sectionRefs.current["my-profile"] = el; }}
              >
                <ul className="text-white/70 text-sm space-y-1 list-disc list-inside">
                  <li>Edit name, email, company, and title</li>
                  <li>Change password (current + new + confirm)</li>
                  <li>Checker Manual button visible for checker and admin roles</li>
                </ul>
              </SectionCard>

              {/* Section 12: Dashboard & KPIs */}
              <SectionCard
                id="dashboard-kpis"
                title="12. Dashboard & KPIs"
                icon={BarChart3}
                expanded={expandedSections.has("dashboard-kpis")}
                onToggle={() => toggleSection("dashboard-kpis")}
                sectionRef={(el) => { sectionRefs.current["dashboard-kpis"] = el; }}
              >
                <ManualTable
                  headers={["KPI", "Source", "Formula Reference"]}
                  rows={[
                    ["Total Portfolio Revenue", "Σ property revenue", "F-X-01"],
                    ["Gross Operating Profit", "Σ property GOP", "F-X-03"],
                    ["Net Operating Income", "Σ property NOI", "F-X-04"],
                    ["Portfolio Cash", "Σ property ending cash", "F-X-06"],
                  ]}
                />
                <p className="text-white/70 text-sm mt-3">Tabs: Overview, Income Statement, Cash Flow, Balance Sheet, Investment Analysis. Each tab shows aggregated yearly data computed from generatePropertyProForma + aggregation.</p>
              </SectionCard>

              {/* Section 13: AI Research */}
              <SectionCard
                id="ai-research"
                title="13. AI Research & Calibration"
                icon={Brain}
                expanded={expandedSections.has("ai-research")}
                onToggle={() => toggleSection("ai-research")}
                sectionRef={(el) => { sectionRefs.current["ai-research"] = el; }}
              >
                <p className="text-white/70 text-sm">Three research tools available per property and globally. They use Claude to analyze markets and provide assumption calibration guidance.</p>
                <ul className="text-white/70 text-sm space-y-1 list-disc list-inside mt-2">
                  <li>ADR analysis and competitive benchmarking</li>
                  <li>Occupancy trends and seasonal patterns</li>
                  <li>Cap rate benchmarks by market</li>
                </ul>
                <p className="text-white/70 text-sm mt-2">Purpose: help users set realistic assumption values based on current market data.</p>
              </SectionCard>

              {/* Section 14: Property CRUD */}
              <SectionCard
                id="property-crud"
                title="14. Property CRUD & Images"
                icon={Plus}
                expanded={expandedSections.has("property-crud")}
                onToggle={() => toggleSection("property-crud")}
                sectionRef={(el) => { sectionRefs.current["property-crud"] = el; }}
              >
                <ManualTable
                  headers={["Action", "How", "Side Effects"]}
                  rows={[
                    ["Add Property", "Portfolio → Add Property button", "Creates new SPV, recalculates all"],
                    ["Edit Property", "Property card → edit icon", "Opens PropertyEdit page"],
                    ["Delete Property", "Property card → delete icon", "Removes SPV, recalculates all"],
                    ["Upload Image", "PropertyEdit → image section", "Stored in object storage"],
                  ]}
                />
              </SectionCard>

              {/* Section 15: Testing Methodology */}
              <SectionCard
                id="testing-methodology"
                title="15. Testing Methodology"
                icon={FlaskConical}
                expanded={expandedSections.has("testing-methodology")}
                onToggle={() => toggleSection("testing-methodology")}
                sectionRef={(el) => { sectionRefs.current["testing-methodology"] = el; }}
              >
                <ManualTable
                  headers={["Phase", "Scope", "What to Verify"]}
                  rows={[
                    ["Phase 1 — Simple", "Single property, all-cash, default assumptions", "Basic revenue/expense/GOP/NOI calculations"],
                    ["Phase 2 — Moderate", "Multiple properties, mixed financing, refinancing, global changes, scenario save/load", "Debt service, interest, refinancing proceeds, fee linkage across entities"],
                    ["Phase 3 — Edge Cases", "Zero revenue months, 100% LTV, extreme cap rates, negative NOI, mid-year acquisition, fiscal year crossover", "Boundary conditions, error handling, formula stability"],
                  ]}
                />
                <p className="text-white/70 text-sm mt-3">For each test: Document setup → Export baseline Excel → Make change → Export new Excel → Compare → Log results.</p>
              </SectionCard>

              {/* Section 16: Property Financial Formulas */}
              <SectionCard
                id="property-formulas"
                title="16. Property Financial Formulas"
                icon={Calculator}
                expanded={expandedSections.has("property-formulas")}
                onToggle={() => toggleSection("property-formulas")}
                sectionRef={(el) => { sectionRefs.current["property-formulas"] = el; }}
              >
                <ManualTable
                  headers={["ID", "Formula Name", "Expression", "Notes"]}
                  rows={[
                    ["F-P-01", "Available Rooms", "Room Count × 30.5", "Room-nights per month"],
                    ["F-P-02", "Sold Rooms", "Available Rooms × Occupancy Rate", "Occupied room-nights"],
                    ["F-P-03", "Room Revenue", "ADR × Sold Rooms", "Core rooms department revenue"],
                    ["F-P-04", "Event Revenue", "Room Revenue × Rev Share Events", "Ancillary event/venue revenue"],
                    ["F-P-05", "F&B Revenue", "Room Revenue × Rev Share F&B × (1 + Catering Boost)", "Food & beverage with catering uplift"],
                    ["F-P-06", "Other Revenue", "Room Revenue × Rev Share Other", "Spa, parking, retail, misc"],
                    ["F-P-07", "Total Revenue", "Σ Revenue Streams", "Gross operating revenue"],
                    ["F-P-08", "GOP", "Total Revenue − Total Operating Expenses", "Gross Operating Profit"],
                    ["F-P-09", "Management Fees", "Base Fee + Incentive Fee", "Dual-entry with Mgmt Co."],
                    ["F-P-10", "NOI", "GOP − Mgmt Fees − FF&E Reserve", "Net Operating Income"],
                    ["F-P-11", "Depreciable Basis", "Price × (1 − Land%) + Improvements", "ASC 360 / IRS Pub. 946"],
                    ["F-P-12", "Monthly Depreciation", "Depreciable Basis / 27.5 / 12", "Straight-line over 27.5 years"],
                    ["F-P-13", "Taxable Income", "NOI − Interest − Depreciation", "Pre-tax income"],
                    ["F-P-14", "Net Income", "NOI − Interest − Depreciation − Tax", "Bottom line"],
                    ["F-P-15", "CFO", "Net Income + Depreciation", "Cash from Operations (indirect method)"],
                    ["F-P-16", "CFF", "Loan Proceeds − Principal + Equity (acq yr)", "Cash from Financing"],
                    ["F-P-17", "Net Change", "CFO + CFI + CFF", "Total cash movement"],
                  ]}
                />
              </SectionCard>

              {/* Section 17: Management Company Formulas */}
              <SectionCard
                id="company-formulas"
                title="17. Management Company Formulas"
                icon={Briefcase}
                expanded={expandedSections.has("company-formulas")}
                onToggle={() => toggleSection("company-formulas")}
                sectionRef={(el) => { sectionRefs.current["company-formulas"] = el; }}
              >
                <ManualTable
                  headers={["ID", "Formula Name", "Expression", "Notes"]}
                  rows={[
                    ["F-C-01", "Base Fee Revenue", "Σ(Property Revenue × Base Rate)", "Sum across all managed properties"],
                    ["F-C-02", "Incentive Fee Revenue", "Σ(max(0, Property GOP × Incentive Rate))", "No cross-subsidy; per-property"],
                    ["F-C-03", "Total Revenue", "Base + Incentive", "Gross management company revenue"],
                    ["F-C-04", "Net Income", "Revenue − Expenses", "Bottom line after all costs"],
                    ["F-C-05", "Cash Flow", "Net Income + SAFE Funding", "Operating cash plus funding tranches"],
                  ]}
                />
              </SectionCard>

              {/* Section 18: Consolidated Portfolio Formulas */}
              <SectionCard
                id="consolidated-formulas"
                title="18. Consolidated Portfolio Formulas"
                icon={PieChart}
                expanded={expandedSections.has("consolidated-formulas")}
                onToggle={() => toggleSection("consolidated-formulas")}
                sectionRef={(el) => { sectionRefs.current["consolidated-formulas"] = el; }}
              >
                <ManualTable
                  headers={["ID", "Formula Name", "Expression", "Notes"]}
                  rows={[
                    ["F-X-01", "Consolidated Revenue", "Σ Property Revenue", "Sum across all active properties"],
                    ["F-X-02", "Consolidated Expenses", "Σ Property Expenses", "Sum across all active properties"],
                    ["F-X-03", "Consolidated GOP", "Σ Property GOP", "Aggregate gross operating profit"],
                    ["F-X-04", "Consolidated NOI", "Σ Property NOI", "Aggregate net operating income"],
                    ["F-X-05", "Consolidated Net Income", "Σ Property Net Income", "Aggregate bottom-line"],
                    ["F-X-06", "Consolidated Cash", "Σ Property Ending Cash", "Aggregate cash position"],
                    ["F-X-07", "Fee Elimination", "Property Expense ↔ Company Revenue", "Inter-company elimination per ASC 810"],
                  ]}
                />
              </SectionCard>

              {/* Section 19: Investment Returns */}
              <SectionCard
                id="investment-returns"
                title="19. Investment Returns (DCF/FCF/IRR)"
                icon={Landmark}
                expanded={expandedSections.has("investment-returns")}
                onToggle={() => toggleSection("investment-returns")}
                sectionRef={(el) => { sectionRefs.current["investment-returns"] = el; }}
              >
                <ManualTable
                  headers={["ID", "Formula Name", "Expression", "Notes"]}
                  rows={[
                    ["F-R-01", "FCF", "NOI − Tax − CapEx (FF&E)", "Unlevered free cash flow"],
                    ["F-R-02", "FCFE", "NOI − Debt Service − Tax", "Levered free cash flow to equity"],
                    ["F-R-03", "Equity Invested", "Total Cost − Loan Amount", "Initial equity contribution"],
                    ["F-R-04", "IRR", "Solve Σ(FCFE_t / (1+r)^t) = Equity₀", "Newton-Raphson iteration"],
                    ["F-R-05", "Exit Value", "Terminal NOI / Cap Rate", "Gross disposition value"],
                    ["F-R-06", "Net Exit Proceeds", "Gross − Commission − Debt", "Net cash from sale"],
                    ["F-R-07", "Equity Multiple", "Total Distributions / Equity", "MOIC"],
                  ]}
                />
              </SectionCard>

              {/* Section 20: Funding, Financing & Refinancing */}
              <SectionCard
                id="funding-financing"
                title="20. Funding, Financing & Refinancing Formulas"
                icon={DollarSign}
                expanded={expandedSections.has("funding-financing")}
                onToggle={() => toggleSection("funding-financing")}
                sectionRef={(el) => { sectionRefs.current["funding-financing"] = el; }}
              >
                <ManualTable
                  headers={["ID", "Formula Name", "Expression", "Notes"]}
                  rows={[
                    ["F-F-01", "Loan Amount", "Purchase Price × LTV", "Senior debt sizing"],
                    ["F-F-02", "PMT", "P × [r(1+r)^n / ((1+r)^n − 1)]", "Fixed monthly payment"],
                    ["F-F-03", "Interest", "Balance × Monthly Rate", "Monthly interest accrual"],
                    ["F-F-04", "Principal", "PMT − Interest", "Monthly principal reduction"],
                    ["F-F-05", "Refi Value", "Stabilized NOI / Cap Rate", "Property value at refinance"],
                    ["F-F-06", "Refi Loan", "Refi Value × Refi LTV", "New loan amount"],
                    ["F-F-07", "Refi Proceeds", "New Loan − Old Balance − Closing Costs", "Net cash from refinancing"],
                  ]}
                />
              </SectionCard>

              {/* Section 21: Glossary */}
              <SectionCard
                id="glossary"
                title="21. Glossary"
                icon={BookOpenCheck}
                expanded={expandedSections.has("glossary")}
                onToggle={() => toggleSection("glossary")}
                sectionRef={(el) => { sectionRefs.current["glossary"] = el; }}
              >
                <ManualTable
                  headers={["Term", "Definition", "Formula Ref", "Category"]}
                  rows={[
                    ["ADR (Average Daily Rate)", "Average revenue earned per occupied room per day", "F-P-03", "Revenue"],
                    ["Amortization", "Gradual repayment of loan principal over time via scheduled payments", "F-F-01", "Financing"],
                    ["ASC 230", "GAAP standard governing Statement of Cash Flows", "—", "Accounting Standard"],
                    ["ASC 360", "GAAP standard for property depreciation", "—", "Accounting Standard"],
                    ["ASC 470", "GAAP standard for debt accounting", "—", "Accounting Standard"],
                    ["ASC 810", "GAAP consolidation standard; inter-company elimination entries", "—", "Accounting Standard"],
                    ["ATCF (After-Tax Cash Flow)", "Cash remaining after operating expenses, debt service, and taxes", "F-R-02", "Returns"],
                    ["Balance Sheet", "Point-in-time snapshot of assets, liabilities, and equity", "—", "Financial Statement"],
                    ["Base Management Fee", "Percentage of total property revenue paid to management company", "F-C-01", "Fees"],
                    ["Boutique Hotel", "Independently owned, typically 10–80 rooms, with F&B and events", "—", "Property Type"],
                    ["Building Improvements", "Capital expenditures to improve property post-acquisition", "—", "Capital"],
                    ["Cap Rate", "NOI / Property Value; used to value income-producing real estate", "F-R-05", "Valuation"],
                    ["Cash from Financing (CFF)", "Cash flows from debt, equity, and distributions", "F-P-18", "Cash Flow"],
                    ["Cash from Investing (CFI)", "Cash flows from property acquisition/disposition", "F-P-17", "Cash Flow"],
                    ["Cash from Operations (CFO)", "Cash generated from core business operations", "F-P-16", "Cash Flow"],
                    ["Closing Costs", "Fees/expenses associated with finalizing a loan (% of loan amount)", "F-F-02", "Financing"],
                    ["DCF (Discounted Cash Flow)", "Valuation method summing present value of projected cash flows", "—", "Valuation"],
                    ["Debt Service", "Total loan payment combining interest and principal = PMT", "F-F-04", "Financing"],
                    ["Depreciable Basis", "Portion of property value subject to depreciation", "F-P-11", "Depreciation"],
                    ["Depreciation", "Non-cash expense allocating building cost over 27.5 years (straight-line)", "F-P-12", "Depreciation"],
                    ["DSCR", "Debt Service Coverage Ratio = NOI / Annual Debt Service", "—", "Financing"],
                    ["Equity Invested", "Total capital contributed by equity investors = Total Cost − Loan", "F-R-03", "Returns"],
                    ["Equity Multiple (MOIC)", "Total Distributions / Total Equity Invested", "F-R-04", "Returns"],
                    ["Exit Cap Rate", "Cap rate used to value property at disposition/sale", "F-R-05", "Valuation"],
                    ["Exit Proceeds", "Net cash at property sale = Gross Value − Commission − Debt", "F-R-06", "Returns"],
                    ["FCFE (Free Cash Flow to Equity)", "Cash available to equity holders after debt", "F-R-02", "Returns"],
                    ["FCF (Free Cash Flow)", "Cash from operations minus capital expenditures", "F-R-01", "Returns"],
                    ["FF&E", "Furniture, Fixtures & Equipment reserve (typically 4% of revenue)", "—", "Capital"],
                    ["Fiscal Year", "12-month accounting period; configurable start month", "—", "Accounting"],
                    ["GAAP", "Generally Accepted Accounting Principles (US framework)", "—", "Accounting Standard"],
                    ["GOP (Gross Operating Profit)", "Total Revenue − Total Operating Expenses", "F-P-08", "Profitability"],
                    ["Gross Disposition Value", "Property sale price = Terminal NOI / Exit Cap Rate", "F-R-05", "Valuation"],
                    ["HMA", "Hotel Management Agreement defining fee structure", "—", "Legal"],
                    ["Incentive Management Fee", "Performance-based fee calculated on GOP", "F-C-02", "Fees"],
                    ["Income Statement (P&L)", "Statement showing revenue, expenses, and net income over a period", "—", "Financial Statement"],
                    ["Inflation Rate", "Annual rate of general price increase; affects variable costs", "—", "Assumptions"],
                    ["IRR (Internal Rate of Return)", "Discount rate making NPV of cash flows equal to zero", "F-R-04", "Returns"],
                    ["Land Value Percent", "Portion of purchase price allocated to land (non-depreciable)", "—", "Depreciation"],
                    ["LTV (Loan-to-Value)", "Ratio of loan amount to property purchase price", "F-F-01", "Financing"],
                    ["Management Company", "Asset-light service entity earning fees from managed properties", "—", "Entity"],
                    ["MOIC", "Multiple on Invested Capital (see Equity Multiple)", "F-R-04", "Returns"],
                    ["Monthly Depreciation", "Depreciable Basis / 27.5 / 12", "F-P-12", "Depreciation"],
                    ["Net Income", "NOI − Interest − Depreciation − Income Tax", "F-P-14", "Profitability"],
                    ["NOI (Net Operating Income)", "GOP − Management Fees − FF&E Reserve", "F-P-10", "Profitability"],
                    ["Occupancy Rate", "Percentage of available rooms sold; ramps from start to max", "—", "Revenue"],
                    ["Operating Reserve", "Cash set aside for initial working capital needs", "—", "Capital"],
                    ["PMT", "Loan payment formula = P × [r(1+r)^n / ((1+r)^n − 1)]", "F-F-04", "Financing"],
                    ["Pre-Opening Costs", "Expenses before property begins operations", "—", "Capital"],
                    ["Pro Forma", "Projected financial statements based on assumptions", "—", "Financial Statement"],
                    ["Projection Period", "Number of years modeled (configurable, default 10)", "—", "Assumptions"],
                    ["Purchase Price", "Acquisition cost of the property asset", "—", "Capital"],
                    ["Refinancing", "Replacing existing debt with new loan, typically post-stabilization", "F-F-06", "Financing"],
                    ["Refi Proceeds", "Net cash from refinancing = New Loan − Old Balance − Costs", "F-F-07", "Financing"],
                    ["RevPAR", "Revenue Per Available Room = ADR × Occupancy", "—", "Revenue"],
                    ["Room Revenue", "ADR × Sold Rooms", "F-P-03", "Revenue"],
                    ["SAFE", "Simple Agreement for Future Equity — convertible instrument", "F-F-10", "Funding"],
                    ["Scenario", "Saved snapshot of all assumptions and property configurations", "—", "System"],
                    ["SPV (Special Purpose Vehicle)", "Legal entity isolating each property's financial risk", "—", "Legal"],
                    ["Stabilization", "Period when property reaches target occupancy (12–24 months)", "—", "Operations"],
                    ["Straight-Line Depreciation", "Equal depreciation expense each period over useful life", "—", "Depreciation"],
                    ["Terminal Year", "Final year of projection period; used for exit valuation", "—", "Valuation"],
                    ["Total Property Cost", "Purchase + Improvements + Pre-Opening + Reserve + Closing", "F-F-03", "Capital"],
                    ["USALI", "Uniform System of Accounts for the Lodging Industry", "—", "Accounting Standard"],
                    ["Variable Costs", "Operating expenses that scale with revenue/occupancy", "—", "Expenses"],
                  ]}
                />
              </SectionCard>
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
}