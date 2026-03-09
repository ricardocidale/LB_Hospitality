import { IconAnalysis, IconShield, IconTrending, useState } from "@/components/icons/brand-icons";
import { AnimatedPage, ScrollReveal } from "@/components/graphics";
import { DSCRTab, DebtYieldTab, StressTestTab, PrepaymentTab } from "@/components/financing";

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
          <div className="flex gap-2 overflow-x-auto pb-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-muted text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <ScrollReveal>
            <ContentPanel variant="light">
              <div className="space-y-6">
                <div className="flex items-start gap-3 bg-muted rounded-lg p-3">
                  <DescIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{desc.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc.body}</p>
                  </div>
                </div>
                {activeTab === "dscr" && <DSCRTab />}
                {activeTab === "debt-yield" && <DebtYieldTab />}
                {activeTab === "sensitivity" && <StressTestTab />}
                {activeTab === "prepayment" && <PrepaymentTab />}
              </div>
            </ContentPanel>
          </ScrollReveal>
        </div>
      </AnimatedPage>
    </Wrapper>
  );
}
