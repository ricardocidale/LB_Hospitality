import { useState } from "react";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generateCompanyProForma, generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, Briefcase, TrendingUp, Settings2, Loader2, ChevronRight, ChevronDown } from "lucide-react";
import { Link } from "wouter";

export default function Company() {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

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
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <h2 className="text-2xl font-serif font-bold">Data Not Available</h2>
        </div>
      </Layout>
    );
  }

  const financials = generateCompanyProForma(properties, global, 120);
  
  const propertyFinancials = properties.map(p => ({
    property: p,
    financials: generatePropertyProForma(p, global, 120)
  }));
  
  const yearlyChartData = [];
  for (let y = 0; y < 10; y++) {
    const yearData = financials.slice(y * 12, (y + 1) * 12);
    if (yearData.length === 0) continue;
    yearlyChartData.push({
      year: `Y${y + 1}`,
      Revenue: yearData.reduce((a, m) => a + m.totalRevenue, 0),
      Expenses: yearData.reduce((a, m) => a + m.totalExpenses, 0),
      NetIncome: yearData.reduce((a, m) => a + m.netIncome, 0),
    });
  }

  const activePropertyCount = properties.filter(p => p.status === "Operating").length;
  const staffFTE = activePropertyCount <= 3 ? 2.5 : activePropertyCount <= 6 ? 4.5 : 7.0;
  
  const year1Financials = financials.slice(0, 12);
  const year1Revenue = year1Financials.reduce((a, m) => a + m.totalRevenue, 0);
  const year1NetIncome = year1Financials.reduce((a, m) => a + m.netIncome, 0);

  const getPropertyYearlyBaseFee = (propIdx: number, year: number) => {
    const pf = propertyFinancials[propIdx].financials;
    const yearData = pf.slice(year * 12, (year + 1) * 12);
    return yearData.reduce((a, m) => a + m.revenueTotal, 0) * global.baseManagementFee;
  };

  const getPropertyYearlyIncentiveFee = (propIdx: number, year: number) => {
    const pf = propertyFinancials[propIdx].financials;
    const yearData = pf.slice(year * 12, (year + 1) * 12);
    return yearData.reduce((a, m) => a + m.gop, 0) * global.incentiveManagementFee;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-1">L+B Hospitality Co.</h2>
            <p className="text-muted-foreground">Corporate Management Entity & Operations</p>
          </div>
          <Link href="/company/assumptions">
            <Button variant="outline" size="sm">
              <Settings2 className="w-4 h-4 mr-2" />
              Company Assumptions
            </Button>
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Partners</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-serif font-bold">3</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Staff FTEs</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-serif font-bold">{staffFTE}</div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Y1 Revenue</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-serif font-bold">{formatMoney(year1Revenue)}</div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Y1 Net Income</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className={`text-2xl font-serif font-bold ${year1NetIncome < 0 ? 'text-destructive' : ''}`}>
                {formatMoney(year1NetIncome)}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Management Company Performance (10-Year Projection)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="year" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatMoney(value), ""]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Expenses" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-3))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="NetIncome" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="income">Income Statement</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flows</TabsTrigger>
          </TabsList>
          
          <TabsContent value="income" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Yearly Income Statement</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card">Category</TableHead>
                      {Array.from({ length: 10 }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[100px]">Year {i + 1}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="sticky left-0 bg-muted/30">Revenue</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        return <TableCell key={y} className="text-right">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('baseFees')}
                    >
                      <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                        {expandedRows.has('baseFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Base Management Fees
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    
                    {expandedRows.has('baseFees') && properties.map((prop, idx) => (
                      <TableRow key={`base-${prop.id}`} className="bg-muted/10">
                        <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">
                          {prop.name}
                        </TableCell>
                        {Array.from({ length: 10 }, (_, y) => (
                          <TableCell key={y} className="text-right text-sm text-muted-foreground">
                            {formatMoney(getPropertyYearlyBaseFee(idx, y))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('incentiveFees')}
                    >
                      <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                        {expandedRows.has('incentiveFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Incentive Fees
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    
                    {expandedRows.has('incentiveFees') && properties.map((prop, idx) => (
                      <TableRow key={`incentive-${prop.id}`} className="bg-muted/10">
                        <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">
                          {prop.name}
                        </TableCell>
                        {Array.from({ length: 10 }, (_, y) => (
                          <TableCell key={y} className="text-right text-sm text-muted-foreground">
                            {formatMoney(getPropertyYearlyIncentiveFee(idx, y))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="sticky left-0 bg-muted/30">Operating Expenses</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                        return <TableCell key={y} className="text-right">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Partner Compensation</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.partnerCompensation, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Staff Compensation</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.staffCompensation, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Office & Overhead</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Variable Costs</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10">Net Income</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.netIncome, 0);
                        return (
                          <TableCell key={y} className={`text-right ${total < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(total)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card italic text-muted-foreground">Net Margin</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
                        const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        const margin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
                        return (
                          <TableCell key={y} className={`text-right italic text-muted-foreground ${margin < 0 ? 'text-destructive' : ''}`}>
                            {margin.toFixed(1)}%
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cashflow" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Yearly Cash Flow Statement</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card">Category</TableHead>
                      {Array.from({ length: 10 }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[100px]">Year {i + 1}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="font-semibold bg-muted/20">
                      <TableCell className="sticky left-0 bg-muted/20">Cash Inflows</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const revenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        const safe = yearData.reduce((a, m) => a + m.safeFunding, 0);
                        return <TableCell key={y} className="text-right">{formatMoney(revenue + safe)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('cfRevenue')}
                    >
                      <TableCell className="sticky left-0 bg-card flex items-center gap-2 pl-6">
                        {expandedRows.has('cfRevenue') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Management Fee Revenue
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfRevenue') && properties.map((prop, idx) => (
                      <TableRow key={`cf-${prop.id}`} className="bg-muted/10">
                        <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">
                          {prop.name}
                        </TableCell>
                        {Array.from({ length: 10 }, (_, y) => {
                          const baseFee = getPropertyYearlyBaseFee(idx, y);
                          const incentiveFee = getPropertyYearlyIncentiveFee(idx, y);
                          return (
                            <TableCell key={y} className="text-right text-sm text-muted-foreground">
                              {formatMoney(baseFee + incentiveFee)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">SAFE Funding</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.safeFunding, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                      })}
                    </TableRow>

                    <TableRow className="font-semibold bg-muted/20">
                      <TableCell className="sticky left-0 bg-muted/20">Cash Outflows</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                        return <TableCell key={y} className="text-right">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Partner Compensation</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.partnerCompensation, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Staff Compensation</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.staffCompensation, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Office Lease</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.officeLease, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Professional Services</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.professionalServices, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Tech Infrastructure</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.techInfrastructure, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Business Insurance</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.businessInsurance, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Travel Costs</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.travelCosts, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">IT Licensing</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.itLicensing, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Marketing</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.marketing, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Misc Operations</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.miscOps, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>

                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10">Net Cash Flow</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.cashFlow, 0);
                        return (
                          <TableCell key={y} className={`text-right ${total < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(total)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="sticky left-0 bg-muted/30">Cumulative Cash</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        let cumulative = 0;
                        for (let i = 0; i <= y; i++) {
                          const yearData = financials.slice(i * 12, (i + 1) * 12);
                          cumulative += yearData.reduce((a, m) => a + m.cashFlow, 0);
                        }
                        return (
                          <TableCell key={y} className={`text-right ${cumulative < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(cumulative)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
