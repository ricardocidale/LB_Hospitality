# Entity Card Patterns Rule

## Rule

All admin and management pages that display collections of editable entities (companies, user groups, logos, asset descriptions, themes) must use the entity card pattern system. Consistency across card layouts ensures a polished, recognizable UI and reduces visual drift.

## Card Levels

1. **Container Card** (Level 1) — Section wrapper with `bg-white/80 backdrop-blur-xl border-primary/20`. Contains header (icon + title + add button) and content area.
2. **Featured Entity Card** (Level 2) — Singleton inline editing card with `bg-gradient-to-br from-primary/5 to-primary/10`. Used for Management Company and other one-of-a-kind entities.
3. **Entity Item Card** (Level 3) — Individual item inside a container. Uses `bg-primary/5 border border-primary/20 rounded-xl p-4` with logo thumbnail, name, badges, and CRUD actions.

## Mandatory Elements

| Element | Required | Location |
|---------|----------|----------|
| Icon in title | Yes | CardTitle, left of text |
| `font-display` on title | Yes | CardTitle class |
| `label-text` on description | Yes | CardDescription class |
| Empty state with icon | Yes | When entity list is empty |
| `data-testid` on cards | Yes | `{entity}-card-${id}` |
| `data-testid` on actions | Yes | `button-edit-{entity}-${id}`, etc. |
| Logo thumbnail or fallback | Yes | Every entity that has a logo field |
| Type badge | Yes | When entity has a type/category |
| Color-coded accents | Yes | Different entity types use different accent colors |

## Enforcement

- Architect reviews must check new admin sections against this rule
- Any new entity management section must follow the three-level card hierarchy
- Logo selectors must show inline preview thumbnails in dropdown items
- Delete actions must use confirmation dialogs

## Related Skill

- `.claude/skills/ui/entity-cards.md` — Full card pattern reference with code examples
