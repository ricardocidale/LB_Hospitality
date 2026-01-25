import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { GlassCard } from "@/components/ui/glass-card";
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
          <p className="text-muted-foreground">No data available</p>
        </div>
      </Layout>
    );
  }

  // Aggregate Portfolio Data
  const allPropertyFinancials = properties.map(p => {
    const financials = generatePropertyProForma(p, global, 12);
    const year1Total = financials.reduce((acc, m) => ({
      revenue: acc.revenue + m.revenueTotal,
      gop: acc.gop + m.gop,
      noi: acc.noi + m.noi
    }), { revenue: 0, gop: 0, noi: 0 });
    
    return {
      name: p.name,
      ...year1Total
    };
  });

  const portfolioTotalRevenue = allPropertyFinancials.reduce((acc, p) => acc + p.revenue, 0);
  const portfolioTotalGOP = allPropertyFinancials.reduce((acc, p) => acc + p.gop, 0);
  const activeProperties = properties.filter(p => p.status === "Operational" || p.status === "Acquisition").length;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-serif font-medium text-primary tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground mt-2 text-lg">Portfolio overview & key performance indicators.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Model Start</p>
            <p className="text-xl font-serif">{format(new Date(global.modelStartDate), "MMMM yyyy")}</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <GlassCard className="p-6 flex flex-col justify-between h-[160px] relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <Wallet className="w-24 h-24 rotate-12" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Proj. Revenue (Y1)</p>
              <h3 className="text-3xl font-serif font-bold mt-2 text-foreground">{formatMoney(portfolioTotalRevenue)}</h3>
            </div>
            <div className="flex items-center text-sm text-green-600 font-medium">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span>Across {properties.length} Assets</span>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col justify-between h-[160px] relative overflow-hidden group">
             <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp className="w-24 h-24 rotate-12" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Portfolio GOP</p>
              <h3 className="text-3xl font-serif font-bold mt-2 text-primary">{formatMoney(portfolioTotalGOP)}</h3>
            </div>
            <div className="flex items-center text-sm text-primary/80 font-medium">
              <span>{((portfolioTotalGOP / portfolioTotalRevenue) * 100).toFixed(1)}% Margin</span>
            </div>
          </GlassCard>

           <GlassCard className="p-6 flex flex-col justify-between h-[160px] relative overflow-hidden group">
             <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <Building2 className="w-24 h-24 rotate-12" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Active Properties</p>
              <h3 className="text-3xl font-serif font-bold mt-2 text-foreground">{activeProperties}</h3>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
               <span>/ {properties.length} Total Pipeline</span>
            </div>
          </GlassCard>
          
           <GlassCard className="p-6 flex flex-col justify-between h-[160px] relative overflow-hidden group">
             <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <Users className="w-24 h-24 rotate-12" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Management Est.</p>
              <h3 className="text-3xl font-serif font-bold mt-2 text-accent-foreground">{formatMoney((portfolioTotalRevenue * global.baseManagementFee) + (portfolioTotalGOP * global.incentiveManagementFee))}</h3>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
               <span>Fees to L+B Co.</span>
            </div>
          </GlassCard>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-3 h-[400px]">
          <GlassCard className="md:col-span-2 p-6 flex flex-col">
            <h3 className="text-lg font-serif font-medium mb-6">Property Performance (Year 1)</h3>
            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allPropertyFinancials}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
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
                      tickFormatter={(value) => `$${value / 1000000}M`}
                    />
                    <Tooltip 
                      cursor={{fill: 'hsla(var(--primary), 0.1)'}}
                      contentStyle={{ 
                        backgroundColor: 'hsla(var(--background), 0.8)', 
                        borderColor: 'hsla(var(--border))',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number) => [formatMoney(value), ""]}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={32} />
                    <Bar dataKey="gop" name="GOP" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col bg-gradient-to-br from-primary to-blue-600 text-white border-none">
             <h3 className="text-lg font-serif font-medium mb-2 text-white/90">Capital Stack</h3>
             <p className="text-sm text-white/70 mb-8">Equity vs Debt Distribution</p>
             
             <div className="flex-1 flex flex-col justify-center space-y-6">
                <div>
                   <div className="flex justify-between mb-2 text-sm font-medium">
                      <span>Total Project Cost</span>
                      <span>{formatMoney(properties.reduce((acc, p) => acc + p.purchasePrice + p.buildingImprovements, 0))}</span>
                   </div>
                   <div className="w-full bg-black/20 rounded-full h-2">
                      <div className="bg-white h-full rounded-full w-full" />
                   </div>
                </div>

                <div>
                   <div className="flex justify-between mb-2 text-sm font-medium">
                      <span className="text-white/80">Equity Required</span>
                      <span>{formatMoney(16850000)}</span>
                   </div>
                   <div className="w-full bg-black/20 rounded-full h-2">
                      <div className="bg-white/60 h-full rounded-full w-[70%]" />
                   </div>
                </div>

                 <div>
                   <div className="flex justify-between mb-2 text-sm font-medium">
                      <span className="text-white/80">Debt Financing</span>
                      <span>{formatMoney(4500000)}</span> 
                   </div>
                   <div className="w-full bg-black/20 rounded-full h-2">
                      <div className="bg-white/30 h-full rounded-full w-[30%]" />
                   </div>
                </div>
             </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}
