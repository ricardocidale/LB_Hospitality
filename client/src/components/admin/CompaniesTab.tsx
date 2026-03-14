/**
 * CompaniesTab.tsx — Company entity management for administrators.
 *
 * In this platform, "companies" are legal entities:
 *   • Management Company — the operating entity that manages properties
 *     and earns management fees (there is typically one per platform instance)
 *   • Companies of Interest — entities relevant to the business simulation
 *     (investors, partners, SPVs, or other stakeholders).
 *
 * This tab lets admins:
 *   • Create new companies of interest
 *   • Edit company names and metadata
 *   • Assign logos and themes
 *   • Delete companies (with cascade warnings)
 *
 * Data flows: GET/POST/PATCH/DELETE /api/admin/companies
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { IconPlus, IconTrash, IconPencil, IconBuilding2, IconSave, IconImage, IconFileText, IconPalette } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useAdminUsers, useAdminLogos, useAdminThemes, useAdminCompanies } from "./hooks";
import type { AdminCompany } from "./types";

export default function CompaniesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: "", type: "spv" as string, description: "", logoId: null as number | null, themeId: null as number | null });

  const { data: users } = useAdminUsers();
  const { data: adminLogos } = useAdminLogos();
  const { data: allThemes } = useAdminThemes();

  const { data: adminCompanies } = useQuery<AdminCompany[]>({
    queryKey: ["admin", "companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    },
  });

  const companiesOfInterest = adminCompanies?.filter(c => c.type !== "management") || [];

  const createCompanyMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; description?: string | null; logoId?: number | null; themeId?: number | null }) => {
      const res = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to create company");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setCompanyDialogOpen(false);
      setCompanyForm({ name: "", type: "spv", description: "", logoId: null, themeId: null });
      setEditingCompany(null);
      toast({ title: "Company Created", description: "Company has been created." });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; type?: string; description?: string | null; logoId?: number | null; themeId?: number | null }) => {
      const res = await fetch(`/api/companies/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to update company");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setCompanyDialogOpen(false);
      setEditingCompany(null);
      toast({ title: "Company Updated", description: "Company has been updated." });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/companies/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to delete company");
      }
      if (res.status === 204) return null;
      return res.json().catch(() => null);
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "companies"] });
      const previousCompanies = queryClient.getQueryData<AdminCompany[]>(["admin", "companies"]);
      queryClient.setQueryData<AdminCompany[]>(["admin", "companies"], (old) =>
        old ? old.filter((c) => c.id !== id) : old
      );
      return { previousCompanies };
    },
    onSuccess: () => {
      toast({ title: "Company Deleted", description: "Company has been deleted." });
    },
    onError: (error: Error, _id: number, context) => {
      if (context?.previousCompanies) {
        queryClient.setQueryData(["admin", "companies"], context.previousCompanies);
      }
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  return (
    <>
    <div className="space-y-6">

      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2"><IconBuilding2 className="w-4 h-4 text-muted-foreground" /> Companies of Interest</CardTitle>
              <CardDescription className="label-text">Manage companies relevant to the business simulation.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => {
              setEditingCompany(null);
              setCompanyForm({ name: "", type: "spv", description: "", logoId: null, themeId: null });
              setCompanyDialogOpen(true);
            }} className="flex items-center gap-2" data-testid="button-add-company">
              <IconPlus className="w-4 h-4" /> New Company
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {companiesOfInterest.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconBuilding2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No companies of interest created yet.</p>
              <p className="text-sm">Add companies relevant to the business simulation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {companiesOfInterest.map(company => {
                const companyLogo = adminLogos?.find(l => l.id === company.logoId);
                const companyTheme = allThemes?.find(t => t.id === company.themeId);
                const companyUsers = users?.filter(u => u.companyId === company.id) || [];
                return (
                  <div key={company.id} className="bg-muted border border-border rounded-xl p-4" data-testid={`company-card-${company.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {companyLogo ? (
                          <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden">
                            <img src={companyLogo.url} alt={companyLogo.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
                            <IconBuilding2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-display text-foreground font-medium">{company.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded font-mono bg-muted text-muted-foreground">Company</span>
                          {!company.isActive && <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-600 ml-2">Inactive</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingCompany(company);
                          setCompanyForm({ name: company.name, type: company.type, description: company.description || "", logoId: company.logoId, themeId: company.themeId });
                          setCompanyDialogOpen(true);
                        }} className="text-muted-foreground hover:text-foreground hover:bg-muted" data-testid={`button-edit-company-${company.id}`}>
                          <IconPencil className="w-4 h-4" />
                        </Button>
                        {company.name !== "General" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`button-delete-company-${company.id}`}>
                              <IconTrash className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Company</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete "{company.name}"? Users assigned to this company will be unassigned.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCompanyMutation.mutate(company.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        )}
                      </div>
                    </div>
                    {company.description && (
                      <p className="text-sm text-muted-foreground mb-3">{company.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                      {companyLogo && <span className="bg-muted px-2 py-0.5 rounded">Logo: {companyLogo.name}</span>}
                      <span className="bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                        <IconPalette className="w-3 h-3" />
                        Theme: {companyTheme ? companyTheme.name : <span className="italic">None</span>}
                      </span>
                      <span className="bg-muted px-2 py-0.5 rounded">{companyUsers.length} member{companyUsers.length !== 1 ? "s" : ""}</span>
                    </div>
                    {companyUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {companyUsers.map(u => (
                          <span key={u.id} className="inline-flex items-center gap-1 bg-muted border border-border rounded-full px-3 py-1 text-sm">
                            <span className="font-medium">{u.name || u.email}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{editingCompany ? "Edit Company" : "New Company"}</DialogTitle>
          <DialogDescription className="label-text">{editingCompany ? "Update company details" : "Add a new company of interest"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconBuilding2 className="w-4 h-4 text-muted-foreground" />Company Name</Label>
            <Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} placeholder="e.g., Norfolk Group" data-testid="input-company-form-name" disabled={editingCompany?.name === "General"} />
            {editingCompany?.name === "General" && <p className="text-xs text-muted-foreground">The General company cannot be renamed.</p>}
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconImage className="w-4 h-4 text-muted-foreground" />Logo</Label>
            <Select value={companyForm.logoId != null ? String(companyForm.logoId) : "none"} onValueChange={(v) => setCompanyForm({ ...companyForm, logoId: v === "none" ? null : parseInt(v) })} data-testid="select-company-logo">
              <SelectTrigger data-testid="trigger-company-logo"><SelectValue /></SelectTrigger>
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
            <Select value={companyForm.themeId != null ? String(companyForm.themeId) : "none"} onValueChange={(v) => setCompanyForm({ ...companyForm, themeId: v === "none" ? null : parseInt(v) })} data-testid="select-company-theme">
              <SelectTrigger data-testid="trigger-company-theme"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Theme</SelectItem>
                {allThemes?.map(theme => (
                  <SelectItem key={theme.id} value={String(theme.id)}>
                    {theme.name}{theme.isDefault ? " (Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconFileText className="w-4 h-4 text-muted-foreground" />Description</Label>
            <Input value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} placeholder="Optional description" data-testid="input-company-form-description" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setCompanyDialogOpen(false); setEditingCompany(null); }} data-testid="button-cancel-company">Cancel</Button>
          <Button variant="outline" onClick={() => {
            const payload = { ...companyForm, type: "spv", description: companyForm.description || null };
            if (editingCompany) {
              updateCompanyMutation.mutate({ id: editingCompany.id, ...payload });
            } else {
              createCompanyMutation.mutate(payload);
            }
          }} disabled={!companyForm.name || createCompanyMutation.isPending || updateCompanyMutation.isPending} data-testid="button-save-company" className="flex items-center gap-2">
            {(createCompanyMutation.isPending || updateCompanyMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
            {editingCompany ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
