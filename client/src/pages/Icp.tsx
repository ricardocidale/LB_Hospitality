import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { AnimatedPage, AnimatedSection } from "@/components/graphics/motion/AnimatedPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconTarget, IconHotel } from "@/components/icons";
import AssetDefinitionTab from "@/components/admin/AssetDefinitionTab";
import CompanyProfileTab from "@/components/company/CompanyProfileTab";

export default function Icp() {
  return (
    <Layout>
      <AnimatedPage>
        <div className="space-y-4 p-4 sm:p-6">
          <PageHeader
            title="Ideal Customer Profile"
            subtitle="Define the target property profile and asset definition for the portfolio"
          />

          <AnimatedSection delay={0.1}>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-10 max-w-md">
                <TabsTrigger value="profile" className="text-sm gap-1.5" data-testid="tab-icp-profile">
                  <IconHotel className="w-4 h-4" />
                  Property Profile
                </TabsTrigger>
                <TabsTrigger value="definition" className="text-sm gap-1.5" data-testid="tab-icp-definition">
                  <IconTarget className="w-4 h-4" />
                  Asset Definition
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-6">
                <CompanyProfileTab />
              </TabsContent>

              <TabsContent value="definition" className="mt-6">
                <AssetDefinitionTab />
              </TabsContent>
            </Tabs>
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </Layout>
  );
}
