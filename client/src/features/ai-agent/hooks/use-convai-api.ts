import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AI_AGENT_KEYS } from "@/features/ai-agent/query-keys";

export function useAgentConfig() {
  return useQuery<any>({
    queryKey: AI_AGENT_KEYS.convaiAgent,
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

export function useSaveAgentLlm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { llm: string; max_tokens?: number }) => {
      const res = await apiRequest("PATCH", "/api/admin/convai/agent/llm", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_AGENT_KEYS.convaiAgent });
      queryClient.invalidateQueries({ queryKey: AI_AGENT_KEYS.voiceSettings });
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
      voice_id?: string;
      model_id?: string;
      stability?: number;
      similarity_boost?: number;
      use_speaker_boost?: boolean;
    }) => {
      const res = await apiRequest("PATCH", "/api/admin/convai/agent/voice", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_AGENT_KEYS.convaiAgent });
      queryClient.invalidateQueries({ queryKey: AI_AGENT_KEYS.voiceSettings });
      toast({ title: "Voice settings saved", description: "TTS configuration pushed to ElevenLabs." });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: AI_AGENT_KEYS.convaiAgent });
      queryClient.invalidateQueries({ queryKey: AI_AGENT_KEYS.voiceSettings });
      toast({ title: "Widget settings saved", description: "Turn timeout and avatar pushed to ElevenLabs." });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });
}
