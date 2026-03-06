import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { insertProspectivePropertySchema, insertSavedSearchSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { logActivity, logAndSendError } from "./helpers";
import { z } from "zod";

export function register(app: Express) {
  // ────────────────────────────────────────────────────────────
  // PROPERTY FINDER
  // External property search via RapidAPI (Realtor.com). Users can search,
  // save favorites, and manage saved search criteria.
  // ────────────────────────────────────────────────────────────

  app.get("/api/property-finder/prospective", requireAuth, async (req, res) => {
    try {
      const properties = await storage.getProspectiveProperties(req.user!.id);
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
        userId: req.user!.id,
      });

      logActivity(req, "favorite", "prospective_property", property.id, property.address);
      res.status(201).json(property);
    } catch (error) {
      logAndSendError(res, "Failed to add prospective property", error);
    }
  });

  app.delete("/api/property-finder/prospective/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteProspectiveProperty(Number(req.params.id), req.user!.id);
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
        req.user!.id,
        notes as string
      );
      if (!property) return res.status(404).json({ error: "Property not found" });
      res.json(property);
    } catch (error) {
      logAndSendError(res, "Failed to update notes", error);
    }
  });

  app.get("/api/property-finder/search", requireAuth, async (req, res) => {
    res.status(501).json({
      error: "Property search requires RapidAPI integration",
      message: "External property search is not yet configured. Please add properties manually.",
      results: [],
      totalResults: 0,
    });
  });

  app.get("/api/property-finder/saved-searches", requireAuth, async (req, res) => {
    try {
      const searches = await storage.getSavedSearches(req.user!.id);
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
        userId: req.user!.id,
      });

      logActivity(req, "save-search", "saved_search", search.id, search.name);
      res.status(201).json(search);
    } catch (error) {
      logAndSendError(res, "Failed to add saved search", error);
    }
  });

  app.delete("/api/property-finder/saved-searches/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSavedSearch(Number(req.params.id), req.user!.id);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to delete saved search", error);
    }
  });
}
