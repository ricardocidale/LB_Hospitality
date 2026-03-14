import { useMemo, useRef } from "react";
import { Property } from "@shared/schema";
import type { GlobalResponse } from "@/lib/api";
import { 
  generatePropertyProForma, 
  getFiscalYearForModelYear 
} from "@/lib/financialEngine";
import { 
  PROJECTION_YEARS, 
} from "@/lib/constants";
import { 
  LoanParams, 
  GlobalLoanParams 
} from "@/lib/financial/loanCalculations";
import {
  aggregatePropertyByYear,
  aggregateUnifiedByYear,
  YearlyPropertyFinancials
} from "@/lib/financial/yearlyAggregator";
import type { YearlyCashFlowResult } from "@/lib/financial/loanCalculations";
import { computeIRR } from "@analytics/returns/irr.js";
import { propertyEquityInvested, acquisitionYearIndex } from "@/lib/financial/equityCalculations";
import { DashboardFinancials } from "./types";
import type { MonthlyFinancials } from "@/lib/financialEngine";

function calculateIRR(cashFlows: number[]): number {
  const result = computeIRR(cashFlows, 1);
  return result.irr_periodic ?? 0;
}

interface CachedPropertyResult {
  property: Property;
  financials: MonthlyFinancials[];
  updatedAtMs: number;
}

export function usePortfolioFinancials(
  properties: Property[] | undefined,
  global: GlobalResponse | undefined
): DashboardFinancials | null {
  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;

  const cacheRef = useRef<Map<number, CachedPropertyResult>>(new Map());
  const prevGlobalRef = useRef<GlobalResponse | undefined>(undefined);

  const allPropertyFinancials = useMemo(() => {
    if (!properties || !global) return [];
    if (prevGlobalRef.current !== global) {
      cacheRef.current = new Map();
      prevGlobalRef.current = global;
    }
    const cache = cacheRef.current;
    const newCache = new Map<number, CachedPropertyResult>();
    const result: CachedPropertyResult[] = properties.map(p => {
      const cached = cache.get(p.id);
      const updatedAtMs = p.updatedAt ? new Date(p.updatedAt as string | Date).getTime() : 0;
      if (cached && cached.updatedAtMs === updatedAtMs) {
        newCache.set(p.id, cached);
        return cached;
      }
      const financials = generatePropertyProForma(p as any, global as any, projectionMonths);
      const entry: CachedPropertyResult = { property: p, financials, updatedAtMs };
      newCache.set(p.id, entry);
      return entry;
    });
    cacheRef.current = newCache;
    return result;
  }, [properties, global, projectionMonths]);

  const { allPropertyYearlyCF, allPropertyYearlyIS } = useMemo(() => {
    if (!properties || !global || allPropertyFinancials.length === 0) {
      return { allPropertyYearlyCF: [] as YearlyCashFlowResult[][], allPropertyYearlyIS: [] as YearlyPropertyFinancials[][] };
    }
    const cfResults: YearlyCashFlowResult[][] = [];
    const isResults: YearlyPropertyFinancials[][] = [];
    for (const { property: prop, financials } of allPropertyFinancials) {
      const unified = aggregateUnifiedByYear(
        financials,
        prop as unknown as LoanParams,
        global as unknown as GlobalLoanParams,
        projectionYears
      );
      cfResults.push(unified.yearlyCF);
      isResults.push(unified.yearlyIS);
    }
    return { allPropertyYearlyCF: cfResults, allPropertyYearlyIS: isResults };
  }, [allPropertyFinancials, properties, global, projectionYears]);

  const yearlyConsolidatedCache = useMemo(() => {
    if (!allPropertyYearlyIS.length) return [] as YearlyPropertyFinancials[];
    const numericKeys = Object.keys(allPropertyYearlyIS[0]?.[0] ?? {}).filter(
      k => k !== 'year' && k !== 'serviceFeesByCategory'
    ) as (keyof YearlyPropertyFinancials)[];
    return Array.from({ length: projectionYears }, (_, y) => {
      const base: YearlyPropertyFinancials = { ...allPropertyYearlyIS[0][y] };
      for (const key of numericKeys) (base as any)[key] = 0;
      base.year = y;
      base.serviceFeesByCategory = {};
      for (const propYearly of allPropertyYearlyIS) {
        const py = propYearly[y];
        if (!py) continue;
        for (const key of numericKeys) (base as any)[key] += (py as any)[key];
        if (py.serviceFeesByCategory) {
          for (const [cat, val] of Object.entries(py.serviceFeesByCategory)) {
            base.serviceFeesByCategory[cat] = (base.serviceFeesByCategory[cat] ?? 0) + val;
          }
        }
      }
      return base;
    });
  }, [allPropertyYearlyIS, projectionYears]);

  const weightedMetricsByYear = useMemo(() => {
    if (!allPropertyYearlyIS.length) return [];
    return Array.from({ length: projectionYears }, (_, yearIndex) => {
      let totalAvailableRoomNights = 0;
      let totalRoomsSold = 0;
      let totalRoomRevenue = 0;

      for (const propYearly of allPropertyYearlyIS) {
        const py = propYearly[yearIndex];
        if (!py) continue;
        totalAvailableRoomNights += py.availableRooms;
        totalRoomsSold += py.soldRooms;
        totalRoomRevenue += py.revenueRooms;
      }

      const weightedADR = totalRoomsSold > 0 ? totalRoomRevenue / totalRoomsSold : 0;
      const weightedOcc = totalAvailableRoomNights > 0 ? totalRoomsSold / totalAvailableRoomNights : 0;
      const revPAR = totalAvailableRoomNights > 0 ? totalRoomRevenue / totalAvailableRoomNights : 0;

      return { weightedADR, weightedOcc, revPAR, totalAvailableRoomNights };
    });
  }, [allPropertyYearlyIS, projectionYears]);

  const stats = useMemo(() => {
    if (!yearlyConsolidatedCache.length || !global) return null;

    let totalProjectionRevenue = 0, totalProjectionNOI = 0, totalProjectionANOI = 0, totalProjectionCashFlow = 0;
    for (let y = 0; y < projectionYears; y++) {
      const yearData = yearlyConsolidatedCache[y];
      totalProjectionRevenue += yearData.revenueTotal;
      totalProjectionNOI += yearData.noi;
      totalProjectionANOI += yearData.anoi;
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
      totalProjectionANOI,
      totalProjectionCashFlow,
      portfolioIRR,
      equityMultiple,
      cashOnCash,
      totalInitialEquity,
      totalExitValue
    };
  }, [yearlyConsolidatedCache, allPropertyYearlyCF, properties, global, projectionYears]);

  if (!stats) return null;

  const totalRooms = properties?.reduce((sum, p) => sum + p.roomCount, 0) ?? 0;

  return {
    allPropertyFinancials,
    allPropertyYearlyCF,
    allPropertyYearlyIS,
    yearlyConsolidatedCache,
    weightedMetricsByYear,
    totalRooms,
    ...stats
  };
}
