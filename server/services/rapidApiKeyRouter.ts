/**
 * RapidAPI Key Router
 *
 * Distributes load across 3 RapidAPI keys to avoid hitting per-key rate limits.
 * All keys access the same subscriptions on the account — routing is purely
 * for quota management.
 *
 *   RAPIDAPI_KEY   — existing services: Xotelo, Realty in US, US Real Estate
 *   RAPIDAPI_KEY_2 — STR / hospitality comps: Airbnb, Booking, Hotels.com, TripAdvisor
 *   RAPIDAPI_KEY_3 — intelligence feeds: Weather, Flight Data, GeoDB, CNBC, Bloomberg
 */

export type RapidApiSlot = "primary" | "secondary" | "tertiary";

export function getRapidApiKey(slot: RapidApiSlot = "primary"): string | undefined {
  switch (slot) {
    case "primary":   return process.env.RAPIDAPI_KEY;
    case "secondary": return process.env.RAPIDAPI_KEY_2;
    case "tertiary":  return process.env.RAPIDAPI_KEY_3;
  }
}

export function rapidApiHeaders(host: string, slot: RapidApiSlot = "primary"): Record<string, string> {
  return {
    "x-rapidapi-key":  getRapidApiKey(slot) ?? "",
    "x-rapidapi-host": host,
  };
}

export function isRapidApiAvailable(slot: RapidApiSlot = "primary"): boolean {
  return !!getRapidApiKey(slot);
}
