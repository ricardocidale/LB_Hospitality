/**
 * Portfolio.tsx — Portfolio overview page listing all managed hospitality properties.
 *
 * This page shows a card grid of every property in the system, sorted by
 * acquisition date. Each card links to the property detail page and displays
 * the property photo, name, location, and status badge.
 *
 * Adding a property:
 *   The "Add Property" button opens a dialog where the user fills in basic
 *   details (name, location, photo, dates, room count, ADR, capital structure).
 *   Default operating-cost rates and revenue-share percentages are applied from
 *   the constants module so a new property can produce reasonable pro-formas
 *   immediately. The user can refine these later on the PropertyEdit page.
 *
 * Operations start date auto-fill:
 *   When the user sets an acquisition date, if the operations start date is
 *   still blank, it auto-fills to 6 months later — a typical renovation timeline
 *   for a boutique hospitality property.
 *
 * Deleting a property removes it from the portfolio and triggers a full
 * invalidation of all financial queries so dashboards update.
 */
import { useState } from "react";
import Layout from "@/components/Layout";
import { useProperties, useDeleteProperty, useCreateProperty, useGlobalAssumptions } from "@/lib/api";
import { Loader2, Plus, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GlassButton } from "@/components/ui/glass-button";
import { useToast } from "@/hooks/use-toast";
import { InsertProperty } from "@shared/schema";
import {
  DEFAULT_ADR_GROWTH_RATE,
  DEFAULT_START_OCCUPANCY,
  DEFAULT_MAX_OCCUPANCY,
  DEFAULT_OCCUPANCY_GROWTH_STEP,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_TAX_RATE,
  DEFAULT_ROOM_COUNT,
  DEFAULT_START_ADR,
  DEFAULT_STABILIZATION_MONTHS,
} from "@/lib/constants";
import { PageTransition } from "@/components/ui/animated";
import { AnimatedPage, AnimatedGrid } from "@/components/graphics";
import { AddPropertyDialog, PortfolioPropertyCard } from "@/components/portfolio";
import type { AddPropertyFormData } from "@/components/portfolio";

function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const INITIAL_FORM_DATA: AddPropertyFormData = {
  name: "",
  location: "",
  market: "",
  imageUrl: "",
  status: "Pipeline",
  acquisitionDate: "",
  operationsStartDate: "",
  purchasePrice: 0,
  buildingImprovements: 0,
  preOpeningCosts: 0,
  operatingReserve: 0,
  roomCount: DEFAULT_ROOM_COUNT,
  startAdr: DEFAULT_START_ADR,
  adrGrowthRate: DEFAULT_ADR_GROWTH_RATE,
  startOccupancy: DEFAULT_START_OCCUPANCY,
  maxOccupancy: DEFAULT_MAX_OCCUPANCY,
  occupancyRampMonths: DEFAULT_OCCUPANCY_RAMP_MONTHS,
  occupancyGrowthStep: DEFAULT_OCCUPANCY_GROWTH_STEP,
  stabilizationMonths: DEFAULT_STABILIZATION_MONTHS,
  type: "Full Equity",
  cateringBoostPercent: DEFAULT_CATERING_BOOST_PCT,
};

type PortfolioTab = "properties" | "map";

export default function Portfolio() {
  const { data: properties, isLoading, isError } = useProperties();
  const { data: global } = useGlobalAssumptions();
  const deleteProperty = useDeleteProperty();
  const createProperty = useCreateProperty();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PortfolioTab>("properties");
  const [formData, setFormData] = useState<AddPropertyFormData>({ ...INITIAL_FORM_DATA });

  const handleAcquisitionDateChange = (date: string) => {
    const updates: Partial<AddPropertyFormData> = { acquisitionDate: date };
    if (date && !formData.operationsStartDate) {
      updates.operationsStartDate = addMonths(date, 6);
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleDelete = (id: number, name: string) => {
    deleteProperty.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Property Deleted",
          description: `${name} has been removed from the portfolio.`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: `Failed to delete ${name}.`,
          variant: "destructive",
        });
      }
    });
  };

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM_DATA });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.location || !formData.imageUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in the property name, location, and upload a photo.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acquisitionDate || !formData.operationsStartDate) {
      toast({
        title: "Missing Dates",
        description: "Please set both the acquisition date and operations start date.",
        variant: "destructive",
      });
      return;
    }

    if (formData.operationsStartDate < formData.acquisitionDate) {
      toast({
        title: "Invalid Dates",
        description: "Operations start date cannot be before the acquisition date.",
        variant: "destructive",
      });
      return;
    }

    const propertyData: InsertProperty = {
      ...formData,
      costRateRooms: DEFAULT_COST_RATE_ROOMS,
      costRateFB: DEFAULT_COST_RATE_FB,
      costRateAdmin: DEFAULT_COST_RATE_ADMIN,
      costRateMarketing: DEFAULT_COST_RATE_MARKETING,
      costRatePropertyOps: DEFAULT_COST_RATE_PROPERTY_OPS,
      costRateUtilities: DEFAULT_COST_RATE_UTILITIES,
      costRateInsurance: DEFAULT_COST_RATE_INSURANCE,
      costRateTaxes: DEFAULT_COST_RATE_TAXES,
      costRateIT: DEFAULT_COST_RATE_IT,
      costRateFFE: DEFAULT_COST_RATE_FFE,
      costRateOther: DEFAULT_COST_RATE_OTHER,
      revShareEvents: DEFAULT_REV_SHARE_EVENTS,
      revShareFB: DEFAULT_REV_SHARE_FB,
      revShareOther: DEFAULT_REV_SHARE_OTHER,
      cateringBoostPercent: formData.cateringBoostPercent,
      exitCapRate: DEFAULT_EXIT_CAP_RATE,
      taxRate: DEFAULT_TAX_RATE,
    };

    createProperty.mutate(propertyData, {
      onSuccess: () => {
        toast({
          title: "Property Added",
          description: `${formData.name} has been added to the portfolio.`,
        });
        setIsAddDialogOpen(false);
        resetForm();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add property. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load portfolio data. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
      <PageTransition><div className="space-y-8">
        <PageHeader
          title="Property Portfolio"
          subtitle="Managed assets & developments"
          variant="dark"
          actions={
            <AddPropertyDialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isPending={createProperty.isPending}
              onCancel={() => { setIsAddDialogOpen(false); resetForm(); }}
              onAcquisitionDateChange={handleAcquisitionDateChange}
              trigger={
                <GlassButton data-testid="button-add-property">
                  <Plus className="w-4 h-4" />
                  Add Property
                </GlassButton>
              }
            />
          }
        />

        <AnimatedGrid className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties?.slice().sort((a, b) => new Date(a.acquisitionDate).getTime() - new Date(b.acquisitionDate).getTime()).map((property, index) => (
            <PortfolioPropertyCard
              key={property.id}
              property={property}
              propertyNumber={index + 1}
              onDelete={handleDelete}
            />
          ))}
        </AnimatedGrid>
      </div></PageTransition>
      </AnimatedPage>
    </Layout>
  );
}
