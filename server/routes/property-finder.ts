import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth , getAuthUser } from "../auth";
import { insertProspectivePropertySchema, insertSavedSearchSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { logActivity, logAndSendError } from "./helpers";
import { z } from "zod";
import { logger } from "../logger";
import { aiRateLimit } from "../middleware/rate-limit";
import { RealtyService } from "../services/RealtyService";
import { USRealEstateService } from "../services/USRealEstateService";
import { getMarketIntelligenceAggregator } from "../services/MarketIntelligenceAggregator";

const realtyService = new RealtyService();
const usRealEstateService = new USRealEstateService();

const XOTELO_LOCATION_KEYS: Record<string, string> = {
  "miami, fl": "g34438",
  "miami beach, fl": "g34439",
  "fort lauderdale, fl": "g34227",
  "key west, fl": "g34345",
  "naples, fl": "g34467",
  "sarasota, fl": "g34618",
  "st. augustine, fl": "g34599",
  "tampa, fl": "g34678",
  "orlando, fl": "g34515",
  "palm beach, fl": "g34542",
  "savannah, ga": "g60814",
  "charleston, sc": "g54171",
  "nashville, tn": "g55229",
  "new orleans, la": "g60864",
  "austin, tx": "g30196",
  "san antonio, tx": "g60956",
  "new york, ny": "g60763",
  "los angeles, ca": "g32655",
  "san francisco, ca": "g60713",
  "san diego, ca": "g60750",
  "chicago, il": "g35805",
  "boston, ma": "g60745",
  "washington, dc": "g28970",
  "seattle, wa": "g60878",
  "portland, or": "g52024",
  "denver, co": "g33388",
  "phoenix, az": "g31310",
  "scottsdale, az": "g31350",
  "sedona, az": "g31352",
  "aspen, co": "g29141",
  "asheville, nc": "g49005",
  "napa, ca": "g32766",
  "santa fe, nm": "g47990",
  "jackson, wy": "g60491",
  "honolulu, hi": "g60982",
  "maui, hi": "g29220",
};

function findXoteloKey(location: string): { key: string; label: string } | null {
  const lower = location.toLowerCase().trim();
  const direct = XOTELO_LOCATION_KEYS[lower];
  if (direct) return { key: direct, label: location };

  for (const [loc, key] of Object.entries(XOTELO_LOCATION_KEYS)) {
    const city = loc.split(",")[0].trim();
    if (lower.includes(city)) return { key, label: loc };
  }
  return null;
}

const searchQuerySchema = z.object({
  location: z.string().min(1).max(200),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  bedsMin: z.coerce.number().int().min(0).optional(),
  lotSizeMin: z.coerce.number().min(0).optional(),
  propertyType: z.string().max(50).optional(),
  offset: z.coerce.number().int().min(0).default(0),
});

const marketContextSchema = z.object({
  location: z.string().min(1).max(200),
  state: z.string().max(2).optional(),
});

const propertyValueSchema = z.object({
  property_id: z.string().min(1).max(50),
});

export function register(app: Express) {
  app.get("/api/property-finder/prospective", requireAuth, async (req, res) => {
    try {
      const properties = await storage.getProspectiveProperties(getAuthUser(req).id);
      res.json(properties);
    } catch (error) {
      logAndSendError(res, "Failed to fetch prospective properties", error);
    }
  });

  app.post("/api/property-finder/prospective", requireAuth, async (req, res) => {
    try {
      const validation = insertProspectivePropertySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const property = await storage.addProspectiveProperty({
        ...validation.data,
        userId: getAuthUser(req).id,
      });

      logActivity(req, "favorite", "prospective_property", property.id, property.address);
      res.status(201).json(property);
    } catch (error) {
      logAndSendError(res, "Failed to add prospective property", error);
    }
  });

  app.delete("/api/property-finder/prospective/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteProspectiveProperty(Number(req.params.id), getAuthUser(req).id);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to delete prospective property", error);
    }
  });

  app.patch("/api/property-finder/prospective/:id/notes", requireAuth, async (req, res) => {
    try {
      const { notes } = req.body;
      const property = await storage.updateProspectivePropertyNotes(
        Number(req.params.id),
        getAuthUser(req).id,
        notes as string
      );
      if (!property) return res.status(404).json({ error: "Property not found" });
      res.json(property);
    } catch (error) {
      logAndSendError(res, "Failed to update notes", error);
    }
  });

  const searchLimiter = aiRateLimit(10, 60_000);

  app.get("/api/property-finder/search", requireAuth, searchLimiter, async (req, res) => {
    try {
      const parsed = searchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid search parameters", results: [], total: 0, offset: 0 });
      }

      const { location, priceMin, priceMax, bedsMin, lotSizeMin, propertyType, offset: pageOffset } = parsed.data;

      if (!realtyService.isAvailable()) {
        return res.status(503).json({ error: "RapidAPI key not configured. Add RAPIDAPI_KEY in Secrets to enable real property listings.", results: [], total: 0, offset: 0 });
      }

      const result = await realtyService.searchProperties({
        location,
        priceMin,
        priceMax,
        bedsMin,
        lotSizeMinAcres: lotSizeMin,
        propertyType,
        offset: pageOffset,
        limit: 20,
      });

      logger.info(`[property-finder] Search for "${location}" returned ${result.results.length} results (total: ${result.total})`);
      res.json(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Search failed";
      logger.error(`[property-finder] Search error: ${msg}`);
      logAndSendError(res, "Property search failed", error);
    }
  });

  app.get("/api/property-finder/market-context", requireAuth, searchLimiter, async (req, res) => {
    try {
      const parsed = marketContextSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid parameters" });
      }

      const { location, state } = parsed.data;
      const xoteloMatch = findXoteloKey(state ? `${location}, ${state}` : location);

      const [hotelSnapshotResult, regionalMediansResult] = await Promise.allSettled([
        xoteloMatch
          ? getMarketIntelligenceAggregator().getXoteloService().getMarketSnapshotByKey(xoteloMatch.key, xoteloMatch.label)
          : Promise.resolve(null),
        state && usRealEstateService.isAvailable()
          ? usRealEstateService.getRegionalMedians(location.split(",")[0].trim(), state)
          : Promise.resolve(null),
      ]);

      const hotelSnapshot = hotelSnapshotResult.status === "fulfilled" ? hotelSnapshotResult.value : null;
      const regionalMedians = regionalMediansResult.status === "fulfilled" ? regionalMediansResult.value : null;

      let topHotelRates: Array<{
        name: string;
        key: string;
        rates: Array<{ name: string; rate: number }>;
        avgRate: number | null;
      }> = [];

      if (hotelSnapshot && hotelSnapshot.hotels.length > 0) {
        const today = new Date();
        const checkIn = today.toISOString().split("T")[0];
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const checkOut = tomorrow.toISOString().split("T")[0];

        const xotelo = getMarketIntelligenceAggregator().getXoteloService();
        const top3 = hotelSnapshot.hotels
          .filter((h) => h.rating && h.rating >= 3.5)
          .slice(0, 3);

        const rateResults = await Promise.allSettled(
          top3.map((h) => xotelo.getHotelRates(h.key, checkIn, checkOut))
        );

        topHotelRates = rateResults
          .map((r, i) => {
            if (r.status === "fulfilled" && r.value) {
              return {
                name: top3[i].name,
                key: top3[i].key,
                rates: r.value.rates.map((rate) => ({ name: rate.name, rate: rate.rate })),
                avgRate: r.value.avgRate,
              };
            }
            return null;
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);
      }

      res.json({
        hotelSnapshot: hotelSnapshot ? {
          location: hotelSnapshot.location,
          sampleSize: hotelSnapshot.sampleSize,
          avgPriceMin: hotelSnapshot.avgPriceMin,
          avgPriceMax: hotelSnapshot.avgPriceMax,
          topHotels: hotelSnapshot.hotels.slice(0, 5).map((h) => ({
            name: h.name,
            type: h.type,
            rating: h.rating,
            reviewCount: h.reviewCount,
            priceMin: h.priceMin,
            priceMax: h.priceMax,
          })),
        } : null,
        topHotelRates,
        regionalMedians,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      logAndSendError(res, "Market context failed", error);
    }
  });

  app.get("/api/property-finder/property-value", requireAuth, searchLimiter, async (req, res) => {
    try {
      const parsed = propertyValueSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid parameters" });
      }

      if (!usRealEstateService.isAvailable()) {
        return res.status(503).json({ error: "RapidAPI key not configured" });
      }

      const history = await usRealEstateService.getPropertyValueHistory(parsed.data.property_id);
      res.json({ history });
    } catch (error) {
      logAndSendError(res, "Property value lookup failed", error);
    }
  });

  app.get("/api/property-finder/saved-searches", requireAuth, async (req, res) => {
    try {
      const searches = await storage.getSavedSearches(getAuthUser(req).id);
      res.json(searches);
    } catch (error) {
      logAndSendError(res, "Failed to fetch saved searches", error);
    }
  });

  app.post("/api/property-finder/saved-searches", requireAuth, async (req, res) => {
    try {
      const validation = insertSavedSearchSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const search = await storage.addSavedSearch({
        ...validation.data,
        userId: getAuthUser(req).id,
      });

      logActivity(req, "save-search", "saved_search", search.id, search.name);
      res.status(201).json(search);
    } catch (error) {
      logAndSendError(res, "Failed to add saved search", error);
    }
  });

  app.delete("/api/property-finder/saved-searches/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSavedSearch(Number(req.params.id), getAuthUser(req).id);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to delete saved search", error);
    }
  });
}
