import { useState } from "react";
import { Sparkles, Loader2, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useGenerateImage } from "./useGenerateImage";
import { useAddPropertyPhoto } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { HelpTooltip } from "@/components/ui/help-tooltip";

interface PhotoGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
  propertyName?: string;
  location?: string;
  roomCount?: number;
  propertyType?: string;
}

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
}: PhotoGenerateDialogProps) {
  const autoPrompt = buildAutoPrompt(propertyName, location, roomCount, propertyType);
  const [prompt, setPrompt] = useState(autoPrompt);
  const [caption, setCaption] = useState("");
  const [setAsHero, setSetAsHero] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const { toast } = useToast();
  const addPhoto = useAddPropertyPhoto();

  const { generateImage, isGenerating } = useGenerateImage({
    onSuccess: (objectPath) => {
      setGeneratedUrl(objectPath);
      toast({ title: "Image generated", description: "Preview below. Click 'Add to Album' to save." });
    },
    onError: () => {
      toast({ title: "Generation failed", description: "Please try again with a different prompt.", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGeneratedUrl(null);
    generateImage(prompt);
  };

  const handleAddToAlbum = async () => {
    if (!generatedUrl) return;
    try {
      await addPhoto.mutateAsync({
        propertyId,
        imageUrl: generatedUrl,
        caption: caption || undefined,
      });
      toast({ title: "Photo added to album" });
      // Reset for another generation
      setGeneratedUrl(null);
      setCaption("");
    } catch {
      toast({ title: "Failed to add photo", variant: "destructive" });
    }
  };

  const handleClose = () => {
    setGeneratedUrl(null);
    setCaption("");
    setPrompt(autoPrompt);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate AI Photo
          </DialogTitle>
          <DialogDescription>
            Create a professional property image using AI.
            <HelpTooltip text="AI generates a professional hotel image from your description. The image is created using Nano Banana (Gemini) with OpenAI as fallback." />
          </DialogDescription>
        </DialogHeader>

        {/* Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Image Prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want..."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Auto-generated from property details. Edit for custom results.
          </p>
        </div>

        {/* Generate button */}
        <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full">
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Generate Image</>
          )}
        </Button>

        {/* Preview */}
        {generatedUrl && (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border">
              <img src={generatedUrl} alt="Generated preview" className="w-full aspect-[16/10] object-cover" />
              <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                AI Generated
              </div>
            </div>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="text-sm"
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="set-hero"
                checked={setAsHero}
                onCheckedChange={(checked) => setSetAsHero(!!checked)}
              />
              <label htmlFor="set-hero" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                Set as hero image
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerate} variant="outline" disabled={isGenerating} className="flex-1">
                <Sparkles className="w-4 h-4 mr-2" />Regenerate
              </Button>
              <Button onClick={handleAddToAlbum} disabled={addPhoto.isPending} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />Add to Album
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
