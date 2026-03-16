---
name: verification-system
description: The three-tier financial verification and audit opinion system. Covers the independent server-side calculation checker, property/company/consolidated verification tiers, GAAP compliance checks, audit opinions, workpaper generation, and the AI review panel. Use this skill when working on verification, audit, financial validation, or checker-related features.
---

# Verification System

Three-tier independent verification: Property-level (revenue, GOP, NOI, debt, balance sheet A=L+E), Company-level (fee roll-up, staffing, SAFE funding), and Consolidated (intercompany elimination per ASC 810). Issues formal audit opinions: UNQUALIFIED / QUALIFIED / ADVERSE / DISCLAIMER. Server checker never shares code with client engines.

Key files: `server/calculation-checker/` (index, property-checks, portfolio-checks, gaap-checks).

**Canonical reference:** `.claude/skills/proof-system/SKILL.md` and `.claude/skills/proof-system/verification-system.md`

See also: `.claude/skills/finance/SKILL.md` (what gets verified), `.claude/skills/marcela-ai/SKILL.md` (AI narration of results)
