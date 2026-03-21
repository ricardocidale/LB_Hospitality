import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { IconDownload, IconTrending, IconFileCheck } from "@/components/icons";
import { saveExportConfig, DEFAULT_EXPORT_CONFIG, type ExportConfig } from "@/lib/exportConfig";

const EXPORT_CONFIG_API = "/api/admin/export-config";

async function fetchExportConfigFromApi(): Promise<ExportConfig> {
  const res = await fetch(EXPORT_CONFIG_API);
  if (!res.ok) throw new Error("Failed to load export config");
  return res.json();
}

async function putExportConfigToApi(cfg: ExportConfig): Promise<ExportConfig> {
  const res = await fetch(EXPORT_CONFIG_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error("Failed to save export config");
  return res.json();
}

function SectionToggle({
  id, label, description, checked, onChange, disabled,
}: {
  id: string; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 py-3 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <Checkbox
        id={id} checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
        className="mt-0.5 shrink-0"
        data-testid={`checkbox-export-${id}`}
      />
      <div className="flex-1 min-w-0">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer leading-none">{label}</Label>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

function CategorySwitch({
  id, label, description, checked, onChange,
}: {
  id: string; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 pr-4">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} data-testid={`switch-export-${id}`} />
    </div>
  );
}

function GroupHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-1 mt-4 first:mt-0">
      <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{title}</span>
      {badge && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{badge}</Badge>}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 shadow-sm">
      <div className="px-4 pt-3 pb-0.5"><GroupHeader title={title} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border border-t border-border">
        {children}
      </div>
    </div>
  );
}

export default function ExportsTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ExportConfig>(DEFAULT_EXPORT_CONFIG);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExportConfigFromApi()
      .then((cfg) => { setConfig(cfg); saveExportConfig(cfg); })
      .catch(() => toast({ title: "Could not load export settings", description: "Showing defaults.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const updateNested = useCallback(<
    G extends "overview" | "statements" | "analysis",
    K extends keyof ExportConfig[G],
  >(group: G, key: K, value: ExportConfig[G][K]) => {
    setConfig((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await putExportConfigToApi(config);
      saveExportConfig(saved);
      setConfig(saved);
      setDirty(false);
      toast({ title: "Export settings saved", description: "Changes will apply to all new exports." });
    } catch {
      toast({ title: "Failed to save", description: "Check your connection and try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const saved = await putExportConfigToApi(DEFAULT_EXPORT_CONFIG);
      saveExportConfig(saved);
      setConfig(saved);
      setDirty(false);
      toast({ title: "Export settings reset", description: "All settings restored to defaults." });
    } catch {
      toast({ title: "Failed to reset", description: "Check your connection and try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading export settings…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">
          Choose what appears in each report, and control orientation, quality, and layout behavior.
        </p>
        <div className="flex items-center gap-2 shrink-0 ml-6">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={saving} data-testid="button-export-reset">
            Reset to defaults
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty || saving} data-testid="button-export-save">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1" data-testid="tab-export-overview">
            <IconDownload className="h-3.5 w-3.5 mr-1.5" />Overview
          </TabsTrigger>
          <TabsTrigger value="statements" className="flex-1" data-testid="tab-export-statements">
            <IconTrending className="h-3.5 w-3.5 mr-1.5" />Financial Statements
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex-1" data-testid="tab-export-analysis">
            <IconFileCheck className="h-3.5 w-3.5 mr-1.5" />Financial Analysis
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ─────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Controls which sections appear in the <span className="font-medium text-foreground">Portfolio Overview</span> report — the first page users see when exporting from the Dashboard.
          </p>

          {/* Content sections */}
          <div className="rounded-lg border border-border bg-card px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="divide-y divide-border">
                <GroupHeader title="Metrics" />
                <SectionToggle id="ov-kpi-metrics" label="Key Performance Metrics"
                  description="Portfolio IRR, Equity Multiple, Cash-on-Cash Return, total equity invested, exit value, N-year revenue, NOI, and cash flow."
                  checked={config.overview.kpiMetrics} onChange={(v) => updateNested("overview", "kpiMetrics", v)} />
                <GroupHeader title="Charts & Projections" />
                <SectionToggle id="ov-revenue-chart" label="Revenue & Returns chart"
                  description="Multi-series line chart showing Revenue, NOI, ANOI, and Cash Flow across the full hold period."
                  checked={config.overview.revenueChart} onChange={(v) => updateNested("overview", "revenueChart", v)} />
                <SectionToggle id="ov-projection-table" label="Year-by-year projection table"
                  description="Tabular breakdown of Revenue, NOI, ANOI, and Cash Flow for every year in the projection."
                  checked={config.overview.projectionTable} onChange={(v) => updateNested("overview", "projectionTable", v)} />
              </div>
              <div className="divide-y divide-border sm:border-l sm:border-border sm:pl-6">
                <GroupHeader title="Portfolio Composition" />
                <SectionToggle id="ov-composition-tables" label="Capital Structure & Composition"
                  description="Portfolio summary (properties, rooms, markets, ADR) alongside capital structure (purchase price, cap rate, hold period, ANOI margin)."
                  checked={config.overview.compositionTables} onChange={(v) => updateNested("overview", "compositionTables", v)} />
                <SectionToggle id="ov-waterfall-table" label="USALI Profit Waterfall"
                  description="Income bridge table from Total Revenue down through GOP, AGOP, NOI, and ANOI across all projection years."
                  checked={config.overview.waterfallTable} onChange={(v) => updateNested("overview", "waterfallTable", v)} />
                <GroupHeader title="Property Detail" />
                <SectionToggle id="ov-property-insights" label="Property Insights roster"
                  description="One row per property: name, market, rooms, status, acquisition cost, ADR, and IRR."
                  checked={config.overview.propertyInsights} onChange={(v) => updateNested("overview", "propertyInsights", v)} />
              </div>
            </div>
          </div>

          {/* Format */}
          <CardSection title="Format">
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="ov-landscape" label="Allow landscape orientation"
                description="Users can choose landscape when exporting — wider pages fit more columns."
                checked={config.overview.allowLandscape} onChange={(v) => updateNested("overview", "allowLandscape", v)} />
              <CategorySwitch id="ov-portrait" label="Allow portrait orientation"
                description="Users can choose portrait when exporting — taller layout, closer to standard paper."
                checked={config.overview.allowPortrait} onChange={(v) => updateNested("overview", "allowPortrait", v)} />
            </div>
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="ov-premium" label="Allow premium exports"
                description="Enables the AI-enhanced export mode (richer formatting, insights, design-quality output)."
                checked={config.overview.allowPremium} onChange={(v) => updateNested("overview", "allowPremium", v)} />
              <CategorySwitch id="ov-dense" label="Dense pagination"
                description="Pack as much content per page as possible. Column headers repeat at the top of each continuation page."
                checked={config.overview.densePagination} onChange={(v) => updateNested("overview", "densePagination", v)} />
            </div>
          </CardSection>

          {/* Report Length */}
          <CardSection title="Report Length">
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="ov-short" label="Allow short reports"
                description="Users can generate a condensed version of the report with only key metrics and headline figures."
                checked={config.overview.allowShort} onChange={(v) => updateNested("overview", "allowShort", v)} />
            </div>
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="ov-extended" label="Allow extended reports"
                description="Users can generate the full-length report with all sections, charts, and detailed line items included."
                checked={config.overview.allowExtended} onChange={(v) => updateNested("overview", "allowExtended", v)} />
            </div>
          </CardSection>
        </TabsContent>

        {/* ── FINANCIAL STATEMENTS ─────────────────────────── */}
        <TabsContent value="statements" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Controls which statements and chart pages appear in <span className="font-medium text-foreground">Income Statement</span>, <span className="font-medium text-foreground">Cash Flow</span>, and <span className="font-medium text-foreground">Balance Sheet</span> exports — for both Dashboard (consolidated) and Property Detail reports.
          </p>

          {/* Content sections */}
          <div className="rounded-lg border border-border bg-card px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="divide-y divide-border">
                <GroupHeader title="Income Statement" />
                <SectionToggle id="st-income-statement" label="Income Statement table"
                  description="Revenue, operating expenses, GOP, management fees, AGOP, fixed charges, NOI, FF&E reserve, and ANOI — by year."
                  checked={config.statements.incomeStatement} onChange={(v) => updateNested("statements", "incomeStatement", v)} />
                <SectionToggle id="st-income-chart" label="Income trend chart page"
                  description="Line chart following the Income Statement — Revenue, GOP, AGOP, NOI, and ANOI across the hold period."
                  checked={config.statements.incomeChart} onChange={(v) => updateNested("statements", "incomeChart", v)}
                  disabled={!config.statements.incomeStatement} />
                <GroupHeader title="Cash Flow Statement" />
                <SectionToggle id="st-cash-flow" label="Cash Flow Statement table"
                  description="Operating cash flow, debt service, FCF, principal payments, and Free Cash Flow to Equity — by year."
                  checked={config.statements.cashFlow} onChange={(v) => updateNested("statements", "cashFlow", v)} />
                <SectionToggle id="st-cash-flow-chart" label="Cash Flow trend chart page"
                  description="Line chart following the Cash Flow table — NOI, ANOI, FCF, and FCFE across the hold period."
                  checked={config.statements.cashFlowChart} onChange={(v) => updateNested("statements", "cashFlowChart", v)}
                  disabled={!config.statements.cashFlow} />
              </div>
              <div className="divide-y divide-border sm:border-l sm:border-border sm:pl-6">
                <GroupHeader title="Balance Sheet" />
                <SectionToggle id="st-balance-sheet" label="Balance Sheet table"
                  description="Total assets (cash + property NBV), outstanding debt, equity invested, and retained earnings — by year."
                  checked={config.statements.balanceSheet} onChange={(v) => updateNested("statements", "balanceSheet", v)} />
                <SectionToggle id="st-balance-sheet-chart" label="Balance Sheet trend chart page"
                  description="Line chart following the Balance Sheet — Total Assets, Liabilities, and Equity across the hold period."
                  checked={config.statements.balanceSheetChart} onChange={(v) => updateNested("statements", "balanceSheetChart", v)}
                  disabled={!config.statements.balanceSheet} />
                <GroupHeader title="Line Item Detail" />
                <SectionToggle id="st-detailed-line-items" label="Detailed line-item breakdowns"
                  description="Show all sub-categories within each statement (e.g. Room Revenue, F&B Revenue, individual expense lines). When off, only section headers and totals appear."
                  checked={config.statements.detailedLineItems} onChange={(v) => updateNested("statements", "detailedLineItems", v)} />
              </div>
            </div>
          </div>

          {/* Format */}
          <CardSection title="Format">
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="st-landscape" label="Allow landscape orientation"
                description="Users can choose landscape when exporting — wider pages fit more columns."
                checked={config.statements.allowLandscape} onChange={(v) => updateNested("statements", "allowLandscape", v)} />
              <CategorySwitch id="st-portrait" label="Allow portrait orientation"
                description="Users can choose portrait when exporting — taller layout, closer to standard paper."
                checked={config.statements.allowPortrait} onChange={(v) => updateNested("statements", "allowPortrait", v)} />
            </div>
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="st-premium" label="Allow premium exports"
                description="Enables the AI-enhanced export mode (richer formatting, insights, design-quality output)."
                checked={config.statements.allowPremium} onChange={(v) => updateNested("statements", "allowPremium", v)} />
              <CategorySwitch id="st-dense" label="Dense pagination"
                description="Pack as much content per page as possible. Column headers repeat at the top of each continuation page."
                checked={config.statements.densePagination} onChange={(v) => updateNested("statements", "densePagination", v)} />
            </div>
          </CardSection>

          {/* Report Length */}
          <CardSection title="Report Length">
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="st-short" label="Allow short reports"
                description="Users can generate a condensed version of the report with only key metrics and headline figures."
                checked={config.statements.allowShort} onChange={(v) => updateNested("statements", "allowShort", v)} />
            </div>
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="st-extended" label="Allow extended reports"
                description="Users can generate the full-length report with all sections, charts, and detailed line items included."
                checked={config.statements.allowExtended} onChange={(v) => updateNested("statements", "allowExtended", v)} />
            </div>
          </CardSection>
        </TabsContent>

        {/* ── FINANCIAL ANALYSIS ───────────────────────────── */}
        <TabsContent value="analysis" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Controls which analytical sections appear in exports — available on both the Dashboard and Property Detail reports.
          </p>

          {/* Content sections */}
          <div className="rounded-lg border border-border bg-card px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="divide-y divide-border">
                <GroupHeader title="Summary Metrics" />
                <SectionToggle id="an-kpi-summary-cards" label="KPI summary cards"
                  description="Highlighted metric cards at the top of a report page (e.g. Year 1 Revenue, Operating Income, Net Income with margin)."
                  checked={config.analysis.kpiSummaryCards} onChange={(v) => updateNested("analysis", "kpiSummaryCards", v)} />
              </div>
              <div className="divide-y divide-border sm:border-l sm:border-border sm:pl-6">
                <GroupHeader title="Investment Analysis" />
                <SectionToggle id="an-investment-analysis" label="Investment Analysis table"
                  description="Equity invested, total property cost, loan amount, annual revenue and NOI, debt service, and closing cash balance — by year."
                  checked={config.analysis.investmentAnalysis} onChange={(v) => updateNested("analysis", "investmentAnalysis", v)} />
                <SectionToggle id="an-debt-schedule" label="Debt service schedule"
                  description="Year-by-year breakdown of interest expense, principal payments, outstanding loan balance, and DSCR."
                  checked={config.analysis.debtSchedule} onChange={(v) => updateNested("analysis", "debtSchedule", v)} />
              </div>
            </div>
          </div>

          {/* Format */}
          <CardSection title="Format">
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="an-landscape" label="Allow landscape orientation"
                description="Users can choose landscape when exporting — wider pages fit more columns."
                checked={config.analysis.allowLandscape} onChange={(v) => updateNested("analysis", "allowLandscape", v)} />
              <CategorySwitch id="an-portrait" label="Allow portrait orientation"
                description="Users can choose portrait when exporting — taller layout, closer to standard paper."
                checked={config.analysis.allowPortrait} onChange={(v) => updateNested("analysis", "allowPortrait", v)} />
            </div>
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="an-premium" label="Allow premium exports"
                description="Enables the AI-enhanced export mode (richer formatting, insights, design-quality output)."
                checked={config.analysis.allowPremium} onChange={(v) => updateNested("analysis", "allowPremium", v)} />
              <CategorySwitch id="an-dense" label="Dense pagination"
                description="Pack as much content per page as possible. Column headers repeat at the top of each continuation page."
                checked={config.analysis.densePagination} onChange={(v) => updateNested("analysis", "densePagination", v)} />
            </div>
          </CardSection>

          {/* Report Length */}
          <CardSection title="Report Length">
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="an-short" label="Allow short reports"
                description="Users can generate a condensed version of the report with only key metrics and headline figures."
                checked={config.analysis.allowShort} onChange={(v) => updateNested("analysis", "allowShort", v)} />
            </div>
            <div className="px-4 divide-y divide-border">
              <CategorySwitch id="an-extended" label="Allow extended reports"
                description="Users can generate the full-length report with all sections, charts, and detailed line items included."
                checked={config.analysis.allowExtended} onChange={(v) => updateNested("analysis", "allowExtended", v)} />
            </div>
          </CardSection>
        </TabsContent>
      </Tabs>

      {/* Bottom actions */}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={handleReset} disabled={saving} data-testid="button-export-reset-bottom">
          Reset to defaults
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!dirty || saving} data-testid="button-export-save-bottom">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
