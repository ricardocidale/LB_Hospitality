import { useEffect, useRef, useState } from "react";
import { useGlobalAssumptions } from "@/lib/api/admin";
import { apiRequest } from "@/lib/queryClient";
import "@elevenlabs/convai-widget-core";

export default function ElevenLabsWidget({ enabled = false }: { enabled?: boolean }) {
  const { data: global } = useGlobalAssumptions();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const agentId = (global as any)?.marcelaAgentId;

  useEffect(() => {
    if (!enabled || !agentId || fetchedRef.current) return;
    fetchedRef.current = true;

    apiRequest("GET", "/api/marcela/signed-url")
      .then((res) => res.json())
      .then((data: { signedUrl: string }) => {
        setSignedUrl(data.signedUrl);
      })
      .catch((err) => {
        console.error("Failed to get Marcela signed URL:", err);
        setError(err.message);
        fetchedRef.current = false;
      });
  }, [enabled, agentId]);

  if (!enabled || !agentId) return null;

  if (error) return null;

  if (!signedUrl) return null;

  return <elevenlabs-convai url={signedUrl} />;
}
