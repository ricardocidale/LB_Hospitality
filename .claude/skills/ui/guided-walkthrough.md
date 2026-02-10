---
name: guided-walkthrough
description: First-time user tour with tooltip-based step guidance. Use when building onboarding tours.
theme: inherit
---

# Guided Walkthrough

## Purpose
Step-by-step interactive tour for first-time users highlighting key features.

## Implementation
- Lightweight overlay with highlighted elements and tooltip popovers
- Steps stored in a static array
- Progress tracked in localStorage (`walkthrough_completed`)
- Trigger: First login or "Take Tour" button in Settings

## Tour Steps (typical)
1. Sidebar navigation overview
2. Dashboard KPI cards
3. Portfolio property list
4. Property detail financials
5. Assumptions editor
6. Export menu
7. Research tab
8. Command palette (Ctrl+K)

## Tooltip Style
- Uses theme `card` background with `accent` border highlight
- Arrow pointing to highlighted element
- "Next" / "Skip" buttons using GlassButton
- Step counter: "3 of 8"

## Highlight Overlay
- Full-screen semi-transparent overlay
- Cut-out around target element with `accent/30` glow ring
