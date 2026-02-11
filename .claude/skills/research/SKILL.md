# Research System — Master Skill

## Purpose

The research system provides industry-backed financial guidance for every property assumption in the simulation. It operates as a **3-tier data pipeline** that produces `{ display, mid, source }` entries displayed as amber "Research" badges next to editable fields.

## Asset Type Agnosticism

The platform's asset type is **not hardcoded**. It is stored in `globalAssumptions.propertyLabel` (default: `"Boutique Hotel"`). All research skills, AI prompts, seed profiles, and UI labels must reference the property label dynamically — never assume "boutique hotel" as a fixed term.

When generating AI research prompts, always include the current `propertyLabel` so the AI calibrates its analysis to the correct asset class (e.g., "Boutique Hotel", "Eco-Lodge", "Luxury Resort", "Serviced Apartment").

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PropertyEdit.tsx                          │
│  researchValues = DB seed → AI overlay → generic fallback   │
│  ResearchBadge shows { display } text, onClick applies mid  │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
    ┌──────────▼──────────┐    ┌──────────▼──────────┐
    │  property.research  │    │  market_research     │
    │  Values (JSONB col) │    │  table (AI content)  │
    │  source = 'seed'    │    │  Parsed → source='ai'│
    └──────────┬──────────┘    └──────────┬──────────┘
               │                          │
    ┌──────────▼──────────┐    ┌──────────▼──────────┐
    │  researchSeeds.ts   │    │  aiResearch.ts       │
    │  25+ regional       │    │  LLM tool-calling    │
    │  profiles            │    │  per-property        │
    └─────────────────────┘    └──────────────────────┘
```

## 3-Tier Data Source Hierarchy

### Tier 1: Location-Aware Database Seeds (source = `'seed'`)

- **File**: `server/researchSeeds.ts`
- **When**: Automatically generated at property creation; backfilled during seed operations
- **How**: Pattern matches property location fields against 25+ regional profiles
- **Data**: 25 research keys per property (ADR, occupancy, cap rate, all cost categories, fees, tax)
- **Schema**: Stored in `properties.research_values` JSONB column
- **Type**: `Record<string, { display: string; mid: number; source: 'seed' | 'ai' | 'none' }>`

### Tier 2: AI-Generated Research (source = `'ai'`)

- **File**: `server/aiResearch.ts`
- **When**: Triggered manually via "Run Research" button or auto-refresh on login (7-day staleness)
- **How**: LLM tool-calling with structured output schemas (see individual analysis skills)
- **Data**: Stored in `market_research` table as JSON `content` column
- **Override**: When AI research exists, its values overlay seed values on the frontend

### Tier 3: Generic Fallback (no source tag)

- **File**: Hardcoded in `PropertyEdit.tsx` as `GENERIC_DEFAULTS`
- **When**: Only if the property has no `researchValues` column AND no AI research
- **Data**: National US averages (ADR $193, Occupancy 69%, Cap Rate 8.5%)
- **Sources**: CBRE Trends 2024-2025, Highland Group Boutique Hotel Report 2025, STR/CoStar, HVS

## Data Flow

### Property Creation

1. User creates property with location fields
2. `POST /api/properties` calls `generateLocationAwareResearchValues(locationCtx)`
3. Research values stored in `properties.research_values` JSONB column
4. Frontend reads `property.researchValues` immediately — badges appear with seed data

### Seed / Backfill

1. `POST /api/admin/seed-data` creates properties with research values
2. For existing properties missing `research_values`, backfill loop generates and saves them
3. Uses same `generateLocationAwareResearchValues()` function

### AI Research Override

1. User clicks "Run Research" or login auto-refresh fires
2. `POST /api/market-research/property/:id/generate` triggers LLM analysis
3. AI results stored in `market_research` table
4. Frontend `PropertyEdit.tsx` parses AI content, overlays on seed defaults
5. AI values get `source: 'ai'` tag in the merged research object

### Frontend Merge Logic (PropertyEdit.tsx)

```typescript
const baseDefaults = { ...GENERIC_DEFAULTS };
if (property.researchValues) {
  for (const [key, val] of Object.entries(property.researchValues)) {
    if (val.source !== 'none') baseDefaults[key] = val;
  }
}
if (research?.content) {
  // Parse AI content → overlay with source: 'ai'
}
return merged;
```

## Research Value Keys (25 total)

| Key | Display Format | Badge Location | Calculation Base |
|-----|---------------|----------------|------------------|
| `adr` | `$280–$450` | Starting ADR | — |
| `occupancy` | `70%–82%` | Max Occupancy | — |
| `startOccupancy` | `30%–45%` | Initial Occupancy | — |
| `rampMonths` | `12–24 mo` | Ramp-Up Months | — |
| `capRate` | `6.5%–8.5%` | Exit Cap Rate | — |
| `catering` | `25%–35%` | Catering Boost % | — |
| `landValue` | `15%–25%` | Land Value Allocation | — |
| `costHousekeeping` | `15%–22%` | Housekeeping | Room Revenue |
| `costFB` | `7%–12%` | F&B Cost of Sales | Room Revenue |
| `costAdmin` | `4%–7%` | Admin & General | Total Revenue |
| `costPropertyOps` | `3%–5%` | Property Ops | Total Revenue |
| `costUtilities` | `2.9%–4.0%` | Utilities | Total Revenue |
| `costFFE` | `3%–5%` | FF&E Reserve | Total Revenue |
| `costMarketing` | `1%–3%` | Marketing | Total Revenue |
| `costIT` | `0.5%–1.5%` | IT | Total Revenue |
| `costOther` | `3%–6%` | Other Expenses | Total Revenue |
| `costInsurance` | `0.3%–0.5%` | Insurance | Property Value |
| `costPropertyTaxes` | `1.0%–2.5%` | Property Taxes | Property Value |
| `svcFeeMarketing` | `0.5%–1.5%` | Svc Fee: Marketing | Total Revenue |
| `svcFeeIT` | `0.3%–0.8%` | Svc Fee: IT | Total Revenue |
| `svcFeeAccounting` | `0.5%–1.5%` | Svc Fee: Accounting | Total Revenue |
| `svcFeeReservations` | `1.0%–2.0%` | Svc Fee: Reservations | Total Revenue |
| `svcFeeGeneralMgmt` | `0.7%–1.2%` | Svc Fee: General Mgmt | Total Revenue |
| `incentiveFee` | `8%–12%` | Incentive Fee | GOP |
| `incomeTax` | `24%–28%` | Income Tax Rate | Taxable Income |

## Source Tracking

| `source` value | Meaning | Badge behavior |
|----------------|---------|----------------|
| `'seed'` | Location-aware database default | Badge shown with seeded range |
| `'ai'` | AI research override | Badge shown with AI-recommended range |
| `'none'` | Explicitly hidden | Badge hidden (component returns null) |

## Industry Data Sources

| Source | Used For | Citation |
|--------|----------|----------|
| CBRE Trends 2024-2025 | Utilities (2.9-4.0%), labor trends, cap rates | Operating costs, cap rates |
| Highland Group Boutique Hotel Report 2025 | ADR ($193 national avg), upscale segment benchmarks | ADR, occupancy |
| HVS | Cap rates (8.0-9.5%), management fees (2-4% + 8-12% incentive) | Fees, cap rates |
| STR / CoStar | National occupancy (69%), RevPAR trends | Occupancy, ADR |
| USALI | Departmental cost structure, calculation bases | All operating costs |
| IRS Publication 946 | 27.5-year depreciation, land allocation | Land value, depreciation |

## Key Files

| File | Purpose |
|------|---------|
| `server/researchSeeds.ts` | 25+ regional profiles, location detection, seed generation |
| `server/aiResearch.ts` | LLM-powered research with tool-calling |
| `server/routes.ts` | Seed endpoints, property creation, backfill logic |
| `client/src/pages/PropertyEdit.tsx` | Frontend merge logic, badge rendering |
| `client/src/components/ui/research-badge.tsx` | ResearchBadge component |
| `shared/schema.ts` | `ResearchValueEntry` type, `researchValues` JSONB column |

## Sub-Skills (Analysis Modules)

Each AI research module has its own skill file with tool schema:

| Skill | Directory | Analyzes |
|-------|-----------|----------|
| Market Overview | `research/market-overview/` | Local market conditions, supply/demand |
| ADR Analysis | `research/adr-analysis/` | Average daily rate benchmarking |
| Occupancy Analysis | `research/occupancy-analysis/` | Occupancy patterns, ramp-up |
| Cap Rate Analysis | `research/cap-rate-analysis/` | Investment cap rates |
| Catering Analysis | `research/catering-analysis/` | F&B and event revenue uplift |
| Competitive Set | `research/competitive-set/` | Comparable property analysis |
| Event Demand | `research/event-demand/` | Event revenue potential |
| Land Value | `research/land-value/` | IRS land allocation for depreciation |
| Operating Costs | `research/operating-costs/` | USALI-based cost benchmarking |
| Property Value Costs | `research/property-value-costs/` | Insurance and property taxes |
| Management Service Fees | `research/management-service-fees/` | 5-category service fees + incentive |
| Income Tax | `research/income-tax/` | SPV entity tax rates |
| Company Research | `research/company-research/` | Management company benchmarks |
| Global Research | `research/global-research/` | Industry-wide trends |
| Auto-Refresh | `research/auto-refresh/` | Login-triggered staleness check |
| Location-Aware Seeding | `research/location-aware-seeding/` | Database seed profiles |

## Rules

1. **Never hardcode "boutique hotel"** — always reference `globalAssumptions.propertyLabel`
2. **Calculations trump research** — research badges are guidance, not calculations. The 963-test proof system takes absolute priority.
3. **Source tracking is mandatory** — every research value must have a `source` field (`'seed'`, `'ai'`, or `'none'`)
4. **Seed values are location-aware** — generic national averages are the fallback of last resort
5. **AI overrides seed** — when AI research runs, its values take precedence over seed defaults
6. **Badge hides when source='none'** — the ResearchBadge component returns null for falsy values
7. **Cost bases must be correct** — different costs have different bases (Room Revenue, Total Revenue, Property Value). Research values must specify the correct base.
