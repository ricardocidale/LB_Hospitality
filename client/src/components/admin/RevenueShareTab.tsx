import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info, Save, Percent, Coins } from "lucide-react";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "./hooks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RevenueShareTab() {
  const { toast } = useToast();
  const { data: globalAssumptions } = useGlobalAssumptions();
  const updateGlobalMutation = useUpdateGlobalAssumptions();

  const [form, setForm] = useState({
    baseManagementFee: 0,
    incentiveManagementFee: 0,
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (globalAssumptions) {
      setForm({
        baseManagementFee: globalAssumptions.baseManagementFee ?? 0,
        incentiveManagementFee: globalAssumptions.incentiveManagementFee ?? 0,
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
          toast({ title: "Saved", description: "Revenue share settings saved." });
        },
      }
    );
  };

  const updateField = (field: keyof typeof form, pctValue: number) => {
    setForm(prev => ({ ...prev, [field]: pctValue / 100 }));
    setIsDirty(true);
  };

  return (
    <div className="space-y-6 pb-20">
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-semibold">Important Notice</AlertTitle>
        <AlertDescription className="text-primary/80">
          These are suggested starting values for incentive fees paid by properties to the management company. 
          Actual values are set per property and will override these defaults.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Coins className="w-4 h-4 text-muted-foreground" /> Base Management Fee
            </CardTitle>
            <CardDescription className="label-text">Suggested base fee as a percentage of total revenue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="label-text text-foreground flex items-center gap-2">
                <Percent className="w-3 h-3" /> Fee Percentage
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  value={parseFloat((form.baseManagementFee * 100).toFixed(4))}
                  onChange={(e) => updateField("baseManagementFee", parseFloat(e.target.value) || 0)}
                  placeholder="8.5"
                  className="bg-card pr-8"
                  data-testid="input-base-management-fee"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground text-sm">
                  %
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">e.g. 8.5 for 8.5%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Coins className="w-4 h-4 text-muted-foreground" /> Incentive Management Fee
            </CardTitle>
            <CardDescription className="label-text">Suggested incentive fee as a percentage of GOP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="label-text text-foreground flex items-center gap-2">
                <Percent className="w-3 h-3" /> Fee Percentage
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  value={parseFloat((form.incentiveManagementFee * 100).toFixed(4))}
                  onChange={(e) => updateField("incentiveManagementFee", parseFloat(e.target.value) || 0)}
                  placeholder="12"
                  className="bg-card pr-8"
                  data-testid="input-incentive-management-fee"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground text-sm">
                  %
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">e.g. 12 for 12%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={!isDirty || updateGlobalMutation.isPending}
          className="shadow-xl rounded-full px-8 h-12 flex items-center gap-2"
          data-testid="button-save-revshare"
        >
          <Save className="w-5 h-5" />
          {updateGlobalMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
