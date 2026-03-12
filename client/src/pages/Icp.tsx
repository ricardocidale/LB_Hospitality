import { useState } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { AnimatedPage, AnimatedSection } from "@/components/graphics/motion/AnimatedPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { IconTarget, IconHotel, IconCopy } from "@/components/icons";
import AssetDefinitionTab from "@/components/admin/AssetDefinitionTab";
import CompanyProfileTab from "@/components/company/CompanyProfileTab";
import { useGlobalAssumptions } from "@/lib/api";

export default function Icp() {
  const { data: ga } = useGlobalAssumptions();
  const [copied, setCopied] = useState(false);

  const prompt = ga?.assetDescription || "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <AnimatedPage>
        <div className="space-y-4 p-4 sm:p-6">
          <PageHeader
            title="Ideal Customer Profile (Management Company)"
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

          <AnimatedSection delay={0.2}>
            <Card className="bg-card border border-border/80 shadow-sm" data-testid="card-ai-prompt">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-foreground">
                    AI Prompt
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!prompt}
                    className="text-xs h-7 gap-1"
                    data-testid="button-copy-prompt"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <IconCopy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  The complete prompt served to AI research engines. Built from Property Profile and Asset Definition inputs.
                  Save changes in Asset Definition to update.
                </p>
              </CardHeader>
              <CardContent>
                {prompt ? (
                  <div className="space-y-1.5">
                    <pre
                      className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-foreground/90 bg-muted/40 border border-border rounded p-4 max-h-[600px] overflow-y-auto"
                      data-testid="text-ai-prompt"
                    >
                      {prompt}
                    </pre>
                    <p className="text-xs text-muted-foreground italic">
                      {prompt.length.toLocaleString()} characters
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">
                    No prompt generated yet. Configure the Asset Definition and save to generate the AI prompt.
                  </p>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </Layout>
  );
}
