# User Manual — Hospitality Business Group Business Simulation Portal

## Purpose
This skill provides the complete User Manual content for the `/methodology` page. It explains the financial model, assumptions, calculations, and reporting standards to normal app users. The Checker Manual (`.claude/manuals/checker-manual/`) serves the parallel verification role for checker/admin users.

## Directory Structure

```
.claude/manuals/user-manual/
├── SKILL.md              ← This file (master index)
└── skills/               ← Narrative content files by section
    ├── 01-business-model.md
    ├── 02-business-rules.md
    ├── 03-capital-structure.md
    ├── 04-dynamic-behavior.md
    ├── 05-property-lifecycle.md
    ├── 06-defaults.md
    ├── 07-revenue.md
    ├── 08-expenses.md
    ├── 09-gop-noi.md
    ├── 10-debt-financing.md
    ├── 11-cash-flow.md
    ├── 12-balance-sheet.md
    ├── 13-returns.md
    ├── 14-mgmt-company.md
    ├── 15-fixed-assumptions.md
    └── 16-verification.md
```

## How to Use
1. **Start with** `skills/01-business-model.md` for the two-entity structure.
2. **Understand constraints** via `skills/02-business-rules.md` (7 mandatory rules).
3. **Review capital flow** in `skills/03-capital-structure.md`.
4. **Study calculations** in sections 07–13 (revenue through returns).
5. **Cross-reference formulas** in `.claude/manuals/checker-manual/formulas/` — the math is identical for both manuals; only the framing differs.
6. **Check constants** in `.claude/rules/constants-and-config.md` — all numeric values in the manual come from `shared/constants.ts` or `client/src/lib/constants.ts`.

## Relationship to Checker Manual
- **User Manual** (this): Explains concepts to investors/operators. Light theme. Accessible to all authenticated users.
- **Checker Manual** (`.claude/manuals/checker-manual/`): Provides verification procedures for auditors. Dark glass theme. Accessible to admin/checker users only.
- Both pages share the same UI components: `SectionCard`, `ManualTable`, `Callout` (from `client/src/components/ui/`).
- Formulas are NOT duplicated here — cross-reference `.claude/manuals/checker-manual/formulas/` for the exact math.

## Rendered In-App
The manual is rendered at `/methodology` (accessible to all authenticated users) with:
- Light theme using `SectionCard variant="light"`
- Collapsible sections driven by a `sections` array
- TOC sidebar for desktop navigation
- Constants-driven values (no hardcoded numbers)
- `data-testid` attributes on section toggles and TOC links

## Key Implementation Details
- **File**: `client/src/pages/Methodology.tsx`
- **Lazy loaded**: Via `React.lazy()` in `App.tsx`
- **Constants imported**: ~30 values from `@/lib/constants`
- **Formatting helpers**: `pct()` for "36%", `pct1()` for "8.5%"
- **Shared components**: `SectionCard`, `ManualTable`, `Callout` from `@/components/ui/`
