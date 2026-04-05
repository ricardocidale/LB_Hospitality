/**
 * AirDNAService — Short-term rental market analytics.
 *
 * AirDNA is the authoritative source for STR occupancy, ADR, and RevPAR
 * by market. Unlike Apify scraping (point-in-time pricing), AirDNA provides
 * historical monthly data, seasonality curves, and market-level aggregates
 * across all active Airbnb + VRBO listings in a geography.
 *
 * Endpoints used:
 *   GET /v2/market/summary   — occupancy, ADR, RevPAR, active listings
 *   GET /v2/market/search    — resolve a location string to a market key
 *
 * Auth: Bearer token in Authorization header.
 * Env: AIRDNA_API_KEY
 *
 * Docs: https://docs.airdna.co/api/
 * Cache TTL: 24h — AirDNA updates its market data daily.
 */

import { BaseIntegrationService } from "./BaseIntegrationService";
import { cache } from "../cache";
import type { AirDNAMarketData, DataPoint } from "../../shared/market-intelligence";

const BASE_URL = "https://api.airdna.co/v2";
const CACHE_TTL_SECONDS = 24 * 60 * 60;

interface AirDNAMarketSearchResult {
  market_id?: string;
  name?: string;
  country?: string;
  state?: string;
}

interface AirDNAMarketSummaryResponse {
  market_id?: string;
  market_name?: string;
  occupancy?: { percentile_50?: number };
  adr?: { percentile_50?: number };
  revpar?: { percentile_50?: number };
  active_listings?: number;
  revenue?: { percentile_50?: number };
  overall_score?: number;
  seasonality?: { month: number; occupancy: number; adr: number }[];
  demand_trend?: { period: string; value: number }[];
}

export class AirDNAService extends BaseIntegrationService {
  private readonly apiKey: string | undefined;

  constructor() {
    super("AirDNA", 20_000);
    this.apiKey = process.env.AIRDNA_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async fetchMarketData(location: string): Promise<AirDNAMarketData | null> {
    if (!this.apiKey) return null;

    const cacheKey = `airdna:market:${location.toLowerCase().replace(/\s+/g, "-")}`;
    return cache.staleWhileRevalidate<AirDNAMarketData | null>(
      cacheKey,
      CACHE_TTL_SECONDS,
      () => this.fetchFresh(location)
    );
  }

  private async fetchFresh(location: string): Promise<AirDNAMarketData | null> {
    try {
      // Step 1: resolve location string to AirDNA market_id
      const marketId = await this.resolveMarketId(location);
      if (!marketId) {
        this.warn(`No AirDNA market found for: ${location}`);
        return null;
      }

      // Step 2: fetch market summary
      const summary = await this.fetchSummary(marketId);
      if (!summary) return null;

      return this.mapResponse(summary, location);
    } catch (err) {
      this.warn(`Failed to fetch AirDNA data for ${location}`, err);
      return null;
    }
  }

  private async resolveMarketId(location: string): Promise<string | null> {
    const url = `${BASE_URL}/market/search?q=${encodeURIComponent(location)}&limit=1`;
    try {
      const response = await this.fetchWithTimeout(url, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      const data = await response.json();
      const results: AirDNAMarketSearchResult[] = data?.markets ?? data?.results ?? [];
      return results[0]?.market_id ?? null;
    } catch {
      return null;
    }
  }

  private async fetchSummary(marketId: string): Promise<AirDNAMarketSummaryResponse | null> {
    const url = `${BASE_URL}/market/summary?market_id=${encodeURIComponent(marketId)}`;
    try {
      const response = await this.fetchWithTimeout(url, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return await response.json();
    } catch {
      return null;
    }
  }

  private mapResponse(data: AirDNAMarketSummaryResponse, location: string): AirDNAMarketData {
    const fetchedAt = new Date().toISOString();
    const source = "AirDNA";
    const sourceUrl = "https://www.airdna.co";

    const toPoint = (value: number | undefined): DataPoint | undefined =>
      value !== undefined
        ? { value, source, sourceUrl, fetchedAt, provenance: "verified", confidence: "high" }
        : undefined;

    return {
      occupancy:      toPoint(data.occupancy?.percentile_50),
      adr:            toPoint(data.adr?.percentile_50),
      revpar:         toPoint(data.revpar?.percentile_50),
      activeListings: data.active_listings,
      medianRevenue:  toPoint(data.revenue?.percentile_50),
      marketScore:    toPoint(data.overall_score),
      seasonality:    data.seasonality ?? [],
      demandTrend:    data.demand_trend ?? [],
      marketId:       data.market_id,
      marketName:     data.market_name ?? location,
      fetchedAt,
    };
  }
}
