import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconSave, IconPeople, IconBuilding2, IconImage, IconPalette, IconFileText, IconProperties } from "@/components/icons";
import type { InlineCompanyForm, InlineGroupForm } from "./types";

interface InlineCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: InlineCompanyForm;
  setForm: React.Dispatch<React.SetStateAction<InlineCompanyForm>>;
  adminLogos: { id: number; name: string; url: string; isDefault: boolean }[] | undefined;
  allThemes: { id: number; name: string; isDefault: boolean }[] | undefined;
  isPending: boolean;
  onSubmit: () => void;
}

export function InlineCompanyDialog({
  open,
  onOpenChange,
  form,
  setForm,
  adminLogos,
  allThemes,
  isPending,
  onSubmit,
}: InlineCompanyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">New Company</DialogTitle>
          <DialogDescription className="label-text">Create a new company to assign to this user</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconBuilding2 className="w-4 h-4 text-muted-foreground" />Company Name</Label>
            <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Norfolk Group" data-testid="input-inline-company-name" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconImage className="w-4 h-4 text-muted-foreground" />Logo</Label>
            <Select value={form.logoId != null ? String(form.logoId) : "none"} onValueChange={(v) => setForm(prev => ({ ...prev, logoId: v === "none" ? null : parseInt(v) }))}>
              <SelectTrigger data-testid="trigger-inline-company-logo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Logo</SelectItem>
                {adminLogos?.map(logo => (
                  <SelectItem key={logo.id} value={String(logo.id)}>
                    <span className="flex items-center gap-2">
                      <img src={logo.url} alt="" className="w-5 h-5 rounded object-contain shrink-0" />
                      {logo.name}{logo.isDefault ? " (Default)" : ""}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconPalette className="w-4 h-4 text-muted-foreground" />Theme</Label>
            <Select value={form.themeId != null ? String(form.themeId) : "none"} onValueChange={(v) => setForm(prev => ({ ...prev, themeId: v === "none" ? null : parseInt(v) }))}>
              <SelectTrigger data-testid="trigger-inline-company-theme"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Theme</SelectItem>
                {allThemes?.map(theme => (
                  <SelectItem key={theme.id} value={String(theme.id)}>{theme.name}{theme.isDefault ? " (Default)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconFileText className="w-4 h-4 text-muted-foreground" />Description</Label>
            <Input value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Optional description" data-testid="input-inline-company-description" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-inline-company">Cancel</Button>
          <Button variant="outline" onClick={onSubmit} disabled={!form.name || isPending} data-testid="button-save-inline-company" className="flex items-center gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface InlineGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: InlineGroupForm;
  setForm: React.Dispatch<React.SetStateAction<InlineGroupForm>>;
  allThemes: { id: number; name: string; isDefault: boolean }[] | undefined;
  assetDescriptions: { id: number; name: string }[] | undefined;
  isPending: boolean;
  onSubmit: () => void;
}

export function InlineGroupDialog({
  open,
  onOpenChange,
  form,
  setForm,
  allThemes,
  assetDescriptions,
  isPending,
  onSubmit,
}: InlineGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Create User Group</DialogTitle>
          <DialogDescription className="label-text">Create a new group to assign to this user</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconPeople className="w-4 h-4 text-muted-foreground" />Group Name</Label>
            <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., KIT Capital Team" data-testid="input-inline-group-name" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconPalette className="w-4 h-4 text-muted-foreground" />Theme</Label>
            <Select value={form.themeId != null ? String(form.themeId) : "default"} onValueChange={(v) => setForm(prev => ({ ...prev, themeId: v === "default" ? null : parseInt(v) }))}>
              <SelectTrigger data-testid="select-inline-group-theme"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Theme</SelectItem>
                {allThemes?.map(theme => (
                  <SelectItem key={theme.id} value={String(theme.id)}>{theme.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconProperties className="w-4 h-4 text-muted-foreground" />Property Description (Property Label)</Label>
            <Select value={form.assetDescriptionId != null ? String(form.assetDescriptionId) : "default"} onValueChange={(v) => setForm(prev => ({ ...prev, assetDescriptionId: v === "default" ? null : parseInt(v) }))}>
              <SelectTrigger data-testid="select-inline-group-asset-desc"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Label</SelectItem>
                {assetDescriptions?.map(ad => (
                  <SelectItem key={ad.id} value={String(ad.id)}>{ad.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-inline-group">Cancel</Button>
          <Button variant="outline" onClick={onSubmit} disabled={!form.name || isPending} data-testid="button-save-inline-group" className="flex items-center gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
