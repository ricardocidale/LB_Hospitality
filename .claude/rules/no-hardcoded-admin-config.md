# No Hardcoded Admin Configuration

## Rule

Never hardcode values that are managed through the Administration page. All admin-configurable settings must be read from the database. Administrators control these values through the Admin UI — code must never bypass that by using literals.

## Protected Variables — Administration Page

### Management Company (Branding Tab)
| Setting | Source | Never Hardcode |
|---------|--------|----------------|
| Management Company Name | `globalAssumptions.companyName` | `"Hospitality Business"`, `"Hospitality Business Group"` |
| Management Company Logo | `globalAssumptions.companyLogoId` → resolved from `logos` table | any logo URL or ID literal |
| Property Type Label | `globalAssumptions.propertyLabel` | `"Boutique Hotel"`, `"Estate Hotel"` |

### Logo Portfolio (Branding Tab)
| Setting | Source | Never Hardcode |
|---------|--------|----------------|
| Logo names | `logos.name` | any logo name string |
| Logo URLs | `logos.url` | any logo URL string |
| Logo company names | `logos.companyName` | `"Hospitality Business Group"`, `"KIT Capital"` |
| Default logo flag | `logos.isDefault` | assumption about which logo is default |

### Asset Descriptions (Branding Tab)
| Setting | Source | Never Hardcode |
|---------|--------|----------------|
| Asset description names | `assetDescriptions.name` | `"Luxury Resort"`, `"Urban Boutique"` |
| Default asset description | `assetDescriptions.isDefault` | assumption about which is default |

### User Groups (User Groups Tab)
| Setting | Source | Never Hardcode |
|---------|--------|----------------|
| Group name | `userGroups.name` | `"General"`, `"KIT Group"`, `"Norfolk Group"` |
| Group logo assignment | `userGroups.logoId` | any logo ID |
| Group theme assignment | `userGroups.themeId` | any theme ID |
| Group asset description | `userGroups.assetDescriptionId` | any asset description ID |
| User group membership | `users.userGroupId` | any group ID |

### Themes (Themes Tab)
| Setting | Source | Never Hardcode |
|---------|--------|----------------|
| Theme names | `designThemes.name` | `"Forest"`, `"Ocean"`, `"Midnight"` |
| Theme colors | `designThemes.colors` | any hex color array |
| Default theme flag | `designThemes.isDefault` | assumption about which theme is default |
| User theme override | `users.selectedThemeId` | any theme ID |

### Navigation Visibility (Navigation Tab)
| Setting | Source | Never Hardcode |
|---------|--------|----------------|
| Property Finder | `globalAssumptions.sidebarPropertyFinder` | `true` / `false` |
| Sensitivity Analysis | `globalAssumptions.sidebarSensitivity` | `true` / `false` |
| Financing Analysis | `globalAssumptions.sidebarFinancing` | `true` / `false` |
| Compare | `globalAssumptions.sidebarCompare` | `true` / `false` |
| Timeline | `globalAssumptions.sidebarTimeline` | `true` / `false` |
| Map View | `globalAssumptions.sidebarMapView` | `true` / `false` |
| Executive Summary | `globalAssumptions.sidebarExecutiveSummary` | `true` / `false` |
| My Scenarios | `globalAssumptions.sidebarScenarios` | `true` / `false` |
| User Manual | `globalAssumptions.sidebarUserManual` | `true` / `false` |

### Display Settings (managed in Systemwide Assumptions page, admin-controlled)
| Setting | Source | Never Hardcode |
|---------|--------|----------------|
| Show Company Calculation Details | `globalAssumptions.showCompanyCalculationDetails` | `true` / `false` |
| Show Property Calculation Details | `globalAssumptions.showPropertyCalculationDetails` | `true` / `false` |
| Preferred LLM | `globalAssumptions.preferredLlm` | `"claude-sonnet-4-5"` |

## Branding Resolution Order

The branding system resolves values in a specific order. Never short-circuit this chain:

**Company name:** `myBranding.groupCompanyName` → `globalAssumptions.companyName` → (no literal fallback)

**Logo:** `myBranding.logoUrl` (group logo) → `globalAssumptions.companyLogoUrl` (management co. logo from pool) → `globalAssumptions.companyLogo` (legacy URL) → default logo asset

**Theme:** `user.selectedThemeId` → `userGroup.themeId` → system default theme (`isDefault = true`)

## How to Check

Before writing any admin-managed value in code, ask:
1. Is this something an administrator can change in the Admin page?
2. If yes → it MUST come from the database
3. Never assume group names, theme names, logo URLs, or sidebar visibility as literals
4. Seed data defines initial values — code must read them from the DB, not duplicate them as constants
