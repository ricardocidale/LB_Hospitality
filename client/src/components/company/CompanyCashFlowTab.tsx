/**
 * CompanyCashFlowTab.tsx — Cash flow statement for the management company.
 *
 * Tracks the cash position of the management entity across projection years:
 *
 *   Operating Cash Flow:
 *     Net Income (from the income statement)
 *     + Non-cash adjustments (depreciation, amortization)
 *     = Operating Cash Flow
 *
 *   Financing Activities:
 *     + SAFE note funding inflows (pre-revenue capital)
 *     − Partner draws / distributions
 *
 *   Ending Cash = Opening Cash + Operating CF + Financing CF
 *
 * Also computes "months of runway" (ending cash / monthly burn rate) which
 * is critical for a startup management company that may operate at a loss
 * in early years before the portfolio reaches sufficient scale.
 *
 * Summary cards at the top show opening cash, operating cash, funding
 * received, partner draws, and closing cash for the selected year.
 */
import React from "react";
import { formatMoney } from "@/lib/financialEngine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, ChevronDown } from "@/components/icons/themed-icons";
import { ScrollReveal } from "@/components/graphics";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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
  // Sums a single property's base management fee across 12 months for
  // a given projection year. Used in the drill-down rows to show how much
  // each property contributes to the company's service fee revenue.
  const getPropertyYearlyBaseFee = (propIdx: number, year: number) => {
    const pf = propertyFinancials[propIdx].financials;
    // financials is a flat array of monthly data; slice 12 months for year Y
    const yearData = pf.slice(year * 12, (year + 1) * 12);
    return yearData.reduce((a: number, m: any) => a + m.feeBase, 0);
  };

  const FormulaRow = ({ rowKey, label, values }: { rowKey: string; label: string; values: string[] }) => (
    <>
      <TableRow
        className="bg-blue-50/40 cursor-pointer hover:bg-blue-100/40"
        data-expandable-row="true"
        onClick={() => toggleRow(rowKey)}
      >
        <TableCell className="sticky left-0 bg-blue-50/40 pl-8 py-0.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {expandedRows.has(rowKey) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="italic">Formula</span>
          </div>
        </TableCell>
        {Array.from({ length: projectionYears }, (_, i) => (
          <TableCell key={i} className="py-0.5" />
        ))}
      </TableRow>
      {expandedRows.has(rowKey) && (
        <TableRow className="bg-blue-50/20" data-expandable-row="true">
          <TableCell className="sticky left-0 bg-blue-50/20 pl-12 py-0.5 text-xs text-muted-foreground italic">
            {label}
          </TableCell>
          {values.map((v, i) => (
            <TableCell key={i} className="text-right py-0.5 font-mono text-xs text-muted-foreground">
              {v}
            </TableCell>
          ))}
        </TableRow>
      )}
    </>
  );

  return (
    <ScrollReveal>
    <div ref={activeTab === 'cashflow' ? tableRef : undefined} className="bg-card rounded-2xl p-6 shadow-sm border">
      <div>
        <h3 className="text-lg font-display text-foreground mb-4">Statement of Cash Flows — {global?.companyName || "Hospitality Business Co."}</h3>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="sticky left-0 bg-muted text-foreground">Category</TableHead>
              {Array.from({ length: projectionYears }, (_, i) => (
                <TableHead key={i} className="text-right min-w-[100px]">{getFiscalYear(i)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="font-semibold bg-muted">
              <TableCell className="sticky left-0 bg-muted">Cash Flow from Operating Activities</TableCell>
              {Array.from({ length: projectionYears }, (_, i) => (
                <TableCell key={i} className="text-right font-mono"></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="sticky left-0 bg-card pl-6">Cash Received from Management Fees</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                return <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
              })}
            </TableRow>
            <TableRow 
              className="cursor-pointer hover:bg-muted"
              onClick={() => toggleRow('cfBaseFees')}
            >
              <TableCell className="sticky left-0 bg-card flex items-center gap-2 pl-10">
                {expandedRows.has('cfBaseFees') ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                Service Fees
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
                return <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
              })}
            </TableRow>
            {expandedRows.has('cfBaseFees') && (() => {
              const propCategoryMap: Record<string, Set<string>> = {};
              for (const month of financials) {
                const byCatByPropMonth = month.serviceFeeBreakdown?.byCategoryByPropertyId ?? {};
                for (const catName of Object.keys(byCatByPropMonth)) {
                  for (const pId of Object.keys(byCatByPropMonth[catName] ?? {})) {
                    if (!propCategoryMap[pId]) propCategoryMap[pId] = new Set();
                    propCategoryMap[pId].add(catName);
                  }
                }
              }
              const getCategoriesForProperty = (propId: string) => {
                return Array.from(propCategoryMap[propId] ?? []);
              };
              return properties.map((prop, idx) => {
                const propId = String(prop.id);
                const propCategories = getCategoriesForProperty(propId);
                const hasMultipleCategories = propCategories.length > 1;
                const propRowKey = `cf-prop-${propId}`;
                return (
                  <React.Fragment key={propRowKey}>
                    <TableRow
                      className={hasMultipleCategories ? "cursor-pointer hover:bg-muted/70" : "bg-muted/50"}
                      onClick={hasMultipleCategories ? () => toggleRow(propRowKey) : undefined}
                      data-testid={`row-cf-property-${propId}`}
                    >
                      <TableCell className={`sticky left-0 ${hasMultipleCategories ? 'bg-card' : 'bg-muted/50'} pl-14 flex items-center gap-2 text-sm text-muted-foreground`}>
                        {hasMultipleCategories && (
                          expandedRows.has(propRowKey) ? (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          )
                        )}
                        {prop.name}
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => (
                        <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">
                          {formatMoney(getPropertyYearlyBaseFee(idx, y))}
                        </TableCell>
                      ))}
                    </TableRow>
                    {hasMultipleCategories && expandedRows.has(propRowKey) && propCategories.map(catName => (
                      <TableRow key={`cf-prop-${propId}-cat-${catName}`} className="bg-muted/30" data-testid={`row-cf-property-${propId}-category-${catName.toLowerCase().replace(/\s+/g, '-')}`}>
                        <TableCell className="sticky left-0 bg-muted/30 pl-[4.5rem] text-xs text-muted-foreground">
                          {catName}
                        </TableCell>
                        {Array.from({ length: projectionYears }, (_, y) => {
                          const yearData = financials.slice(y * 12, (y + 1) * 12);
                          const total = yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategoryByPropertyId?.[catName]?.[propId] ?? 0) + a, 0);
                          return <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                        })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              });
            })()}
            <TableRow 
              className="cursor-pointer hover:bg-muted"
              onClick={() => toggleRow('cfIncentiveFees')}
            >
              <TableCell className="sticky left-0 bg-card flex items-center gap-2 pl-10">
                {expandedRows.has('cfIncentiveFees') ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                Incentive Fees
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
                return <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
              })}
            </TableRow>
            {expandedRows.has('cfIncentiveFees') && properties.map((prop) => (
              <TableRow key={`cfinc-${prop.id}`} className="bg-muted/50">
                <TableCell className="sticky left-0 bg-muted/50 pl-14 text-sm text-muted-foreground">
                  {prop.name}
                </TableCell>
                {Array.from({ length: projectionYears }, (_, y) => {
                  const yearData = financials.slice(y * 12, (y + 1) * 12);
                  const total = yearData.reduce((a, m) => (m.incentiveFeeByPropertyId?.[String(prop.id)] ?? 0) + a, 0);
                  return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                })}
              </TableRow>
            ))}
            <TableRow
              className="cursor-pointer hover:bg-muted"
              onClick={() => toggleRow('cfOutflows')}
            >
              <TableCell className="sticky left-0 bg-card flex items-center gap-2 pl-6">
                {expandedRows.has('cfOutflows') ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleRow('cfComp')}
                >
                  <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                    {expandedRows.has('cfComp') ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    Compensation
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.partnerCompensation + m.staffCompensation, 0);
                    return <TableCell key={y} className="text-right text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('cfComp') && (
                  <>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Partner Compensation</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.partnerCompensation, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Staff Compensation</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.staffCompensation, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                  </>
                )}
                <TableRow 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleRow('cfFixed')}
                >
                  <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                    {expandedRows.has('cfFixed') ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    Fixed Overhead
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure, 0);
                    return <TableCell key={y} className="text-right text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('cfFixed') && (
                  <>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Office Lease</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.officeLease, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Professional Services</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.professionalServices, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Tech Infrastructure</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.techInfrastructure, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                  </>
                )}
                <TableRow 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleRow('cfVar')}
                >
                  <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                    {expandedRows.has('cfVar') ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    Variable Costs
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
                    return <TableCell key={y} className="text-right text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('cfVar') && (
                  <>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Travel Costs</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.travelCosts, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">IT Licensing</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.itLicensing, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Marketing</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.marketing, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Misc Operations</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.miscOps, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                  </>
                )}
              </>
            )}

            <TableRow className="border-t-2 border-border font-semibold">
              <TableCell className="sticky left-0 bg-card">Net Cash from Operating Activities</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
                const interestAddback = yearData.reduce((a, m) => a + (m.fundingInterestExpense ?? 0), 0);
                const total = netIncome + interestAddback;
                return (
                  <TableCell key={y} className={`text-right font-mono ${total < 0 ? 'text-destructive' : ''}`}>
                    {formatMoney(total)}
                  </TableCell>
                );
              })}
            </TableRow>
            {financials.some(m => (m.fundingInterestExpense ?? 0) > 0) && (
              <TableRow>
                <TableCell className="sticky left-0 bg-card pl-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Add Back: Interest Expense
                    <InfoTooltip text="Interest expense is reclassified from operating to financing activities. The full amount is added back here and interest payments appear in financing cash flow." />
                  </span>
                </TableCell>
                {Array.from({ length: projectionYears }, (_, y) => {
                  const yearData = financials.slice(y * 12, (y + 1) * 12);
                  const interestAddback = yearData.reduce((a, m) => a + (m.fundingInterestExpense ?? 0), 0);
                  return (
                    <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">
                      {interestAddback > 0 ? formatMoney(interestAddback) : '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
            )}
            <FormulaRow
              rowKey="formula-operatingCF"
              label={
                financials.some(m => (m.fundingInterestExpense ?? 0) > 0)
                  ? (financials.some(m => m.totalVendorCost > 0) ? "= Revenue − Vendor Costs − Expenses − Tax + Interest Addback" : "= Net Income + Interest Expense Addback")
                  : (financials.some(m => m.totalVendorCost > 0) ? "= Revenue − Vendor Costs − Expenses − Tax" : "= Total Revenue − Total Expenses − Tax")
              }
              values={Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
                const interestAddback = yearData.reduce((a, m) => a + (m.fundingInterestExpense ?? 0), 0);
                return formatMoney(netIncome + interestAddback);
              })}
            />
            <TableRow>
              <TableCell className="sticky left-0 bg-card text-xs text-muted-foreground italic pl-6">
                <span className="flex items-center gap-1">
                  % of Revenue
                  <InfoTooltip text="Operating Cash Flow as a percentage of Total Revenue. Indicates how much of revenue converts to cash." />
                </span>
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
                const interestAddback = yearData.reduce((a, m) => a + (m.fundingInterestExpense ?? 0), 0);
                const cashFromOps = netIncome + interestAddback;
                const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                const pct = totalRevenue > 0 ? (cashFromOps / totalRevenue) * 100 : 0;
                return (
                  <TableCell key={y} className="text-right text-xs text-muted-foreground italic font-mono px-2">
                    {totalRevenue > 0 ? `${pct.toFixed(1)}%` : "—"}
                  </TableCell>
                );
              })}
            </TableRow>

            <TableRow className="font-semibold bg-muted">
              <TableCell className="sticky left-0 bg-muted">Cash Flow from Financing Activities</TableCell>
              {Array.from({ length: projectionYears }, (_, i) => (
                <TableCell key={i} className="text-right font-mono"></TableCell>
              ))}
            </TableRow>
            <TableRow
              className="cursor-pointer hover:bg-muted"
              onClick={() => toggleRow('cfSafe')}
            >
              <TableCell className="sticky left-0 bg-card flex items-center gap-2 pl-6">
                {expandedRows.has('cfSafe') ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                {fundingLabel} Funding Received
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.safeFunding, 0);
                return <TableCell key={y} className="text-right text-muted-foreground font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
              })}
            </TableRow>
            {expandedRows.has('cfSafe') && (
              <>
                <TableRow className="bg-muted/50">
                  <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">
                    {fundingLabel} Tranche 1
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.safeFunding1, 0);
                    return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                  })}
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">
                    {fundingLabel} Tranche 2
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.safeFunding2, 0);
                    return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                  })}
                </TableRow>
              </>
            )}
            {financials.some(m => (m.fundingInterestPayment ?? 0) > 0) && (
              <TableRow>
                <TableCell className="sticky left-0 bg-card pl-6 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Interest Paid on Notes
                    <InfoTooltip text="Cash payments of accrued interest on funding notes per the payment schedule." />
                  </span>
                </TableCell>
                {Array.from({ length: projectionYears }, (_, y) => {
                  const yearData = financials.slice(y * 12, (y + 1) * 12);
                  const total = yearData.reduce((a, m) => a + (m.fundingInterestPayment ?? 0), 0);
                  return (
                    <TableCell key={y} className="text-right text-muted-foreground font-mono">
                      {total > 0 ? `(${formatMoney(total)})` : '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
            )}
            <TableRow className="border-t-2 border-border font-semibold">
              <TableCell className="sticky left-0 bg-card">Net Cash from Financing Activities</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const funding = yearData.reduce((a, m) => a + m.safeFunding, 0);
                const interestPaid = yearData.reduce((a, m) => a + (m.fundingInterestPayment ?? 0), 0);
                const total = funding - interestPaid;
                return <TableCell key={y} className="text-right font-mono">{total !== 0 ? formatMoney(total) : '-'}</TableCell>;
              })}
            </TableRow>
            <FormulaRow
              rowKey="formula-financingCF"
              label={
                financials.some(m => (m.fundingInterestPayment ?? 0) > 0)
                  ? `= ${fundingLabel} Funding Received − Interest Paid on Notes`
                  : `= ${fundingLabel} Funding Received (Tranche 1 + Tranche 2)`
              }
              values={Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const t1 = yearData.reduce((a, m) => a + m.safeFunding1, 0);
                const t2 = yearData.reduce((a, m) => a + m.safeFunding2, 0);
                const interestPaid = yearData.reduce((a, m) => a + (m.fundingInterestPayment ?? 0), 0);
                if (interestPaid > 0) {
                  return `${formatMoney(t1 + t2)} − ${formatMoney(interestPaid)}`;
                }
                return t1 + t2 > 0 ? `${formatMoney(t1)} + ${formatMoney(t2)}` : '—';
              })}
            />

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
            <FormulaRow
              rowKey="formula-netCash"
              label="= Operating Cash Flow + Financing Cash Flow"
              values={Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
                const interestAddback = yearData.reduce((a, m) => a + (m.fundingInterestExpense ?? 0), 0);
                const opsCF = netIncome + interestAddback;
                const funding = yearData.reduce((a, m) => a + m.safeFunding, 0);
                const interestPaid = yearData.reduce((a, m) => a + (m.fundingInterestPayment ?? 0), 0);
                const finCF = funding - interestPaid;
                return `${formatMoney(opsCF)} + ${formatMoney(finCF)}`;
              })}
            />
            <TableRow>
              <TableCell className="sticky left-0 bg-card text-muted-foreground">Opening Cash Balance</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                let cumulative = 0;
                for (let i = 0; i < y; i++) {
                  const yearData = financials.slice(i * 12, (i + 1) * 12);
                  cumulative += yearData.reduce((a, m) => a + m.cashFlow, 0);
                }
                return <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(cumulative)}</TableCell>;
              })}
            </TableRow>
            <TableRow className="bg-muted font-semibold">
              <TableCell className="sticky left-0 bg-muted">Closing Cash Balance</TableCell>
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
            <FormulaRow
              rowKey="formula-closingCash"
              label="= Opening Cash + Net Change in Cash"
              values={Array.from({ length: projectionYears }, (_, y) => {
                let opening = 0;
                for (let i = 0; i < y; i++) {
                  const yd = financials.slice(i * 12, (i + 1) * 12);
                  opening += yd.reduce((a, m) => a + m.cashFlow, 0);
                }
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const netChange = yearData.reduce((a, m) => a + m.cashFlow, 0);
                return `${formatMoney(opening)} + ${formatMoney(netChange)}`;
              })}
            />
            <TableRow>
              <TableCell className="sticky left-0 bg-card text-muted-foreground">
                <span className="flex items-center gap-1">
                  Months of Runway
                  <InfoTooltip text="Closing Cash ÷ Average Monthly Burn Rate. Indicates how many months the company can operate before running out of cash at the current expense rate." />
                </span>
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                let closingCash = 0;
                for (let i = 0; i <= y; i++) {
                  const yd = financials.slice(i * 12, (i + 1) * 12);
                  closingCash += yd.reduce((a, m) => a + m.cashFlow, 0);
                }
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const annualExpenses = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                const annualInterestPaid = yearData.reduce((a, m) => a + (m.fundingInterestPayment ?? 0), 0);
                const monthlyBurn = (annualExpenses + annualInterestPaid) / 12;
                const months = monthlyBurn > 0 ? closingCash / monthlyBurn : Infinity;
                return (
                  <TableCell key={y} className={`text-right text-muted-foreground font-mono ${months < 6 ? 'text-destructive' : ''}`}>
                    {months === Infinity ? "∞" : `${months.toFixed(1)} mo`}
                  </TableCell>
                );
              })}
            </TableRow>
            <FormulaRow
              rowKey="formula-runway"
              label={financials.some(m => (m.fundingInterestPayment ?? 0) > 0)
                ? "= Closing Cash ÷ ((Annual Expenses + Interest Paid) ÷ 12)"
                : "= Closing Cash ÷ (Annual Expenses ÷ 12)"}
              values={Array.from({ length: projectionYears }, (_, y) => {
                let closingCash = 0;
                for (let i = 0; i <= y; i++) {
                  const yd = financials.slice(i * 12, (i + 1) * 12);
                  closingCash += yd.reduce((a, m) => a + m.cashFlow, 0);
                }
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const annualExpenses = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                const annualInterestPaid = yearData.reduce((a, m) => a + (m.fundingInterestPayment ?? 0), 0);
                const totalBurn = annualExpenses + annualInterestPaid;
                return `${formatMoney(closingCash)} ÷ ${formatMoney(totalBurn / 12)}/mo`;
              })}
            />
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
    </ScrollReveal>
  );
}
