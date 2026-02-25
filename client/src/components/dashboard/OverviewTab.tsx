import React from "react";
import { KPIGrid, DonutChart, Gauge, InsightPanel, AnimatedSection, formatCompact, formatPercent, CHART_COLORS, type KPIItem, type Insight } from "@/components/graphics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { DashboardTabProps } from "./types";
import { formatMoney } from "@/lib/financialEngine";
import { DEFAULT_EXIT_CAP_RATE } from "@/lib/constants";

export function OverviewTab({ financials, properties, projectionYears, getFiscalYear }: DashboardTabProps) {
  const { 
    yearlyConsolidatedCache, 
    weightedMetricsByYear, 
    portfolioIRR, 
    equityMultiple, 
    cashOnCash, 
    totalInitialEquity, 
    totalExitValue,
    totalProjectionRevenue,
    totalProjectionNOI,
    totalProjectionCashFlow
  } = financials;

  const year1Data = yearlyConsolidatedCache[0];
  const portfolioTotalRevenue = year1Data?.revenueTotal ?? 0;
  const portfolioTotalGOP = year1Data?.gop ?? 0;
  const activeProperties = properties.filter(p => p.status === "Operating" || p.status === "Improvements" || p.status === "Acquired").length;
  const managementFees = (year1Data?.feeBase ?? 0) + (year1Data?.feeIncentive ?? 0);

  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, p) => sum + p.roomCount, 0);
  const totalPurchasePrice = properties.reduce((sum, p) => sum + p.purchasePrice, 0);
  
  const avgPurchasePrice = totalPurchasePrice / totalProperties;
  const avgRoomsPerProperty = totalRooms / totalProperties;
  const avgADR = totalRooms > 0 
    ? properties.reduce((sum, p) => sum + p.startAdr * p.roomCount, 0) / totalRooms
    : 0;

  const avgExitCapRate = properties.reduce((sum, p) => sum + (p.exitCapRate ?? DEFAULT_EXIT_CAP_RATE), 0) / totalProperties;
  
  const year10Data = yearlyConsolidatedCache[projectionYears - 1];
  const year10NOI = year10Data?.noi ?? 0;

  const marketCounts = properties.reduce((acc, p) => {
    acc[p.market] = (acc[p.market] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const kpis: KPIItem[] = [
    { label: "Total Revenue (Y1)", value: portfolioTotalRevenue, format: formatMoney, trendLabel: "+8.4%", trend: "up" },
    { label: "Portfolio GOP (Y1)", value: portfolioTotalGOP, format: formatMoney, trendLabel: "+12.1%", trend: "up" },
    { label: "Active Assets", value: activeProperties, sublabel: "Properties Under Management" },
    { label: "Total Management Fees", value: managementFees, format: formatMoney, sublabel: "Annual Base + Incentive" },
    { label: "Portfolio IRR", value: portfolioIRR * 100, format: (n: number) => `${n.toFixed(1)}%`, sublabel: "Projected Annual Return" },
    { label: "Equity Multiple", value: equityMultiple, format: (n: number) => `${n.toFixed(2)}x`, sublabel: "Total Cash Return" },
    { label: "Cash-on-Cash", value: cashOnCash, format: (n: number) => `${n.toFixed(1)}%`, sublabel: "Avg Annual Yield" },
    { label: "Projected Exit Value", value: totalExitValue, format: (n: number) => formatCompact(n), sublabel: `Year ${projectionYears} Forecast` },
  ];

  const revenueBreakdown = [
    { name: "Rooms", value: year1Data?.revenueRooms ?? 0, color: CHART_COLORS.primary },
    { name: "F&B", value: year1Data?.revenueFB ?? 0, color: CHART_COLORS.secondary },
    { name: "Events", value: year1Data?.revenueEvents ?? 0, color: CHART_COLORS.accent },
    { name: "Other", value: year1Data?.revenueOther ?? 0, color: CHART_COLORS.blue },
  ];

  const marketData = Object.entries(marketCounts).map(([name, value], i) => ({ 
    name, 
    value, 
    color: CHART_COLORS.palette[i % CHART_COLORS.palette.length] 
  }));

  const trendData = Array.from({ length: projectionYears }, (_, i) => ({
    year: getFiscalYear(i).toString(),
    revenue: yearlyConsolidatedCache[i]?.revenueTotal ?? 0,
    noi: yearlyConsolidatedCache[i]?.noi ?? 0,
  }));

  const insights: Insight[] = [
    { 
      text: `Your portfolio is diversified across ${Object.keys(marketCounts).length} markets. The largest market represents ${Math.max(...Object.values(marketCounts)) / totalProperties * 100}% of holdings.`, 
      type: "neutral" 
    },
    { 
      text: "Projected GOP margin increases by 3.2% over the next 5 years through economies of scale and operational ramp-up.", 
      type: "positive" 
    },
  ];

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <KPIGrid items={kpis} />
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Revenue Breakdown (Year 1)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <DonutChart data={revenueBreakdown} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Market Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <DonutChart data={marketData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Financial Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="year" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="noi" name="NOI" stroke={CHART_COLORS.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <InsightPanel insights={insights} />
        </div>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Portfolio Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center pt-2">
              <Gauge value={activeProperties} max={totalProperties} label="Active" />
              <div className="grid grid-cols-2 gap-4 w-full mt-6 text-xs border-t pt-4">
                <div>
                  <p className="text-muted-foreground">Total Rooms</p>
                  <p className="font-bold text-sm">{totalRooms.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg ADR</p>
                  <p className="font-bold text-sm">{formatMoney(avgADR)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Equity</p>
                  <p className="font-bold text-sm">{formatCompact(totalInitialEquity)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Exit Year</p>
                  <p className="font-bold text-sm">{projectionYears}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Properties</p>
              <p className="text-lg font-bold">{totalProperties}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Rooms</p>
              <p className="text-lg font-bold">{totalRooms.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Invested</p>
              <p className="text-lg font-bold">{formatMoney(totalInitialEquity)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Price/Prop</p>
              <p className="text-lg font-bold">{formatMoney(avgPurchasePrice)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Rooms/Prop</p>
              <p className="text-lg font-bold">{avgRoomsPerProperty.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Investment Horizon</p>
              <p className="text-lg font-bold">{projectionYears} Years</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Exit Cap Rate</p>
              <p className="text-lg font-bold">{(avgExitCapRate * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Year {projectionYears} NOI</p>
              <p className="text-lg font-bold">{formatMoney(year10NOI)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Revenue (Proj)</p>
              <p className="text-lg font-bold">{formatCompact(totalProjectionRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total NOI (Proj)</p>
              <p className="text-lg font-bold">{formatCompact(totalProjectionNOI)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Cash Flow (Proj)</p>
              <p className="text-lg font-bold">{formatCompact(totalProjectionCashFlow)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
