import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconBuilding2, IconTag, IconPackage } from "@/components/icons";
import BrandingTab from "./BrandingTab";
import AssetDefinitionTab from "./AssetDefinitionTab";
import ServicesTab from "./ServicesTab";

interface ManagementCompanyTabProps {
  onNavigate?: (tab: string) => void;
  initialTab?: string;
}

export default function ManagementCompanyTab({ onNavigate, initialTab }: ManagementCompanyTabProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "identity");

  return (
    <div className="space-y-6 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground" data-testid="text-mgmt-company-title">Hospitality Brand</h2>
          <p className="text-muted-foreground text-sm">Identity, asset configuration, and centralized services for the hospitality brand.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 h-auto p-1 bg-muted border border-border" data-testid="tabs-mgmt-company">
          <TabsTrigger value="identity" className="py-2.5 gap-2" data-testid="tab-mgmt-identity">
            <IconBuilding2 className="w-4 h-4" />
            <span className="hidden sm:inline">Identity</span>
          </TabsTrigger>
          <TabsTrigger value="asset" className="py-2.5 gap-2" data-testid="tab-mgmt-asset">
            <IconTag className="w-4 h-4" />
            <span className="hidden sm:inline">Asset Definition</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="py-2.5 gap-2" data-testid="tab-mgmt-services">
            <IconPackage className="w-4 h-4" />
            <span className="hidden sm:inline">Services</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-6">
          <BrandingTab onNavigate={onNavigate} />
        </TabsContent>

        <TabsContent value="asset" className="mt-6">
          <AssetDefinitionTab />
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <ServicesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
