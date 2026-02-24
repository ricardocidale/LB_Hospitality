/**
 * LogosTab.tsx — Logo image library for branding.
 *
 * Manages a library of logo images that can be assigned to companies
 * and user groups. Features:
 *   • Upload logos from local files (stored via object storage)
 *   • AI-generated logos — uses an image generation API to create logos
 *     from a text prompt (e.g. "modern minimalist hotel brand logo")
 *   • Preview grid showing all uploaded logos with metadata
 *   • Delete logos (with cascade check for dependent user groups)
 *
 * Each Logo record stores: name, imageUrl, and optional companyName.
 * Logos are referenced by ID in BrandingTab and UserGroupsTab.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Building2, Image, Tag, Save, Star } from "lucide-react";
import { AIImagePicker } from "@/components/ui/ai-image-picker";
import { useToast } from "@/hooks/use-toast";
import defaultLogo from "@/assets/logo.png";
import type { Logo } from "./types";

export default function LogosTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [logoName, setLogoName] = useState("");
  const [logoCompanyName, setLogoCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [deleteLogoConfirmId, setDeleteLogoConfirmId] = useState<number | null>(null);

  const resetLogoForm = () => {
    setLogoName("");
    setLogoCompanyName("");
    setLogoUrl("");
    setUploadedPreview(null);
  };

  const { data: adminLogos } = useQuery<Logo[]>({
    queryKey: ["admin", "logos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logos", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logos");
      return res.json();
    },
  });

  const createLogoMutation = useMutation({
    mutationFn: async (data: { name: string; companyName: string; url: string }) => {
      const res = await fetch("/api/admin/logos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
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
      const res = await fetch(`/api/admin/logos/${id}`, { method: "DELETE", credentials: "include" });
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
                      <img
                        src={logo.url}
                        alt={logo.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }}
                        data-testid={`logo-image-${logo.id}`}
                      />
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteLogoConfirmId(logo.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-500/10 flex-shrink-0"
                            data-testid={`button-delete-logo-${logo.id}`}
                          >
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

    <Dialog open={logoDialogOpen} onOpenChange={setLogoDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Add New Logo</DialogTitle>
          <DialogDescription className="label-text">Upload an image, generate with AI, or provide a URL</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Tag className="w-4 h-4 text-gray-500" />Logo Name</Label>
            <Input value={logoName} onChange={(e) => setLogoName(e.target.value)} placeholder="e.g., Company Logo" data-testid="input-logo-name" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-500" />Company Name</Label>
            <Input value={logoCompanyName} onChange={(e) => setLogoCompanyName(e.target.value)} placeholder="e.g., Hospitality Business Group" data-testid="input-logo-company-name" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Image className="w-4 h-4 text-gray-500" />Logo Image</Label>
            <AIImagePicker
              imageUrl={logoUrl}
              onImageChange={(url) => { setLogoUrl(url); setUploadedPreview(null); }}
              promptPlaceholder="e.g., Modern minimalist logo for a boutique hotel management company, clean design..."
              uploadLabel="Upload"
              generateLabel="AI Generate"
              variant="light"
              aspectRatio="square"
              maxSizeMB={5}
              showUrlMode={true}
              context="Nano Banana will generate a logo image from your description"
              data-testid="logo-image-picker"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setLogoDialogOpen(false); resetLogoForm(); }} data-testid="button-cancel-logo">Cancel</Button>
          <Button variant="outline" onClick={() => {
            createLogoMutation.mutate({ name: logoName, companyName: logoCompanyName, url: logoUrl });
          }} disabled={!logoName || !logoUrl || createLogoMutation.isPending} data-testid="button-save-logo" className="flex items-center gap-2">
            {createLogoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Add Logo
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
    </>
  );
}
