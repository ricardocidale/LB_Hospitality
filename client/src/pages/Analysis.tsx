import { useState } from "react";
import Layout from "@/components/Layout";
import { AnimatedPage } from "@/components/graphics";
import { PageHeader } from "@/components/ui/page-header";
import { IconAnalysis, IconCalculator, IconCompare, IconTimeline, IconSliders } from "@/components/icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import SensitivityAnalysis from "./SensitivityAnalysis";
import FinancingAnalysis from "./FinancingAnalysis";
import ComparisonView from "./ComparisonView";
import TimelineView from "./TimelineView";

type AnalysisTab = "sensitivity" | "compare" | "timeline" | "financing";

export default function Analysis() {
  const [tab, setTab] = useState<AnalysisTab>("sensitivity");

  const tabs: { id: AnalysisTab; label: string; icon: any }[] = [
    { id: "sensitivity", label: "Sensitivity", icon: IconSliders },
    { id: "compare", label: "Compare", icon: IconCompare },
    { id: "timeline", label: "Timeline", icon: IconTimeline },
    { id: "financing", label: "Financing", icon: IconCalculator },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Simulation and Analysis"
          subtitle="Advanced modeling tools for sensitivity testing, property comparison, investment timelines, and debt sizing."
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as AnalysisTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-max">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="flex items-center gap-2"
                  data-testid={`tab-trigger-${t.id}`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="sensitivity" className="mt-0 border-none p-0">
                  <SensitivityAnalysis embedded />
                </TabsContent>
                <TabsContent value="compare" className="mt-0 border-none p-0">
                  <ComparisonView embedded />
                </TabsContent>
                <TabsContent value="timeline" className="mt-0 border-none p-0">
                  <TimelineView embedded />
                </TabsContent>
                <TabsContent value="financing" className="mt-0 border-none p-0">
                  <FinancingAnalysis embedded />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
}
