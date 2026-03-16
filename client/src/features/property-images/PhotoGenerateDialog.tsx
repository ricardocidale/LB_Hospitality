import { useState } from "react";
import { Sparkles, Loader2, Plus, Star, AlertTriangle, ImageIcon } from "@/components/icons/themed-icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerateImage, type GenerationStyle } from "./useGenerateImage";
import { useAddPropertyPhoto } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Progress } from "@/components/ui/progress";
import type { PropertyPhoto } from "@shared/schema";

interface PhotoGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
  propertyName?: string;
  location?: string;
  roomCount?: number;
  propertyType?: string;
  existingPhotos?: PropertyPhoto[];
}

const STYLE_OPTIONS: Array<{ value: GenerationStyle; label: string; description: string }> = [
  { value: "standard", label: "Standard", description: "OpenAI / Gemini — general purpose" },
  { value: "architectural-exterior", label: "Architectural Exterior", description: "Photorealistic building renders" },
  { value: "interior-design", label: "Interior Design", description: "Professional interior photography" },
  { value: "renovation-concept", label: "Renovation Concept", description: "Before/after renovation renders" },
];

function buildAutoPrompt(name?: string, location?: string, roomCount?: number, type?: string): string {
  const parts = [
    "Luxury boutique hotel exterior",
    name,
    location,
    roomCount ? `${roomCount}-room property` : undefined,
    type ? `${type} style` : undefined,
    "architectural photography, golden hour lighting, professional real estate photo",
  ].filter(Boolean);
  return parts.join(", ");
}

export function PhotoGenerateDialog({
  open,
  onOpenChange,
  propertyId,
  propertyName,
  location,
  roomCount,
  propertyType,
  existingPhotos = [],
}: PhotoGenerateDialogProps) {
  const autoPrompt = buildAutoPrompt(propertyName, location, roomCount, propertyType);
  const [prompt, setPrompt] = useState(autoPrompt);
  const [caption, setCaption] = useState("");
  const [setAsHero, setSetAsHero] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<GenerationStyle>("standard");
  const [beforePhotoId, setBeforePhotoId] = useState<number | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [generatedStyle, setGeneratedStyle] = useState<string | null>(null);

  const { toast } = useToast();
  const addPhoto = useAddPropertyPhoto();

  const { generateImage, isGenerating, generationStatus } = useGenerateImage({
    onSuccess: (objectPath, result) => {
      setGeneratedUrl(objectPath);
      setGeneratedStyle(result.style);
      if (result.usedFallback && result.fallbackNotice) {
        setFallbackNotice(result.fallbackNotice);
        toast({ title: "Fallback used", description: result.fallbackNotice });
      } else {
        setFallbackNotice(null);
        toast({ title: "Image generated", description: "Preview below. Click 'Add to Album' to save." });
      }
    },
    onError: () => {
      toast({ title: "Generation failed", description: "Please try again with a different prompt.", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGeneratedUrl(null);
    setFallbackNotice(null);

    let beforeImageUrl: string | undefined;
    if (selectedStyle === "renovation-concept" && beforePhotoId) {
      const beforePhoto = existingPhotos.find((p) => p.id === beforePhotoId);
      if (beforePhoto) {
        beforeImageUrl = beforePhoto.imageUrl;
      }
    }

    generateImage(prompt, selectedStyle, beforeImageUrl);
  };

  const handleAddToAlbum = async () => {
    if (!generatedUrl) return;
    try {
      await addPhoto.mutateAsync({
        propertyId,
        imageUrl: generatedUrl,
        caption: caption || undefined,
        generationStyle: generatedStyle || undefined,
        beforePhotoId: selectedStyle === "renovation-concept" ? (beforePhotoId ?? undefined) : undefined,
      });
      toast({ title: "Photo added to album" });
      setGeneratedUrl(null);
      setCaption("");
      setFallbackNotice(null);
    } catch {
      toast({ title: "Failed to add photo", variant: "destructive" });
    }
  };

  const handleClose = () => {
    setGeneratedUrl(null);
    setCaption("");
    setPrompt(autoPrompt);
    setSelectedStyle("standard");
    setBeforePhotoId(null);
    setFallbackNotice(null);
    setGeneratedStyle(null);
    onOpenChange(false);
  };

  const isRenovation = selectedStyle === "renovation-concept";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate AI Photo
          </DialogTitle>
          <DialogDescription>
            Create a professional property image using AI.
            <InfoTooltip text="Choose a generation style: Standard uses Gemini/OpenAI, while specialized styles use architecture-optimized models for photorealistic renders." />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Style</label>
            <Select
              value={selectedStyle}
              onValueChange={(v) => setSelectedStyle(v as GenerationStyle)}
            >
              <SelectTrigger data-testid="select-generation-style">
                <SelectValue placeholder="Choose style..." />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} data-testid={`style-option-${opt.value}`}>
                    <div className="flex flex-col">
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isRenovation && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                Before Image
              </label>
              {existingPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {existingPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setBeforePhotoId(photo.id === beforePhotoId ? null : photo.id)}
                      className={`relative rounded-md overflow-hidden border-2 transition-colors ${
                        beforePhotoId === photo.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                      data-testid={`before-photo-${photo.id}`}
                    >
                      <img
                        src={photo.imageUrl}
                        alt={photo.caption || "Property photo"}
                        className="w-full aspect-square object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No existing photos available. Upload photos first to use renovation mode.
                </p>
              )}
              {beforePhotoId && (
                <p className="text-xs text-muted-foreground">
                  Selected photo will be used as the "before" reference for renovation rendering.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Image Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want..."
              rows={3}
              className="resize-none"
              data-testid="input-image-prompt"
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated from property details. Edit for custom results.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || (isRenovation && !beforePhotoId && existingPhotos.length > 0)}
            className="w-full"
            data-testid="button-generate-image"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{generationStatus || "Generating..."}</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generate Image</>
            )}
          </Button>

          {isGenerating && selectedStyle !== "standard" && (
            <div className="space-y-2" data-testid="status-generation-progress">
              <Progress value={undefined} className="h-1.5" />
              <p className="text-xs text-center text-muted-foreground">
                {generationStatus || "Specialized models take 15-60 seconds..."}
              </p>
            </div>
          )}

          {fallbackNotice && (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-700 dark:text-amber-400" data-testid="status-fallback-notice">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {fallbackNotice}
            </div>
          )}

          {generatedUrl && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border">
                <img src={generatedUrl} alt="Generated preview" className="w-full aspect-[16/10] object-cover" data-testid="img-generated-preview" />
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                  {generatedStyle && generatedStyle !== "standard"
                    ? STYLE_OPTIONS.find((s) => s.value === generatedStyle)?.label || "AI Generated"
                    : "AI Generated"}
                </div>
              </div>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
                className="text-sm"
                data-testid="input-photo-caption"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="set-hero"
                  checked={setAsHero}
                  onCheckedChange={(checked) => setSetAsHero(!!checked)}
                  data-testid="checkbox-set-hero"
                />
                <label htmlFor="set-hero" className="text-sm flex items-center gap-1.5 cursor-pointer">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  Set as hero image
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleGenerate} variant="outline" disabled={isGenerating} className="flex-1" data-testid="button-regenerate">
                  <Sparkles className="w-4 h-4 mr-2" />Regenerate
                </Button>
                <Button onClick={handleAddToAlbum} disabled={addPhoto.isPending} className="flex-1" data-testid="button-add-to-album">
                  <Plus className="w-4 h-4 mr-2" />Add to Album
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
