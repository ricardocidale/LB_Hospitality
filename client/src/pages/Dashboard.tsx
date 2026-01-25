import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Loader2, Users } from "lucide-react";

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
          <p className="text-muted-foreground">No data available</p>
        </div>
      </Layout>
    );
  }

  const years = 10;
  const annualData: { year: string; revenue: number; costs: number; ebitda: number }[] = [];
  const serviceData: { year: string; marketing: number; accounting: number; it: number; hr: number; management: number }[] = [];
  
  for (let y = 0; y < years; y++) {
    let yearRevenue = 0;
    let yearCosts = 0;
    
    properties.forEach(p => {
      const financials = generatePropertyProForma(p, global, 120);
      const yearMonths = financials.slice(y * 12, (y + 1) * 12);
      yearMonths.forEach(m => {
        yearRevenue += m.feeBase + m.feeIncentive;
        yearCosts += m.revenueTotal * 0.15;
      });
    });

    const marketing = yearRevenue * 0.20;
    const accounting = yearRevenue * 0.20;
    const it = yearRevenue * 0.20;
    const hr = yearRevenue * 0.20;
    const management = yearRevenue * 0.20;

    annualData.push({
      year: `Y${y + 1}`,
      revenue: yearRevenue,
      costs: yearCosts,
      ebitda: yearRevenue - yearCosts
    });

    serviceData.push({
      year: `Y${y + 1}`,
      marketing,
      accounting,
      it,
      hr,
      management
    });
  }

  const totalRevenue = annualData.reduce((acc, y) => acc + y.revenue, 0);
  const totalEbitda = annualData.reduce((acc, y) => acc + y.ebitda, 0);
  const avgMargin = totalRevenue > 0 ? (totalEbitda / totalRevenue) * 100 : 0;

  const incomeStatement = [
    { category: "Revenue", isHeader: true },
    { item: "Marketing & Sales Fees", values: annualData.map(y => y.revenue * 0.20) },
    { item: "Accounting Fees", values: annualData.map(y => y.revenue * 0.20) },
    { item: "IT Services Fees", values: annualData.map(y => y.revenue * 0.20) },
    { item: "HR Services Fees", values: annualData.map(y => y.revenue * 0.20) },
    { item: "Management Support Fees", values: annualData.map(y => y.revenue * 0.20) },
    { item: "Total Revenue", values: annualData.map(y => y.revenue), isTotal: true },
    { category: "Operating Expenses", isHeader: true },
    { subcategory: "Payroll & Personnel", isSubHeader: true },
    { item: "Partner Salaries", values: annualData.map((_, i) => global.partnerSalary * 3 * Math.pow(1.03, i)) },
    { item: "Staff Salaries", values: annualData.map((_, i) => global.staffSalary * 4 * Math.pow(1.03, i)) },
    { item: "Contractor Costs", values: annualData.map(y => y.revenue * 0.10) },
    { item: "Subtotal Payroll", values: annualData.map((y, i) => (global.partnerSalary * 3 + global.staffSalary * 4) * Math.pow(1.03, i) + y.revenue * 0.10), isSubtotal: true },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">L+B Hospitality Group</h2>
            <p className="text-muted-foreground text-sm">Hospitality Management Company Financial Overview</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>3 Partners • 4 Staff</span>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-foreground">{formatMoney(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Revenue</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-foreground">{formatMoney(totalEbitda)}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total EBITDA</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-foreground">{avgMargin.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Avg EBITDA Margin</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-foreground">$750K</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">SAFE Funding</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-foreground">{properties.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Active Clients</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-muted-foreground">N/A</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Break-Even</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Revenue vs Costs vs EBITDA</CardTitle>
              <p className="text-xs text-muted-foreground">Annual</p>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={annualData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: number, name: string) => [formatMoney(value), name]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="costs" name="Costs" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Revenue by Service Category</CardTitle>
              <p className="text-xs text-muted-foreground">Annual</p>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serviceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: number, name: string) => [formatMoney(value), name]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="marketing" name="Marketing & Sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="accounting" name="Accounting" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="it" name="IT Services" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="hr" name="HR Services" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="management" name="Management" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Annual Income Statement</CardTitle>
            <p className="text-xs text-muted-foreground">Detailed P&L</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="financial-table">
              <thead>
                <tr>
                  <th className="min-w-[180px]">LINE ITEM</th>
                  {annualData.map((_, i) => (
                    <th key={i} className="min-w-[80px]">{2026 + i}</th>
                  ))}
                  <th className="min-w-[90px]">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {incomeStatement.map((row, idx) => {
                  if (row.isHeader) {
                    return (
                      <tr key={idx}>
                        <td colSpan={12} className="section-header">{row.category}</td>
                      </tr>
                    );
                  }
                  if (row.isSubHeader) {
                    return (
                      <tr key={idx}>
                        <td colSpan={12} className="subsection-header">{row.subcategory}</td>
                      </tr>
                    );
                  }
                  const total = row.values?.reduce((a, b) => a + b, 0) || 0;
                  return (
                    <tr key={idx} className={row.isTotal ? "total-row" : row.isSubtotal ? "font-medium" : ""}>
                      <td>{row.item}</td>
                      {row.values?.map((val, i) => (
                        <td key={i} className={row.isTotal ? "text-primary" : ""}>{formatMoney(val)}</td>
                      ))}
                      <td className={row.isTotal ? "text-primary" : ""}>{formatMoney(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
