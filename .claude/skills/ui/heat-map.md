---
name: heat-map
description: Color-coded grid showing property performance across time periods. Use when building heat map visualizations.
theme: inherit
---

# Heat Map View

## Purpose
Color-coded grid showing property KPIs across months or years. Quickly identify high/low performance periods.

## Component
- **File**: `client/src/components/charts/HeatMap.tsx`
- **Placement**: Dashboard or Portfolio as a tab

## Color Scale
Uses theme accent tokens with opacity gradients:
- Low: `destructive/20` → `destructive/60`
- Mid: `muted/30`
- High: `accent/20` → `accent/80`

## Props
```typescript
interface HeatMapProps {
  data: { label: string; periods: number[] }[];
  periodLabels: string[];
  metric: 'revenue' | 'noi' | 'occupancy' | 'adr';
  formatValue: (v: number) => string;
}
```

## Interaction
- Hover shows tooltip with exact value
- Click cell navigates to property detail for that period
