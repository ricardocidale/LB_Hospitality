import { lazy, Suspense, useEffect, useRef } from "react";
import { useGlobalAssumptions } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

const Orb = lazy(() => import("./components/orb").then((m) => ({ default: m.Orb })));
const BarVisualizer = lazy(() =>
  import("./components/bar-visualizer").then((m) => ({ default: m.BarVisualizer }))
);
const Matrix = lazy(() =>
  import("./components/matrix").then((m) => ({ default: m.Matrix }))
);
const ConversationBarWidget = lazy(() =>
  import("./components/conversation-bar").then((m) => ({ default: m.ConversationBar }))
);

export default function ElevenLabsWidget({ enabled = false }: { enabled?: boolean }) {
  const { data: global } = useGlobalAssumptions();
  const { user } = useAuth();
  const [location] = useLocation();

  const agentId = (global as any)?.marcelaAgentId;
  const agentName = (global as any)?.aiAgentName || "Marcela";
  const variant = (global as any)?.marcelaWidgetVariant || "elevenlabs";

  const shouldActivate = !!(enabled && agentId);

  const isNativeWidget = variant === "elevenlabs" || variant === "full" || variant === "compact" || variant === "tiny";

  const { data: signedUrl } = useQuery<string>({
    queryKey: ["marcela-signed-url"],
    queryFn: async () => {
      const res = await fetch("/api/marcela/signed-url", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get signed URL");
      const data = await res.json();
      return data.signedUrl as string;
    },
    enabled: shouldActivate && !isNativeWidget,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
  });

  if (!shouldActivate) return null;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const dynamicVars: Record<string, string> = {
    user_name: fullName,
    user_role: user?.role || "partner",
    current_page: location,
  };

  if (isNativeWidget) {
    return <NativeElevenLabsWidget agentId={agentId} dynamicVars={dynamicVars} />;
  }

  if (variant === "orb") {
    return (
      <Suspense fallback={null}>
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1.5">
          <div className="w-16 h-16 cursor-pointer drop-shadow-lg">
            <Orb colors={["#9fbca4", "#4a7c5c"]} agentState="thinking" seed={42} />
          </div>
          <ConversationBarWidget
            signedUrl={signedUrl}
            agentId={agentId}
            dynamicVariables={dynamicVars}
            agentLabel={agentName}
          />
        </div>
      </Suspense>
    );
  }

  if (variant === "bars") {
    return (
      <Suspense fallback={null}>
        <div className="fixed bottom-6 right-6 z-50">
          <div className="w-28 cursor-pointer drop-shadow-lg">
            <BarVisualizer
              state="thinking"
              barCount={12}
              demo={true}
              centerAlign={true}
              className="h-10 bg-card/80 backdrop-blur-sm border border-primary/20 rounded-full px-3 shadow-lg"
            />
          </div>
          <ConversationBarWidget
            signedUrl={signedUrl}
            agentId={agentId}
            dynamicVariables={dynamicVars}
            agentLabel={agentName}
          />
        </div>
      </Suspense>
    );
  }

  if (variant === "matrix") {
    return (
      <Suspense fallback={null}>
        <div className="fixed bottom-6 right-6 z-50">
          <div className="cursor-pointer drop-shadow-lg">
            <Matrix
              rows={5}
              cols={10}
              mode="vu"
              levels={[0.3, 0.6, 0.9, 0.7, 0.4, 0.8, 0.5, 0.3, 0.7, 0.5]}
              size={8}
              gap={1}
              palette={{ on: "#4a7c5c", off: "#e8f0ea" }}
              className="rounded-xl overflow-hidden shadow-lg border border-primary/20"
            />
          </div>
          <ConversationBarWidget
            signedUrl={signedUrl}
            agentId={agentId}
            dynamicVariables={dynamicVars}
            agentLabel={agentName}
          />
        </div>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={null}>
      <div className="fixed bottom-6 right-6 z-50 w-80">
        <ConversationBarWidget
          signedUrl={signedUrl}
          agentId={agentId}
          dynamicVariables={dynamicVars}
          agentLabel={agentName}
        />
      </div>
    </Suspense>
  );
}

function NativeElevenLabsWidget({
  agentId,
  dynamicVars,
}: {
  agentId: string;
  dynamicVars: Record<string, string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        await import("@elevenlabs/convai-widget-core");
      } catch (err) {
        console.error("[ElevenLabs] Widget module failed to load:", err);
        return;
      }
      if (cancelled || !containerRef.current) return;

      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }

      const widget = document.createElement("elevenlabs-convai");
      widget.setAttribute("agent-id", agentId);
      widget.setAttribute("dynamic-variables", JSON.stringify(dynamicVars));
      containerRef.current.appendChild(widget);
      widgetRef.current = widget;
    })();

    return () => {
      cancelled = true;
      widgetRef.current?.remove();
      widgetRef.current = null;
    };
  }, [agentId]);

  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.setAttribute("dynamic-variables", JSON.stringify(dynamicVars));
    }
  }, [dynamicVars.user_name, dynamicVars.user_role, dynamicVars.current_page]);

  return <div ref={containerRef} data-testid="elevenlabs-native-widget" />;
}
