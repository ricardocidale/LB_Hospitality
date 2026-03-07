import { useQuery } from "@tanstack/react-query";

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
