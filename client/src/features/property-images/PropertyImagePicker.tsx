import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Sparkles, X } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { useGenerateImage } from "./useGenerateImage";
import { useToast } from "@/hooks/use-toast";

type Mode = "upload" | "generate";

interface PropertyImagePickerProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  propertyName?: string;
  location?: string;
  /** Visual variant: "dark" for dark glass dialogs, "light" for light-themed pages */
  variant?: "dark" | "light";
}

/**
 * Reusable image picker for property creation and editing.
 * Supports file upload and AI image generation via gpt-image-1.
 */
export function PropertyImagePicker({
  imageUrl,
  onImageChange,
  propertyName,
  location,
  variant = "dark",
}: PropertyImagePickerProps) {
  const [mode, setMode] = useState<Mode>("upload");
  const [prompt, setPrompt] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { uploadFile } = useUpload({
    onSuccess: (response) => {
      onImageChange(response.objectPath);
      toast({ title: "Photo Uploaded", description: "Photo has been successfully uploaded." });
      setIsUploadingPhoto(false);
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      toast({ title: "Upload Failed", description: "Failed to upload photo. Please try again.", variant: "destructive" });
      setIsUploadingPhoto(false);
    },
  });

  const { generateImage, isGenerating } = useGenerateImage({
    onSuccess: (objectPath) => {
      onImageChange(objectPath);
      toast({ title: "Photo Generated", description: "AI-generated photo is ready." });
    },
    onError: (error) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid File", description: "Please select an image file (JPEG, PNG, etc.)", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select an image under 10MB.", variant: "destructive" });
      return;
    }

    setIsUploadingPhoto(true);
    await uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    const finalPrompt = prompt.trim() || buildAutoPrompt(propertyName, location);
    if (!finalPrompt) {
      toast({ title: "Prompt Required", description: "Enter a description or fill in property name/location.", variant: "destructive" });
      return;
    }
    await generateImage(finalPrompt);
  };

  const handleRemove = () => {
    onImageChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isLight = variant === "light";
  const isBusy = isUploadingPhoto || isGenerating;

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          disabled={isBusy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "upload"
              ? isLight
                ? "bg-primary/20 text-gray-900 border border-primary/40"
                : "bg-white/20 text-white border border-white/30"
              : isLight
                ? "text-gray-500 hover:text-gray-700 border border-transparent"
                : "text-white/50 hover:text-white/80 border border-transparent"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Photo
        </button>
        <button
          type="button"
          onClick={() => setMode("generate")}
          disabled={isBusy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "generate"
              ? isLight
                ? "bg-primary/20 text-gray-900 border border-primary/40"
                : "bg-white/20 text-white border border-white/30"
              : isLight
                ? "text-gray-500 hover:text-gray-700 border border-transparent"
                : "text-white/50 hover:text-white/80 border border-transparent"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate with AI
        </button>
      </div>

      {/* Image preview */}
      {imageUrl ? (
        <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-white/20">
          <img
            src={imageUrl}
            alt="Property preview"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            data-testid="button-remove-image"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : mode === "upload" ? (
        /* Upload dropzone */
        <div
          className={`w-full aspect-[16/10] rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
            isBusy
              ? "cursor-wait border-muted-foreground/25"
              : "cursor-pointer hover:border-primary/50 border-muted-foreground/25"
          }`}
          onClick={() => !isBusy && fileInputRef.current?.click()}
        >
          {isUploadingPhoto ? (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Uploading photo...</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload property photo
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Photo will be cropped to fit card format
              </p>
            </>
          )}
        </div>
      ) : (
        /* Generate form */
        <div className="space-y-3">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={buildAutoPrompt(propertyName, location) || "Describe the property photo you want..."}
            disabled={isGenerating}
            data-testid="input-ai-image-prompt"
            className={
              isLight
                ? "bg-white border-primary/30 text-gray-900 placeholder:text-gray-400"
                : ""
            }
          />
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            data-testid="button-generate-image"
            className="bg-primary/20 border-primary/30 text-gray-700 hover:bg-primary/30"
            variant="outline"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Photo
              </>
            )}
          </Button>
          {!prompt && (propertyName || location) && (
            <p className={`text-xs ${isLight ? "text-gray-500" : "text-muted-foreground/70"}`}>
              Leave blank to auto-generate from property name and location
            </p>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-property-image"
      />
    </div>
  );
}

function buildAutoPrompt(
  propertyName?: string,
  location?: string,
): string {
  if (!propertyName && !location) return "";
  const parts = [
    "Luxury boutique hotel exterior",
    propertyName,
    location,
    "architectural photography, golden hour lighting",
  ].filter(Boolean);
  return parts.join(", ");
}
