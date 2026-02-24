import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface UseResearchStreamOptions {
  property: any;
  propertyId: number;
  global: any;
}

export function useResearchStream({ property, propertyId, global }: UseResearchStreamOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  const generateResearch = useCallback(async () => {
    if (!property) return;
    setIsGenerating(true);
    setStreamedContent("");
    
    abortRef.current = new AbortController();
    
    try {
      const response = await fetch("/api/research/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "property",
          propertyId: property.id,
          propertyContext: {
            name: property.name,
            location: property.location,
            market: property.market,
            roomCount: property.roomCount,
            startAdr: property.startAdr,
            maxOccupancy: property.maxOccupancy,
            type: property.type,
          },
          assetDefinition: global?.assetDefinition,
        }),
        signal: abortRef.current.signal,
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setStreamedContent(accumulated);
              }
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: ["research", "property", propertyId] });
              }
            } catch {}
          }
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Research generation failed:", error);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [property, global, propertyId, queryClient]);

  return { isGenerating, streamedContent, generateResearch };
}
