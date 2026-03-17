import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconDownload } from "@/components/icons";

export interface ExportSaveDialogProps {
  open: boolean;
  suggestedName: string;
  extension: string;
  onConfirm: (finalFilename: string) => void;
  onCancel: () => void;
}

export function ExportSaveDialog({ open, suggestedName, extension, onConfirm, onCancel }: ExportSaveDialogProps) {
  const [name, setName] = useState(suggestedName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(suggestedName);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open, suggestedName]);

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const safeFilename = trimmed.replace(/[/\\:*?"<>|]/g, "_");
    onConfirm(`${safeFilename}${extension}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Save As</DialogTitle>
          <DialogDescription>Edit the filename before downloading.</DialogDescription>
        </DialogHeader>
        <div className="py-3 space-y-3">
          <div>
            <Label htmlFor="export-filename" className="text-sm font-medium mb-2 block">Filename</Label>
            <div className="flex items-center gap-0">
              <Input
                ref={inputRef}
                id="export-filename"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="rounded-r-none border-r-0 flex-1"
                data-testid="input-export-filename"
              />
              <div className="flex items-center px-3 h-9 border rounded-r-md bg-muted text-muted-foreground text-sm font-mono select-none" data-testid="text-export-extension">
                {extension}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} data-testid="button-export-cancel">Cancel</Button>
          <Button onClick={handleConfirm} disabled={!name.trim()} data-testid="button-export-save">
            <IconDownload className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
