import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { VoiceSettings, TwilioStatus } from "./types";

export function useMarcelaSettings() {
  return useQuery<VoiceSettings>({
    queryKey: ["admin", "voice-settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/voice-settings");
      return res.json();
    },
  });
}

export function useTwilioStatus() {
  return useQuery<TwilioStatus>({
    queryKey: ["admin", "twilio-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/twilio-status");
      return res.json();
    },
  });
}

export function useSaveMarcelaSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: VoiceSettings) => {
      const res = await apiRequest("POST", "/api/admin/voice-settings", settings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "voice-settings"] });
      queryClient.invalidateQueries({ queryKey: ["global-assumptions"] });
      toast({ title: "AI Agent settings saved", description: "Voice configuration updated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useSendTestSms() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ to, message }: { to: string; message: string }) => {
      const res = await apiRequest("POST", "/api/admin/send-notification", {
        to,
        message,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({ title: "Test SMS sent", description: `Message sent to ${variables.to}` });
    },
    onError: (err: Error) => {
      toast({ title: "SMS failed", description: err.message, variant: "destructive" });
    },
  });
}

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

export function useSaveWidgetSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { turn_timeout?: number; avatar_url?: string; widget_variant?: string }) => {
      const res = await apiRequest("PATCH", "/api/admin/convai/agent/widget-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "convai-agent"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "voice-settings"] });
      toast({ title: "Widget settings saved", description: "Turn timeout and avatar pushed to ElevenLabs." });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useAgentConfig() {
  return useQuery<any>({
    queryKey: ["admin", "convai-agent"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/convai/agent");
      return res.json();
    },
    retry: false,
  });
}

export function useSaveAgentPrompt() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { prompt: string; first_message: string; language: string }) => {
      const res = await apiRequest("PATCH", "/api/admin/convai/agent/prompt", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Prompt saved",
        description: "System prompt, first message, and language pushed to ElevenLabs",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useConversations() {
  return useQuery<any[]>({
    queryKey: ["admin", "convai-conversations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/convai/conversations");
      return res.json();
    },
    refetchInterval: 60_000,
    retry: false,
  });
}

export function useConversation(id: string | null) {
  return useQuery<any>({
    queryKey: ["admin", "convai-conversation", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/convai/conversations/${id}`);
      return res.json();
    },
    enabled: !!id,
    retry: false,
  });
}

export function useSaveAgentLlm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { llm: string; max_tokens?: number }) => {
      const res = await apiRequest("PATCH", "/api/admin/convai/agent/llm", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "convai-agent"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "voice-settings"] });
      toast({ title: "LLM settings saved", description: "Model pushed to ElevenLabs." });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useSaveAgentVoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      voice_id?: string; model_id?: string; stability?: number;
      similarity_boost?: number; use_speaker_boost?: boolean;
    }) => {
      const res = await apiRequest("PATCH", "/api/admin/convai/agent/voice", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "convai-agent"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "voice-settings"] });
      toast({ title: "Voice settings saved", description: "TTS configuration pushed to ElevenLabs." });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
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

export function useAdminSignedUrl() {
  return useQuery<string>({
    queryKey: ["admin", "marcela-signed-url"],
    queryFn: async () => {
      const res = await fetch("/api/marcela/signed-url", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return data.signedUrl as string;
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
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
