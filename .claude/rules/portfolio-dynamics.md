# Portfolio Dynamics

## Rule

The financial engine must handle any number of properties (0, 1, 5, 20+) without hardcoded limits. Every property must be visible to every authenticated user. Management fee revenue flowing to the hospitality company must exactly equal the sum of fee expenses paid by each property (zero-sum intercompany).

## Property Count — Never Hardcode

The number of properties in the portfolio is always derived dynamically from the database result set. No code path may assume a fixed property count.

```typescript
// CORRECT — dynamic count from the array
const propertyCount = properties.length;
const staffFTE = propertyCount <= tier1Max ? tier1Fte
  : propertyCount <= tier2Max ? tier2Fte : tier3Fte;

// WRONG — hardcoded property count
const propertyCount = 5;
```

**Staffing tiers** use configurable thresholds from `global_assumptions` (`staffTier1MaxProperties`, `staffTier2MaxProperties`), not hardcoded values. The engine computes `activePropertyCount` dynamically each month by counting properties with revenue > 0.

**Seed scripts** may create a fixed number of initial properties, but log messages and tests must reference the actual array length, not a literal.

## Shared Ownership — All Properties Visible to All Users

All portfolio properties must have `userId = NULL` so every authenticated user can see them. The `getAllProperties(userId)` query returns `WHERE userId = :uid OR userId IS NULL` — a property with a non-null `userId` is invisible to all other users.

```typescript
// CORRECT — shared property
await storage.createProperty({ ...data, userId: null });

// WRONG — owned by one user
await storage.createProperty({ ...data, userId: req.user.id });
```

### Scenario Load — Must Restore as Shared

When loading a saved scenario, the `loadScenario()` method must:
1. Update the **shared** `global_assumptions` row (userId=NULL), not create a user-specific one
2. Delete all shared properties, then re-insert scenario properties with `userId: null`
3. Never set `userId` to the logged-in user's ID on restored properties

**Root cause (Feb 2025):** `loadScenario()` inserted restored properties with the logged-in user's `userId`, making them invisible to all other users.

## Management Fee Zero-Sum

Each property pays management fees (base + incentive) as an expense. The management company receives those same amounts as revenue. In consolidation, these intercompany fees must eliminate to zero.

```
Property SPV:     feeBase + feeIncentive = management fee expense (reduces NOI)
Management Co:    baseFeeRevenue + incentiveFeeRevenue = sum of all property fees
Consolidated:     intercompany fees eliminate to $0
```

This is verified by `tests/proof/portfolio-dynamics.test.ts`:
- Portfolio NOI = sum of individual property NOIs
- Company fee revenue = sum of property fee expenses
- Consolidated eliminations net to zero

## Portfolio Aggregation

When computing portfolio-level metrics (Dashboard):
- **Revenue**: Sum of all property revenues
- **NOI**: Sum of all property NOIs
- **IRR**: Computed from consolidated cash flows (not averaged)
- **Weighted ADR/Occupancy/RevPAR**: Weighted by available room nights, not simple average
- **Equity Multiple**: Based on total equity invested across all properties

Adding a property increases portfolio revenue and count. Removing a property decreases them. Zero properties must not crash — show empty states.

## Verification

These invariants are enforced by:
- `tests/proof/portfolio-dynamics.test.ts` — proof test in the verification pipeline
- `tests/proof/data-integrity.test.ts` — shared ownership checks
- `tests/engine/per-property-fees.test.ts` — fee zero-sum checks
- `tests/engine/company-proforma.test.ts` — staffing tier scaling

## Checklist

- [ ] Does the engine derive property count from the array, never a literal?
- [ ] Are all new properties created with `userId: null`?
- [ ] Does scenario load restore properties as shared (userId=NULL)?
- [ ] Do management fees eliminate to zero in consolidation?
- [ ] Does the dashboard handle 0 properties without crashing?
- [ ] Are staffing tier thresholds from global assumptions, not hardcoded?
