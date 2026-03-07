import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
