---
name: variance-analysis
description: Compare baseline vs scenario projections with highlighted differences. Use when building variance analysis.
theme: light-cream
---

# Variance Analysis View

## Purpose
Side-by-side comparison of two scenarios or baseline-vs-projected with variance highlighting.

## Component
- **File**: `client/src/components/VarianceAnalysis.tsx`
- **Placement**: Scenarios page tab or standalone section

## Layout
- Scenario A selector (left) and Scenario B selector (right)
- Table rows show: Metric | Scenario A | Scenario B | Variance ($) | Variance (%)
- Color coding: green for favorable, red for unfavorable variance

## Variance Colors
| Direction | Financial Impact | Color |
|-----------|-----------------|-------|
| Higher revenue | Favorable | `accent` (sage green) |
| Lower costs | Favorable | `accent` (sage green) |
| Lower revenue | Unfavorable | `destructive` (coral) |
| Higher costs | Unfavorable | `destructive` (coral) |
| Neutral (<1%) | Immaterial | `muted-foreground` |

## Metrics Compared
Revenue, GOP, NOI, FCF, IRR, DSCR, Occupancy, ADR, Debt Service, Cap Rate

## Theme: Light Cream
- Background: `#FFF9F5`
- Table uses `FinancialTable` component
- Variance cells use colored backgrounds at 10% opacity
