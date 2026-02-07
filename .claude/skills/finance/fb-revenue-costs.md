# F&B Revenue & Costs Skill

This skill documents the rules, formulas, and constraints governing Food & Beverage (F&B) revenue and cost calculations in the financial model.

## Core Principle

All revenue categories in this model are expressed as **percentages of Room Revenue**, not percentages of total revenue. This is critical for AI research, financial engine calculations, and data entry.

## Revenue Architecture

### Revenue Categories (all as % of Room Revenue)

| Category | Schema Field | Default | Description |
|----------|-------------|---------|-------------|
| Room Revenue | (base) | 100% | ADR × Occupancy × 30.5 days |
| F&B Revenue | `revShareFB` | 22% | Base food & beverage share |
| Event Revenue | `revShareEvents` | 43% | Events, conferences, retreats |
| Other Revenue | `revShareOther` | 7% | Spa, parking, sundries |

### Catering Boost

The **catering boost** is an additional uplift applied to base F&B revenue, representing the blended effect of catered events (weddings, corporate dinners, retreat meal programs) across all event types.

**Schema field:** `cateringBoostPercent` (per property)
**Default:** 30% (but should be set per property based on AI market research)
**Constant:** `DEFAULT_CATERING_BOOST_PCT` in `client/src/lib/constants.ts`

## Formulas

### F&B Revenue Calculation

```
Base F&B = Room Revenue × revShareFB
Catering Uplift = Base F&B × cateringBoostPercent
Total F&B Revenue = Base F&B × (1 + cateringBoostPercent)
```

**Example:**
- Room Revenue = $100,000/month
- revShareFB = 22% → Base F&B = $22,000
- cateringBoostPercent = 30% → Catering Uplift = $6,600
- Total F&B = $22,000 × 1.30 = $28,600

### F&B Cost Calculation

```
F&B Expense = Total F&B Revenue × costRateFB
```

**Schema field:** `costRateFB` (per property)
**Default:** 15% (of F&B revenue)
**Constant:** `DEFAULT_COST_RATE_FB` in `client/src/lib/constants.ts`

### Total Revenue Composition

```
Total Revenue = Room Revenue + Total F&B Revenue + Event Revenue + Other Revenue
             = Room Revenue × (1 + revShareFB × (1 + cateringBoostPercent) + revShareEvents + revShareOther)
```

## Financial Engine Implementation

Located in `client/src/lib/financialEngine.ts`:

```typescript
const cateringBoostPct = property.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT;
const cateringBoostMultiplier = 1 + cateringBoostPct;
const baseMonthlyFBRev = baseMonthlyRoomRev * revShareFB * cateringBoostMultiplier;
```

The catering boost multiplier is applied in two places:
1. **Monthly ramp-up period**: `baseMonthlyFBRev` calculation
2. **Post-stabilization period**: `revenueFB = baseFB * cateringBoostMultiplier`

## Rules & Constraints

### 1. Property-Level Only
The catering boost is defined **per property**, not systemwide. There are no global catering assumptions. Each property's market research determines its appropriate boost.

### 2. Research-Driven Values
Catering boost values should come from AI market research for each property. The `analyze_catering` tool in `.claude/tools/analyze-catering.json` and its handler in `server/aiResearch.ts` are responsible for generating market-specific recommendations.

### 3. Percentage-of-Room-Revenue Conversion
When AI research or market data provides total revenue breakdowns (e.g., "F&B is 35% of total revenue"), it must be converted:

```
If total revenue splits are:
  Rooms = 55% of total
  F&B = 30% of total

Then F&B as % of room revenue = 30/55 ≈ 54.5%
Since base revShareFB = 22%, the implied catering boost = (54.5 - 22) / 22 ≈ 148%

This would be unreasonably high, suggesting the market data includes
event catering as part of F&B. Adjust accordingly.
```

### 4. Typical Ranges

| Property Type | Catering Boost Range | Key Driver |
|--------------|---------------------|------------|
| Urban boutique, strong local dining scene | 15% - 25% | Guests dine off-site frequently |
| Suburban/rural estate, moderate events | 25% - 35% | Mixed catering penetration |
| Mountain/resort, full-catering capable | 30% - 45% | Multi-day retreats, limited alternatives |
| Remote estate, wedding destination | 35% - 50% | High full-catering penetration |

### 5. Event Mix Breakdown
Research should provide the event mix that drives the boost:
- **Fully catered** (weddings, galas, corporate dinners with all meals)
- **Partially catered** (retreats with some meals, meetings with lunch)
- **No catering** (room-only bookings, self-catered gatherings)

### 6. Cost Rate Independence
The `costRateFB` (default 15%) applies to **Total F&B Revenue** (after catering boost). It does not change based on the catering boost percentage. The cost rate represents the blended cost-of-goods for all F&B operations.

## Data Flow

```
AI Research (analyze_catering tool)
  → cateringAnalysis.recommendedBoostPercent in research output
  → User reviews on Property Market Research page
  → User adjusts cateringBoostPercent in Property Edit page
  → Financial Engine uses value for monthly projections
  → Income Statement, Cash Flow, Balance Sheet reflect F&B revenue
```

## Schema Reference

### Properties Table (`shared/schema.ts`)
```typescript
cateringBoostPercent: real("catering_boost_percent").notNull().default(0.30)
```

### Constants (`client/src/lib/constants.ts`)
```typescript
DEFAULT_REV_SHARE_FB = 0.22      // Base F&B as % of room revenue
DEFAULT_CATERING_BOOST_PCT = 0.30 // Default catering uplift
DEFAULT_COST_RATE_FB = 0.15       // F&B cost rate
```

## Files That Use F&B Logic

| File | Role |
|------|------|
| `client/src/lib/financialEngine.ts` | Core calculation engine |
| `client/src/lib/constants.ts` | Default values |
| `client/src/pages/PropertyEdit.tsx` | User edits catering boost |
| `client/src/pages/Portfolio.tsx` | Displays property catering boost |
| `server/calculationChecker.ts` | Validates F&B calculations |
| `server/aiResearch.ts` | AI research tool handler |
| `.claude/tools/analyze-catering.json` | Tool definition for AI |
| `.claude/skills/research/property-market-research.md` | Research output schema |
| `client/src/pages/PropertyMarketResearch.tsx` | Displays catering research |
| `client/src/pages/Methodology.tsx` | Documents F&B methodology |

## Anti-Patterns to Avoid

1. **Never express F&B as % of total revenue** in the model — always % of room revenue
2. **Never use systemwide catering assumptions** — always per-property
3. **Never hardcode catering boost** — use research-recommended values, stored per property
4. **Never separate full/partial catering levels** — use single blended boost percentage
5. **Never apply catering boost to event revenue** — only to F&B revenue
6. **Never confuse revShareFB with costRateFB** — one is revenue share, the other is cost rate
