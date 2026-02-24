/**
 * queryClient.ts — Central React Query configuration for the application.
 *
 * Caching strategy:
 *   • staleTime: Infinity — once data is fetched, it is never automatically
 *     refetched in the background. This is intentional because the financial
 *     model is expensive to recompute and changes only when the user explicitly
 *     saves. Mutations use `invalidateQueries` to force a fresh fetch after writes.
 *   • refetchOnWindowFocus: false — prevents surprise data reloads when the user
 *     alt-tabs back to the app.
 *   • retry: false — API errors surface immediately rather than being retried,
 *     since most failures (401, 404) are not transient.
 *
 * Helper utilities:
 *   • `apiRequest(method, url, data?)` — a thin fetch wrapper that attaches JSON
 *     headers, sends credentials (cookies), and throws on non-OK responses.
 *   • `getQueryFn({ on401 })` — factory for query functions used by React Query.
 *     When on401 is "returnNull", a 401 response returns null instead of throwing
 *     (useful for optional auth checks). Otherwise it throws so error boundaries
 *     can catch it.
 */
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
