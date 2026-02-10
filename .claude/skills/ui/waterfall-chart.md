---
name: waterfall-chart
description: Waterfall chart for NOI-to-FCF bridge or revenue breakdowns. Use when building waterfall visualizations.
theme: inherit
---

# Waterfall Chart

## Purpose
Shows step-by-step breakdown from one financial total to another (e.g., Revenue → GOP → NOI → FCF).

## Component
- **File**: `client/src/components/charts/WaterfallChart.tsx`
- **Uses**: Recharts BarChart with stacked invisible + visible bars

## Color Convention
- Positive steps: `accent` (sage green)
- Negative steps: `destructive` (coral/red)
- Totals: `secondary` (forest green)
- Connector lines: `border` token

## Props
```typescript
interface WaterfallStep {
  label: string;
  value: number;
  isTotal?: boolean;
}
interface WaterfallChartProps {
  steps: WaterfallStep[];
  title: string;
  formatValue: (v: number) => string;
}
```
