---
name: inline-editing
description: Click-to-edit values directly in financial tables. Use when building inline editing capabilities.
theme: inherit
---

# Inline Cell Editing

## Purpose
Click any editable cell in a financial table to modify the value directly, with instant recalculation.

## Behavior
1. User clicks an editable cell
2. Cell transforms to an input field with current value
3. User modifies value, presses Enter or clicks away
4. Value saves, financial engine recalculates, table updates

## Editable vs Read-Only
- **Editable**: Assumption inputs (ADR, occupancy, growth rates, cost rates)
- **Read-Only**: Calculated outputs (revenue, NOI, FCF, totals)
- Editable cells show a subtle pencil icon on hover

## Cell States
| State | Style |
|-------|-------|
| Default | Normal table cell |
| Hover (editable) | `bg-accent/5` with pencil icon |
| Editing | Input field with `ring-2 ring-accent` |
| Changed (unsaved) | `bg-amber-50` indicator dot |
| Saved | Brief green flash animation |

## Integration
- Extends `FinancialTable` component with `editable` prop
- Uses optimistic updates via TanStack Query mutation
- Debounced save (300ms after last keystroke)
