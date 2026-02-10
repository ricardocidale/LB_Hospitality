---
name: activity-feed
description: Recent activity feed showing assumption changes, scenario runs, exports. Use when building the activity feed.
theme: inherit
---

# Activity Feed

## Purpose
Shows recent user actions and system events in chronological order.

## Storage
- Zustand store `useActivityStore`
- Persisted to localStorage (last 50 events)
- Shape: `{ events: ActivityEvent[] }`

## Event Types
| Type | Icon | Example |
|------|------|---------|
| assumption_change | Sliders | "Updated ADR growth to 3.5%" |
| scenario_run | Play | "Ran Scenario 3" |
| export | Download | "Exported Portfolio Excel" |
| property_add | Plus | "Added Beachfront Resort" |
| research_refresh | RefreshCw | "Refreshed market data" |
| verification | CheckCircle | "Verification: UNQUALIFIED" |

## Placement
- Dashboard sidebar widget or dedicated section
- Notification center can link to full activity feed
