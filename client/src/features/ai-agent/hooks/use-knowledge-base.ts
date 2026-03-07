import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useKnowledgeBaseStatus() {
  return useQuery<{
    indexed: boolean;
    chunkCount: number;
    indexedAt: string | null;
  }>({
    queryKey: ["admin", "knowledge-base-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/knowledge-base-status");
      return res.json();
    },
  });
}

export function useReindexKnowledgeBase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/knowledge-base-reindex");
      return res.json();
    },
    onSuccess: (data: { chunksIndexed: number; timeMs: number }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "knowledge-base-status"] });
      toast({
        title: "Knowledge Base Indexed",
        description: `${data.chunksIndexed} chunks indexed in ${(data.timeMs / 1000).toFixed(1)}s`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Indexing Failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useUploadKnowledgeBase() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/convai/knowledge-base/upload");
      return res.json();
    },
    onSuccess: (data: { documentId?: string }) => {
      toast({
        title: "Knowledge Base Uploaded",
        description: `Document uploaded to ElevenLabs${data.documentId ? ` (ID: ${data.documentId.slice(0, 8)}...)` : ""}`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useUploadKBFile() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/convai/knowledge-base/upload-file", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: (data: { name?: string }) => {
      toast({
        title: "Document uploaded",
        description: `"${data.name || "File"}" attached to the AI agent on ElevenLabs`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useRemoveKBDocument() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (docId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/convai/agent/knowledge-base/${docId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "convai-agent"] });
      toast({ title: "Document removed", description: "Detached from ElevenLabs agent." });
    },
    onError: (err: Error) => {
      toast({ title: "Remove failed", description: err.message, variant: "destructive" });
    },
  });
}
