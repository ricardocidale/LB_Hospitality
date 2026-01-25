import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowUpRight, Building2, TrendingUp, Wallet, Users, Loader2, ChevronRight, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function Dashboard() {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
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
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">No data available. Please check the database.</p>
        </div>
      </Layout>
    );
  }

  const allPropertyFinancials = properties.map(p => {
    const financials = generatePropertyProForma(p, global, 120);
    return { property: p, financials };
  });

  const getYearlyConsolidated = (yearIndex: number) => {
    const startMonth = yearIndex * 12;
    const endMonth = startMonth + 12;
    
    let totals = {
      revenueRooms: 0,
      revenueEvents: 0,
      revenueFB: 0,
      revenueOther: 0,
      revenueTotal: 0,
      expenseRooms: 0,
      expenseFB: 0,
      expenseEvents: 0,
      expenseOther: 0,
      expenseMarketing: 0,
      expensePropertyOps: 0,
      expenseUtilitiesVar: 0,
      expenseFFE: 0,
      expenseAdmin: 0,
      expenseIT: 0,
      expenseInsurance: 0,
      expenseTaxes: 0,
      expenseUtilitiesFixed: 0,
      expenseOtherCosts: 0,
      feeBase: 0,
      feeIncentive: 0,
      totalExpenses: 0,
      gop: 0,
      noi: 0,
      debtPayment: 0,
      cashFlow: 0
    };

    allPropertyFinancials.forEach(({ financials }) => {
      const yearData = financials.slice(startMonth, endMonth);
      yearData.forEach(m => {
        totals.revenueRooms += m.revenueRooms;
        totals.revenueEvents += m.revenueEvents;
        totals.revenueFB += m.revenueFB;
        totals.revenueOther += m.revenueOther;
        totals.revenueTotal += m.revenueTotal;
        totals.expenseRooms += m.expenseRooms;
        totals.expenseFB += m.expenseFB;
        totals.expenseEvents += m.expenseEvents;
        totals.expenseOther += m.expenseOther;
        totals.expenseMarketing += m.expenseMarketing;
        totals.expensePropertyOps += m.expensePropertyOps;
        totals.expenseUtilitiesVar += m.expenseUtilitiesVar;
        totals.expenseFFE += m.expenseFFE;
        totals.expenseAdmin += m.expenseAdmin;
        totals.expenseIT += m.expenseIT;
        totals.expenseInsurance += m.expenseInsurance;
        totals.expenseTaxes += m.expenseTaxes;
        totals.expenseUtilitiesFixed += m.expenseUtilitiesFixed;
        totals.expenseOtherCosts += m.expenseOtherCosts;
        totals.feeBase += m.feeBase;
        totals.feeIncentive += m.feeIncentive;
        totals.totalExpenses += m.totalExpenses;
        totals.gop += m.gop;
        totals.noi += m.noi;
        totals.debtPayment += m.debtPayment;
        totals.cashFlow += m.cashFlow;
      });
    });

    return totals;
  };

  const getPropertyYearly = (propIndex: number, yearIndex: number) => {
    const startMonth = yearIndex * 12;
    const endMonth = startMonth + 12;
    const { financials } = allPropertyFinancials[propIndex];
    const yearData = financials.slice(startMonth, endMonth);
    
    return {
      revenueTotal: yearData.reduce((a, m) => a + m.revenueTotal, 0),
      revenueRooms: yearData.reduce((a, m) => a + m.revenueRooms, 0),
      revenueEvents: yearData.reduce((a, m) => a + m.revenueEvents, 0),
      revenueFB: yearData.reduce((a, m) => a + m.revenueFB, 0),
      revenueOther: yearData.reduce((a, m) => a + m.revenueOther, 0),
      gop: yearData.reduce((a, m) => a + m.gop, 0),
      noi: yearData.reduce((a, m) => a + m.noi, 0),
      feeBase: yearData.reduce((a, m) => a + m.feeBase, 0),
      feeIncentive: yearData.reduce((a, m) => a + m.feeIncentive, 0),
      debtPayment: yearData.reduce((a, m) => a + m.debtPayment, 0),
      cashFlow: yearData.reduce((a, m) => a + m.cashFlow, 0)
    };
  };

  const year1Data = getYearlyConsolidated(0);
  const portfolioTotalRevenue = year1Data.revenueTotal;
  const portfolioTotalGOP = year1Data.gop;
  const activeProperties = properties.filter(p => p.status === "Operational" || p.status === "Development").length;
  const managementFees = year1Data.feeBase + year1Data.feeIncentive;

  const allPropertyChartData = properties.map((p, idx) => {
    const yearData = getPropertyYearly(idx, 0);
    return { name: p.name, revenue: yearData.revenueTotal, gop: yearData.gop };
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground mt-1">Portfolio overview & consolidated financial statements</p>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Management Fees (Y1)</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{formatMoney(managementFees)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Paid to L+B Co.
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="income">Income Statement</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow Statement</TabsTrigger>
            <TabsTrigger value="investment">Investment Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Property Performance (Year 1)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={allPropertyChartData}>
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
          </TabsContent>

          <TabsContent value="income" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Consolidated Portfolio Income Statement (10-Year)</CardTitle>
                <p className="text-sm text-muted-foreground">All properties combined - management fees shown as expenses paid to L+B Co.</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card min-w-[200px]">Category</TableHead>
                      {Array.from({ length: 10 }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[110px]">Year {i + 1}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow 
                      className="font-semibold bg-muted/20 cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleRow('revenue')}
                    >
                      <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-2">
                        {expandedRows.has('revenue') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Total Revenue
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right">{formatMoney(getYearlyConsolidated(y).revenueTotal)}</TableCell>
                      ))}
                    </TableRow>
                    {expandedRows.has('revenue') && (
                      <>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Rooms Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueRooms)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Events Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueEvents)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">F&B Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueFB)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Other Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueOther)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('revenueByProperty'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-8 flex items-center gap-2 text-muted-foreground">
                            {expandedRows.has('revenueByProperty') ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            By Property
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('revenueByProperty') && properties.map((prop, idx) => (
                          <TableRow key={prop.id} className="bg-muted/10">
                            <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: 10 }, (_, y) => (
                              <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                {formatMoney(getPropertyYearly(idx, y).revenueTotal)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </>
                    )}

                    <TableRow 
                      className="font-semibold bg-muted/30 cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleRow('opex')}
                    >
                      <TableCell className="sticky left-0 bg-muted/30 flex items-center gap-2">
                        {expandedRows.has('opex') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Operating Expenses
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        const totalOpex = data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
                          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
                          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
                          data.expenseUtilitiesFixed + data.expenseOtherCosts;
                        return <TableCell key={y} className="text-right">{formatMoney(totalOpex)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('opex') && (
                      <>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('opexDirect'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('opexDirect') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Direct Costs
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              {formatMoney(data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther)}
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexDirect') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Rooms Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseRooms)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">F&B Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseFB)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Events Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseEvents)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Other Direct</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseOther)}</TableCell>
                              ))}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('opexOverhead'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('opexOverhead') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Overhead & Admin
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              {formatMoney(data.expenseAdmin + data.expenseMarketing + data.expensePropertyOps + 
                                data.expenseUtilitiesVar + data.expenseUtilitiesFixed + data.expenseIT + 
                                data.expenseInsurance + data.expenseTaxes + data.expenseOtherCosts)}
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexOverhead') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Admin & General</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseAdmin)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Marketing</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseMarketing)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Property Operations</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expensePropertyOps)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Utilities</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const data = getYearlyConsolidated(y);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(data.expenseUtilitiesVar + data.expenseUtilitiesFixed)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">IT Systems</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseIT)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Insurance</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseInsurance)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Property Taxes</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseTaxes)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Other Expenses</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseOtherCosts)}</TableCell>
                              ))}
                            </TableRow>
                          </>
                        )}
                      </>
                    )}

                    <TableRow className="bg-accent/20 font-semibold">
                      <TableCell className="sticky left-0 bg-accent/20">Gross Operating Profit (GOP)</TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right">{formatMoney(getYearlyConsolidated(y).gop)}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow 
                      className="font-semibold bg-muted/30 cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleRow('mgmtFees')}
                    >
                      <TableCell className="sticky left-0 bg-muted/30 flex items-center gap-2">
                        {expandedRows.has('mgmtFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Management Fees (to L+B Co.)
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        return <TableCell key={y} className="text-right">{formatMoney(data.feeBase + data.feeIncentive)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('mgmtFees') && (
                      <>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Base Fee ({(global.baseManagementFee * 100).toFixed(0)}% of Revenue)</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).feeBase)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Incentive Fee ({(global.incentiveManagementFee * 100).toFixed(0)}% of GOP)</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).feeIncentive)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('mgmtFeesByProperty'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-8 flex items-center gap-2 text-muted-foreground">
                            {expandedRows.has('mgmtFeesByProperty') ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            By Property
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('mgmtFeesByProperty') && properties.map((prop, idx) => (
                          <TableRow key={prop.id} className="bg-muted/10">
                            <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: 10 }, (_, y) => {
                              const propData = getPropertyYearly(idx, y);
                              return (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                  {formatMoney(propData.feeBase + propData.feeIncentive)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </>
                    )}

                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">FF&E Reserve</TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseFFE)}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10">Net Operating Income (NOI)</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const noi = getYearlyConsolidated(y).noi;
                        return (
                          <TableCell key={y} className={`text-right ${noi < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(noi)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card italic text-muted-foreground">NOI Margin</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        const margin = data.revenueTotal > 0 ? (data.noi / data.revenueTotal) * 100 : 0;
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
                <CardTitle>Consolidated Portfolio Cash Flow Statement (10-Year)</CardTitle>
                <p className="text-sm text-muted-foreground">All properties combined - shows cash available after debt service</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card min-w-[200px]">Category</TableHead>
                      {Array.from({ length: 10 }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[110px]">Year {i + 1}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow 
                      className="font-semibold bg-muted/20 cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleRow('cfInflows')}
                    >
                      <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-2">
                        {expandedRows.has('cfInflows') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Cash Inflows (Revenue)
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right">{formatMoney(getYearlyConsolidated(y).revenueTotal)}</TableCell>
                      ))}
                    </TableRow>
                    {expandedRows.has('cfInflows') && (
                      <>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Rooms Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueRooms)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Events Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueEvents)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">F&B Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueFB)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Other Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueOther)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfInflowsByProperty'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-8 flex items-center gap-2 text-muted-foreground">
                            {expandedRows.has('cfInflowsByProperty') ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            By Property
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('cfInflowsByProperty') && properties.map((prop, idx) => (
                          <TableRow key={prop.id} className="bg-muted/10">
                            <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: 10 }, (_, y) => (
                              <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                {formatMoney(getPropertyYearly(idx, y).revenueTotal)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </>
                    )}

                    <TableRow 
                      className="font-semibold bg-muted/30 cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleRow('cfOutflows')}
                    >
                      <TableCell className="sticky left-0 bg-muted/30 flex items-center gap-2">
                        {expandedRows.has('cfOutflows') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Cash Outflows (Operating)
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        const totalOpex = data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
                          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
                          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
                          data.expenseUtilitiesFixed + data.expenseOtherCosts;
                        return <TableCell key={y} className="text-right">({formatMoney(totalOpex)})</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfOutflows') && (
                      <>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfDirect'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('cfDirect') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Direct Costs
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              ({formatMoney(data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther)})
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfDirect') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Rooms Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseRooms)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">F&B Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseFB)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Events Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseEvents)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Other Direct</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseOther)})</TableCell>
                              ))}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfOverhead'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('cfOverhead') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Overhead & Admin
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              ({formatMoney(data.expenseAdmin + data.expenseMarketing + data.expensePropertyOps + 
                                data.expenseUtilitiesVar + data.expenseUtilitiesFixed + data.expenseIT + 
                                data.expenseInsurance + data.expenseTaxes + data.expenseOtherCosts)})
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfOverhead') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Admin & General</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseAdmin)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Marketing</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseMarketing)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Property Operations</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expensePropertyOps)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Utilities</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const data = getYearlyConsolidated(y);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(data.expenseUtilitiesVar + data.expenseUtilitiesFixed)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">IT Systems</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseIT)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Insurance</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseInsurance)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Property Taxes</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseTaxes)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Other Expenses</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseOtherCosts)})</TableCell>
                              ))}
                            </TableRow>
                          </>
                        )}
                      </>
                    )}

                    <TableRow className="bg-accent/20 font-semibold">
                      <TableCell className="sticky left-0 bg-accent/20">Gross Operating Profit (GOP)</TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right">{formatMoney(getYearlyConsolidated(y).gop)}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('cfMgmtFees')}
                    >
                      <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                        {expandedRows.has('cfMgmtFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Management Fees (to L+B Co.)
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(data.feeBase + data.feeIncentive)})</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfMgmtFees') && (
                      <>
                        <TableRow className="bg-muted/10">
                          <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">Base Fee ({(global.baseManagementFee * 100).toFixed(0)}% of Revenue)</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).feeBase)})</TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/10">
                          <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">Incentive Fee ({(global.incentiveManagementFee * 100).toFixed(0)}% of GOP)</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).feeIncentive)})</TableCell>
                          ))}
                        </TableRow>
                      </>
                    )}

                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">FF&E Reserve</TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseFFE)})</TableCell>
                      ))}
                    </TableRow>

                    <TableRow className="font-semibold bg-muted/20">
                      <TableCell className="sticky left-0 bg-muted/20">Net Operating Income (NOI)</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const noi = getYearlyConsolidated(y).noi;
                        return (
                          <TableCell key={y} className={`text-right ${noi < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(noi)}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('cfDebt')}
                    >
                      <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                        {expandedRows.has('cfDebt') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Debt Service
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const debt = getYearlyConsolidated(y).debtPayment;
                        return <TableCell key={y} className="text-right text-muted-foreground">{debt > 0 ? `(${formatMoney(debt)})` : '-'}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfDebt') && properties.filter(p => p.type === 'Financed').map((prop, idx) => {
                      const propIdx = properties.findIndex(p => p.id === prop.id);
                      return (
                        <TableRow key={prop.id} className="bg-muted/10">
                          <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">{prop.name}</TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const debt = getPropertyYearly(propIdx, y).debtPayment;
                            return (
                              <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                {debt > 0 ? `(${formatMoney(debt)})` : '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}

                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10">Net Cash Flow</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const cf = getYearlyConsolidated(y).cashFlow;
                        return (
                          <TableCell key={y} className={`text-right ${cf < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(cf)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/10"
                      onClick={() => toggleRow('cfByProperty')}
                    >
                      <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2 text-muted-foreground italic">
                        {expandedRows.has('cfByProperty') ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        By Property
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                      ))}
                    </TableRow>
                    {expandedRows.has('cfByProperty') && properties.map((prop, idx) => (
                      <TableRow key={prop.id} className="bg-muted/10">
                        <TableCell className="sticky left-0 bg-muted/10 pl-10 text-sm text-muted-foreground">{prop.name}</TableCell>
                        {Array.from({ length: 10 }, (_, y) => {
                          const cf = getPropertyYearly(idx, y).cashFlow;
                          return (
                            <TableCell key={y} className={`text-right text-sm ${cf < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {formatMoney(cf)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investment" className="mt-6 space-y-6">
            <InvestmentAnalysis 
              properties={properties} 
              allPropertyFinancials={allPropertyFinancials}
              getPropertyYearly={getPropertyYearly}
              getYearlyConsolidated={getYearlyConsolidated}
              global={global}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
  const maxIterations = 100;
  const tolerance = 0.0001;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivNpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const denominator = Math.pow(1 + rate, t);
      npv += cashFlows[t] / denominator;
      if (t > 0) {
        derivNpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) {
      return rate;
    }

    if (derivNpv === 0) break;
    rate = rate - npv / derivNpv;

    if (rate < -1) rate = -0.99;
  }

  return rate;
}

interface InvestmentAnalysisProps {
  properties: any[];
  allPropertyFinancials: any[];
  getPropertyYearly: (propIndex: number, yearIndex: number) => any;
  getYearlyConsolidated: (yearIndex: number) => any;
  global: any;
  expandedRows: Set<string>;
  toggleRow: (rowId: string) => void;
}

function InvestmentAnalysis({ 
  properties, 
  allPropertyFinancials, 
  getPropertyYearly, 
  getYearlyConsolidated,
  global,
  expandedRows,
  toggleRow
}: InvestmentAnalysisProps) {
  const DEPRECIATION_YEARS = 27.5;
  
  const modelStartYear = new Date(global.modelStartDate).getFullYear();
  const getCalendarYear = (yearIndex: number) => modelStartYear + yearIndex;

  const getPropertyAcquisitionYear = (prop: any): number => {
    const acqDate = new Date(prop.acquisitionDate);
    const modelStart = new Date(global.modelStartDate);
    const monthsDiff = (acqDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                       (acqDate.getMonth() - modelStart.getMonth());
    return Math.floor(monthsDiff / 12);
  };

  const getPropertyInvestment = (prop: any) => {
    const totalInvestment = prop.purchasePrice + prop.buildingImprovements + 
                            prop.preOpeningCosts + prop.operatingReserve;
    if (prop.type === "Financed") {
      const ltv = prop.acquisitionLTV || global.debtAssumptions.acqLTV || 0.75;
      return totalInvestment * (1 - ltv);
    }
    return totalInvestment;
  };

  const getEquityInvestmentForYear = (yearIndex: number): number => {
    let total = 0;
    properties.forEach(prop => {
      const acqYear = getPropertyAcquisitionYear(prop);
      if (acqYear === yearIndex) {
        total += getPropertyInvestment(prop);
      }
    });
    return total;
  };

  const getPropertyLoanAmount = (prop: any) => {
    if (prop.type !== "Financed") return 0;
    const ltv = prop.acquisitionLTV || global.debtAssumptions.acqLTV || 0.75;
    return (prop.purchasePrice + prop.buildingImprovements) * ltv;
  };

  const getAnnualDepreciation = (prop: any) => {
    const depreciableBase = prop.purchasePrice + prop.buildingImprovements;
    return depreciableBase / DEPRECIATION_YEARS;
  };

  const getRefiYear = (prop: any): number => {
    if (prop.willRefinance !== "Yes") return -1;
    const refiDate = new Date(prop.refinanceDate);
    const modelStart = new Date(global.modelStartDate);
    const monthsDiff = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                       (refiDate.getMonth() - modelStart.getMonth());
    return Math.floor(monthsDiff / 12);
  };

  const getDebtServiceDetails = (prop: any, propIndex: number, yearIndex: number) => {
    const refiYear = getRefiYear(prop);
    const isPostRefi = refiYear >= 0 && refiYear < 10 && yearIndex >= refiYear;
    
    if (isPostRefi) {
      const refiLTV = prop.refinanceLTV || global.debtAssumptions.refiLTV || 0.65;
      const { financials } = allPropertyFinancials[propIndex];
      const stabilizedData = financials.slice(refiYear * 12, (refiYear + 1) * 12);
      const stabilizedNOI = stabilizedData.reduce((a: number, m: any) => a + m.noi, 0);
      const capRate = prop.exitCapRate || 0.085;
      const propertyValue = stabilizedNOI / capRate;
      const refiLoanAmount = propertyValue * refiLTV;
      
      const annualRate = prop.refinanceInterestRate || global.debtAssumptions.interestRate || 0.09;
      const r = annualRate / 12;
      const termYears = prop.refinanceTermYears || global.debtAssumptions.amortizationYears || 25;
      const n = termYears * 12;
      
      if (r <= 0 || n <= 0 || refiLoanAmount <= 0) return { debtService: 0, interestPortion: 0, principalPortion: 0 };
      
      const monthlyPayment = (refiLoanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const annualDebtService = monthlyPayment * 12;
      
      let remainingBalance = refiLoanAmount;
      let totalInterest = 0;
      let totalPrincipal = 0;
      
      const yearsSinceRefi = yearIndex - refiYear;
      const startMonth = yearsSinceRefi * 12;
      const endMonth = startMonth + 12;
      
      for (let m = 0; m < endMonth && m < n; m++) {
        const interestPayment = remainingBalance * r;
        const principalPayment = monthlyPayment - interestPayment;
        
        if (m >= startMonth) {
          totalInterest += interestPayment;
          totalPrincipal += principalPayment;
        }
        
        remainingBalance -= principalPayment;
      }
      
      return { 
        debtService: annualDebtService, 
        interestPortion: totalInterest, 
        principalPortion: totalPrincipal 
      };
    }
    
    const loanAmount = getPropertyLoanAmount(prop);
    if (loanAmount <= 0) return { debtService: 0, interestPortion: 0, principalPortion: 0 };

    const annualRate = prop.acquisitionInterestRate || global.debtAssumptions.interestRate || 0.09;
    const r = annualRate / 12;
    const termYears = prop.acquisitionTermYears || global.debtAssumptions.amortizationYears || 25;
    const n = termYears * 12;

    if (r <= 0 || n <= 0) return { debtService: 0, interestPortion: 0, principalPortion: 0 };

    const monthlyPayment = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const annualDebtService = monthlyPayment * 12;

    let remainingBalance = loanAmount;
    let totalInterest = 0;
    let totalPrincipal = 0;

    const startMonth = yearIndex * 12;
    const endMonth = startMonth + 12;

    for (let m = 0; m < endMonth && m < n; m++) {
      const interestPayment = remainingBalance * r;
      const principalPayment = monthlyPayment - interestPayment;
      
      if (m >= startMonth) {
        totalInterest += interestPayment;
        totalPrincipal += principalPayment;
      }
      
      remainingBalance -= principalPayment;
    }

    return { 
      debtService: annualDebtService, 
      interestPortion: totalInterest, 
      principalPortion: totalPrincipal 
    };
  };

  const getOutstandingLoanBalance = (prop: any, afterYear: number) => {
    const loanAmount = getPropertyLoanAmount(prop);
    if (loanAmount <= 0) return 0;

    const annualRate = prop.acquisitionInterestRate || global.debtAssumptions.interestRate || 0.09;
    const r = annualRate / 12;
    const termYears = prop.acquisitionTermYears || global.debtAssumptions.amortizationYears || 25;
    const n = termYears * 12;

    if (r <= 0 || n <= 0) return 0;

    const monthlyPayment = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const monthsPaid = (afterYear + 1) * 12;
    const paymentsRemaining = Math.max(0, n - monthsPaid);

    if (paymentsRemaining <= 0) return 0;
    return monthlyPayment * (1 - Math.pow(1 + r, -paymentsRemaining)) / r;
  };

  const getPropertyRefinanceProceeds = (prop: any, propIndex: number) => {
    if (prop.willRefinance !== "Yes") return { year: -1, proceeds: 0 };
    
    const refiDate = new Date(prop.refinanceDate);
    const modelStart = new Date(global.modelStartDate);
    const monthsDiff = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                       (refiDate.getMonth() - modelStart.getMonth());
    const refiYear = Math.floor(monthsDiff / 12);
    
    if (refiYear < 0 || refiYear >= 10) return { year: -1, proceeds: 0 };
    
    const refiLTV = prop.refinanceLTV || global.debtAssumptions.refiLTV || 0.65;
    const closingCostRate = prop.refinanceClosingCostRate || global.debtAssumptions.refiClosingCostRate || 0.02;
    
    const { financials } = allPropertyFinancials[propIndex];
    const stabilizedData = financials.slice(refiYear * 12, (refiYear + 1) * 12);
    const stabilizedNOI = stabilizedData.reduce((a: number, m: any) => a + m.noi, 0);
    const capRate = prop.exitCapRate || 0.085;
    const propertyValue = stabilizedNOI / capRate;
    
    const newLoanAmount = propertyValue * refiLTV;
    const closingCosts = newLoanAmount * closingCostRate;
    const existingDebt = getOutstandingLoanBalance(prop, refiYear - 1);
    
    const netProceeds = newLoanAmount - closingCosts - existingDebt;
    
    return { year: refiYear, proceeds: Math.max(0, netProceeds) };
  };

  const getRefiLoanBalance = (prop: any, propIndex: number, afterYear: number): number => {
    if (prop.willRefinance !== "Yes") return 0;
    
    const refiDate = new Date(prop.refinanceDate);
    const modelStart = new Date(global.modelStartDate);
    const monthsDiff = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                       (refiDate.getMonth() - modelStart.getMonth());
    const refiYear = Math.floor(monthsDiff / 12);
    
    if (refiYear < 0 || refiYear >= 10 || afterYear < refiYear) return 0;
    
    const refiLTV = prop.refinanceLTV || global.debtAssumptions.refiLTV || 0.65;
    const { financials } = allPropertyFinancials[propIndex];
    const stabilizedData = financials.slice(refiYear * 12, (refiYear + 1) * 12);
    const stabilizedNOI = stabilizedData.reduce((a: number, m: any) => a + m.noi, 0);
    const capRate = prop.exitCapRate || 0.085;
    const propertyValue = stabilizedNOI / capRate;
    const refiLoanAmount = propertyValue * refiLTV;
    
    const annualRate = prop.refinanceInterestRate || global.debtAssumptions.interestRate || 0.09;
    const r = annualRate / 12;
    const termYears = prop.refinanceTermYears || global.debtAssumptions.amortizationYears || 25;
    const n = termYears * 12;
    
    if (r <= 0 || n <= 0) return 0;
    
    const monthlyPayment = (refiLoanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const yearsSinceRefi = afterYear - refiYear + 1;
    const monthsPaid = yearsSinceRefi * 12;
    const paymentsRemaining = Math.max(0, n - monthsPaid);
    
    if (paymentsRemaining <= 0) return 0;
    return monthlyPayment * (1 - Math.pow(1 + r, -paymentsRemaining)) / r;
  };

  const getTotalOutstandingDebt = (prop: any, propIndex: number, afterYear: number): number => {
    if (prop.willRefinance === "Yes") {
      const refiDate = new Date(prop.refinanceDate);
      const modelStart = new Date(global.modelStartDate);
      const monthsDiff = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                         (refiDate.getMonth() - modelStart.getMonth());
      const refiYear = Math.floor(monthsDiff / 12);
      
      if (refiYear >= 0 && refiYear < 10 && afterYear >= refiYear) {
        return getRefiLoanBalance(prop, propIndex, afterYear);
      }
    }
    return getOutstandingLoanBalance(prop, afterYear);
  };

  const getPropertyExitValue = (prop: any, propIndex: number) => {
    const { financials } = allPropertyFinancials[propIndex];
    const year10Data = financials.slice(108, 120);
    const year10NOI = year10Data.reduce((a: number, m: any) => a + m.noi, 0);
    const capRate = prop.exitCapRate || 0.085;
    const grossValue = year10NOI / capRate;
    const outstandingDebt = getTotalOutstandingDebt(prop, propIndex, 9);
    
    return grossValue - outstandingDebt;
  };

  const getPropertyYearlyDetails = (prop: any, propIndex: number, yearIndex: number) => {
    const yearlyData = getPropertyYearly(propIndex, yearIndex);
    const noi = yearlyData.noi || 0;
    const { debtService, interestPortion, principalPortion } = getDebtServiceDetails(prop, propIndex, yearIndex);
    const depreciation = getAnnualDepreciation(prop);
    const taxRate = prop.taxRate || 0.25;

    const btcf = noi - debtService;
    const taxableIncome = noi - interestPortion - depreciation;
    const taxLiability = taxableIncome > 0 ? taxableIncome * taxRate : 0;
    const atcf = btcf - taxLiability;

    return {
      noi,
      debtService,
      interestPortion,
      principalPortion,
      depreciation,
      btcf,
      taxableIncome,
      taxLiability,
      atcf
    };
  };

  const getPropertyCashFlows = (prop: any, propIndex: number): number[] => {
    const flows: number[] = [];
    
    const initialEquity = -getPropertyInvestment(prop);
    flows.push(initialEquity);
    
    const refi = getPropertyRefinanceProceeds(prop, propIndex);
    
    for (let y = 0; y < 10; y++) {
      const details = getPropertyYearlyDetails(prop, propIndex, y);
      let yearCashFlow = details.atcf;
      
      if (y === refi.year) {
        yearCashFlow += refi.proceeds;
      }
      
      if (y === 9) {
        yearCashFlow += getPropertyExitValue(prop, propIndex);
      }
      
      flows.push(yearCashFlow);
    }
    
    return flows;
  };

  const getConsolidatedYearlyDetails = (yearIndex: number) => {
    let totalNOI = 0;
    let totalDebtService = 0;
    let totalInterest = 0;
    let totalDepreciation = 0;
    let totalBTCF = 0;
    let totalTaxableIncome = 0;
    let totalTax = 0;
    let totalATCF = 0;

    properties.forEach((prop, idx) => {
      const details = getPropertyYearlyDetails(prop, idx, yearIndex);
      totalNOI += details.noi;
      totalDebtService += details.debtService;
      totalInterest += details.interestPortion;
      totalDepreciation += details.depreciation;
      totalBTCF += details.btcf;
      totalTaxableIncome += details.taxableIncome;
      totalTax += details.taxLiability;
      totalATCF += details.atcf;
    });

    return {
      noi: totalNOI,
      debtService: totalDebtService,
      interestPortion: totalInterest,
      depreciation: totalDepreciation,
      btcf: totalBTCF,
      taxableIncome: totalTaxableIncome,
      taxLiability: totalTax,
      atcf: totalATCF
    };
  };

  const getConsolidatedCashFlows = (): number[] => {
    const flows: number[] = [];
    
    const year0Investment = getEquityInvestmentForYear(0);
    flows.push(-year0Investment);
    
    for (let y = 0; y < 10; y++) {
      const consolidated = getConsolidatedYearlyDetails(y);
      let yearCashFlow = consolidated.atcf;
      
      const yearInvestment = getEquityInvestmentForYear(y + 1);
      if (yearInvestment > 0) {
        yearCashFlow -= yearInvestment;
      }
      
      properties.forEach((prop, idx) => {
        const refi = getPropertyRefinanceProceeds(prop, idx);
        if (y === refi.year) {
          yearCashFlow += refi.proceeds;
        }
        
        if (y === 9) {
          yearCashFlow += getPropertyExitValue(prop, idx);
        }
      });
      
      flows.push(yearCashFlow);
    }
    
    return flows;
  };

  const consolidatedFlows = getConsolidatedCashFlows();
  const portfolioIRR = calculateIRR(consolidatedFlows);
  
  const totalInitialEquity = properties.reduce((sum, prop) => sum + getPropertyInvestment(prop), 0);
  const totalExitValue = properties.reduce((sum, prop, idx) => sum + getPropertyExitValue(prop, idx), 0);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Equity Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalInitialEquity)}</div>
            <p className="text-xs text-muted-foreground mt-1">Initial capital required</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Exit Value (Year 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatMoney(totalExitValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Net of outstanding debt</p>
          </CardContent>
        </Card>
        
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Portfolio IRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(portfolioIRR * 100).toFixed(1)}%</div>
            <p className="text-xs text-primary-foreground/70 mt-1">10-year internal rate of return</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Free Cash Flow Analysis (10-Year)</CardTitle>
          <p className="text-sm text-muted-foreground">Investor cash flows including distributions, refinancing proceeds, and exit values</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card min-w-[200px]">Category</TableHead>
                <TableHead className="text-right min-w-[110px]">{getCalendarYear(0)}</TableHead>
                {Array.from({ length: 10 }, (_, i) => (
                  <TableHead key={i} className="text-right min-w-[110px]">{getCalendarYear(i + 1)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow 
                className="font-semibold bg-muted/20 cursor-pointer hover:bg-muted/30"
                onClick={() => toggleRow('fcfEquity')}
              >
                <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-2">
                  {expandedRows.has('fcfEquity') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  Equity Investment
                </TableCell>
                {(() => {
                  const year0Inv = getEquityInvestmentForYear(0);
                  return (
                    <TableCell className={`text-right ${year0Inv > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {year0Inv > 0 ? `(${formatMoney(year0Inv)})` : '-'}
                    </TableCell>
                  );
                })()}
                {Array.from({ length: 10 }, (_, y) => {
                  const yearInv = getEquityInvestmentForYear(y + 1);
                  return (
                    <TableCell key={y} className={`text-right ${yearInv > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {yearInv > 0 ? `(${formatMoney(yearInv)})` : '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
              {expandedRows.has('fcfEquity') && properties.map((prop) => {
                const acqYear = getPropertyAcquisitionYear(prop);
                return (
                  <TableRow key={prop.id} className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">{prop.name}</TableCell>
                    <TableCell className={`text-right text-sm ${acqYear === 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {acqYear === 0 ? `(${formatMoney(getPropertyInvestment(prop))})` : '-'}
                    </TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className={`text-right text-sm ${acqYear === y + 1 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {acqYear === y + 1 ? `(${formatMoney(getPropertyInvestment(prop))})` : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}

              <TableRow 
                className="cursor-pointer hover:bg-muted/20"
                onClick={() => toggleRow('fcfOperating')}
              >
                <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                  {expandedRows.has('fcfOperating') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  After-Tax Operating Cash Flow
                </TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                {Array.from({ length: 10 }, (_, y) => {
                  const details = getConsolidatedYearlyDetails(y);
                  return (
                    <TableCell key={y} className={`text-right ${details.atcf < 0 ? 'text-destructive' : ''}`}>
                      {formatMoney(details.atcf)}
                    </TableCell>
                  );
                })}
              </TableRow>
              {expandedRows.has('fcfOperating') && (
                <>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-8 text-sm text-muted-foreground">Net Operating Income (NOI)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">
                        {formatMoney(getConsolidatedYearlyDetails(y).noi)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-8 text-sm text-muted-foreground">Less: Debt Service</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const ds = getConsolidatedYearlyDetails(y).debtService;
                      return (
                        <TableCell key={y} className="text-right text-sm text-destructive">
                          {ds > 0 ? `(${formatMoney(ds)})` : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-8 text-sm text-muted-foreground">Before-Tax Cash Flow (BTCF)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const btcf = getConsolidatedYearlyDetails(y).btcf;
                      return (
                        <TableCell key={y} className={`text-right text-sm ${btcf < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {formatMoney(btcf)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-8 text-sm text-muted-foreground">Depreciation (27.5 yr)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">
                        {formatMoney(getConsolidatedYearlyDetails(y).depreciation)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-8 text-sm text-muted-foreground">Interest Expense</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">
                        {formatMoney(getConsolidatedYearlyDetails(y).interestPortion)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-8 text-sm text-muted-foreground">Taxable Income</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const ti = getConsolidatedYearlyDetails(y).taxableIncome;
                      return (
                        <TableCell key={y} className={`text-right text-sm ${ti < 0 ? 'text-muted-foreground' : ''}`}>
                          {formatMoney(ti)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-8 text-sm text-muted-foreground">Less: Tax Liability</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const tax = getConsolidatedYearlyDetails(y).taxLiability;
                      return (
                        <TableCell key={y} className="text-right text-sm text-destructive">
                          {tax > 0 ? `(${formatMoney(tax)})` : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/10 border-t">
                    <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm font-medium">After-Tax Cash Flow (ATCF)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const atcf = getConsolidatedYearlyDetails(y).atcf;
                      return (
                        <TableCell key={y} className={`text-right text-sm font-medium ${atcf < 0 ? 'text-destructive' : ''}`}>
                          {formatMoney(atcf)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground italic">By Property:</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">-</TableCell>
                    ))}
                  </TableRow>
                  {properties.map((prop, idx) => (
                    <TableRow key={prop.id} className="bg-muted/5" data-testid={`fcf-property-${prop.id}`}>
                      <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">
                        {prop.name}
                        <span className="text-xs ml-2">({((prop.taxRate || 0.25) * 100).toFixed(0)}% tax)</span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const details = getPropertyYearlyDetails(prop, idx, y);
                        return (
                          <TableCell key={y} className={`text-right text-sm ${details.atcf < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {formatMoney(details.atcf)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </>
              )}

              <TableRow 
                className="cursor-pointer hover:bg-muted/20"
                onClick={() => toggleRow('fcfRefi')}
              >
                <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                  {expandedRows.has('fcfRefi') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  Refinancing Proceeds
                </TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                {Array.from({ length: 10 }, (_, y) => {
                  let totalRefi = 0;
                  properties.forEach((prop, idx) => {
                    const refi = getPropertyRefinanceProceeds(prop, idx);
                    if (y === refi.year) totalRefi += refi.proceeds;
                  });
                  return (
                    <TableCell key={y} className={`text-right ${totalRefi > 0 ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                      {totalRefi > 0 ? formatMoney(totalRefi) : '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
              {expandedRows.has('fcfRefi') && properties.filter(p => p.willRefinance === "Yes").map((prop, idx) => {
                const propIdx = properties.findIndex(p => p.id === prop.id);
                const refi = getPropertyRefinanceProceeds(prop, propIdx);
                return (
                  <TableRow key={prop.id} className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">{prop.name}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className={`text-right text-sm ${y === refi.year ? 'text-accent' : 'text-muted-foreground'}`}>
                        {y === refi.year ? formatMoney(refi.proceeds) : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}

              <TableRow 
                className="font-semibold bg-accent/20 cursor-pointer hover:bg-accent/30"
                onClick={() => toggleRow('fcfExit')}
              >
                <TableCell className="sticky left-0 bg-accent/20 flex items-center gap-2">
                  {expandedRows.has('fcfExit') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  Exit Proceeds (Year 10)
                </TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                {Array.from({ length: 10 }, (_, y) => (
                  <TableCell key={y} className={`text-right ${y === 9 ? 'text-accent font-bold' : 'text-muted-foreground'}`}>
                    {y === 9 ? formatMoney(totalExitValue) : '-'}
                  </TableCell>
                ))}
              </TableRow>
              {expandedRows.has('fcfExit') && properties.map((prop, idx) => (
                <TableRow key={prop.id} className="bg-muted/10">
                  <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">
                    {prop.name} 
                    <span className="text-xs ml-2">({((prop.exitCapRate || 0.085) * 100).toFixed(1)}% cap)</span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                  {Array.from({ length: 10 }, (_, y) => (
                    <TableCell key={y} className={`text-right text-sm ${y === 9 ? 'text-accent' : 'text-muted-foreground'}`}>
                      {y === 9 ? formatMoney(getPropertyExitValue(prop, idx)) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              <TableRow className="bg-primary/10 font-bold text-lg">
                <TableCell className="sticky left-0 bg-primary/10">Net Cash Flow to Investors</TableCell>
                {consolidatedFlows.map((cf, i) => (
                  <TableCell key={i} className={`text-right ${cf < 0 ? 'text-destructive' : ''}`}>
                    {formatMoney(cf)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-muted/30">
                <TableCell className="sticky left-0 bg-muted/30 font-semibold">Cumulative Cash Flow</TableCell>
                {(() => {
                  let cumulative = 0;
                  return consolidatedFlows.map((cf, i) => {
                    cumulative += cf;
                    return (
                      <TableCell key={i} className={`text-right font-medium ${cumulative < 0 ? 'text-destructive' : 'text-accent'}`}>
                        {formatMoney(cumulative)}
                      </TableCell>
                    );
                  });
                })()}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property-Level IRR Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">Individual property returns based on equity investment, cash flows, and exit value</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Equity Investment</TableHead>
                <TableHead className="text-right">Tax Rate</TableHead>
                <TableHead className="text-right">Exit Cap Rate</TableHead>
                <TableHead className="text-right">Exit Value (Y10)</TableHead>
                <TableHead className="text-right">Total Distributions</TableHead>
                <TableHead className="text-right">Equity Multiple</TableHead>
                <TableHead className="text-right">IRR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((prop, idx) => {
                const equity = getPropertyInvestment(prop);
                const exitValue = getPropertyExitValue(prop, idx);
                const cashFlows = getPropertyCashFlows(prop, idx);
                const irr = calculateIRR(cashFlows);
                const totalDistributions = cashFlows.slice(1).reduce((a, b) => a + b, 0);
                const equityMultiple = totalDistributions / equity;
                
                return (
                  <TableRow key={prop.id}>
                    <TableCell className="font-medium">{prop.name}</TableCell>
                    <TableCell className="text-right">{formatMoney(equity)}</TableCell>
                    <TableCell className="text-right">{((prop.taxRate || 0.25) * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right">{((prop.exitCapRate || 0.085) * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-accent">{formatMoney(exitValue)}</TableCell>
                    <TableCell className="text-right">{formatMoney(totalDistributions)}</TableCell>
                    <TableCell className="text-right font-medium">{equityMultiple.toFixed(2)}x</TableCell>
                    <TableCell className={`text-right font-bold ${irr > 0.15 ? 'text-accent' : irr > 0 ? 'text-primary' : 'text-destructive'}`}>
                      {(irr * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-primary/10 font-bold">
                <TableCell>Portfolio Total</TableCell>
                <TableCell className="text-right">{formatMoney(totalInitialEquity)}</TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                <TableCell className="text-right text-accent">{formatMoney(totalExitValue)}</TableCell>
                <TableCell className="text-right">{formatMoney(consolidatedFlows.slice(1).reduce((a, b) => a + b, 0))}</TableCell>
                <TableCell className="text-right">{(consolidatedFlows.slice(1).reduce((a, b) => a + b, 0) / totalInitialEquity).toFixed(2)}x</TableCell>
                <TableCell className="text-right text-primary">{(portfolioIRR * 100).toFixed(1)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
