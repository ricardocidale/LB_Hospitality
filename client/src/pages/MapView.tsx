import { useState, useEffect, useRef } from "react";
import { useProperties } from "@/lib/api";
import { Link } from "wouter";
import { MapPin, Building2, DollarSign, Loader2, AlertTriangle } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const GEOCODE_CACHE: Record<string, [number, number] | null> = {};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const statusColor = (status: string) => {
  switch (status) {
    case "Operating": return "bg-green-100 text-green-700";
    case "Improvements": return "bg-amber-100 text-amber-700";
    case "Acquired": return "bg-blue-100 text-blue-700";
    case "In Negotiation": return "bg-purple-100 text-purple-700";
    case "Pipeline": return "bg-gray-100 text-gray-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

function hasCompleteAddress(property: any): boolean {
  return !!(property.city && property.country);
}

function formatAddress(property: any): string {
  const parts = [property.streetAddress, property.city];
  if (property.stateProvince) parts.push(property.stateProvince);
  if (property.zipPostalCode) parts.push(property.zipPostalCode);
  parts.push(property.country);
  return parts.filter(Boolean).join(", ");
}

async function geocode(address: string): Promise<[number, number] | null> {
  if (address in GEOCODE_CACHE) return GEOCODE_CACHE[address];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "User-Agent": "HBG-Portfolio-Map/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      GEOCODE_CACHE[address] = coords;
      return coords;
    }
    GEOCODE_CACHE[address] = null;
    return null;
  } catch {
    return null;
  }
}

function createPinIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

type GeoProperty = {
  property: any;
  coords: [number, number];
};

export default function MapView() {
  const { data: properties = [] } = useProperties();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [geoProperties, setGeoProperties] = useState<GeoProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const mappableProperties = properties.filter(hasCompleteAddress);
  const unmappableCount = properties.length - mappableProperties.length;

  useEffect(() => {
    if (mappableProperties.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function geocodeAll() {
      setLoading(true);
      const results: GeoProperty[] = [];

      for (const p of mappableProperties) {
        if (cancelled) return;
        const addr = formatAddress(p);
        const coords = await geocode(addr);
        if (coords) {
          results.push({ property: p, coords });
        }
      }

      if (!cancelled) {
        setGeoProperties(results);
        setLoading(false);
      }
    }

    geocodeAll();
    return () => { cancelled = true; };
  }, [properties.length]);

  useEffect(() => {
    if (!mapContainerRef.current || loading || geoProperties.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    geoProperties.forEach(({ property, coords }) => {
      const color = property.market === "North America" ? "#9FBCA4" : "#3B82F6";
      const marker = L.marker(coords, { icon: createPinIcon(color) }).addTo(map);
      bounds.extend(coords);

      const popupContent = `
        <div style="min-width:200px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${property.name}</div>
          <div style="color:#666;font-size:12px;margin-bottom:6px;">${formatAddress(property)}</div>
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <span style="background:${property.market === 'North America' ? '#E8F0E9' : '#DBEAFE'};color:${property.market === 'North America' ? '#5A7D60' : '#1D4ED8'};font-size:11px;padding:2px 8px;border-radius:9999px;">${property.market}</span>
            <span style="font-size:11px;padding:2px 8px;border-radius:9999px;background:#F3F4F6;color:#374151;">${property.status}</span>
          </div>
          <div style="font-size:12px;color:#555;">${property.roomCount} rooms · ${formatMoney(property.startAdr)} ADR</div>
        </div>
      `;
      marker.bindPopup(popupContent);

      marker.on("click", () => {
        setSelectedId(property.id);
      });
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loading, geoProperties]);

  const selectedProperty = properties.find((p: any) => p.id === selectedId);

  return (
    <div data-testid="map-view" className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground" data-testid="map-view-title">
          Portfolio Map
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Geographic overview of {mappableProperties.length} {mappableProperties.length === 1 ? "property" : "properties"} with addresses
        </p>
      </div>

      {unmappableCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800" data-testid="text-unmappable-notice">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><strong>{unmappableCount}</strong> {unmappableCount === 1 ? "property" : "properties"} not shown — missing address details.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-primary/20 overflow-hidden shadow-lg bg-white relative" style={{ height: "560px" }}>
            {loading && (
              <div className="absolute inset-0 z-[1000] bg-white/80 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Locating properties on map...</p>
              </div>
            )}
            {!loading && geoProperties.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <MapPin className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No properties with valid addresses to map</p>
              </div>
            )}
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-3 max-h-[560px] overflow-y-auto">
          {geoProperties.map(({ property }) => {
            const isSelected = selectedId === property.id;
            const pinColor = property.market === "North America" ? "#9FBCA4" : "#3B82F6";
            return (
              <Link key={property.id} href={`/property/${property.id}`} data-testid={`card-property-${property.id}`}>
                <div
                  className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-gray-200 bg-white hover:border-primary/30"
                  }`}
                  onMouseEnter={() => setSelectedId(property.id)}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin size={16} color={pinColor} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-foreground truncate" data-testid={`text-name-${property.id}`}>
                        {property.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate" data-testid={`text-location-${property.id}`}>
                        {property.city}, {property.stateProvince || property.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor(property.status)}`}>
                      {property.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 size={12} /> {property.roomCount}</span>
                    <span className="flex items-center gap-1"><DollarSign size={12} /> {formatMoney(property.startAdr)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
          {loading && geoProperties.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading properties...</div>
          )}
        </div>
      </div>
    </div>
  );
}
