---
name: admin-components
description: Admin panel component architecture, shared hooks, styles, and reusable components. Use when creating or modifying any admin tab, adding new admin sections, or working with admin UI patterns.
---

# Admin Panel Components

## Architecture

The admin panel uses a **5-group sidebar layout** (`AdminSidebar.tsx`) with these groups:

| Group | Sections |
|-------|----------|
| People | Users, Groups, Activity |
| Platform | Branding, Themes, Logos, Navigation |
| Business | Companies, Services, Market Rates |
| AI Agent | Marcela |
| System | Verification, Database |

`Admin.tsx` renders the sidebar + a content area. Each section maps to a standalone component in `client/src/components/admin/`.

## Shared Helpers

### Hooks (`client/src/components/admin/hooks.ts`)

```typescript
import { useAdminLogos, useAdminUsers, useAdminCompanies, useGlobalAssumptions, useUpdateGlobalAssumptions, adminFetch, adminMutate } from "./hooks";
```

- `adminFetch<T>(url, errorMsg)` — returns a query function for `useQuery`
- `adminMutate(url, method)` — returns a mutation function for `useMutation`
- `useAdminLogos()` — fetches logo portfolio
- `useAdminUsers()` — fetches user list
- `useAdminCompanies()` — fetches company list
- `useGlobalAssumptions()` — fetches global settings
- `useUpdateGlobalAssumptions()` — mutation for updating global settings (auto-invalidates financial queries)

### Styles (`client/src/components/admin/styles.ts`)

```typescript
import { ADMIN_CARD, ADMIN_LINK_CARD, ADMIN_LINK_ICON, ADMIN_TEXTAREA, LOGO_PREVIEW } from "./styles";
```

- `ADMIN_CARD` — glassmorphism card class used on all admin cards
- `ADMIN_LINK_CARD` — navigation link card style
- `ADMIN_LINK_ICON` — icon container in link cards
- `ADMIN_TEXTAREA` — styled textarea for admin forms
- `LOGO_PREVIEW` — logo thumbnail container

### Reusable Components

#### LogoSelector (`client/src/components/admin/LogoSelector.tsx`)

Drop-in logo picker that fetches from the logo portfolio:

```tsx
import LogoSelector from "./LogoSelector";

<LogoSelector
  label="Asset Logo"
  value={globalAssumptions?.assetLogoId}
  onChange={(logoId) => updateMutation.mutate({ assetLogoId: logoId })}
  emptyLabel="No Logo"
  helpText="Select from Logo Portfolio"
  testId="select-asset-logo"
/>
```

Props: `label`, `value`, `onChange`, `emptyLabel`, `helpText`, `testId`, `fallbackUrl`

## Conventions

1. Every admin tab is self-sufficient — owns its own data fetching via TanStack Query
2. Card class: always use `ADMIN_CARD` constant
3. Mutations show toast on success/error via `useToast()`
4. All interactive elements need `data-testid` attributes
5. Icons from `lucide-react`, titles use `font-display` class
6. Button labels: always "Save", never "Update"

## Adding a New Admin Section

1. Create component in `client/src/components/admin/NewTab.tsx`
2. Use hooks from `./hooks` for data fetching
3. Use `ADMIN_CARD` from `./styles` for card containers
4. Add section to `AdminSidebar.tsx` (type + config)
5. Add rendering case in `Admin.tsx`
6. Export from `./index.ts`

## Types (`client/src/components/admin/types.ts`)

Shared interfaces: `User`, `Logo`, `UserGroup`, `AdminCompany`, `LoginLog`, `ActiveSession`, `ActivityLogEntry`, `CheckerSummary`, `VerificationHistoryEntry`, `DesignCheckResult`, `AssetDesc`

## Image Generation

The `AIImagePicker` component (`client/src/components/ui/ai-image-picker.tsx`) uses:
- `POST /api/generate-property-image` — generates via Nano Banana (Gemini) with OpenAI fallback, uploads to object storage, returns `{ objectPath }`
- `POST /api/generate-image` — returns raw `{ url, b64_json }` without storage upload
- Upload flow uses presigned URLs via `POST /api/uploads/request-url`

Server routes: `server/replit_integrations/image/routes.ts`
Image client: `server/replit_integrations/image/client.ts`
