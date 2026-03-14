import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconPhone, IconGlobe, IconHash, IconCalendar, IconProperties, IconMail, IconMapPin } from "@/components/icons";
import { useGlobalAssumptions, useUpdateAdminConfig } from "@/lib/api";
import { useGeoSelect, GEO_CLEAR_VALUE } from "@/hooks/use-geo";
import LogoSelector from "./LogoSelector";
import type { AdminSaveState } from "@/components/admin/types/save-state";

interface BrandingTabProps {
  onNavigate?: (tab: string) => void;
  onSaveStateChange?: (state: AdminSaveState | null) => void;
}

export default function BrandingTab({ onNavigate, onSaveStateChange }: BrandingTabProps) {
  const { toast } = useToast();
  const { data: globalAssumptions } = useGlobalAssumptions();
  const updateGlobalMutation = useUpdateAdminConfig();

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

  const handleSave = useCallback(() => {
    updateGlobalMutation.mutate(
      { ...form },
      {
        onSuccess: () => {
          setIsDirty(false);
          toast({ title: "Saved", description: "Management company settings saved." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
        },
      }
    );
  }, [form, updateGlobalMutation, toast]);

  const saveRef = useRef<(() => void) | undefined>(undefined);
  saveRef.current = handleSave;

  useEffect(() => {
    onSaveStateChange?.({
      isDirty,
      isPending: updateGlobalMutation.isPending,
      onSave: () => saveRef.current?.(),
    });
  }, [isDirty, updateGlobalMutation.isPending, onSaveStateChange]);

  useEffect(() => {
    return () => onSaveStateChange?.(null);
  }, [onSaveStateChange]);

  const updateField = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const geo = useGeoSelect({
    countryName: form.companyCountry,
    stateName: form.companyStateProvince,
    onCountryChange: (v) => updateField("companyCountry", v),
    onStateChange: (v) => updateField("companyStateProvince", v),
    onCityChange: (v) => updateField("companyCity", v),
  });

  return (
    <div className="space-y-6">
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
                    <Label className="label-text text-foreground">Country</Label>
                    <Select value={geo.countryCode || GEO_CLEAR_VALUE} onValueChange={geo.handleCountryChange}>
                      <SelectTrigger className="bg-card" data-testid="select-company-country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        <SelectItem value={GEO_CLEAR_VALUE} className="text-muted-foreground">None</SelectItem>
                        {geo.countries.map((c) => (
                          <SelectItem key={c.isoCode} value={c.isoCode}>
                            {c.flag} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-foreground">State / Province</Label>
                    <Select value={geo.stateCode || GEO_CLEAR_VALUE} onValueChange={geo.handleStateChange} disabled={!geo.countryCode}>
                      <SelectTrigger className="bg-card" data-testid="select-company-state">
                        <SelectValue placeholder={geo.countryCode ? "Select state" : "Select country first"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        <SelectItem value={GEO_CLEAR_VALUE} className="text-muted-foreground">None</SelectItem>
                        {geo.states.map((s) => (
                          <SelectItem key={s.isoCode} value={s.isoCode}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="label-text text-foreground">City</Label>
                    <Select value={form.companyCity || GEO_CLEAR_VALUE} onValueChange={geo.handleCityChange} disabled={!geo.stateCode}>
                      <SelectTrigger className="bg-card" data-testid="select-company-city">
                        <SelectValue placeholder={geo.stateCode ? "Select city" : "Select state first"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        <SelectItem value={GEO_CLEAR_VALUE} className="text-muted-foreground">None</SelectItem>
                        {geo.cities.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
    </div>
  );
}
