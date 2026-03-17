import { useRef, useCallback, useMemo, useState } from "react";
import { useExportSave } from "@/hooks/useExportSave";
import Layout from "@/components/Layout";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import { useStore } from "@/lib/store";
import { KPIGrid } from "@/components/graphics";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip as RechartsTooltip, PieChart, Pie, BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, ReferenceLine } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CurrentThemeTab } from "@/components/ui/tabs";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { exportTablePNG, captureChartAsImage } from "@/lib/exports/pngExport";
import { downloadCSV } from "@/lib/exports/csvExport";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { usePortfolioFinancials } from "@/components/dashboard";
import { getFiscalYearForModelYear } from "@/lib/financialEngine";
import { PROJECTION_YEARS } from "@/lib/constants";
// pptxgenjs is dynamically imported in export handler

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatPercent = (value: number) => (value * 100).toFixed(1) + "%";

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const PIE_EXPORT_COLORS = ["9FBCA4", "257D41", "3B82F6", "F59E0B", "8B5CF6"];

const STATUS_COLORS: Record<string, string> = {
  Operating: "bg-emerald-500",
  Improvements: "bg-amber-500",
  Acquired: "bg-blue-500",
  "In Negotiation": "bg-violet-500",
  Pipeline: "bg-slate-400",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Operating: "default",
  Improvements: "secondary",
  Acquired: "outline",
  "In Negotiation": "secondary",
  Pipeline: "outline",
};

interface WaterfallItem {
  name: string;
  value: number;
  base: number;
  fill: string;
  isSubtotal: boolean;
}

function buildWaterfallData(yearData: {
  revenueTotal: number;
  gop: number;
  agop: number;
  noi: number;
  anoi: number;
  feeBase: number;
  feeIncentive: number;
  expenseFFE: number;
}): WaterfallItem[] {
  const deptExpenses = yearData.revenueTotal - yearData.gop;
  const fees = yearData.feeBase + yearData.feeIncentive;
  const fixedCharges = yearData.agop - yearData.noi;
  const ffe = yearData.expenseFFE;

  const items: WaterfallItem[] = [];
  let running = yearData.revenueTotal;

  items.push({ name: "Total Revenue", value: running, base: 0, fill: "hsl(var(--chart-1))", isSubtotal: true });

  items.push({ name: "Dept. Expenses", value: deptExpenses, base: running - deptExpenses, fill: "hsl(var(--chart-2))", isSubtotal: false });
  running -= deptExpenses;

  items.push({ name: "GOP", value: running, base: 0, fill: "hsl(var(--chart-1))", isSubtotal: true });

  items.push({ name: "Mgmt Fees", value: fees, base: running - fees, fill: "hsl(var(--chart-4))", isSubtotal: false });
  running -= fees;

  items.push({ name: "IBFC", value: running, base: 0, fill: "hsl(var(--chart-1))", isSubtotal: true });

  items.push({ name: "Fixed Charges", value: fixedCharges, base: running - fixedCharges, fill: "hsl(var(--chart-5))", isSubtotal: false });
  running -= fixedCharges;

  items.push({ name: "NOI", value: running, base: 0, fill: "hsl(var(--chart-1))", isSubtotal: true });

  items.push({ name: "FF&E Reserve", value: ffe, base: running - ffe, fill: "hsl(var(--chart-2))", isSubtotal: false });
  running -= ffe;

  items.push({ name: "ANOI", value: running, base: 0, fill: "hsl(var(--primary))", isSubtotal: true });

  return items;
}

function WaterfallTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as WaterfallItem;
  if (!item) return null;
  return (
    <div className="rounded-md border bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-card-foreground">{item.name}</p>
      <p className="text-muted-foreground">
        {item.isSubtotal ? "" : "−"}{formatCompact(item.value)}
      </p>
    </div>
  );
}

export default function ExecutiveSummary() {
  const { properties } = useStore();
  const { data: apiProperties } = useProperties();
  const { data: global } = useGlobalAssumptions();
  const financials = usePortfolioFinancials(apiProperties, global);
  const pageRef = useRef<HTMLDivElement>(null);
  const { requestSave, SaveDialog } = useExportSave();
  const chartRef = useRef<HTMLDivElement>(null);
  const [waterfallYear, setWaterfallYear] = useState<string>("0");

  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const fiscalYearStartMonth = global?.fiscalYearStartMonth ?? 1;

  const yearTabs = useMemo(() => {
    const tabs = Array.from({ length: projectionYears }, (_, i) => {
      const fy = global?.modelStartDate
        ? getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, i)
        : `Year ${i + 1}`;
      return { value: String(i), label: String(fy) };
    });
    tabs.push({ value: "all", label: "Consolidated" });
    return tabs;
  }, [projectionYears, global?.modelStartDate, fiscalYearStartMonth]);

  const waterfallData = useMemo(() => {
    if (!financials?.yearlyConsolidatedCache?.length) return null;
    if (waterfallYear === "all") {
      const summed = financials.yearlyConsolidatedCache.reduce((acc, y) => ({
        revenueTotal: acc.revenueTotal + y.revenueTotal,
        gop: acc.gop + y.gop,
        agop: acc.agop + y.agop,
        noi: acc.noi + y.noi,
        anoi: acc.anoi + y.anoi,
        feeBase: acc.feeBase + y.feeBase,
        feeIncentive: acc.feeIncentive + y.feeIncentive,
        expenseFFE: acc.expenseFFE + y.expenseFFE,
      }), { revenueTotal: 0, gop: 0, agop: 0, noi: 0, anoi: 0, feeBase: 0, feeIncentive: 0, expenseFFE: 0 });
      return buildWaterfallData(summed);
    }
    const idx = Math.min(Number(waterfallYear), financials.yearlyConsolidatedCache.length - 1);
    return buildWaterfallData(financials.yearlyConsolidatedCache[idx]);
  }, [financials, waterfallYear]);

  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, p) => sum + p.roomCount, 0);
  const avgAdr =
    properties.length > 0
      ? properties.reduce((sum, p) => sum + p.startAdr, 0) / properties.length
      : 0;
  const avgOccupancy =
    properties.length > 0
      ? properties.reduce((sum, p) => sum + p.startOccupancy, 0) /
        properties.length
      : 0;
  const totalInvestment = properties.reduce(
    (sum, p) => sum + p.purchasePrice + p.buildingImprovements,
    0
  );

  const marketEntries = Object.entries(
    properties.reduce<Record<string, number>>((acc, p) => {
      acc[p.market] = (acc[p.market] || 0) + 1;
      return acc;
    }, {})
  );

  const marketData = marketEntries.map(([name, value], i) => ({
    market: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    value,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const marketChartConfig: ChartConfig = {
    value: { label: "Properties" },
    ...Object.fromEntries(
      marketEntries.map(([name], i) => [
        name.toLowerCase().replace(/\s+/g, "-"),
        { label: name, color: PIE_COLORS[i % PIE_COLORS.length] },
      ])
    ),
  };

  const statusCounts = properties.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const statuses = ["Operating", "Improvements", "Acquired", "In Negotiation", "Pipeline"] as const;

  const kpiValues = [
    { label: "Total Properties", value: totalProperties },
    { label: "Total Rooms", value: totalRooms },
    { label: "Average ADR", value: avgAdr, format: formatCompact },
    { label: "Average Occupancy", value: avgOccupancy * 100 },
    { label: "Total Investment", value: totalInvestment, format: formatCompact },
  ];

  const kpisForExport = [
    { label: "Total Properties", value: totalProperties.toString() },
    { label: "Total Rooms", value: totalRooms.toString() },
    { label: "Average ADR", value: formatMoney(avgAdr) },
    { label: "Average Occupancy", value: formatPercent(avgOccupancy) },
    { label: "Total Investment", value: formatMoney(totalInvestment) },
  ];

  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handleExportCSV = useCallback((customFilename?: string) => {
    const rows = [
      ["Name", "Location", "Market", "Rooms", "ADR", "Occupancy", "Status", "Investment"],
      ...properties.map((p) => [p.name, p.location, p.market, String(p.roomCount), formatMoney(p.startAdr), formatPercent(p.startOccupancy), p.status, formatMoney(p.purchasePrice + p.buildingImprovements)]),
    ];
    const content = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadCSV(content, customFilename || "executive-summary.csv");
  }, [properties]);

  const handleExportPPTX = useCallback(async (customFilename?: string) => {
    const { default: pptxgen } = await import("pptxgenjs");
    const pres = new pptxgen();
    pres.layout = "LAYOUT_WIDE";

    const slide = pres.addSlide();
    slide.background = { color: "FFFFFF" };

    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.04, fill: { color: "9FBCA4" } });

    slide.addText("Executive Summary", { x: 0.5, y: 0.2, w: 8, h: 0.4, fontSize: 20, fontFace: "Arial", color: "2D4A5E", bold: true });
    slide.addText(dateStr, { x: 0.5, y: 0.55, w: 8, h: 0.25, fontSize: 10, fontFace: "Arial", color: "6B7280" });
    slide.addText("Hospitality Business Group", { x: 8.5, y: 0.2, w: 4.5, h: 0.4, fontSize: 12, fontFace: "Arial", color: "9FBCA4", align: "right" });

    const kpiY = 1.0;
    const kpiW = 2.3;
    const kpiGap = 0.2;
    kpisForExport.forEach((kpi, i) => {
      const x = 0.5 + i * (kpiW + kpiGap);
      slide.addShape(pres.ShapeType.rect, { x, y: kpiY, w: kpiW, h: 0.9, fill: { color: "F8FAF9" }, line: { color: "E5E7EB", width: 0.5 }, rectRadius: 0.05 });
      slide.addText(kpi.value, { x, y: kpiY + 0.08, w: kpiW, h: 0.45, fontSize: 18, fontFace: "Arial", color: "257D41", bold: true, align: "center" });
      slide.addText(kpi.label, { x, y: kpiY + 0.52, w: kpiW, h: 0.3, fontSize: 8, fontFace: "Arial", color: "6B7280", align: "center" });
    });

    const midY = 2.15;
    slide.addText("Portfolio by Market", { x: 0.5, y: midY, w: 5.5, h: 0.3, fontSize: 11, fontFace: "Arial", color: "374151", bold: true });
    marketData.forEach((item, i) => {
      const rowY = midY + 0.35 + i * 0.3;
      const color = PIE_EXPORT_COLORS[i % PIE_EXPORT_COLORS.length];
      slide.addShape(pres.ShapeType.rect, { x: 0.7, y: rowY + 0.05, w: 0.15, h: 0.15, fill: { color }, rectRadius: 0.02 });
      slide.addText(`${item.name}  (${item.value})`, { x: 1.0, y: rowY, w: 4, h: 0.25, fontSize: 10, fontFace: "Arial", color: "374151" });
    });

    slide.addText("Properties by Status", { x: 7, y: midY, w: 5.5, h: 0.3, fontSize: 11, fontFace: "Arial", color: "374151", bold: true });
    const statusExportColors: Record<string, string> = { Operating: "257D41", Improvements: "F59E0B", Acquired: "3B82F6", "In Negotiation": "8B5CF6", Pipeline: "6B7280" };
    statuses.forEach((status, i) => {
      const count = statusCounts[status] || 0;
      const rowY = midY + 0.35 + i * 0.3;
      const color = statusExportColors[status];
      slide.addShape(pres.ShapeType.rect, { x: 7.2, y: rowY + 0.05, w: 0.15, h: 0.15, fill: { color }, rectRadius: 0.02 });
      slide.addText(`${status}`, { x: 7.5, y: rowY, w: 3, h: 0.25, fontSize: 10, fontFace: "Arial", color: "374151" });
      slide.addText(`${count}`, { x: 11, y: rowY, w: 1, h: 0.25, fontSize: 10, fontFace: "Arial", color: "374151", bold: true, align: "right" });
    });

    const tableY = midY + 2.0;
    slide.addText("Property Summary", { x: 0.5, y: tableY, w: 12, h: 0.3, fontSize: 11, fontFace: "Arial", color: "374151", bold: true });

    const headers = ["Name", "Location", "Market", "Rooms", "ADR", "Occupancy", "Status", "Investment"];
    const headerRow = headers.map((h) => ({ text: h, options: { bold: true, fill: { color: "2D4A5E" }, color: "FFFFFF", fontSize: 8, fontFace: "Arial" } }));
    const dataRows = properties.map((p, i) => {
      const bg = i % 2 === 0 ? "F8FAF9" : "FFFFFF";
      const opts = { fill: { color: bg }, fontSize: 8, fontFace: "Arial" };
      return [
        { text: p.name, options: opts },
        { text: p.location, options: opts },
        { text: p.market, options: opts },
        { text: String(p.roomCount), options: { ...opts, align: "right" as const } },
        { text: formatMoney(p.startAdr), options: { ...opts, align: "right" as const } },
        { text: formatPercent(p.startOccupancy), options: { ...opts, align: "right" as const } },
        { text: p.status, options: opts },
        { text: formatMoney(p.purchasePrice + p.buildingImprovements), options: { ...opts, align: "right" as const } },
      ];
    });

    slide.addTable(
      [headerRow, ...dataRows],
      { x: 0.5, y: tableY + 0.35, w: 12.5, autoPage: false, fontSize: 8, border: { type: "solid", color: "E5E7EB", pt: 0.5 } }
    );

    slide.addText(`Generated ${dateStr}`, { x: 0.5, y: 7.15, w: 12, h: 0.2, fontSize: 7, fontFace: "Arial", color: "9CA3AF", align: "center" });

    const pptxBlob = await pres.write({ outputType: "blob" }) as Blob;
    const { saveFile } = await import("@/lib/exports/saveFile");
    await saveFile(pptxBlob, customFilename || "executive-summary.pptx");
  }, [kpisForExport, properties, marketData, statusCounts, dateStr]);

  const handleExportPNG = useCallback((customFilename?: string) => {
    if (!pageRef.current) return;
    exportTablePNG({ element: pageRef.current, filename: customFilename || "executive-summary.png" });
  }, []);

  return (
    <Layout>
    <AnimatedPage>
      {SaveDialog}
      <div ref={pageRef} data-testid="executive-summary" className="space-y-6">
        <style>{printStyles}</style>

        <div className="no-print">
          <PageHeader
            title="Executive Summary"
            subtitle="Portfolio Overview"
            actions={
              <ExportMenu
                actions={[
                  pdfAction(() => window.print()),
                  csvAction(() => requestSave("Executive Summary", ".csv", (f) => handleExportCSV(f))),
                  pptxAction(() => requestSave("Executive Summary", ".pptx", (f) => handleExportPPTX(f))),
                  pngAction(() => requestSave("Executive Summary", ".png", (f) => handleExportPNG(f))),
                ]}
              />
            }
          />
        </div>

        <div className="print-header hidden">
          <div className="flex items-end justify-between border-b-2 border-primary/40 pb-2 mb-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Executive Summary</h1>
              <p className="text-xs text-muted-foreground">{dateStr}</p>
            </div>
            <p className="text-sm font-medium text-primary">Hospitality Business Group</p>
          </div>
        </div>

        <div className="print-kpi-row">
          <KPIGrid
            data-testid="kpi-executive-summary"
            items={kpiValues}
            columns={5}
            variant="glass"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 print-charts-row">
          <Card ref={chartRef} className="flex flex-col">
            <CardHeader className="items-center pb-0 print-card-header">
              <CardTitle className="text-sm font-semibold">Portfolio by Market</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              {marketData.length > 0 ? (
                <ChartContainer
                  config={marketChartConfig}
                  className="mx-auto aspect-square max-h-[280px]"
                >
                  <PieChart>
                    <Pie data={marketData} dataKey="value" nameKey="market" />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="market" />}
                      className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                    />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                  No properties to display
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="print-card-header">
              <CardTitle className="text-sm font-semibold">Properties by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 py-2">
                {statuses.map((status) => {
                  const count = statusCounts[status] || 0;
                  const pct = totalProperties > 0 ? (count / totalProperties) * 100 : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-[120px] shrink-0">{status}</span>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all duration-300 ${STATUS_COLORS[status] || "bg-primary/70"}`}
                          style={{ width: `${pct}%`, minWidth: count > 0 ? 4 : 0 }}
                        />
                      </div>
                      <span className="text-base font-bold font-mono tabular-nums w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {waterfallData && (
          <Card data-testid="usali-waterfall-card" className="print-waterfall-card">
            <CardHeader className="print-card-header pb-2">
              <CardTitle className="text-sm font-semibold">USALI Profit Waterfall</CardTitle>
              <p className="text-xs text-muted-foreground">Revenue cascade through operating expenses to net income (consolidated portfolio)</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <CurrentThemeTab
                tabs={yearTabs}
                activeTab={waterfallYear}
                onTabChange={setWaterfallYear}
              />
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={waterfallData} margin={{ top: 16, right: 16, bottom: 4, left: 8 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCompact(Math.abs(v))}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <RechartsTooltip content={<WaterfallTooltipContent />} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
                  <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]} isAnimationActive>
                    {waterfallData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} opacity={entry.isSubtotal ? 1 : 0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--chart-1))" }} />
                  Subtotals
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm opacity-75" style={{ background: "hsl(var(--chart-2))" }} />
                  Deductions
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--primary))" }} />
                  Net Result
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="print-table-card">
          <CardHeader className="print-card-header">
            <CardTitle className="text-sm font-semibold">Property Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table data-testid="property-summary-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs uppercase tracking-wider">Name</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Location</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Market</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-right">Rooms</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-right">ADR</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-right">Occupancy</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-right">Investment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((p) => (
                    <TableRow key={p.id} data-testid={`property-row-${p.id}`}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.location}</TableCell>
                      <TableCell>{p.market}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{p.roomCount}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatMoney(p.startAdr)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatPercent(p.startOccupancy)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[p.status] || "outline"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatMoney(p.purchasePrice + p.buildingImprovements)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>

        <p className="print-footer hidden text-center text-[9px] text-muted-foreground">
          Generated {dateStr}
        </p>
      </div>
    </AnimatedPage>
    </Layout>
  );
}

const printStyles = `
  @media print {
    @page {
      size: landscape;
      margin: 0.4in 0.5in;
    }

    body {
      background: white !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    nav, header, aside, footer,
    .no-print,
    [data-radix-scroll-area-viewport] + div {
      display: none !important;
    }

    [data-testid="executive-summary"] {
      background: white !important;
      padding: 0 !important;
      max-width: 100% !important;
      gap: 8px !important;
    }

    .print-header {
      display: block !important;
    }

    .print-footer {
      display: block !important;
    }

    .print-kpi-row > div {
      gap: 8px !important;
    }

    .print-kpi-row [class*="rounded"] {
      padding: 8px 12px !important;
      font-size: 11px !important;
    }

    .print-charts-row {
      grid-template-columns: 1fr 1fr !important;
      gap: 12px !important;
    }

    .print-card-header {
      padding: 8px 12px !important;
    }

    .print-table-card td,
    .print-table-card th {
      padding: 4px 8px !important;
      font-size: 9px !important;
    }

    .recharts-responsive-container {
      height: 160px !important;
    }
  }
`;
