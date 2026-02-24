import React from "react";
import { formatMoney } from "@/lib/financialEngine";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ChevronRight, ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/graphics";
import type { CompanyBalanceSheetProps } from "./types";

export default function CompanyBalanceSheet({
  financials,
  global,
  projectionYears,
  getFiscalYear,
  fundingLabel,
  bsExpanded,
  setBsExpanded,
  tableRef,
  activeTab,
}: CompanyBalanceSheetProps) {
  return (
    <ScrollReveal>
    <div ref={activeTab === 'balance' ? tableRef : undefined} className="bg-white rounded-2xl p-6 shadow-sm border">
      <div>
        <h3 className="text-lg font-display text-gray-900 mb-4">Balance Sheet - {global?.companyName || "Hospitality Business Co."} (As of {getFiscalYear(projectionYears - 1)})</h3>
        {(() => {
          const cumulativeNetIncome = financials.reduce((a, m) => a + m.netIncome, 0);
          
          const safeTranche1 = global.safeTranche1Amount || 0;
          const safeTranche2 = global.safeTranche2Amount || 0;
          const totalSafeFunding = safeTranche1 + safeTranche2;
          
          const cashBalance = totalSafeFunding + cumulativeNetIncome;
          const totalAssets = cashBalance;
          
          const safeNotesPayable = totalSafeFunding;
          const totalLiabilities = safeNotesPayable;
          
          const retainedEarnings = cumulativeNetIncome;
          const totalEquity = retainedEarnings;
          const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

          return (
            <Table>
              <TableBody>
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={2} className="text-lg font-display text-accent">ASSETS</TableCell>
                </TableRow>
                
                <TableRow className="bg-gray-50">
                  <TableCell className="font-medium pl-4">Current Assets</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setBsExpanded(prev => ({ ...prev, cash: !prev.cash }))}
                >
                  <TableCell className="pl-8">
                    <span className="flex items-center gap-1">
                      {bsExpanded.cash ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      Cash & Cash Equivalents
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(cashBalance)}</TableCell>
                </TableRow>
                {bsExpanded.cash && (
                  <>
                    <TableRow className="bg-blue-50/40" data-expandable-row="true">
                      <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">{fundingLabel} Funding (Total)</TableCell>
                      <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(totalSafeFunding)}</TableCell>
                    </TableRow>
                    {safeTranche1 > 0 && (
                      <TableRow className="bg-blue-50/40" data-expandable-row="true">
                        <TableCell className="pl-16 py-0.5 text-xs text-gray-500 italic">Tranche 1</TableCell>
                        <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(safeTranche1)}</TableCell>
                      </TableRow>
                    )}
                    {safeTranche2 > 0 && (
                      <TableRow className="bg-blue-50/40" data-expandable-row="true">
                        <TableCell className="pl-16 py-0.5 text-xs text-gray-500 italic">Tranche 2</TableCell>
                        <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(safeTranche2)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-blue-50/40" data-expandable-row="true">
                      <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">+ Cumulative Net Income</TableCell>
                      <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(cumulativeNetIncome)}</TableCell>
                    </TableRow>
                  </>
                )}
                <TableRow className="font-medium bg-gray-50/50">
                  <TableCell className="pl-4">Total Current Assets</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(cashBalance)}</TableCell>
                </TableRow>
                
                <TableRow className="font-semibold border-t-2">
                  <TableCell>TOTAL ASSETS</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(totalAssets)}</TableCell>
                </TableRow>

                <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={2} className="text-lg font-display text-accent">LIABILITIES</TableCell>
                </TableRow>
                
                <TableRow className="bg-gray-50">
                  <TableCell className="font-medium pl-4">Long-Term Liabilities</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setBsExpanded(prev => ({ ...prev, notes: !prev.notes }))}
                >
                  <TableCell className="pl-8">
                    <span className="flex items-center gap-1">
                      {bsExpanded.notes ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      {fundingLabel} Notes Payable
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(safeNotesPayable)}</TableCell>
                </TableRow>
                {bsExpanded.notes && (
                  <>
                    {safeTranche1 > 0 && (
                      <TableRow className="bg-blue-50/40" data-expandable-row="true">
                        <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">Tranche 1</TableCell>
                        <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(safeTranche1)}</TableCell>
                      </TableRow>
                    )}
                    {safeTranche2 > 0 && (
                      <TableRow className="bg-blue-50/40" data-expandable-row="true">
                        <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">Tranche 2</TableCell>
                        <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(safeTranche2)}</TableCell>
                      </TableRow>
                    )}
                  </>
                )}
                <TableRow className="font-medium bg-gray-50/50">
                  <TableCell className="pl-4">Total Long-Term Liabilities</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(totalLiabilities)}</TableCell>
                </TableRow>
                
                <TableRow className="font-semibold border-t">
                  <TableCell>TOTAL LIABILITIES</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(totalLiabilities)}</TableCell>
                </TableRow>

                <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={2} className="text-lg font-display text-accent">EQUITY</TableCell>
                </TableRow>
                
                <TableRow
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setBsExpanded(prev => ({ ...prev, equity: !prev.equity }))}
                >
                  <TableCell className="pl-4">
                    <span className="flex items-center gap-1">
                      {bsExpanded.equity ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      Retained Earnings
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(retainedEarnings)}</TableCell>
                </TableRow>
                {bsExpanded.equity && (
                  <>
                    <TableRow className="bg-blue-50/40" data-expandable-row="true">
                      <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">Cumulative Revenue</TableCell>
                      <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(financials.reduce((a, m) => a + m.totalRevenue, 0))}</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50/40" data-expandable-row="true">
                      <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">Less: Cumulative Expenses</TableCell>
                      <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(-financials.reduce((a, m) => a + m.totalExpenses, 0))}</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50/40" data-expandable-row="true">
                      <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">= Net Income</TableCell>
                      <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(cumulativeNetIncome)}</TableCell>
                    </TableRow>
                  </>
                )}
                
                <TableRow className="font-semibold border-t">
                  <TableCell>TOTAL EQUITY</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(totalEquity)}</TableCell>
                </TableRow>

                <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                <TableRow className="font-bold border-t-2 bg-primary/10">
                  <TableCell>TOTAL LIABILITIES & EQUITY</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(totalLiabilitiesAndEquity)}</TableCell>
                </TableRow>

                {Math.abs(totalAssets - totalLiabilitiesAndEquity) > 1 && (
                  <TableRow>
                    <TableCell colSpan={2} className="bg-red-50 border-t border-red-200">
                      <span className="text-red-700 text-xs font-medium">
                        Balance sheet does not balance — Assets {formatMoney(totalAssets)} ≠ L+E {formatMoney(totalLiabilitiesAndEquity)} (variance: {formatMoney(totalAssets - totalLiabilitiesAndEquity)})
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          );
        })()}
      </div>
    </div>
    </ScrollReveal>
  );
}
