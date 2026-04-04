import type { Express, Request, Response } from "express";
import { requireAuth } from "../auth";
import { logAndSendError } from "./helpers";
import { getMarketIntelligenceAggregator } from "../services/MarketIntelligenceAggregator";

export function register(app: Express) {
  app.get("/api/hotel-rates/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const query = String(req.query.query || "").trim();
      if (!query) return res.status(400).json({ error: "query parameter required" });

      const xotelo = getMarketIntelligenceAggregator().getXoteloService();
      const results = await xotelo.searchHotels(query);
      res.json({ results });
    } catch (error) {
      logAndSendError(res, "Hotel search failed", error);
    }
  });

  app.get("/api/hotel-rates/rates", requireAuth, async (req: Request, res: Response) => {
    try {
      const hotelKey = String(req.query.hotel_key || "").trim();
      const checkIn = String(req.query.chk_in || "").trim();
      const checkOut = String(req.query.chk_out || "").trim();
      const currency = String(req.query.currency || "USD").trim();

      if (!hotelKey || !checkIn || !checkOut) {
        return res.status(400).json({ error: "hotel_key, chk_in, and chk_out parameters required" });
      }

      const xotelo = getMarketIntelligenceAggregator().getXoteloService();
      const rates = await xotelo.getHotelRates(hotelKey, checkIn, checkOut, currency);
      res.json({ rates });
    } catch (error) {
      logAndSendError(res, "Hotel rate lookup failed", error);
    }
  });

  app.get("/api/hotel-rates/list", requireAuth, async (req: Request, res: Response) => {
    try {
      const locationKey = String(req.query.location_key || "").trim();
      if (!locationKey) return res.status(400).json({ error: "location_key parameter required" });

      const limit = Math.min(Number(req.query.limit) || 30, 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const sort = (req.query.sort as string) || "popularity";
      const validSorts = ["best_value", "popularity", "distance"];
      const sortBy = validSorts.includes(sort) ? sort as "best_value" | "popularity" | "distance" : "popularity";

      const xotelo = getMarketIntelligenceAggregator().getXoteloService();
      const hotels = await xotelo.getHotelList(locationKey, limit, offset, sortBy);
      res.json({ hotels });
    } catch (error) {
      logAndSendError(res, "Hotel list failed", error);
    }
  });

  app.get("/api/hotel-rates/market-snapshot", requireAuth, async (req: Request, res: Response) => {
    try {
      const location = String(req.query.location || "").trim();
      const locationKey = String(req.query.location_key || "").trim();

      if (!location && !locationKey) {
        return res.status(400).json({ error: "location or location_key parameter required" });
      }

      const xotelo = getMarketIntelligenceAggregator().getXoteloService();
      const snapshot = locationKey
        ? await xotelo.getMarketSnapshotByKey(locationKey, location || undefined)
        : await xotelo.getMarketSnapshot(location);
      res.json({ snapshot });
    } catch (error) {
      logAndSendError(res, "Market snapshot failed", error);
    }
  });
}
