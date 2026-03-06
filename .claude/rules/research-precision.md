# Research Precision & Deterministic Tools

## Rule

Every research skill must be focused, minimal, and prefer deterministic computation over LLM inference wherever math is involved. This reduces context window cost, improves accuracy, and makes research outputs reproducible.

## Principles

### 1. Skills Must Be Focused
- Each skill file covers ONE analysis dimension (ADR, occupancy, costs, etc.)
- Remove repeated boilerplate — shared context (asset type, property label) is injected by the system prompt builder in `aiResearch.ts`, not duplicated in every skill
- Output schemas are the critical section — keep them precise and complete
- Quality standards: 2-3 bullets max, not paragraphs

### 2. Deterministic Tools Over LLM Math
- Any calculation that can be expressed as a formula MUST be a deterministic tool in `calc/research/`
- The LLM calls the tool, gets exact numbers, then interprets and contextualizes
- Examples of what MUST be deterministic:
  - Depreciation basis and monthly depreciation
  - RevPAR from ADR and occupancy
  - Room revenue from rooms, ADR, occupancy
  - NOI margin from revenue and expenses
  - Cost benchmarks (dollar amounts from rates and revenue)
  - Debt capacity from NOI and DSCR
- The LLM's job is market knowledge, comparables, and judgment — NOT arithmetic

### 3. Helper Functions Reduce Duplication
- Common parsing logic (ranges, percentages, rates) lives in `server/aiResearch.ts` helpers
- Tool prompt builders share patterns via helper functions, not copy-paste
- Confidence scoring logic is centralized, not per-skill

### 4. New Tools Must Be Registered
- Tool schema (JSON) goes in `.claude/tools/research/` or the skill's `tools/` subdirectory
- Implementation goes in `calc/research/` with a pure function
- Register in `calc/dispatch.ts` TOOL_DISPATCH map
- Add to `aiResearch.ts` tool loading if in a non-standard directory

## Deterministic Research Tools

| Tool | Input | Output | Purpose |
|------|-------|--------|---------|
| `compute_property_metrics` | rooms, ADR, occupancy, costRates | RevPAR, room revenue, total revenue, GOP, NOI margin | Validate research recommendations against actual property math |
| `compute_depreciation_basis` | purchasePrice, landValuePct, improvements | depreciableBasis, monthlyDepreciation, annualDepreciation | Exact IRS depreciation for land value analysis |
| `compute_debt_capacity` | noi, dscrTarget, interestRate, termYears | maxLoan, maxLTV (given property value), annualDebtService | Size debt from NOI for financing research |

## When Adding Research Skills

1. Check if any part of the analysis is pure math → make it a deterministic tool
2. Keep the skill under 60 lines (excluding YAML frontmatter)
3. Do NOT repeat the asset type paragraph — it's in the system prompt
4. Include `confidence` field in every output schema object that has a recommended value
5. Output schema must match what `extractResearchValues()` in `aiResearch.ts` expects

## Verification

- All deterministic tools must have unit tests in `tests/calc/`
- Research skills are loaded as system prompts — measure their token cost and minimize
- `extractResearchValues()` must handle all output schema fields from all skills
