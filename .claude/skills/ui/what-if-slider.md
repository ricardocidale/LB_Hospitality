---
name: what-if-slider
description: Slide assumptions and see projections update in real-time. Use when building the what-if panel.
theme: light-cream
---

# What-If Slider Panel

## Purpose
Adjustable sliders for key assumptions with real-time projection updates. Enables rapid sensitivity exploration.

## Component
- **File**: `client/src/components/WhatIfPanel.tsx`
- **Placement**: Collapsible side panel or drawer on property/portfolio pages

## Sliders (typical)
| Assumption | Range | Step | Default Source |
|-----------|-------|------|---------------|
| ADR Growth | 0-10% | 0.1% | Property assumption |
| Occupancy | 40-100% | 1% | Property assumption |
| Cost Escalation | 0-8% | 0.1% | Global assumption |
| Cap Rate | 3-12% | 0.25% | Property assumption |
| LTV | 0-80% | 1% | Property assumption |
| Interest Rate | 2-10% | 0.125% | Property assumption |

## Behavior
- Slider changes trigger financial engine recalculation
- Charts and KPIs update in real-time (debounced 150ms)
- "Reset" button restores original values
- "Save as Scenario" button persists the what-if as a named scenario

## Theme: Light Cream
- Panel background: `card` token
- Slider track: `muted`
- Slider thumb: `accent` (sage green)
- Value labels: `font-mono tabular-nums`
