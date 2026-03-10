import { useState } from "react";
import Layout from "@/components/Layout";
import { AnimatedPage } from "@/components/graphics";
import { PageHeader } from "@/components/ui/page-header";
import { IconAnalysis, IconCalculator, IconExecutive, IconCompare, IconTimeline, IconWallet } from "@/components/icons";import SensitivityAnalysis from "./SensitivityAnalysis";
import FinancingAnalysis from "./FinancingAnalysis";
import FundingPredictor from "./FundingPredictor";
import ExecutiveSummary from "./ExecutiveSummary";
import ComparisonView from "./ComparisonView";
import TimelineView from "./TimelineView";

type AnalysisTab = "sensitivity" | "financing" | "funding" | "executive" | "compare" | "timeline";

export default function Analysis() {
  const [tab, setTab] = useState<AnalysisTab>("sensitivity");

  const tabs: { id: AnalysisTab; label: string; icon: any }[] = [
    { id: "sensitivity", label: "Sensitivity", icon: IconAnalysis },
    { id: "financing", label: "Financing", icon: IconCalculator },
    { id: "funding", label: "Funding", icon: IconWallet },
    { id: "executive", label: "Executive Summary", icon: IconExecutive },
    { id: "compare", label: "Compare", icon: IconCompare },
    { id: "timeline", label: "Timeline", icon: IconTimeline },
  ];

  return (
    <Layout>
      <AnimatedPage>
      <div className="space-y-6">
        <PageHeader
          title="Analysis"
          subtitle="Sensitivity modeling, financing tools, and executive overview"
          actions={
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    data-testid={`tab-${t.id}`}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      tab === t.id
                        ? "bg-primary text-primary-foreground border border-primary"
                        : "bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          }
        />

        {tab === "sensitivity" && <SensitivityAnalysis embedded />}
        {tab === "financing" && <FinancingAnalysis embedded />}
        {tab === "funding" && <FundingPredictor embedded />}
        {tab === "executive" && <ExecutiveSummary />}
        {tab === "compare" && <ComparisonView embedded />}
        {tab === "timeline" && <TimelineView embedded />}
      </div>
      </AnimatedPage>
    </Layout>
  );
}
