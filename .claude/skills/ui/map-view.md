---
name: map-view
description: Map view plotting properties by geographic location. Use when building the map page.
theme: light-cream
---

# Map View

## Purpose
Visual geographic display of all portfolio properties on an interactive map.

## Page
- **File**: `client/src/pages/MapView.tsx`
- **Route**: `/map`

## Implementation
- Uses Leaflet (react-leaflet) with OpenStreetMap tiles (free, no API key)
- Property markers use sage green pins with property name labels
- Click marker to see property summary card
- Card links to property detail page

## Data
- Properties need lat/lng fields (optional — fallback to city/state geocoding)
- Marker color reflects performance (green = healthy, amber = watch, red = distressed)

## Theme: Light Cream
- Page background: `#FFF9F5`
- Map container: rounded corners with `border` token
- Summary cards: standard `card` tokens
