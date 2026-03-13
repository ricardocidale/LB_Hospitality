import type { Express } from "express";
import { Country, State, City } from "country-state-city";
import { requireAuth } from "../auth";

export function register(app: Express) {
  app.get("/api/geo/countries", requireAuth, (_req, res) => {
    const countries = Country.getAllCountries().map((c) => ({
      name: c.name,
      isoCode: c.isoCode,
      flag: c.flag,
    }));
    res.json(countries);
  });

  app.get("/api/geo/states", requireAuth, (req, res) => {
    const country = req.query.country as string;
    if (!country) return res.status(400).json({ error: "country query param required" });
    const states = State.getStatesOfCountry(country).map((s) => ({
      name: s.name,
      isoCode: s.isoCode,
    }));
    res.json(states);
  });

  app.get("/api/geo/cities", requireAuth, (req, res) => {
    const country = req.query.country as string;
    const state = req.query.state as string;
    if (!country) return res.status(400).json({ error: "country query param required" });
    const cities = state
      ? City.getCitiesOfState(country, state)
      : City.getCitiesOfCountry(country) || [];
    const mapped = (cities || []).map((c) => ({
      name: c.name,
      stateCode: c.stateCode,
      latitude: c.latitude,
      longitude: c.longitude,
    }));
    res.json(mapped);
  });
}
