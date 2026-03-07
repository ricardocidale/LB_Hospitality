import { useRef, useCallback } from "react";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import { useStore } from "@/lib/store";
import { KPIGrid } from "@/components/graphics";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { exportTablePNG, captureChartAsImage } from "@/lib/exports/pngExport";
import { downloadCSV } from "@/lib/exports/csvExport";
import * as XLSX from "xlsx";
import pptxgen from "pptxgenjs";

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

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Operating: "default",
  Improvements: "secondary",
  Acquired: "outline",
  "In Negotiation": "secondary",
  Pipeline: "outline",
};

export default function ExecutiveSummary() {
  const { properties } = useStore();
  const pageRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

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

  const marketData = Object.entries(
    properties.reduce<Record<string, number>>((acc, p) => {
      acc[p.market] = (acc[p.market] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

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

  const handleExportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const kpiSheet = [["Metric", "Value"], ...kpisForExport.map((k) => [k.label, k.value])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiSheet), "KPIs");
    const propSheet = [
      ["Name", "Location", "Market", "Rooms", "ADR", "Occupancy", "Status", "Investment"],
      ...properties.map((p) => [p.name, p.location, p.market, p.roomCount, formatMoney(p.startAdr), formatPercent(p.startOccupancy), p.status, formatMoney(p.purchasePrice + p.buildingImprovements)]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(propSheet), "Properties");
    XLSX.writeFile(wb, "executive-summary.xlsx");
  }, [kpisForExport, properties]);

  const handleExportCSV = useCallback(() => {
    const rows = [
      ["Name", "Location", "Market", "Rooms", "ADR", "Occupancy", "Status", "Investment"],
      ...properties.map((p) => [p.name, p.location, p.market, String(p.roomCount), formatMoney(p.startAdr), formatPercent(p.startOccupancy), p.status, formatMoney(p.purchasePrice + p.buildingImprovements)]),
    ];
    const content = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadCSV(content, "executive-summary.csv");
  }, [properties]);

  const handleExportPPTX = useCallback(() => {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_WIDE";
    const title = pres.addSlide();
    title.background = { color: "1a2a3a" };
    title.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.05, fill: { color: "9FBCA4" } });
    title.addText("Executive Summary", { x: 0.5, y: 1.8, w: 12, h: 0.7, fontSize: 32, fontFace: "Arial", color: "FFFFFF", bold: true });
    title.addText(`${properties.length} properties | ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}`, { x: 0.5, y: 2.6, w: 12, h: 0.4, fontSize: 14, fontFace: "Arial", color: "9FBCA4" });
    const kpiSlide = pres.addSlide();
    kpiSlide.addText("Portfolio KPIs", { x: 0.5, y: 0.3, w: 12, h: 0.5, fontSize: 18, fontFace: "Arial", color: "257D41", bold: true });
    kpisForExport.forEach((kpi, i) => {
      const x = 0.5 + (i % 3) * 4.2;
      const y = 1.0 + Math.floor(i / 3) * 1.8;
      kpiSlide.addShape(pres.ShapeType.rect, { x, y, w: 3.8, h: 1.4, fill: { color: "F5FCF7" }, line: { color: "9FBCA4", width: 1 } });
      kpiSlide.addText(kpi.value, { x, y: y + 0.15, w: 3.8, h: 0.7, fontSize: 22, fontFace: "Arial", color: "257D41", bold: true, align: "center" });
      kpiSlide.addText(kpi.label, { x, y: y + 0.85, w: 3.8, h: 0.4, fontSize: 11, fontFace: "Arial", color: "666666", align: "center" });
    });
    if (properties.length) {
      const tableSlide = pres.addSlide();
      tableSlide.addText("Property Summary", { x: 0.5, y: 0.3, w: 12, h: 0.5, fontSize: 18, fontFace: "Arial", color: "257D41", bold: true });
      tableSlide.addTable(
        [
          [{ text: "Name", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } }, { text: "Location", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } }, { text: "Rooms", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } }, { text: "ADR", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } }, { text: "Occupancy", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } }, { text: "Status", options: { bold: true, fill: { color: "257D41" }, color: "FFFFFF" } }],
          ...properties.map((p, i) => {
            const bg = i % 2 === 0 ? "F5FCF7" : "FFFFFF";
            return [{ text: p.name, options: { fill: { color: bg } } }, { text: p.location, options: { fill: { color: bg } } }, { text: String(p.roomCount), options: { fill: { color: bg } } }, { text: formatMoney(p.startAdr), options: { fill: { color: bg } } }, { text: formatPercent(p.startOccupancy), options: { fill: { color: bg } } }, { text: p.status, options: { fill: { color: bg } } }];
          }),
        ],
        { x: 0.5, y: 1.0, w: 12, h: 5.5, fontSize: 10, border: { type: "solid", color: "E5E7EB" } }
      );
    }
    pres.writeFile({ fileName: "executive-summary.pptx" });
  }, [kpisForExport, properties]);

  const handleExportChart = useCallback(async () => {
    if (!chartRef.current) return;
    const dataUrl = await captureChartAsImage(chartRef.current);
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "executive-summary-chart.png";
    link.click();
  }, []);

  const handleExportPNG = useCallback(() => {
    if (!pageRef.current) return;
    exportTablePNG({ element: pageRef.current, filename: "executive-summary.png" });
  }, []);

  return (
    <AnimatedPage>
      <div ref={pageRef} data-testid="executive-summary" className="space-y-6">
        <style>{printStyles}</style>

        <PageHeader
          title="Executive Summary"
          subtitle="Portfolio Overview"
          actions={
            <ExportMenu
              actions={[
                pdfAction(() => window.print()),
                excelAction(handleExportExcel),
                csvAction(handleExportCSV),
                pptxAction(handleExportPPTX),
                chartAction(handleExportChart),
                pngAction(handleExportPNG),
              ]}
            />
          }
        />

        <KPIGrid
          data-testid="kpi-executive-summary"
          items={kpiValues}
          columns={5}
          variant="glass"
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card ref={chartRef}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Portfolio by Market</CardTitle>
            </CardHeader>
            <CardContent>
              {marketData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={marketData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {marketData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                  No properties to display
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
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
                          className="h-full bg-primary/70 rounded transition-all duration-300"
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

        <Card>
          <CardHeader>
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
      </div>
    </AnimatedPage>
  );
}

const printStyles = `
  @media print {
    body { background: white !important; }
    [data-testid="executive-summary"] {
      background: white !important;
      padding: 0 !important;
      max-width: 100% !important;
    }
    nav, header, aside, footer, .no-print { display: none !important; }
    @page { margin: 0.5in; size: landscape; }
  }
`;
