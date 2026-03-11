import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type ExportVersion = "short" | "extended";
export type PremiumFormat = "xlsx" | "pptx" | "pdf" | "docx";

const ORIENTATION_KEY = "export-orientation";
const VERSION_KEY = "export-version";
const PREMIUM_KEY = "export-premium";

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

function getStoredPremium(): boolean {
  try {
    return localStorage.getItem(PREMIUM_KEY) === "true";
  } catch {}
  return false;
}

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (orientation: "landscape" | "portrait", version: ExportVersion) => void;
  title: string;
  showVersionOption?: boolean;
  premiumExportData?: PremiumExportPayload | null;
}

export interface PremiumExportPayload {
  entityName: string;
  companyName?: string;
  statementType?: string;
  years?: string[];
  rows?: Array<{
    category: string;
    values: (string | number)[];
    indent?: number;
    isBold?: boolean;
    isHeader?: boolean;
    isItalic?: boolean;
  }>;
  statements?: Array<{
    title: string;
    years: string[];
    rows: Array<{
      category: string;
      values: (string | number)[];
      indent?: number;
      isBold?: boolean;
      isHeader?: boolean;
      isItalic?: boolean;
    }>;
  }>;
  metrics?: Array<{ label: string; value: string }>;
  projectionYears?: number;
}

async function downloadPremiumExport(format: PremiumFormat, payload: PremiumExportPayload): Promise<void> {
  const response = await fetch("/api/exports/premium", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ format, ...payload }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Export failed (${response.status})`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  let filename = `export.${format}`;
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportDialog({ open, onClose, onExport, title, showVersionOption = true, premiumExportData }: ExportDialogProps) {
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(getStoredOrientation);
  const [version, setVersion] = useState<ExportVersion>(getStoredVersion);
  const [isPremium, setIsPremium] = useState(getStoredPremium);
  const [premiumFormat, setPremiumFormat] = useState<PremiumFormat>("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setOrientation(getStoredOrientation());
      setVersion(getStoredVersion());
      setIsPremium(getStoredPremium());
      setIsGenerating(false);
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

  const handlePremiumToggle = (checked: boolean) => {
    setIsPremium(checked);
    try { localStorage.setItem(PREMIUM_KEY, String(checked)); } catch {}
  };

  const handleExport = async () => {
    if (isPremium && premiumExportData) {
      setIsGenerating(true);
      try {
        await downloadPremiumExport(premiumFormat, premiumExportData);
        toast({ title: "Premium export complete", description: `Your ${premiumFormat.toUpperCase()} file has been downloaded.` });
        onClose();
      } catch (error: any) {
        console.error("[premium-export] Client error:", error);
        toast({ title: "Premium export failed", description: error.message || "Falling back to standard export.", variant: "destructive" });
        onExport(orientation, version);
        onClose();
      } finally {
        setIsGenerating(false);
      }
    } else {
      onExport(orientation, version);
      onClose();
    }
  };

  const hasPremiumData = !!premiumExportData;

  return (
    <Dialog open={open} onOpenChange={isGenerating ? undefined : onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-5">
          {hasPremiumData && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-emerald-50 to-sage-50 border-emerald-200">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <div>
                  <Label htmlFor="premium-toggle" className="text-sm font-medium cursor-pointer">Premium Export</Label>
                  <p className="text-xs text-muted-foreground">AI-enhanced formatting & insights</p>
                </div>
              </div>
              <Switch
                id="premium-toggle"
                checked={isPremium}
                onCheckedChange={handlePremiumToggle}
                data-testid="switch-premium-export"
              />
            </div>
          )}

          {isPremium && hasPremiumData ? (
            <div>
              <Label className="text-sm font-medium mb-3 block">Export Format</Label>
              <RadioGroup value={premiumFormat} onValueChange={(v) => setPremiumFormat(v as PremiumFormat)}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="fmt-pdf" />
                    <Label htmlFor="fmt-pdf" className="cursor-pointer text-sm">PDF Report</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="xlsx" id="fmt-xlsx" />
                    <Label htmlFor="fmt-xlsx" className="cursor-pointer text-sm">Excel</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pptx" id="fmt-pptx" />
                    <Label htmlFor="fmt-pptx" className="cursor-pointer text-sm">PowerPoint</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="docx" id="fmt-docx" />
                    <Label htmlFor="fmt-docx" className="cursor-pointer text-sm flex items-center gap-1">
                      Word Memo
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">New</Badge>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {premiumFormat === "docx"
                  ? "Generates a narrative investor memo with financial analysis"
                  : premiumFormat === "xlsx"
                    ? "Enhanced Excel with conditional formatting and summary dashboards"
                    : premiumFormat === "pptx"
                      ? "Investor presentation with insights and key takeaways"
                      : "Professional PDF with executive summary and analysis"}
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cancel</Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isGenerating}
            data-testid="button-export-confirm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : isPremium && hasPremiumData ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Premium Export
              </>
            ) : (
              "Export"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
