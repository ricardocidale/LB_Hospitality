import { useState, useRef } from "react";
import { Upload, Loader2, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUpload } from "@/hooks/use-upload";
import { useAddPropertyPhoto } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
}

interface UploadItem {
  file: File;
  caption: string;
  status: "pending" | "uploading" | "done" | "error";
  objectPath?: string;
}

export function PhotoUploadDialog({ open, onOpenChange, propertyId }: PhotoUploadDialogProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const addPhoto = useAddPropertyPhoto();

  const { uploadFile } = useUpload({
    onSuccess: () => {},
    onError: () => {},
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast({ title: "No images selected", description: "Please select image files.", variant: "destructive" });
      return;
    }
    const newItems: UploadItem[] = imageFiles.map((file) => ({
      file,
      caption: "",
      status: "pending",
    }));
    setItems((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadAll = async () => {
    setIsUploading(true);
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== "pending") continue;
      setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, status: "uploading" } : item));
      try {
        const response = await uploadFile(items[i].file);
        const objectPath = (response as any)?.objectPath;
        if (!objectPath) throw new Error("No object path returned");

        await addPhoto.mutateAsync({
          propertyId,
          imageUrl: objectPath,
          caption: items[i].caption || undefined,
        });

        setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, status: "done", objectPath } : item));
      } catch {
        setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, status: "error" } : item));
      }
    }
    setIsUploading(false);
    const successes = items.filter((_, i) => items[i]?.status !== "error").length;
    if (successes > 0) {
      toast({ title: `${successes} photo${successes > 1 ? "s" : ""} uploaded` });
    }
    // Close after short delay so user sees completion
    setTimeout(() => {
      setItems([]);
      onOpenChange(false);
    }, 500);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, caption } : item));
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Photos
          </DialogTitle>
          <DialogDescription>Add photos to the property album.</DialogDescription>
        </DialogHeader>

        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <ImagePlus className="w-8 h-8 mx-auto text-primary/40 mb-2" />
          <p className="text-sm text-muted-foreground">Click to select images or drag and drop</p>
          <p className="text-xs text-muted-foreground/60 mt-1">JPEG, PNG, WebP up to 10MB each</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* File list */}
        {items.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <img
                  src={URL.createObjectURL(item.file)}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.file.name}</p>
                  <Input
                    value={item.caption}
                    onChange={(e) => updateCaption(i, e.target.value)}
                    placeholder="Caption (optional)"
                    className="h-6 text-xs mt-1"
                    disabled={item.status !== "pending"}
                  />
                </div>
                <div className="shrink-0">
                  {item.status === "pending" && (
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeItem(i)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {item.status === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  {item.status === "done" && <span className="text-xs text-green-600 font-medium">Done</span>}
                  {item.status === "error" && <span className="text-xs text-destructive font-medium">Error</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setItems([]); onOpenChange(false); }} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUploadAll} disabled={pendingCount === 0 || isUploading}>
            {isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
            ) : (
              `Upload ${pendingCount} Photo${pendingCount !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
