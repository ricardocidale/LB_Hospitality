/**
 * CompanyIncomeTab.tsx — Multi-year income statement for the management company.
 *
 * Revenue:
 *   • Base Management Fees  – a percentage of each property's total revenue
 *   • Incentive Mgmt Fees   – a percentage of each property's GOP (Gross
 *     Operating Profit), earned only when the property exceeds profitability targets
 *   • Other Revenue          – any additional income (consulting, development fees)
 *
 * Expenses (company's own overhead, not property-level costs):
 *   • Partner Compensation   – draws and equity comp for founding partners
 *   • Staff Compensation     – salaries for operational employees (scaled by tier)
 *   • Fixed Overhead         – office lease, insurance, tech, professional services
 *   • Variable Costs         – marketing, travel, and other costs that scale
 *     with portfolio size or as a percentage of management fee revenue
 *
 * Bottom Line:
 *   • EBITDA = Revenue − Total Expenses (before depreciation, interest, and tax)
 *   • Net Income = EBITDA − Tax
 *
 * The table renders one column per projection year. Each row shows the dollar
 * amount and (for expense rows) the percentage of total revenue.
 */
import React, { useState } from "react";
import { formatMoney } from "@/lib/financialEngine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/graphics";
import type { CompanyTabProps } from "./types";

export default function CompanyIncomeTab({
  financials,
  properties,
  global,
  projectionYears,
  expandedRows,
  toggleRow,
  getFiscalYear,
  tableRef,
  activeTab,
  propertyFinancials,
}: CompanyTabProps) {
  // Sums a single property's base management fee across 12 months for
  // a given projection year. Used in drill-down rows to show per-property
  // contribution to the company's service fee revenue line.
  const getPropertyYearlyBaseFee = (propIdx: number, year: number) => {
    const pf = propertyFinancials[propIdx].financials;
    const yearData = pf.slice(year * 12, (year + 1) * 12);
    return yearData.reduce((a: number, m: any) => a + m.feeBase, 0);
  };

  return (
    <ScrollReveal>
    <div ref={activeTab === 'income' ? tableRef : undefined} className="bg-white rounded-2xl p-6 shadow-sm border">
      <div>
        <h3 className="text-lg font-display text-gray-900 mb-4">Income Statement - {global?.companyName || "Hospitality Business Co."}</h3>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="sticky left-0 bg-gray-50 text-gray-700">Category</TableHead>
              {Array.from({ length: projectionYears }, (_, i) => (
                <TableHead key={i} className="text-right min-w-[100px] text-gray-700">{getFiscalYear(i)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-gray-50 font-semibold border-gray-200">
              <TableCell className="sticky left-0 bg-gray-50 text-gray-900">Revenue</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                return <TableCell key={y} className="text-right font-mono">{formatMoney(total)}</TableCell>;
              })}
            </TableRow>
            
            <TableRow 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleRow('baseFees')}
              data-testid="row-service-fees"
            >
              <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                {expandedRows.has('baseFees') ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                Service Fees
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
                return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
              })}
            </TableRow>
            
            {expandedRows.has('baseFees') && (() => {
              const categoryNames = Object.keys(financials[0]?.serviceFeeBreakdown?.byCategory ?? {});
              if (categoryNames.length === 0) {
                return properties.map((prop, idx) => (
                  <TableRow key={`base-${prop.id}`} className="bg-gray-50/50">
                    <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">
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
                <React.Fragment key={`cat-${catName}`}>
                  <TableRow
                    className="cursor-pointer hover:bg-gray-50/70"
                    onClick={() => toggleRow(`cat-${catName}`)}
                    data-testid={`row-category-${catName.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <TableCell className="sticky left-0 bg-white pl-12 flex items-center gap-2 text-sm">
                      {expandedRows.has(`cat-${catName}`) ? (
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
                  {expandedRows.has(`cat-${catName}`) && properties.map((prop) => {
                    const propName = prop.name;
                    return (
                      <TableRow key={`cat-${catName}-prop-${prop.id}`} className="bg-gray-50/30">
                        <TableCell className="sticky left-0 bg-gray-50/30 pl-[4.5rem] text-xs text-gray-500">
                          {propName}
                        </TableCell>
                        {Array.from({ length: projectionYears }, (_, y) => {
                          const yearData = financials.slice(y * 12, (y + 1) * 12);
                          const total = yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategoryByPropertyId?.[catName]?.[String(prop.id)] ?? 0) + a, 0);
                          return <TableCell key={y} className="text-right text-xs text-gray-500 font-mono">{formatMoney(total)}</TableCell>;
                        })}
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ));
            })()}
            
            <TableRow 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleRow('incentiveFees')}
              data-testid="row-incentive-fees"
            >
              <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                {expandedRows.has('incentiveFees') ? (
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
            
            {expandedRows.has('incentiveFees') && properties.map((prop) => (
              <TableRow key={`incentive-${prop.id}`} className="bg-gray-50/50">
                <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">
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
              className="bg-gray-50 font-semibold cursor-pointer hover:bg-gray-100"
              onClick={() => toggleRow('opex')}
            >
              <TableCell className="sticky left-0 bg-gray-50 flex items-center gap-2">
                {expandedRows.has('opex') ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
                Operating Expenses
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                return <TableCell key={y} className="text-right font-mono">{formatMoney(total)}</TableCell>;
              })}
            </TableRow>
            {expandedRows.has('opex') && (
              <>
                <TableRow 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleRow('opexComp')}
                >
                  <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                    {expandedRows.has('opexComp') ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                    Compensation
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.partnerCompensation + m.staffCompensation, 0);
                    return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('opexComp') && (
                  <>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Partner Compensation</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.partnerCompensation, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Staff Compensation</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.staffCompensation, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                  </>
                )}
                <TableRow 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleRow('opexFixed')}
                >
                  <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                    {expandedRows.has('opexFixed') ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                    Fixed Overhead
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
                    return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('opexFixed') && (
                  <>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Office Lease</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.officeLease, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Professional Services</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.professionalServices, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Tech Infrastructure</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.techInfrastructure, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Business Insurance</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.businessInsurance, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                  </>
                )}
                <TableRow 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleRow('opexVar')}
                >
                  <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                    {expandedRows.has('opexVar') ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                    Variable Costs
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
                    return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('opexVar') && (
                  <>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Travel Costs</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.travelCosts, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">IT Licensing</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.itLicensing, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Marketing</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.marketing, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50/50">
                      <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Misc Operations</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.miscOps, 0);
                        return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                  </>
                )}
              </>
            )}
            <TableRow>
              <TableCell className="sticky left-0 bg-white text-xs text-gray-400 italic pl-6">OpEx % of Revenue</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const totalExpenses = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                const pct = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
                return (
                  <TableCell key={y} className="text-right text-xs text-gray-400 italic font-mono px-2">
                    {totalRevenue > 0 ? `${pct.toFixed(1)}%` : "—"}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow className="bg-primary/10 font-bold">
              <TableCell className="sticky left-0 bg-primary/10">Net Income</TableCell>
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
              <TableCell className="sticky left-0 bg-white text-gray-600">Net Margin</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
                const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                const margin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
                return (
                  <TableCell key={y} className={`text-right text-gray-600 font-mono ${margin < 0 ? 'text-destructive' : ''}`}>
                    {margin.toFixed(1)}%
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
