import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Percent } from "lucide-react";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "./hooks";

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
      { ...form },
      {
        onSuccess: () => {
          setIsDirty(false);
          toast({ title: "Saved", description: "Other assumptions saved." });
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
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Percent className="w-4 h-4 text-muted-foreground" /> Company Inflation
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
            <Input
              type="number"
              step="0.001"
              value={form.companyInflationRate === null ? "" : form.companyInflationRate}
              onChange={(e) => updateField("companyInflationRate", e.target.value === "" ? null : parseFloat(e.target.value))}
              placeholder="Default (Global)"
              className="bg-card"
              data-testid="input-company-inflation-rate"
            />
            <p className="text-[10px] text-muted-foreground">
              Overrides global inflation for management company overhead calculations. 
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
          <Save className="w-5 h-5" />
          {updateGlobalMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
