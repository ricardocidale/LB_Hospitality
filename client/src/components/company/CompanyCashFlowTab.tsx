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
import { IconChevronDown, formatMoney } from "@/components/icons/brand-icons";
import React from "react";
;
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
  // Sums a single property's base management fee across 12 months for
  // a given projection year. Used in the drill-down rows to show how much
  // each property contributes to the company's service fee revenue.
  const getPropertyYearlyBaseFee = (propIdx: number, year: number) => {
    const pf = propertyFinancials[propIdx].financials;
    // financials is a flat array of monthly data; slice 12 months for year Y
    const yearData = pf.slice(year * 12, (year + 1) * 12);
    return yearData.reduce((a: number, m: any) => a + m.feeBase, 0);
  };

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
                  <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <IconChevronRight className="w-4 h-4 text-muted-foreground" />
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
              const categoryNames = Object.keys(financials[0]?.serviceFeeBreakdown?.byCategory ?? {});
              if (categoryNames.length === 0) {
                return properties.map((prop, idx) => (
                  <TableRow key={`cfbase-${prop.id}`} className="bg-muted/50">
                    <TableCell className="sticky left-0 bg-muted/50 pl-14 text-sm text-muted-foreground">
                      {prop.name}
                    </TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">
                        {formatMoney(getPropertyYearlyBaseFee(idx, y))}
                      </TableCell>
                    ))}
                  </TableRow>
                ));
              }
              return categoryNames.map(catName => (
                <React.Fragment key={`cf-cat-${catName}`}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/70"
                    onClick={() => toggleRow(`cf-cat-${catName}`)}
                  >
                    <TableCell className="sticky left-0 bg-card pl-14 flex items-center gap-2 text-sm">
                      {expandedRows.has(`cf-cat-${catName}`) ? (
                        <IconChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <IconChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      {catName}
                    </TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => {
                      const yearData = financials.slice(y * 12, (y + 1) * 12);
                      const total = yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategory?.[catName] ?? 0) + a, 0);
                      return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                    })}
                  </TableRow>
                  {expandedRows.has(`cf-cat-${catName}`) && properties.map((prop) => (
                    <TableRow key={`cf-cat-${catName}-prop-${prop.id}`} className="bg-muted/30">
                      <TableCell className="sticky left-0 bg-muted/30 pl-[4.5rem] text-xs text-muted-foreground">
                        {prop.name}
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategoryByPropertyId?.[catName]?.[String(prop.id)] ?? 0) + a, 0);
                        return <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                  ))}
                </React.Fragment>
              ));
            })()}
            <TableRow 
              className="cursor-pointer hover:bg-muted"
              onClick={() => toggleRow('cfIncentiveFees')}
            >
              <TableCell className="sticky left-0 bg-card flex items-center gap-2 pl-10">
                {expandedRows.has('cfIncentiveFees') ? (
                  <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <IconChevronRight className="w-4 h-4 text-muted-foreground" />
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
                  <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <IconChevronRight className="w-4 h-4 text-muted-foreground" />
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
                      <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <IconChevronRight className="w-4 h-4 text-muted-foreground" />
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
                      <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <IconChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    Fixed Overhead
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
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
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Business Insurance</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.businessInsurance, 0);
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
                      <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <IconChevronRight className="w-4 h-4 text-muted-foreground" />
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
                const total = yearData.reduce((a, m) => a + m.netIncome, 0);
                return (
                  <TableCell key={y} className={`text-right font-mono ${total < 0 ? 'text-destructive' : ''}`}>
                    {formatMoney(total)}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell className="sticky left-0 bg-card text-xs text-muted-foreground italic pl-6">% of Revenue</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const cashFromOps = yearData.reduce((a, m) => a + m.netIncome, 0);
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
                  <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <IconChevronRight className="w-4 h-4 text-muted-foreground" />
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
            <TableRow className="border-t-2 border-border font-semibold">
              <TableCell className="sticky left-0 bg-card">Net Cash from Financing Activities</TableCell>
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
            {/* Opening cash = sum of all prior years' net cash changes.
                Year 1 opens at $0; Year 2 opens with Year 1's closing balance, etc. */}
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
            {/* Closing cash = opening cash + this year's net cash change.
                Equivalent to summing all cash flows from Year 1 through Year Y. */}
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
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
    </ScrollReveal>
  );
}
