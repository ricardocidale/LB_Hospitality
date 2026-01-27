import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, refetch } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    title: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        company: user.company || "",
        title: user.title || "",
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; company?: string; title?: string }) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <PageHeader
          title="My Profile"
          subtitle="Manage your account information"
          variant="dark"
          actions={
            <SaveButton 
              onClick={handleSave} 
              disabled={updateMutation.isPending}
              isLoading={updateMutation.isPending}
            />
          }
        />

        <Card className="bg-white/80 backdrop-blur-xl border-[#9FBCA4]/20 shadow-lg">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9FBCA4] to-[#257D41] flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="bg-white border-[#9FBCA4]/30 text-gray-900"
                  data-testid="input-profile-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-gray-700">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Enter your company name"
                  className="bg-white border-[#9FBCA4]/30 text-gray-900"
                  data-testid="input-profile-company"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter your job title"
                  className="bg-white border-[#9FBCA4]/30 text-gray-900"
                  data-testid="input-profile-title"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
