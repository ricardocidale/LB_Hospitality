import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPhone, IconGlobe, IconHash, IconCalendar, IconProperties, IconMail, IconMapPin } from "@/components/icons";
import { useGlobalAssumptions } from "@/lib/api";
import defaultLogo from "@/assets/logo.png";

export default function BrandingTab() {
  const { data: globalAssumptions } = useGlobalAssumptions();

  if (!globalAssumptions) return null;

  const disabledClass = "bg-muted cursor-not-allowed opacity-70";

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Company information is managed in{" "}
          <span className="font-medium text-foreground">Company Assumptions &gt; Company Setup</span>.
          This tab is a read-only reference view.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                    value={globalAssumptions.companyName || "Hospitality Business"}
                    disabled
                    className={disabledClass}
                    data-testid="input-company-name-readonly"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-text text-foreground">Company Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg border border-border bg-card flex items-center justify-center overflow-hidden">
                      <img
                        src={globalAssumptions.companyLogoUrl ?? globalAssumptions.companyLogo ?? defaultLogo}
                        alt="Company Logo"
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                  </div>
                </div>
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
                    value={globalAssumptions.companyEmail || ""}
                    disabled
                    className={disabledClass}
                    data-testid="input-company-email-readonly"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-text text-foreground flex items-center gap-2"><IconPhone className="w-3 h-3" /> Phone</Label>
                  <Input
                    value={globalAssumptions.companyPhone || ""}
                    disabled
                    className={disabledClass}
                    data-testid="input-company-phone-readonly"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="label-text text-foreground flex items-center gap-2"><IconGlobe className="w-3 h-3" /> Website</Label>
                  <Input
                    value={globalAssumptions.companyWebsite || ""}
                    disabled
                    className={disabledClass}
                    data-testid="input-company-website-readonly"
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
                    value={globalAssumptions.companyEin || ""}
                    disabled
                    className={disabledClass}
                    data-testid="input-company-ein-readonly"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="label-text text-foreground flex items-center gap-2"><IconCalendar className="w-3 h-3" /> Founding Year</Label>
                  <Input
                    value={globalAssumptions.companyFoundingYear ?? ""}
                    disabled
                    className={disabledClass}
                    data-testid="input-company-founding-year-readonly"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                    value={globalAssumptions.companyStreetAddress || ""}
                    disabled
                    className={disabledClass}
                    data-testid="input-company-street-readonly"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-text text-foreground">Country</Label>
                    <Input
                      value={globalAssumptions.companyCountry || ""}
                      disabled
                      className={disabledClass}
                      data-testid="input-company-country-readonly"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-foreground">State / Province</Label>
                    <Input
                      value={globalAssumptions.companyStateProvince || ""}
                      disabled
                      className={disabledClass}
                      data-testid="input-company-state-readonly"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-text text-foreground">City</Label>
                    <Input
                      value={globalAssumptions.companyCity || ""}
                      disabled
                      className={disabledClass}
                      data-testid="input-company-city-readonly"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-foreground">Zip / Postal Code</Label>
                    <Input
                      value={globalAssumptions.companyZipPostalCode || ""}
                      disabled
                      className={disabledClass}
                      data-testid="input-company-zip-readonly"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
