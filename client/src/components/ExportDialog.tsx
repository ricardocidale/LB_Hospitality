/**
 * ExportDialog.tsx — Modal for configuring PDF / PowerPoint / PNG export options.
 *
 * Before generating an export file, the user can choose:
 *   - Orientation — landscape (default, best for wide tables) or portrait
 *   - Report Version — short (summary only) or extended (expanded sections, no formulas)
 *
 * Both choices are persisted in localStorage so the last selection becomes
 * the default for subsequent exports across all pages and sessions.
 *
 * The dialog delegates actual file generation to the parent via the
 * `onExport` callback (see lib/exports for the Excel/PPTX/PDF generators).
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type ExportVersion = "short" | "extended";

const ORIENTATION_KEY = "export-orientation";
const VERSION_KEY = "export-version";

function getStoredOrientation(): "landscape" | "portrait" {
  try {
    const v = localStorage.getItem(ORIENTATION_KEY);
    if (v === "portrait") return "portrait";
  } catch {}
  return "landscape";
}

function getStoredVersion(): ExportVersion {
  try {
    const v = localStorage.getItem(VERSION_KEY);
    if (v === "short" || v === "extended") return v;
  } catch {}
  return "short";
}

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (orientation: "landscape" | "portrait", version: ExportVersion) => void;
  title: string;
  showVersionOption?: boolean;
}

export function ExportDialog({ open, onClose, onExport, title, showVersionOption = true }: ExportDialogProps) {
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(getStoredOrientation);
  const [version, setVersion] = useState<ExportVersion>(getStoredVersion);

  useEffect(() => {
    if (open) {
      setOrientation(getStoredOrientation());
      setVersion(getStoredVersion());
    }
  }, [open]);

  const handleOrientationChange = (v: string) => {
    const val = v as "landscape" | "portrait";
    setOrientation(val);
    try { localStorage.setItem(ORIENTATION_KEY, val); } catch {}
  };

  const handleVersionChange = (v: string) => {
    const val = v as ExportVersion;
    setVersion(val);
    try { localStorage.setItem(VERSION_KEY, val); } catch {}
  };

  const handleExport = () => {
    onExport(orientation, version);
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
            <Label className="text-sm font-medium mb-3 block">Orientation</Label>
            <RadioGroup value={orientation} onValueChange={handleOrientationChange}>
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

          {showVersionOption && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-3 block">Report Version</Label>
              <RadioGroup value={version} onValueChange={handleVersionChange}>
                <div className="flex items-start space-x-2 mb-3">
                  <RadioGroupItem value="short" id="version-short" className="mt-0.5" />
                  <div className="grid gap-1 leading-none">
                    <Label htmlFor="version-short" className="cursor-pointer text-sm font-medium">Short</Label>
                    <p className="text-xs text-muted-foreground">Summary view with top-level figures only</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="extended" id="version-extended" className="mt-0.5" />
                  <div className="grid gap-1 leading-none">
                    <Label htmlFor="version-extended" className="cursor-pointer text-sm font-medium">Extended</Label>
                    <p className="text-xs text-muted-foreground">Expanded sections with line-item breakdowns</p>
                  </div>
                </div>
              </RadioGroup>
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
