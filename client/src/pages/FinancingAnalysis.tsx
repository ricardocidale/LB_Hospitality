import { useState } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { ContentPanel } from "@/components/ui/content-panel";
import { IconCalculator, IconTrending, IconAnalysis, IconShield } from "@/components/icons";
import { AnimatedPage, ScrollReveal } from "@/components/graphics";
import { DSCRTab, DebtYieldTab, StressTestTab, PrepaymentTab } from "@/components/financing";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TabId = "dscr" | "debt-yield" | "sensitivity" | "prepayment";

const TABS = [
  { id: "dscr" as TabId, label: "DSCR Sizing", icon: IconCalculator },
  { id: "debt-yield" as TabId, label: "Debt Yield", icon: IconTrending },
  { id: "sensitivity" as TabId, label: "Stress Test", icon: IconAnalysis },
  { id: "prepayment" as TabId, label: "Prepayment", icon: IconShield },
];

const TAB_DESCRIPTIONS: Record<TabId, { icon: React.ComponentType<any>; title: string; body: string }> = {
  dscr: {
    icon: IconCalculator,
    title: "DSCR Loan Sizing",
    body: "Determines the maximum loan amount a property can support based on its Debt Service Coverage Ratio (DSCR). Lenders typically require a minimum DSCR of 1.20x–1.35x, meaning the property's NOI must exceed annual debt payments by that multiple. Enter your property's NOI and loan terms to see how much you can borrow.",
  },
  "debt-yield": {
    icon: IconTrending,
    title: "Debt Yield Analysis",
    body: "Debt Yield = NOI / Loan Amount. It measures the lender's return if they had to foreclose. Most commercial lenders require a minimum debt yield of 8–10%. This tool calculates your debt yield and determines the maximum loan based on that threshold, then compares it against the LTV constraint to find the binding limit.",
  },
  sensitivity: {
    icon: IconAnalysis,
    title: "Debt Stress Testing",
    body: "Tests how your loan performs under adverse conditions. The matrix shows DSCR at every combination of interest rate changes (in basis points) and NOI changes (in percent). Red cells indicate scenarios where DSCR falls below your minimum threshold — signaling potential covenant violations or debt service shortfalls.",
  },
  prepayment: {
    icon: IconShield,
    title: "Prepayment Penalty Calculator",
    body: "Calculates the cost of paying off a loan early. Three common methods: Yield Maintenance (compensates the lender for lost interest), Step-Down (declining percentage penalty over time, e.g. 5-4-3-2-1), and Defeasance (replacing the loan with government securities). Understanding prepayment costs is critical for refinancing or sale decisions.",
  },
};

export default function FinancingAnalysis({ embedded }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<TabId>("dscr");

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Layout;
  const desc = TAB_DESCRIPTIONS[activeTab];
  const DescIcon = desc.icon;

  return (
    <Wrapper>
      <AnimatedPage>
        <div className="space-y-6 p-4 md:p-6">
          {!embedded && (
            <PageHeader
              title="Financing Analysis"
              subtitle="Loan sizing, debt yield analysis, stress testing, and prepayment modeling"
            />
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:flex md:w-auto h-auto p-1 bg-muted/50 rounded-xl gap-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    data-testid={`tab-${tab.id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <ScrollReveal>
              <ContentPanel variant="light" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border/50">
                    <DescIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">{desc.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc.body}</p>
                    </div>
                  </div>

                  <TabsContent value="dscr" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <DSCRTab />
                  </TabsContent>
                  <TabsContent value="debt-yield" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <DebtYieldTab />
                  </TabsContent>
                  <TabsContent value="sensitivity" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <StressTestTab />
                  </TabsContent>
                  <TabsContent value="prepayment" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <PrepaymentTab />
                  </TabsContent>
                </div>
              </ContentPanel>
            </ScrollReveal>
          </Tabs>
        </div>
      </AnimatedPage>
    </Wrapper>
  );
}
