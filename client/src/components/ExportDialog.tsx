import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles } from "@/components/icons/themed-icons";
import { IconDownload } from "@/components/icons";
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
  } catch { /* ignore: localStorage unavailable in private browsing */ }
  return "landscape";
}

function getStoredVersion(): ExportVersion {
  try {
    const v = localStorage.getItem(VERSION_KEY);
    if (v === "short" || v === "extended") return v;
  } catch { /* ignore: localStorage unavailable in private browsing */ }
  return "short";
}

function getStoredPremium(): boolean {
  try {
    return localStorage.getItem(PREMIUM_KEY) === "true";
  } catch { /* ignore: localStorage unavailable in private browsing */ }
  return false;
}

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (orientation: "landscape" | "portrait", version: ExportVersion, customFilename?: string) => void;
  title: string;
  showVersionOption?: boolean;
  premiumExportData?: PremiumExportPayload | null;
  premiumFormat?: PremiumFormat;
  suggestedFilename?: string;
  fileExtension?: string;
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

async function downloadPremiumExport(
  format: PremiumFormat,
  payload: PremiumExportPayload,
  orientation: "landscape" | "portrait",
  version: ExportVersion,
  customFilename?: string
): Promise<void> {
  const controller = new AbortController();
  const clientTimeout = setTimeout(() => controller.abort(), 200_000);
  let response;
  try {
    response = await fetch("/api/exports/premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ format, orientation, version, ...payload }),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(clientTimeout);
    if (err?.name === "AbortError") {
      throw new Error("Export timed out — the server took too long to respond. Please try again.");
    }
    throw err;
  }
  clearTimeout(clientTimeout);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Export failed (${response.status})`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  let filename = customFilename || `export.${format}`;
  if (!customFilename && disposition) {
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

export function ExportDialog({ open, onClose, onExport, title, showVersionOption = true, premiumExportData, premiumFormat = "pdf", suggestedFilename = "", fileExtension = ".pdf" }: ExportDialogProps) {
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(getStoredOrientation);
  const [version, setVersion] = useState<ExportVersion>(getStoredVersion);
  const [isPremium, setIsPremium] = useState(getStoredPremium);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filename, setFilename] = useState(suggestedFilename);
  const filenameRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setOrientation(getStoredOrientation());
      setVersion(getStoredVersion());
      setIsPremium(getStoredPremium());
      setIsGenerating(false);
      setFilename(suggestedFilename);
    }
  }, [open, suggestedFilename]);

  const handleOrientationChange = (v: string) => {
    const val = v as "landscape" | "portrait";
    setOrientation(val);
    try { localStorage.setItem(ORIENTATION_KEY, val); } catch { /* ignore: localStorage unavailable */ }
  };

  const handleVersionChange = (v: string) => {
    const val = v as ExportVersion;
    setVersion(val);
    try { localStorage.setItem(VERSION_KEY, val); } catch { /* ignore: localStorage unavailable */ }
  };

  const handlePremiumToggle = (checked: boolean) => {
    setIsPremium(checked);
    try { localStorage.setItem(PREMIUM_KEY, String(checked)); } catch { /* ignore: localStorage unavailable */ }
  };

  const buildFilename = () => {
    const trimmed = filename.trim();
    if (!trimmed) return undefined;
    const safe = trimmed.replace(/[/\\:*?"<>|]/g, "_");
    return `${safe}${fileExtension}`;
  };

  const handleExport = async () => {
    const finalFilename = buildFilename();
    if (isPremium && premiumExportData) {
      setIsGenerating(true);
      try {
        await downloadPremiumExport(premiumFormat, premiumExportData, orientation, version, finalFilename);
        toast({ title: "Premium export complete", description: `Your ${premiumFormat.toUpperCase()} file has been downloaded.` });
        onClose();
      } catch (error: any) {
        const errMsg = error?.message || "An unexpected error occurred. Please try again.";
        console.error("[premium-export] Client error:", errMsg, error?.stack || "");
        toast({ title: "Premium export failed", description: errMsg, variant: "destructive" });
      } finally {
        setIsGenerating(false);
      }
    } else {
      onExport(orientation, version, finalFilename);
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
          {suggestedFilename && (
            <div>
              <Label htmlFor="export-dialog-filename" className="text-sm font-medium mb-2 block">Filename</Label>
              <div className="flex items-center gap-0">
                <Input
                  ref={filenameRef}
                  id="export-dialog-filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="rounded-r-none border-r-0 flex-1"
                  data-testid="input-export-filename"
                />
                <div className="flex items-center px-3 h-9 border rounded-r-md bg-muted text-muted-foreground text-sm font-mono select-none" data-testid="text-export-extension">
                  {fileExtension}
                </div>
              </div>
            </div>
          )}

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
              <>
                <IconDownload className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
