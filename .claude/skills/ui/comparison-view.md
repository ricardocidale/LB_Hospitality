---
name: comparison-view
description: Side-by-side property comparison with synced scrolling. Use when building the comparison page.
theme: light-cream
---

# Comparison View

## Purpose
Compare 2-4 properties side-by-side across all financial metrics with synchronized scrolling.

## Page
- **File**: `client/src/pages/ComparisonView.tsx`
- **Route**: `/compare`

## Layout
- Property selector at top (multi-select dropdown, max 4)
- Synced vertical scroll across all columns
- Sticky property name headers
- Rows: Revenue, GOP, NOI, FCF, IRR, DSCR, Occupancy, ADR, etc.

## Theme: Light Cream
- Background: `#FFF9F5`
- Column headers: teal header gradient per property
- Data rows: alternating `muted/10` stripes
- Highlight best/worst values with `accent` / `destructive` backgrounds
