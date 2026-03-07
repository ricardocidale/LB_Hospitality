import { useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
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

const formatPercent = (value: number) => (value * 100).toFixed(1) + "%";

const PIE_COLORS = ["var(--primary)", "#257D41", "#3B82F6"];

const STAT_COLORS = ["#257D41", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444"];

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
  const statusColors: Record<string, string> = {
    Operating: "#257D41",
    Improvements: "#F59E0B",
    Acquired: "#3B82F6",
    "In Negotiation": "#8B5CF6",
    Pipeline: "#6B7280",
  };

  const kpis = [
    { label: "Total Properties", value: totalProperties.toString(), color: STAT_COLORS[0] },
    { label: "Total Rooms", value: totalRooms.toString(), color: STAT_COLORS[1] },
    { label: "Average ADR", value: formatMoney(avgAdr), color: STAT_COLORS[2] },
    { label: "Average Occupancy", value: formatPercent(avgOccupancy), color: STAT_COLORS[3] },
    { label: "Total Investment", value: formatMoney(totalInvestment), color: STAT_COLORS[4] },
  ];

  const handleExportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const kpiSheet = [["Metric", "Value"], ...kpis.map((k) => [k.label, k.value])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiSheet), "KPIs");
    const propSheet = [
      ["Name", "Location", "Market", "Rooms", "ADR", "Occupancy", "Status", "Investment"],
      ...properties.map((p) => [p.name, p.location, p.market, p.roomCount, formatMoney(p.startAdr), formatPercent(p.startOccupancy), p.status, formatMoney(p.purchasePrice + p.buildingImprovements)]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(propSheet), "Properties");
    XLSX.writeFile(wb, "executive-summary.xlsx");
  }, [kpis, properties]);

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
    kpis.forEach((kpi, i) => {
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
  }, [kpis, properties]);

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
    <div ref={pageRef} data-testid="executive-summary" style={styles.page}>
      <style>{printStyles}</style>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-6 no-print">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Executive Summary</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                A high-level overview of your entire portfolio — key metrics, market distribution, property status,
                and projected revenue trends. Use this as a printable one-page summary for investor presentations
                or board meetings. Click the print button to generate a clean PDF.
              </p>
            </div>
          </div>
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
        </div>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.companyName}>Hospitality Business Group</h1>
          <p style={styles.date}>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <h2 style={styles.title}>Executive Summary</h2>
      </div>

      <div style={styles.divider} />

      {/* KPI Row */}
      <div style={styles.kpiRow}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}
            style={{ ...styles.statCard, borderLeftColor: kpi.color }}
          >
            <div style={styles.statLabel}>{kpi.label}</div>
            <div style={styles.statValue}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={styles.chartsRow}>
        <div ref={chartRef} style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Portfolio by Market</h3>
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
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Properties by Status</h3>
          <div style={styles.statusList}>
            {statuses.map((status) => {
              const count = statusCounts[status] || 0;
              const pct = totalProperties > 0 ? (count / totalProperties) * 100 : 0;
              return (
                <div key={status} style={styles.statusRow}>
                  <div style={styles.statusLabel}>
                    <span
                      style={{
                        ...styles.statusDot,
                        backgroundColor: statusColors[status],
                      }}
                    />
                    {status}
                  </div>
                  <div style={styles.barContainer}>
                    <div
                      style={{
                        ...styles.bar,
                        width: `${pct}%`,
                        backgroundColor: statusColors[status],
                      }}
                    />
                  </div>
                  <span style={styles.statusCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Property Summary Table */}
      <div style={styles.tableCard}>
        <h3 style={styles.chartTitle}>Property Summary</h3>
        <table style={styles.table} data-testid="property-summary-table">
          <thead>
            <tr>
              {["Name", "Location", "Market", "Rooms", "ADR", "Occupancy", "Status", "Investment"].map((col) => (
                <th key={col} style={styles.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} data-testid={`property-row-${p.id}`}>
                <td style={styles.td}>{p.name}</td>
                <td style={styles.td}>{p.location}</td>
                <td style={styles.td}>{p.market}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{p.roomCount}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{formatMoney(p.startAdr)}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{formatPercent(p.startOccupancy)}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: statusColors[p.status] + "1A",
                      color: statusColors[p.status],
                    }}
                  >
                    {p.status}
                  </span>
                </td>
                <td style={{ ...styles.td, textAlign: "right" }}>
                  {formatMoney(p.purchasePrice + p.buildingImprovements)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: "#FFFDF7",
    minHeight: "100vh",
    padding: "32px 40px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    maxWidth: 1200,
    margin: "0 auto",
    color: "#1a1a1a",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  headerLeft: {},
  companyName: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: "#257D41",
  },
  date: {
    fontSize: 13,
    color: "#6b7280",
    margin: "4px 0 0",
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    color: "#374151",
  },
  divider: {
    height: 2,
    background: "linear-gradient(90deg, #257D41, var(--primary), transparent)",
    margin: "12px 0 24px",
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: "#ffffff",
    borderRadius: 8,
    padding: "16px 20px",
    borderLeft: "4px solid",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
  },
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 24,
  },
  chartCard: {
    background: "#ffffff",
    borderRadius: 8,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    margin: "0 0 16px",
  },
  statusList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    padding: "16px 0",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  statusLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
    width: 120,
    flexShrink: 0,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    display: "inline-block",
  },
  barContainer: {
    flex: 1,
    height: 24,
    background: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.3s ease",
    minWidth: 4,
  },
  statusCount: {
    fontSize: 16,
    fontWeight: 700,
    width: 24,
    textAlign: "right" as const,
  },
  tableCard: {
    background: "#ffffff",
    borderRadius: 8,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  },
  th: {
    textAlign: "left" as const,
    padding: "10px 12px",
    borderBottom: "2px solid #e5e7eb",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "#6b7280",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "middle" as const,
  },
  statusBadge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
};
