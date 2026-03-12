# Testing Strategy

## Rule

All financial logic, API routes handling mutations, and calculation tools must have test coverage. Tests validate correctness, not implementation details. The proof system is the final gate — no release may proceed with failing proof tests.

## Test Categories

| Category | Directory | Purpose | Required For |
|----------|-----------|---------|-------------|
| **Proof tests** | `tests/proof/` | Invariant enforcement — financial identities, domain boundaries, data integrity | Every release |
| **Engine tests** | `tests/engine/` | Financial calculation correctness — golden scenarios, edge cases | Any financial change |
| **Calc tool tests** | `tests/calc/` | Deterministic tool input/output verification | Any tool change |
| **Integration tests** | `tests/integration/` | API route behavior, storage operations | Route or storage changes |

## When Tests Are Required

### Must Have Tests

- Any change to `calc/` — every tool must have matching tests in `tests/calc/`
- Any change to `financialEngine.ts`, `calculationChecker.ts`, `loanCalculations.ts` — run `tests/engine/`
- Any new proof invariant — add to `tests/proof/`
- Any new API route that mutates data — add integration test

### Tests Not Required

- CSS/styling changes
- Documentation updates
- Admin UI layout changes (unless they affect data flow)
- Theme/branding changes

## Golden Scenario Pattern

Financial tests should use golden scenarios — hand-calculated expected values at the top of the test file:

```typescript
const GOLDEN = {
  year1Revenue: 1_825_000,
  year1NOI: 730_000,
  exitValue: 12_166_667,
};

it("matches golden revenue", () => {
  expect(result.year1Revenue).toBeCloseTo(GOLDEN.year1Revenue, 0);
});
```

Use 0% growth/inflation in golden scenarios for traceability. Test both values and identities (e.g., `GOP = Revenue - OpEx`).

## Running Tests

```bash
npm run test:summary          # All tests
npm run test:file -- <path>   # Single file
npm run verify:summary        # Proof suite (must show UNQUALIFIED)
```

## Test Quality Standards

- Tests must be deterministic — no random data, no timing dependencies
- Financial tests use `toBeCloseTo` for floating-point comparisons
- Test names describe the business rule, not the implementation: "NOI equals GOP minus fees and taxes" not "function returns correct number"
- Proof tests run automatically in the verification pipeline — failures produce ADVERSE opinion
