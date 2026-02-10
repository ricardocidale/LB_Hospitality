import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (orientation: 'landscape' | 'portrait', includeDetails?: boolean) => void;
  title: string;
  showDetailOption?: boolean;
}

export function ExportDialog({ open, onClose, onExport, title, showDetailOption = false }: ExportDialogProps) {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [includeDetails, setIncludeDetails] = useState(false);

  const handleExport = () => {
    onExport(orientation, includeDetails);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-5">
          <div>
            <Label className="text-sm font-medium mb-3 block">Select orientation:</Label>
            <RadioGroup value={orientation} onValueChange={(v) => setOrientation(v as 'landscape' | 'portrait')}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="landscape" id="landscape" />
                <Label htmlFor="landscape" className="cursor-pointer">Landscape (wider)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="portrait" id="portrait" />
                <Label htmlFor="portrait" className="cursor-pointer">Portrait (taller)</Label>
              </div>
            </RadioGroup>
          </div>

          {showDetailOption && (
            <div className="border-t pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="includeDetails"
                  checked={includeDetails}
                  onCheckedChange={(checked) => setIncludeDetails(checked === true)}
                  data-testid="checkbox-include-details"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="includeDetails" className="cursor-pointer text-sm font-medium">
                    Include formula details
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Expand all line items to show the underlying calculations and formulas used for each figure.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={handleExport} data-testid="button-export-confirm">Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
