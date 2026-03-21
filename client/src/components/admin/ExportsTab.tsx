import { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  IconDownload, IconTrending, IconFileCheck, IconSliders,
} from "@/components/icons";
import { loadExportConfig, saveExportConfig, resetExportConfig, DEFAULT_EXPORT_CONFIG, type ExportConfig } from "@/lib/exportConfig";

function SectionToggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 py-3 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
        className="mt-0.5"
        data-testid={`checkbox-export-${id}`}
      />
      <div className="flex-1 min-w-0">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer leading-none">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

function GlobalSwitch({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 pr-4">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        data-testid={`switch-export-${id}`}
      />
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

export default function ExportsTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ExportConfig>(loadExportConfig);
  const [dirty, setDirty] = useState(false);

  const update = useCallback(<K extends keyof ExportConfig>(
    key: K,
    value: ExportConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const updateNested = useCallback(<
    G extends "overview" | "statements" | "analysis",
    K extends keyof ExportConfig[G],
  >(
    group: G,
    key: K,
    value: ExportConfig[G][K],
  ) => {
    setConfig((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value },
    }));
    setDirty(true);
  }, []);

  const handleSave = () => {
    saveExportConfig(config);
    setDirty(false);
    toast({ title: "Export settings saved", description: "Changes will apply to all new exports." });
  };

  const handleReset = () => {
    const defaults = resetExportConfig();
    setConfig(defaults);
    setDirty(false);
    toast({ title: "Export settings reset", description: "All settings restored to defaults." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Choose what appears in each report, and control orientation, quality, and layout behavior.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            data-testid="button-export-reset"
          >
            Reset to defaults
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty}
            data-testid="button-export-save"
          >
            Save changes
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 divide-y divide-border">
        <div className="px-4 py-1">
          <GroupHeader title="Format" />
          <GlobalSwitch
            id="allow-landscape"
            label="Allow landscape orientation"
            description="Users can choose landscape when exporting — wider pages fit more columns."
            checked={config.allowLandscape}
            onChange={(v) => update("allowLandscape", v)}
          />
          <Separator />
          <GlobalSwitch
            id="allow-portrait"
            label="Allow portrait orientation"
            description="Users can choose portrait when exporting — taller layout, closer to standard paper."
            checked={config.allowPortrait}
            onChange={(v) => update("allowPortrait", v)}
          />
          <Separator />
          <GlobalSwitch
            id="allow-premium"
            label="Allow premium exports"
            description="Enables the AI-enhanced export mode (richer formatting, insights, design-quality output)."
            checked={config.allowPremium}
            onChange={(v) => update("allowPremium", v)}
          />
          <Separator />
          <GlobalSwitch
            id="dense-pagination"
            label="Dense pagination"
            description="Pack as much content per page as possible. When a table must split across pages, column headers repeat at the top of each continuation page."
            checked={config.densePagination}
            onChange={(v) => update("densePagination", v)}
          />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1" data-testid="tab-export-overview">
            <IconDownload className="h-3.5 w-3.5 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="statements" className="flex-1" data-testid="tab-export-statements">
            <IconTrending className="h-3.5 w-3.5 mr-1.5" />
            Financial Statements
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex-1" data-testid="tab-export-analysis">
            <IconFileCheck className="h-3.5 w-3.5 mr-1.5" />
            Financial Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-4">
            Controls which sections appear in the <span className="font-medium text-foreground">Portfolio Overview</span> report — the first page users see when exporting from the Dashboard.
          </p>

          <div className="rounded-lg border bg-card divide-y divide-border px-4">
            <GroupHeader title="Metrics" />
            <SectionToggle
              id="kpi-metrics"
              label="Key Performance Metrics"
              description="Portfolio IRR, Equity Multiple, Cash-on-Cash Return, total equity invested, exit value, N-year revenue, NOI, and cash flow."
              checked={config.overview.kpiMetrics}
              onChange={(v) => updateNested("overview", "kpiMetrics", v)}
            />

            <GroupHeader title="Charts & Projections" />
            <SectionToggle
              id="revenue-chart"
              label="Revenue & Returns chart"
              description="Multi-series line chart showing Revenue, NOI, ANOI, and Cash Flow across the full hold period."
              checked={config.overview.revenueChart}
              onChange={(v) => updateNested("overview", "revenueChart", v)}
            />
            <SectionToggle
              id="projection-table"
              label="Year-by-year projection table"
              description="Tabular breakdown of Revenue, NOI, ANOI, and Cash Flow for every year in the projection."
              checked={config.overview.projectionTable}
              onChange={(v) => updateNested("overview", "projectionTable", v)}
            />

            <GroupHeader title="Portfolio Composition" />
            <SectionToggle
              id="composition-tables"
              label="Capital Structure & Composition"
              description="Portfolio summary (properties, rooms, markets, ADR) alongside capital structure (purchase price, cap rate, hold period, ANOI margin)."
              checked={config.overview.compositionTables}
              onChange={(v) => updateNested("overview", "compositionTables", v)}
            />
            <SectionToggle
              id="waterfall-table"
              label="USALI Profit Waterfall"
              description="Income bridge table from Total Revenue down through GOP, AGOP, NOI, and ANOI across all projection years."
              checked={config.overview.waterfallTable}
              onChange={(v) => updateNested("overview", "waterfallTable", v)}
            />

            <GroupHeader title="Property Detail" />
            <SectionToggle
              id="property-insights"
              label="Property Insights roster"
              description="One row per property: name, market, rooms, status, acquisition cost, ADR, and IRR."
              checked={config.overview.propertyInsights}
              onChange={(v) => updateNested("overview", "propertyInsights", v)}
            />
          </div>
        </TabsContent>

        <TabsContent value="statements" className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-4">
            Controls which statements and chart pages appear in <span className="font-medium text-foreground">Income Statement</span>, <span className="font-medium text-foreground">Cash Flow</span>, and <span className="font-medium text-foreground">Balance Sheet</span> exports — for both Dashboard (consolidated) and Property Detail reports.
          </p>

          <div className="rounded-lg border bg-card divide-y divide-border px-4">
            <GroupHeader title="Income Statement" />
            <SectionToggle
              id="income-statement"
              label="Income Statement table"
              description="Revenue, operating expenses, GOP, management fees, AGOP, fixed charges, NOI, FF&E reserve, and ANOI — by year."
              checked={config.statements.incomeStatement}
              onChange={(v) => updateNested("statements", "incomeStatement", v)}
            />
            <SectionToggle
              id="income-chart"
              label="Income trend chart page"
              description="Line chart following the Income Statement table — Revenue, GOP, AGOP, NOI, and ANOI across the hold period."
              checked={config.statements.incomeChart}
              onChange={(v) => updateNested("statements", "incomeChart", v)}
              disabled={!config.statements.incomeStatement}
            />

            <GroupHeader title="Cash Flow Statement" />
            <SectionToggle
              id="cash-flow"
              label="Cash Flow Statement table"
              description="Operating cash flow, debt service, FCF, principal payments, and Free Cash Flow to Equity — by year."
              checked={config.statements.cashFlow}
              onChange={(v) => updateNested("statements", "cashFlow", v)}
            />
            <SectionToggle
              id="cash-flow-chart"
              label="Cash Flow trend chart page"
              description="Line chart following the Cash Flow table — NOI, ANOI, FCF, and FCFE across the hold period."
              checked={config.statements.cashFlowChart}
              onChange={(v) => updateNested("statements", "cashFlowChart", v)}
              disabled={!config.statements.cashFlow}
            />

            <GroupHeader title="Balance Sheet" />
            <SectionToggle
              id="balance-sheet"
              label="Balance Sheet table"
              description="Total assets (cash + property NBV), outstanding debt, equity invested, and retained earnings — by year."
              checked={config.statements.balanceSheet}
              onChange={(v) => updateNested("statements", "balanceSheet", v)}
            />
            <SectionToggle
              id="balance-sheet-chart"
              label="Balance Sheet trend chart page"
              description="Line chart following the Balance Sheet — Total Assets, Liabilities, and Equity across the hold period."
              checked={config.statements.balanceSheetChart}
              onChange={(v) => updateNested("statements", "balanceSheetChart", v)}
              disabled={!config.statements.balanceSheet}
            />

            <GroupHeader title="Line Item Detail" />
            <SectionToggle
              id="detailed-line-items"
              label="Detailed line-item breakdowns"
              description='Show all sub-categories within each statement (e.g. Room Revenue, F&B Revenue, individual expense lines). When off, only section headers and bold totals are included — equivalent to the "Short" report version.'
              checked={config.statements.detailedLineItems}
              onChange={(v) => updateNested("statements", "detailedLineItems", v)}
            />
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-4">
            Controls which analytical sections appear in exports — available on both the Dashboard and Property Detail reports.
          </p>

          <div className="rounded-lg border bg-card divide-y divide-border px-4">
            <GroupHeader title="Summary Metrics" />
            <SectionToggle
              id="kpi-summary-cards"
              label="KPI summary cards"
              description="Highlighted metric cards at the top of a report page (e.g. Year 1 Revenue, Operating Income, Net Income with margin)."
              checked={config.analysis.kpiSummaryCards}
              onChange={(v) => updateNested("analysis", "kpiSummaryCards", v)}
            />

            <GroupHeader title="Investment Analysis" />
            <SectionToggle
              id="investment-analysis"
              label="Investment Analysis table"
              description="Equity invested, total property cost, loan amount, annual revenue and NOI, debt service, and closing cash balance — by year."
              checked={config.analysis.investmentAnalysis}
              onChange={(v) => updateNested("analysis", "investmentAnalysis", v)}
            />
            <SectionToggle
              id="debt-schedule"
              label="Debt service schedule"
              description="Year-by-year breakdown of interest expense, principal payments, outstanding loan balance, and DSCR."
              checked={config.analysis.debtSchedule}
              onChange={(v) => updateNested("analysis", "debtSchedule", v)}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={handleReset} data-testid="button-export-reset-bottom">
          Reset to defaults
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!dirty} data-testid="button-export-save-bottom">
          Save changes
        </Button>
      </div>
    </div>
  );
}
