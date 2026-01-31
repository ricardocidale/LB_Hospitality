import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (orientation: 'landscape' | 'portrait') => void;
  title: string;
}

export function ExportDialog({ open, onClose, onExport, title }: ExportDialogProps) {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  const handleExport = () => {
    onExport(orientation);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
