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
import { HelpTooltip } from "@/components/ui/help-tooltip";
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
    <div ref={activeTab === 'income' ? tableRef : undefined} className="bg-card rounded-2xl p-6 shadow-sm border">
      <div>
        <h3 className="text-lg font-display text-foreground mb-4">Income Statement - {global?.companyName || "Hospitality Business Co."}</h3>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="sticky left-0 bg-muted text-foreground">Category</TableHead>
              {Array.from({ length: projectionYears }, (_, i) => (
                <TableHead key={i} className="text-right min-w-[100px] text-foreground">{getFiscalYear(i)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted font-semibold border-border">
              <TableCell className="sticky left-0 bg-muted text-foreground">Revenue</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                return <TableCell key={y} className="text-right font-mono">{formatMoney(total)}</TableCell>;
              })}
            </TableRow>
            <FormulaRow
              rowKey="formula-totalRevenue"
              label="= Service Fees + Incentive Fees + Other Revenue"
              values={Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const base = yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
                const incentive = yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
                const other = yearData.reduce((a, m) => a + m.totalRevenue, 0) - base - incentive;
                if (other > 0) {
                  return `${formatMoney(base)} + ${formatMoney(incentive)} + ${formatMoney(other)}`;
                }
                return `${formatMoney(base)} + ${formatMoney(incentive)}`;
              })}
            />
            
            <TableRow 
              className="cursor-pointer hover:bg-muted"
              onClick={() => toggleRow('baseFees')}
              data-testid="row-service-fees"
            >
              <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                {expandedRows.has('baseFees') ? (
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
            
            {expandedRows.has('baseFees') && (() => {
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
                const propRowKey = `base-prop-${propId}`;
                return (
                  <React.Fragment key={propRowKey}>
                    <TableRow
                      className={hasMultipleCategories ? "cursor-pointer hover:bg-muted/70" : "bg-muted/50"}
                      onClick={hasMultipleCategories ? () => toggleRow(propRowKey) : undefined}
                      data-testid={`row-property-${propId}`}
                    >
                      <TableCell className={`sticky left-0 ${hasMultipleCategories ? 'bg-card' : 'bg-muted/50'} pl-12 flex items-center gap-2 text-sm text-muted-foreground`}>
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
                      <TableRow key={`base-prop-${propId}-cat-${catName}`} className="bg-muted/30" data-testid={`row-property-${propId}-category-${catName.toLowerCase().replace(/\s+/g, '-')}`}>
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
              onClick={() => toggleRow('incentiveFees')}
              data-testid="row-incentive-fees"
            >
              <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                {expandedRows.has('incentiveFees') ? (
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
            
            {expandedRows.has('incentiveFees') && properties.map((prop) => (
              <TableRow key={`incentive-${prop.id}`} className="bg-muted/50">
                <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">
                  {prop.name}
                </TableCell>
                {Array.from({ length: projectionYears }, (_, y) => {
                  const yearData = financials.slice(y * 12, (y + 1) * 12);
                  const total = yearData.reduce((a, m) => (m.incentiveFeeByPropertyId?.[String(prop.id)] ?? 0) + a, 0);
                  return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                })}
              </TableRow>
            ))}
            
            {/* Cost of Centralized Services — vendor costs for pass-through services */}
            {financials.some(m => m.totalVendorCost > 0) && (
              <>
                <TableRow
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleRow('vendorCosts')}
                  data-testid="row-vendor-costs"
                >
                  <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2 text-amber-700">
                    {expandedRows.has('vendorCosts') ? (
                      <ChevronDown className="w-4 h-4 text-amber-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-amber-500" />
                    )}
                    Cost of Centralized Services
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.totalVendorCost, 0);
                    return <TableCell key={y} className="text-right text-amber-700 font-mono">({formatMoney(total)})</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('vendorCosts') && (() => {
                  const formulaTotalKey = 'formula-vendorCosts-total';
                  return (
                    <>
                      <TableRow
                        className="bg-blue-50/40 cursor-pointer hover:bg-blue-100/40"
                        data-expandable-row="true"
                        onClick={() => toggleRow(formulaTotalKey)}
                        data-testid="row-vendor-costs-formula-toggle"
                      >
                        <TableCell className="sticky left-0 bg-blue-50/40 pl-10 py-0.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedRows.has(formulaTotalKey) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span className="italic">Aggregate Markup Formula</span>
                          </div>
                        </TableCell>
                        {Array.from({ length: projectionYears }, (_, i) => (
                          <TableCell key={i} className="py-0.5" />
                        ))}
                      </TableRow>
                      {expandedRows.has(formulaTotalKey) && (() => {
                        const yearlyCentralizedRevenue = Array.from({ length: projectionYears }, (_, y) => {
                          const yearData = financials.slice(y * 12, (y + 1) * 12);
                          return yearData.reduce((a, m) => a + (m.costOfCentralizedServices?.centralizedRevenue ?? 0), 0);
                        });
                        const yearlyTotalVendorCost = Array.from({ length: projectionYears }, (_, y) => {
                          const yearData = financials.slice(y * 12, (y + 1) * 12);
                          return yearData.reduce((a, m) => a + m.totalVendorCost, 0);
                        });
                        const yearlyTotalGrossProfit = yearlyCentralizedRevenue.map((rev, i) => rev - yearlyTotalVendorCost[i]);
                        return (
                          <>
                            <TableRow className="bg-blue-50/20" data-expandable-row="true">
                              <TableCell className="sticky left-0 bg-blue-50/20 pl-14 py-0.5 text-xs text-muted-foreground italic">
                                Total Fee Revenue from Centralized Services
                              </TableCell>
                              {yearlyCentralizedRevenue.map((v, i) => (
                                <TableCell key={i} className="text-right py-0.5 font-mono text-xs text-muted-foreground">
                                  {formatMoney(v)}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-blue-50/20" data-expandable-row="true">
                              <TableCell className="sticky left-0 bg-blue-50/20 pl-14 py-0.5 text-xs text-muted-foreground italic">
                                − Total Vendor Cost
                              </TableCell>
                              {yearlyTotalVendorCost.map((v, i) => (
                                <TableCell key={i} className="text-right py-0.5 font-mono text-xs text-destructive">
                                  ({formatMoney(v)})
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-blue-50/20" data-expandable-row="true">
                              <TableCell className="sticky left-0 bg-blue-50/20 pl-14 py-0.5 text-xs text-muted-foreground italic">
                                = Total Gross Profit
                              </TableCell>
                              {yearlyTotalGrossProfit.map((v, i) => (
                                <TableCell key={i} className="text-right py-0.5 font-mono text-xs text-accent">
                                  {formatMoney(v)}
                                </TableCell>
                              ))}
                            </TableRow>
                          </>
                        );
                      })()}
                    </>
                  );
                })()}
                {expandedRows.has('vendorCosts') && (() => {
                  const costData = financials.find(m => m.costOfCentralizedServices)?.costOfCentralizedServices;
                  if (!costData) return null;
                  return Object.entries(costData.byCategory)
                    .filter(([, v]) => v.serviceModel === 'centralized')
                    .map(([catName]) => {
                      const formulaKey = `formula-vendor-${catName}`;
                      return (
                        <React.Fragment key={`vendor-${catName}`}>
                          <TableRow
                            className="bg-amber-50/30 cursor-pointer hover:bg-amber-100/30"
                            onClick={() => toggleRow(formulaKey)}
                            data-testid={`row-vendor-${catName}`}
                          >
                            <TableCell className="sticky left-0 bg-amber-50/30 pl-12 text-sm text-amber-600 flex items-center gap-2">
                              {expandedRows.has(formulaKey) ? (
                                <ChevronDown className="w-3 h-3 text-amber-400" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-amber-400" />
                              )}
                              {catName}
                            </TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => {
                              const yearData = financials.slice(y * 12, (y + 1) * 12);
                              const total = yearData.reduce((a, m) => {
                                const cat = m.costOfCentralizedServices?.byCategory?.[catName];
                                return a + (cat?.vendorCost ?? 0);
                              }, 0);
                              return <TableCell key={y} className="text-right text-sm text-amber-600 font-mono">({formatMoney(total)})</TableCell>;
                            })}
                          </TableRow>
                          {expandedRows.has(formulaKey) && (() => {
                            const cat = costData.byCategory[catName];
                            if (!cat) return null;
                            const yearlyRevenue = Array.from({ length: projectionYears }, (_, y) => {
                              const yearData = financials.slice(y * 12, (y + 1) * 12);
                              return yearData.reduce((a, m) => a + (m.costOfCentralizedServices?.byCategory?.[catName]?.revenue ?? 0), 0);
                            });
                            const yearlyVendorCost = Array.from({ length: projectionYears }, (_, y) => {
                              const yearData = financials.slice(y * 12, (y + 1) * 12);
                              return yearData.reduce((a, m) => a + (m.costOfCentralizedServices?.byCategory?.[catName]?.vendorCost ?? 0), 0);
                            });
                            const yearlyGrossProfit = Array.from({ length: projectionYears }, (_, y) => {
                              const yearData = financials.slice(y * 12, (y + 1) * 12);
                              return yearData.reduce((a, m) => a + (m.costOfCentralizedServices?.byCategory?.[catName]?.grossProfit ?? 0), 0);
                            });
                            const markupPct = cat.markup;
                            return (
                              <>
                                <TableRow className="bg-blue-50/40" data-expandable-row="true">
                                  <TableCell className="sticky left-0 bg-blue-50/40 pl-16 py-0.5 text-xs text-muted-foreground italic">
                                    Fee Charged to Property
                                  </TableCell>
                                  {yearlyRevenue.map((v, i) => (
                                    <TableCell key={i} className="text-right py-0.5 font-mono text-xs text-muted-foreground">
                                      {formatMoney(v)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                                <TableRow className="bg-blue-50/40" data-expandable-row="true">
                                  <TableCell className="sticky left-0 bg-blue-50/40 pl-16 py-0.5 text-xs text-muted-foreground italic">
                                    Markup Rate: {(markupPct * 100).toFixed(0)}%
                                  </TableCell>
                                  {Array.from({ length: projectionYears }, (_, i) => (
                                    <TableCell key={i} className="py-0.5" />
                                  ))}
                                </TableRow>
                                <TableRow className="bg-blue-50/40" data-expandable-row="true">
                                  <TableCell className="sticky left-0 bg-blue-50/40 pl-16 py-0.5 text-xs text-muted-foreground italic">
                                    Vendor Cost = Fee ÷ (1 + {(markupPct * 100).toFixed(0)}%)
                                  </TableCell>
                                  {yearlyVendorCost.map((v, i) => (
                                    <TableCell key={i} className="text-right py-0.5 font-mono text-xs text-destructive">
                                      ({formatMoney(v)})
                                    </TableCell>
                                  ))}
                                </TableRow>
                                <TableRow className="bg-blue-50/40" data-expandable-row="true">
                                  <TableCell className="sticky left-0 bg-blue-50/40 pl-16 py-0.5 text-xs text-muted-foreground italic">
                                    Markup Margin = Fee − Vendor Cost
                                  </TableCell>
                                  {yearlyGrossProfit.map((v, i) => (
                                    <TableCell key={i} className="text-right py-0.5 font-mono text-xs text-accent">
                                      {formatMoney(v)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </>
                            );
                          })()}
                        </React.Fragment>
                      );
                    });
                })()}
                <TableRow className="bg-emerald-50/60 font-semibold border-border">
                  <TableCell className="sticky left-0 bg-emerald-50/60 text-emerald-800">Gross Profit</TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.grossProfit, 0);
                    return <TableCell key={y} className="text-right text-emerald-800 font-mono">{formatMoney(total)}</TableCell>;
                  })}
                </TableRow>
              </>
            )}

            <TableRow
              className="bg-muted font-semibold cursor-pointer hover:bg-muted"
              onClick={() => toggleRow('opex')}
            >
              <TableCell className="sticky left-0 bg-muted flex items-center gap-2">
                {expandedRows.has('opex') ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                Operating Expenses
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                return <TableCell key={y} className="text-right font-mono">{formatMoney(total)}</TableCell>;
              })}
            </TableRow>
            <FormulaRow
              rowKey="formula-totalExpenses"
              label="= Compensation + Fixed Overhead + Variable Costs"
              values={Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const comp = yearData.reduce((a, m) => a + m.partnerCompensation + m.staffCompensation, 0);
                const fixed = yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
                const variable = yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
                return `${formatMoney(comp)} + ${formatMoney(fixed)} + ${formatMoney(variable)}`;
              })}
            />
            {expandedRows.has('opex') && (
              <>
                <TableRow 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleRow('opexComp')}
                >
                  <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                    {expandedRows.has('opexComp') ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    Compensation
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.partnerCompensation + m.staffCompensation, 0);
                    return <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('opexComp') && (
                  <>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Partner Compensation</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.partnerCompensation, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Staff Compensation</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.staffCompensation, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                  </>
                )}
                <TableRow 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleRow('opexFixed')}
                >
                  <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                    {expandedRows.has('opexFixed') ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    Fixed Overhead
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
                    return <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('opexFixed') && (
                  <>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Office Lease</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.officeLease, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Professional Services</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.professionalServices, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Tech Infrastructure</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.techInfrastructure, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Business Insurance</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.businessInsurance, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                  </>
                )}
                <TableRow 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleRow('opexVar')}
                >
                  <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                    {expandedRows.has('opexVar') ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    Variable Costs
                  </TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => {
                    const yearData = financials.slice(y * 12, (y + 1) * 12);
                    const total = yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
                    return <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                  })}
                </TableRow>
                {expandedRows.has('opexVar') && (
                  <>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Travel Costs</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.travelCosts, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">IT Licensing</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.itLicensing, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Marketing</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.marketing, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <FormulaRow
                      rowKey="formula-marketing"
                      label={`= ${((global.marketingRate ?? 0) * 100).toFixed(1)}% of Total Revenue`}
                      values={Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const revenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        const rate = ((global.marketingRate ?? 0) * 100).toFixed(1);
                        return `${rate}% × ${formatMoney(revenue)}`;
                      })}
                    />
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 pl-12 text-sm text-muted-foreground">Misc Operations</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.miscOps, 0);
                        return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <FormulaRow
                      rowKey="formula-miscOps"
                      label={`= ${((global.miscOpsRate ?? 0) * 100).toFixed(1)}% of Total Revenue`}
                      values={Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const revenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        const rate = ((global.miscOpsRate ?? 0) * 100).toFixed(1);
                        return `${rate}% × ${formatMoney(revenue)}`;
                      })}
                    />
                  </>
                )}
              </>
            )}
            <TableRow>
              <TableCell className="sticky left-0 bg-card text-xs text-muted-foreground italic pl-6">
                <span className="flex items-center gap-1">
                  OpEx % of Revenue
                  <HelpTooltip text="Total Operating Expenses as a percentage of Total Revenue. Lower is better — indicates operational efficiency." />
                </span>
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const totalExpenses = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                const pct = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
                return (
                  <TableCell key={y} className="text-right text-xs text-muted-foreground italic font-mono px-2">
                    {totalRevenue > 0 ? `${pct.toFixed(1)}%` : "—"}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow className="bg-muted font-semibold border-border">
              <TableCell className="sticky left-0 bg-muted text-foreground">EBITDA</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.preTaxIncome, 0);
                return (
                  <TableCell key={y} className={`text-right font-mono ${total < 0 ? 'text-destructive' : ''}`}>
                    {formatMoney(total)}
                  </TableCell>
                );
              })}
            </TableRow>
            <FormulaRow
              rowKey="formula-ebitda"
              label={financials.some(m => m.totalVendorCost > 0) ? "= Gross Profit − Total Operating Expenses" : "= Total Revenue − Total Operating Expenses"}
              values={Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const hasVendorCosts = yearData.some(m => m.totalVendorCost > 0);
                const grossProfit = yearData.reduce((a, m) => a + m.grossProfit, 0);
                const revenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                const expenses = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                return hasVendorCosts
                  ? `${formatMoney(grossProfit)} − ${formatMoney(expenses)}`
                  : `${formatMoney(revenue)} − ${formatMoney(expenses)}`;
              })}
            />
            <TableRow>
              <TableCell className="sticky left-0 bg-card pl-6 text-muted-foreground">Tax</TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const total = yearData.reduce((a, m) => a + m.companyIncomeTax, 0);
                return <TableCell key={y} className="text-right text-muted-foreground font-mono">({formatMoney(total)})</TableCell>;
              })}
            </TableRow>
            <FormulaRow
              rowKey="formula-tax"
              label={`= ${((global.companyTaxRate ?? 0) * 100).toFixed(0)}% × EBITDA`}
              values={Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const ebitda = yearData.reduce((a, m) => a + m.preTaxIncome, 0);
                const rate = ((global.companyTaxRate ?? 0) * 100).toFixed(0);
                return `${rate}% × ${formatMoney(ebitda)}`;
              })}
            />
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
            <FormulaRow
              rowKey="formula-netIncome"
              label="= EBITDA − Tax"
              values={Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const ebitda = yearData.reduce((a, m) => a + m.preTaxIncome, 0);
                const tax = yearData.reduce((a, m) => a + m.companyIncomeTax, 0);
                return `${formatMoney(ebitda)} − ${formatMoney(tax)}`;
              })}
            />
            <TableRow>
              <TableCell className="sticky left-0 bg-card text-muted-foreground">
                <span className="flex items-center gap-1">
                  Net Margin
                  <HelpTooltip text="Net Income as a percentage of Total Revenue. Measures overall profitability after all expenses and taxes." />
                </span>
              </TableCell>
              {Array.from({ length: projectionYears }, (_, y) => {
                const yearData = financials.slice(y * 12, (y + 1) * 12);
                const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
                const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                const margin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
                return (
                  <TableCell key={y} className={`text-right text-muted-foreground font-mono ${margin < 0 ? 'text-destructive' : ''}`}>
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
