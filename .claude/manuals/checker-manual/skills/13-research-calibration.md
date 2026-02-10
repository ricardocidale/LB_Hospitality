# Chapter 13: AI Research & Assumption Calibration

## Overview

The platform includes three AI-powered research tools designed to help users calibrate financial assumptions with market-informed data. These tools produce standardized market analysis reports that recommend value ranges for key assumption fields, grounding the model in current market conditions rather than relying solely on default values or professional judgment.

---

## Three Research Modes

| Research Mode | Scope | Trigger Location | Primary Use Case |
|---------------|-------|-------------------|-----------------|
| **Property Market Research** | Per-property local market analysis | Property Edit page → "Market Research" button | Calibrate ADR, occupancy ramp, cap rate, and catering boost assumptions for a specific property in a specific market |
| **Company Research** | Management company benchmarking | Company page → "Company Research" button | Benchmark management fee structures, staffing ratios, and operating cost profiles against comparable boutique hotel operators |
| **Global Market Research** | Industry-wide hospitality trends | Global/Settings area → "Global Research" button | Inform macro assumptions such as inflation rate, RevPAR growth trajectories, and industry cap rate trends |

---

## Research Output

The AI produces structured analysis covering several key areas:

**Market Overview** includes tourism volume, hotel supply, demand trends, and RevPAR data for general market context.

**ADR Analysis** provides a recommended ADR range, comparable property ADRs, and market averages, mapping directly to the property's starting ADR assumption.

**Occupancy Analysis** includes stabilized occupancy ranges, ramp-up timelines, and seasonal breakdowns, mapping to starting occupancy, maximum occupancy, and occupancy ramp months.

**Cap Rate Analysis** provides a recommended cap rate range, transaction comparables, and risk factors, mapping to the property's exit cap rate.

**Catering Analysis** includes recommended boost percentages and F&B revenue uplift rationale, mapping to the property's catering boost percentage.

---

## Research-to-Assumption Integration

On the Property Edit page, research recommendations are displayed inline alongside the corresponding assumption fields. Users can view the AI-recommended range (for example, ADR: $450–$650), click to auto-apply the midpoint value to the assumption field, or override with their own judgment.

The following assumption fields display research recommendations when available:

| Assumption Field | Example Display |
|-----------------|-----------------|
| Starting ADR | "$450–$650 (AI)" |
| Maximum Occupancy | "72%–85% (AI)" |
| Exit Cap Rate | "5.5%–7.0% (AI)" |
| Catering Boost % | "15%–25% (AI)" |

---

## Auto-Refresh on Login

The system automatically refreshes stale market research when a user logs in. Research older than 7 days is regenerated. A progress overlay shows the property names being processed and a completion percentage. This refresh is triggered once per browser session and uses session storage to prevent re-triggering during the same session. Properties with fresh research (less than 7 days old) are skipped.

---

## GAAP-Standardized Assumptions

Some assumptions are regulated by authoritative standards and are not subjective estimates. The checker should be aware that these fields have narrow, well-documented ranges and should flag any values outside the standard ranges as requiring justification.

| Assumption | Authority | Standard Value | Variability |
|------------|-----------|---------------|-------------|
| Depreciation Period | IRS Publication 946 / ASC 360 | 27.5 years | Fixed — tax law for residential rental property |
| Days Per Month | Industry convention | 30.5 days (365 ÷ 12) | Fixed — universal hospitality standard |
| Amortization Terms | Market convention | 20–30 years | Low — standard commercial mortgage terms |
| Closing Costs | Market convention | 1–3% of loan amount | Low — fees, legal, appraisal, title |
| Broker Commission | Market practice | 4–6% of sale price | Low — industry standard range |
| Inflation Rate | Federal Reserve target | ~2% annually | Moderate — CPI-based, Fed target is 2% |

---

## Verification Notes for Checkers

| Check | What to Verify |
|-------|---------------|
| Research-to-assumption alignment | Confirm that AI-recommended ranges are reasonable for the property's market and positioning |
| Midpoint application | Click the research recommendation → verify that the midpoint value is correctly computed and applied to the assumption field |
| No stale research | If property location or market changes, old research should be re-run; verify that outdated research does not persist |
| Assumption override | After applying research values, manually override → verify the override takes precedence in all downstream calculations |
| Response completeness | Confirm the AI response includes all required sections (market overview, ADR analysis, occupancy analysis, cap rate analysis) |
| Boundary values | Check that research recommendations fall within the model's valid input ranges (e.g., occupancy 0%–100%, cap rate > 0%) |
| Auto-refresh freshness | Log in → verify only properties with research older than 7 days are refreshed |
| Session persistence | Refreshing the page does not re-trigger the auto-refresh; closing the browser tab and re-logging in does trigger a new freshness check |

The purpose of these research tools for the checker is to verify that research recommendations align with the assumption ranges used in the model and that applying research values produces expected downstream financial results.
