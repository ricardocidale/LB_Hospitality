import { useState } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { BarChart3, Calculator, FileBarChart, GitCompare, Clock } from "lucide-react";
import SensitivityAnalysis from "./SensitivityAnalysis";
import FinancingAnalysis from "./FinancingAnalysis";
import ExecutiveSummary from "./ExecutiveSummary";
import ComparisonView from "./ComparisonView";
import TimelineView from "./TimelineView";

type AnalysisTab = "sensitivity" | "financing" | "executive" | "compare" | "timeline";

export default function Analysis() {
  const [tab, setTab] = useState<AnalysisTab>("sensitivity");

  const tabs: { id: AnalysisTab; label: string; icon: any }[] = [
    { id: "sensitivity", label: "Sensitivity", icon: BarChart3 },
    { id: "financing", label: "Financing", icon: Calculator },
    { id: "executive", label: "Executive Summary", icon: FileBarChart },
    { id: "compare", label: "Compare", icon: GitCompare },
    { id: "timeline", label: "Timeline", icon: Clock },
  ];

  return (
    <Layout>
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      tab === t.id
                        ? "bg-primary/25 text-white border border-primary/50"
                        : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80"
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
        {tab === "executive" && <ExecutiveSummary />}
        {tab === "compare" && <ComparisonView embedded />}
        {tab === "timeline" && <TimelineView embedded />}
      </div>
    </Layout>
  );
}
