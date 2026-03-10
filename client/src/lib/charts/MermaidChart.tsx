import { useEffect, useRef, useCallback, useState } from "react";
import mermaid from "mermaid";
import type { MermaidChartProps } from "./types";

let mermaidInitialized = false;

function initMermaid(theme: "default" | "dark" | "forest" | "neutral") {
  mermaid.initialize({
    startOnLoad: false,
    theme,
    securityLevel: "loose",
    fontFamily: "inherit",
  });
  mermaidInitialized = true;
}

let idCounter = 0;

export function MermaidChart({
  chart,
  theme = "neutral",
  className,
}: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgHtml, setSvgHtml] = useState<string>("");

  const render = useCallback(async () => {
    if (!chart.trim()) return;

    try {
      initMermaid(theme);
      const id = `mermaid-${Date.now()}-${++idCounter}`;
      const { svg } = await mermaid.render(id, chart.trim());
      setSvgHtml(svg);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to render Mermaid diagram");
      setSvgHtml("");
    }
  }, [chart, theme]);

  useEffect(() => {
    render();
  }, [render]);

  if (error) {
    return (
      <div className={`rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive ${className ?? ""}`} data-testid="mermaid-error">
        <p className="font-medium mb-1">Diagram Error</p>
        <pre className="text-xs whitespace-pre-wrap opacity-70">{error}</pre>
      </div>
    );
  }

  if (!svgHtml) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground text-sm ${className ?? ""}`} data-testid="mermaid-loading">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-chart overflow-auto rounded-xl bg-card border border-border p-4 [&_svg]:mx-auto [&_svg]:max-w-full ${className ?? ""}`}
      data-testid="mermaid-chart"
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
