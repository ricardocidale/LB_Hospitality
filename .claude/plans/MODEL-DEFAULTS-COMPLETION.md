# Model Defaults Tab: Completion & Design Upgrade Plan

**Date**: 2026-03-17  
**Status**: Ready for implementation  
**Priority**: High — this is the admin's single place to configure property creation defaults  

---

## Architectural Principle: Defaults vs Working Variables

The Model Defaults tab manages **defaults** — template values that pre-fill new properties
when they're created. These are NOT working variables. The distinction:

| Category | Where Edited | Purpose | Example |
|----------|-------------|---------|---------|
| **Defaults** | Admin > Model Defaults | Template values copied into new entities at creation time | Default ADR ($250), default cost rate rooms (20%), default exit cap rate (8.5%) |
| **Working Variables** | Company Assumptions page | Live values that directly drive the financial engine for the management company | Partner comp schedule, staff salary, funding tranches, overhead costs |

**Consequence**: There is NO "Company Operations" tab in Model Defaults. Company-level
working variables (partner comp, funding, staffing, overhead, variable costs, tax) belong
exclusively on the Company Assumptions page. They are not templates — the management
company is a single entity with one set of live values.

**Model Defaults scope = 2 tabs only:**
1. **Market & Macro** — global economic parameters (inflation, cost of equity, days/month, fiscal year)
2. **Property Underwriting** — default templates for new properties (revenue assumptions, USALI cost rates, financing, depreciation, exit, acquisition package)

---

## Current State Analysis

### Tab 1: Market & Macro (EXISTS — needs design upgrade only)

| Field | Schema Column | Current Status |
|-------|--------------|----------------|
| Macro Inflation Rate | `inflationRate` | ✅ Working |
| Cost of Equity | `costOfEquity` | ✅ Working |
| Days Per Month | `daysPerMonth` | ✅ Working (GovernedField) |
| Fiscal Year Start Month | `fiscalYearStartMonth` | ✅ Working |

**Design issues:**
- Uses plain `SectionCard` wrapper (`Card className="bg-card border border-border/80"`)
- No icons in section titles
- No `font-display` on section headings
- No tab description banner
- Uses `FieldRow` with cramped `w-40` inputs instead of premium Slider + EditableValue pattern

### Tab 2: Property Underwriting (EXISTS — needs fields + design upgrade)

**What's there (18 fields):**

| Section | Fields | Status |
|---------|--------|--------|
| Operating Cost Rates | eventExpenseRate, otherExpenseRate, utilitiesVariableSplit | ✅ 3 of 14 rates |
| Acquisition Financing | acqLTV, interestRate, amortizationYears, acqClosingCostRate | ✅ Complete |
| Refinance Terms | refiLTV, refiInterestRate, refiAmortizationYears, refiClosingCostRate | ✅ Complete |
| Depreciation & Tax | depreciationYears (GovernedField) | ✅ Complete |
| Exit & Disposition | exitCapRate, salesCommissionRate, commissionRate (acq) | ✅ Complete |
| Default Acquisition Package | purchasePrice, buildingImprovements, preOpeningCosts, operatingReserve, monthsToOps | ✅ Complete |

**What's missing:**

#### A. Revenue Assumptions Section (ENTIRELY MISSING — 9 fields)

These values pre-fill new properties. Currently hardcoded in `shared/constants.ts` and
`client/src/lib/constants.ts`. NO schema columns exist in `globalAssumptions`.

| Field | Constant Source | Default Value | Property Column |
|-------|----------------|---------------|-----------------|
| Default Starting ADR | `DEFAULT_START_ADR` | $250 | `startAdr` |
| Default ADR Growth Rate | `DEFAULT_ADR_GROWTH_RATE` (client only) | 3% | `adrGrowthRate` |
| Default Starting Occupancy | `DEFAULT_START_OCCUPANCY` (client only) | 55% | `startOccupancy` |
| Default Stabilized Occupancy | `DEFAULT_MAX_OCCUPANCY` | 85% | `maxOccupancy` |
| Default Stabilization Months | `DEFAULT_OCCUPANCY_RAMP_MONTHS` | 6 | `occupancyRampMonths` |
| Default Room Count | `DEFAULT_ROOM_COUNT` | 10 | `roomCount` |
| Default F&B Revenue Share | `DEFAULT_REV_SHARE_FB` | 18% | `revShareFB` |
| Default Event Revenue Share | `DEFAULT_REV_SHARE_EVENTS` | 30% | `revShareEvents` |
| Default Other Revenue Share | `DEFAULT_REV_SHARE_OTHER` | 5% | `revShareOther` |
| Default Catering Boost | `DEFAULT_CATERING_BOOST_PCT` | 22% | `cateringBoostPercent` |

**Schema migration required**: Add 10 nullable columns to `globalAssumptions`:
- `defaultStartAdr` (real, nullable, no default — NULL means use constant)
- `defaultAdrGrowthRate` (real, nullable)
- `defaultStartOccupancy` (real, nullable)
- `defaultMaxOccupancy` (real, nullable)
- `defaultOccupancyRampMonths` (integer, nullable)
- `defaultRoomCount` (integer, nullable)
- `defaultRevShareFb` (real, nullable)
- `defaultRevShareEvents` (real, nullable)
- `defaultRevShareOther` (real, nullable)
- `defaultCateringBoostPct` (real, nullable)

**Nullable design**: NULL means "use the hardcoded constant." This avoids breaking existing
rows and preserves backward compatibility. The `buildPropertyDefaultsFromGlobal()` function
in `server/routes/properties.ts` will be updated to prefer DB values over constants.

#### B. Missing USALI Operating Cost Rate Defaults (8 of 11 missing)

Properties have 11 USALI cost rate columns. The Property Underwriting tab currently exposes
only 3 non-USALI rates (eventExpenseRate, otherExpenseRate, utilitiesVariableSplit).
The 11 USALI rates are hardcoded in `buildPropertyDefaultsFromGlobal()`.

| Cost Rate | Constant | Default | In Model Defaults Tab? |
|-----------|----------|---------|----------------------|
| Rooms | `DEFAULT_COST_RATE_ROOMS` | 20% | ❌ Missing |
| F&B | `DEFAULT_COST_RATE_FB` | 9% | ❌ Missing |
| Admin (G&A) | `DEFAULT_COST_RATE_ADMIN` | 8% | ❌ Missing |
| Marketing | `DEFAULT_COST_RATE_MARKETING` | 1% | ❌ Missing |
| Property Ops (POM) | `DEFAULT_COST_RATE_PROPERTY_OPS` | 4% | ❌ Missing |
| Utilities | `DEFAULT_COST_RATE_UTILITIES` | 5% | ❌ Missing |
| Property Taxes | `DEFAULT_COST_RATE_TAXES` | 3% | ❌ Missing |
| IT | `DEFAULT_COST_RATE_IT` | 0.5% | ❌ Missing |
| FF&E Reserve | `DEFAULT_COST_RATE_FFE` | 4% | ❌ Missing |
| Other | `DEFAULT_COST_RATE_OTHER` | 5% | ❌ Missing |
| Insurance | `DEFAULT_COST_RATE_INSURANCE` | 1.5% | ❌ Missing |
| Event Expense | `DEFAULT_EVENT_EXPENSE_RATE` | 65% | ✅ Present |
| Other Expense | `DEFAULT_OTHER_EXPENSE_RATE` | 60% | ✅ Present |
| Utilities Variable Split | `DEFAULT_UTILITIES_VARIABLE_SPLIT` | 60% | ✅ Present |

**Schema migration required**: Add 11 nullable columns to `globalAssumptions`:
- `defaultCostRateRooms` (real, nullable)
- `defaultCostRateFb` (real, nullable)
- `defaultCostRateAdmin` (real, nullable)
- `defaultCostRateMarketing` (real, nullable)
- `defaultCostRatePropertyOps` (real, nullable)
- `defaultCostRateUtilities` (real, nullable)
- `defaultCostRateTaxes` (real, nullable)
- `defaultCostRateIt` (real, nullable)
- `defaultCostRateFfe` (real, nullable)
- `defaultCostRateOther` (real, nullable)
- `defaultCostRateInsurance` (real, nullable)

Same nullable design: NULL = use hardcoded constant.

#### C. Missing Property Tax Rate Default

Properties have a `taxRate` column (income tax on property gains, default 25%). This is
NOT exposed in the Property Underwriting tab. It should be added to the "Depreciation & Tax"
section alongside `depreciationYears`.

**Schema**: Already exists as `globalAssumptions` has no property-tax-rate default column.
Need to add `defaultPropertyTaxRate` (real, nullable).

#### D. Missing Land Value Percent Default

Properties have a `landValuePercent` column (default 25%, determines depreciable basis).
This should be in "Depreciation & Tax" section.

**Schema**: Need to add `defaultLandValuePercent` (real, nullable).

---

## Implementation Plan

### Phase 1: Schema Migration (add ~23 nullable columns)

Add to `shared/schema/config.ts` `globalAssumptions` table:

```
// Property Revenue Defaults (nullable — NULL = use constant fallback)
defaultStartAdr             real  nullable
defaultAdrGrowthRate        real  nullable
defaultStartOccupancy       real  nullable
defaultMaxOccupancy         real  nullable
defaultOccupancyRampMonths  integer nullable
defaultRoomCount            integer nullable
defaultRevShareFb           real  nullable
defaultRevShareEvents       real  nullable
defaultRevShareOther        real  nullable
defaultCateringBoostPct     real  nullable

// Property USALI Cost Rate Defaults (nullable — NULL = use constant fallback)
defaultCostRateRooms        real  nullable
defaultCostRateFb           real  nullable
defaultCostRateAdmin        real  nullable
defaultCostRateMarketing    real  nullable
defaultCostRatePropertyOps  real  nullable
defaultCostRateUtilities    real  nullable
defaultCostRateTaxes        real  nullable
defaultCostRateIt           real  nullable
defaultCostRateFfe          real  nullable
defaultCostRateOther        real  nullable
defaultCostRateInsurance    real  nullable

// Property Tax & Depreciation Defaults
defaultPropertyTaxRate      real  nullable
defaultLandValuePercent     real  nullable
```

Also add all 23 columns to `insertGlobalAssumptionsSchema.pick({...})`.

Then run `npm run db:push --force` to sync.

### Phase 2: Update `buildPropertyDefaultsFromGlobal()`

In `server/routes/properties.ts`, update the function to prefer DB values:

```typescript
// Before (hardcoded):
costRateRooms: DEFAULT_COST_RATE_ROOMS,

// After (DB-first with constant fallback):
costRateRooms: ga?.defaultCostRateRooms ?? DEFAULT_COST_RATE_ROOMS,
```

Apply this pattern for all 23 new fields. Also add revenue defaults:
```typescript
startAdr: ga?.defaultStartAdr ?? DEFAULT_START_ADR,
adrGrowthRate: ga?.defaultAdrGrowthRate ?? DEFAULT_ADR_GROWTH_RATE,
startOccupancy: ga?.defaultStartOccupancy ?? DEFAULT_START_OCCUPANCY,
maxOccupancy: ga?.defaultMaxOccupancy ?? DEFAULT_MAX_OCCUPANCY,
roomCount: ga?.defaultRoomCount ?? DEFAULT_ROOM_COUNT,
// ... etc
```

### Phase 3: Redesign ModelDefaultsTab UI

#### 3A. Replace helper components with premium patterns

**Current helper components to retire:**
- `SectionCard` — plain Card wrapper → replace with premium div wrapper
- `FieldRow` — cramped side-by-side layout → replace with Slider + EditableValue for
  numeric fields, keep side-by-side for selects/toggles
- `PctInput`, `DollarInput`, `NumInput` — basic inputs → replace with `EditableValue`
  + `Slider` combo for percentage and dollar fields

**New section wrapper pattern** (from CompanySetupSection, FundingSection, etc.):
```tsx
<div className="relative overflow-hidden rounded-lg p-6 bg-card border border-border shadow-sm">
  <div className="relative space-y-6">
    <div>
      <h3 className="text-lg font-display text-foreground flex items-center gap-2">
        <IconName className="w-5 h-5 text-primary" />
        Section Title
        <InfoTooltip text="..." />
      </h3>
      <p className="text-muted-foreground text-sm label-text">Description</p>
    </div>
    {/* fields using EditableValue + Slider pattern */}
  </div>
</div>
```

**Field pattern** (from FixedOverheadSection, VariableCostsSection):
```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <Label className="flex items-center text-foreground label-text">
      Field Name
      <InfoTooltip text="..." />
    </Label>
    <EditableValue value={...} onChange={...} format="percent" min={0} max={0.5} step={0.01} />
  </div>
  <Slider value={[...]} onValueChange={([v]) => ...} min={0} max={50} step={1} />
</div>
```

#### 3B. Add tab description banners

Each tab content area starts with:
```tsx
<div className="rounded-lg bg-primary/5 border border-primary/10 p-3 mb-4">
  <p className="text-sm text-muted-foreground">
    Tab-specific description text
  </p>
</div>
```

Market & Macro: "Global economic assumptions that provide context for research, benchmarking,
and valuation calculations across all properties."

Property Underwriting: "Default values applied to new properties at creation. Each property
can override these individually on its assumptions page."

#### 3C. Tab bar upgrade

```tsx
<TabsList className="bg-muted/60 border border-border/50 rounded-lg p-1">
  <TabsTrigger value="market-macro" className="rounded-md" ...>
```

### Phase 4: Build Revenue Assumptions Section

New section in Property Underwriting tab, positioned BEFORE Operating Cost Rates.

**Icon**: `IconTrending` or a revenue-related Lucide icon
**Title**: "Revenue Assumptions"
**Description**: "Default revenue parameters for new properties. ADR, occupancy ramp-up,
and ancillary revenue shares."

Fields (all use EditableValue + Slider):

| Field | Format | Min | Max | Step | Draft Key |
|-------|--------|-----|-----|------|-----------|
| Default Room Count | number | 5 | 200 | 1 | `defaultRoomCount` |
| Default Starting ADR | dollar | 100 | 1000 | 10 | `defaultStartAdr` |
| Default ADR Growth Rate | percent | 0 | 10% | 0.5% | `defaultAdrGrowthRate` |
| Default Starting Occupancy | percent | 20% | 80% | 5% | `defaultStartOccupancy` |
| Default Stabilized Occupancy | percent | 50% | 100% | 5% | `defaultMaxOccupancy` |
| Default Stabilization Period | number (months) | 3 | 48 | 3 | `defaultOccupancyRampMonths` |
| F&B Revenue Share | percent | 0 | 50% | 1% | `defaultRevShareFb` |
| Event Revenue Share | percent | 0 | 50% | 1% | `defaultRevShareEvents` |
| Other Revenue Share | percent | 0 | 20% | 1% | `defaultRevShareOther` |
| Catering Boost | percent | 0 | 50% | 1% | `defaultCateringBoostPct` |

**Fallback display**: Each field shows the hardcoded constant as fallback when the DB
value is NULL. Use pattern: `draft.defaultStartAdr ?? DEFAULT_START_ADR`.

### Phase 5: Expand Operating Cost Rates Section

Rename existing section from "Operating Cost Rates" to "USALI Operating Cost Rates."

Add the 11 missing USALI rates. Group them logically per USALI categories:

**Departmental Expenses:**
- Rooms Expense Rate (20%)
- F&B Expense Rate (9%)

**Undistributed Operating Expenses:**
- Admin / G&A Rate (8%)
- Sales & Marketing Rate (1%)
- Property Operations & Maintenance (4%)
- Utilities Rate (5%)
- IT Rate (0.5%)

**Fixed Charges:**
- Property Taxes Rate (3%)
- Insurance Rate (1.5%)
- FF&E Reserve Rate (4%)

**Other:**
- Other Expense Rate (5%)

Keep the existing 3 fields (eventExpenseRate, otherExpenseRate, utilitiesVariableSplit)
in their own sub-section: "Revenue Stream Expense Rates."

Each uses EditableValue + Slider with appropriate ranges.

### Phase 6: Add Missing Tax/Depreciation Fields

In "Depreciation & Tax" section, add:
- Default Property Income Tax Rate (25%, percent slider, min 0, max 50%)
- Default Land Value Percent (25%, percent slider, min 5%, max 50%)
  - With InfoTooltip: "Percentage of purchase price allocated to non-depreciable land.
    The remainder (building) is depreciated over the depreciation period."

### Phase 7: Design Upgrade Market & Macro Tab

Replace `SectionCard` usage with premium section wrapper pattern.
Replace `FieldRow` + `PctInput`/`NumInput` with EditableValue + Slider.
The GovernedFieldWrapper for `daysPerMonth` stays as-is (it has its own premium style).

---

## Key Files to Modify

| File | Change |
|------|--------|
| `shared/schema/config.ts` | Add 23 nullable columns + update insertSchema pick |
| `server/routes/properties.ts` | Update `buildPropertyDefaultsFromGlobal()` to use DB values |
| `client/src/components/admin/ModelDefaultsTab.tsx` | Full redesign: premium styling, new sections, new fields |
| `client/src/lib/constants.ts` | No changes (constants remain as fallbacks) |
| `shared/constants.ts` | No changes |

**No new files created** — all changes are within existing files.

---

## Data Flow After Implementation

```
Admin edits Model Defaults
  → PUT /api/global-assumptions
    → globalAssumptions row updated (e.g., defaultStartAdr = 300)
    → invalidateAllFinancialQueries()

User creates new property
  → POST /api/properties
    → buildPropertyDefaultsFromGlobal(ga) called
      → startAdr = ga.defaultStartAdr ?? DEFAULT_START_ADR
      → costRateRooms = ga.defaultCostRateRooms ?? DEFAULT_COST_RATE_ROOMS
      → ... (all 23+ fields)
    → New property row created with DB-sourced defaults
```

Existing properties are NOT affected. Defaults only apply to newly created properties.

---

## Section Order (Final Property Underwriting Tab Layout)

1. Revenue Assumptions (NEW)
2. USALI Operating Cost Rates (EXPANDED — was "Operating Cost Rates")
3. Revenue Stream Expense Rates (existing 3 fields, regrouped)
4. Acquisition Financing (existing, design upgrade)
5. Refinance Terms (existing, design upgrade)
6. Depreciation & Tax (existing + 2 new fields, design upgrade)
7. Exit & Disposition (existing, design upgrade)
8. Default Acquisition Package (existing, design upgrade)

---

## Verification

After implementation:
```bash
npm run db:push --force    # Schema migration
npm run test:summary       # All tests pass
npm run verify:summary     # UNQUALIFIED
```

Manual checks:
- Both tabs load without errors
- All new fields display with correct fallback values
- Editing a default and saving updates globalAssumptions
- Creating a new property picks up the edited default (not the hardcoded constant)
- Toast: "Model defaults saved. Changes will apply to new entities."
- Design matches premium styling of Company Assumptions sections
- GovernedFieldWrapper on daysPerMonth and depreciationYears unchanged
