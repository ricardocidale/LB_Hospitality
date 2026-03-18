import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles } from "@/components/icons/themed-icons";
import { IconDownload } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export type ExportVersion = "short" | "extended";
export type PremiumFormat = "xlsx" | "pptx" | "pdf" | "docx" | "png";

const ORIENTATION_KEY = "export-orientation";
const VERSION_KEY = "export-version";
const PREMIUM_KEY = "export-premium";
const COVER_PAGE_KEY = "export-cover";

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

function getStoredCoverPage(): boolean {
  try {
    return localStorage.getItem(COVER_PAGE_KEY) === "true";
  } catch {}
  return false;
}

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (orientation: "landscape" | "portrait", version: ExportVersion, customFilename?: string) => void;
  title: string;
  showVersionOption?: boolean;
  showCoverPageOption?: boolean;
  premiumExportData?: PremiumExportPayload | null;
  getPremiumExportData?: (version: ExportVersion, includeCoverPage: boolean) => PremiumExportPayload | null;
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
  themeColors?: Array<{ name: string; hexCode: string; rank: number }>;
  includeCoverPage?: boolean;
}

const CONTENT_TYPES: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

async function generatePremiumExport(
  format: PremiumFormat,
  payload: PremiumExportPayload,
  orientation: "landscape" | "portrait",
  version: ExportVersion,
): Promise<{ blob: Blob; serverFilename: string }> {
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
  let serverFilename = `export.${format}`;
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match) serverFilename = match[1];
  }

  return { blob, serverFilename };
}

type DialogStep = "options" | "generating";

const GENERATING_PHASES = [
  { label: "Analyzing financial data...", icon: "chart" },
  { label: "Building report structure...", icon: "layout" },
  { label: "Rendering premium layout...", icon: "sparkle" },
  { label: "Finalizing document...", icon: "doc" },
];

function GeneratingAnimation() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % GENERATING_PHASES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const current = GENERATING_PHASES[phase];

  return (
    <div className="py-8 flex flex-col items-center gap-5" data-testid="export-generating-animation">
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, #257D41, #9FBCA4, #1A2332, #257D41)",
            opacity: 0.15,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-1 rounded-full"
          style={{
            background: "conic-gradient(from 180deg, transparent 60%, #9FBCA4 90%, transparent 100%)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-2 rounded-full bg-background" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-10 h-12 flex flex-col items-center justify-center">
            <motion.div
              className="w-8 h-10 rounded-sm border-2 border-emerald-600/80 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background relative overflow-hidden"
              animate={{ scale: [0.95, 1, 0.95] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="h-[2px] mx-1 mt-[3px] rounded-full bg-emerald-500/40"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: [0, 1, 1, 0] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut",
                  }}
                />
              ))}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-sage-400"
                animate={{ scaleX: [0, 1] }}
                transition={{ duration: 12, ease: "linear" }}
                style={{ originX: 0 }}
              />
            </motion.div>
          </div>
        </div>

        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{
              top: "50%",
              left: "50%",
            }}
            animate={{
              x: [0, Math.cos((i * 120 * Math.PI) / 180) * 44],
              y: [0, Math.sin((i * 120 * Math.PI) / 180) * 44],
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <div className="text-center min-h-[48px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-medium text-sm">{current.label}</p>
          </motion.div>
        </AnimatePresence>
        <p className="text-xs text-muted-foreground mt-1.5">This may take up to a minute for large reports.</p>
      </div>

      <div className="flex gap-1.5">
        {GENERATING_PHASES.map((_, i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full"
            style={{ width: i === phase ? 20 : 6 }}
            animate={{
              backgroundColor: i === phase ? "#257D41" : i < phase ? "#9FBCA4" : "hsl(var(--muted))",
              width: i === phase ? 20 : 6,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

export function ExportDialog({ open, onClose, onExport, title, showVersionOption = true, showCoverPageOption = false, premiumExportData, getPremiumExportData, premiumFormat = "pdf", suggestedFilename = "", fileExtension = ".pdf" }: ExportDialogProps) {
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(getStoredOrientation);
  const [version, setVersion] = useState<ExportVersion>(getStoredVersion);
  const [isPremium, setIsPremium] = useState(getStoredPremium);
  const [includeCoverPage, setIncludeCoverPage] = useState(getStoredCoverPage);
  const [step, setStep] = useState<DialogStep>("options");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setOrientation(getStoredOrientation());
      setVersion(getStoredVersion());
      setIsPremium(getStoredPremium());
      setIncludeCoverPage(getStoredCoverPage());
      setStep("options");
      setIsSaving(false);
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

  const handleCoverPageToggle = (checked: boolean) => {
    setIncludeCoverPage(checked);
    try { localStorage.setItem(COVER_PAGE_KEY, String(checked)); } catch {}
  };

  const resolvePremiumPayload = (): PremiumExportPayload | null => {
    if (getPremiumExportData) {
      return getPremiumExportData(version, includeCoverPage);
    }
    return premiumExportData ?? null;
  };

  const hasPremiumData = !!(getPremiumExportData || premiumExportData);
  const isGenerating = step === "generating";

  const handleExport = async () => {
    const payload = resolvePremiumPayload();
    if (isPremium && payload) {
      setStep("generating");
      try {
        const { blob, serverFilename } = await generatePremiumExport(premiumFormat, payload, orientation, version);

        // Auto-save via native file picker or download
        setIsSaving(true);
        try {
          const { saveFile } = await import("@/lib/exports/saveFile");
          await saveFile(blob, serverFilename);
          toast({ title: "File saved", description: `${serverFilename} saved to your computer.` });
        } catch (err: any) {
          if (err?.name === "AbortError") {
            // User cancelled the file picker — close silently
            onClose();
            return;
          }
          throw err;
        }
        onClose();
      } catch (error: any) {
        const errMsg = error?.message || "An unexpected error occurred. Please try again.";
        console.error("[premium-export] Client error:", errMsg, error?.stack || "");
        toast({ title: "Premium export failed", description: errMsg, variant: "destructive" });
        setStep("options");
        setIsSaving(false);
      }
    } else {
      onExport(orientation, version);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isGenerating || isSaving) ? undefined : onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {step === "options" && (
          <>
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

              {showCoverPageOption && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cover-page-toggle" className="text-sm font-medium cursor-pointer">
                      Include Cover Page & Overview
                    </Label>
                    <Switch
                      id="cover-page-toggle"
                      checked={includeCoverPage}
                      onCheckedChange={handleCoverPageToggle}
                      data-testid="switch-cover-page"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                variant="outline"
                onClick={handleExport}
                data-testid="button-export-confirm"
              >
                {isPremium && hasPremiumData ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Export
                  </>
                ) : (
                  <>
                    <IconDownload className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "generating" && (
          <GeneratingAnimation />
        )}
      </DialogContent>
    </Dialog>
  );
}
