---
name: breadcrumbs
description: Breadcrumb navigation showing page hierarchy. Use when implementing breadcrumb trails.
theme: light-cream
---

# Breadcrumb Navigation

## Theme: Light Cream
Breadcrumbs sit on the **light cream** background (`#FFF9F5`) between header and page content.

### Container
```
flex items-center gap-1.5 px-6 py-2 text-sm
```

### Link Item
```
text-muted-foreground hover:text-[#257D41] transition-colors
font-medium cursor-pointer
```

### Current Item (last)
```
text-foreground font-semibold pointer-events-none
```

### Separator
```
text-muted-foreground/40 w-3.5 h-3.5
```
Uses `ChevronRight` icon from lucide-react.

### Home Icon
```
w-4 h-4 text-[#9FBCA4]
```

## Route Hierarchy
```
Dashboard
Portfolio
  └── Property: {name}
        ├── Edit
        ├── Market Research
        └── Financing Analysis
Company
  ├── Assumptions
  └── Research
Settings / Profile
Admin
Scenarios / Sensitivity Analysis
Global Research
Property Finder
Methodology / Checker Manual
```

## Implementation
- Uses wouter `useLocation` to derive breadcrumbs from current URL
- Property names resolved from TanStack Query cache
- Mounted in `Layout.tsx` between header and `<main>`
- Auto-derives segments — no per-page config needed
