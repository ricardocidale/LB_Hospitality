# 13 — AI Research & Assumption Calibration

## Overview

The platform includes three AI-powered research tools designed to help users calibrate financial assumptions with market-informed data. These tools leverage Claude (Anthropic) with a structured skills/tools architecture to produce standardized market analysis reports.

---

## Three Research Modes

| Research Mode | Scope | Trigger Location | Primary Use Case |
|---------------|-------|-------------------|-----------------|
| **Property Market Research** | Per-property local market analysis | Property Edit page → "Market Research" button | Calibrate ADR, occupancy ramp, cap rate, and catering boost assumptions for a specific property in a specific market |
| **Company Research** | Management company benchmarking | Company page → "Company Research" button | Benchmark management fee structures, staffing ratios, and operating cost profiles against comparable boutique hotel operators |
| **Global Market Research** | Industry-wide hospitality trends | Global/Settings area → "Global Research" button | Inform macro assumptions such as inflation rate, RevPAR growth trajectories, and industry cap rate trends |

---

## AI Architecture: Skills + Tools

The research system uses a two-layer architecture:

### Skills Layer (System Instructions)

| Skill File | Location | Purpose |
|------------|----------|---------|
| `property-market-research.md` | `.claude/skills/research/` | Guides Claude to analyze the local hotel market for a specific property — ADR comps, occupancy benchmarks, cap rate ranges, event demand, catering potential |
| `company-research.md` | `.claude/skills/research/` | Instructs Claude to evaluate comparable management companies — fee structures, AUM, staffing models, market positioning |
| `global-research.md` | `.claude/skills/research/` | Directs Claude to assess broader hospitality industry trends — macroeconomic drivers, tourism forecasts, capital markets sentiment |

### Tools Layer (Function Schemas)

Tool definitions are stored in `.claude/tools/` as JSON files defining callable function schemas:

| Tool Name | Input Parameters | Output |
|-----------|-----------------|--------|
| `analyze-market` | `location`, `market_region`, `property_type`, `room_count` | Market overview with supply/demand metrics, tourism volume, RevPAR data |
| `analyze-adr` | `location`, `current_adr`, `room_count`, `property_level`, `has_fb`, `has_events`, `has_wellness` | Comparable property ADRs, recommended ADR range, market average |
| `analyze-occupancy` | `location`, `room_count`, `target_occupancy`, `property_level` | Seasonal patterns, stabilized occupancy benchmarks, ramp-up timeline |
| `analyze-cap-rate` | `location`, `property_type`, `current_cap_rate` | Market cap rate range, transaction comps, risk-adjusted recommendation |
| `analyze-event-demand` | `location`, `event_locations`, `max_event_capacity`, `has_wellness`, `privacy_level` | Event demand drivers, pricing benchmarks, seasonal booking patterns |
| `analyze-catering` | `location`, `has_fb`, `room_count`, `event_locations` | F&B revenue uplift potential, catering boost percentage recommendation |

---

## Output Schema

The AI produces a structured JSON response conforming to the following schema sections:

| Section | Key Fields | Maps to Assumption |
|---------|-----------|-------------------|
| `marketOverview` | Tourism volume, hotel supply, demand trends, RevPAR | General market context (no direct assumption mapping) |
| `adrAnalysis` | `recommendedRange`, comparable ADRs, market average | `startAdr` on the property |
| `occupancyAnalysis` | Stabilized occupancy range, `rampUpTimeline`, seasonal breakdown | `startOccupancy`, `maxOccupancy`, `occupancyRampMonths` |
| `capRateAnalysis` | `recommendedRange`, transaction comps, risk factors | `exitCapRate` on the property |
| `cateringAnalysis` | `recommendedBoostPercent`, F&B uplift rationale | `cateringBoostPercent` on the property |

---

## Research → Assumption Integration

On the Property Edit page, research recommendations are displayed inline alongside the corresponding assumption fields via **ResearchBadge** components. Users can:

1. View the AI-recommended range (e.g., ADR: $450–$650)
2. Click to auto-apply the midpoint value to the assumption field
3. Override with their own judgment

| Assumption Field | Research Section | Badge Display |
|-----------------|-----------------|---------------|
| Start ADR | `adrAnalysis.recommendedRange` | "$450–$650 (AI)" |
| Max Occupancy | `occupancyAnalysis.rampUpTimeline` | "72%–85% (AI)" |
| Exit Cap Rate | `capRateAnalysis.recommendedRange` | "5.5%–7.0% (AI)" |
| Catering Boost % | `cateringAnalysis.recommendedBoostPercent` | "15%–25% (AI)" |

---

## Verification Notes for Checkers

| Check | What to Verify |
|-------|---------------|
| Research-to-assumption alignment | Confirm that AI-recommended ranges are reasonable for the property's market and positioning |
| Midpoint application | Click the research badge → verify that the midpoint value is correctly computed and applied to the assumption field |
| No stale research | If property location or market changes, old research should be re-run; verify that outdated research does not persist |
| Assumption override | After applying research values, manually override → verify the override takes precedence in all downstream calculations |
| Schema completeness | Confirm the AI response includes all required sections (`marketOverview`, `adrAnalysis`, `occupancyAnalysis`, `capRateAnalysis`) |
| Boundary values | Check that research recommendations fall within the model's valid input ranges (e.g., occupancy 0%–100%, cap rate > 0%) |

> **Purpose for the Checker:** These tools help users determine realistic input values for their assumptions. The checker should verify that research recommendations align with the assumption ranges used in the model and that applying research values produces expected downstream financial results.
