# Model Defaults Tab: Completion & Design Upgrade

**Date**: 2026-03-17
**Status**: Ready for Replit implementation
**Priority**: High — this is the centerpiece of the UX redesign

---

## Current State

`ModelDefaultsTab.tsx` exists and loads (infinite loop fixed). But it has 3 major issues:

### Issue 1: Only 2 of 3 tabs exist

| Tab | Status | Fields |
|-----|--------|--------|
| Market & Macro | Exists | 4 fields (inflation, cost of equity, days/month, fiscal year) |
| Company Operations | **MISSING** | Should have ~40 fields (identity, timeline, funding, revenue, people, overhead, variable costs, tax) |
| Property Underwriting | Exists but incomplete | Has 18 fields. Missing: revenue defaults (ADR, occupancy, ramp, F&B, catering, events, other) |

### Issue 2: Plain design

Uses basic shadcn `Card` with `bg-card border-border/80`. No premium styling. Every other page in the app has glassmorphism, gradient headers, depth effects, icons in section titles. This page looks like a prototype.

### Issue 3: Missing Property Underwriting fields

The Property Underwriting tab is missing the entire Revenue Assumptions section and several other fields specified in the plan.

---

## What to Build

### Tab 3: Company Operations (NEW — the big one)

This tab mirrors what's currently on `/company/assumptions`. The data is already in `globalAssumptions` and editable via the same `PUT /api/global-assumptions` endpoint. Copy the field structure from the existing Company Assumptions sections.

**Reference files for field structure and data binding:**
- `client/src/components/company-assumptions/CompanySetupSection.tsx` — identity, timeline, inflation
- `client/src/components/company-assumptions/FundingSection.tsx` — SAFE tranches, valuation cap, interest
- `client/src/components/company-assumptions/ManagementFeesSection.tsx` — base/incentive fee %
- `client/src/components/company-assumptions/CompensationSection.tsx` — salary, tiers, partner comp
- `client/src/components/company-assumptions/FixedOverheadSection.tsx` — office, prof services, tech, insurance
- `client/src/components/company-assumptions/VariableCostsSection.tsx` — travel, IT, marketing, misc ops
- `client/src/components/company-assumptions/TaxSection.tsx` — company tax rate

**Sections to include (in order):**

1. **Company Identity** — logo selector, company name, email, phone, website, EIN, founding year, address (country → state → city → zip cascading)
2. **Company Timeline** — model start date, operations start date, projection years
3. **Funding Structure** — funding source label, tranche 1 (amount + date), tranche 2 (amount + date), valuation cap toggle, discount rate toggle, interest rate toggle + payment frequency
4. **Revenue Model** — base management fee %, incentive management fee %
5. **People & Compensation** — staff salary, salary escalation, payroll burden, staffing tiers (3 tiers), partner comp table (years 1-10)
6. **Fixed Overhead** — fixed cost escalation rate, office lease, professional services, tech, insurance
7. **Variable Costs** — travel per client, IT license per client, marketing rate %, misc ops rate %
8. **Company Tax** — company income tax rate, company inflation rate

All these fields already exist in `globalAssumptions`. The existing Company Assumptions page sections show exactly how to bind each field.

### Missing Property Underwriting Fields

Add these sections to the Property Underwriting tab:

**Revenue Assumptions (new section, before Operating Cost Rates):**
- Default starting ADR ($250)
- Default ADR growth rate (3%)
- Default starting occupancy (55%)
- Default stabilized occupancy (85%)
- Default stabilization months (36)
- Default F&B revenue share (18%)
- Default catering boost (22%)
- Default event revenue share (30%)
- Default other revenue share (5%)

These are currently client-side constants in `client/src/lib/constants.ts` (`DEFAULT_START_ADR`, `DEFAULT_ADR_GROWTH_RATE`, etc.). If the schema columns don't exist yet in `globalAssumptions`, add them as part of this work (see Phase 1 in `UX-REDESIGN-PLAN.md`).

---

## Design Upgrade

The current design uses plain `Card` components. Match the premium styling used elsewhere in admin:

### Section Card Styling

**Current (plain):**
```tsx
<Card className="bg-card border border-border/80 shadow-sm">
```

**Should be (premium, matching Company Assumptions sections):**
```tsx
<div className="relative overflow-hidden rounded-lg p-6 bg-card border border-border shadow-sm">
  <div className="relative space-y-6">
    <div>
      <h3 className="text-lg font-display text-foreground flex items-center gap-2">
        <IconName className="w-5 h-5 text-primary" />
        Section Title
        <InfoTooltip text="..." />
      </h3>
      <p className="text-muted-foreground text-sm label-text">Section description</p>
    </div>
    {/* fields */}
  </div>
</div>
```

Key differences:
- `font-display` on section titles (IBM Plex Sans)
- Icon before each section title (use Lucide icons)
- `label-text` class on descriptions
- More spacing (`space-y-6` between sections)

### Tab Bar Styling

**Current (basic):**
```tsx
<TabsList className="bg-muted/50 border border-border/60">
```

**Should match the `CurrentThemeTab` style used on financial pages**, or at minimum use:
```tsx
<TabsList className="bg-muted/60 border border-border/50 rounded-lg p-1">
  <TabsTrigger className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm" ...>
```

### Field Layout

Current fields are cramped (`w-40`). For dollar amounts and percentages with sliders, use the pattern from Company Assumptions:
- Label on top (not side-by-side for complex fields)
- Slider + numeric input side by side
- Full-width for dollar inputs

For simple percentage fields, the current side-by-side layout is fine but widen the input (`w-48` or `w-56`).

### Tab Descriptions

Each tab should have a description banner below the tab bar:

```tsx
<div className="rounded-lg bg-primary/5 border border-primary/10 p-3 mb-4">
  <p className="text-sm text-muted-foreground">
    These values provide economic context for research and benchmarking across the platform.
  </p>
</div>
```

---

## Technical Notes

### Data Binding

All fields read from and write to `globalAssumptions` via the existing `draft` state. The `handleChange` function updates the draft:

```tsx
handleChange("fieldName", newValue)          // for flat fields
handleChange("standardAcqPackage", {...})    // for JSONB fields
handleChange("debtAssumptions", {...})       // for JSONB fields
```

### Save Mechanism

Already wired: `PUT /api/global-assumptions` with `invalidateAllFinancialQueries` on success. The save button in the PageHeader triggers via `onSaveStateChange` → `saveRef.current`. No new API work needed.

### Partner Compensation Table

The partner comp section needs a 10-year table (Years 1-10, each with partner count + annual comp). Use the same table pattern from `PartnerCompSection.tsx`. Fields: `partnerCompYear1` through `partnerCompYear10`, `partnerCountYear1` through `partnerCountYear10`.

### Geo Cascading Selects

Company Identity needs country → state → city cascading dropdowns. Use the existing `useGeoSelect` hook from `@/hooks/use-geo` — same pattern as `CompanySetupSection.tsx`.

### Logo Selector

Company Identity needs the logo selector. Use existing `LogoSelector` from `@/components/admin/LogoSelector`.

---

## Verification

After implementation:
```bash
npm run test:summary      # All tests pass
npm run verify:summary    # UNQUALIFIED
```

Manual checks:
- All 3 tabs load without errors
- Company Operations tab shows all ~40 fields from current Company Assumptions
- Property Underwriting tab has Revenue Assumptions section
- Saving updates globalAssumptions and triggers recalculation
- Toast shows: "Property defaults saved. These will apply to new entities."
- Design matches premium styling of other admin sections
