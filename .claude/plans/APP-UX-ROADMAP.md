# App-Wide UX Roadmap

**Version**: 1.0
**Date**: 2026-03-16
**Planned by**: Claude Code Opus 4.6 (Anthropic)
**Companion to**: `UX-REDESIGN-PLAN.md` (defaults governance) and `MARCELA-ISOLATION.md`

---

## For Replit Agent

The UX Redesign Plan focused on one problem: scattered defaults. This document covers **everything else** — every workflow, every page, every user pain point identified through a comprehensive codebase audit. It's organized by priority and grouped by user journey.

Use your judgement. Ask the owner which items matter most. Not everything needs to happen at once.

---

## How This Document Is Organized

1. **Research System** — The most complex and least-understood workflow. Detailed plan.
2. **Dashboard & Portfolio** — The daily command center. Quick wins + structural improvements.
3. **Property Lifecycle** — Creating, editing, reviewing, comparing properties.
4. **Analysis & Scenarios** — Simulation tools and what-if modeling.
5. **Company & ICP** — Management company experience and ideal customer profiling.
6. **Supporting Features** — Property Finder, Map View, Exports, Help, Notifications, Rebecca.
7. **Cross-Cutting Themes** — Patterns that affect every page.

Each section has: **Current State**, **Pain Points**, **Recommendations**, **Priority**.

---

# 1. Research System

The research system is the most complex feature and the least understood by users. It generates AI-powered market analysis and benchmarks that feed directly into property assumptions. Here's how it should work.

## 1.1 Current State

**Three research types:**
- **Property Research** — Market benchmarks for a single property (ADR, occupancy, cap rate, cost rates)
- **Company Research** — Management company benchmarks (staffing, fees, overhead, competitive positioning)
- **Global/Market Research** — Macro economic trends, industry outlook, capital markets

**User touchpoints:**
- `/property/:id/research` — Property research results page (7 tabs: Market, Revenue, Financial, Operating, Rates, Sources, Criteria)
- `/company/research` — Company research page (3 groups × 5 sub-tabs)
- Research Hub page — Portfolio-wide research status + bulk generation
- Property Edit form — Research badges next to assumption fields (clickable to apply values)
- Apply Research Dialog — Bulk-apply AI-recommended values to property assumptions

**Generation flow:**
1. User clicks "Generate Research" → SSE stream opens
2. Server builds prompt from property context + admin config + market intelligence
3. Claude generates analysis using 10 deterministic tools
4. Streaming tokens display in real-time
5. On completion: values extracted, validated, persisted
6. Research badges appear on Property Edit form

## 1.2 Pain Points

### Users Don't Understand What Research Is For

**Problem:** A new user sees "Generate Research" and doesn't know what will happen, how long it takes, what the output is for, or how to use it.

**Fix:** Add a **Research Onboarding Card** on first visit to any research page:
```
┌──────────────────────────────────────────────────┐
│  🔍 What is AI Research?                         │
│                                                  │
│  Research analyzes market data and industry       │
│  benchmarks to recommend starting values for     │
│  your property assumptions (ADR, occupancy,      │
│  operating costs, cap rates).                    │
│                                                  │
│  • Takes 30-60 seconds to generate               │
│  • Uses real market data + AI analysis            │
│  • Values are suggestions — you decide what fits  │
│  • Click any badge on the Edit page to apply      │
│                                                  │
│  [Generate Research]          [Dismiss forever]   │
└──────────────────────────────────────────────────┘
```

### Research Badges Are Passive and Easily Missed

**Problem:** On Property Edit, research badges sit quietly next to fields. Many users never notice them or don't know they're clickable.

**Fix:**
- After fresh research generates, show a **banner on Property Edit**: "New research available — [Review & Apply] or [Dismiss]"
- Make badges slightly more prominent: animate pulse once on page load if research is fresher than the property's last save
- Add a **"Research Suggestions" summary card** at the top of Property Edit showing count of fields where research differs from current values

### No Clarity on What's Research-Backed vs User-Entered vs Default

**Problem:** Looking at a property's assumptions, the user can't tell which values came from research, which they typed, and which are unchanged defaults.

**Fix:** Add a subtle **provenance indicator** to each field on Property Edit:
- No indicator = user-entered value (or unchanged default)
- Small research icon = value was applied from research
- Tooltip on hover: "Applied from research on Mar 15, 2026. Research recommended: $175-$225"

Store provenance in `property.researchValues` (already exists as JSONB — extend with `appliedAt` timestamps per field).

### Research Freshness Is Too Subtle

**Problem:** The freshness badge (green/amber/red dot) is small and doesn't convey urgency. Users don't know their 6-month-old research is stale.

**Fix:**
- On Property Detail header, if research is stale: show amber banner "Market research is {X} days old — [Refresh]"
- On Dashboard, if any property has stale or missing research: show a count badge on the Research Hub link
- Consider a monthly digest email (via Resend) listing which properties need research refresh

### Bulk Generation UX Is Opaque

**Problem:** "Generate Missing Research" on Research Hub streams sequentially but doesn't show which property is currently being researched. Partial failures are toasted but not actionable.

**Fix:**
- Show a **property-by-property progress list** during bulk generation:
  ```
  ✓ Hotel Loch Sheldrake — complete (42s)
  ◉ Eden Summit Lodge — generating... (15s)
  ○ Cartagena Beach Hotel — waiting
  ○ Management Company — waiting
  ✗ Global Market — failed (retry?)
  ```
- Add per-item retry button on failure
- Show estimated time remaining based on average completion time

### Admin Research Config Is Complex and Has No Preview

**Problem:** Admin configures focus areas, regions, custom instructions, tool toggles — but has no way to preview what the research prompt will look like or test it.

**Fix:**
- Add a **"Preview Prompt"** button in Research Center that shows the assembled prompt for a sample property
- Add a **"Test Generation"** button that runs research for one property in dry-run mode (shows output but doesn't persist)

## 1.3 Research Workflow — How It Should Work

### For the User

```
1. CREATE PROPERTY → fields pre-filled from defaults

2. GENERATE RESEARCH (one click from Property Detail or Research Hub)
   → 30-60 second streaming generation
   → Real-time progress visible
   → On complete: results page with 7 tabs of analysis

3. REVIEW RESEARCH → Property Research page shows:
   → Market positioning, comp set, demand drivers
   → Recommended ADR, occupancy, cap rate with confidence scores
   → Operating cost benchmarks (USALI categories)
   → Sources cited with provenance badges

4. APPLY RESEARCH → Two ways:
   a. Click individual badges on Property Edit form (one at a time)
   b. Click "Apply Research Values" → bulk selection dialog → apply selected

5. SAVE PROPERTY → research-recommended values are now the property's values
   → Provenance tracked: "ADR set from research on Mar 15"

6. REFRESH PERIODICALLY → Research Hub shows freshness status
   → Bulk refresh with progress tracking
   → Stale research triggers banner on Property Detail
```

### For the Admin

```
1. CONFIGURE SOURCES → Admin > Research Sources (3 domain tabs)
   → Add/remove knowledge source URLs per domain
   → Mgmt Co sources, Property sources, Market sources

2. CONFIGURE LLMs → Admin > Research LLMs (3 domain tabs)
   → Primary + Secondary model per domain
   → Dual or primary-only mode

3. CONFIGURE BEHAVIOR → Admin > Research Center (existing, enhanced)
   → Per-type: enable/disable, focus areas, regions, time horizon
   → Custom instructions and questions
   → Tool enablement (which deterministic tools are active)
   → Preview prompt before deploying

4. MONITOR → Research Hub shows:
   → How many properties have fresh/stale/missing research
   → Last generation date per entity
   → Error log for failed generations
```

---

# 2. Dashboard & Portfolio

## 2.1 Dashboard Pain Points

### KPI Cards Are Not Interactive
**Problem:** The 8 KPI cards (Revenue, GOP, Active Properties, Fees, IRR, Equity Multiple, Cash-on-Cash, Exit Value) are display-only. User can't click to drill into what's driving the number.

**Recommendation:** Make each card clickable — opens a slide-out or navigates to the relevant detail:
- Revenue card → Income Statement tab
- IRR card → Investment Analysis tab
- Active Properties → Portfolio page (filtered to operating)

### No "Red Flag" System
**Problem:** If a property has negative cash flow, DSCR < 1.25x, or is losing money, the dashboard doesn't surface it. User discovers problems by accident.

**Recommendation:** Add an **Alerts Strip** below the KPI grid:
```
⚠ Eden Summit Lodge: DSCR 1.18x (below 1.25x threshold) — Year 2
⚠ Company: Cash runway ends Month 14 — increase funding
```
Clickable alerts that navigate to the relevant property/page.

### No Property Ranking
**Problem:** With 5+ properties, user can't quickly see which is the best and worst performer.

**Recommendation:** Add a **Property Scorecard** section to the overview tab — a sortable mini-table:
| Property | Year 1 NOI | IRR | DSCR | Status |
| — | — | — | — | — |
Sortable by any column. Click row → property detail.

## 2.2 Portfolio Pain Points

### No Sorting or Filtering
**Problem:** Properties are shown in acquisition date order only. Can't sort by IRR, revenue, NOI, status, or market.

**Recommendation:** Add sort dropdown (By: Acquisition Date, Revenue, NOI, IRR, Room Count, Status) and filter chips (Status: Operating/Pipeline, Market: Vermont/Cartagena).

### Property Cards Don't Show Key Financials
**Problem:** Cards show purchase price and room count — but not the metrics users care about (Year 1 revenue, NOI, IRR).

**Recommendation:** Add 2-3 key metrics to each card: Year 1 Revenue, NOI Margin, IRR. These are already computed by the engine.

### No "Clone Property" Action
**Problem:** To model a similar property, user must create from scratch and re-enter everything.

**Recommendation:** Add "Clone" to the property card action menu. Creates a copy with "(Copy)" suffix and all assumptions duplicated.

---

# 3. Property Lifecycle

## 3.1 Property Edit — Missing Guidance

**Problem:** The Property Edit form has 60+ fields across 8 sections. A new user doesn't know what values are reasonable or which fields matter most.

**Recommendations:**
- **Section descriptions:** Each accordion section should have a one-line description: "Revenue Assumptions — Starting rates and growth projections that drive top-line revenue"
- **Field-level help tooltips:** Hover (i) icon next to key fields explains: "Starting ADR is the average nightly room rate in the first month of operations. Typical range for boutique hotels: $150-$350."
- **Validation hints:** If a value is outside typical range, show amber hint (not error): "Operating cost rate of 45% is above typical range (15-30%). Verify this is intentional."

## 3.2 Property Detail — Missing Monthly View

**Problem:** All financial tables show annual data. Monthly seasonality, ramp-up patterns, and cash flow timing are hidden.

**Recommendation:** Add a toggle on each tab: "View: Annual | Monthly". Monthly view shows the 120-month projection with horizontal scroll. Initially collapsed to quarterly summaries, expandable to monthly.

## 3.3 No Inline What-If

**Problem:** To test "what if ADR is $300 instead of $250?", user must leave Property Detail, go to Property Edit, change the value, save, and return. No quick experimentation.

**Recommendation (future):** Add a **Quick Sensitivity Panel** on Property Detail — 3-4 sliders (ADR, Occupancy, Exit Cap Rate, Interest Rate) that temporarily adjust the displayed financials without saving. "Try it" mode. Save button to persist changes if desired.

---

# 4. Analysis & Scenarios

## 4.1 Sensitivity Analysis

**Problem:** Sliders are powerful but there's no guidance on what to test or what the results mean. The tornado diagram ranks variables but doesn't explain the ranking.

**Recommendations:**
- Add **pre-built scenarios**: "Conservative", "Base", "Aggressive" buttons that set all sliders to predefined positions
- Add **annotations to tornado diagram**: "ADR Growth has the highest impact because it compounds over the 10-year hold"
- Add **"Goal Seek" mode**: "What ADR growth rate achieves a 15% IRR?" — reverse-solve using the deterministic tools

## 4.2 Scenarios

**Problem:** Scenarios save/load the entire model state. Users often want to compare "just this one change" without creating a full scenario.

**Recommendations:**
- Add **"Quick Compare"**: Select a property, change one variable, see side-by-side before/after without saving a scenario
- Add **scenario tags and search**: As portfolio grows, 20+ scenarios become hard to navigate
- Add **scenario impact summary**: When comparing, show not just the diff but the impact: "Occupancy -5% → IRR drops from 14.2% to 11.8%"

## 4.3 Financing Analysis

**Pain point:** DSCR, debt yield, stress test, prepayment tabs exist but are disconnected from property-level debt decisions.

**Recommendation:** Add a link from Property Detail Cash Flow tab: "Explore financing scenarios for this property →" that pre-loads the financing analysis with this property's loan terms.

---

# 5. Company & ICP

## 5.1 Company Page — Funding Gate Is Invisible

**Problem:** The management company can't operate before SAFE funding arrives. If funding dates are wrong, the company shows zero revenue with no explanation. Users don't understand why.

**Recommendation:** When company revenue is zero due to funding gate, show an **explanatory banner**:
```
ℹ Company operations have not started.
  Operations start date: June 2026
  First funding tranche: June 2026 ($1.0M)
  Revenue will appear once both conditions are met.
  [Edit in Admin > Model Defaults]
```

## 5.2 ICP — Purpose Is Unclear

**Problem:** "Ideal Customer Profile" is hospitality industry jargon. A new user doesn't understand what it's for or how it connects to research.

**Recommendations:**
- Rename sidebar item: "Target Property Profile" or "Acquisition Criteria"
- Add explanatory header: "Define the type of property you're looking to acquire. This profile is used by AI research to generate relevant market benchmarks and investment recommendations."
- Show connection: "This profile is used when generating research for: Property Market Research, Company Research"

## 5.3 Company — No Staffing Detail

**Problem:** Company Income Statement shows "Staff Costs: $187,500" but doesn't break down how many FTEs, which tier, what salary.

**Recommendation:** Make staff costs an expandable row showing: tier applied, FTE count, salary per FTE, total. Same pattern as the property income statement expandable rows.

---

# 6. Supporting Features

## 6.1 Property Finder — No Path to Portfolio

**Problem:** User finds a property they like but can't convert it to a portfolio property. They must manually re-enter all details.

**Recommendation:** Add "Add to Portfolio" button on favorite cards that pre-fills the AddPropertyDialog with available data (name, location, price, room count).

## 6.2 Map View — No Performance Heatmap

**Problem:** Map shows property locations with DSCR-based coloring. But users might want to see ADR, occupancy, or revenue density.

**Recommendation:** Add a dropdown to switch coloring mode: DSCR (default), ADR, Occupancy, Revenue, NOI Margin. Legend updates accordingly.

## 6.3 Exports — No Bulk Export

**Problem:** To export all properties, user must visit each property detail page and export individually.

**Recommendation:** Add "Export All Properties" to Portfolio page — generates a single Excel workbook with one sheet per property, plus a consolidated sheet.

## 6.4 Help — No Search, No Glossary

**Problem:** 17 sections of text-based documentation but no search and no glossary of financial terms (GOP, IBFC, ANOI, DSCR, NOI, FF&E, USALI).

**Recommendations:**
- Add **search bar** at top of Help page with full-text search across all sections
- Add **Glossary tab** with ~50 terms: each with definition, formula, and "where to find it in the app"
- Add **context-sensitive help**: Each page header has a (?) icon linking to the relevant Help section

## 6.5 Rebecca — Scope Not Documented

**Problem:** Users don't know what Rebecca can and can't do. They ask it to create properties or run scenarios and get confused when it can't.

**Recommendation:** On first interaction, Rebecca introduces herself:
```
"I'm Rebecca, your portfolio analytics assistant. I can help you:
• Understand financial metrics and projections
• Compare properties and summarize performance
• Explain assumptions and calculation methodology
• Answer questions about the hospitality industry

I can't create, edit, or delete data. For changes, use the app directly."
```

## 6.6 Notifications — No Proactive Alerts

**Problem:** The notification system exists (alert rules, Resend email) but most users never configure it. Critical events (cash shortfall, DSCR breach) aren't automatically surfaced.

**Recommendation:** Ship with **3 default alert rules** (admin can customize):
1. DSCR < 1.25x on any property — warning email + in-app alert
2. Company cash runway < 6 months — warning email
3. Research older than 30 days — info email

---

# 7. Cross-Cutting Themes

## 7.1 No Financial Education

**Problem:** The app produces GAAP-compliant financial statements but never explains what they mean. A user who doesn't know what "GOP" stands for is lost.

**Recommendations:**
- **Inline glossary tooltips**: Hover over any financial term header (GOP, NOI, DSCR, IRR) to see definition + formula
- **"What does this mean?" links**: Next to key metrics, link to Help glossary entry
- **Benchmark context**: Next to every metric, show "Industry average: X%" so users know if their number is good or bad

## 7.2 No Undo / History

**Problem:** If a user accidentally changes an assumption, there's no undo. They must remember the old value or load a scenario.

**Recommendation (lightweight):** Track last-saved values on Property Edit. Show "Revert to last saved" button that undoes all unsaved changes. For deeper history, scenarios are the mechanism — but they should be easier to create ("Quick Save" one-click on any page).

## 7.3 Mobile Experience

**Problem:** The app has responsive layouts but financial tables, charts, and the Map View are designed for desktop. Mobile users see cramped tables and truncated charts.

**Recommendation:** For mobile:
- KPI cards stack vertically (already done)
- Tables scroll horizontally with sticky first column
- Charts resize to full-width with simplified labels
- Property Finder and Map View get simplified mobile layouts
- Export menu becomes a full-screen sheet on mobile

## 7.4 Contextual Navigation

**Problem:** Users frequently context-switch: Dashboard → Portfolio → Property → Edit → back to Property → Analysis. The path isn't always obvious.

**Recommendation:** Breadcrumbs already exist — ensure they're prominent and always show the full path: "Dashboard > Portfolio > Hotel Loch Sheldrake > Income Statement". Each breadcrumb segment is clickable.

---

# Priority Matrix

| # | Item | Effort | Impact | Priority |
|---|------|--------|--------|----------|
| 1.2 | Research onboarding card | Small | High | **P1** |
| 1.3 | Research badge prominence + banner on Edit | Small | High | **P1** |
| 2.1 | Dashboard alert strip (red flags) | Medium | High | **P1** |
| 7.1 | Glossary tooltips on financial terms | Medium | High | **P1** |
| 1.5 | Bulk generation progress list | Medium | Medium | **P2** |
| 2.1 | Interactive KPI cards | Small | Medium | **P2** |
| 2.2 | Portfolio sorting/filtering | Small | Medium | **P2** |
| 2.2 | Key metrics on property cards | Small | Medium | **P2** |
| 3.1 | Field-level help tooltips on Property Edit | Medium | Medium | **P2** |
| 5.1 | Funding gate explanation banner | Small | Medium | **P2** |
| 5.2 | ICP rename + purpose explanation | Small | Medium | **P2** |
| 6.4 | Help search + glossary tab | Medium | Medium | **P2** |
| 6.5 | Rebecca introduction message | Small | Medium | **P2** |
| 6.6 | Default alert rules (3 preset) | Medium | Medium | **P2** |
| 1.4 | Research freshness warnings (banners, emails) | Medium | Medium | **P3** |
| 1.6 | Admin prompt preview + test generation | Medium | Low | **P3** |
| 2.2 | Clone property action | Small | Medium | **P3** |
| 3.2 | Monthly view toggle on Property Detail | Large | Medium | **P3** |
| 3.3 | Quick sensitivity panel on Property Detail | Large | High | **P3** |
| 4.1 | Pre-built sensitivity scenarios | Small | Medium | **P3** |
| 4.2 | Scenario tags and search | Small | Low | **P3** |
| 4.3 | Financing link from Property Detail | Small | Low | **P3** |
| 5.3 | Expandable staffing detail on Company page | Small | Low | **P3** |
| 6.1 | Property Finder "Add to Portfolio" | Medium | Medium | **P3** |
| 6.2 | Map View performance heatmap modes | Medium | Low | **P3** |
| 6.3 | Bulk export all properties | Medium | Medium | **P3** |
| 7.2 | Undo / revert on Property Edit | Medium | Medium | **P3** |
| 7.3 | Mobile table/chart optimization | Large | Medium | **P4** |
| 7.4 | Breadcrumb improvements | Small | Low | **P4** |
| 4.1 | Goal Seek / reverse-solve | Large | High | **P4** |
| 4.2 | Scenario impact quantification | Medium | Medium | **P4** |

---

*This document complements the UX Redesign Plan (defaults governance) and Marcela Isolation Plan. Together they cover the complete app experience. Prioritize P1 items for immediate implementation alongside the defaults redesign.*
