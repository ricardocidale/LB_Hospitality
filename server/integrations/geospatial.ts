import { db } from "../db";
import { properties } from "@shared/schema";
import { eq } from "drizzle-orm";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

const geocodeCache = new Map<string, { lat: number; lng: number }>();
const placesCache = new Map<string, { data: any[]; cachedAt: number }>();
const PLACES_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

function isConfigured(): boolean {
  return GOOGLE_MAPS_API_KEY.length > 0;
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!isConfigured()) return null;

  const cacheKey = address.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results?.length > 0) {
      const location = data.results[0].geometry.location;
      const result = { lat: location.lat, lng: location.lng };
      geocodeCache.set(cacheKey, result);
      return result;
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function placesAutocomplete(query: string): Promise<any[]> {
  if (!isConfigured()) return [];

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=address&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.predictions) {
      return data.predictions.map((p: any) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || "",
        secondaryText: p.structured_formatting?.secondary_text || "",
      }));
    }
    return [];
  } catch (error) {
    console.error("Places autocomplete error:", error);
    return [];
  }
}

export async function placeDetails(placeId: string): Promise<any | null> {
  if (!isConfigured()) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry,formatted_address,address_components&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.result) {
      const result = data.result;
      const components = result.address_components || [];

      const getComponent = (type: string) =>
        components.find((c: any) => c.types.includes(type))?.long_name || "";

      return {
        lat: result.geometry?.location?.lat,
        lng: result.geometry?.location?.lng,
        formattedAddress: result.formatted_address,
        streetAddress: `${getComponent("street_number")} ${getComponent("route")}`.trim(),
        city: getComponent("locality") || getComponent("sublocality"),
        stateProvince: getComponent("administrative_area_level_1"),
        zipPostalCode: getComponent("postal_code"),
        country: getComponent("country"),
      };
    }
    return null;
  } catch (error) {
    console.error("Place details error:", error);
    return null;
  }
}

export type POIType = "hotel" | "airport" | "convention_center" | "tourist_attraction";

export interface NearbyPOI {
  name: string;
  type: POIType;
  lat: number;
  lng: number;
  vicinity: string;
  rating?: number;
  distance: number;
}

const POI_TYPE_MAP: Record<POIType, string> = {
  hotel: "lodging",
  airport: "airport",
  convention_center: "convention_center",
  tourist_attraction: "tourist_attraction",
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function nearbyPOISearch(
  lat: number,
  lng: number,
  types: POIType[] = ["hotel", "airport", "convention_center", "tourist_attraction"],
  radiusMiles: number = 10
): Promise<NearbyPOI[]> {
  if (!isConfigured()) return [];

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${types.sort().join(",")},${radiusMiles}`;
  const cached = placesCache.get(cacheKey);
  if (cached && (Date.now() - cached.cachedAt) < PLACES_CACHE_TTL) {
    return cached.data;
  }

  const radiusMeters = Math.round(radiusMiles * 1609.34);
  const results: NearbyPOI[] = [];

  try {
    for (const poiType of types) {
      const googleType = POI_TYPE_MAP[poiType];
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=${googleType}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results) {
        for (const place of data.results.slice(0, 10)) {
          const placeLat = place.geometry?.location?.lat;
          const placeLng = place.geometry?.location?.lng;
          if (placeLat && placeLng) {
            results.push({
              name: place.name,
              type: poiType,
              lat: placeLat,
              lng: placeLng,
              vicinity: place.vicinity || "",
              rating: place.rating,
              distance: haversineDistance(lat, lng, placeLat, placeLng),
            });
          }
        }
      }
    }

    placesCache.set(cacheKey, { data: results, cachedAt: Date.now() });
    return results;
  } catch (error) {
    console.error("Nearby POI search error:", error);
    return [];
  }
}

export async function geocodeAndUpdateProperty(propertyId: number): Promise<{ lat: number; lng: number } | null> {
  try {
    const [property] = await db.select().from(properties).where(eq(properties.id, propertyId));
    if (!property) return null;

    const addressParts = [
      property.streetAddress,
      property.city,
      property.stateProvince,
      property.zipPostalCode,
      property.country,
    ].filter(Boolean);

    const address = addressParts.length > 0 ? addressParts.join(", ") : property.location;
    if (!address) return null;

    const coords = await geocodeAddress(address);
    if (!coords) return null;

    await db.update(properties)
      .set({ latitude: coords.lat, longitude: coords.lng })
      .where(eq(properties.id, propertyId));

    return coords;
  } catch (error) {
    console.error("Geocode and update error:", error);
    return null;
  }
}

export function getGeospatialStatus() {
  return {
    configured: isConfigured(),
    geocodeCacheSize: geocodeCache.size,
    placesCacheSize: placesCache.size,
  };
}
