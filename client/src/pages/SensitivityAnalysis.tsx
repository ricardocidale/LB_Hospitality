import { useState, useMemo, useCallback, useRef } from "react";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { PROJECTION_YEARS, DEFAULT_EXIT_CAP_RATE, DEFAULT_COMMISSION_RATE, DEFAULT_INFLATION_RATE, DEFAULT_COST_RATE_INSURANCE } from "@/lib/constants";
import { computeIRR } from "@analytics/returns/irr.js";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconSliders } from "@/components/icons";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AnimatedPage, ScrollReveal, InsightPanel, type Insight } from "@/components/graphics";
import { VariableSlidersPanel, TornadoChartPanel, SensitivityComparisonTable, type SensitivityVariable, type ScenarioResult, type TornadoItem } from "@/components/sensitivity";
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { ExportDialog } from "@/components/ExportDialog";
import { downloadCSV } from "@/lib/exports/csvExport";
import { exportTablePNG, captureChartAsImage } from "@/lib/exports/pngExport";
import { drawCanvasAsImage } from "@/lib/exports/pdfHelpers";
import SensitivityHeatMap, { type HeatMapCell, type SensitivityHeatMapRef } from "@/components/charts/SensitivityHeatMap";
import TornadoDiagram, { type TornadoVariable, type TornadoDiagramRef } from "@/components/charts/TornadoDiagram";
// jspdf, jspdf-autotable, pptxgenjs, xlsx are dynamically imported in export handlers

function calculateIRR(cashFlows: number[]): number {
  const result = computeIRR(cashFlows, 1);
  return result.irr_periodic ?? 0;
}

export default function SensitivityAnalysis({ embedded }: { embedded?: boolean }) {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [tornadoMetric, setTornadoMetric] = useState<"noi" | "irr">("irr");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<"pdf" | "chart">("pdf");
  const [advancedChartView, setAdvancedChartView] = useState<"sliders" | "heatmap" | "tornado-d3">("sliders");
  const [heatMapMetric, setHeatMapMetric] = useState<"irr" | "noi" | "equityMultiple">("irr");

  const chartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const tornadoD3Ref = useRef<TornadoDiagramRef>(null);
  const heatmapRef = useRef<SensitivityHeatMapRef>(null);

  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;

  const variables: SensitivityVariable[] = useMemo(() => {
    if (!global) return [];
    return [
      { id: "occupancy", label: "Max Occupancy", unit: "%", step: 1, range: [-20, 20], defaultValue: 0, description: "Adjust maximum occupancy rate up or down" },
      { id: "adrGrowth", label: "ADR Growth Rate", unit: "%", step: 0.5, range: [-5, 5], defaultValue: 0, description: "Adjust annual ADR growth rate" },
      { id: "expenseGrowth", label: "Expense Escalation", unit: "%", step: 0.5, range: [-3, 5], defaultValue: 0, description: "Adjust fixed cost escalation rate", tooltip: "Impacts properties using default inflation" },
      { id: "exitCapRate", label: "Exit Cap Rate", unit: "%", step: 0.25, range: [-3, 3], defaultValue: 0, description: "Adjust exit cap rate", tooltip: "Higher value = lower property valuation" },
      { id: "inflation", label: "Inflation Rate", unit: "%", step: 0.5, range: [-3, 5], defaultValue: 0, description: "Adjust general inflation rate", tooltip: "Impacts properties using default inflation" },
      { id: "interestRate", label: "Interest Rate", unit: "%", step: 0.25, range: [-3, 5], defaultValue: 0, description: "Adjust debt financing interest rate" },
      { id: "insuranceRate", label: "Insurance Rate", unit: "%", step: 0.25, range: [-1, 3], defaultValue: 0, description: "Adjust property insurance cost rate", tooltip: "Percentage of total property value charged annually for insurance" },
    ];
  }, [global]);

  const resetAll = useCallback(() => setAdjustments({}), []);

  const runScenario = useCallback(
    (overrides: Record<string, number>): ScenarioResult | null => {
      if (!properties || !global) return null;
      const targetProps =
        selectedPropertyId === "all"
          ? properties
          : properties.filter((p) => String(p.id) === selectedPropertyId);
      if (!targetProps.length) return null;

      let totalRevenue = 0;
      let totalNOI = 0;
      let totalCashFlow = 0;
      let exitValue = 0;
      let totalInitialEquity = 0;
      const annualCashFlows: number[] = new Array(projectionYears).fill(0);

      for (const prop of targetProps) {
        const adjProp = {
          ...prop,
          maxOccupancy: Math.min(1, Math.max(0.1, prop.maxOccupancy + (overrides.occupancy ?? 0) / 100)),
          startOccupancy: Math.min(
            Math.min(1, Math.max(0.1, prop.maxOccupancy + (overrides.occupancy ?? 0) / 100)),
            prop.startOccupancy
          ),
          adrGrowthRate: Math.max(0, prop.adrGrowthRate + (overrides.adrGrowth ?? 0) / 100),
          interestRate: Math.max(0.005, ((prop as any).interestRate ?? 0.065) + (overrides.interestRate ?? 0) / 100),
          costRateInsurance: Math.max(0, (prop.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE) + (overrides.insuranceRate ?? 0) / 100),
        };

        const adjGlobal = {
          ...global,
          inflationRate: Math.max(0, global.inflationRate + (overrides.inflation ?? 0) / 100),
          fixedCostEscalationRate: Math.max(
            0,
            (global.fixedCostEscalationRate ?? DEFAULT_INFLATION_RATE) + (overrides.expenseGrowth ?? 0) / 100
          ),
        };

        const financials = generatePropertyProForma(adjProp, adjGlobal, projectionMonths);

        for (let i = 0; i < financials.length; i++) {
          const m = financials[i];
          totalRevenue += m.revenueTotal;
          totalNOI += m.noi;
          totalCashFlow += m.cashFlow;
          const yearIdx = Math.floor(i / 12);
          if (yearIdx < projectionYears) {
            annualCashFlows[yearIdx] += m.cashFlow;
          }
        }

        const lastYearNOI = financials.slice(-12).reduce((sum, m) => sum + m.noi, 0);
        const capRate = Math.max(0.01, (prop.exitCapRate ?? global.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) + (overrides.exitCapRate ?? 0) / 100);
        const commissionRate = prop.dispositionCommission ?? DEFAULT_COMMISSION_RATE;
        const grossExit = lastYearNOI / capRate;
        const netExit = grossExit * (1 - commissionRate);
        const debtAtExit = financials[financials.length - 1]?.debtOutstanding ?? 0;
        exitValue += Math.max(0, netExit - debtAtExit);

        totalInitialEquity += prop.purchasePrice * (1 - ((prop as any).acquisitionLTV ?? 0));
      }

      const irrFlows = [-totalInitialEquity, ...annualCashFlows];
      irrFlows[irrFlows.length - 1] += exitValue;
      const irr = totalInitialEquity > 0 ? calculateIRR(irrFlows) : 0;
      const avgNOIMargin = totalRevenue > 0 ? (totalNOI / totalRevenue) * 100 : 0;
      return { totalRevenue, totalNOI, totalCashFlow, avgNOIMargin, exitValue, irr };
    },
    [properties, global, selectedPropertyId, projectionMonths]
  );

  const baseResult = useMemo(() => runScenario({}), [runScenario]);
  const adjustedResult = useMemo(() => runScenario(adjustments), [runScenario, adjustments]);

  const tornadoData: TornadoItem[] = useMemo(() => {
    if (!baseResult || !variables.length) return [];
    const items: TornadoItem[] = [];
    for (const v of variables) {
      const swingPct = v.id === "exitCapRate" ? 2 : v.id === "occupancy" ? 10 : v.id === "interestRate" ? 2 : 3;
      const upResult = runScenario({ [v.id]: swingPct });
      const downResult = runScenario({ [v.id]: -swingPct });
      if (!upResult || !downResult) continue;

      let upDelta: number, downDelta: number;
      if (tornadoMetric === "irr") {
        upDelta = (upResult.irr - baseResult.irr) * 100;
        downDelta = (downResult.irr - baseResult.irr) * 100;
      } else {
        const baseNOI = baseResult.totalNOI;
        upDelta = ((upResult.totalNOI - baseNOI) / Math.abs(baseNOI)) * 100;
        downDelta = ((downResult.totalNOI - baseNOI) / Math.abs(baseNOI)) * 100;
      }

      items.push({
        name: v.label,
        positive: Math.max(upDelta, downDelta),
        negative: Math.min(upDelta, downDelta),
        spread: Math.abs(upDelta - downDelta),
        upLabel: `+${swingPct}${v.unit === "%" ? "pp" : ""}`,
        downLabel: `-${swingPct}${v.unit === "%" ? "pp" : ""}`,
      });
    }
    return items.sort((a, b) => b.spread - a.spread);
  }, [baseResult, variables, runScenario, tornadoMetric]);

  const heatMapData = useMemo((): { cells: HeatMapCell[]; rowLabels: string[]; colLabels: string[] } => {
    if (!baseResult || !properties?.length || !global) return { cells: [], rowLabels: [], colLabels: [] };
    const occupancyShocks = [-10, -5, 0, 5, 10];
    const adrShocks = [-10, -5, 0, 5, 10];
    const rowLabels = occupancyShocks.map(s => `${s >= 0 ? "+" : ""}${s}% Occ`);
    const colLabels = adrShocks.map(s => `${s >= 0 ? "+" : ""}${s}% ADR`);
    const cells: HeatMapCell[] = [];

    for (let ri = 0; ri < occupancyShocks.length; ri++) {
      for (let ci = 0; ci < adrShocks.length; ci++) {
        const result = runScenario({
          occupancy: occupancyShocks[ri],
          adrGrowth: adrShocks[ci] / 2,
        });
        let value = 0;
        if (result) {
          if (heatMapMetric === "irr") value = result.irr;
          else if (heatMapMetric === "noi") value = result.totalNOI;
          else value = result.exitValue > 0 && result.totalRevenue > 0 ? result.totalNOI / result.totalRevenue : 0;
        }
        cells.push({
          row: ri,
          col: ci,
          rowLabel: rowLabels[ri],
          colLabel: colLabels[ci],
          value,
          passes: heatMapMetric === "irr" ? value >= 0.15 : value > 0,
        });
      }
    }
    return { cells, rowLabels, colLabels };
  }, [baseResult, properties, global, runScenario, heatMapMetric]);

  const tornadoD3Data = useMemo((): { variables: TornadoVariable[]; baseValue: number } => {
    if (!baseResult || !variables.length) return { variables: [], baseValue: 0 };
    const result: TornadoVariable[] = [];
    for (const v of variables) {
      const swingPct = v.id === "exitCapRate" ? 2 : v.id === "occupancy" ? 10 : v.id === "interestRate" ? 2 : 3;
      const upResult = runScenario({ [v.id]: swingPct });
      const downResult = runScenario({ [v.id]: -swingPct });
      if (!upResult || !downResult) continue;
      result.push({
        name: v.label,
        upside: tornadoMetric === "irr" ? upResult.irr : upResult.totalNOI,
        downside: tornadoMetric === "irr" ? downResult.irr : downResult.totalNOI,
        upsideLabel: `+${swingPct}${v.unit === "%" ? "pp" : ""}`,
        downsideLabel: `-${swingPct}${v.unit === "%" ? "pp" : ""}`,
      });
    }
    return {
      variables: result,
      baseValue: tornadoMetric === "irr" ? baseResult.irr : baseResult.totalNOI,
    };
  }, [baseResult, variables, runScenario, tornadoMetric]);

  const hasAdjustments = Object.values(adjustments).some((v) => v !== 0);

  const pctChange = (adjusted: number, base: number) => {
    if (base === 0) return 0;
    return ((adjusted - base) / Math.abs(base)) * 100;
  };

  // ── Export handlers ──────────────────────────────────────────────────────

  const comparisonRows = useMemo(() => {
    if (!baseResult || !adjustedResult) return [];
    return [
      { label: "Total Revenue", base: baseResult.totalRevenue, adj: adjustedResult.totalRevenue, fmt: "money" as const },
      { label: "Total NOI", base: baseResult.totalNOI, adj: adjustedResult.totalNOI, fmt: "money" as const },
      { label: "NOI Margin", base: baseResult.avgNOIMargin, adj: adjustedResult.avgNOIMargin, fmt: "pct" as const },
      { label: "Total Cash Flow", base: baseResult.totalCashFlow, adj: adjustedResult.totalCashFlow, fmt: "money" as const },
      { label: "Exit Value", base: baseResult.exitValue, adj: adjustedResult.exitValue, fmt: "money" as const },
      { label: "Levered IRR", base: baseResult.irr * 100, adj: adjustedResult.irr * 100, fmt: "pct" as const },
    ];
  }, [baseResult, adjustedResult]);

  const handleExportPDF = useCallback(async (orientation: "landscape" | "portrait") => {
    if (!baseResult) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
    const pageWidth = orientation === "landscape" ? 297 : 210;

    doc.setFontSize(20);
    doc.setTextColor(37, 125, 65);
    doc.text("Sensitivity Analysis", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Base IRR: ${(baseResult.irr * 100).toFixed(1)}%  |  Base NOI: ${formatMoney(baseResult.totalNOI)}  |  Exit Value: ${formatMoney(baseResult.exitValue)}`, 14, 26);

    if (comparisonRows.length) {
      doc.setFontSize(13);
      doc.setTextColor(40);
      doc.text("Base vs. Adjusted Scenario", 14, 36);
      autoTable(doc, {
        startY: 40,
        head: [["Metric", "Base Case", "Adjusted", "Change"]],
        body: comparisonRows.map((r) => {
          const delta = r.adj - r.base;
          const deltaPct = r.base !== 0 ? (delta / Math.abs(r.base)) * 100 : 0;
          const fmt = (v: number) => r.fmt === "money" ? formatMoney(v) : `${v.toFixed(1)}%`;
          return [
            r.label,
            fmt(r.base),
            fmt(r.adj),
            `${delta >= 0 ? "+" : ""}${r.fmt === "money" ? formatMoney(delta) : `${delta.toFixed(1)}pp`} (${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%)`,
          ];
        }),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [37, 125, 65], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 252, 247] },
        margin: { left: 14, right: 14 },
      });
    }

    if (tornadoData.length) {
      const finalY = (doc as any).lastAutoTable?.finalY ?? 80;
      doc.setFontSize(13);
      doc.setTextColor(40);
      doc.text(`Tornado Chart — Impact on ${tornadoMetric === "irr" ? "IRR (pp)" : "NOI (%)"}`, 14, finalY + 12);
      autoTable(doc, {
        startY: finalY + 16,
        head: [["Variable", "Upside", "Downside", "Spread"]],
        body: tornadoData.map((d) => [
          d.name,
          `${d.positive >= 0 ? "+" : ""}${d.positive.toFixed(2)}${tornadoMetric === "irr" ? "pp" : "%"}`,
          `${d.negative.toFixed(2)}${tornadoMetric === "irr" ? "pp" : "%"}`,
          `${d.spread.toFixed(2)}${tornadoMetric === "irr" ? "pp" : "%"}`,
        ]),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [37, 125, 65], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 252, 247] },
        margin: { left: 14, right: pageWidth - 14 - (pageWidth - 28) },
      });
    }

    if (advancedChartView === "heatmap" && heatmapRef.current) {
      try {
        const canvas = await heatmapRef.current.toCanvas();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.addPage();
        doc.setFontSize(12);
        doc.text("Sensitivity Heat Map \u2014 ADR \u00d7 Occupancy", 14, 14);
        drawCanvasAsImage(doc, canvas, 14, 22, pageWidth - 28, 180);
      } catch { /* ignore: chart may not be rendered yet */ }
    }
    if (advancedChartView === "tornado-d3" && tornadoD3Ref.current) {
      try {
        const canvas = await tornadoD3Ref.current.toCanvas();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.addPage();
        doc.setFontSize(12);
        doc.text("Tornado Diagram \u2014 Assumption Impact", 14, 14);
        drawCanvasAsImage(doc, canvas, 14, 22, pageWidth - 28, 180);
      } catch { /* ignore: chart may not be rendered yet */ }
    }

    doc.save("sensitivity-analysis.pdf");
  }, [baseResult, comparisonRows, tornadoData, tornadoMetric, advancedChartView]);

  const handleExportExcel = useCallback(async () => {
    if (!baseResult) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const compSheet = [
      ["Metric", "Base Case", "Adjusted", "Delta", "Delta %"],
      ...comparisonRows.map((r) => {
        const delta = r.adj - r.base;
        const deltaPct = r.base !== 0 ? (delta / Math.abs(r.base)) * 100 : 0;
        const fmt = (v: number) => r.fmt === "money" ? formatMoney(v) : `${v.toFixed(1)}%`;
        return [r.label, fmt(r.base), fmt(r.adj), `${delta >= 0 ? "+" : ""}${fmt(delta)}`, `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`];
      }),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(compSheet), "Comparison");

    const tornadoSheet = [
      ["Variable", `Upside (${tornadoMetric === "irr" ? "pp" : "%"})`, `Downside (${tornadoMetric === "irr" ? "pp" : "%"})`, `Spread (${tornadoMetric === "irr" ? "pp" : "%"})`],
      ...tornadoData.map((d) => [d.name, d.positive.toFixed(2), d.negative.toFixed(2), d.spread.toFixed(2)]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tornadoSheet), "Tornado Chart");

    XLSX.writeFile(wb, "sensitivity-analysis.xlsx");
  }, [baseResult, comparisonRows, tornadoData, tornadoMetric]);

  const handleExportCSV = useCallback(() => {
    if (!baseResult) return;
    const rows = [
      ["Metric", "Base Case", "Adjusted", "Delta", "Delta %"],
      ...comparisonRows.map((r) => {
        const delta = r.adj - r.base;
        const deltaPct = r.base !== 0 ? (delta / Math.abs(r.base)) * 100 : 0;
        const fmt = (v: number) => r.fmt === "money" ? formatMoney(v) : `${v.toFixed(1)}%`;
        return [r.label, fmt(r.base), fmt(r.adj), `${delta >= 0 ? "+" : ""}${fmt(delta)}`, `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`];
      }),
      [],
      [`Tornado Chart — Impact on ${tornadoMetric === "irr" ? "IRR (pp)" : "NOI (%)"}`],
      ["Variable", "Upside", "Downside", "Spread"],
      ...tornadoData.map((d) => [d.name, d.positive.toFixed(2), d.negative.toFixed(2), d.spread.toFixed(2)]),
    ];
    const content = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadCSV(content, "sensitivity-analysis.csv");
  }, [baseResult, comparisonRows, tornadoData, tornadoMetric]);

  const handleExportPPTX = useCallback(async () => {
    if (!baseResult) return;
    const { default: pptxgen } = await import("pptxgenjs");
    const pres = new pptxgen();
    pres.layout = "LAYOUT_WIDE";

    const title = pres.addSlide();
    title.background = { color: "1a2a3a" };
    title.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.05, fill: { color: "9FBCA4" } });
    title.addText("Sensitivity Analysis", { x: 0.5, y: 1.8, w: 12, h: 0.7, fontSize: 32, fontFace: "Arial", color: "FFFFFF", bold: true });
    title.addText(`Base IRR: ${(baseResult.irr * 100).toFixed(1)}%  |  NOI Margin: ${baseResult.avgNOIMargin.toFixed(1)}%  |  Exit Value: ${formatMoney(baseResult.exitValue)}`, { x: 0.5, y: 2.6, w: 12, h: 0.4, fontSize: 14, fontFace: "Arial", color: "9FBCA4" });

    if (comparisonRows.length) {
      const kpiSlide = pres.addSlide();
      kpiSlide.addText("Base vs. Adjusted Scenario", { x: 0.5, y: 0.3, w: 12, h: 0.5, fontSize: 18, fontFace: "Arial", color: "257D41", bold: true });
      kpiSlide.addTable(
        [
          [{ text: "Metric", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } },
           { text: "Base Case", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } },
           { text: "Adjusted", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } },
           { text: "Change", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } }],
          ...comparisonRows.map((r, i) => {
            const delta = r.adj - r.base;
            const deltaPct = r.base !== 0 ? (delta / Math.abs(r.base)) * 100 : 0;
            const fmt = (v: number) => r.fmt === "money" ? formatMoney(v) : `${v.toFixed(1)}%`;
            const bg = i % 2 === 0 ? "F5FCF7" : "FFFFFF";
            return [
              { text: r.label, options: { fill: { color: bg } } },
              { text: fmt(r.base), options: { fill: { color: bg } } },
              { text: fmt(r.adj), options: { fill: { color: bg }, bold: true } },
              { text: `${delta >= 0 ? "+" : ""}${fmt(delta)} (${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%)`, options: { fill: { color: bg }, color: delta > 0 ? "257D41" : delta < 0 ? "C0392B" : "666666" } },
            ];
          }),
        ],
        { x: 0.5, y: 1.0, w: 12, h: 4.5, fontSize: 11, border: { type: "solid", color: "E5E7EB" } }
      );
    }

    if (tornadoData.length) {
      const tornadoSlide = pres.addSlide();
      tornadoSlide.addText(`Tornado Chart — Impact on ${tornadoMetric === "irr" ? "IRR (pp)" : "NOI (%)"}`, { x: 0.5, y: 0.3, w: 12, h: 0.5, fontSize: 18, fontFace: "Arial", color: "257D41", bold: true });
      tornadoSlide.addTable(
        [
          [
            { text: "Variable", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } },
            { text: "Upside", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } },
            { text: "Downside", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } },
            { text: "Spread", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } },
          ],
          ...tornadoData.map((d, i) => {
            const bg = i % 2 === 0 ? "F5FCF7" : "FFFFFF";
            return [
              { text: d.name, options: { fill: { color: bg } } },
              { text: `+${d.positive.toFixed(2)}`, options: { fill: { color: bg }, color: "257D41" } },
              { text: d.negative.toFixed(2), options: { fill: { color: bg }, color: "C0392B" } },
              { text: d.spread.toFixed(2), options: { fill: { color: bg }, bold: true } },
            ];
          }),
        ],
        { x: 0.5, y: 1.0, w: 12, h: 5, fontSize: 11, border: { type: "solid", color: "E5E7EB" } }
      );
    }

    if (advancedChartView === "heatmap" && heatmapRef.current) {
      try {
        const canvas = await heatmapRef.current.toCanvas();
        const slide = pres.addSlide();
        slide.addText("Sensitivity Heat Map — ADR × Occupancy", { x: 0.5, y: 0.2, w: 12, h: 0.4, fontSize: 16, fontFace: "Arial", color: "257D41", bold: true });
        const dataUrl = canvas.toDataURL("image/png");
        const ar = canvas.width / canvas.height;
        const maxW = 12; const maxH = 6;
        let w = maxW; let h = maxW / ar;
        if (h > maxH) { h = maxH; w = maxH * ar; }
        slide.addImage({ data: dataUrl, x: (13.33 - w) / 2, y: 0.8, w, h });
      } catch { /* ignore: chart may not be rendered yet */ }
    }
    if (advancedChartView === "tornado-d3" && tornadoD3Ref.current) {
      try {
        const canvas = await tornadoD3Ref.current.toCanvas();
        const slide = pres.addSlide();
        slide.addText("Tornado Diagram — Assumption Impact", { x: 0.5, y: 0.2, w: 12, h: 0.4, fontSize: 16, fontFace: "Arial", color: "257D41", bold: true });
        const dataUrl = canvas.toDataURL("image/png");
        const ar = canvas.width / canvas.height;
        const maxW = 12; const maxH = 6;
        let w = maxW; let h = maxW / ar;
        if (h > maxH) { h = maxH; w = maxH * ar; }
        slide.addImage({ data: dataUrl, x: (13.33 - w) / 2, y: 0.8, w, h });
      } catch { /* ignore: chart may not be rendered yet */ }
    }

    pres.writeFile({ fileName: "sensitivity-analysis.pptx" });
  }, [baseResult, comparisonRows, tornadoData, tornadoMetric, advancedChartView]);

  const handleExportChart = useCallback(async (orientation: "landscape" | "portrait") => {
    if (!chartRef.current) return;
    const dataUrl = await captureChartAsImage(chartRef.current);
    if (!dataUrl) return;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
    const pageWidth = orientation === "landscape" ? 297 : 210;
    const pageHeight = orientation === "landscape" ? 210 : 297;
    doc.addImage(dataUrl, "PNG", 14, 14, pageWidth - 28, pageHeight - 28);
    doc.save("sensitivity-tornado-chart.pdf");
  }, []);

  const handleExportPNG = useCallback(() => {
    const el = tableRef.current ?? chartRef.current;
    if (!el) return;
    exportTablePNG({ element: el, filename: "sensitivity-analysis.png" });
  }, []);

  const handleExport = useCallback((orientation: "landscape" | "portrait") => {
    if (exportType === "pdf") handleExportPDF(orientation);
    else handleExportChart(orientation);
  }, [exportType, handleExportPDF, handleExportChart]);

  // ── Render ───────────────────────────────────────────────────────────────

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Layout;

  if (propertiesLoading || globalLoading) {
    return (
      <Wrapper>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
        </div>
      </Wrapper>
    );
  }

  if (!properties?.length || !global) {
    return (
      <Wrapper>
        <PageHeader title="Sensitivity Analysis" subtitle="Add properties to your portfolio first" />
      </Wrapper>
    );
  }

  const sensitivityInsights: Insight[] = (() => {
    if (!tornadoData.length || !baseResult) return [];
    const insights: Insight[] = [];
    const topVar = tornadoData[0];
    if (topVar) {
      insights.push({
        text: `${topVar.name} has the largest impact on ${tornadoMetric === "irr" ? "IRR" : "NOI"} with a spread of ${topVar.spread.toFixed(1)}${tornadoMetric === "irr" ? "pp" : "%"}`,
        type: "warning",
        metric: `±${(topVar.spread / 2).toFixed(1)}${tornadoMetric === "irr" ? "pp" : "%"}`,
      });
    }
    if (baseResult.irr > 0.15) {
      insights.push({ text: `Base case IRR of ${(baseResult.irr * 100).toFixed(1)}% exceeds typical institutional hurdle rates`, type: "positive" });
    } else if (baseResult.irr > 0) {
      insights.push({ text: `Base case IRR is ${(baseResult.irr * 100).toFixed(1)}%`, type: "neutral" });
    }
    if (baseResult.avgNOIMargin > 30) {
      insights.push({ text: `Strong NOI margin at ${baseResult.avgNOIMargin.toFixed(1)}% indicates healthy operations`, type: "positive" });
    }
    return insights;
  })();

  const exportMenuNode = (
    <ExportMenu
      variant="light"
      actions={[
        pdfAction(() => { setExportType("pdf"); setExportDialogOpen(true); }),
        excelAction(handleExportExcel),
        csvAction(handleExportCSV),
        pptxAction(handleExportPPTX),
        chartAction(() => { setExportType("chart"); setExportDialogOpen(true); }),
        pngAction(handleExportPNG),
      ]}
    />
  );

  return (
    <Wrapper>
      <AnimatedPage>
        <div className="space-y-8">
          {!embedded && (
            <PageHeader
              title="Sensitivity Analysis"
              subtitle="Stress test your portfolio against shifting market conditions and operational variables"
              actions={
                <div className="flex items-center gap-3">
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger className="w-[200px] bg-card border-border text-foreground rounded-lg text-sm" data-testid="select-property">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {exportMenuNode}
                </div>
              }
            />
          )}

          {/* KPI Summary Strip */}
          {baseResult && adjustedResult && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Base IRR</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-foreground">{(baseResult.irr * 100).toFixed(1)}%</span>
                {hasAdjustments && (
                  <span className={`text-xs font-bold ${(adjustedResult.irr - baseResult.irr) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    { (adjustedResult.irr - baseResult.irr) >= 0 ? "+" : "" }
                    {((adjustedResult.irr - baseResult.irr) * 100).toFixed(1)}pp
                  </span>
                )}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Base NOI</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-foreground">{formatMoney(baseResult.totalNOI)}</span>
                {hasAdjustments && (
                  <span className={`text-xs font-bold ${pctChange(adjustedResult.totalNOI, baseResult.totalNOI) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    { pctChange(adjustedResult.totalNOI, baseResult.totalNOI) >= 0 ? "+" : "" }
                    {pctChange(adjustedResult.totalNOI, baseResult.totalNOI).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Exit Value</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-foreground">{formatMoney(baseResult.exitValue)}</span>
                {hasAdjustments && (
                  <span className={`text-xs font-bold ${pctChange(adjustedResult.exitValue, baseResult.exitValue) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    { pctChange(adjustedResult.exitValue, baseResult.exitValue) >= 0 ? "+" : "" }
                    {pctChange(adjustedResult.exitValue, baseResult.exitValue).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Adjusted IRR</span>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-mono font-bold ${hasAdjustments ? (adjustedResult.irr >= baseResult.irr ? "text-emerald-600" : "text-red-600") : "text-foreground"}`}>
                  {(adjustedResult.irr * 100).toFixed(1)}%
                </span>
                {hasAdjustments && (
                  <Button 
                    variant="link"
                    size="sm"
                    onClick={resetAll}
                    className="text-[10px] font-bold text-primary hover:underline h-auto p-0"
                    data-testid="button-reset-kpi"
                  >
                    RESET
                  </Button>
                )}
              </div>
            </div>
          </div>}

          <div className="flex bg-muted/50 p-1 rounded-lg border border-border w-fit mb-4">
            <Button
              variant={advancedChartView === "sliders" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setAdvancedChartView("sliders")}
              className={`px-3 py-1.5 text-xs font-semibold ${advancedChartView === "sliders" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              data-testid="button-view-sliders"
            >
              Variable Sliders
            </Button>
            <Button
              variant={advancedChartView === "heatmap" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setAdvancedChartView("heatmap")}
              className={`px-3 py-1.5 text-xs font-semibold ${advancedChartView === "heatmap" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              data-testid="button-view-heatmap"
            >
              Sensitivity Heat Map
            </Button>
            <Button
              variant={advancedChartView === "tornado-d3" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setAdvancedChartView("tornado-d3")}
              className={`px-3 py-1.5 text-xs font-semibold ${advancedChartView === "tornado-d3" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              data-testid="button-view-tornado-d3"
            >
              Tornado Diagram
            </Button>
          </div>

          {advancedChartView === "sliders" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <VariableSlidersPanel
                  variables={variables}
                  adjustments={adjustments}
                  onAdjustmentChange={(id, value) => setAdjustments(prev => ({ ...prev, [id]: value }))}
                />
              </div>

              <div className="lg:col-span-8 space-y-8">
                <div ref={chartRef}>
                  <TornadoChartPanel
                    tornadoData={tornadoData}
                    tornadoMetric={tornadoMetric}
                    onMetricChange={setTornadoMetric}
                  />
                </div>

                <div ref={tableRef}>
                  <SensitivityComparisonTable baseResult={baseResult!} adjustedResult={adjustedResult!} />
                </div>
              </div>
            </div>
          )}

          {advancedChartView === "heatmap" && (
            <div className="space-y-4">
              <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground" data-testid="text-heatmap-title">
                      Sensitivity Heat Map
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      ADR growth × Occupancy scenario grid — color-coded by outcome
                    </p>
                  </div>
                  <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
                    {(["irr", "noi", "equityMultiple"] as const).map((m) => (
                      <Button
                        key={m}
                        variant={heatMapMetric === m ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setHeatMapMetric(m)}
                        className={`px-3 py-1.5 text-xs font-semibold ${heatMapMetric === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                        data-testid={`button-heatmap-metric-${m}`}
                      >
                        {m === "irr" ? "IRR" : m === "noi" ? "NOI" : "NOI Margin"}
                      </Button>
                    ))}
                  </div>
                </div>
                <SensitivityHeatMap
                  ref={heatmapRef}
                  cells={heatMapData.cells}
                  rowLabels={heatMapData.rowLabels}
                  colLabels={heatMapData.colLabels}
                  rowAxisLabel="Occupancy Shock"
                  colAxisLabel="ADR Growth Shock"
                  valueLabel={heatMapMetric === "irr" ? "IRR" : heatMapMetric === "noi" ? "NOI" : "NOI Margin"}
                  breakeven={heatMapMetric === "irr" ? 0.15 : heatMapMetric === "noi" ? 0 : 0.3}
                  valueFormat={
                    heatMapMetric === "irr"
                      ? (v) => `${(v * 100).toFixed(1)}%`
                      : heatMapMetric === "noi"
                        ? (v) => {
                            const abs = Math.abs(v);
                            if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
                            if (abs >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
                            return `$${v.toFixed(0)}`;
                          }
                        : (v) => `${(v * 100).toFixed(1)}%`
                  }
                />
              </div>
            </div>
          )}

          {advancedChartView === "tornado-d3" && tornadoD3Data.variables.length > 0 && (
            <div className="space-y-4">
              <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground" data-testid="text-tornado-d3-title">
                      Assumption Impact Ranking
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Variables sorted by magnitude of impact on {tornadoMetric === "irr" ? "IRR" : "NOI"} — each tested at ±10%
                    </p>
                  </div>
                  <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
                    <Button
                      variant={tornadoMetric === "irr" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setTornadoMetric("irr")}
                      className={`px-3 py-1.5 text-xs font-semibold ${tornadoMetric === "irr" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                      data-testid="button-tornado-d3-irr"
                    >
                      IRR
                    </Button>
                    <Button
                      variant={tornadoMetric === "noi" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setTornadoMetric("noi")}
                      className={`px-3 py-1.5 text-xs font-semibold ${tornadoMetric === "noi" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                      data-testid="button-tornado-d3-noi"
                    >
                      NOI
                    </Button>
                  </div>
                </div>
                <TornadoDiagram
                  ref={tornadoD3Ref}
                  variables={tornadoD3Data.variables}
                  baseValue={tornadoD3Data.baseValue}
                  metricLabel={tornadoMetric === "irr" ? "IRR" : "NOI"}
                  metricFormat={
                    tornadoMetric === "irr"
                      ? (v) => `${(v * 100).toFixed(1)}%`
                      : (v) => {
                          const abs = Math.abs(v);
                          if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
                          if (abs >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
                          return `$${v.toFixed(0)}`;
                        }
                  }
                />
              </div>
            </div>
          )}

          <InsightPanel insights={sensitivityInsights} />
        </div>
      </AnimatedPage>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        title={exportType === "pdf" ? "Export Sensitivity Analysis" : "Export Tornado Chart"}
      />
    </Wrapper>
  );
}
