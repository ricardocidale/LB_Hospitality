/**
 * Settings.tsx — Systemwide assumptions configuration page.
 *
 * This page lets management-level users configure the "global" variables that
 * drive the entire financial model. Changes are saved to the global_assumptions table
 * and trigger a full financial recalculation across all properties and dashboards.
 */
import Layout from "@/components/Layout";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import { 
  useGlobalAssumptions, 
  useUpdateGlobalAssumptions, 
  useProperties, 
  useUpdateProperty, 
} from "@/lib/api";
import { Tabs, TabsContent, CurrentThemeTab } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { IconHotel, IconGlobe, IconSliders } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { SaveButton } from "@/components/ui/save-button";
import { useState } from "react";
import { parseMoneyInput } from "@/lib/formatters";
import { 
  PortfolioTab, 
  MacroTab, 
  OtherTab,
} from "@/components/settings";

export default function Settings() {
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const updateGlobal = useUpdateGlobalAssumptions();
  const updateProperty = useUpdateProperty();
  const { toast } = useToast();
  
  const [globalDraft, setGlobalDraft] = useState<any>(null);
  const [propertyDrafts, setPropertyDrafts] = useState<Record<number, any>>({});
  const [settingsTab, setSettingsTab] = useState("portfolio");

  if (globalLoading || propertiesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!global || !properties) return null;

  const currentGlobal = globalDraft || global;

  const handleGlobalChange = (key: string, value: string | boolean) => {
    if (typeof value === "boolean") {
      setGlobalDraft({ ...currentGlobal, [key]: value });
      return;
    }
    const numValue = parseFloat(value);
    const stringKeys = ["preferredLlm", "companyName", "companyOpsStartDate", "companyPhone", "companyEmail", "companyWebsite", "companyEin", "fundingSourceLabel", "safeTranche1Date", "safeTranche2Date"];
    if (!isNaN(numValue) && !stringKeys.includes(key)) {
      setGlobalDraft({ ...currentGlobal, [key]: numValue });
    } else {
      setGlobalDraft({ ...currentGlobal, [key]: value });
    }
  };

  const handleNestedChange = (parent: string, key: string, value: string | boolean) => {
    if (typeof value === "boolean") {
      setGlobalDraft({
        ...currentGlobal,
        [parent]: { ...(currentGlobal as any)[parent], [key]: value }
      });
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setGlobalDraft({
          ...currentGlobal,
          [parent]: { ...(currentGlobal as any)[parent], [key]: numValue }
        });
      } else {
        setGlobalDraft({
          ...currentGlobal,
          [parent]: { ...(currentGlobal as any)[parent], [key]: value }
        });
      }
    }
  };

  const handlePropertyChange = (id: number, key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setPropertyDrafts({
        ...propertyDrafts,
        [id]: { ...(propertyDrafts[id] || {}), [key]: numValue }
      });
    }
  };

  const handlePropertyMoneyChange = (id: number, key: string, value: string) => {
    const numValue = parseMoneyInput(value);
    setPropertyDrafts({
      ...propertyDrafts,
      [id]: { ...(propertyDrafts[id] || {}), [key]: numValue }
    });
  };

  const handleSaveGlobal = () => {
    if (globalDraft) {
      updateGlobal.mutate(globalDraft, {
        onSuccess: () => {
          toast({ title: "Saved", description: "Systemwide assumptions updated successfully." });
          setGlobalDraft(null);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save systemwide assumptions.", variant: "destructive" });
        }
      });
    }
  };

  const handleSaveProperty = (id: number) => {
    if (propertyDrafts[id]) {
      updateProperty.mutate({ id, data: propertyDrafts[id] }, {
        onSuccess: () => {
          toast({ title: "Saved", description: "Property updated successfully." });
          setPropertyDrafts({ ...propertyDrafts, [id]: undefined });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save property.", variant: "destructive" });
        }
      });
    }
  };

  const commonProps = {
    global,
    currentGlobal,
    globalDraft,
    handleGlobalChange,
    handleNestedChange,
    properties,
    propertyDrafts,
    handlePropertyChange,
    handlePropertyMoneyChange,
    handleSaveProperty,
    updatePropertyPending: updateProperty.isPending,
  };

  return (
    <Layout>
      <AnimatedPage>
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="General Configuration"
          subtitle="Configure variables driving the financial model"
          variant="dark"
          actions={
            <SaveButton 
              onClick={handleSaveGlobal} 
              disabled={!globalDraft} 
              isPending={updateGlobal.isPending} 
            />
          }
        />

        <Tabs value={settingsTab} onValueChange={setSettingsTab} className="w-full">
          <CurrentThemeTab
            tabs={[
              { value: 'portfolio', label: 'Property Defaults', icon: IconHotel },
              { value: 'macro', label: 'Macro', icon: IconGlobe },
              { value: 'other', label: 'Other', icon: IconSliders }
            ]}
            activeTab={settingsTab}
            onTabChange={setSettingsTab}
          />

          <TabsContent value="portfolio">
            <PortfolioTab {...commonProps} />
          </TabsContent>

          <TabsContent value="macro">
            <MacroTab 
              {...commonProps} 
              setGlobalDraft={setGlobalDraft}
              handleSaveGlobal={handleSaveGlobal}
              updateGlobalPending={updateGlobal.isPending}
            />
          </TabsContent>

          <TabsContent value="other">
            <OtherTab 
              {...commonProps}
              handleSaveGlobal={handleSaveGlobal}
              updateGlobalPending={updateGlobal.isPending}
            />
          </TabsContent>

        </Tabs>
      </div>
      </AnimatedPage>
    </Layout>
  );
}
