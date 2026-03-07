import { useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, CurrentThemeTab } from "@/components/ui/tabs";
import { ClipboardCheck, FileText, HelpCircle, PlayCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import CheckerManual from "./CheckerManual";
import UserManual from "./user-manual";
import { useWalkthroughStore } from "@/components/GuidedWalkthrough";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type HelpTab = "user-manual" | "checker-manual" | "guided-tour";

export default function Help() {
  const { user, isAdmin, isChecker: authIsChecker } = useAuth();
  const isChecker = isAdmin || authIsChecker;
  const [tab, setTab] = useState<HelpTab>("user-manual");
  const { setTourActive, setShownThisSession } = useWalkthroughStore();
  const queryClient = useQueryClient();

  const handleStartTour = useCallback(async () => {
    await fetch("/api/profile/tour-prompt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hide: false }),
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    setShownThisSession(false);
    setTourActive(true);
  }, [queryClient, setShownThisSession, setTourActive]);

  const tabs = [
    { value: "user-manual" as const, label: "User Manual", icon: FileText },
    ...(isChecker ? [{ value: "checker-manual" as const, label: "Checker Manual", icon: ClipboardCheck }] : []),
    { value: "guided-tour" as const, label: "Guided Tour", icon: HelpCircle },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Help"
          subtitle="Documentation, verification guides, and interactive tours"
          variant="dark"
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as HelpTab)} className="w-full">
          <CurrentThemeTab
            tabs={tabs}
            activeTab={tab}
            onTabChange={(v) => setTab(v as HelpTab)}
          />

          <TabsContent value="user-manual" className="space-y-6 mt-6">
            <UserManual embedded />
          </TabsContent>
          {isChecker && (
            <TabsContent value="checker-manual" className="space-y-6 mt-6">
              <CheckerManual embedded />
            </TabsContent>
          )}
          <TabsContent value="guided-tour" className="space-y-6 mt-6">
            <Card className="bg-white border-gray-200 shadow-sm rounded-lg">
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-lg bg-primary/15 flex items-center justify-center mx-auto">
                  <PlayCircle className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-display font-semibold">Interactive Guided Tour</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Walk through the key features of the application step by step. The tour highlights navigation, tools, and important areas of the interface.
                  </p>
                </div>
                <Button
                  variant="default"
                  onClick={handleStartTour}
                  data-testid="button-start-guided-tour"
                >
                  <PlayCircle className="w-4 h-4" />
                  Start Guided Tour
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
