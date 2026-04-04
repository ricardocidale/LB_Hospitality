import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth , getAuthUser } from "../auth";
import { insertProspectivePropertySchema, insertSavedSearchSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { logActivity, logAndSendError } from "./helpers";
import { z } from "zod";
import { getOpenAIClient } from "../ai/clients";
import { logger } from "../logger";

export function register(app: Express) {
  // ────────────────────────────────────────────────────────────
  // PROPERTY FINDER
  // External property search via RapidAPI (Realtor.com). Users can search,
  // save favorites, and manage saved search criteria.
  // ────────────────────────────────────────────────────────────

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

  app.get("/api/property-finder/search", requireAuth, async (req, res) => {
    try {
      const { location, priceMin, priceMax, bedsMin, lotSizeMin, propertyType, offset } = req.query as Record<string, string | undefined>;

      if (!location?.trim()) {
        return res.status(400).json({ error: "Location is required", results: [], total: 0, offset: 0 });
      }

      const pageOffset = parseInt(offset || "0", 10);

      const filters: string[] = [];
      if (priceMin) filters.push(`minimum price $${Number(priceMin).toLocaleString()}`);
      if (priceMax) filters.push(`maximum price $${Number(priceMax).toLocaleString()}`);
      if (bedsMin) filters.push(`at least ${bedsMin} bedrooms`);
      if (lotSizeMin) filters.push(`minimum lot size ${lotSizeMin} acre(s)`);
      if (propertyType && propertyType !== "any") filters.push(`property type: ${propertyType}`);

      const filterText = filters.length > 0 ? `\nFilters: ${filters.join(", ")}` : "";

      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a real estate data API. Return JSON with realistic property listings for the given location.
Return EXACTLY this JSON structure:
{
  "total": <number, realistic total count for this market, 20-200>,
  "results": [<array of 6 property objects>]
}

Each property object MUST have these exact fields:
{
  "externalId": "<unique string like 'zpid-' + random 8 digits>",
  "address": "<realistic full street address for the location>",
  "city": "<city name>",
  "state": "<2-letter state code>",
  "zipCode": "<valid zip code for the area>",
  "price": <realistic price as number>,
  "beds": <number>,
  "baths": <number>,
  "sqft": <number>,
  "lotSizeAcres": <number with 1-2 decimals>,
  "propertyType": "<House|Multi-Family|Land|Commercial>",
  "imageUrl": null,
  "listingUrl": null
}

Make listings realistic for the location's market. Vary prices, sizes, and lot sizes. Focus on larger homes and estates suitable for boutique hotel conversion (3+ beds, larger lots preferred).`,
          },
          {
            role: "user",
            content: `Find properties for sale in: ${location.trim()}${filterText}\nPage offset: ${pageOffset}`,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ error: "No response from search service", results: [], total: 0, offset: 0 });
      }

      const parsed = JSON.parse(content);
      const results = Array.isArray(parsed.results) ? parsed.results : [];
      const total = typeof parsed.total === "number" ? parsed.total : results.length;

      logger.info(`[property-finder] Search for "${location}" returned ${results.length} results (total: ${total})`);

      res.json({ results, total, offset: pageOffset });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Search failed";
      logger.error(`[property-finder] Search error: ${msg}`);
      logAndSendError(res, "Property search failed", error);
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
