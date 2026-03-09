import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconResearch, IconTrending } from "@/components/icons/brand-icons";
import ResearchTab from "./ResearchTab";
import MarketRatesTab from "./MarketRatesTab";

interface ResearchCenterTabProps {
  initialTab?: string;
}

export default function ResearchCenterTab({ initialTab }: ResearchCenterTabProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "research");

  return (
    <div className="space-y-6 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground" data-testid="text-research-center-title">Research Center</h2>
          <p className="text-muted-foreground text-sm">AI research configuration and live market rate monitoring.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 h-auto p-1 bg-muted border border-border" data-testid="tabs-research-center">
          <TabsTrigger value="research" className="py-2.5 gap-2" data-testid="tab-research-config">
            <IconResearch className="w-4 h-4" />
            <span className="hidden sm:inline">Research</span>
          </TabsTrigger>
          <TabsTrigger value="market-rates" className="py-2.5 gap-2" data-testid="tab-market-rates">
            <IconTrending className="w-4 h-4" />
            <span className="hidden sm:inline">Market Rates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="research" className="mt-6">
          <ResearchTab />
        </TabsContent>

        <TabsContent value="market-rates" className="mt-6">
          <MarketRatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
