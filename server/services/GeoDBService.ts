/**
 * GeoDBService — City, region, and country data via GeoDB Cities (RapidAPI).
 *
 * Used to resolve location strings to structured geo data (coordinates,
 * population, country code, region) for use across services that need
 * precise location metadata.
 *
 * Host: wft-geo-db.p.rapidapi.com (RAPIDAPI_KEY)
 * Docs: http://geodb-free-service.wirefreethought.com/docs/api
 *
 * Cache TTL: 7 days — city data is stable.
 */

import { BaseIntegrationService } from "./BaseIntegrationService";
import { cache } from "../cache";
import { rapidApiHeaders, isRapidApiAvailable } from "./rapidApiKeyRouter";

const HOST = "wft-geo-db.p.rapidapi.com";
const BASE_URL = `https://${HOST}/v1/geo`;
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface GeoCity {
  id: number;
  wikiDataId: string;
  name: string;
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  latitude: number;
  longitude: number;
  population: number;
}

export class GeoDBService extends BaseIntegrationService {
  constructor() {
    super("GeoDB", 15_000);
  }

  isAvailable(): boolean {
    return isRapidApiAvailable("primary");
  }

  async searchCity(query: string, countryCode?: string): Promise<GeoCity | null> {
    if (!this.isAvailable()) return null;

    const cacheKey = `geodb:city:${query.toLowerCase()}:${countryCode ?? ""}`;
    return cache.staleWhileRevalidate<GeoCity | null>(
      cacheKey,
      CACHE_TTL_SECONDS,
      () => this.fetchCity(query, countryCode)
    );
  }

  private async fetchCity(query: string, countryCode?: string): Promise<GeoCity | null> {
    try {
      const params = new URLSearchParams({
        namePrefix: query,
        limit:      "1",
        sort:       "-population",
        languageCode: "en",
      });
      if (countryCode) params.set("countryIds", countryCode.toUpperCase());

      const url = `${BASE_URL}/cities?${params}`;
      const response = await this.fetchWithTimeout(url, {
        headers: rapidApiHeaders(HOST, "primary"),
      });
      const data = await response.json();
      const cities: any[] = data?.data ?? [];

      if (!cities.length) return null;
      const c = cities[0];

      return {
        id:          c.id,
        wikiDataId:  c.wikiDataId,
        name:        c.name,
        country:     c.country,
        countryCode: c.countryCode,
        region:      c.region,
        regionCode:  c.regionCode,
        latitude:    c.latitude,
        longitude:   c.longitude,
        population:  c.population,
      };
    } catch (err) {
      this.warn(`GeoDB city search failed for ${query}`, err);
      return null;
    }
  }

  async getCitiesInRegion(countryCode: string, regionCode: string, limit = 10): Promise<GeoCity[]> {
    if (!this.isAvailable()) return [];

    const cacheKey = `geodb:region:${countryCode}:${regionCode}`;
    return cache.staleWhileRevalidate<GeoCity[]>(cacheKey, CACHE_TTL_SECONDS, async () => {
      try {
        const params = new URLSearchParams({
          countryIds:   countryCode.toUpperCase(),
          regionCode:   regionCode.toUpperCase(),
          limit:        String(limit),
          sort:         "-population",
          languageCode: "en",
        });

        const url = `${BASE_URL}/cities?${params}`;
        const response = await this.fetchWithTimeout(url, {
          headers: rapidApiHeaders(HOST, "primary"),
        });
        const data = await response.json();
        const cities: any[] = data?.data ?? [];

        return cities.map(c => ({
          id: c.id, wikiDataId: c.wikiDataId, name: c.name,
          country: c.country, countryCode: c.countryCode,
          region: c.region, regionCode: c.regionCode,
          latitude: c.latitude, longitude: c.longitude, population: c.population,
        }));
      } catch {
        return [];
      }
    });
  }
}
