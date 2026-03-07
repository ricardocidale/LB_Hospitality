import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AI_AGENT_KEYS } from "@/features/ai-agent/query-keys";

export function useConversations() {
  return useQuery<any[]>({
    queryKey: AI_AGENT_KEYS.conversations,
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
    queryKey: AI_AGENT_KEYS.conversation(id ?? ""),
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/convai/conversations/${id}`);
      return res.json();
    },
    enabled: !!id,
    retry: false,
  });
}
