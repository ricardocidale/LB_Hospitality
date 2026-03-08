# Research Precision & Deterministic Tools

## Rule

Research skills must be focused and minimal. Any calculation expressible as a formula MUST use a deterministic tool in `calc/research/` — never LLM arithmetic.

## Four Principles

1. **One skill = one dimension** (ADR, occupancy, costs, etc.) — no boilerplate; asset context is injected by `aiResearch.ts`
2. **Math is deterministic** — LLM calls the tool, gets exact numbers, then interprets. LLM handles market knowledge, not arithmetic.
3. **Helpers prevent duplication** — parsing logic, confidence scoring centralized in `server/aiResearch.ts`
4. **New tools must be registered** — schema in `.claude/tools/research/`, implementation in `calc/research/`, registered in `calc/dispatch.ts`

## Deterministic Tools (7)

`compute_property_metrics`, `compute_depreciation_basis`, `compute_debt_capacity`, `compute_occupancy_ramp`, `compute_adr_projection`, `compute_cap_rate_valuation`, `compute_cost_benchmarks`

Reference: `.claude/skills/research/SKILL.md` for full input/output specs.

## Post-LLM Validation

`validateResearchValues()` in `calc/research/validate-research.ts` runs bounds checks + cross-validation after extraction. Attaches `_validation` summary to content. Warnings don't block storage.

## When Adding Research Skills

- Keep skill under 60 lines; include `confidence` field on every recommended value
- Output schema must match `extractResearchValues()` in `aiResearch.ts`
- Add unit tests in `tests/calc/`
