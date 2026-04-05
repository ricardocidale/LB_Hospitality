export type DataProvenance = "verified" | "cited" | "estimated";

export interface DataPoint<T = number> {
  value: T;
  source: string;
  sourceUrl?: string;
  publishedAt?: string;
  fetchedAt: string;
  provenance: DataProvenance;
  confidence: "high" | "medium" | "low";
}

export interface FREDRateData {
  current: DataPoint;
  history: { date: string; value: number }[];
}

export interface HospitalityBenchmarks {
  revpar?: DataPoint;
  adr?: DataPoint;
  occupancy?: DataPoint;
  supplyPipeline?: DataPoint<{ newRooms: number; underConstruction: number }>;
  capRate?: DataPoint;
  submarket: string;
}

export interface CitedSource {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export interface GroundedSearchResult {
  query: string;
  answer: string;
  sources: CitedSource[];
  fetchedAt: string;
}

export interface MoodysRiskData {
  propertyRiskScore?: DataPoint;
  defaultProbability?: DataPoint;
  creditRating?: DataPoint<string>;
  riskPremiumBps?: DataPoint;
  lossGivenDefault?: DataPoint;
  watchlistStatus?: DataPoint<string>;
}

export interface SPGlobalMarketData {
  caseShillerIndex?: DataPoint;
  caseShillerYoY?: DataPoint;
  sectorOutlook?: DataPoint<string>;
  economicForecast?: DataPoint<{
    gdpGrowth: number;
    employmentGrowth: number;
    inflationForecast: number;
  }>;
  capRateForecast?: DataPoint<{ current: number; forecast12m: number }>;
  marketTier?: DataPoint<string>;
}

export interface CoStarMarketData {
  revpar?: DataPoint;
  adr?: DataPoint;
  occupancyRate?: DataPoint;
  rentGrowthYoY?: DataPoint;
  demandGrowthYoY?: DataPoint;
  submarketCapRate?: DataPoint;
  marketScore?: DataPoint;
  marketVacancy?: DataPoint;
  submarketTier?: DataPoint<string>;
  supplyPipeline?: DataPoint<{
    newRooms: number;
    underConstruction: number;
    deliverySchedule12m: number;
  }>;
  transactionVolume?: DataPoint<{
    totalSales: number;
    avgPricePerKey: number;
  }>;
}

export interface XoteloOTARate {
  code: string;
  name: string;
  rate: number;
}

export interface XoteloMarketData {
  adrBenchmark?: DataPoint;
  otaRates?: XoteloOTARate[];
  hotelCount?: number;
  avgPriceMin?: number;
  avgPriceMax?: number;
  location?: string;
}

// ─── Apify STR Comp-Set Data ─────────────────────────────────────────────────

export interface ApifyListingSnapshot {
  name: string;
  pricePerNight?: number;
  rating?: number;
  reviewCount?: number;
  bedrooms?: number;
  maxGuests?: number;
  url?: string;
}

export interface ApifyMarketData {
  airbnb?: {
    avgNightlyRate?: DataPoint;
    priceRange?: { min: number; max: number };
    listingCount: number;
    avgRating?: number;
    sampleListings: ApifyListingSnapshot[];
    fetchedAt: string;
  };
  vrbo?: {
    avgNightlyRate?: DataPoint;
    priceRange?: { min: number; max: number };
    listingCount: number;
    sampleListings: ApifyListingSnapshot[];
    fetchedAt: string;
  };
  booking?: {
    avgNightlyRate?: DataPoint;
    priceRange?: { min: number; max: number };
    hotelCount: number;
    sampleHotels: ApifyListingSnapshot[];
    fetchedAt: string;
  };
  tripadvisor?: {
    avgRating?: DataPoint;
    topHotels: ApifyListingSnapshot[];
    fetchedAt: string;
  };
}

export interface MarketIntelligence {
  rates: {
    sofr?: FREDRateData;
    treasury2y?: FREDRateData;
    treasury5y?: FREDRateData;
    treasury10y?: FREDRateData;
    primeRate?: FREDRateData;
    cpi?: FREDRateData;
  };
  benchmarks?: HospitalityBenchmarks;
  moodys?: MoodysRiskData;
  spGlobal?: SPGlobalMarketData;
  costar?: CoStarMarketData;
  xotelo?: XoteloMarketData;
  apify?: ApifyMarketData;
  groundedResearch: GroundedSearchResult[];
  fetchedAt: string;
  errors: string[];
}
