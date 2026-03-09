import { CardContent, CardDescription, IconAlertCircle, IconBell, IconCheck, IconChevronDown, IconDollarSign, IconEye, IconPeople, IconSearch, IconStar, IconTrending, IconX } from "@/components/icons/brand-icons";

export function ThemePreview() {
  const [previewOpen, setPreviewOpen] = useState(true);

  if (!previewOpen) {
    return (
      <button
        onClick={() => setPreviewOpen(true)}
        className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors flex items-center justify-center gap-2"
        data-testid="button-show-preview"
      >
        <IconEye className="w-4 h-4" />
        Show Live Preview
      </button>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl border border-border shadow-lg" data-testid="theme-preview-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <IconEye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-display text-foreground">Live Preview</CardTitle>
              <CardDescription className="text-muted-foreground">See how your theme looks on real UI elements</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)} data-testid="button-hide-preview">
            <IconX className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Buttons</p>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="preview-btn-primary">Primary</Button>
            <Button variant="secondary" data-testid="preview-btn-secondary">Secondary</Button>
            <Button variant="outline" data-testid="preview-btn-outline">Outline</Button>
            <Button variant="ghost" data-testid="preview-btn-ghost">Ghost</Button>
            <Button variant="destructive" data-testid="preview-btn-destructive">Delete</Button>
            <Button disabled data-testid="preview-btn-disabled">Disabled</Button>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sample Dialog</p>
          <div className="rounded-xl border border-border bg-popover shadow-lg p-0 max-w-sm">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-popover-foreground">Confirm Action</h3>
              <p className="text-sm text-muted-foreground mt-1">Are you sure you want to save these changes? This will update the portfolio assumptions.</p>
            </div>
            <div className="px-5 pb-2">
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Property Name</Label>
                <Input placeholder="e.g., Grand Hotel Riviera" className="bg-background" readOnly data-testid="preview-input" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 pt-3 border-t border-border">
              <Button variant="outline" size="sm">Cancel</Button>
              <Button size="sm">Save</Button>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Menu & Navigation</p>
          <div className="flex gap-4">
            <div className="w-44 rounded-lg border border-border bg-popover shadow-md overflow-hidden">
              <div className="p-1">
                <div className="px-3 py-2 rounded-md bg-muted text-foreground text-sm font-medium flex items-center gap-2">
                  <IconStar className="w-4 h-4 text-primary" />
                  Dashboard
                </div>
                <div className="px-3 py-2 rounded-md text-muted-foreground text-sm flex items-center gap-2 hover:bg-muted/50 cursor-default">
                  <IconPeople className="w-4 h-4" />
                  Portfolio
                </div>
                <div className="px-3 py-2 rounded-md text-muted-foreground text-sm flex items-center gap-2 hover:bg-muted/50 cursor-default">
                  <IconTrending className="w-4 h-4" />
                  Analysis
                </div>
                <Separator className="my-1" />
                <div className="px-3 py-2 rounded-md text-muted-foreground text-sm flex items-center gap-2 hover:bg-muted/50 cursor-default">
                  <IconDollarSign className="w-4 h-4" />
                  Financing
                </div>
              </div>
            </div>

            <div className="w-52 rounded-lg border border-border bg-popover shadow-md overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted text-muted-foreground text-sm">
                  <IconSearch className="w-3.5 h-3.5" />
                  Search...
                </div>
              </div>
              <div className="p-1">
                <div className="px-3 py-2 rounded-md text-foreground text-sm flex items-center justify-between hover:bg-muted/50 cursor-default">
                  Export PDF
                  <span className="text-xs text-muted-foreground font-mono">Ctrl+P</span>
                </div>
                <div className="px-3 py-2 rounded-md text-foreground text-sm flex items-center justify-between hover:bg-muted/50 cursor-default">
                  Export Excel
                  <span className="text-xs text-muted-foreground font-mono">Ctrl+E</span>
                </div>
                <Separator className="my-1" />
                <div className="px-3 py-2 rounded-md text-destructive text-sm flex items-center gap-2 hover:bg-destructive/10 cursor-default">
                  <IconAlertCircle className="w-3.5 h-3.5" />
                  Delete Property
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cards & Badges</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm hover-lift">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</p>
                <IconDollarSign className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-semibold text-foreground">$1.2M</p>
              <p className="text-xs text-muted-foreground mt-1">+12.5% from last year</p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border shadow-sm hover-lift">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Occupancy</p>
                <IconTrending className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-semibold text-foreground">78%</p>
              <p className="text-xs text-muted-foreground mt-1">Above market avg</p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border shadow-sm hover-lift">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Properties</p>
                <IconPeople className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-semibold text-foreground">5</p>
              <p className="text-xs text-muted-foreground mt-1">Active portfolio</p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Badges & Tags</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">Default</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">Secondary</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">Muted</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Declined</span>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notification / Toast</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card shadow-sm">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconBell className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Assumptions Updated</p>
                <p className="text-xs text-muted-foreground mt-0.5">Revenue growth rate changed from 3.0% to 3.5% for Year 2.</p>
              </div>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <IconX className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
              <IconCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Export Complete</p>
                <p className="text-xs text-green-600 mt-0.5">Portfolio summary exported to PDF successfully.</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Chart Colors</p>
          <div className="flex gap-1 items-end h-24">
            {[65, 80, 45, 90, 55].map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md transition-all"
                style={{
                  height: `${height}%`,
                  backgroundColor: `hsl(var(--chart-${i + 1}))`,
                }}
                data-testid={`preview-chart-bar-${i}`}
              />
            ))}
          </div>
          <div className="flex gap-1 mt-2">
            {["Q1", "Q2", "Q3", "Q4", "Q5"].map((label, i) => (
              <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground">{label}</div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
