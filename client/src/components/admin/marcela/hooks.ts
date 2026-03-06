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
      toast({ title: "Marcela settings saved", description: "Voice configuration updated successfully." });
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
