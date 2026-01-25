import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowUpRight, Building2, TrendingUp, Wallet, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();

  if (propertiesLoading || globalLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!properties || !global) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">No data available. Please check the database.</p>
        </div>
      </Layout>
    );
  }

  const allPropertyFinancials = properties.map(p => {
    const financials = generatePropertyProForma(p, global, 12);
    const year1Total = financials.reduce((acc, m) => ({
      revenue: acc.revenue + m.revenueTotal,
      gop: acc.gop + m.gop,
      noi: acc.noi + m.noi
    }), { revenue: 0, gop: 0, noi: 0 });
    
    return { name: p.name, ...year1Total };
  });

  const portfolioTotalRevenue = allPropertyFinancials.reduce((acc, p) => acc + p.revenue, 0);
  const portfolioTotalGOP = allPropertyFinancials.reduce((acc, p) => acc + p.gop, 0);
  const activeProperties = properties.filter(p => p.status === "Operational" || p.status === "Development").length;
  const managementFees = (portfolioTotalRevenue * global.baseManagementFee) + (portfolioTotalGOP * global.incentiveManagementFee);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground mt-1">Portfolio overview & key performance indicators</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Model Start</p>
            <p className="text-lg font-medium">{format(new Date(global.modelStartDate), "MMMM yyyy")}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projected Revenue (Y1)</CardTitle>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMoney(portfolioTotalRevenue)}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <ArrowUpRight className="w-3 h-3 mr-1 text-accent" />
                Across {properties.length} assets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio GOP</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatMoney(portfolioTotalGOP)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {portfolioTotalRevenue > 0 ? `${((portfolioTotalGOP / portfolioTotalRevenue) * 100).toFixed(1)}%` : '0%'} Operating Margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Properties</CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProperties}</div>
              <p className="text-xs text-muted-foreground mt-1">
                of {properties.length} in portfolio
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Management Fees (Est)</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{formatMoney(managementFees)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue to L+B Co.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Property Performance (Year 1)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allPropertyFinancials}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => val.split(" ")[0]}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatMoney(value), ""]}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gop" name="GOP" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-primary-foreground">Capital Stack</CardTitle>
              <p className="text-sm text-primary-foreground/70">Equity vs Debt Distribution</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span>Total Project Cost</span>
                  <span className="font-medium">{formatMoney(properties.reduce((acc, p) => acc + p.purchasePrice + p.buildingImprovements, 0))}</span>
                </div>
                <div className="w-full bg-primary-foreground/20 rounded-full h-2">
                  <div className="bg-white h-full rounded-full w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-primary-foreground/80">Equity Required</span>
                  <span className="font-medium">{formatMoney(16850000)}</span>
                </div>
                <div className="w-full bg-primary-foreground/20 rounded-full h-2">
                  <div className="bg-white/70 h-full rounded-full w-[70%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-primary-foreground/80">Debt Financing</span>
                  <span className="font-medium">{formatMoney(4500000)}</span>
                </div>
                <div className="w-full bg-primary-foreground/20 rounded-full h-2">
                  <div className="bg-white/40 h-full rounded-full w-[30%]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
