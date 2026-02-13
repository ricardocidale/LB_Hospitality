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

## How It Works

After a successful mutation, invalidate all financial query keys so React Query refetches everything downstream. The invalidation must be broad — never selectively skip report queries.

```typescript
// CORRECT — invalidate all financial data after saving
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["global-assumptions"] });
  queryClient.invalidateQueries({ queryKey: ["properties"] });
  queryClient.invalidateQueries({ queryKey: ["fee-categories"] });
  // ... all report/financial queries
}

// WRONG — only invalidating the specific thing that changed
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["global-assumptions"] });
  // Missing: reports, properties, projections, etc.
}
```

## Why

Financial reports are interconnected. A change to any single assumption can cascade through:
- Property-level P&L → Management fee revenue → Company P&L → Company cash flow → Balance sheet → All summary dashboards

Partial invalidation risks showing stale numbers alongside fresh ones, which breaks the integrity of the financial model.
