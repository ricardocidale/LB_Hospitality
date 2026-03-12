/**
 * React Query hooks for market rates.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface MarketRateResponse {
  id: number;
  rateKey: string;
  value: number | null;
  displayValue: string | null;
  source: string;
  sourceUrl: string | null;
  seriesId: string | null;
  publishedAt: string | null;
  fetchedAt: string | null;
  isManual: boolean;
  manualNote: string | null;
  maxStalenessHours: number;
  status: "fresh" | "warning" | "stale" | "missing";
  stalePct: number;
  createdAt: string;
  updatedAt: string;
}

const MARKET_RATES_KEY = ["marketRates"];

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function useMarketRates() {
  return useQuery<MarketRateResponse[]>({
    queryKey: MARKET_RATES_KEY,
    queryFn: () => fetchJson<MarketRateResponse[]>("/api/market-rates"),
    staleTime: 60_000, // 1 minute client cache
  });
}

export function useRefreshRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rateKey: string) =>
      fetchJson<MarketRateResponse>(`/api/market-rates/${rateKey}/refresh`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MARKET_RATES_KEY }),
  });
}

export function useRefreshAllRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson<{ refreshed: number }>("/api/market-rates/refresh-all", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MARKET_RATES_KEY }),
  });
}

export function useOverrideRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rateKey, value, manualNote }: { rateKey: string; value: number; manualNote?: string }) =>
      fetchJson<MarketRateResponse>(`/api/market-rates/${rateKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, manualNote }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MARKET_RATES_KEY }),
  });
}

export interface FREDRateDataResponse {
  current: {
    value: number;
    source: string;
    sourceUrl?: string;
    publishedAt?: string;
    fetchedAt: string;
    provenance: "verified" | "cited" | "estimated";
    confidence: "high" | "medium" | "low";
  };
  history: { date: string; value: number }[];
}

export interface MarketIntelligenceStatus {
  fred: boolean;
  hospitality: boolean;
  grounded: boolean;
}

const FRED_ALL_KEY = ["fredAllRates"];

export function useFREDRates() {
  return useQuery<Record<string, FREDRateDataResponse>>({
    queryKey: FRED_ALL_KEY,
    queryFn: () => fetchJson<Record<string, FREDRateDataResponse>>("/api/market-rates/fred-all"),
    staleTime: 5 * 60_000,
  });
}

export function useFREDHistory(seriesKey: string) {
  return useQuery<FREDRateDataResponse>({
    queryKey: ["fredHistory", seriesKey],
    queryFn: () => fetchJson<FREDRateDataResponse>(`/api/market-rates/fred-history/${seriesKey}`),
    staleTime: 5 * 60_000,
    enabled: !!seriesKey,
  });
}

export function useMarketIntelligenceStatus() {
  return useQuery<MarketIntelligenceStatus>({
    queryKey: ["marketIntelligenceStatus"],
    queryFn: () => fetchJson<MarketIntelligenceStatus>("/api/market-intelligence/status"),
    staleTime: 60_000,
  });
}
