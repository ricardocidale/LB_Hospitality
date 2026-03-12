import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IconSave, IconPhone, IconGlobe, IconHash, IconCalendar, IconPercent, IconProperties, IconMail, IconMapPin } from "@/components/icons";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "@/lib/api";
import LogoSelector from "./LogoSelector";

interface BrandingTabProps {
  onNavigate?: (tab: string) => void;
}

export default function BrandingTab({ onNavigate }: BrandingTabProps) {
  const { toast } = useToast();
  const { data: globalAssumptions } = useGlobalAssumptions();
  const updateGlobalMutation = useUpdateGlobalAssumptions();

  const [form, setForm] = useState({
    companyName: "",
    companyLogoId: null as number | null,
    companyPhone: "",
    companyEmail: "",
    companyWebsite: "",
    companyEin: "",
    companyFoundingYear: null as number | null,
    companyStreetAddress: "",
    companyCity: "",
    companyStateProvince: "",
    companyCountry: "",
    companyZipPostalCode: "",
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (globalAssumptions) {
      setForm({
        companyName: globalAssumptions.companyName || "Hospitality Business",
        companyLogoId: globalAssumptions.companyLogoId ?? null,
        companyPhone: globalAssumptions.companyPhone || "",
        companyEmail: globalAssumptions.companyEmail || "",
        companyWebsite: globalAssumptions.companyWebsite || "",
        companyEin: globalAssumptions.companyEin || "",
        companyFoundingYear: globalAssumptions.companyFoundingYear ?? null,
        companyStreetAddress: globalAssumptions.companyStreetAddress || "",
        companyCity: globalAssumptions.companyCity || "",
        companyStateProvince: globalAssumptions.companyStateProvince || "",
        companyCountry: globalAssumptions.companyCountry || "",
        companyZipPostalCode: globalAssumptions.companyZipPostalCode || "",
      });
      setIsDirty(false);
    }
  }, [globalAssumptions]);

  const handleSave = () => {
    updateGlobalMutation.mutate(
      { ...form },
      {
        onSuccess: () => {
          setIsDirty(false);
          toast({ title: "Saved", description: "Management company settings saved." });
        },
      }
    );
  };

  const updateField = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Identity & Contact */}
        <div className="space-y-6">
          <Card className="bg-card border border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <IconProperties className="w-4 h-4 text-muted-foreground" /> Identity
              </CardTitle>
              <CardDescription className="label-text">Core branding for the management entity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="label-text text-foreground">Company Name</Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    placeholder="Enter management company name"
                    className="bg-card"
                    data-testid="input-company-name"
                  />
                </div>
                <LogoSelector
                  label="Company Logo"
                  value={form.companyLogoId}
                  onChange={(logoId) => updateField("companyLogoId", logoId)}
                  showNone={true}
                  emptyLabel="Default Logo"
                  helpText="Select from Logo Portfolio"
                  testId="select-company-logo"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <IconPhone className="w-4 h-4 text-muted-foreground" /> Contact Information
              </CardTitle>
              <CardDescription className="label-text">Official contact details for reports and correspondence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="label-text text-foreground flex items-center gap-2"><IconMail className="w-3 h-3" /> Email</Label>
                  <Input
                    value={form.companyEmail}
                    onChange={(e) => updateField("companyEmail", e.target.value)}
                    placeholder="contact@company.com"
                    className="bg-card"
                    data-testid="input-company-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-text text-foreground flex items-center gap-2"><IconPhone className="w-3 h-3" /> Phone</Label>
                  <Input
                    value={form.companyPhone}
                    onChange={(e) => updateField("companyPhone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="bg-card"
                    data-testid="input-company-phone"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="label-text text-foreground flex items-center gap-2"><IconGlobe className="w-3 h-3" /> Website</Label>
                  <Input
                    value={form.companyWebsite}
                    onChange={(e) => updateField("companyWebsite", e.target.value)}
                    placeholder="https://www.company.com"
                    className="bg-card"
                    data-testid="input-company-website"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <IconHash className="w-4 h-4 text-muted-foreground" /> Financial & Regulatory
              </CardTitle>
              <CardDescription className="label-text">Corporate identification and fiscal settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="label-text text-foreground flex items-center gap-2">Tax ID / EIN</Label>
                  <Input
                    value={form.companyEin}
                    onChange={(e) => updateField("companyEin", e.target.value)}
                    placeholder="XX-XXXXXXX"
                    className="bg-card"
                    data-testid="input-company-ein"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-text text-foreground flex items-center gap-2"><IconCalendar className="w-3 h-3" /> Founding Year</Label>
                  <Input
                    type="number"
                    value={form.companyFoundingYear || ""}
                    onChange={(e) => updateField("companyFoundingYear", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="2020"
                    className="bg-card"
                    data-testid="input-company-founding-year"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location */}
        <div className="space-y-6">
          <Card className="bg-card border border-border/80 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <IconMapPin className="w-4 h-4 text-muted-foreground" /> Headquarters Location
              </CardTitle>
              <CardDescription className="label-text">Primary business address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="label-text text-foreground">Street Address</Label>
                  <Input
                    value={form.companyStreetAddress}
                    onChange={(e) => updateField("companyStreetAddress", e.target.value)}
                    placeholder="123 Business Way"
                    className="bg-card"
                    data-testid="input-company-street"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-text text-foreground">City</Label>
                    <Input
                      value={form.companyCity}
                      onChange={(e) => updateField("companyCity", e.target.value)}
                      placeholder="San Francisco"
                      className="bg-card"
                      data-testid="input-company-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-foreground">State / Province</Label>
                    <Input
                      value={form.companyStateProvince}
                      onChange={(e) => updateField("companyStateProvince", e.target.value)}
                      placeholder="CA"
                      className="bg-card"
                      data-testid="input-company-state"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-text text-foreground">Country</Label>
                    <Input
                      value={form.companyCountry}
                      onChange={(e) => updateField("companyCountry", e.target.value)}
                      placeholder="United States"
                      className="bg-card"
                      data-testid="input-company-country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-foreground">Zip / Postal Code</Label>
                    <Input
                      value={form.companyZipPostalCode}
                      onChange={(e) => updateField("companyZipPostalCode", e.target.value)}
                      placeholder="94105"
                      className="bg-card"
                      data-testid="input-company-zip"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={!isDirty || updateGlobalMutation.isPending}
          className="shadow-xl rounded-full px-8 h-12 flex items-center gap-2"
          data-testid="button-save-branding"
        >
          <IconSave className="w-5 h-5" />
          {updateGlobalMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
