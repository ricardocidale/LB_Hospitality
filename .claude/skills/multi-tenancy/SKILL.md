---
name: multi-tenancy
description: >
  Multi-tenant branding system: users, user groups, themes, logos, asset descriptions,
  and company names. Use when managing branding, user assignment, themes, or any
  group-level customization.
---

# Multi-Tenancy & Branding System

## Overview

Branding flows through User Groups, not individual users:
```
User → User Group → Default Fallback
```

Every user belongs to exactly one User Group. Every User Group defines company branding (name, logo, theme, asset description). Users inherit all branding from their group.

## Entities

### 1. Users

**Table:** `users`

| Field | Type | Description |
|-------|------|-------------|
| id | integer (auto) | Primary key |
| email | text (unique) | Login identifier |
| passwordHash | text | bcrypt hash |
| role | text | `admin`, `checker`, or `user` |
| name | text? | Display name |
| company | text? | Legacy company field |
| title | text? | Job title |
| userGroupId | integer? | FK to user_groups (always set) |
| createdAt | timestamp | Auto |
| updatedAt | timestamp | Auto |

**Invariants:**
- Every user must belong to a user group (enforced on startup via seed)
- New users are assigned to the default group ("General") automatically
- Users cannot have per-user branding overrides; branding comes from the group

**Schema:** `shared/schema.ts` (users table)
**Storage:** `server/storage.ts` (getUser, createUser, updateUser, etc.)

### 2. User Groups

**Table:** `user_groups`

| Field | Type | Description |
|-------|------|-------------|
| id | integer (auto) | Primary key |
| name | text | Group display name (e.g., "KIT Group", "General") |
| companyName | text | Company name shown in portal UI |
| logoId | integer? | FK to logos table |
| themeId | integer? | FK to design_themes table |
| assetDescriptionId | integer? | FK to asset_descriptions table |
| isDefault | boolean | Exactly one group is default (the "General" group) |
| createdAt | timestamp | Auto |

**Invariants:**
- Exactly one group has `isDefault = true` (the "General" group)
- The default group cannot be deleted
- When a non-default group is deleted, its users are moved to the default group
- All users without a group are auto-assigned to the default group on startup
- Company name from the group is displayed throughout the portal for users in that group

**Seed behavior:**
- On startup, if no default group exists, a "General" group is created with company name "Hospitality Business Group"
- All unassigned users are moved to the default group

**Admin UI:** User Groups tab in Admin page
- Create/edit groups with name, company name, logo, theme, asset description
- Default group shows "Default" badge and cannot be deleted
- Users can be assigned to groups via the Users tab

### 3. Design Themes

**Table:** `design_themes`

| Field | Type | Description |
|-------|------|-------------|
| id | integer (auto) | Primary key |
| name | text | Theme display name |
| description | text | Theme description |
| colors | jsonb (DesignColor[]) | Array of color definitions |
| isDefault | boolean | Exactly one theme is default |
| createdAt | timestamp | Auto |
| updatedAt | timestamp | Auto |

**DesignColor structure:**
```typescript
interface DesignColor {
  rank: number;
  name: string;
  hexCode: string;
  description: string;
}
```

**Invariants:**
- Themes are standalone entities (not owned by any user)
- Exactly one theme has `isDefault = true`
- The default theme cannot be deleted
- Themes are assigned to User Groups, not to individual users
- Any group without a themeId uses the default theme
- Themes can be created, edited (name + colors), and deleted (except default)

**Admin UI:** Themes tab in Admin page (standalone CRUD)
- Create new themes with name, description, colors
- Edit existing themes
- Delete non-default themes
- Default theme shows "Default" badge

### 4. Logos

**Table:** `logos`

| Field | Type | Description |
|-------|------|-------------|
| id | integer (auto) | Primary key |
| name | text | Logo display name |
| url | text | Path or URL to logo image |
| isDefault | boolean | Exactly one logo is default |
| createdAt | timestamp | Auto |

**Invariants:**
- Logos are standalone, reusable entities
- Exactly one logo has `isDefault = true`
- The default logo cannot be deleted
- Logos are assigned to User Groups
- Any group without a logoId uses the default logo

### 5. Asset Descriptions

**Table:** `asset_descriptions`

| Field | Type | Description |
|-------|------|-------------|
| id | integer (auto) | Primary key |
| name | text | Display name (e.g., "Luxury Boutique Hotels & Wellness") |
| isDefault | boolean | Exactly one is default |
| createdAt | timestamp | Auto |

**Invariants:**
- Asset descriptions are standalone, reusable entities
- Exactly one has `isDefault = true`
- Assigned to User Groups, inherited by users in that group

## Branding Resolution

The `/api/my-branding` endpoint resolves branding for the authenticated user:

```
1. Get user's userGroupId
2. If group exists:
   - companyName = group.companyName
   - logo = group.logoId → logos table (or default logo)
   - theme = group.themeId → design_themes table (or default theme)
   - assetDescription = group.assetDescriptionId → asset_descriptions table (or default)
3. If no group (should not happen):
   - Fall back to defaults for everything
```

## API Routes

### User Groups
- `GET /api/admin/user-groups` — List all groups
- `POST /api/admin/user-groups` — Create group
- `PATCH /api/admin/user-groups/:id` — Update group
- `DELETE /api/admin/user-groups/:id` — Delete group (400 if default)
- `PATCH /api/admin/users/:id/group` — Assign user to group

### Themes
- `GET /api/design-themes` — List all themes
- `GET /api/design-themes/:id` — Get single theme
- `POST /api/admin/design-themes` — Create theme (admin only)
- `PATCH /api/admin/design-themes/:id` — Update theme
- `DELETE /api/admin/design-themes/:id` — Delete theme (400 if default)

### Logos
- `GET /api/admin/logos` — List all logos
- `POST /api/admin/logos` — Create logo
- `PATCH /api/admin/logos/:id` — Update logo
- `DELETE /api/admin/logos/:id` — Delete logo (400 if default)

### Branding
- `GET /api/my-branding` — Resolve current user's branding from group

## File Locations

| What | Where |
|------|-------|
| Schema definitions | `shared/schema.ts` |
| Storage layer | `server/storage.ts` |
| API routes | `server/routes.ts` |
| Seed data | `server/seed.ts` |
| Admin UI | `client/src/pages/Admin.tsx` |
| Theme manager component | `client/src/features/design-themes/ThemeManager.tsx` |
| Theme types | `client/src/features/design-themes/types.ts` |
| Theme engine skill | `.claude/skills/ui/theme-engine.md` |
| This skill | `.claude/skills/multi-tenancy/SKILL.md` |

## Key Design Decisions

1. **No per-user branding** — Branding is always group-level. This simplifies admin workflow and ensures consistency.
2. **Default group is mandatory** — The "General" group always exists and cannot be deleted. New users land here.
3. **Default theme is mandatory** — At least one theme always exists. Groups without an explicit theme get the default.
4. **Deletion cascades to default** — Deleting a non-default group moves its users to the default group.
5. **Standalone entities** — Themes, logos, and asset descriptions are not owned by users or groups. They are shared resources that groups reference.
