import { FREDService } from "./FREDService";
import { HospitalityBenchmarkService } from "./HospitalityBenchmarkService";
import { GroundedResearchService } from "./GroundedResearchService";
import { cache } from "../cache";
import type { MarketIntelligence, FREDRateData, HospitalityBenchmarks, GroundedSearchResult } from "../../shared/market-intelligence";

interface AggregatorQuery {
  location?: string;
  state?: string;
  propertyType?: string;
  propertyClass?: string;
  chainScale?: string;
  propertyId?: number;
}

const PROPERTY_MI_TTL_SECONDS = 7 * 24 * 60 * 60;

export class MarketIntelligenceAggregator {
  private fred: FREDService;
  private hospitality: HospitalityBenchmarkService;
  private grounded: GroundedResearchService;

  constructor() {
    this.fred = new FREDService();
    this.hospitality = new HospitalityBenchmarkService();
    this.grounded = new GroundedResearchService();
  }

  async gather(query: AggregatorQuery): Promise<MarketIntelligence> {
    if (query.propertyId) {
      const fingerprint = [
        query.propertyId,
        query.location || "",
        query.state || "",
        query.propertyType || "",
        query.propertyClass || "",
        query.chainScale || "",
      ].join(":").toLowerCase();
      const cacheKey = `mi:property:${fingerprint}`;
      return cache.staleWhileRevalidate<MarketIntelligence>(
        cacheKey,
        PROPERTY_MI_TTL_SECONDS,
        () => this.gatherFresh(query)
      );
    }
    return this.gatherFresh(query);
  }

  private async gatherFresh(query: AggregatorQuery): Promise<MarketIntelligence> {
    const errors: string[] = [];

    const [ratesResult, benchmarksResult, searchResult] = await Promise.allSettled([
      this.fetchRates(),
      query.location
        ? this.hospitality.fetchBenchmarks({
            city: query.location,
            state: query.state,
            propertyClass: query.propertyClass,
            chainScale: query.chainScale,
          })
        : Promise.resolve(null),
      query.location && this.grounded.isAvailable()
        ? this.grounded.search(
            this.grounded.buildHospitalityQueries(
              `${query.location}${query.state ? `, ${query.state}` : ""}`,
              query.propertyType || "boutique hotel"
            )
          )
        : Promise.resolve([]),
    ]);

    let rates: Record<string, FREDRateData> = {};
    if (ratesResult.status === "fulfilled") {
      rates = ratesResult.value;
    } else {
      errors.push(`FRED: ${ratesResult.reason?.message || "Unknown error"}`);
    }

    let benchmarks: HospitalityBenchmarks | undefined;
    if (benchmarksResult.status === "fulfilled" && benchmarksResult.value) {
      benchmarks = benchmarksResult.value;
    } else if (benchmarksResult.status === "rejected") {
      errors.push(`Hospitality benchmarks: ${benchmarksResult.reason?.message || "Unknown error"}`);
    }

    let groundedResearch: GroundedSearchResult[] = [];
    if (searchResult.status === "fulfilled") {
      groundedResearch = searchResult.value;
    } else {
      errors.push(`Grounded research: ${searchResult.reason?.message || "Unknown error"}`);
    }

    return {
      rates: {
        sofr: rates.sofr,
        treasury2y: rates.treasury2y,
        treasury5y: rates.treasury5y,
        treasury10y: rates.treasury10y,
        primeRate: rates.primeRate,
        cpi: rates.cpi,
      },
      benchmarks,
      groundedResearch,
      fetchedAt: new Date().toISOString(),
      errors,
    };
  }

  async fetchRatesOnly(): Promise<Record<string, FREDRateData>> {
    return this.fred.fetchAllRates();
  }

  async fetchRateWithHistory(seriesKey: string): Promise<FREDRateData | null> {
    const validKeys = FREDService.getSeriesKeys();
    if (!validKeys.includes(seriesKey as any)) return null;
    return this.fred.fetchRate(seriesKey as any);
  }

  getServiceStatus(): { fred: boolean; hospitality: boolean; grounded: boolean } {
    return {
      fred: this.fred.isAvailable(),
      hospitality: this.hospitality.isAvailable(),
      grounded: this.grounded.isAvailable(),
    };
  }
  
  async refreshFREDRates(): Promise<void> {
    if (!this.fred.isAvailable()) return;
    await this.fred.fetchAllRates();
  }

  private async fetchRates(): Promise<Record<string, FREDRateData>> {
    if (!this.fred.isAvailable()) return {};
    return this.fred.fetchAllRates();
  }
}

let aggregatorInstance: MarketIntelligenceAggregator | null = null;

export function getMarketIntelligenceAggregator(): MarketIntelligenceAggregator {
  if (!aggregatorInstance) {
    aggregatorInstance = new MarketIntelligenceAggregator();
  }
  return aggregatorInstance;
}
