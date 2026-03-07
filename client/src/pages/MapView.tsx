import { useState, useEffect, useRef, useCallback } from "react";
import { useProperties } from "@/lib/api";
import { Link } from "wouter";
import { MapPin, Building2, DollarSign, Loader2, AlertTriangle, Layers, Navigation, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const GEOCODE_CACHE: Record<string, [number, number] | null> = {};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const statusColor = (status: string) => {
  switch (status) {
    case "Operating": return { bg: "#dcfce7", text: "#15803d" };
    case "Improvements": return { bg: "#fef3c7", text: "#b45309" };
    case "Acquired": return { bg: "#dbeafe", text: "#1d4ed8" };
    case "In Negotiation": return { bg: "#f3e8ff", text: "#7c3aed" };
    case "Pipeline": return { bg: "#f3f4f6", text: "#374151" };
    case "Planned": return { bg: "#e0f2fe", text: "#0369a1" };
    default: return { bg: "#f3f4f6", text: "#374151" };
  }
};

function hasCompleteAddress(property: any): boolean {
  return !!(property.city && property.country);
}

function formatAddress(property: any): string {
  const parts = [property.city];
  if (property.stateProvince) parts.push(property.stateProvince);
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
      const coords: [number, number] = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
      GEOCODE_CACHE[address] = coords;
      return coords;
    }
    GEOCODE_CACHE[address] = null;
    return null;
  } catch {
    return null;
  }
}

type GeoProperty = {
  property: any;
  coords: [number, number];
};

const MAP_STYLES = {
  streets: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  voyager: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
};

function createMarkerElement(property: any, isSelected: boolean) {
  const color = property.market === "North America" ? "#9FBCA4" : "#3B82F6";
  const size = isSelected ? 42 : 32;
  const el = document.createElement("div");
  el.className = "map-marker-container";
  el.style.cursor = "pointer";
  el.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
  if (isSelected) el.style.transform = "scale(1.15)";
  el.innerHTML = `
    <div style="position:relative;width:${size}px;height:${size + 12}px;">
      <div style="
        width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
        background:${color};transform:rotate(-45deg);
        box-shadow:0 4px 12px rgba(0,0,0,0.3);
        border:3px solid white;
        display:flex;align-items:center;justify-content:center;
        ${isSelected ? 'animation:marker-pulse 1.5s ease-in-out infinite;' : ''}
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.4}" height="${size * 0.4}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
      ${isSelected ? `<div style="
        position:absolute;top:-4px;left:-4px;right:-4px;bottom:8px;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        border:2px solid ${color};opacity:0.4;
        animation:marker-ring 1.5s ease-in-out infinite;
      "></div>` : ''}
    </div>
  `;
  return el;
}

function createPopupHTML(property: any) {
  const sc = statusColor(property.status);
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;min-width:240px;padding:4px;">
      <h3 style="font-weight:700;font-size:15px;margin:0 0 4px;color:#1a1a2e;">${property.name}</h3>
      <p style="color:#64748b;font-size:12px;margin:0 0 10px;">${formatAddress(property)}</p>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
        <span style="background:${property.market === 'North America' ? '#E8F0E9' : '#DBEAFE'};color:${property.market === 'North America' ? '#5A7D60' : '#1D4ED8'};font-size:11px;padding:3px 10px;border-radius:9999px;font-weight:600;">${property.market}</span>
        <span style="background:${sc.bg};color:${sc.text};font-size:11px;padding:3px 10px;border-radius:9999px;font-weight:600;">${property.status}</span>
      </div>
      <div style="display:flex;gap:16px;font-size:12px;color:#475569;padding-top:8px;border-top:1px solid #f1f5f9;">
        <div style="display:flex;align-items:center;gap:4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <strong>${property.roomCount}</strong> rooms
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <strong>${formatMoney(property.startAdr)}</strong> ADR
        </div>
      </div>
    </div>
  `;
}

export default function MapView() {
  const { data: properties = [] } = useProperties();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<number, maplibregl.Marker>>(new Map());
  const [geoProperties, setGeoProperties] = useState<GeoProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>("voyager");
  const [terrain3d, setTerrain3d] = useState(true);

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
        const addr = `${p.city}, ${p.stateProvince || ''}, ${p.country}`;
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

  const updateMarkers = useCallback((selected: number | null) => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    geoProperties.forEach(({ property, coords }) => {
      const el = createMarkerElement(property, property.id === selected);

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: "300px",
        className: "map-popup-custom",
      }).setHTML(createPopupHTML(property));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        setSelectedId(property.id);
      });

      markersRef.current.set(property.id, marker);
    });
  }, [geoProperties]);

  useEffect(() => {
    if (!mapContainerRef.current || loading || geoProperties.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[mapStyle],
      center: [-75, 10],
      zoom: 3,
      pitch: terrain3d ? 55 : 30,
      bearing: terrain3d ? -15 : 0,
      antialias: true,
      maxPitch: 85,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(new maplibregl.TerrainControl({ source: "terrainSource", exaggeration: 1.5 }), "top-right");

    mapRef.current = map;

    map.on("load", () => {
      if (terrain3d) {
        map.addSource("terrainSource", {
          type: "raster-dem",
          tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
          encoding: "terrarium",
          tileSize: 256,
          maxzoom: 15,
        });

        map.setTerrain({ source: "terrainSource", exaggeration: 1.5 });

        map.addLayer({
          id: "hillshading",
          source: "terrainSource",
          type: "hillshade",
          paint: {
            "hillshade-illumination-direction": 315,
            "hillshade-exaggeration": 0.6,
            "hillshade-shadow-color": "rgba(0,0,0,0.3)",
            "hillshade-highlight-color": "rgba(255,255,255,0.5)",
          },
        });

      }

      map.addLayer({
        id: "sky",
        type: "sky" as any,
        paint: {
          "sky-type": "atmosphere" as any,
          "sky-atmosphere-sun": [0, 0] as any,
          "sky-atmosphere-sun-intensity": 15 as any,
        } as any,
      });

      updateMarkers(selectedId);

      const bounds = new maplibregl.LngLatBounds();
      geoProperties.forEach(({ coords }) => bounds.extend(coords));

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          maxZoom: 8,
          duration: 2500,
          essential: true,
          pitch: terrain3d ? 55 : 30,
          bearing: terrain3d ? -15 : 0,
        } as any);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [loading, geoProperties, mapStyle, terrain3d]);

  useEffect(() => {
    updateMarkers(selectedId);

    if (selectedId && mapRef.current) {
      const geo = geoProperties.find(g => g.property.id === selectedId);
      if (geo) {
        mapRef.current.flyTo({
          center: geo.coords,
          zoom: Math.max(mapRef.current.getZoom(), terrain3d ? 10 : 7),
          pitch: terrain3d ? 60 : 30,
          bearing: terrain3d ? mapRef.current.getBearing() + 15 : 0,
          duration: 1800,
          essential: true,
        });

        const marker = markersRef.current.get(selectedId);
        if (marker && !marker.getPopup().isOpen()) {
          marker.togglePopup();
        }
      }
    }
  }, [selectedId, updateMarkers]);

  const cycleStyle = () => {
    const styles = Object.keys(MAP_STYLES) as (keyof typeof MAP_STYLES)[];
    const idx = styles.indexOf(mapStyle);
    setMapStyle(styles[(idx + 1) % styles.length]);
  };

  const fitAll = () => {
    if (!mapRef.current || geoProperties.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    geoProperties.forEach(({ coords }) => bounds.extend(coords));
    mapRef.current.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 80 },
      maxZoom: 8,
      duration: 1500,
    });
    setSelectedId(null);
  };

  return (
    <div data-testid="map-view" className="space-y-4">
      <style>{`
        @keyframes marker-pulse {
          0%, 100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 0 4px rgba(159,188,164,0.2); }
        }
        @keyframes marker-ring {
          0%, 100% { opacity: 0.4; transform: rotate(-45deg) scale(1); }
          50% { opacity: 0.1; transform: rotate(-45deg) scale(1.3); }
        }
        .map-popup-custom .maplibregl-popup-content {
          border-radius: 12px !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important;
          padding: 14px !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
        }
        .map-popup-custom .maplibregl-popup-tip {
          border-top-color: white !important;
        }
        .maplibregl-ctrl-group { border-radius: 10px !important; box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important; }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground" data-testid="map-view-title">
            Portfolio Map
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {geoProperties.length} {geoProperties.length === 1 ? "property" : "properties"} mapped across {new Set(geoProperties.map(g => g.property.country)).size} {new Set(geoProperties.map(g => g.property.country)).size === 1 ? "country" : "countries"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={terrain3d ? "default" : "outline"} size="sm" onClick={() => setTerrain3d(!terrain3d)} className="flex items-center gap-1.5 text-xs" data-testid="button-3d-terrain">
            <Mountain className="w-3.5 h-3.5" />
            3D Terrain
          </Button>
          <Button variant="outline" size="sm" onClick={cycleStyle} className="flex items-center gap-1.5 text-xs" data-testid="button-map-style">
            <Layers className="w-3.5 h-3.5" />
            {mapStyle === "streets" ? "Light" : mapStyle === "dark" ? "Dark" : "Voyager"}
          </Button>
          <Button variant="outline" size="sm" onClick={fitAll} className="flex items-center gap-1.5 text-xs" data-testid="button-fit-all">
            <Navigation className="w-3.5 h-3.5" />
            Fit All
          </Button>
        </div>
      </div>

      {unmappableCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800" data-testid="text-unmappable-notice">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span><strong>{unmappableCount}</strong> {unmappableCount === 1 ? "property" : "properties"} not shown — missing address details.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-primary/20 overflow-hidden shadow-xl bg-[#f8f4f0] relative" style={{ height: "600px" }}>
            {loading && (
              <div className="absolute inset-0 z-[1000] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <MapPin className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Locating properties...</p>
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

        <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-1">
            Properties ({geoProperties.length})
          </div>
          {geoProperties.map(({ property }) => {
            const isSelected = selectedId === property.id;
            const pinColor = property.market === "North America" ? "#9FBCA4" : "#3B82F6";
            const sc = statusColor(property.status);
            return (
              <div
                key={property.id}
                className={`rounded-xl border p-3.5 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/30 hover:shadow-md"
                }`}
                onClick={() => setSelectedId(property.id)}
                onDoubleClick={() => window.location.href = `/property/${property.id}`}
                data-testid={`card-property-${property.id}`}
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${pinColor}20` }}
                  >
                    <Building2 size={14} style={{ color: pinColor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-foreground truncate" data-testid={`text-name-${property.id}`}>
                      {property.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {formatAddress(property)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: sc.bg, color: sc.text }}
                  >
                    {property.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {property.market}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Building2 size={11} /> {property.roomCount} rooms</span>
                  <span className="flex items-center gap-1"><DollarSign size={11} /> {formatMoney(property.startAdr)}</span>
                </div>
                {isSelected && (
                  <Link href={`/property/${property.id}`}>
                    <div className="mt-2 pt-2 border-t border-primary/10 text-[11px] text-primary font-medium hover:underline" data-testid={`link-view-${property.id}`}>
                      View Property Details →
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
