# Model Defaults Tab — Architecture & Implementation Instructions

## Core Principle: Defaults vs Working Variables

This application has a dual-entity financial model: a management company + individual property SPVs. There are two fundamentally different categories of data in `globalAssumptions`:

### 1. Defaults (Templates)

**What they are:** Values that get copied into a new property when it's created. They are templates. After creation, the property's own copy is independent — changing the default does NOT retroactively update existing properties.

**Where they're edited:** Admin > Model Defaults tab (`ModelDefaultsTab.tsx`)

**Examples:**
- Default Starting ADR ($250) → copied to `properties.startAdr` at creation
- Default cost rate for rooms (20%) → copied to `properties.costRateRooms` at creation
- Default exit cap rate (8.5%) → copied to `properties.exitCapRate` at creation
- Default acquisition LTV (65%) → copied to `properties.acquisitionLTV` at creation

**How they flow:** The function `buildPropertyDefaultsFromGlobal()` in `server/routes/properties.ts` reads these defaults from `globalAssumptions` and applies them when creating a new property via `POST /api/properties`. If the DB value is NULL, it falls back to the hardcoded constant in `shared/constants.ts`.

### 2. Working Variables (Live Values)

**What they are:** Values that directly drive the financial engine's calculations RIGHT NOW. They are not templates — they ARE the model. The management company is a single entity; there is no "create a new company" flow. These values are read every time the engine runs.

**Where they're edited:** Company Assumptions page (`/company/assumptions`) via the section components in `client/src/components/company-assumptions/`

**Examples:**
- Partner compensation schedule (partnerCompYear1–10) → directly used in monthly company P&L
- Staff salary ($75k) → directly multiplied by FTE count for company payroll
- Funding tranche amounts → directly flow into company cash flow as financing inflows
- Office lease, travel costs, marketing rate → directly computed as company OpEx
- Company tax rate → directly applied to company pre-tax income

**These do NOT belong in Model Defaults.** They are not templates for anything. They are the live operational parameters of the single management company.

---

## Why Only Two Tabs

The Model Defaults tab has exactly two tabs:

### Tab 1: Market & Macro
Global economic parameters that provide context across the entire platform:
- Macro inflation rate
- Cost of equity (WACC)
- Days per month (governed field — 30.5)
- Fiscal year start month

These are neither property defaults nor company working variables — they're platform-wide economic context.

### Tab 2: Property Underwriting
Default templates for new properties. Everything here gets copied into a property at creation:
- Revenue assumptions (ADR, occupancy, revenue shares, catering boost)
- USALI operating cost rates (rooms, F&B, admin, marketing, POM, utilities, taxes, IT, FF&E, other, insurance)
- Revenue stream expense rates (event expense, other expense, utilities variable split)
- Acquisition financing terms (LTV, interest rate, term, closing costs)
- Refinance terms
- Depreciation & tax (depreciation years, land value %, property income tax rate)
- Exit & disposition (exit cap rate, sales commission, acquisition commission)
- Default acquisition package (purchase price, building improvements, pre-opening costs, operating reserve, months to ops)

### Why NO "Company Operations" Tab

A previous plan called for a third tab mirroring the Company Assumptions page. This was wrong because:

1. **The management company is a single entity.** There is no "create a new company" flow that would use templates/defaults.
2. **Company fields are working variables.** Partner comp, funding tranches, staff salary, overhead costs, variable costs, and company tax rate are live values directly consumed by the financial engine. They are not copied anywhere.
3. **They already have a home.** The Company Assumptions page (`/company/assumptions`) is where these values are edited, with rich UI sections (CompanySetupSection, FundingSection, CompensationSection, PartnerCompSection, FixedOverheadSection, VariableCostsSection, TaxSection, ManagementFeesSection).
4. **Duplicating them would create confusion.** If company working variables appeared in both Model Defaults AND Company Assumptions, users wouldn't know which one is authoritative. The answer is: Company Assumptions is authoritative for working variables. Model Defaults is authoritative for property creation templates.

---

## The Nullable Fallback Pattern

New default columns in `globalAssumptions` are **nullable with no DB default**. This is intentional:

```
defaultStartAdr: real("default_start_adr")   // nullable, no .default()
```

- `NULL` → use the hardcoded constant from `shared/constants.ts` (e.g., `DEFAULT_START_ADR = 250`)
- Non-NULL → admin has explicitly set a custom default; use it

In `buildPropertyDefaultsFromGlobal()`:
```typescript
startAdr: ga?.defaultStartAdr ?? DEFAULT_START_ADR,
```

In the UI:
```typescript
draft.defaultStartAdr ?? DEFAULT_START_ADR  // shows constant as placeholder until admin overrides
```

This preserves backward compatibility: existing `globalAssumptions` rows get NULL for all new columns, so behavior is identical to before the migration.

---

## Key Files

| File | Role |
|------|------|
| `client/src/components/admin/ModelDefaultsTab.tsx` | The UI — only file for defaults editing |
| `shared/schema/config.ts` | Schema — `globalAssumptions` table definition |
| `server/routes/properties.ts` | `buildPropertyDefaultsFromGlobal()` — where defaults flow to new properties |
| `shared/constants.ts` | Hardcoded fallback constants (never removed, always the last resort) |
| `client/src/components/company-assumptions/*.tsx` | Working variable editors — NOT part of Model Defaults |

## Summary

| Question | Answer |
|----------|--------|
| Does this value get copied into a new property? | → It's a **default**. Put it in Model Defaults. |
| Does this value directly drive the financial engine for the management company? | → It's a **working variable**. It belongs on Company Assumptions. |
| Is it a platform-wide economic parameter? | → It goes in Market & Macro. |
| Should I add a Company Operations tab? | → **No.** Those are working variables, not defaults. |
