---
name: admin-api-routes
description: Complete list of admin API endpoints used by Admin.tsx tab components. Reference this when building tab components to ensure correct fetch URLs, methods, and payloads.
---

# Admin API Routes

## User Management
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/admin/users` | UsersTab, UserGroupsTab, BrandingTab | - |
| POST | `/api/admin/users` | UsersTab | `{ email, password, firstName?, lastName?, company?, title?, role? }` |
| PATCH | `/api/admin/users/:id` | UsersTab | `{ email?, firstName?, lastName?, company?, title?, role? }` |
| DELETE | `/api/admin/users/:id` | UsersTab | - |
| PATCH | `/api/admin/users/:id/password` | UsersTab | `{ password }` |
| PATCH | `/api/admin/users/:id/group` | UserGroupsTab | `{ groupId }` |
| POST | `/api/admin/reset-all-passwords` | UsersTab | - |

## Companies
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/admin/companies` | CompaniesTab | - |
| POST | `/api/admin/companies` | CompaniesTab | `{ name, type, description?, logoId? }` |
| PATCH | `/api/admin/companies/:id` | CompaniesTab | `{ name?, type?, description?, logoId? }` |
| DELETE | `/api/admin/companies/:id` | CompaniesTab | - |

## Logos
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/admin/logos` | LogosTab, BrandingTab, CompaniesTab, UserGroupsTab | - |
| POST | `/api/admin/logos` | LogosTab | `{ name, companyName, url }` |
| DELETE | `/api/admin/logos/:id` | LogosTab | - |

## User Groups
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/admin/user-groups` | UserGroupsTab, BrandingTab | - |
| POST | `/api/admin/user-groups` | UserGroupsTab | `{ name, logoId?, themeId?, assetDescriptionId? }` |
| PATCH | `/api/admin/user-groups/:id` | UserGroupsTab | `{ name?, logoId?, themeId?, assetDescriptionId? }` |
| DELETE | `/api/admin/user-groups/:id` | UserGroupsTab | - |

## Asset Descriptions
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/admin/asset-descriptions` | BrandingTab, UserGroupsTab | - |
| POST | `/api/admin/asset-descriptions` | BrandingTab | `{ name }` |
| DELETE | `/api/admin/asset-descriptions/:id` | BrandingTab | - |

## Activity & Sessions
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/admin/login-logs` | ActivityTab | - |
| GET | `/api/admin/activity-logs?limit=50&entityType=X&userId=Y` | ActivityTab | - |
| GET | `/api/admin/checker-activity` | ActivityTab | - |
| GET | `/api/admin/active-sessions` | ActivityTab | - |
| DELETE | `/api/admin/sessions/:id` | ActivityTab | - |

## Verification
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/admin/run-verification` | VerificationTab | - |
| POST | `/api/admin/ai-verification` | VerificationTab (SSE stream) | - |
| GET | `/api/admin/verification-history?limit=10` | VerificationTab | - |
| GET | `/api/admin/run-design-check` | VerificationTab | - |

## Database
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/admin/sync-status` | DatabaseTab | - |
| POST | `/api/admin/seed-production` | DatabaseTab | `{}` |

## Global Assumptions (shared)
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/global-assumptions` | NavigationTab, BrandingTab, VerificationTab | - |
| POST | `/api/global-assumptions` | NavigationTab, BrandingTab | `{ ...updates }` |

## Design Themes
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/design-themes` | UserGroupsTab, BrandingTab | - |

## Properties (for verification)
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/properties` | VerificationTab | - |

## AI Agent (Marcela) — ConvAI Proxy Routes
| Method | Route | Used By | Body |
|--------|-------|---------|------|
| GET | `/api/marcela/signed-url` | ElevenLabsWidget | - |
| GET | `/api/admin/convai/agent` | PromptEditor, ToolsStatus | - |
| PATCH | `/api/admin/convai/agent/prompt` | PromptEditor | `{ prompt, first_message, language }` |
| GET | `/api/admin/convai/tools-status` | ToolsStatus | - |
| POST | `/api/admin/convai/knowledge-base/upload-file` | KnowledgeBase | `multipart/form-data: file` |
| POST | `/api/admin/marcela/reindex` | KnowledgeBase | - |
| POST | `/api/admin/marcela/push-to-elevenlabs` | KnowledgeBase | - |
| POST | `/api/admin/marcela/configure-tools` | ToolsStatus | - |

## AI Agent Server Tools (ElevenLabs webhooks)
| Method | Route | Used By | Description |
|--------|-------|---------|-------------|
| GET | `/api/marcela-tools/properties` | ElevenLabs agent | List all properties |
| GET | `/api/marcela-tools/property/:id` | ElevenLabs agent | Property details |
| GET | `/api/marcela-tools/portfolio-summary` | ElevenLabs agent | Portfolio metrics |
| GET | `/api/marcela-tools/scenarios` | ElevenLabs agent | Saved scenarios |
| GET | `/api/marcela-tools/global-assumptions` | ElevenLabs agent | Financial parameters |
| GET | `/api/marcela-tools/navigation` | ElevenLabs agent | Portal pages |

## Notes
- All routes require `credentials: "include"` for auth cookies
- All POST/PATCH routes need `Content-Type: application/json` header
- Error responses return `{ error: "message" }` JSON
- AI verification uses Server-Sent Events (SSE) streaming
- KB file upload uses `multipart/form-data` (multer middleware), NOT `Content-Type: application/json`
- AI Agent ConvAI routes proxy to ElevenLabs API with server-side authentication
