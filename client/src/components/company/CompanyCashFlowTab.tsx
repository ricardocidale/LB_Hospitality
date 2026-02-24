import React from "react";
import { formatMoney } from "@/lib/financialEngine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/graphics";
import type { CompanyTabProps } from "./types";

export default function CompanyCashFlowTab({
  financials,
  properties,
  global,
  projectionYears,
  expandedRows,
  toggleRow,
  getFiscalYear,
  fundingLabel,
  tableRef,
  activeTab,
  propertyFinancials,
}: CompanyTabProps) {
  const getPropertyYearlyBaseFee = (propIdx: number, year: number) => {
    const pf = propertyFinancials[propIdx].financials;
    const yearData = pf.slice(year * 12, (year + 1) * 12);
    return yearData.reduce((a: number, m: any) => a + m.feeBase, 0);
  };

  return (
    <ScrollReveal>
    <div ref={activeTab === 'cashflow' ? tableRef : undefined} className="bg-white rounded-2xl p-6 shadow-sm border">
      <div>
        <h3 className="text-lg font-display text-gray-900 mb-4">Statement of Cash Flows — {global?.companyName || "Hospitality Business Co."}</h3>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="sticky left-0 bg-gray-50 text-gray-700">Category</TableHead>
              {Array.from({ length: projectionYears }, (_, i) => (
                <TableHead key={i} className="text-right min-w-[100px]">{getFiscalYear(i)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="font-semibold bg-gray-50">
              <TableCell className="sticky left-0 bg-gray-50">Cash Flow from Operating Activities</TableCell>
              {Array.from({ length: projectionYears }, (_, i) => (
                <TableCell key={i} className="text-right font-mono"></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="sticky left-0 bg-white pl-6">Cash Received from Management Fees</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
              })}
            </TableRow>
            <TableRow 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleRow('cfBaseFees')}
            >
              <TableCell className="sticky left-0 bg-white flex items-center gap-2 pl-10">
                {expandedRows.has('cfBaseFees') ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
                Service Fees
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
                return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
              })}
            </TableRow>
            {expandedRows.has('cfBaseFees') && (() => {
              const categoryNames = Object.keys(financials[0]?.serviceFeeBreakdown?.byCategory ?? {});
              if (categoryNames.length === 0) {
                return properties.map((prop, idx) => (
                  <TableRow key={`cfbase-${prop.id}`} className="bg-gray-50/50">
                    <TableCell className="sticky left-0 bg-gray-50/50 pl-14 text-sm text-gray-600">
                      {prop.name}
                    </TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">
                        {formatMoney(getPropertyYearlyBaseFee(idx, y))}
                      </TableCell>
                    ))}
                  </TableRow>
                ));
              }
              return categoryNames.map(catName => (
                <React.Fragment key={`cf-cat-${catName}`}>
                  <TableRow
                    className="cursor-pointer hover:bg-gray-50/70"
                    onClick={() => toggleRow(`cf-cat-${catName}`)}
                  >
                    <TableCell className="sticky left-0 bg-white pl-14 flex items-center gap-2 text-sm">
                      {expandedRows.has(`cf-cat-${catName}`) ? (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      {catName}
                    </TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => {
                      const yearData = financials.slice(y * 12, (y + 1) * 12);
                      const total = yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategory?.[catName] ?? 0) + a, 0);
                      return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                    })}
                  </TableRow>
                  {expandedRows.has(`cf-cat-${catName}`) && properties.map((prop) => (
                    <TableRow key={`cf-cat-${catName}-prop-${prop.id}`} className="bg-gray-50/30">
                      <TableCell className="sticky left-0 bg-gray-50/30 pl-[4.5rem] text-xs text-gray-500">
                        {prop.name}
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategoryByPropertyId?.[catName]?.[String(prop.id)] ?? 0) + a, 0);
                        return <TableCell key={y} className="text-right text-xs text-gray-500 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                  ))}
                </React.Fragment>
              ));
            })()}
            <TableRow 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleRow('cfIncentiveFees')}
            >
              <TableCell className="sticky left-0 bg-white flex items-center gap-2 pl-10">
                {expandedRows.has('cfIncentiveFees') ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
                Incentive Fees
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
                return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
              })}
            </TableRow>
            {expandedRows.has('cfIncentiveFees') && properties.map((prop) => (
              <TableRow key={`cfinc-${prop.id}`} className="bg-gray-50/50">
                <TableCell className="sticky left-0 bg-gray-50/50 pl-14 text-sm text-gray-600">
                  {prop.name}
                </TableCell>
                {Array.from({ length: projectionYears }, (_, y) => {
                  const yearData = financials.slice(y * 12, (y + 1) * 12);
                  const total = yearData.reduce((a, m) => (m.incentiveFeeByPropertyId?.[String(prop.id)] ?? 0) + a, 0);
                  return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                })}
              </TableRow>
            ))}
            <TableRow
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleRow('cfOutflows')}
            >
              <TableCell className="sticky left-0 bg-white flex items-center gap-2 pl-6">
                {expandedRows.has('cfOutflows') ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
                Cash Paid for Operating Expenses
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                return <TableCell key={y} className="text-right font-mono">({formatMoney(total)})</TableCell>;
              })}
            </TableRow>
            {expandedRows.has('cfOutflows') && (
              <>
                <TableRow 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleRow('cfComp')}
                >
                  <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                    {expandedRows.has('cfComp') ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                    Compensation
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.partnerCompensation + m.staffCompensation, 0);
                    return <TableCell key={y} className="text-right text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('cfComp') && (
                  <>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Partner Compensation</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.partnerCompensation, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Staff Compensation</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.staffCompensation, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                  </>
                )}
                <TableRow 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleRow('cfFixed')}
                >
                  <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                    {expandedRows.has('cfFixed') ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                    Fixed Overhead
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
                    return <TableCell key={y} className="text-right text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('cfFixed') && (
                  <>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Office Lease</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.officeLease, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Professional Services</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.professionalServices, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Tech Infrastructure</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.techInfrastructure, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Business Insurance</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.businessInsurance, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                  </>
                )}
                <TableRow 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleRow('cfVar')}
                >
                  <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                    {expandedRows.has('cfVar') ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                    Variable Costs
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
                    return <TableCell key={y} className="text-right text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('cfVar') && (
                  <>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Travel Costs</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.travelCosts, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">IT Licensing</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.itLicensing, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Marketing</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.marketing, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Misc Operations</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.miscOps, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                  </>
                )}
              </>
            )}

            <TableRow className="border-t-2 border-gray-300 font-semibold">
              <TableCell className="sticky left-0 bg-white">Net Cash from Operating Activities</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.netIncome, 0);
                return (
                  <TableCell key={y} className={`text-right font-mono ${total < 0 ? 'text-destructive' : ''}`}>
                    {formatMoney(total)}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell className="sticky left-0 bg-white text-xs text-gray-400 italic pl-6">% of Revenue</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const cashFromOps = yearData.reduce((a, m) => a + m.netIncome, 0);
                const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                const pct = totalRevenue > 0 ? (cashFromOps / totalRevenue) * 100 : 0;
                return (
                  <TableCell key={y} className="text-right text-xs text-gray-400 italic font-mono px-2">
                    {totalRevenue > 0 ? `${pct.toFixed(1)}%` : "—"}
                  </TableCell>
                );
              })}
            </TableRow>

            <TableRow className="font-semibold bg-gray-50">
              <TableCell className="sticky left-0 bg-gray-50">Cash Flow from Financing Activities</TableCell>
              {Array.from({ length: projectionYears }, (_, i) => (
                <TableCell key={i} className="text-right font-mono"></TableCell>
              ))}
            </TableRow>
            <TableRow
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleRow('cfSafe')}
            >
              <TableCell className="sticky left-0 bg-white flex items-center gap-2 pl-6">
                {expandedRows.has('cfSafe') ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
                {fundingLabel} Funding Received
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.safeFunding, 0);
                return <TableCell key={y} className="text-right text-gray-600 font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
              })}
            </TableRow>
            {expandedRows.has('cfSafe') && (
              <>
                <TableRow className="bg-gray-50/50">
                  <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">
                    {fundingLabel} Tranche 1
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.safeFunding1, 0);
                    return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                  })}
                </TableRow>
                <TableRow className="bg-gray-50/50">
                  <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">
                    {fundingLabel} Tranche 2
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.safeFunding2, 0);
                    return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                  })}
                </TableRow>
              </>
            )}
            <TableRow className="border-t-2 border-gray-300 font-semibold">
              <TableCell className="sticky left-0 bg-white">Net Cash from Financing Activities</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.safeFunding, 0);
                return <TableCell key={y} className="text-right font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
              })}
            </TableRow>

            <TableRow className="bg-primary/10 font-bold">
              <TableCell className="sticky left-0 bg-primary/10">Net Increase (Decrease) in Cash</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.cashFlow, 0);
                return (
                  <TableCell key={y} className={`text-right font-mono ${total < 0 ? 'text-destructive' : ''}`}>
                    {formatMoney(total)}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell className="sticky left-0 bg-white text-gray-600">Opening Cash Balance</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                let cumulative = 0;
                for (let i = 0; i < y; i++) {
                  const yearData = financials.slice(i * 12, (i + 1) * 12);
                  cumulative += yearData.reduce((a, m) => a + m.cashFlow, 0);
                }
                return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(cumulative)}</TableCell>;
              })}
            </TableRow>
            <TableRow className="bg-gray-50 font-semibold">
              <TableCell className="sticky left-0 bg-gray-50">Closing Cash Balance</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                let cumulative = 0;
                for (let i = 0; i <= y; i++) {
                  const yearData = financials.slice(i * 12, (i + 1) * 12);
                  cumulative += yearData.reduce((a, m) => a + m.cashFlow, 0);
                }
                return (
                  <TableCell key={y} className={`text-right font-mono ${cumulative < 0 ? 'text-destructive' : ''}`}>
                    {formatMoney(cumulative)}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
    </ScrollReveal>
  );
}
