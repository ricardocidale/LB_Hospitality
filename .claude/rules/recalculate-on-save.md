# Recalculate on Save

## Rule

Every time the user saves any assumption, property value, fee category, or configuration that affects financial outputs, the entire application must recalculate all financial reports. There is no partial recalculation — all reports regenerate from current data.

## What Triggers Recalculation

Any save/mutation that touches:
- Global assumptions (company assumptions page)
- Property assumptions (ADR, occupancy, cost rates, revenue shares, etc.)
- Fee categories (base fees, incentive fees, service categories)
- Property creation or deletion
- Funding amounts or dates
- Partner compensation or staffing tiers
- Overhead or variable cost parameters
- Tax rates, exit cap rates, commission rates
- Expense rates (event, other revenue, utilities split)
- Sidebar visibility or display settings (they live in global assumptions)
- Scenario save, load, or delete

## How It Works

A centralized helper function `invalidateAllFinancialQueries` in `client/src/lib/api.ts` invalidates ALL financial query keys at once. Every financial mutation must call this helper — never hand-pick individual query keys.

```typescript
// CORRECT — use the centralized helper (defined in api.ts)
import { invalidateAllFinancialQueries } from "@/lib/api";

onSuccess: () => {
  invalidateAllFinancialQueries(queryClient);
}

// WRONG — cherry-picking individual keys
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["globalAssumptions"] });
  // Missing: properties, feeCategories, scenarios, research...
}
```

### Query Keys Covered

The `ALL_FINANCIAL_QUERY_KEYS` array in `api.ts` includes these base prefixes:
- `["globalAssumptions"]`
- `["properties"]` — also invalidates `["properties", id]` for any id
- `["feeCategories"]` — also invalidates `["feeCategories", propertyId]` and `["feeCategories", "all"]`
- `["scenarios"]`
- `["research"]` — also invalidates `["research", type, propertyId]` variants

React Query uses **partial/fuzzy key matching** by default (no `exact: true`), so invalidating `["properties"]` automatically covers all sub-keys like `["properties", 5]`.

When adding new financial data queries, either nest them under one of these existing prefixes, or add a new base key to `ALL_FINANCIAL_QUERY_KEYS`.

### Non-Financial Mutations (Exempt)

These mutations do NOT require full recalculation:
- Prospective favorites (property finder saves)
- Saved searches
- Design themes (visual only)
- Logos and asset descriptions (branding only)
- Profile updates (name, email, password)
- Session management

## Why

Financial reports are interconnected. A change to any single assumption can cascade through:
- Property-level P&L → Management fee revenue → Company P&L → Company cash flow → Balance sheet → All summary dashboards

Partial invalidation risks showing stale numbers alongside fresh ones, which breaks the integrity of the financial model.
