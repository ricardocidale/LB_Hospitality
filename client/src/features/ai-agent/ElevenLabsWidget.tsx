import { lazy, Suspense } from "react";
import { useGlobalAssumptions } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { registerWidget } from "@elevenlabs/convai-widget-core";

if (!customElements.get("elevenlabs-convai")) {
  registerWidget();
}

// Lazy-load 3D/heavy components to keep initial bundle small
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
  const language = (global as any)?.marcelaLanguage || "en";
  const variant = (global as any)?.marcelaWidgetVariant || "compact";

  const shouldActivate = !!(enabled && agentId);

  const { data: signedUrl } = useQuery<string>({
    queryKey: ["marcela-signed-url"],
    queryFn: async () => {
      const res = await fetch("/api/marcela/signed-url", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get signed URL");
      const data = await res.json();
      return data.signedUrl as string;
    },
    enabled: shouldActivate,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
  });

  if (!shouldActivate) return null;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const dynamicVars = JSON.stringify({
    user_name: fullName,
    user_role: user?.role || "partner",
    current_page: location,
  });

  // Custom visual components (replace the native widget button)
  if (variant === "orb") {
    return (
      <Suspense fallback={null}>
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1.5">
          <div className="w-16 h-16 cursor-pointer drop-shadow-lg">
            <Orb colors={["#9fbca4", "#4a7c5c"]} agentState="thinking" seed={42} />
          </div>
          {/* Native widget hidden behind orb for actual conversation */}
          {signedUrl ? (
            <elevenlabs-convai signed-url={signedUrl} language={language} variant="tiny" dynamic-variables={dynamicVars} />
          ) : (
            <elevenlabs-convai agent-id={agentId} language={language} variant="tiny" dynamic-variables={dynamicVars} />
          )}
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
          {signedUrl ? (
            <elevenlabs-convai signed-url={signedUrl} language={language} variant="tiny" dynamic-variables={dynamicVars} />
          ) : (
            <elevenlabs-convai agent-id={agentId} language={language} variant="tiny" dynamic-variables={dynamicVars} />
          )}
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
          {signedUrl ? (
            <elevenlabs-convai signed-url={signedUrl} language={language} variant="tiny" dynamic-variables={dynamicVars} />
          ) : (
            <elevenlabs-convai agent-id={agentId} language={language} variant="tiny" dynamic-variables={dynamicVars} />
          )}
        </div>
      </Suspense>
    );
  }

  if (variant === "conversation-bar") {
    return (
      <Suspense fallback={null}>
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <ConversationBarWidget agentId={agentId} />
        </div>
      </Suspense>
    );
  }

  // Native widget (tiny | compact | full)
  if (signedUrl) {
    return (
      <elevenlabs-convai
        signed-url={signedUrl}
        language={language}
        variant={variant}
        dynamic-variables={dynamicVars}
      />
    );
  }

  return (
    <elevenlabs-convai
      agent-id={agentId}
      language={language}
      variant={variant}
      dynamic-variables={dynamicVars}
    />
  );
}
