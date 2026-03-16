---
name: financial-engine
description: The technical contract for the deterministic financial calculation engines. Covers the dual-engine architecture (Property Engine + Company Engine), pipeline stages, calc module taxonomy, return metrics, financial statements, consolidated reporting, and TypeScript type contracts. Use this skill whenever working on financial calculations, engine inputs/outputs, pro forma generation, or return metric computation.
---

# Financial Engine

Deterministic financial calculation engines powering the HBG Portal. Dual-engine architecture: Property Engine (single-property monthly pro forma) and Company Engine (ManCo P&L). Independent server-side verification checker ensures accuracy. No AI approximations permitted — every number traceable to a formula.

Key areas: 8-step monthly pipeline, USALI waterfall, debt service, depreciation (straight-line + cost segregation), NOL carryforward, refinance post-processing, SAFE funding, yearly aggregation.

**Canonical reference:** `.claude/skills/finance/SKILL.md`

See also: `.claude/skills/proof-system/SKILL.md` (verification), `.claude/skills/architecture/SKILL.md` (server architecture)
