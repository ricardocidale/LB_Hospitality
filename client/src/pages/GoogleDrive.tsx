import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconFolder, IconFolderOpen } from "@/components/icons";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

function formatFileSize(bytes?: string): string {
  if (!bytes) return "-";
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function GoogleDrive() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [folderName, setFolderName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    if (success === "connected") {
      toast({ title: "Google Drive Connected", description: "Your Google Drive is now connected." });
      window.history.replaceState({}, "", "/drive");
    }
    if (error) {
      const messages: Record<string, string> = {
        drive_failed: "Failed to connect Google Drive. Please try again.",
        drive_unavailable: "Google Drive connection is temporarily unavailable.",
        invalid_state: "Session expired. Please try connecting again.",
      };
      toast({ title: "Connection Error", description: messages[error] || "An error occurred.", variant: "destructive" });
      window.history.replaceState({}, "", "/drive");
    }
  }, [toast]);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["drive-status"],
    queryFn: async () => {
      const res = await fetch("/api/drive/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check status");
      return res.json() as Promise<{ connected: boolean; email: string }>;
    },
  });

  const { data: filesData, isLoading: filesLoading, refetch: refetchFiles } = useQuery({
    queryKey: ["drive-files"],
    queryFn: async () => {
      const res = await fetch("/api/drive/files", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to list files");
      return res.json() as Promise<{ files: DriveFile[] }>;
    },
    enabled: statusData?.connected === true,
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/drive/disconnect", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drive-status"] });
      queryClient.removeQueries({ queryKey: ["drive-files"] });
      toast({ title: "Disconnected", description: "Google Drive has been disconnected." });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      return res.json();
    },
    onSuccess: () => {
      setFolderName("");
      refetchFiles();
      toast({ title: "Folder Created", description: "New folder has been created in your Drive." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create folder.", variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/drive/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload");
      return res.json();
    },
    onSuccess: () => {
      refetchFiles();
      toast({ title: "File Uploaded", description: "File has been uploaded to your Drive." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload file.", variant: "destructive" });
    },
  });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      e.target.value = "";
    }
  }, [uploadMutation]);

  const isConnected = statusData?.connected === true;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-drive-title">Google Drive</h1>
          <p className="text-muted-foreground mt-1" data-testid="text-drive-subtitle">
            Connect and manage files in your Google Drive
          </p>
        </div>

        <div className="border rounded-lg p-5 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold" data-testid="text-connection-status">Connection Status</h2>
              <p className="text-sm text-muted-foreground">
                {statusLoading ? "Checking..." : isConnected ? "Connected to Google Drive" : "Not connected"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500" : "bg-muted-foreground/40"}`}
                data-testid="status-indicator"
              />
              {statusLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  data-testid="button-disconnect-drive"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={() => { window.location.href = "/api/auth/google/drive"; }}
                  data-testid="button-connect-drive"
                >
                  Connect Google Drive
                </Button>
              )}
            </div>
          </div>
        </div>

        {isConnected && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-5 space-y-3 bg-card">
                <h3 className="font-semibold" data-testid="text-create-folder">Create Folder</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Folder name"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    data-testid="input-folder-name"
                  />
                  <Button
                    onClick={() => { if (folderName.trim()) createFolderMutation.mutate(folderName.trim()); }}
                    disabled={!folderName.trim() || createFolderMutation.isPending}
                    data-testid="button-create-folder"
                  >
                    {createFolderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconFolder className="w-4 h-4" />}
                    <span className="ml-1.5">Create</span>
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-5 space-y-3 bg-card">
                <h3 className="font-semibold" data-testid="text-upload-file">Upload File</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="file-upload" className="text-xs text-muted-foreground">Choose a file (max 50MB)</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploadMutation.isPending}
                      className="mt-1"
                      data-testid="input-file-upload"
                    />
                  </div>
                  {uploadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mb-2" />}
                </div>
              </div>
            </div>

            <div className="border rounded-lg bg-card">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold" data-testid="text-files-header">Files</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchFiles()}
                  disabled={filesLoading}
                  data-testid="button-refresh-files"
                >
                  {filesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>

              {filesLoading ? (
                <div className="flex items-center justify-center p-10">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !filesData?.files?.length ? (
                <div className="text-center p-10 text-muted-foreground" data-testid="text-no-files">
                  No files found. Create a folder or upload a file to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-files">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-3 font-medium">Name</th>
                        <th className="p-3 font-medium">Type</th>
                        <th className="p-3 font-medium">Size</th>
                        <th className="p-3 font-medium">Modified</th>
                        <th className="p-3 font-medium">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filesData.files.map((file) => (
                        <tr key={file.id} className="border-b last:border-0 hover:bg-muted/40" data-testid={`row-file-${file.id}`}>
                          <td className="p-3 flex items-center gap-2">
                            {file.mimeType === "application/vnd.google-apps.folder" ? (
                              <IconFolderOpen className="w-4 h-4 text-primary shrink-0" />
                            ) : file.iconLink ? (
                              <img src={file.iconLink} alt="" className="w-4 h-4 shrink-0" />
                            ) : null}
                            <span className="truncate max-w-[200px]">{file.name}</span>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {file.mimeType === "application/vnd.google-apps.folder" ? "Folder" : file.mimeType?.split("/").pop() || "-"}
                          </td>
                          <td className="p-3 text-muted-foreground">{formatFileSize(file.size)}</td>
                          <td className="p-3 text-muted-foreground">{formatDate(file.modifiedTime)}</td>
                          <td className="p-3">
                            {file.webViewLink ? (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-xs"
                                data-testid={`link-file-${file.id}`}
                              >
                                Open
                              </a>
                            ) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
