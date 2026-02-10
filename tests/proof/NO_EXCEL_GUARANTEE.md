# No-Excel Guarantee Checklist

Every item below is enforced by automated tests. If any check fails, the build is blocked.

## Enforced by `npm test` (355 tests)

| # | Guarantee | Enforcing Test |
|---|-----------|---------------|
| 1 | All calculations flow from assumptions → constants → calculators → statements (no ad-hoc math) | `tests/proof/hardcoded-detection.test.ts` |
| 2 | No magic numbers in finance-critical calculation paths (only `constants.ts` or assumptions) | `tests/proof/hardcoded-detection.test.ts` |
| 3 | Balance sheet balances every period (Assets = Liabilities + Equity) | `tests/proof/scenarios.test.ts` |
| 4 | Cash flow statement ties to change in cash every period | `tests/proof/scenarios.test.ts` |
| 5 | Debt roll-forward ties to debt schedule | `tests/proof/scenarios.test.ts` |
| 6 | Equity roll-forward ties to contributions/distributions | `tests/proof/scenarios.test.ts` |
| 7 | Intercompany matching: management fee revenue = property fee expense per period | `tests/proof/scenarios.test.ts` |
| 8 | Consolidated eliminations: intercompany amounts net to zero | `tests/proof/scenarios.test.ts` |
| 9 | Monthly → yearly rollup correctness | `tests/engine/proforma-golden.test.ts` |
| 10 | Depreciation follows 27.5-year straight-line per IRS Pub 946 | `tests/engine/proforma-golden.test.ts` |
| 11 | Loan amortization matches PMT formula | `tests/financing/sizing.test.ts` |
| 12 | Refinance payoff and sizing calculations correct | `tests/refinance/payoff.test.ts`, `tests/refinance/sizing.test.ts` |
| 13 | IRR computation via Newton-Raphson matches expected values | `tests/analytics/irr.test.ts` |
| 14 | FCF derivation from NOI is correct | `tests/analytics/fcf.test.ts` |
| 15 | Income statement line items tie to engine outputs | `tests/statements/income-statement.test.ts` |
| 16 | Cash flow statement sections reconcile | `tests/statements/cash-flow.test.ts` |
| 17 | Cross-statement reconciliation passes | `tests/statements/reconcile.test.ts` |

## Golden Scenario Coverage

| Scenario | What It Proves |
|----------|---------------|
| Cash purchase (no debt ever) | Pure equity model, no loan paths active |
| Financed purchase (LTV binding) | Debt sizing, amortization, DSCR, debt service |
| Cash purchase → refinance year 3 | Refi mechanics, cash-out, loan swap, payoff |
| Portfolio aggregate (no eliminations) | Multi-property aggregation, fee linkage without consolidation |
| Consolidated with eliminations | Full intercompany elimination, consolidated statements |

## Reconciliation Artifacts

For every golden scenario, `test-artifacts/` contains:
- **JSON**: Machine-readable reconciliation data
- **Markdown**: Human-readable proof report covering:
  - Sources & Uses at acquisition
  - NOI → FCF bridge
  - Begin Cash → End Cash bridge
  - Debt schedule reconciliation
  - Intercompany elimination summary

## Commands

```bash
npm test                  # Run all 355 tests
npm run verify            # Full 4-phase verification (UNQUALIFIED = pass)
npx vitest run --watch    # Watch mode for development
```

## Audit Opinion

The verification runner (`npm run verify`) outputs one of:
- **UNQUALIFIED** — All checks pass. No human verification needed.
- **QUALIFIED** — Minor issues detected. Review required.
- **ADVERSE** — Critical failures. Do not ship.

Only UNQUALIFIED is acceptable for production.
