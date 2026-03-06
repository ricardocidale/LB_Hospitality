import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Building2, Image, Tag, Save, Star, Sparkles, HardDrive, Link as LinkIcon, Wand2, Pencil, ArrowRight, X, Check } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import defaultLogo from "@/assets/logo.png";
import type { Logo } from "./types";

type LogoMode = "generate" | "import" | "url";
type AIStep = "describe" | "enhancing" | "review" | "generating";

export default function LogosTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [logoName, setLogoName] = useState("");
  const [logoCompanyName, setLogoCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoMode, setLogoMode] = useState<LogoMode>("generate");
  const [deleteLogoConfirmId, setDeleteLogoConfirmId] = useState<number | null>(null);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiStep, setAiStep] = useState<AIStep>("describe");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ src: string; name: string; type: string; originalFile: File } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");

  const resetLogoForm = () => {
    setLogoName("");
    setLogoCompanyName("");
    setLogoUrl("");
    setAiPrompt("");
    setAiStep("describe");
    setEnhancedPrompt("");
    setIsEnhancing(false);
    setIsGenerating(false);
    setIsUploadingFile(false);
    setUrlInput("");
    setLogoMode("generate");
  };

  const { data: adminLogos } = useQuery<Logo[]>({
    queryKey: ["admin", "logos"],
    queryFn: async () => {
      const res = await fetch("/api/logos", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logos");
      return res.json();
    },
  });

  const createLogoMutation = useMutation({
    mutationFn: async (data: { name: string; companyName: string; url: string }) => {
      const res = await fetch("/api/logos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to create logo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "logos"] });
      queryClient.invalidateQueries({ queryKey: ["my-branding"] });
      setLogoDialogOpen(false);
      resetLogoForm();
      toast({ title: "Logo Created", description: "Logo has been added successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create logo.", variant: "destructive" });
    },
  });

  const deleteLogoMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/logos/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed to delete logo"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "logos"] });
      queryClient.invalidateQueries({ queryKey: ["my-branding"] });
      setDeleteLogoConfirmId(null);
      toast({ title: "Logo Deleted", description: "Logo has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { uploadFile } = useUpload({
    onSuccess: (response) => {
      setLogoUrl(response.objectPath);
      setIsUploadingFile(false);
      toast({ title: "Image Uploaded", description: "Logo image uploaded successfully." });
    },
    onError: () => {
      setIsUploadingFile(false);
      toast({ title: "Upload Failed", description: "Failed to upload image. Please try again.", variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select an image under 5MB.", variant: "destructive" });
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPendingImage({ src: objectUrl, name: file.name, type: file.type, originalFile: file });
    setCropDialogOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.src);
    setIsUploadingFile(true);
    const fileToUpload = croppedFile.size === 0 ? pendingImage!.originalFile : croppedFile;
    await uploadFile(fileToUpload);
    setPendingImage(null);
  };

  const handleCropDialogClose = (open: boolean) => {
    if (!open && pendingImage) {
      URL.revokeObjectURL(pendingImage.src);
      setPendingImage(null);
    }
    setCropDialogOpen(open);
  };

  const handleEnhancePrompt = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setIsEnhancing(true);
    setAiStep("enhancing");
    try {
      const res = await fetch("/api/enhance-logo-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      if (!res.ok) throw new Error("Failed to enhance prompt");
      const data = await res.json();
      setEnhancedPrompt(data.enhanced);
      setAiStep("review");
    } catch {
      toast({ title: "Enhancement Failed", description: "Could not enhance prompt. You can still generate with your original description.", variant: "destructive" });
      setAiStep("describe");
    } finally {
      setIsEnhancing(false);
    }
  }, [aiPrompt, toast]);

  const handleGenerateLogo = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setAiStep("generating");
    try {
      const res = await fetch("/api/generate-property-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("Failed to generate logo");
      const data = await res.json();
      setLogoUrl(data.objectPath);
      setAiStep("describe");
      toast({ title: "Logo Generated", description: "AI-generated logo is ready." });
    } catch {
      toast({ title: "Generation Failed", description: "Failed to generate logo. Please try again.", variant: "destructive" });
      setAiStep("describe");
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const modeBtn = (mode: LogoMode, active: boolean) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
      active
        ? "bg-gradient-to-b from-primary/15 to-primary/25 border-primary/40 text-gray-900 shadow-sm"
        : "bg-white/60 border-gray-200 text-gray-500 hover:text-gray-700 hover:border-primary/30 hover:bg-primary/5"
    }`;

  const isBusy = isGenerating || isEnhancing || isUploadingFile || createLogoMutation.isPending;

  return (
    <>
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Logo Management</CardTitle>
              <CardDescription className="label-text">Upload, create, and manage logos used by companies in the platform</CardDescription>
            </div>
            <Button variant="outline" onClick={() => { resetLogoForm(); setLogoDialogOpen(true); }} className="flex items-center gap-2" data-testid="button-add-logo">
              <Plus className="w-4 h-4" /> Add Logo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {!adminLogos || adminLogos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="w-16 h-16 mx-auto mb-4 text-primary/30" />
              <p className="text-lg mb-1">No logos yet</p>
              <p className="text-sm">Click "Add Logo" to upload or create your first logo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminLogos.map(logo => (
                <Card key={logo.id} className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)] group hover:shadow-lg transition-shadow" data-testid={`logo-card-${logo.id}`}>
                  <CardContent className="p-6">
                    <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 flex items-center justify-center p-6 mb-4 overflow-hidden">
                      <img src={logo.url} alt={logo.name} className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }} data-testid={`logo-image-${logo.id}`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display font-medium text-foreground truncate flex items-center gap-2">
                            {logo.name}
                            {logo.isDefault && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {logo.companyName}
                          </p>
                        </div>
                        {!logo.isDefault && (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteLogoConfirmId(logo.id)} className="text-red-400 hover:text-red-600 hover:bg-red-500/10 flex-shrink-0" data-testid={`button-delete-logo-${logo.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {logo.isDefault && (
                        <span className="inline-block text-xs bg-amber-500/20 text-amber-700 px-2 py-0.5 rounded">Default Logo</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    <Dialog open={logoDialogOpen} onOpenChange={(open) => { if (!isBusy) { setLogoDialogOpen(open); if (!open) resetLogoForm(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Add New Logo</DialogTitle>
          <DialogDescription className="label-text">Choose how you'd like to create your logo</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700"><Tag className="w-3.5 h-3.5 text-primary/60" />Logo Name</Label>
              <Input value={logoName} onChange={(e) => setLogoName(e.target.value)} placeholder="e.g., Company Logo" disabled={isBusy} data-testid="input-logo-name" className="bg-white border-primary/20" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700"><Building2 className="w-3.5 h-3.5 text-primary/60" />Company Name</Label>
              <Input value={logoCompanyName} onChange={(e) => setLogoCompanyName(e.target.value)} placeholder="e.g., Hotel Group" disabled={isBusy} data-testid="input-logo-company-name" className="bg-white border-primary/20" />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" disabled={isBusy} onClick={() => { setLogoMode("generate"); setLogoUrl(""); }} className={modeBtn("generate", logoMode === "generate")} data-testid="btn-mode-generate">
              <Sparkles className="w-4 h-4" /> Generate Logo
            </button>
            <button type="button" disabled={isBusy} onClick={() => { setLogoMode("import"); setLogoUrl(""); setAiStep("describe"); }} className={modeBtn("import", logoMode === "import")} data-testid="btn-mode-import">
              <HardDrive className="w-4 h-4" /> Import Logo
            </button>
            <button type="button" disabled={isBusy} onClick={() => { setLogoMode("url"); setLogoUrl(""); setAiStep("describe"); }} className={modeBtn("url", logoMode === "url")} data-testid="btn-mode-url">
              <LinkIcon className="w-4 h-4" /> URL Logo
            </button>
          </div>

          {logoUrl && (
            <div className="relative">
              <div className="aspect-square max-w-[200px] mx-auto rounded-xl overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                <img src={logoUrl} alt="Preview" className="w-full h-full object-contain" />
              </div>
              <button
                type="button"
                onClick={() => { setLogoUrl(""); setAiStep("describe"); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                data-testid="btn-remove-preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!logoUrl && logoMode === "generate" && (
            <div className="space-y-3">
              {aiStep === "describe" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-gray-700 text-sm">Describe your logo</Label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., Modern minimalist logo for a boutique hotel management company with elegant green tones..."
                      rows={3}
                      disabled={isBusy}
                      className="resize-none bg-white border-primary/20 text-sm"
                      data-testid="input-ai-prompt"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!aiPrompt.trim() || isBusy}
                      onClick={handleEnhancePrompt}
                      className="flex-1 bg-gradient-to-b from-amber-50 to-amber-100/80 border-amber-200/60 text-amber-800 hover:from-amber-100 hover:to-amber-200/80 hover:border-amber-300 transition-all"
                      data-testid="btn-enhance-prompt"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Enhance with AI
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!aiPrompt.trim() || isBusy}
                      onClick={() => handleGenerateLogo(aiPrompt.trim())}
                      className="flex-1 bg-gradient-to-b from-primary/10 to-primary/20 border-primary/30 text-gray-800 hover:from-primary/20 hover:to-primary/30 transition-all"
                      data-testid="btn-generate-direct"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Logo
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">Powered by Nano Banana</p>
                </>
              )}

              {aiStep === "enhancing" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <Wand2 className="w-6 h-6 text-amber-600 animate-pulse" />
                    </div>
                    <Loader2 className="w-16 h-16 text-amber-400 animate-spin absolute -top-2 -left-2" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Enhancing your description...</p>
                  <p className="text-xs text-gray-400">Google Gemini is crafting a better prompt</p>
                </div>
              )}

              {aiStep === "review" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-amber-200/60 bg-gradient-to-b from-amber-50/50 to-white p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Wand2 className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">AI-Enhanced Prompt</span>
                    </div>
                    <Textarea
                      value={enhancedPrompt}
                      onChange={(e) => setEnhancedPrompt(e.target.value)}
                      rows={4}
                      className="resize-none bg-white/80 border-amber-200/40 text-sm"
                      data-testid="input-enhanced-prompt"
                    />
                    <div className="flex items-center gap-1.5 pt-1">
                      <p className="text-xs text-gray-400 flex-1">You can edit the enhanced prompt above</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setAiStep("describe"); setEnhancedPrompt(""); }}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50"
                      data-testid="btn-cancel-enhance"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setAiPrompt(enhancedPrompt); setAiStep("describe"); setEnhancedPrompt(""); }}
                      className="border-primary/30 text-gray-700 hover:bg-primary/5"
                      data-testid="btn-edit-enhanced"
                    >
                      <Pencil className="w-4 h-4 mr-1.5" />
                      Edit Further
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleGenerateLogo(enhancedPrompt)}
                      className="flex-1 bg-gradient-to-b from-primary/70 to-primary/90 text-white hover:from-primary/80 hover:to-primary border-0 shadow-sm"
                      data-testid="btn-generate-enhanced"
                    >
                      <ArrowRight className="w-4 h-4 mr-1.5" />
                      Generate Logo
                    </Button>
                  </div>
                </div>
              )}

              {aiStep === "generating" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <Loader2 className="w-16 h-16 text-primary/40 animate-spin absolute -top-2 -left-2" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Generating your logo...</p>
                  <p className="text-xs text-gray-400">Nano Banana is creating your design</p>
                </div>
              )}
            </div>
          )}

          {!logoUrl && logoMode === "import" && (
            <div
              className="w-full aspect-square max-h-[220px] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center transition-colors cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02]"
              onClick={() => !isUploadingFile && fileInputRef.current?.click()}
            >
              {isUploadingFile ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <HardDrive className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-600 font-medium">Click to import logo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG — Max 5MB</p>
                </>
              )}
            </div>
          )}

          {!logoUrl && logoMode === "url" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="bg-white border-primary/20"
                  data-testid="input-logo-url"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setLogoUrl(urlInput.trim()); setUrlInput(""); }}
                  disabled={!urlInput.trim()}
                  className="border-primary/30 text-gray-700"
                  data-testid="btn-apply-url"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Apply
                </Button>
              </div>
              <p className="text-xs text-gray-400">Paste a direct link to a logo image</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={() => { setLogoDialogOpen(false); resetLogoForm(); }} disabled={isBusy} className="border-gray-200" data-testid="button-cancel-logo">Cancel</Button>
          <Button
            variant="outline"
            onClick={() => createLogoMutation.mutate({ name: logoName, companyName: logoCompanyName, url: logoUrl })}
            disabled={!logoName || !logoUrl || isBusy}
            className="bg-gradient-to-b from-primary/10 to-primary/20 border-primary/30 text-gray-800 hover:from-primary/20 hover:to-primary/30 flex items-center gap-2"
            data-testid="button-save-logo"
          >
            {createLogoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Logo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={deleteLogoConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteLogoConfirmId(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Delete Logo</DialogTitle>
          <DialogDescription className="label-text">Are you sure you want to delete this logo? This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteLogoConfirmId(null)} data-testid="button-cancel-delete-logo">Cancel</Button>
          <Button variant="destructive" onClick={() => { if (deleteLogoConfirmId) deleteLogoMutation.mutate(deleteLogoConfirmId); }} disabled={deleteLogoMutation.isPending} data-testid="button-confirm-delete-logo" className="flex items-center gap-2">
            {deleteLogoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="file-input-logo" />

    {pendingImage && (
      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={handleCropDialogClose}
        imageSrc={pendingImage.src}
        fileName={pendingImage.name}
        fileType={pendingImage.type}
        aspectRatio={1}
        onCropComplete={handleCropComplete}
      />
    )}
    </>
  );
}
