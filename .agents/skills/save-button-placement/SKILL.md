---
name: save-button-placement
description: Rules for placing Save Changes buttons consistently across the app. Covers the SaveButton component API, three placement patterns (PageHeader actions, bottom-of-form, tab/section level), dirty-tracking flow, and dialog exceptions. Use when adding save buttons, form submission buttons, or save changes functionality to any page.
---

# Save Button Placement

Three patterns: (A) PageHeader actions (primary), (B) bottom-of-form mirror for long pages, (C) tab/section level for settings. SaveButton component in `client/src/components/ui/save-button.tsx`. Dirty-tracking via local draft state + TanStack Query mutations. Dialogs use standard Button, not SaveButton.

**Canonical reference:** `.claude/skills/ui/save-button-placement.md`

See also: `.claude/skills/design-system/SKILL.md` (form patterns), `.claude/skills/ui/consistent-card-widths.md` (layout conventions)
