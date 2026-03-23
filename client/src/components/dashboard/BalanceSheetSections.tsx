import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChevronRight, ChevronDown } from "@/components/icons/themed-icons";
import { formatMoney } from "@/lib/financialEngine";
import { Property } from "@shared/schema";
import type { YearlyPerPropertyBS } from "./useBalanceSheetData";

interface SectionProps {
  years: number[];
  properties: Property[];
  expandedRows: Set<string>;
  expandedFormulas: Set<string>;
  toggleRow: (id: string) => void;
  toggleFormula: (id: string) => void;
  perPropertyByYear: Map<number, YearlyPerPropertyBS>[];
}

interface AssetsSectionProps extends SectionProps {
  consolidatedTotalAssets: number[];
  consolidatedCash: number[];
  consolidatedPPE: number[];
  consolidatedAccDep: number[];
  consolidatedDeferredFC: number[];
  consolidatedNetFixed: number[];
}

interface LiabilitiesSectionProps extends SectionProps {
  consolidatedTotalLiabilities: number[];
  consolidatedDebt: number[];
}

interface EquitySectionProps extends SectionProps {
  consolidatedTotalEquity: number[];
  consolidatedEquity: number[];
  consolidatedRetained: number[];
}

export function MetricItemRow({ label, values }: { label: string; values: string[] }) {
  return (
    <TableRow data-testid={`row-bs-metric-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
      <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm text-muted-foreground italic">{label}</TableCell>
      {values.map((val, i) => (
        <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground italic">
          {val}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function AssetsSection({
  years, properties, expandedRows, expandedFormulas, toggleRow, toggleFormula,
  perPropertyByYear, consolidatedTotalAssets, consolidatedCash, consolidatedPPE,
  consolidatedAccDep, consolidatedDeferredFC, consolidatedNetFixed,
}: AssetsSectionProps) {
  return (
    <>
      <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("assets")} style={{ cursor: 'pointer' }} data-testid="row-assets-header">
        <TableCell className="sticky left-0 bg-card z-10">
          <div className="flex items-center gap-2">
            {expandedRows.has("assets") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            TOTAL ASSETS
          </div>
        </TableCell>
        {consolidatedTotalAssets.map((val, i) => (
          <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
        ))}
      </TableRow>
      {expandedRows.has("assets") && (
        <>
          <TableRow
            className="bg-chart-1/5 cursor-pointer hover:bg-chart-1/5"
            data-expandable-row="true"
            onClick={() => toggleFormula("assets-formula")}
          >
            <TableCell className="pl-10 sticky left-0 bg-chart-1/5 z-10 py-0.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {expandedFormulas.has("assets-formula") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <span className="italic">Formula</span>
              </div>
            </TableCell>
            {consolidatedTotalAssets.map((_, i) => (
              <TableCell key={i} className="py-0.5" />
            ))}
          </TableRow>
          {expandedFormulas.has("assets-formula") && (
            <TableRow className="bg-chart-1/3" data-expandable-row="true">
              <TableCell className="pl-14 sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                = Current Assets + Net Fixed Assets + Other Assets
              </TableCell>
              {consolidatedTotalAssets.map((val, i) => (
                <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                  {formatMoney(val)}
                </TableCell>
              ))}
            </TableRow>
          )}

          <TableRow data-testid="row-bs-current-assets-header">
            <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold">Current Assets</TableCell>
            {years.map((_, i) => (<TableCell key={i} />))}
          </TableRow>

          <TableRow
            className="cursor-pointer hover:bg-muted/10"
            onClick={() => toggleFormula("cash-detail")}
            data-testid="row-bs-cash"
          >
            <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {expandedFormulas.has("cash-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Cash & Cash Equivalents
              </div>
            </TableCell>
            {consolidatedCash.map((val, i) => (
              <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
            ))}
          </TableRow>
          {expandedFormulas.has("cash-detail") && (
            <>
              <TableRow className="bg-chart-1/3" data-expandable-row="true">
                <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                  = Operating Reserves + Cumulative Cash Flow + Refinancing Proceeds
                </TableCell>
                {consolidatedCash.map((val, i) => (
                  <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(val)}</TableCell>
                ))}
              </TableRow>
              {properties.map((prop, idx) => (
                <TableRow key={idx} data-expandable-row="true">
                  <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                  {years.map((_, y) => (
                    <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                      {formatMoney(perPropertyByYear[y]?.get(idx)?.cash ?? 0)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          )}

          <TableRow data-testid="row-bs-total-current-assets">
            <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold border-t">Total Current Assets</TableCell>
            {consolidatedCash.map((val, i) => (
              <TableCell key={i} className="text-right font-mono text-sm font-semibold border-t">{formatMoney(val)}</TableCell>
            ))}
          </TableRow>

          <TableRow data-testid="row-bs-fixed-assets-header">
            <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold">Fixed Assets</TableCell>
            {years.map((_, i) => (<TableCell key={i} />))}
          </TableRow>

          <TableRow
            className="cursor-pointer hover:bg-muted/10"
            onClick={() => toggleFormula("ppe-detail")}
            data-testid="row-bs-ppe"
          >
            <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {expandedFormulas.has("ppe-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Property, Plant & Equipment
              </div>
            </TableCell>
            {consolidatedPPE.map((val, i) => (
              <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
            ))}
          </TableRow>
          {expandedFormulas.has("ppe-detail") && properties.map((prop, idx) => (
            <TableRow key={idx} data-expandable-row="true">
              <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
              {years.map((_, y) => (
                <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                  {formatMoney(perPropertyByYear[y]?.get(idx)?.ppe ?? 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}

          <TableRow
            className="cursor-pointer hover:bg-muted/10"
            onClick={() => toggleFormula("accdep-detail")}
            data-testid="row-bs-accdep"
          >
            <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {expandedFormulas.has("accdep-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Less: Accumulated Depreciation
              </div>
            </TableCell>
            {consolidatedAccDep.map((val, i) => (
              <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(-val)}</TableCell>
            ))}
          </TableRow>
          {expandedFormulas.has("accdep-detail") && (
            <>
              <TableRow className="bg-chart-1/3" data-expandable-row="true">
                <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                  Straight-line over 27.5 years (ASC 360)
                </TableCell>
                {consolidatedAccDep.map((val, i) => (
                  <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(-val)}</TableCell>
                ))}
              </TableRow>
              {properties.map((prop, idx) => (
                <TableRow key={idx} data-expandable-row="true">
                  <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                  {years.map((_, y) => (
                    <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                      {formatMoney(-(perPropertyByYear[y]?.get(idx)?.accDep ?? 0))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          )}

          <TableRow data-testid="row-bs-net-fixed-assets">
            <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold border-t">Net Fixed Assets</TableCell>
            {consolidatedNetFixed.map((val, i) => (
              <TableCell key={i} className="text-right font-mono text-sm font-semibold border-t">{formatMoney(val)}</TableCell>
            ))}
          </TableRow>

          {consolidatedDeferredFC.some(v => v > 0) && (
            <>
              <TableRow data-testid="row-bs-other-assets-header">
                <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold">Other Assets</TableCell>
                {years.map((_, i) => (<TableCell key={i} />))}
              </TableRow>

              <TableRow
                className="cursor-pointer hover:bg-muted/10"
                onClick={() => toggleFormula("deferredfc-detail")}
                data-testid="row-bs-deferred-financing"
              >
                <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    {expandedFormulas.has("deferredfc-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    Deferred Financing Costs
                  </div>
                </TableCell>
                {consolidatedDeferredFC.map((val, i) => (
                  <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
                ))}
              </TableRow>
              {expandedFormulas.has("deferredfc-detail") && (
                <>
                  <TableRow className="bg-chart-1/3" data-expandable-row="true">
                    <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                      Refinancing closing costs capitalized per ASC 835-30
                    </TableCell>
                    {consolidatedDeferredFC.map((val, i) => (
                      <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(val)}</TableCell>
                    ))}
                  </TableRow>
                  {properties.map((prop, idx) => {
                    const hasAny = years.some((_, y) => (perPropertyByYear[y]?.get(idx)?.deferredFinancing ?? 0) > 0);
                    if (!hasAny) return null;
                    return (
                      <TableRow key={idx} data-expandable-row="true">
                        <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                        {years.map((_, y) => (
                          <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                            {formatMoney(perPropertyByYear[y]?.get(idx)?.deferredFinancing ?? 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </>
              )}
            </>
          )}

          <TableRow
            className="cursor-pointer hover:bg-muted/10"
            onClick={() => toggleFormula("assets-by-entity")}
            data-testid="row-bs-assets-by-entity"
          >
            <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {expandedFormulas.has("assets-by-entity") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Assets by Entity (SPV)
              </div>
            </TableCell>
            {consolidatedTotalAssets.map((val, i) => (
              <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
            ))}
          </TableRow>
          {expandedFormulas.has("assets-by-entity") && properties.map((prop, idx) => (
            <TableRow key={idx} data-expandable-row="true">
              <TableCell className="pl-14 sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
              {years.map((_, y) => (
                <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                  {formatMoney(perPropertyByYear[y]?.get(idx)?.totalAssets ?? 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </>
      )}
    </>
  );
}

export function LiabilitiesSection({
  years, properties, expandedRows, expandedFormulas, toggleRow, toggleFormula,
  perPropertyByYear, consolidatedTotalLiabilities, consolidatedDebt,
}: LiabilitiesSectionProps) {
  return (
    <>
      <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("liabilities")} style={{ cursor: 'pointer' }} data-testid="row-liabilities-header">
        <TableCell className="sticky left-0 bg-card z-10">
          <div className="flex items-center gap-2">
            {expandedRows.has("liabilities") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            TOTAL LIABILITIES
          </div>
        </TableCell>
        {consolidatedTotalLiabilities.map((val, i) => (
          <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
        ))}
      </TableRow>
      {expandedRows.has("liabilities") && (
        <>
          <TableRow data-testid="row-bs-lt-liabilities-header">
            <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold">Long-Term Liabilities</TableCell>
            {years.map((_, i) => (<TableCell key={i} />))}
          </TableRow>

          <TableRow
            className="cursor-pointer hover:bg-muted/10"
            onClick={() => toggleFormula("debt-detail")}
            data-testid="row-bs-mortgage"
          >
            <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {expandedFormulas.has("debt-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Mortgage Notes Payable
              </div>
            </TableCell>
            {consolidatedDebt.map((val, i) => (
              <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
            ))}
          </TableRow>
          {expandedFormulas.has("debt-detail") && (
            <>
              <TableRow className="bg-chart-1/3" data-expandable-row="true">
                <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                  Remaining principal on acquisition & refinancing loans
                </TableCell>
                {consolidatedDebt.map((val, i) => (
                  <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(val)}</TableCell>
                ))}
              </TableRow>
              {properties.map((prop, idx) => (
                <TableRow key={idx} data-expandable-row="true">
                  <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                  {years.map((_, y) => (
                    <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                      {formatMoney(perPropertyByYear[y]?.get(idx)?.debtOutstanding ?? 0)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          )}

          <TableRow
            className="cursor-pointer hover:bg-muted/10"
            onClick={() => toggleFormula("liabilities-by-entity")}
            data-testid="row-bs-liabilities-by-entity"
          >
            <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {expandedFormulas.has("liabilities-by-entity") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Liabilities by Entity (SPV)
              </div>
            </TableCell>
            {consolidatedTotalLiabilities.map((val, i) => (
              <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
            ))}
          </TableRow>
          {expandedFormulas.has("liabilities-by-entity") && properties.map((prop, idx) => (
            <TableRow key={idx} data-expandable-row="true">
              <TableCell className="pl-14 sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
              {years.map((_, y) => (
                <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                  {formatMoney(perPropertyByYear[y]?.get(idx)?.debtOutstanding ?? 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </>
      )}
    </>
  );
}

export function EquitySection({
  years, properties, expandedRows, expandedFormulas, toggleRow, toggleFormula,
  perPropertyByYear, consolidatedTotalEquity, consolidatedEquity, consolidatedRetained,
}: EquitySectionProps) {
  return (
    <>
      <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("equity")} style={{ cursor: 'pointer' }} data-testid="row-equity-header">
        <TableCell className="sticky left-0 bg-card z-10">
          <div className="flex items-center gap-2">
            {expandedRows.has("equity") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            TOTAL EQUITY
          </div>
        </TableCell>
        {consolidatedTotalEquity.map((val, i) => (
          <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
        ))}
      </TableRow>
      {expandedRows.has("equity") && (
        <>
          <TableRow
            className="bg-chart-1/5 cursor-pointer hover:bg-chart-1/5"
            data-expandable-row="true"
            onClick={() => toggleFormula("equity-formula")}
          >
            <TableCell className="pl-10 sticky left-0 bg-chart-1/5 z-10 py-0.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {expandedFormulas.has("equity-formula") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <span className="italic">Formula</span>
              </div>
            </TableCell>
            {consolidatedTotalEquity.map((_, i) => (
              <TableCell key={i} className="py-0.5" />
            ))}
          </TableRow>
          {expandedFormulas.has("equity-formula") && (
            <TableRow className="bg-chart-1/3" data-expandable-row="true">
              <TableCell className="pl-14 sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                = Paid-In Capital + Retained Earnings (ASC 720-15 adjusted)
              </TableCell>
              {consolidatedTotalEquity.map((val, i) => (
                <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                  {formatMoney(val)}
                </TableCell>
              ))}
            </TableRow>
          )}

          <TableRow
            className="cursor-pointer hover:bg-muted/10"
            onClick={() => toggleFormula("paidin-detail")}
            data-testid="row-bs-paid-in-capital"
          >
            <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {expandedFormulas.has("paidin-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Paid-In Capital
              </div>
            </TableCell>
            {consolidatedEquity.map((val, i) => (
              <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
            ))}
          </TableRow>
          {expandedFormulas.has("paidin-detail") && (
            <>
              <TableRow className="bg-chart-1/3" data-expandable-row="true">
                <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                  = Total Project Cost − Acquisition Loan
                </TableCell>
                {consolidatedEquity.map((val, i) => (
                  <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(val)}</TableCell>
                ))}
              </TableRow>
              {properties.map((prop, idx) => (
                <TableRow key={idx} data-expandable-row="true">
                  <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                  {years.map((_, y) => (
                    <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                      {formatMoney(perPropertyByYear[y]?.get(idx)?.equityInvested ?? 0)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          )}

          <TableRow
            className="cursor-pointer hover:bg-muted/10"
            onClick={() => toggleFormula("retained-detail")}
            data-testid="row-bs-retained-earnings"
          >
            <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {expandedFormulas.has("retained-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Retained Earnings
              </div>
            </TableCell>
            {consolidatedRetained.map((val, i) => (
              <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
            ))}
          </TableRow>
          {expandedFormulas.has("retained-detail") && (
            <>
              <TableRow className="bg-chart-1/3" data-expandable-row="true">
                <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                  = Cumulative Net Income − Pre-Opening Costs (ASC 720-15)
                </TableCell>
                {consolidatedRetained.map((val, i) => (
                  <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(val)}</TableCell>
                ))}
              </TableRow>
              {properties.map((prop, idx) => (
                <TableRow key={idx} data-expandable-row="true">
                  <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                  {years.map((_, y) => (
                    <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                      {formatMoney(perPropertyByYear[y]?.get(idx)?.retainedEarnings ?? 0)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          )}

          <TableRow
            className="cursor-pointer hover:bg-muted/10"
            onClick={() => toggleFormula("equity-by-entity")}
            data-testid="row-bs-equity-by-entity"
          >
            <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {expandedFormulas.has("equity-by-entity") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Equity by Entity (SPV)
              </div>
            </TableCell>
            {consolidatedTotalEquity.map((val, i) => (
              <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
            ))}
          </TableRow>
          {expandedFormulas.has("equity-by-entity") && properties.map((prop, idx) => (
            <TableRow key={idx} data-expandable-row="true">
              <TableCell className="pl-14 sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
              {years.map((_, y) => {
                const d = perPropertyByYear[y]?.get(idx);
                return (
                  <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                    {formatMoney((d?.equityInvested ?? 0) + (d?.retainedEarnings ?? 0))}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </>
      )}
    </>
  );
}

export function TotalLESection({
  years, expandedFormulas, toggleFormula,
  consolidatedTotalLE, consolidatedTotalLiabilities, consolidatedTotalEquity, consolidatedTotalAssets,
}: {
  years: number[];
  expandedFormulas: Set<string>;
  toggleFormula: (id: string) => void;
  consolidatedTotalLE: number[];
  consolidatedTotalLiabilities: number[];
  consolidatedTotalEquity: number[];
  consolidatedTotalAssets: number[];
}) {
  return (
    <>
      <TableRow className="bg-primary/10 font-bold border-t-2 border-primary" data-testid="row-total-le">
        <TableCell className="sticky left-0 bg-primary/5 z-10 font-bold">TOTAL LIABILITIES & EQUITY</TableCell>
        {consolidatedTotalLE.map((val, i) => (
          <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
        ))}
      </TableRow>
      <TableRow
        className="bg-chart-1/5 cursor-pointer hover:bg-chart-1/5"
        data-expandable-row="true"
        onClick={() => toggleFormula("le-formula")}
      >
        <TableCell className="pl-10 sticky left-0 bg-chart-1/5 z-10 py-0.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {expandedFormulas.has("le-formula") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="italic">Formula</span>
          </div>
        </TableCell>
        {consolidatedTotalLE.map((_, i) => (
          <TableCell key={i} className="py-0.5" />
        ))}
      </TableRow>
      {expandedFormulas.has("le-formula") && (
        <TableRow className="bg-chart-1/3" data-expandable-row="true">
          <TableCell className="pl-14 sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
            = Total Liabilities + Total Equity
          </TableCell>
          {years.map((_, y) => (
            <TableCell key={y} className="text-right font-mono text-xs text-muted-foreground py-0.5">
              {formatMoney(consolidatedTotalLiabilities[y])} + {formatMoney(consolidatedTotalEquity[y])}
            </TableCell>
          ))}
        </TableRow>
      )}

      <TableRow className="font-medium bg-primary/10" data-testid="row-balance-check">
        <TableCell className="pl-6 sticky left-0 bg-primary/10 z-10">Balance Check (Assets − L&E)</TableCell>
        {years.map((_, y) => {
          const variance = consolidatedTotalAssets[y] - consolidatedTotalLE[y];
          const isBalanced = Math.abs(variance) <= 1;
          return (
            <TableCell key={y} className={`text-right font-mono ${isBalanced ? 'text-primary' : 'text-destructive font-bold'}`}>
              {isBalanced ? "✓ Balanced" : formatMoney(variance)}
            </TableCell>
          );
        })}
      </TableRow>
    </>
  );
}

export function MetricsSection({
  years, expandedRows, toggleRow, perPropertyByYear,
  consolidatedTotalAssets, consolidatedTotalLiabilities, consolidatedTotalEquity,
}: {
  years: number[];
  expandedRows: Set<string>;
  toggleRow: (id: string) => void;
  perPropertyByYear: Map<number, YearlyPerPropertyBS>[];
  consolidatedTotalAssets: number[];
  consolidatedTotalLiabilities: number[];
  consolidatedTotalEquity: number[];
}) {
  return (
    <>
      <TableRow className="bg-muted/20 font-bold border-t" onClick={() => toggleRow("metrics")} style={{ cursor: 'pointer' }} data-testid="row-bs-metrics-header">
        <TableCell className="sticky left-0 bg-card z-10">
          <div className="flex items-center gap-2">
            {expandedRows.has("metrics") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Key Ratios
          </div>
        </TableCell>
        {years.map((_, i) => (
          <TableCell key={i} />
        ))}
      </TableRow>
      {expandedRows.has("metrics") && (
        <>
          <MetricItemRow
            label="Debt-to-Assets"
            values={years.map((_, y) => consolidatedTotalAssets[y] > 0 ? `${((consolidatedTotalLiabilities[y] / consolidatedTotalAssets[y]) * 100).toFixed(1)}%` : "-")}
          />
          <MetricItemRow
            label="Equity-to-Assets"
            values={years.map((_, y) => consolidatedTotalAssets[y] > 0 ? `${((consolidatedTotalEquity[y] / consolidatedTotalAssets[y]) * 100).toFixed(1)}%` : "-")}
          />
          <MetricItemRow
            label="Debt-to-Equity"
            values={years.map((_, y) => consolidatedTotalEquity[y] > 0 ? `${((consolidatedTotalLiabilities[y] / consolidatedTotalEquity[y])).toFixed(2)}x` : "-")}
          />
          <MetricItemRow
            label="Book Value per Entity"
            values={years.map((_, y) => {
              const activePropCount = perPropertyByYear[y]?.size ?? 0;
              return activePropCount > 0 ? formatMoney(consolidatedTotalEquity[y] / activePropCount) : "-";
            })}
          />
        </>
      )}
    </>
  );
}
