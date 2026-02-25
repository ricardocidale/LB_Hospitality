import { useMemo } from "react";
import { Property } from "@shared/schema";
import type { GlobalResponse } from "@/lib/api";
import { 
  generatePropertyProForma, 
  getFiscalYearForModelYear 
} from "@/lib/financialEngine";
import { 
  PROJECTION_YEARS, 
  DAYS_PER_MONTH 
} from "@/lib/constants";
import { 
  LoanParams, 
  GlobalLoanParams 
} from "@/lib/loanCalculations";
import { aggregateCashFlowByYear } from "@/lib/cashFlowAggregator";
import { 
  aggregatePropertyByYear, 
  YearlyPropertyFinancials 
} from "@/lib/yearlyAggregator";
import { computeIRR } from "@analytics/returns/irr.js";
import { propertyEquityInvested, acquisitionYearIndex } from "@/lib/equityCalculations";
import { DashboardFinancials } from "./types";

/** Adapter: wraps standalone IRR solver to return a plain number (annual rate). */
function calculateIRR(cashFlows: number[]): number {
  const result = computeIRR(cashFlows, 1);
  return result.irr_periodic ?? 0;
}

export function usePortfolioFinancials(
  properties: Property[] | undefined,
  global: GlobalResponse | undefined
): DashboardFinancials | null {
  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;

  const allPropertyFinancials = useMemo(() => {
    if (!properties || !global) return [];
    return properties.map(p => {
      const financials = generatePropertyProForma(p as any, global as any, projectionMonths);
      return { property: p, financials };
    });
  }, [properties, global, projectionMonths]);

  const allPropertyYearlyCF = useMemo(() => {
    if (!properties || !global || allPropertyFinancials.length === 0) return [];
    return allPropertyFinancials.map(({ property: prop, financials }) =>
      aggregateCashFlowByYear(financials, prop as unknown as LoanParams, global as unknown as GlobalLoanParams, projectionYears)
    );
  }, [allPropertyFinancials, properties, global, projectionYears]);

  const allPropertyYearlyIS = useMemo(() =>
    allPropertyFinancials.map(({ financials }) =>
      aggregatePropertyByYear(financials, projectionYears)
    ),
    [allPropertyFinancials, projectionYears]
  );

  const yearlyConsolidatedCache = useMemo(() => {
    if (!allPropertyYearlyIS.length) return [] as YearlyPropertyFinancials[];
    const numericKeys = Object.keys(allPropertyYearlyIS[0]?.[0] ?? {}).filter(
      k => k !== 'year'
    ) as (keyof YearlyPropertyFinancials)[];
    return Array.from({ length: projectionYears }, (_, y) => {
      const base: YearlyPropertyFinancials = { ...allPropertyYearlyIS[0][y] };
      for (const key of numericKeys) (base as any)[key] = 0;
      base.year = y;
      for (const propYearly of allPropertyYearlyIS) {
        const py = propYearly[y];
        if (!py) continue;
        for (const key of numericKeys) (base as any)[key] += (py as any)[key];
      }
      return base;
    });
  }, [allPropertyYearlyIS, projectionYears]);

  const weightedMetricsByYear = useMemo(() => {
    if (!properties || !properties.length || !allPropertyFinancials.length) return [];
    return Array.from({ length: projectionYears }, (_, yearIndex) => {
      const startMonth = yearIndex * 12;
      const endMonth = startMonth + 12;

      let totalAvailableRoomNights = 0;
      let totalRoomsSold = 0;
      let totalRoomRevenue = 0;

      properties.forEach((prop, idx) => {
        const { financials } = allPropertyFinancials[idx];
        const yearData = financials.slice(startMonth, endMonth);
        const roomCount = prop.roomCount;

        yearData.forEach(month => {
          const daysInMonth = DAYS_PER_MONTH;
          const availableRooms = roomCount * daysInMonth;
          const roomsSold = availableRooms * month.occupancy;

          totalAvailableRoomNights += availableRooms;
          totalRoomsSold += roomsSold;
          totalRoomRevenue += month.revenueRooms;
        });
      });

      const weightedADR = totalRoomsSold > 0 ? totalRoomRevenue / totalRoomsSold : 0;
      const weightedOcc = totalAvailableRoomNights > 0 ? totalRoomsSold / totalAvailableRoomNights : 0;
      const revPAR = totalAvailableRoomNights > 0 ? totalRoomRevenue / totalAvailableRoomNights : 0;

      return { weightedADR, weightedOcc, revPAR, totalAvailableRoomNights };
    });
  }, [properties, allPropertyFinancials, projectionYears]);

  const stats = useMemo(() => {
    if (!yearlyConsolidatedCache.length || !global) return null;

    let totalProjectionRevenue = 0, totalProjectionNOI = 0, totalProjectionCashFlow = 0;
    for (let y = 0; y < projectionYears; y++) {
      const yearData = yearlyConsolidatedCache[y];
      totalProjectionRevenue += yearData.revenueTotal;
      totalProjectionNOI += yearData.noi;
      totalProjectionCashFlow += yearData.cashFlow;
    }

    const getPropertyAcquisitionYear = (prop: any): number =>
      acquisitionYearIndex(prop.acquisitionDate, prop.operationsStartDate, global.modelStartDate);

    const getPropertyInvestment = (prop: any): number =>
      propertyEquityInvested(prop);

    const getEquityInvestmentForYear = (yearIndex: number): number =>
      properties?.reduce((sum, prop) => sum + (getPropertyAcquisitionYear(prop) === yearIndex ? getPropertyInvestment(prop) : 0), 0) ?? 0;

    const consolidatedFlows = Array.from({ length: projectionYears }, (_, y) =>
      allPropertyYearlyCF.reduce((sum, propYearly) => sum + (propYearly[y]?.netCashFlowToInvestors ?? 0), 0)
    );

    const portfolioIRR = calculateIRR(consolidatedFlows);
    const totalInitialEquity = properties?.reduce((sum, prop) => sum + getPropertyInvestment(prop), 0) ?? 0;
    const totalExitValue = allPropertyYearlyCF.reduce(
      (sum, yearly) => sum + (yearly[projectionYears - 1]?.exitValue ?? 0), 0
    );
    const totalCashReturned = consolidatedFlows.reduce((sum, cf) => sum + cf, 0);
    const midProjectionEquity = Array.from({ length: projectionYears }, (_, y) => getEquityInvestmentForYear(y + 1))
      .reduce((sum, eq) => sum + eq, 0);
    
    const equityMultiple = totalInitialEquity > 0 ? (totalCashReturned + midProjectionEquity) / totalInitialEquity : 0;

    const operatingCashFlows = Array.from({ length: projectionYears }, (_, y) =>
      allPropertyYearlyCF.reduce((sum, propYearly) => sum + (propYearly[y]?.atcf ?? 0), 0)
    );
    const avgAnnualCashFlow = operatingCashFlows.reduce((sum, cf) => sum + cf, 0) / projectionYears;
    const cashOnCash = totalInitialEquity > 0 ? (avgAnnualCashFlow / totalInitialEquity) * 100 : 0;

    return {
      totalProjectionRevenue,
      totalProjectionNOI,
      totalProjectionCashFlow,
      portfolioIRR,
      equityMultiple,
      cashOnCash,
      totalInitialEquity,
      totalExitValue
    };
  }, [yearlyConsolidatedCache, allPropertyYearlyCF, properties, global, projectionYears]);

  if (!stats) return null;

  return {
    allPropertyFinancials,
    allPropertyYearlyCF,
    allPropertyYearlyIS,
    yearlyConsolidatedCache,
    weightedMetricsByYear,
    ...stats
  };
}
