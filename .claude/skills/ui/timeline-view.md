---
name: timeline-view
description: Visual timeline of property acquisitions, refinances, and milestones. Use when building the timeline page.
theme: light-cream
---

# Timeline View

## Purpose
Chronological view of portfolio events — acquisitions, refinances, renovations, milestones.

## Page
- **File**: `client/src/pages/TimelineView.tsx`
- **Route**: `/timeline`

## Layout
- Vertical timeline with center line
- Events alternate left/right
- Each event card shows: date, property name, event type, key metric

## Event Types & Colors
| Event | Icon | Color |
|-------|------|-------|
| Acquisition | Building2 | `accent` (sage) |
| Refinance | RefreshCw | `chart-3` (purple) |
| Renovation | Wrench | `chart-4` (orange) |
| Milestone | Flag | `secondary` (forest) |

## Theme: Light Cream
- Timeline line: `border` token
- Event cards: `card` with `cardBorder`
- Date badges: `accent/10` background
