Admin panel tab architecture and patterns for the HBG Portal. Covers the standard tab component structure, settings card layout, group header convention, the `updateNested` callback pattern, and the API fetch/save flow. Use this skill when adding a new admin tab, modifying admin settings UI, or building admin configuration panels.

## Admin Panel Structure

The Admin page (`client/src/pages/Admin.tsx`) renders a sidebar (`AdminSidebar.tsx`) + content area. Each sidebar item maps to a tab component in `client/src/components/admin/`.

### Sidebar Groups

| Group | Tabs |
|-------|------|
| **Business** | Users, Companies, Groups |
| **Research** | ICP Management Co, Research Center |
| **Design** | Logos, Icons, Themes, Exports |
| **AI** | AI Agents, LLMs, Sources |
| **System** | App Defaults, Notifications, Navigation, Verification, Database, Cache & Services |

## Standard Tab Component Pattern

Every admin tab follows the same structure:

```tsx
export default function MyConfigTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState<MyConfig>(DEFAULT_CONFIG);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigFromApi()
      .then((cfg) => setConfig(cfg))
      .catch(() => toast({ title: "Could not load", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await putConfigToApi(config);
      setConfig(saved);
      setDirty(false);
      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-5">
      {/* Settings content */}
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" onClick={handleReset} disabled={saving}>Reset to defaults</Button>
        <Button onClick={handleSave} disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </div>
  );
}
```

## The `updateNested` Callback Pattern

For config objects with grouped keys (e.g., `ExportConfig` with `overview`, `statements`, `analysis`):

```tsx
const updateNested = useCallback(<
  G extends "overview" | "statements" | "analysis",
  K extends keyof ExportConfig[G],
>(group: G, key: K, value: ExportConfig[G][K]) => {
  setConfig((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  setDirty(true);
}, []);
```

This pattern is type-safe: the key must exist on the group, and the value must match the key's type.

## Reusable Admin UI Components

### Card Style Constants (`styles.ts`)

| Constant | Classes | Usage |
|----------|---------|-------|
| `ADMIN_CARD` | `bg-card border border-border/80 shadow-sm rounded-xl` | Standard settings card |
| `ADMIN_LINK_CARD` | `group bg-card border ... hover:shadow-sm` | Clickable list items |
| `ADMIN_LINK_ICON` | `w-10 h-10 rounded-xl bg-muted ...` | Icon badge in list cards |
| `ADMIN_TEXTAREA` | Full textarea styles | Multi-line text inputs |
| `ADMIN_DIALOG` | `sm:max-w-lg` | Dialog width |
| `LOGO_PREVIEW` | `relative w-14 h-14 rounded-lg ...` | Logo preview thumbnail |

### Layout Components (from ExportsTab pattern)

| Component | Pattern | Usage |
|-----------|---------|-------|
| `SectionToggle` | Checkbox + label + description | Toggle boolean config fields |
| `SettingSwitch` | Switch + label + description | Toggle format/behavior settings |
| `GroupHeader` | Uppercase label + rule line | Visual group separator |
| `ContentCard` | Two-column split card | Houses related toggles |
| `SettingsCard` | Titled single-column card | Houses format switches |
| `SubHeader` | Lighter uppercase label | Sub-groups within cards |

These components are defined inline in `ExportsTab.tsx` but follow a consistent pattern reusable across tabs.

## API Fetch/Save Flow

1. **Fetch:** `GET /api/admin/{config-name}` → returns current config (merged with defaults)
2. **Display:** Set local state from API response
3. **Edit:** User toggles update local state + set `dirty = true`
4. **Save:** `PUT /api/admin/{config-name}` → server validates with Zod, merges with stored config, persists to `global_assumptions`
5. **Confirm:** Server returns merged config → client updates state, clears dirty flag, shows toast

### Server-Side Pattern

```typescript
export function registerMyConfigRoutes(app: Express) {
  app.get("/api/admin/my-config", requireAdmin, async (_req, res) => {
    const ga = await storage.getGlobalAssumptions();
    res.json(mergeWithDefaults(ga.myConfig));
  });

  app.put("/api/admin/my-config", requireAdmin, async (req, res) => {
    const parsed = myConfigSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid config" });
    const current = mergeWithDefaults(ga.myConfig);
    const merged = { ...current, ...parsed.data };
    await storage.upsertGlobalAssumptions({ myConfig: merged });
    res.json(merged);
  });
}
```

## Adding a New Admin Tab

1. Create `client/src/components/admin/MyNewTab.tsx` following the standard pattern
2. Add the tab component to `Admin.tsx` tab registry
3. Add sidebar entry in `AdminSidebar.tsx` with icon and label
4. Create server route in `server/routes/admin/my-config.ts` with Zod validation
5. Register route in `server/routes.ts`
6. If config is persisted, add field to `global_assumptions` schema and create migration

## Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/Admin.tsx` | Admin shell + tab routing |
| `client/src/components/admin/AdminSidebar.tsx` | Sidebar navigation |
| `client/src/components/admin/styles.ts` | Card style constants |
| `client/src/components/admin/ExportsTab.tsx` | Reference implementation (fetch/save/reset + nested config) |
| `server/routes/admin/exports.ts` | Reference server route (Zod + merge + persist) |
