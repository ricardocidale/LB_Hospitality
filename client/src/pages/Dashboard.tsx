import Layout from "@/components/Layout";
import { useStore, formatCurrency, calculateAnnualRevenue, calculateGOP } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Users, Building, DollarSign, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { properties, companyStats } = useStore();

  const totalPortfolioRevenue = properties.reduce((acc, prop) => acc + calculateAnnualRevenue(prop), 0);
  const totalPortfolioGOP = totalPortfolioRevenue * 0.35; // Approx 35% margin
  const activeProperties = properties.filter(p => p.status === "Operational" || p.status === "Acquisition").length;

  const chartData = properties.map(p => ({
    name: p.name.split(" ")[0], // Short name
    revenue: calculateAnnualRevenue(p),
    gop: calculateGOP(calculateAnnualRevenue(p)),
  }));

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-serif text-primary mb-2">Executive Overview</h2>
          <p className="text-muted-foreground max-w-2xl">
            Real-time performance metrics across the L+B Hospitality portfolio and management operations.
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Revenue (Est)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{formatCurrency(totalPortfolioRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Annualized based on current ADR
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-accent shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Active Properties
              </CardTitle>
              <Building className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{activeProperties} <span className="text-lg text-muted-foreground font-sans font-normal">/ {properties.length}</span></div>
              <p className="text-xs text-muted-foreground mt-1">
                {properties.filter(p => p.status === "Development").length} in development
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-chart-3 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Management FTEs
              </CardTitle>
              <Users className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{companyStats.totalFTE}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {companyStats.clients} clients
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-chart-4 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Portfolio GOP
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{formatCurrency(totalPortfolioGOP)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ~35% Operating Margin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart Section */}
        <div className="grid gap-6 md:grid-cols-7">
          <Card className="col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif">Portfolio Performance</CardTitle>
              <CardDescription>Projected Annual Revenue vs. GOP by Property</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value / 1000000}M`}
                    />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        boxShadow: 'var(--shadow-lg)'
                      }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="gop" name="GOP" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3 shadow-sm bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-primary-foreground font-serif">Management Fees</CardTitle>
              <CardDescription className="text-primary-foreground/70">Projected Income for L+B Co.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-4">
                  <div>
                    <p className="text-sm font-medium text-primary-foreground/70">Base Fee (4%)</p>
                    <p className="text-2xl font-bold font-serif">{formatCurrency(totalPortfolioRevenue * 0.04)}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                    <span className="text-xs font-bold">4%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-4">
                  <div>
                    <p className="text-sm font-medium text-primary-foreground/70">Incentive Fee (10% of GOP)</p>
                    <p className="text-2xl font-bold font-serif">{formatCurrency(totalPortfolioGOP * 0.10)}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                    <span className="text-xs font-bold">10%</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm font-medium text-primary-foreground/70 mb-1">Total Management Income</p>
                  <p className="text-4xl font-bold font-serif text-accent">{formatCurrency((totalPortfolioRevenue * 0.04) + (totalPortfolioGOP * 0.10))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
