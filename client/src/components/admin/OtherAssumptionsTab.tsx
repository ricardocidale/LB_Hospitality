import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IconSave, IconPercent } from "@/components/icons";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "@/lib/api";

export default function OtherAssumptionsTab() {
  const { toast } = useToast();
  const { data: globalAssumptions } = useGlobalAssumptions();
  const updateGlobalMutation = useUpdateGlobalAssumptions();

  const [form, setForm] = useState({
    companyInflationRate: null as number | null,
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (globalAssumptions) {
      setForm({
        companyInflationRate: globalAssumptions.companyInflationRate ?? null,
      });
      setIsDirty(false);
    }
  }, [globalAssumptions]);

  const handleSave = () => {
    updateGlobalMutation.mutate(
      { companyInflationRate: form.companyInflationRate ?? undefined },
      {
        onSuccess: () => {
          setIsDirty(false);
          toast({ title: "Saved", description: "Other assumptions saved." });
        },
      }
    );
  };

  const updateInflation = (rawValue: string) => {
    if (rawValue === "") {
      setForm(prev => ({ ...prev, companyInflationRate: null }));
    } else {
      setForm(prev => ({ ...prev, companyInflationRate: parseFloat(rawValue) / 100 }));
    }
    setIsDirty(true);
  };

  return (
    <div className="space-y-6 pb-20">
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <IconPercent className="w-4 h-4 text-muted-foreground" /> Company Inflation
          </CardTitle>
          <CardDescription className="label-text">
            Management company specific economic assumptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label className="label-text text-foreground flex items-center gap-2">
              Company Inflation Rate
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                value={form.companyInflationRate === null ? "" : parseFloat((form.companyInflationRate * 100).toFixed(4))}
                onChange={(e) => updateInflation(e.target.value)}
                placeholder="Default (Global)"
                className="bg-card pr-8"
                data-testid="input-company-inflation-rate"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground text-sm">
                %
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              e.g. 3 for 3%. Overrides global inflation for management company overhead calculations. 
              Falls back to global inflation if left empty.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={!isDirty || updateGlobalMutation.isPending}
          className="shadow-xl rounded-full px-8 h-12 flex items-center gap-2"
          data-testid="button-save-other-assumptions"
        >
          <IconSave className="w-5 h-5" />
          {updateGlobalMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
