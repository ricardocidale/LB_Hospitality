# Server-Authoritative Finance Engine

## Architecture

The server finance engine imports client pure functions directly — **single source of truth, no copy-paste**.

### File Structure

```
server/finance/
├── core/
│   ├── types.ts              # Re-exports client types + PortfolioComputeResult interface
│   ├── property-pipeline.ts  # Re-exports generatePropertyProForma from client
│   ├── yearly-aggregator.ts  # Re-exports aggregatePropertyByYear from client
│   └── consolidation.ts      # Re-exports consolidateYearlyFinancials from client
├── service.ts                # Orchestrator: pipeline → aggregation → consolidation → GAAP → hash
```

### Key Design Decision: Re-Export Pattern

`server/finance/core/*.ts` files are thin re-export layers importing from `@/lib/financial/*`. This ensures:
- **Zero duplication** of financial logic
- **Automatic parity** — server and client always use identical math
- A future decoupling seam if server needs independent logic

```typescript
// Example: core/property-pipeline.ts
import { generatePropertyProForma } from "@/lib/financial/property-engine";
export { generatePropertyProForma };
```

### computePortfolioProjection()

Pure synchronous function in `service.ts`:
1. For each property: `generatePropertyProForma()` → `aggregatePropertyByYear()`
2. `consolidateYearlyFinancials()` across all properties
3. `validateFinancialIdentities()` — skips Balance Sheet Equation (no real BS data at property pro-forma level)
4. `stableHash()` the output payload (deterministic SHA-256 via `json-stable-stringify`)
5. Returns `PortfolioComputeResult` with engine version, hash, validation summary

### Property Keying (Collision-Safe)

```typescript
function uniquePropertyKey(property, index): string {
  if (property.id != null) return `property_${property.id}`;
  return `${name}__idx${index}`;
}
```

### Validation Rules

- Balance Sheet Equation check is **excluded** at property level — no real BS data available
- Only income statement and cash flow identity checks run
- Skip validation for zero-revenue/zero-NOI years (pre-operational)

## Export Reproducibility Lock

`server/report/server-export-data.ts` builds export-ready IS/CF statements from server-recomputed data.

### computeRef Pattern

When `computeRef` is present in `POST /api/exports/premium`:
1. Server fetches properties + global assumptions from DB
2. Runs `computePortfolioProjection()` server-side
3. Builds Income Statement + Cash Flow Statement sections
4. Ignores client `rows`/`statements`/`metrics` entirely
5. Sets `X-Finance-Output-Hash` and `X-Finance-Engine-Version` response headers

When `computeRef` absent: legacy path unchanged (backward compat).

### Lock Enforcement

- If `computeRef` present but no authenticated user → 401 (never falls through to legacy)
- `projectionYears` bounded: `z.number().int().min(1).max(30)`
- `propertyIds` validated: `z.number().int().positive()`

### DB Field Mapping Gotchas

- `globalAssumptions.debtAssumptions` is JSONB — access as `Record<string, unknown>`, not flat columns
- Property DB entities have nullable fields where `PropertyInput` expects required — use `as PropertyInput` cast (DB always has values, schema allows null for migration compat)
- `format` field on export rows must be the Zod enum union (`"currency" | "percentage" | ...`), not `string`

## Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/finance/compute` | Required | Full portfolio computation |
| `GET /api/finance/health` | Public | Engine status |
| `POST /api/exports/premium` | Required | Export with optional `computeRef` |

## Constants

- `ENGINE_VERSION = "1.0.0"`
- `PROJECTION_YEARS_DEFAULT = 10`
- `DEFAULT_ROUNDING = { precision: 2, bankers_rounding: false }`
