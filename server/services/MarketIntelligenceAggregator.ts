import { FREDService } from "./FREDService";
import { HospitalityBenchmarkService } from "./HospitalityBenchmarkService";
import { GroundedResearchService } from "./GroundedResearchService";
import { MoodysService } from "./MoodysService";
import { SPGlobalService } from "./SPGlobalService";
import { CoStarService } from "./CoStarService";
import { XoteloService } from "./XoteloService";
import { cache } from "../cache";
import type { MarketIntelligence, FREDRateData, HospitalityBenchmarks, GroundedSearchResult, MoodysRiskData, SPGlobalMarketData, CoStarMarketData, XoteloMarketData } from "../../shared/market-intelligence";

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
  private moodys: MoodysService;
  private spGlobal: SPGlobalService;
  private costar: CoStarService;
  private xotelo: XoteloService;

  constructor() {
    this.fred = new FREDService();
    this.hospitality = new HospitalityBenchmarkService();
    this.grounded = new GroundedResearchService();
    this.moodys = new MoodysService();
    this.spGlobal = new SPGlobalService();
    this.costar = new CoStarService();
    this.xotelo = new XoteloService();
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

    const [ratesResult, benchmarksResult, searchResult, moodysResult, spGlobalResult, costarResult, xoteloResult] = await Promise.allSettled([
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
      query.location && this.moodys.isAvailable()
        ? this.moodys.fetchRiskData({
            location: query.location,
            propertyType: query.propertyType,
            propertyClass: query.propertyClass,
          })
        : Promise.resolve(null),
      query.location && this.spGlobal.isAvailable()
        ? this.spGlobal.fetchMarketData({
            location: query.location,
            state: query.state,
            propertyType: query.propertyType,
          })
        : Promise.resolve(null),
      query.location && this.costar.isAvailable()
        ? this.costar.fetchMarketData({
            location: query.location,
            state: query.state,
            propertyType: query.propertyType,
          })
        : Promise.resolve(null),
      query.location
        ? this.fetchXoteloData(query.location)
        : Promise.resolve(null),
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

    let moodys: MoodysRiskData | undefined;
    if (moodysResult.status === "fulfilled" && moodysResult.value) {
      moodys = moodysResult.value;
    } else if (moodysResult.status === "rejected") {
      errors.push(`Moody's: ${moodysResult.reason?.message || "Unknown error"}`);
    }

    let spGlobal: SPGlobalMarketData | undefined;
    if (spGlobalResult.status === "fulfilled" && spGlobalResult.value) {
      spGlobal = spGlobalResult.value;
    } else if (spGlobalResult.status === "rejected") {
      errors.push(`S&P Global: ${spGlobalResult.reason?.message || "Unknown error"}`);
    }

    let costar: CoStarMarketData | undefined;
    if (costarResult.status === "fulfilled" && costarResult.value) {
      costar = costarResult.value;
    } else if (costarResult.status === "rejected") {
      errors.push(`CoStar: ${costarResult.reason?.message || "Unknown error"}`);
    }

    let xotelo: XoteloMarketData | undefined;
    if (xoteloResult.status === "fulfilled" && xoteloResult.value) {
      xotelo = xoteloResult.value;
    } else if (xoteloResult.status === "rejected") {
      errors.push(`Xotelo: ${xoteloResult.reason?.message || "Unknown error"}`);
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
      moodys,
      spGlobal,
      costar,
      xotelo,
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

  getServiceStatus(): { fred: boolean; hospitality: boolean; grounded: boolean; moodys: boolean; spGlobal: boolean; costar: boolean; xotelo: boolean } {
    return {
      fred: this.fred.isAvailable(),
      hospitality: this.hospitality.isAvailable(),
      grounded: this.grounded.isAvailable(),
      moodys: this.moodys.isAvailable(),
      spGlobal: this.spGlobal.isAvailable(),
      costar: this.costar.isAvailable(),
      xotelo: this.xotelo.isAvailable(),
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

  private async fetchXoteloData(location: string): Promise<XoteloMarketData | null> {
    try {
      const snapshot = await this.xotelo.getMarketSnapshot(location);
      if (!snapshot) return null;

      const adrBenchmark = await this.xotelo.fetchAdrBenchmark(location);

      return {
        adrBenchmark: adrBenchmark ?? undefined,
        hotelCount: snapshot.sampleSize,
        avgPriceMin: snapshot.avgPriceMin ?? undefined,
        avgPriceMax: snapshot.avgPriceMax ?? undefined,
        location: snapshot.location,
      };
    } catch {
      return null;
    }
  }

  getXoteloService(): XoteloService {
    return this.xotelo;
  }
}

let aggregatorInstance: MarketIntelligenceAggregator | null = null;

export function getMarketIntelligenceAggregator(): MarketIntelligenceAggregator {
  if (!aggregatorInstance) {
    aggregatorInstance = new MarketIntelligenceAggregator();
  }
  return aggregatorInstance;
}
