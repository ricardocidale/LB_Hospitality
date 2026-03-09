# Comprehensive Codebase Audit — March 9, 2026

## Audit Scope
8-phase review covering: financial calculations, database integrity, support functionality, research system, export quality, admin functionality, production DB protection, and best coding practices.

## Baseline: 2,448 tests passing, 20 skipped (111 files)

---

## CRITICAL & MATERIAL FINDINGS

### MATERIAL-1: No company income tax calculation
- **File:** `client/src/lib/financial/company-engine.ts`
- **Issue:** `DEFAULT_COMPANY_TAX_RATE` (30%) exists in `shared/constants.ts` but the company engine never applies it. Company `netIncome = totalRevenue - COGS - totalExpenses` with no tax deduction.
- **Impact:** Company net income and cumulative cash are overstated by the tax amount.

### MATERIAL-2: Partner count multiplier ignored by engine
- **File:** `client/src/lib/financial/company-engine.ts`
- **Schema fields:** `partnerCountYear1..10` in `globalAssumptions`
- **Issue:** Fields are defined in schema, editable in UI (`PartnerCompSection.tsx`), and persisted to DB, but the company engine never reads them. Partner comp = `partnerCompYearN / 12` without multiplying by partner count.
- **Impact:** If partner comp values represent per-person amounts, total is understated.

### MATERIAL-3: Inconsistent default constants in cross-validator
- **File:** `client/src/lib/audits/crossCalculatorValidation.ts:11-13`
- **Issue:** Local `DEFAULT_INTEREST_RATE = 0.07` and `DEFAULT_TERM_YEARS = 30` differ from shared constants (0.09 / 25). Could cause false ADVERSE opinions on properties without explicit financing terms.

### MATERIAL-4: Hardcoded fallback secret for Marcela tools
- **File:** `server/routes/marcela-tools.ts:14`
- **Issue:** `process.env.MARCELA_TOOLS_SECRET || "marcela-server-tools-key"` — predictable fallback on an unauthenticated endpoint that serves financial data.

---

## MEDIUM FINDINGS

### MED-1: Constants duplicated in 4 locations — FIXED
- Consolidated `DEFAULT_LTV`, `DEFAULT_INTEREST_RATE`, `DEFAULT_TERM_YEARS` into `shared/constants.ts`.
- All consumers (client, server checker, marcela-tools) now import from shared.

### MED-2: No NaN/Infinity guards in financial engine — FIXED
- Added `safeNum()` guard in `property-engine.ts` at key NaN risk points: monthly depreciation, ADR growth (`Math.pow`), fixed cost escalation, and PMT result.

### MED-3: `as any` in financial storage — PARTIALLY FIXED
- `server/routes/marcela-tools.ts` `computeSnapshot(p: any)` → `computeSnapshot(p: Property)` with proper import.
- `server/storage/financial.ts:128` — Drizzle ORM `as any` for batch insert retained (framework type limitation, low risk).

### MED-4: Export parity gaps — RECLASSIFIED
- **FinancingAnalysis** — Interactive calculator (DSCR, Debt Yield, Stress Test, Prepayment), not a financial statement page. Export parity N/A.
- **Scenarios** — Data management page (save/load/clone/compare JSON), not a financial statement page. Export parity N/A.
- **ExecutiveSummary** and **Dashboard IncomeStatementTab** — remaining gaps if they display financial statement data. Lower priority.

### MED-5: Company CSV bypasses `downloadCSV()` helper — FIXED
- `companyExports.ts` now imports and uses `downloadCSV()` from `csvExport.ts` with proper filename sanitization.

### MED-6: Company export filenames lack entity name — FIXED
- All company export functions (PDF, CSV, Chart PNG, Table PNG) now accept `companyName` parameter.
- Filenames now follow pattern: `${companyName} - ${statementType}.${ext}`.

### MED-7: Dual NOI base in cash flow aggregator — BY DESIGN
- `btcf` (Before-Tax Cash Flow = ANOI - debt service) is a standard real estate investment metric.
- `operatingCashFlow` (= Net Income + Depreciation) is GAAP ASC 230 indirect method.
- Both are correct for their respective purposes. No fix needed.

---

## LOW FINDINGS

### LOW-1: loadScenario GA query lacks ORDER BY
- `server/storage/financial.ts:94-98` — picks last array element without `orderBy(desc(id))`.

### LOW-2: Fee categories keyed by property name in scenarios
- Duplicate property names cause collision in scenario snapshots.

### LOW-3: No advisory lock on concurrent scenario loads
- Last-writer-wins with concurrent loads. Transaction prevents corruption but not conflicts.

### LOW-4: syncHelpers implicit userId null
- `syncHelpers.ts:175` — `createProperty` call doesn't explicitly set `userId: null`.

### LOW-5: "Update Password" button label
- `admin/UsersTab.tsx:482` — violates ui-patterns.md ("Save" required).

### LOW-6: User delete lacks confirmation dialog
- `admin/UsersTab.tsx:382` — no confirmation before delete.

### LOW-7: Companies/Groups delete use browser `confirm()`
- Inconsistent with LogosTab which uses styled Dialog.

### LOW-8: Research doc says 9 tools, actually 10
- Missing `compute_make_vs_buy` from documentation.

### LOW-9: `resolvePropertyValue()` no zero-cap-rate guard
- `calc/refinance/sizing.ts:20-21` — mitigated by upstream validation.

### LOW-10: Research tools use `roundCents` instead of policy rounding
- Inconsistent with `rounder()` used elsewhere. Low impact (research is informational).

---

## OBSERVATIONS (Not Bugs)

1. Partner comp year indexing uses model year, not company ops year
2. Marketing/miscOps rates not independently escalated (relies on revenue growth)
3. Consolidation sums equity rather than computing as residual
4. Weighted ADR/occupancy/RevPAR computed in dashboard layer, not consolidation module
5. NavigationTab/BrandingTab over-invalidate financial queries (write to shared GA table)
6. PostgreSQL `real` (4-byte float) may lose precision above $10M
7. `maintenanceCapex` field in aggregator is informational, not deducted from FCF
8. Redundant nullish coalescing on required fields in property engine (defensive coding)
9. ADR stored in output for pre-ops months (cosmetic)
10. Fixed cost escalation rate is global-only (no per-property override separate from inflation)
11. Refi transition year in `calculateYearlyDebtService` assumes full 12 months (mitigated — aggregator uses monthly data)
12. Client auditor validates engine output identities, not independent recalculation (by design — server does that)

---

## PHASE VERDICTS

| Phase | Verdict | Critical | Material | Medium | Low |
|-------|---------|----------|----------|--------|-----|
| 1. Financial Calculations | QUALIFIED | 0 | 3 | 1 | 2 |
| 2. Database Integrity | UNQUALIFIED | 0 | 0 | 0 | 4 |
| 3. Support Functionality | UNQUALIFIED | 0 | 0 | 0 | 0 |
| 4. Research System | UNQUALIFIED | 0 | 0 | 0 | 1 |
| 5. Export Quality | QUALIFIED | 0 | 0 | 3 | 1 |
| 6. Admin Functionality | UNQUALIFIED | 0 | 0 | 0 | 2 |
| 7. Production DB Protection | UNQUALIFIED | 0 | 0 | 0 | 1 |
| 8. Best Practices | QUALIFIED | 0 | 1 | 3 | 2 |

## OVERALL OPINION: QUALIFIED

The financial engine is architecturally sound with correct USALI waterfall, GAAP-compliant statements, and genuine independence between client engine and server checker. The two material financial findings (company tax and partner count) affect the management company entity only; all property-level calculations are correct. The security finding (Marcela tools secret) should be addressed immediately in production.

## RECOMMENDED FIX PRIORITY

1. **Immediate:** Set `MARCELA_TOOLS_SECRET` env var in production (MATERIAL-4)
2. **High:** Add company income tax to company engine (MATERIAL-1)
3. **High:** Resolve partner count multiplier — apply it or remove dead fields (MATERIAL-2)
4. **High:** Fix cross-validator constants to match shared constants (MATERIAL-3)
5. **Medium:** Add NaN guards to property engine (MED-2)
6. **Medium:** Add ExportMenu to FinancingAnalysis and Scenarios (MED-4)
7. **Medium:** Consolidate duplicated constants (MED-1)
8. **Low:** All LOW findings
