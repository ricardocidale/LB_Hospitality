import { useState } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { BarChart3, Calculator } from "lucide-react";
import SensitivityAnalysis from "./SensitivityAnalysis";
import FinancingAnalysis from "./FinancingAnalysis";

type AnalysisTab = "sensitivity" | "financing";

export default function Analysis() {
  const [tab, setTab] = useState<AnalysisTab>("sensitivity");

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Analysis"
          subtitle="Sensitivity modeling and financing tools for your portfolio"
          actions={
            <div className="flex gap-2">
              <button
                onClick={() => setTab("sensitivity")}
                data-testid="tab-sensitivity"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  tab === "sensitivity"
                    ? "bg-[#9FBCA4]/25 text-white border border-[#9FBCA4]/50"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Sensitivity
              </button>
              <button
                onClick={() => setTab("financing")}
                data-testid="tab-financing"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  tab === "financing"
                    ? "bg-[#9FBCA4]/25 text-white border border-[#9FBCA4]/50"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                <Calculator className="w-4 h-4" />
                Financing
              </button>
            </div>
          }
        />

        {tab === "sensitivity" && <SensitivityContent />}
        {tab === "financing" && <FinancingContent />}
      </div>
    </Layout>
  );
}

function SensitivityContent() {
  return <SensitivityAnalysis embedded />;
}

function FinancingContent() {
  return <FinancingAnalysis embedded />;
}
