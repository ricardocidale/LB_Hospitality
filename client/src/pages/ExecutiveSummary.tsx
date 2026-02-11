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

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => (value * 100).toFixed(1) + "%";

const PIE_COLORS = ["#9FBCA4", "#257D41", "#3B82F6"];

const STAT_COLORS = ["#257D41", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444"];

export default function ExecutiveSummary() {
  const { properties } = useStore();

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

  const statuses = ["Operational", "Development", "Acquisition"] as const;
  const statusColors: Record<string, string> = {
    Operational: "#257D41",
    Development: "#F59E0B",
    Acquisition: "#3B82F6",
  };

  const kpis = [
    { label: "Total Properties", value: totalProperties.toString(), color: STAT_COLORS[0] },
    { label: "Total Rooms", value: totalRooms.toString(), color: STAT_COLORS[1] },
    { label: "Average ADR", value: formatMoney(avgAdr), color: STAT_COLORS[2] },
    { label: "Average Occupancy", value: formatPercent(avgOccupancy), color: STAT_COLORS[3] },
    { label: "Total Investment", value: formatMoney(totalInvestment), color: STAT_COLORS[4] },
  ];

  return (
    <div data-testid="executive-summary" style={styles.page}>
      <style>{printStyles}</style>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-6 no-print">
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
        <div style={styles.chartCard}>
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
    background: "linear-gradient(90deg, #257D41, #9FBCA4, transparent)",
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
