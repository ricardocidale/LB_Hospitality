import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import DOMPurify from "dompurify";
import { useProperties } from "@/lib/api";
import { Link } from "wouter";
import { IconBuilding2, IconDollarSign, IconNavigation, IconMountain, IconGlobe, IconMap, IconPlay, IconPause } from "@/components/icons";
import { Button } from "@/components/ui/button";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import Supercluster from "supercluster";

const KNOWN_COORDS: Record<string, [number, number]> = {
  "medellín, antioquia, colombia": [-75.6266, 6.2553],
  "medellin, antioquia, colombia": [-75.6266, 6.2553],
  "loch sheldrake, new york, united states": [-74.6571, 41.7701],
  "highmount, new york, united states": [-74.5025, 42.1363],
  "eden, utah, united states": [-111.8013, 41.3027],
  "huntsville, utah, united states": [-111.8007, 41.2687],
  "cartagena, bolívar, colombia": [-75.5465, 10.4235],
  "cartagena, bolivar, colombia": [-75.5465, 10.4235],
};

const REGION_COORDS: Record<string, [number, number]> = {
  "colombia": [-74.0, 4.6],
  "united states": [-98.5, 39.8],
  "mexico": [-102.5, 23.6],
  "costa rica": [-84.0, 9.9],
  "brazil": [-51.9, -14.2],
  "argentina": [-63.6, -38.4],
  "peru": [-75.0, -9.2],
  "chile": [-71.5, -35.7],
  "panama": [-80.0, 8.5],
  "dominican republic": [-70.2, 18.7],
  "jamaica": [-77.3, 18.1],
  "puerto rico": [-66.1, 18.2],
  "canada": [-106.3, 56.1],
  "united kingdom": [-3.4, 55.4],
  "spain": [-3.7, 40.5],
  "france": [-2.2, 46.6],
  "italy": [12.6, 41.9],
  "germany": [10.5, 51.2],
  "portugal": [-8.2, 39.4],
  "greece": [21.8, 39.1],
  "australia": [133.8, -25.3],
};

function resolveCoords(property: any): [number, number] | null {
  if (property.latitude != null && property.longitude != null) {
    return [property.longitude, property.latitude];
  }

  const city = (property.city || "").toLowerCase().trim();
  const state = (property.stateProvince || "").toLowerCase().trim();
  const country = (property.country || "").toLowerCase().trim();

  if (!country) return null;

  const fullKey = [city, state, country].filter(Boolean).join(", ");
  if (KNOWN_COORDS[fullKey]) return KNOWN_COORDS[fullKey];

  const cityCountryKey = [city, country].filter(Boolean).join(", ");
  if (KNOWN_COORDS[cityCountryKey]) return KNOWN_COORDS[cityCountryKey];

  if (REGION_COORDS[country]) {
    const base = REGION_COORDS[country];
    const hash = fullKey.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const offsetLng = ((hash % 100) - 50) * 0.02;
    const offsetLat = ((hash % 73) - 36) * 0.02;
    return [base[0] + offsetLng, base[1] + offsetLat];
  }

  return null;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function getPerformanceTier(property: any): { color: string; label: string; tier: string } {
  const noi = property.startAdr * property.roomCount * (property.startOccupancy || 0.6) * 365;
  const totalInvestment = (property.purchasePrice || 0) + (property.buildingImprovements || 0);
  const debtService = totalInvestment * 0.065;
  const dscr = totalInvestment > 0 ? noi / debtService : 0;

  if (dscr > 1.5) return { color: "#22C55E", label: "Strong (DSCR > 1.5)", tier: "strong" };
  if (dscr > 1.2) return { color: "#EAB308", label: "Moderate (DSCR 1.2–1.5)", tier: "moderate" };
  return { color: "#EF4444", label: "Watch (DSCR < 1.2)", tier: "watch" };
}

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

function formatLocation(property: any): string {
  const parts = [property.city];
  if (property.stateProvince) parts.push(property.stateProvince);
  parts.push(property.country);
  return parts.filter(Boolean).join(", ");
}

type GeoProperty = {
  property: any;
  coords: [number, number];
};

function makeRasterStyle(tileUrl: string, attribution?: string): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      "raster-tiles": {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution: attribution || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: "raster-layer",
        type: "raster",
        source: "raster-tiles",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

const MAP_STYLES = {
  standard: () => makeRasterStyle("/api/tiles/osm/{z}/{x}/{y}"),
  satellite: () => makeRasterStyle("/api/tiles/satellite/{z}/{x}/{y}", '&copy; Esri, Maxar, Earthstar Geographics'),
};

type ColorMode = "performance" | "market";

function createMarkerElement(property: any, isSelected: boolean, colorMode: ColorMode) {
  const perf = getPerformanceTier(property);
  const color = colorMode === "performance"
    ? perf.color
    : property.market === "North America" ? "var(--primary)" : "#3B82F6";
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

function createClusterMarker(count: number): HTMLDivElement {
  const size = Math.min(24 + count * 3, 50);
  const el = document.createElement("div");
  el.style.cursor = "pointer";
  el.innerHTML = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:hsl(var(--primary));
      box-shadow:0 4px 12px rgba(0,0,0,0.3);
      border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      font-family:system-ui;font-weight:700;font-size:${Math.max(11, size * 0.3)}px;color:white;
    ">${count}</div>
  `;
  return el;
}

function createPopupHTML(property: any) {
  const sc = statusColor(property.status);
  const perf = getPerformanceTier(property);
  const safeName = escapeHtml(property.name || "");
  const safeLocation = escapeHtml(formatLocation(property));
  const safeMarket = escapeHtml(property.market || "");
  const safeStatus = escapeHtml(property.status || "");
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;min-width:240px;padding:4px;">
      <h3 style="font-weight:700;font-size:15px;margin:0 0 4px;color:#1a1a2e;">${safeName}</h3>
      <p style="color:#64748b;font-size:12px;margin:0 0 10px;">${safeLocation}</p>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
        <span style="background:${property.market === 'North America' ? '#E8F0E9' : '#DBEAFE'};color:${property.market === 'North America' ? '#5A7D60' : '#1D4ED8'};font-size:11px;padding:3px 10px;border-radius:9999px;font-weight:600;">${safeMarket}</span>
        <span style="background:${sc.bg};color:${sc.text};font-size:11px;padding:3px 10px;border-radius:9999px;font-weight:600;">${safeStatus}</span>
        <span style="background:${perf.color}22;color:${perf.color};font-size:11px;padding:3px 10px;border-radius:9999px;font-weight:600;">${escapeHtml(perf.label)}</span>
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
      <div data-popup-actions style="margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;">
        <a href="/property/${property.id}" style="color:#3B82F6;font-size:12px;font-weight:600;text-decoration:none;">View Details →</a>
      </div>
    </div>
  `;
}

const TOUR_PAUSE_MS = 4000;

export default function MapView() {
  const { data: properties = [] } = useProperties();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [terrain3d, setTerrain3d] = useState(true);
  const [colorMode, setColorMode] = useState<ColorMode>("performance");
  const [globeMode, setGlobeMode] = useState(false);
  const [satelliteMode, setSatelliteMode] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourPaused, setTourPaused] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const tourRef = useRef<{ active: boolean; paused: boolean; index: number; sessionId: number }>({ active: false, paused: false, index: 0, sessionId: 0 });
  const tourTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveEndHandlerRef = useRef<(() => void) | null>(null);
  const flyToHandlerRef = useRef<((id: number) => void) | null>(null);
  const styleTransitionRef = useRef(0);

  const geoProperties: GeoProperty[] = useMemo(() =>
    properties
      .map(p => {
        const coords = resolveCoords(p);
        return coords ? { property: p, coords } : null;
      })
      .filter((g): g is GeoProperty => g !== null),
    [properties]
  );

  const unmappedCount = properties.length - geoProperties.length;

  const clusterIndex = useMemo(() => {
    const index = new Supercluster({
      radius: 60,
      maxZoom: 14,
    });

    const points: Supercluster.PointFeature<{ propertyId: number; property: any }>[] = geoProperties.map(({ property, coords }) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: coords },
      properties: { propertyId: property.id, property },
    }));

    index.load(points);
    return index;
  }, [geoProperties]);

  const updateMarkers = useCallback((selected: number | null) => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const zoom = Math.floor(map.getZoom());
    const bounds = map.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()
    ];

    const clusters = clusterIndex.getClusters(bbox, zoom);

    clusters.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;

      if (feature.properties.cluster) {
        const count = feature.properties.point_count;
        const el = createClusterMarker(count);
        const clusterId = feature.properties.cluster_id;

        el.addEventListener("click", () => {
          const expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);
          map.flyTo({ center: [lng, lat], zoom: expansionZoom, duration: 800 });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);

        markersRef.current.set(`cluster-${clusterId}`, marker);
      } else {
        const property = feature.properties.property;
        const el = createMarkerElement(property, property.id === selected, colorMode);

        const popupContent = document.createElement("div");
        popupContent.innerHTML = DOMPurify.sanitize(createPopupHTML(property));

        const flyToBtn = document.createElement("button");
        flyToBtn.setAttribute("data-testid", `popup-flyto-${property.id}`);
        flyToBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg> Fly To`;
        flyToBtn.style.cssText = "display:inline-flex;align-items:center;gap:4px;margin-top:6px;padding:4px 10px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;color:#3B82F6;font-size:11px;font-weight:600;cursor:pointer;font-family:system-ui;";
        flyToBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          flyToHandlerRef.current?.(property.id);
        });

        const actionsRow = popupContent.querySelector("[data-popup-actions]");
        if (actionsRow) {
          actionsRow.prepend(flyToBtn);
        } else {
          popupContent.firstElementChild?.appendChild(flyToBtn);
        }

        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: "300px",
          className: "map-popup-custom",
        }).setDOMContent(popupContent);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("click", () => {
          setSelectedId(property.id);
        });

        markersRef.current.set(`prop-${property.id}`, marker);
      }
    });
  }, [clusterIndex, colorMode]);

  const cancelPendingMoveEnd = useCallback(() => {
    const map = mapRef.current;
    if (map && moveEndHandlerRef.current) {
      map.off("moveend", moveEndHandlerRef.current);
      moveEndHandlerRef.current = null;
    }
  }, []);

  const cinematicFlyTo = useCallback((coords: [number, number], sessionId?: number, onComplete?: () => void) => {
    const map = mapRef.current;
    if (!map) return;

    cancelPendingMoveEnd();

    const currentZoom = map.getZoom();
    const currentBearing = map.getBearing();
    const targetBearing = currentBearing + 30 + Math.random() * 30;

    map.flyTo({
      center: coords,
      zoom: 16,
      pitch: 60,
      bearing: targetBearing,
      duration: currentZoom < 5 ? 4000 : 3000,
      essential: true,
      curve: 1.42,
      speed: 0.8,
    });

    if (onComplete) {
      const handler = () => {
        moveEndHandlerRef.current = null;
        if (sessionId !== undefined && tourRef.current.sessionId !== sessionId) return;
        onComplete();
      };
      moveEndHandlerRef.current = handler;
      map.once("moveend", handler);
    }
  }, [cancelPendingMoveEnd]);

  const stopTour = useCallback(() => {
    tourRef.current.active = false;
    tourRef.current.paused = false;
    tourRef.current.sessionId++;
    cancelPendingMoveEnd();
    if (tourTimerRef.current) {
      clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }
    setTourActive(false);
    setTourPaused(false);
    setTourIndex(0);
  }, [cancelPendingMoveEnd]);

  const runTourStep = useCallback((index: number) => {
    if (!tourRef.current.active || index >= geoProperties.length) {
      stopTour();
      return;
    }

    if (tourRef.current.paused) {
      return;
    }

    const sid = tourRef.current.sessionId;
    tourRef.current.index = index;
    setTourIndex(index);

    const geo = geoProperties[index];
    setSelectedId(geo.property.id);

    markersRef.current.forEach(m => {
      if (m.getPopup()?.isOpen()) m.togglePopup();
    });

    cinematicFlyTo(geo.coords, sid, () => {
      if (!tourRef.current.active || tourRef.current.sessionId !== sid) return;

      const marker = markersRef.current.get(`prop-${geo.property.id}`);
      if (marker && !marker.getPopup()?.isOpen()) {
        marker.togglePopup();
      }

      tourTimerRef.current = setTimeout(() => {
        if (tourRef.current.active && !tourRef.current.paused && tourRef.current.sessionId === sid) {
          runTourStep(index + 1);
        }
      }, TOUR_PAUSE_MS);
    });
  }, [geoProperties, cinematicFlyTo, stopTour]);

  const startTour = useCallback(() => {
    if (geoProperties.length === 0) return;
    stopTour();
    const newSessionId = tourRef.current.sessionId + 1;
    tourRef.current = { active: true, paused: false, index: 0, sessionId: newSessionId };
    setTourActive(true);
    setTourPaused(false);
    setTourIndex(0);
    runTourStep(0);
  }, [geoProperties, runTourStep, stopTour]);

  const toggleTourPause = useCallback(() => {
    if (!tourRef.current.active) return;
    const newPaused = !tourRef.current.paused;
    tourRef.current.paused = newPaused;
    setTourPaused(newPaused);

    if (!newPaused) {
      runTourStep(tourRef.current.index);
    } else {
      cancelPendingMoveEnd();
      if (tourTimerRef.current) {
        clearTimeout(tourTimerRef.current);
        tourTimerRef.current = null;
      }
    }
  }, [runTourStep, cancelPendingMoveEnd]);

  useEffect(() => {
    if (!mapContainerRef.current || geoProperties.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const bounds = new maplibregl.LngLatBounds();
    geoProperties.forEach(({ coords }) => bounds.extend(coords));
    const center = bounds.getCenter();

    const styleKey = satelliteMode ? "satellite" : "standard";
    const style = MAP_STYLES[styleKey]();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style,
      center: [center.lng, center.lat],
      zoom: globeMode ? 1.8 : 3,
      pitch: terrain3d ? 50 : 0,
      bearing: terrain3d ? -10 : 0,
      maxPitch: 85,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");

    mapRef.current = map;

    map.on("load", () => {
      if (globeMode) {
        map.setProjection({ type: "globe" });
        map.setSky({
          "sky-color": "#76b7f5",
          "sky-horizon-blend": 0.5,
          "horizon-color": "#c8e6ff",
          "horizon-fog-blend": 0.2,
          "fog-color": "#aaccee",
          "fog-ground-blend": 0.1,
        });
      }
      if (terrain3d) {
        try {
          map.addSource("terrainSource", {
            type: "raster-dem",
            tiles: ["/api/tiles/terrain/{z}/{x}/{y}"],
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
        } catch (e) {
          // Hillshade layer may already exist or source may be unavailable — safe to ignore
        }
      }

      updateMarkers(selectedId);

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          maxZoom: globeMode ? 4 : 6,
          duration: 2500,
          essential: true,
        });
      }
    });

    map.on("moveend", () => updateMarkers(selectedId));
    map.on("zoomend", () => updateMarkers(selectedId));

    return () => {
      stopTour();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [geoProperties.length, terrain3d]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const transitionId = ++styleTransitionRef.current;

    const applyModeSettings = () => {
      if (styleTransitionRef.current !== transitionId) return;

      if (globeMode) {
        map.setProjection({ type: "globe" });
        map.setSky({
          "sky-color": "#76b7f5",
          "sky-horizon-blend": 0.5,
          "horizon-color": "#c8e6ff",
          "horizon-fog-blend": 0.2,
          "fog-color": "#aaccee",
          "fog-ground-blend": 0.1,
        });
      } else {
        map.setProjection({ type: "mercator" });
      }

      if (terrain3d) {
        try {
          if (!map.getSource("terrainSource")) {
            map.addSource("terrainSource", {
              type: "raster-dem",
              tiles: ["/api/tiles/terrain/{z}/{x}/{y}"],
              encoding: "terrarium",
              tileSize: 256,
              maxzoom: 15,
            });
          }
          map.setTerrain({ source: "terrainSource", exaggeration: 1.5 });
          if (!map.getLayer("hillshading")) {
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
        } catch (e) {
          // Hillshade layer may already exist or source may be unavailable — safe to ignore
        }
      }

      updateMarkers(selectedId);
    };

    if (!map.loaded()) {
      map.once("load", applyModeSettings);
      return () => { styleTransitionRef.current++; };
    }

    const styleKey = satelliteMode ? "satellite" : "standard";
    const newStyle = MAP_STYLES[styleKey]();
    map.setStyle(newStyle);

    const onStyleLoad = () => applyModeSettings();
    map.once("style.load", onStyleLoad);

    return () => {
      styleTransitionRef.current++;
      map.off("style.load", onStyleLoad);
    };
  }, [globeMode, satelliteMode]);

  useEffect(() => {
    if (tourActive) return;

    updateMarkers(selectedId);

    if (selectedId && mapRef.current) {
      const geo = geoProperties.find(g => g.property.id === selectedId);
      if (geo) {
        mapRef.current.flyTo({
          center: geo.coords,
          zoom: Math.max(mapRef.current.getZoom(), terrain3d ? 8 : 6),
          pitch: terrain3d ? 55 : 0,
          bearing: terrain3d ? mapRef.current.getBearing() + 15 : 0,
          duration: 1800,
          essential: true,
        });

        const marker = markersRef.current.get(`prop-${selectedId}`);
        if (marker && !marker.getPopup()?.isOpen()) {
          marker.togglePopup();
        }
      }
    }
  }, [selectedId, updateMarkers, colorMode, tourActive]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (tourActive) {
          stopTour();
        }
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (geoProperties.length === 0) return;
        const currentIdx = selectedId
          ? geoProperties.findIndex(g => g.property.id === selectedId)
          : -1;
        const nextIdx = (currentIdx + 1) % geoProperties.length;
        setSelectedId(geoProperties[nextIdx].property.id);
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (geoProperties.length === 0) return;
        const currentIdx = selectedId
          ? geoProperties.findIndex(g => g.property.id === selectedId)
          : 0;
        const prevIdx = (currentIdx - 1 + geoProperties.length) % geoProperties.length;
        setSelectedId(geoProperties[prevIdx].property.id);
      }

      if (e.key === " " && tourActive) {
        e.preventDefault();
        toggleTourPause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [geoProperties, selectedId, tourActive, stopTour, toggleTourPause]);

  const handleFlyTo = useCallback((propertyId: number) => {
    const geo = geoProperties.find(g => g.property.id === propertyId);
    if (!geo) return;
    setSelectedId(propertyId);

    markersRef.current.forEach(m => {
      if (m.getPopup()?.isOpen()) m.togglePopup();
    });

    cinematicFlyTo(geo.coords, undefined, () => {
      updateMarkers(propertyId);
      const marker = markersRef.current.get(`prop-${propertyId}`);
      if (marker && !marker.getPopup()?.isOpen()) {
        marker.togglePopup();
      }
    });
  }, [geoProperties, cinematicFlyTo, updateMarkers]);

  useEffect(() => {
    flyToHandlerRef.current = handleFlyTo;
  }, [handleFlyTo]);

  const fitAll = () => {
    if (!mapRef.current || geoProperties.length === 0) return;
    stopTour();
    const bounds = new maplibregl.LngLatBounds();
    geoProperties.forEach(({ coords }) => bounds.extend(coords));
    mapRef.current.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 80 },
      maxZoom: globeMode ? 4 : 6,
      duration: 1500,
    });
    setSelectedId(null);
  };

  const countryCount = new Set(geoProperties.map(g => g.property.country)).size;

  const perfCounts = useMemo(() => {
    const counts = { strong: 0, moderate: 0, watch: 0 };
    geoProperties.forEach(({ property }) => {
      const t = getPerformanceTier(property).tier;
      counts[t as keyof typeof counts]++;
    });
    return counts;
  }, [geoProperties]);

  return (
    <AnimatedPage>
    <div data-testid="map-view" className="space-y-4">
      <style>{`
        @keyframes marker-pulse {
          0%, 100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 0 4px rgba(var(--primary-rgb,159,188,164),0.2); }
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
        .tour-progress-bar {
          transition: width 0.3s ease;
        }
      `}</style>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground" data-testid="map-view-title">
            Portfolio Map
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {geoProperties.length} {geoProperties.length === 1 ? "property" : "properties"} across {countryCount} {countryCount === 1 ? "country" : "countries"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={colorMode === "performance" ? "default" : "outline"}
            size="sm"
            onClick={() => setColorMode(colorMode === "performance" ? "market" : "performance")}
            className="flex items-center gap-1.5 text-xs"
            data-testid="button-color-mode"
          >
            {colorMode === "performance" ? "📊 Performance" : "🌍 By Market"}
          </Button>
          <Button
            variant={globeMode ? "default" : "outline"}
            size="sm"
            onClick={() => setGlobeMode(!globeMode)}
            className="flex items-center gap-1.5 text-xs"
            data-testid="button-globe-toggle"
          >
            <IconGlobe className="w-3.5 h-3.5" />
            {globeMode ? "Globe" : "Flat"}
          </Button>
          <Button
            variant={satelliteMode ? "default" : "outline"}
            size="sm"
            onClick={() => setSatelliteMode(!satelliteMode)}
            className="flex items-center gap-1.5 text-xs"
            data-testid="button-satellite-toggle"
          >
            <IconMap className="w-3.5 h-3.5" />
            {satelliteMode ? "Satellite" : "Standard"}
          </Button>
          <Button
            variant={terrain3d ? "default" : "outline"}
            size="sm"
            onClick={() => setTerrain3d(!terrain3d)}
            className="flex items-center gap-1.5 text-xs"
            data-testid="button-3d-terrain"
          >
            <IconMountain className="w-3.5 h-3.5" />
            3D Terrain
          </Button>
          <div className="w-px h-6 bg-border" />
          {!tourActive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={startTour}
              disabled={geoProperties.length === 0}
              className="flex items-center gap-1.5 text-xs"
              data-testid="button-start-tour"
            >
              <IconPlay className="w-3.5 h-3.5" />
              Tour
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTourPause}
                className="flex items-center gap-1.5 text-xs"
                data-testid="button-pause-tour"
              >
                {tourPaused ? <IconPlay className="w-3.5 h-3.5" /> : <IconPause className="w-3.5 h-3.5" />}
                {tourPaused ? "Resume" : "Pause"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={stopTour}
                className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive"
                data-testid="button-stop-tour"
              >
                Stop
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={fitAll} className="flex items-center gap-1.5 text-xs" data-testid="button-fit-all">
            <IconNavigation className="w-3.5 h-3.5" />
            Fit All
          </Button>
        </div>
      </div>

      {tourActive && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 flex items-center gap-3" data-testid="tour-progress">
          <span className="text-xs font-semibold text-primary">
            {tourPaused ? "Tour Paused" : "Touring"}
          </span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full tour-progress-bar"
              style={{ width: `${((tourIndex + 1) / geoProperties.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {tourIndex + 1} / {geoProperties.length}
          </span>
          <span className="text-[10px] text-muted-foreground">
            ESC to stop · Space to {tourPaused ? "resume" : "pause"}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-primary/20 overflow-hidden shadow-xl bg-muted relative" style={{ height: "600px" }}>
            {geoProperties.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                <IconBuilding2 className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No properties to display on map</p>
              </div>
            )}
            <div ref={mapContainerRef} className="w-full h-full" />

            {colorMode === "performance" && geoProperties.length > 0 && (
              <div className="absolute bottom-3 left-3 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border" data-testid="performance-legend">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Performance Tier</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#22C55E" }} />
                    <span className="text-[11px] text-foreground">Strong DSCR &gt; 1.5 ({perfCounts.strong})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#EAB308" }} />
                    <span className="text-[11px] text-foreground">Moderate 1.2–1.5 ({perfCounts.moderate})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#EF4444" }} />
                    <span className="text-[11px] text-foreground">Watch &lt; 1.2 ({perfCounts.watch})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-1">
            Properties ({geoProperties.length})
          </div>
          {geoProperties.map(({ property }, idx) => {
            const isSelected = selectedId === property.id;
            const isTourCurrent = tourActive && tourIndex === idx;
            const perf = getPerformanceTier(property);
            const pinColor = colorMode === "performance"
              ? perf.color
              : property.market === "North America" ? "var(--primary)" : "#3B82F6";
            const sc = statusColor(property.status);
            return (
              <div
                key={property.id}
                className={`rounded-xl border p-3.5 cursor-pointer transition-all duration-300 ${
                  isTourCurrent
                    ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30"
                    : isSelected
                    ? "border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-md"
                }`}
                onClick={() => setSelectedId(property.id)}
                data-testid={`card-property-${property.id}`}
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${pinColor}20` }}
                  >
                    <IconBuilding2 size={14} style={{ color: pinColor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-foreground truncate" data-testid={`text-name-${property.id}`}>
                      {property.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {formatLocation(property)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: sc.bg, color: sc.text }}
                  >
                    {property.status}
                  </span>
                  {colorMode === "performance" && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${perf.color}22`, color: perf.color }}
                    >
                      {perf.tier}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {property.market}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><IconBuilding2 size={11} /> {property.roomCount} rooms</span>
                  <span className="flex items-center gap-1"><IconDollarSign size={11} /> {formatMoney(property.startAdr)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlyTo(property.id);
                    }}
                    className="text-[11px] text-primary font-medium hover:underline flex items-center gap-1"
                    data-testid={`button-flyto-${property.id}`}
                  >
                    <IconNavigation size={11} />
                    Fly To
                  </button>
                  {isSelected && (
                    <Link href={`/property/${property.id}`}>
                      <span className="text-[11px] text-primary font-medium hover:underline" data-testid={`link-view-${property.id}`}>
                        View Details →
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          {unmappedCount > 0 && (
            <div className="text-[11px] text-muted-foreground/70 px-1 pt-2">
              {unmappedCount} {unmappedCount === 1 ? "property" : "properties"} not shown (missing location data)
            </div>
          )}
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
}
