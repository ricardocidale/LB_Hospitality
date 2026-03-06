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

## Shared Hooks (`client/src/components/admin/hooks.ts`)

```typescript
import {
  adminFetch, adminMutate,
  useAdminLogos, useAdminUsers, useAdminCompanies,
  useGlobalAssumptions, useUpdateGlobalAssumptions,
  useCreateLogo, useDeleteLogo,
  useEnhanceLogoPrompt, useGenerateLogoImage,
} from "./hooks";
```

### Data Fetching
- `adminFetch<T>(url, errorMsg)` — returns a query function for `useQuery`
- `useAdminLogos()` — fetches logo portfolio (`Logo[]`)
- `useAdminUsers()` — fetches user list (`User[]`)
- `useAdminCompanies()` — fetches company list (`AdminCompany[]`)
- `useGlobalAssumptions()` — fetches global settings

### Mutations
- `adminMutate(url, method)` — returns a mutation function for `useMutation`
- `useUpdateGlobalAssumptions()` — updates global settings (auto-invalidates financial queries, toasts on error)
- `useCreateLogo()` — creates a logo (auto-invalidates logos + branding queries, toasts on success/error)
- `useDeleteLogo()` — deletes a logo by ID (auto-invalidates, toasts)

### AI Hooks
- `useEnhanceLogoPrompt()` — returns `{ enhance(prompt): Promise<string | null>, isEnhancing }`. Calls `POST /api/enhance-logo-prompt` (Gemini).
- `useGenerateLogoImage()` — returns `{ generate(prompt): Promise<string | null>, isGenerating }`. Calls `POST /api/generate-property-image` (Nano Banana).

**Rule:** All admin tabs must use shared hooks from `hooks.ts`. No inline `fetch()` calls for standard admin CRUD.

## Shared Styles (`client/src/components/admin/styles.ts`)

```typescript
import { ADMIN_CARD, ADMIN_LINK_CARD, ADMIN_LINK_ICON, ADMIN_TEXTAREA, LOGO_PREVIEW, ADMIN_DIALOG } from "./styles";
```

- `ADMIN_CARD` — glassmorphism card class for all admin cards
- `ADMIN_LINK_CARD` — navigation link card style
- `ADMIN_LINK_ICON` — icon container in link cards
- `ADMIN_TEXTAREA` — styled textarea for admin forms (non-bold, gray-700 text)
- `LOGO_PREVIEW` — logo thumbnail container (14x14 rounded with dashed border)
- `ADMIN_DIALOG` — dialog width class (`sm:max-w-lg`)

## Reusable Components

### LogoSelector (`client/src/components/admin/LogoSelector.tsx`)

Drop-in logo picker with thumbnail preview. Uses `useAdminLogos()` internally.

```tsx
import LogoSelector from "./LogoSelector";

// With "No Logo" option (default)
<LogoSelector
  label="Company Logo"
  value={globalAssumptions?.companyLogoId ?? null}
  onChange={(logoId) => mutation.mutate({ companyLogoId: logoId })}
  showNone={true}
  emptyLabel="Default Logo"
  testId="select-company-logo"
/>

// Without "No Logo", falls back to default logo entry
<LogoSelector
  label="Asset Logo"
  value={globalAssumptions?.assetLogoId ?? null}
  onChange={(logoId) => mutation.mutate({ assetLogoId: logoId })}
  showNone={false}
  useDefaultFallback={true}
  testId="select-asset-logo"
/>
```

Props:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | required | Field label |
| `value` | number \| null | required | Selected logo ID |
| `onChange` | (id: number \| null) => void | required | Selection handler |
| `showNone` | boolean | `true` | Show "No Logo" option |
| `useDefaultFallback` | boolean | `false` | When value is null, auto-select default logo |
| `emptyLabel` | string | `"No Logo"` | Label for empty option |
| `helpText` | string | `"Select from Logo Portfolio"` | Help text below selector |
| `testId` | string | `"select-logo"` | data-testid for selector |
| `fallbackUrl` | string | default logo asset | Fallback image URL |

**Rule:** Always use `LogoSelector` for logo selection UI. Do not build inline logo selectors.

## Upload Flow

File uploads use the direct server upload endpoint (bypasses CORS issues with GCS):

1. Client reads file as `ArrayBuffer`
2. `POST /api/uploads/direct` with binary body and `Content-Type` header
3. Server validates size (max 10MB) and content type (images only)
4. Server writes to object storage, returns `{ objectPath }`
5. `objectPath` is stored in DB and served via `GET /objects/{path}`

Hook: `useUpload()` from `client/src/hooks/use-upload.ts`

Server route: `server/routes/uploads.ts`

## AI Logo Generation Flow (LogosTab)

The Add Logo dialog has three modes:
1. **Generate Logo** — AI-powered via Nano Banana (Gemini image model)
2. **Import Logo** — file upload with crop dialog
3. **URL Logo** — paste a direct URL

AI Generation sub-flow:
1. User describes logo in textarea
2. Option A: "Generate Logo" — sends prompt directly to Nano Banana
3. Option B: "Enhance with AI" — calls Gemini text model to improve the prompt, then shows enhanced version with Edit Further / Cancel / Generate options

Server endpoints:
- `POST /api/enhance-logo-prompt` — Gemini text enhancement (`server/replit_integrations/image/routes.ts`)
- `POST /api/generate-property-image` — Nano Banana image generation + object storage upload

Image client: `server/replit_integrations/image/client.ts`

## Conventions

1. Every admin tab uses shared hooks from `hooks.ts` — no inline fetches
2. Card class: always use `ADMIN_CARD` constant
3. Mutations show toast on success/error via `useToast()`
4. All interactive elements need `data-testid` attributes
5. Icons from `lucide-react`, titles use `font-display` class
6. Button labels: always "Save", never "Update"

## Adding a New Admin Section

1. Create component in `client/src/components/admin/NewTab.tsx`
2. Import hooks from `./hooks` for data fetching
3. Use `ADMIN_CARD` from `./styles` for card containers
4. Add section to `AdminSidebar.tsx` (type + config)
5. Add rendering case in `Admin.tsx`
6. Export from `./index.ts`

## Types (`client/src/components/admin/types.ts`)

Shared interfaces: `User`, `Logo`, `UserGroup`, `AdminCompany`, `LoginLog`, `ActiveSession`, `ActivityLogEntry`, `CheckerSummary`, `VerificationHistoryEntry`, `DesignCheckResult`, `AssetDesc`
