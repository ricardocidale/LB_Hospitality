import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, RefreshCw, Unlink, ArrowUpDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { formatMoney } from "@/lib/financialEngine";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import type { MonthlyFinancials } from "@/lib/financial/types";

interface PlaidAccount {
  id: number;
  institutionName: string;
  accountNames: string[];
  accountIds: string[];
  lastSyncedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PlaidTransaction {
  id: number;
  connectionId: number;
  propertyId: number;
  plaidTransactionId: string;
  date: string;
  name: string;
  merchantName: string | null;
  amount: number;
  isoCurrencyCode: string;
  usaliCategory: string | null;
  usaliDepartment: string | null;
  categorizationMethod: string | null;
  pending: boolean;
}

const USALI_LINE_ITEMS = [
  { category: "Rooms Revenue", key: "revenueRooms", type: "revenue" },
  { category: "F&B Revenue", key: "revenueFB", type: "revenue" },
  { category: "Events Revenue", key: "revenueEvents", type: "revenue" },
  { category: "Other Revenue", key: "revenueOther", type: "revenue" },
  { category: "Rooms Expense", key: "expenseRooms", type: "expense" },
  { category: "F&B Expense", key: "expenseFB", type: "expense" },
  { category: "Events Expense", key: "expenseEvents", type: "expense" },
  { category: "Other Expense", key: "expenseOther", type: "expense" },
  { category: "Admin & General", key: "expenseAdmin", type: "expense" },
  { category: "Marketing", key: "expenseMarketing", type: "expense" },
  { category: "Property Operations", key: "expensePropertyOps", type: "expense" },
  { category: "Utilities", key: "expenseUtilitiesVar", type: "expense" },
  { category: "IT & Telecom", key: "expenseIT", type: "expense" },
  { category: "Property Taxes", key: "expenseTaxes", type: "expense" },
  { category: "FF&E Reserve", key: "expenseFFE", type: "expense" },
  { category: "Management Fee", key: "feeBase", type: "expense" },
  { category: "Debt Service", key: "debtPayment", type: "expense" },
  { category: "Capital Expenditure", key: null, type: "expense" },
  { category: "Uncategorized", key: null, type: "expense" },
] as const;

function varianceClass(variance: number): string {
  const absV = Math.abs(variance);
  if (absV <= 0.05) return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/40";
  if (absV <= 0.15) return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/40";
  return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40";
}

function varianceLabel(variance: number): string {
  const pct = (variance * 100).toFixed(1);
  if (variance > 0) return `+${pct}%`;
  return `${pct}%`;
}

interface ReconciliationTabProps {
  propertyId: number;
  financials: MonthlyFinancials[];
  startYear: number;
  projectionYears: number;
}

export default function ReconciliationTab({ propertyId, financials, startYear, projectionYears }: ReconciliationTabProps) {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [view, setView] = useState<"table" | "trend">("table");

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<PlaidAccount[]>({
    queryKey: ["/api/plaid/accounts", propertyId],
    queryFn: () => apiRequest("GET", `/api/plaid/accounts/${propertyId}`).then(r => r.json()),
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<PlaidTransaction[]>({
    queryKey: ["/api/plaid/transactions", propertyId, selectedYear],
    queryFn: () => apiRequest("GET", `/api/plaid/transactions/${propertyId}?startDate=${selectedYear}-01-01&endDate=${selectedYear}-12-31`).then(r => r.json()),
    enabled: accounts.length > 0,
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/plaid/sync/${propertyId}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plaid/transactions", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/plaid/accounts", propertyId] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (connectionId: number) => apiRequest("DELETE", `/api/plaid/connection/${connectionId}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plaid/accounts", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/plaid/transactions", propertyId] });
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/plaid/link-token");
      const { linkToken } = await res.json();
      return linkToken;
    },
    onSuccess: (linkToken: string) => {
      if (typeof window !== "undefined" && (window as any).Plaid) {
        const handler = (window as any).Plaid.create({
          token: linkToken,
          onSuccess: async (publicToken: string, metadata: any) => {
            await apiRequest("POST", "/api/plaid/exchange", {
              publicToken,
              propertyId,
              institutionName: metadata.institution?.name || "Unknown",
              institutionId: metadata.institution?.institution_id,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/plaid/accounts", propertyId] });
          },
          onExit: () => {},
        });
        handler.open();
      }
    },
  });

  const monthlyActuals = useMemo(() => {
    const grouped: Record<number, Record<string, number>> = {};
    for (let m = 0; m < 12; m++) grouped[m] = {};

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      const month = txDate.getMonth();
      const cat = tx.usaliCategory || "Uncategorized";
      if (!grouped[month]) grouped[month] = {};
      grouped[month][cat] = (grouped[month][cat] || 0) + Math.abs(tx.amount);
    }
    return grouped;
  }, [transactions]);

  const monthlyProjected = useMemo(() => {
    const grouped: Record<number, Record<string, number>> = {};
    const yearOffset = selectedYear - startYear;
    const startIdx = yearOffset * 12;

    for (let m = 0; m < 12; m++) {
      const idx = startIdx + m;
      grouped[m] = {};
      if (idx >= 0 && idx < financials.length) {
        const fin = financials[idx];
        for (const item of USALI_LINE_ITEMS) {
          if (item.key) {
            grouped[m][item.category] = Math.abs(fin[item.key as keyof MonthlyFinancials] as number || 0);
          }
        }
      }
    }
    return grouped;
  }, [financials, selectedYear, startYear]);

  const reconciliationData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return USALI_LINE_ITEMS.map(item => {
      const monthData = months.map((monthName, mIdx) => {
        const actual = monthlyActuals[mIdx]?.[item.category] || 0;
        const projected = monthlyProjected[mIdx]?.[item.category] || 0;
        const variance = projected > 0 ? (actual - projected) / projected : 0;
        return { month: monthName, actual, projected, variance };
      });

      const totalActual = monthData.reduce((sum, m) => sum + m.actual, 0);
      const totalProjected = monthData.reduce((sum, m) => sum + m.projected, 0);
      const totalVariance = totalProjected > 0 ? (totalActual - totalProjected) / totalProjected : 0;

      return {
        category: item.category,
        type: item.type,
        months: monthData,
        totalActual,
        totalProjected,
        totalVariance,
      };
    });
  }, [monthlyActuals, monthlyProjected]);

  const trendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((monthName, mIdx) => {
      let totalActual = 0;
      let totalProjected = 0;
      for (const item of USALI_LINE_ITEMS) {
        totalActual += monthlyActuals[mIdx]?.[item.category] || 0;
        totalProjected += monthlyProjected[mIdx]?.[item.category] || 0;
      }
      const accuracy = totalProjected > 0
        ? Math.max(0, 1 - Math.abs(totalActual - totalProjected) / totalProjected) * 100
        : 100;
      return { month: monthName, actual: totalActual, projected: totalProjected, accuracy };
    });
  }, [monthlyActuals, monthlyProjected]);

  const years = useMemo(() => {
    const result = [];
    for (let y = startYear; y < startYear + projectionYears; y++) {
      result.push(y);
    }
    return result;
  }, [startYear, projectionYears]);

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reconciliation-tab">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg" data-testid="text-connected-accounts">Connected Accounts</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Link bank accounts to compare actual transactions against projected financials
            </p>
          </div>
          <Button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            data-testid="button-connect-bank"
          >
            {connectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Building2 className="w-4 h-4 mr-2" />}
            Link Bank Account
          </Button>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-accounts">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No bank accounts connected yet</p>
              <p className="text-sm mt-1">Click "Link Bank Account" to connect via Plaid</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  data-testid={`card-account-${account.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium" data-testid={`text-institution-${account.id}`}>{account.institutionName}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.accountNames.join(", ")}
                        {account.lastSyncedAt && (
                          <> · Last synced {new Date(account.lastSyncedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncMutation.mutate()}
                      disabled={syncMutation.isPending}
                      data-testid={`button-sync-${account.id}`}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                      Sync
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => disconnectMutation.mutate(account.id)}
                      disabled={disconnectMutation.isPending}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-disconnect-${account.id}`}
                    >
                      <Unlink className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {accounts.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-[140px]" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={view === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("table")}
                  data-testid="button-view-table"
                >
                  <ArrowUpDown className="w-4 h-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant={view === "trend" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("trend")}
                  data-testid="button-view-trend"
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Trend
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500" /> ≤5%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-yellow-500" /> 5-15%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500" /> &gt;15%
              </span>
            </div>
          </div>

          {view === "table" ? (
            <Card>
              <CardContent className="p-0">
                {txLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="table-reconciliation">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium sticky left-0 bg-muted/50 min-w-[180px]">USALI Category</th>
                          <th className="text-right p-3 font-medium min-w-[100px]">Actual YTD</th>
                          <th className="text-right p-3 font-medium min-w-[100px]">Projected YTD</th>
                          <th className="text-center p-3 font-medium min-w-[80px]">Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reconciliationData.map((row) => {
                          const isRevenue = row.type === "revenue";
                          return (
                            <tr
                              key={row.category}
                              className="border-b hover:bg-muted/30 transition-colors"
                              data-testid={`row-reconciliation-${row.category.replace(/\s+/g, '-').toLowerCase()}`}
                            >
                              <td className="p-3 font-medium sticky left-0 bg-background">
                                <div className="flex items-center gap-2">
                                  {isRevenue ? (
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                  )}
                                  {row.category}
                                </div>
                              </td>
                              <td className="text-right p-3 tabular-nums">{formatMoney(row.totalActual)}</td>
                              <td className="text-right p-3 tabular-nums">{formatMoney(row.totalProjected)}</td>
                              <td className="text-center p-3">
                                {row.totalProjected > 0 ? (
                                  <Badge className={`${varianceClass(row.totalVariance)} border-0`}>
                                    {varianceLabel(row.totalVariance)}
                                  </Badge>
                                ) : (
                                  <Minus className="w-4 h-4 mx-auto text-muted-foreground" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="border-t-2 font-bold bg-muted/30">
                          <td className="p-3 sticky left-0 bg-muted/30">Total</td>
                          <td className="text-right p-3 tabular-nums">
                            {formatMoney(reconciliationData.reduce((s, r) => s + r.totalActual, 0))}
                          </td>
                          <td className="text-right p-3 tabular-nums">
                            {formatMoney(reconciliationData.reduce((s, r) => s + r.totalProjected, 0))}
                          </td>
                          <td className="text-center p-3">
                            {(() => {
                              const totalP = reconciliationData.reduce((s, r) => s + r.totalProjected, 0);
                              const totalA = reconciliationData.reduce((s, r) => s + r.totalActual, 0);
                              const v = totalP > 0 ? (totalA - totalP) / totalP : 0;
                              return totalP > 0 ? (
                                <Badge className={`${varianceClass(v)} border-0`}>{varianceLabel(v)}</Badge>
                              ) : <Minus className="w-4 h-4 mx-auto text-muted-foreground" />;
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actual vs Projected — Monthly</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatMoney(v)} />
                      <Legend />
                      <Bar dataKey="actual" name="Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="projected" name="Projected" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Projection Accuracy Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        name="Accuracy"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction Log</CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8" data-testid="text-no-transactions">
                  No transactions found for {selectedYear}. Try syncing your accounts.
                </p>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm" data-testid="table-transactions">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Description</th>
                        <th className="text-right p-2 font-medium">Amount</th>
                        <th className="text-left p-2 font-medium">USALI Category</th>
                        <th className="text-left p-2 font-medium">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 100).map((tx) => (
                        <tr key={tx.id} className="border-b hover:bg-muted/30" data-testid={`row-transaction-${tx.id}`}>
                          <td className="p-2 tabular-nums text-muted-foreground">{tx.date}</td>
                          <td className="p-2">
                            <span className="font-medium">{tx.name}</span>
                            {tx.merchantName && tx.merchantName !== tx.name && (
                              <span className="text-muted-foreground ml-1">({tx.merchantName})</span>
                            )}
                          </td>
                          <td className={`text-right p-2 tabular-nums ${tx.amount < 0 ? "text-green-600" : "text-red-500"}`}>
                            {formatMoney(Math.abs(tx.amount))}
                          </td>
                          <td className="p-2">
                            {tx.usaliCategory ? (
                              <Badge variant="outline" className="text-xs">{tx.usaliCategory}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="p-2">
                            {tx.categorizationMethod ? (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                {tx.categorizationMethod}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length > 100 && (
                    <p className="text-center text-sm text-muted-foreground py-2">
                      Showing 100 of {transactions.length} transactions
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
