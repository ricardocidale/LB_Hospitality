---
name: context-loading
description: Token-efficient context loading protocol. Maps common task types to the minimum required skills. Load this first to determine which other skills are needed.
---

# Context Loading Protocol

## Purpose
With 80+ skill files (~15,000 lines), loading everything wastes tokens and slows responses. This skill maps common task types to the **minimum required** skill set, ensuring fast, focused sessions.

## Golden Rule
**Load `claude.md` first (always loaded automatically). Then load only the skills needed for the current task. Never load all skills at once.**

## Task-to-Skill Map

### Tier 1: Always Loaded (automatic)
- `claude.md` — Master doc, skill router, user preferences, project state

### Tier 2: Load by Task Type

#### Financial Calculations & Engine Work
| Task | Load These Skills | Skip |
|------|------------------|------|
| Fix/modify income statement | `finance/income-statement.md`, `rules/financial-engine.md` | UI skills, research |
| Fix/modify cash flow statement | `finance/cash-flow-statement.md`, `finance/cash-line-architecture.md` | UI skills, research |
| Fix/modify balance sheet | `finance/balance-sheet.md`, `finance/cross-statement-reference.md` | UI skills, research |
| IRR/NPV/returns calculation | `finance/irr-analysis.md`, `finance/dcf-analysis.md` | UI skills, statements |
| Debt/financing/refinancing | `finance/calculation-chain.md`, `rules/financial-engine.md` | UI skills, research |
| Fee linkage / consolidation | `finance/fee-linkage.md`, `finance/consolidation.md` | UI skills, exports |
| Management company pro forma | `finance/fee-linkage.md`, `testing/management-company.md` | Property-level skills |
| Full financial statements build | `finance/financial-statements-construction.md` | Individual statement skills (it's comprehensive) |
| Any finance change | **Always also load**: `rules/audit-persona.md`, `proof-system/SKILL.md` | — |

#### Testing & Verification
| Task | Load These Skills | Skip |
|------|------------------|------|
| Run/fix tests | `testing/SKILL.md` (master), then the relevant sub-skill | All finance/UI skills |
| Add new test suite | `testing/SKILL.md`, `proof-system/SKILL.md` | UI skills |
| Fix failing property tests | `testing/property-statements.md` | Consolidated/mgmt skills |
| Fix failing consolidated tests | `testing/consolidated-statements.md` | Property-level skills |
| Fix failing management co tests | `testing/management-company.md` | Property-level skills |
| Verification / audit opinion | `proof-system/SKILL.md` | Individual testing sub-skills |

#### UI & Visual Work
| Task | Load These Skills | Skip |
|------|------------------|------|
| New page or component | `component-library/SKILL.md`, `ui/theme-engine.md` | Finance skills, research |
| Chart work | `ui/charts.md`, `component-library/SKILL.md` | Finance skills, testing |
| Graphics enhancement | `ui/graphics-component-catalog.md`, `ui/page-enhancement-checklist.md`, `rules/graphics-rich-design.md` | Finance skills |
| Animation patterns | `ui/animation-patterns.md`, `ui/graphics-component-catalog.md` | Finance skills, testing |
| Financial table styling | `ui/financial-table-styling.md`, `ui/theme-engine.md` | Finance engine skills |
| Navigation / sidebar | `ui/navigation.md`, `component-library/SKILL.md` | Finance skills |
| Export UI (buttons, menus) | `exports/SKILL.md`, `component-library/SKILL.md` | Finance skills |
| 3D graphics / animations | `3d-graphics/SKILL.md`, `ui/animation-patterns.md` | Everything else |
| Theme changes | `ui/theme-engine.md`, `design-system/SKILL.md` | Finance skills |
| Branding / user groups / logos | `multi-tenancy/SKILL.md` | Finance skills |
| User management / roles | `multi-tenancy/SKILL.md` | Finance skills |
| Accordion/formula rows | `ui/help-tooltip.md`, `ui/financial-table-styling.md` | Finance engine skills |
| Info/help icon work | `ui/info-icons.md`, `ui/help-tooltip.md` | Finance skills |
| Tabbed/composite pages | `ui/composite-tabbed-pages.md` | Finance skills |

#### Export Work
| Task | Load These Skills | Skip |
|------|------------------|------|
| Excel export | `exports/excel-export.md` | Other export skills |
| PDF export | `exports/pdf-chart-export.md` | Other export skills |
| PNG export | `exports/png-export.md` | Other export skills |
| PowerPoint export | `exports/pptx-export.md` | Other export skills |
| Any export change | `exports/SKILL.md` (master) | Finance engine skills |

#### Research & AI
| Task | Load These Skills | Skip |
|------|------------------|------|
| Research system architecture | `research/SKILL.md` (master) | Individual analysis skills |
| Property market research | `research/SKILL.md`, the specific analysis skill | Finance engine, UI |
| ADR benchmarking | `research/adr-analysis/SKILL.md` | Other research skills |
| Company research | `research/company-research/SKILL.md` | Property research skills |
| Auto-refresh on login | `research/auto-refresh/SKILL.md` | All other research skills |
| Location-aware seeding | `research/location-aware-seeding/SKILL.md` | Analysis skills |
| Research badge data flow | `ui/research-badges.md`, `research/SKILL.md` | Analysis skills |
| Any research change | **Always also load**: `research/SKILL.md` (master) | — |

#### Database & Infrastructure
| Task | Load These Skills | Skip |
|------|------------------|------|
| Schema changes / migrations | `database-environments/SKILL.md`, `rules/database-seeding.md` | Finance, UI skills |
| API route changes | `rules/api-routes.md`, `architecture/SKILL.md` | UI skills |
| Seed data changes | `rules/database-seeding.md` | Finance engine skills |

#### Documentation & Skills
| Task | Load These Skills | Skip |
|------|------------------|------|
| Update checker manual | `manuals/checker-manual/SKILL.md` | Finance engine, UI |
| Update user manual | `manuals/user-manual/SKILL.md` | Finance engine, UI |
| Create new skill | `coding-conventions/SKILL.md`, `rules/skill-organization.md` | Unrelated domain skills |
| Reorganize skills/rules | `rules/skill-organization.md`, `context-loading/SKILL.md` | Finance, UI skills |
| Audit folder structure | `rules/skill-organization.md`, `source-code/SKILL.md` | Finance, UI skills |

## Loading Tiers by Request Complexity

### Quick Fix (1-2 skills)
User asks to fix a specific bug, tweak a label, adjust a color.
→ Load only the directly relevant skill. Skip everything else.

### Feature Work (2-4 skills)
User asks to add or modify a feature.
→ Load the domain skill + component library + any cross-cutting rules.

### Cross-Domain Work (4-6 skills)
User asks for something that spans finance + UI + testing.
→ Load the minimum from each domain. Use the table above.

### Full Audit (6+ skills)
User asks for verification, release prep, or comprehensive review.
→ Load proof-system, testing master, relevant finance skills, and audit rules.

## Anti-Patterns (Token Waste)

| Don't Do This | Do This Instead |
|---------------|-----------------|
| Load all 16 finance skills for an IS fix | Load `finance/income-statement.md` only |
| Load all 18 UI skills for a button change | Load `component-library/SKILL.md` only |
| Load testing skills for a UI change | Skip testing unless the change affects calculations |
| Load research skills for a finance fix | Skip research entirely |
| Load source-code/SKILL.md (814 lines) routinely | Only load when you need a full file map |
| Read all 15 checker manual sections | Read only the section relevant to the task |

## Session Start Checklist

1. Read `claude.md` (auto-loaded via `replit.md`)
2. Identify the task type from the user's request
3. Look up the minimum skill set in the table above
4. Load only those skills
5. If unsure, start with the domain SKILL.md and drill into sub-skills as needed
6. After completing work, update only the skills you loaded (don't update unrelated skills)

## Cross-References
- Skill Router: `claude.md` § Skill Router
- All skills: `.claude/skills/` (15 directories, 80+ files)
- Rules: `.claude/rules/` (15 files)
- Manuals: `.claude/manuals/` (2 manuals, 31 sections total)
