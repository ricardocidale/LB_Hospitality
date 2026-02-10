---
name: command-palette
description: Global Ctrl+K command palette for quick navigation. Use when implementing or modifying the command palette.
theme: dark-glass
---

# Command Palette (Ctrl+K)

## Theme: Dark Glass (Midnight)
The command palette uses the **dark glass** theme — the same visual language as the sidebar and tab bar.

### Dialog Overlay
```
bg-black/60 backdrop-blur-sm
```

### Command Container
```
bg-[#0a0a0f] border border-[#9FBCA4]/20 rounded-2xl shadow-2xl
overflow-hidden backdrop-blur-xl
```

### Search Input
```
bg-transparent border-b border-white/10 text-white placeholder:text-white/40
px-4 py-3 text-sm focus:outline-none
```

### Group Heading
```
text-xs uppercase tracking-wider text-[#9FBCA4]/60 px-4 py-2
```

### Item (inactive)
```
flex items-center gap-3 px-4 py-2.5 text-sm text-[#FFF9F5]/60
cursor-pointer transition-colors duration-200
```

### Item (active/highlighted)
```
bg-white/8 text-white rounded-xl
```

### Item Icon
```
w-5 h-5 text-[#9FBCA4]
```

### Shortcut Badge
```
bg-white/10 text-white/50 text-xs px-1.5 py-0.5 rounded font-mono
```

## Architecture
- Uses shadcn `Command` (cmdk) inside a `Dialog`
- Groups: Pages, Properties, Actions, Recent
- Fuzzy matching on property names, page titles, action labels
- Keyboard: Arrow keys navigate, Enter selects, Escape closes

## Data Sources
| Category | Icon | Source |
|----------|------|--------|
| Pages | LayoutDashboard | Static route list |
| Properties | Building2 | API /api/properties cache |
| Actions | Zap | Static action list |
| Recent | Clock | localStorage (last 10) |

## Integration
- Mounted in `Layout.tsx` (all authenticated pages)
- `useEffect` keydown listener for Ctrl+K / Cmd+K
- Navigation via wouter `useLocation`
