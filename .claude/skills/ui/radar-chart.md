---
name: radar-chart
description: Spider/radar chart for multi-property KPI comparison. Use when building radar visualizations.
theme: inherit
---

# Spider / Radar Chart

## Purpose
Compare multiple properties across 5-8 KPI dimensions simultaneously.

## Component
- **File**: `client/src/components/charts/RadarChart.tsx`
- **Uses**: Recharts RadarChart

## Axes (typical)
- Revenue, NOI, Occupancy, ADR, DSCR, IRR, Cap Rate, GOP Margin

## Colors
- Each property uses a chart color token (`chart-1` through `chart-5`)
- Fill opacity: 20%, stroke opacity: 80%

## Props
```typescript
interface RadarChartProps {
  properties: { name: string; metrics: Record<string, number> }[];
  dimensions: string[];
}
```
