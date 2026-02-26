import { useState, useCallback } from "react";

interface UseGenerateImageOptions {
  onSuccess?: (objectPath: string) => void;
  onError?: (error: Error) => void;
}

/**
 * React hook for generating property images with AI.
 *
 * Calls POST /api/generate-property-image which generates an image
 * via OpenAI's gpt-image-1 and uploads it to object storage.
 *
 * @example
 * ```tsx
 * const { generateImage, isGenerating } = useGenerateImage({
 *   onSuccess: (objectPath) => setImageUrl(objectPath),
 * });
 *
 * <button onClick={() => generateImage("Luxury boutique hotel exterior")}>
 *   Generate
 * </button>
 * ```
 */
export function useGenerateImage(options: UseGenerateImageOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateImage = useCallback(
    async (prompt: string): Promise<string | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const res = await fetch("/api/generate-property-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({} as Record<string, string>));
          throw new Error(data.error || "Failed to generate image");
        }

        const data = await res.json();
        options.onSuccess?.(data.objectPath);
        return data.objectPath;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Image generation failed");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [options],
  );

  return { generateImage, isGenerating, error };
}
