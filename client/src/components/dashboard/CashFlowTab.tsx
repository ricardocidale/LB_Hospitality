import React, { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ChevronDown } from "lucide-react";
import { formatMoney } from "@/lib/financialEngine";
import { CalcDetailsProvider } from "@/components/financial-table-rows";
import { DashboardTabProps } from "./types";
import { aggregateCashFlowByYear } from "@/lib/cashFlowAggregator";
import { LoanParams, GlobalLoanParams } from "@/lib/loanCalculations";

export function CashFlowTab({ financials, properties, projectionYears, getFiscalYear, showCalcDetails }: DashboardTabProps) {
  const { allPropertyFinancials, allPropertyYearlyCF } = financials;
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

  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));

  const consolidatedCFO = useMemo(() => 
    years.map((_, y) => allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.cashFromOperations ?? 0), 0)),
    [allPropertyYearlyCF, years]
  );

  const consolidatedCFI = useMemo(() => 
    years.map((_, y) => allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.capitalExpenditures ?? 0) + (prop[y]?.exitValue ?? 0), 0)),
    [allPropertyYearlyCF, years]
  );

  const consolidatedCFF = useMemo(() => 
    years.map((_, y) => allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.refinancingProceeds ?? 0) - (prop[y]?.principalPayment ?? 0), 0)),
    [allPropertyYearlyCF, years]
  );

  const netChangeInCash = useMemo(() => 
    years.map((_, y) => consolidatedCFO[y] + consolidatedCFI[y] + consolidatedCFF[y]),
    [consolidatedCFO, consolidatedCFI, consolidatedCFF, years]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consolidated Cash Flow Statement</CardTitle>
      </CardHeader>
      <CardContent>
        <CalcDetailsProvider show={showCalcDetails}>
          <div className="rounded-md border overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[250px] sticky left-0 bg-muted/50 z-10">Section</TableHead>
                  {years.map(year => (
                    <TableHead key={year} className="text-right">{year}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("cfo")} style={{ cursor: 'pointer' }}>
                  <TableCell className="sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      {expandedRows.has("cfo") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Cash Flow from Operations (CFO)
                    </div>
                  </TableCell>
                  {consolidatedCFO.map((val, i) => (
                    <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                  ))}
                </TableRow>
                {expandedRows.has("cfo") && properties.map((prop, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="pl-10 sticky left-0 bg-white z-10">{prop.name}</TableCell>
                    {years.map((_, y) => (
                      <TableCell key={y} className="text-right font-mono text-muted-foreground">
                        {formatMoney(allPropertyYearlyCF[idx]?.[y]?.cashFromOperations ?? 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("cfi")} style={{ cursor: 'pointer' }}>
                  <TableCell className="sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      {expandedRows.has("cfi") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Cash Flow from Investing (CFI)
                    </div>
                  </TableCell>
                  {consolidatedCFI.map((val, i) => (
                    <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                  ))}
                </TableRow>
                {expandedRows.has("cfi") && properties.map((prop, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="pl-10 sticky left-0 bg-white z-10">{prop.name}</TableCell>
                    {years.map((_, y) => (
                      <TableCell key={y} className="text-right font-mono text-muted-foreground">
                        {formatMoney((allPropertyYearlyCF[idx]?.[y]?.capitalExpenditures ?? 0) + (allPropertyYearlyCF[idx]?.[y]?.exitValue ?? 0))}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("cff")} style={{ cursor: 'pointer' }}>
                  <TableCell className="sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      {expandedRows.has("cff") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Cash Flow from Financing (CFF)
                    </div>
                  </TableCell>
                  {consolidatedCFF.map((val, i) => (
                    <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                  ))}
                </TableRow>
                {expandedRows.has("cff") && properties.map((prop, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="pl-10 sticky left-0 bg-white z-10">{prop.name}</TableCell>
                    {years.map((_, y) => (
                      <TableCell key={y} className="text-right font-mono text-muted-foreground">
                        {formatMoney((allPropertyYearlyCF[idx]?.[y]?.refinancingProceeds ?? 0) - (allPropertyYearlyCF[idx]?.[y]?.principalPayment ?? 0))}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                <TableRow className="bg-primary/10 font-bold border-t-2 border-primary">
                  <TableCell className="sticky left-0 bg-primary/5 z-10 font-bold">Net Change in Cash</TableCell>
                  {netChangeInCash.map((val, i) => (
                    <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CalcDetailsProvider>
      </CardContent>
    </Card>
  );
}
