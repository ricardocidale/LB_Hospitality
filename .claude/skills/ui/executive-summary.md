---
name: executive-summary
description: One-page printable executive summary with key metrics and charts. Use when building the summary page.
theme: light-cream
---

# Executive Summary Page

## Purpose
Single printable page summarizing portfolio performance for stakeholders.

## Page
- **File**: `client/src/pages/ExecutiveSummary.tsx`
- **Route**: `/executive-summary`

## Layout (print-optimized)
- Company header with logo and date
- KPI row: Total AUM, Revenue, NOI, Avg Occupancy, Portfolio IRR
- Portfolio composition pie chart
- Revenue trend line chart (10-year)
- Property summary table (name, rooms, ADR, occupancy, NOI, IRR)
- Capital structure summary

## Theme: Light Cream (print-friendly)
- White background for print
- No glass effects or gradients in print mode
- `@media print` rules strip 3D backgrounds and sidebar
- Uses `accent` and `secondary` for chart colors
