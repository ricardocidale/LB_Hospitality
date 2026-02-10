import { useState } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, DarkGlassTabs } from "@/components/ui/tabs";
import { ClipboardCheck, FileText, HelpCircle, PlayCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import CheckerManual from "./CheckerManual";
import Methodology from "./Methodology";
import { useWalkthroughStore } from "@/components/GuidedWalkthrough";
import { Card } from "@/components/ui/card";
import { GlassButton } from "@/components/ui/glass-button";

type HelpTab = "checker-manual" | "user-manual" | "guided-tour";

export default function Help() {
  const { user, isAdmin } = useAuth();
  const isChecker = isAdmin || user?.role === "checker";
  const defaultTab: HelpTab = isChecker ? "checker-manual" : "user-manual";
  const [tab, setTab] = useState<HelpTab>(defaultTab);
  const { setCompleted: resetWalkthrough } = useWalkthroughStore();

  const tabs = [
    ...(isChecker ? [{ value: "checker-manual" as const, label: "Checker Manual", icon: ClipboardCheck }] : []),
    { value: "user-manual" as const, label: "User Manual", icon: FileText },
    { value: "guided-tour" as const, label: "Guided Tour", icon: HelpCircle },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Help & Manuals"
          subtitle="Documentation, verification guides, and interactive tours"
          variant="dark"
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as HelpTab)} className="w-full">
          <DarkGlassTabs
            tabs={tabs}
            activeTab={tab}
            onTabChange={(v) => setTab(v as HelpTab)}
          />

          {isChecker && (
            <TabsContent value="checker-manual" className="space-y-6 mt-6">
              <CheckerManual embedded />
            </TabsContent>
          )}
          <TabsContent value="user-manual" className="space-y-6 mt-6">
            <Methodology embedded />
          </TabsContent>
          <TabsContent value="guided-tour" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-xl border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-[#9FBCA4]/15 flex items-center justify-center mx-auto">
                  <PlayCircle className="w-8 h-8 text-[#9FBCA4]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-display font-semibold">Interactive Guided Tour</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Walk through the key features of the application step by step. The tour highlights navigation, tools, and important areas of the interface.
                  </p>
                </div>
                <GlassButton
                  variant="primary"
                  onClick={() => resetWalkthrough(false)}
                  data-testid="button-start-guided-tour"
                >
                  <PlayCircle className="w-4 h-4" />
                  Start Guided Tour
                </GlassButton>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
