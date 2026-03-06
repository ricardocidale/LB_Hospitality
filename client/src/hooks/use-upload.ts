import { useState, useCallback } from "react";

interface UploadResponse {
  objectPath: string;
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        setProgress(10);
        const arrayBuffer = await file.arrayBuffer();
        setProgress(30);

        const response = await fetch("/api/uploads/direct", {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          credentials: "include",
          body: arrayBuffer,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({} as Record<string, string>));
          throw new Error(errorData.error || "Failed to upload file");
        }

        const data = await response.json();
        const uploadResponse: UploadResponse = { objectPath: data.objectPath };

        setProgress(100);
        options.onSuccess?.(uploadResponse);
        return uploadResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [options]
  );

  return {
    uploadFile,
    isUploading,
    error,
    progress,
  };
}
