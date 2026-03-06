import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useVoiceRecorder } from "../../../replit_integrations/audio/useVoiceRecorder";
import { useAudioPlayback } from "../../../replit_integrations/audio/useAudioPlayback";
import type { Conversation, Message, PhoneInfo, VoiceState } from "./types";

export function useChat(isOpen: boolean, activeConversationId: number | null, setActiveConversationId: (id: number | null) => void, setShowConversations: (show: boolean) => void) {
  const queryClient = useQueryClient();
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isOpen,
  });

  const { data: phoneInfo } = useQuery<PhoneInfo>({
    queryKey: ["marcela-phone"],
    queryFn: async () => {
      const res = await fetch("/api/marcela/phone", { credentials: "include" });
      if (!res.ok) return { enabled: false, phoneNumber: null };
      return res.json();
    },
    enabled: isOpen,
    staleTime: 60000,
  });

  const { data: activeConversation } = useQuery<Conversation>({
    queryKey: ["conversation", activeConversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${activeConversationId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!activeConversationId,
  });

  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations", { title: "New Chat" });
      return res.json();
    },
    onSuccess: (data: Conversation) => {
      setActiveConversationId(data.id);
      setShowConversations(false);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: (_, id) => {
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setShowConversations(true);
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const sendMessage = async (input: string) => {
    if (!input.trim() || !activeConversationId || isStreaming) return;

    const messageContent = input.trim();
    setIsStreaming(true);
    setStreamingContent("");

    queryClient.setQueryData<Conversation>(
      ["conversation", activeConversationId],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...(old.messages || []),
            { id: Date.now(), role: "user", content: messageContent, createdAt: new Date().toISOString() },
          ],
        };
      }
    );

    try {
      const response = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
        credentials: "include",
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulated += data.content;
                  setStreamingContent(accumulated);
                }
                if (data.done) {
                  setIsStreaming(false);
                  setStreamingContent("");
                  queryClient.invalidateQueries({ queryKey: ["conversation", activeConversationId] });
                  queryClient.invalidateQueries({ queryKey: ["conversations"] });
                }
              } catch { /* incomplete SSE chunk */ }
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  return {
    conversations,
    phoneInfo,
    activeConversation,
    createConversation,
    deleteConversation,
    sendMessage,
    streamingContent,
    setStreamingContent,
    isStreaming,
    setIsStreaming,
  };
}

export function useVoice(
  activeConversationId: number | null,
  setActiveConversationId: (id: number | null) => void,
  setShowConversations: (show: boolean) => void,
  isStreaming: boolean,
  setIsStreaming: (streaming: boolean) => void,
  setStreamingContent: (content: string) => void,
  streamingContent: string
) {
  const queryClient = useQueryClient();
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastFailedVoiceBlob, setLastFailedVoiceBlob] = useState<Blob | null>(null);

  const { state: recorderState, startRecording, stopRecording } = useVoiceRecorder();
  const playback = useAudioPlayback();
  const isRecording = recorderState === "recording";
  const isPlayingAudio = playback.state === "playing";

  useEffect(() => {
    if (isRecording) {
      setVoiceState("recording");
    } else if (isProcessingVoice && !streamingContent) {
      setVoiceState("processing");
    } else if (isStreaming && !isPlayingAudio && streamingContent) {
      setVoiceState("thinking");
    } else if (isPlayingAudio) {
      setVoiceState("speaking");
    } else {
      setVoiceState("idle");
    }
  }, [isRecording, isProcessingVoice, isStreaming, isPlayingAudio, streamingContent]);

  const sendVoiceMessage = async (conversationId: number, audioBlob: Blob) => {
    setIsProcessingVoice(true);
    setIsStreaming(true);
    setStreamingContent("");
    setVoiceError(null);

    const base64Audio = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.readAsDataURL(audioBlob);
    });

    try {
      const response = await fetch(`/api/conversations/${conversationId}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64Audio }),
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Voice request failed" }));
        throw new Error(err.error || "Voice request failed");
      }

      const streamReader = response.body?.getReader();
      if (!streamReader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullTranscript = "";

      playback.clear();

      while (true) {
        const { done, value } = await streamReader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(line.slice(6));

            switch (event.type) {
              case "user_transcript":
                queryClient.setQueryData<Conversation>(
                  ["conversation", conversationId],
                  (old) => {
                    if (!old) return old;
                    return {
                      ...old,
                      messages: [
                        ...(old.messages || []),
                        { id: Date.now(), role: "user", content: event.data, createdAt: new Date().toISOString() },
                      ],
                    };
                  }
                );
                setIsProcessingVoice(false);
                break;
              case "transcript":
                fullTranscript += event.data;
                setStreamingContent(fullTranscript);
                break;
              case "audio":
                playback.pushAudio(event.data);
                break;
              case "tts_error":
                setVoiceError("Voice unavailable, text response below");
                break;
              case "done":
                playback.signalComplete();
                setIsStreaming(false);
                setStreamingContent("");
                queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
                queryClient.invalidateQueries({ queryKey: ["conversations"] });
                break;
              case "error":
                throw new Error(event.error);
            }
          } catch (e) {
            if (!(e instanceof SyntaxError)) {
              console.error("Voice stream error:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Voice error:", error);
      setVoiceError("Voice message failed. Tap retry to try again.");
      setLastFailedVoiceBlob(audioBlob);
    } finally {
      setIsStreaming(false);
      setIsProcessingVoice(false);
      setStreamingContent("");
    }
  };

  const handleVoiceToggle = async () => {
    if (isStreaming && !isRecording && !isPlayingAudio) return;

    if (isPlayingAudio) {
      playback.clear();
      setIsStreaming(false);
      setStreamingContent("");
      setIsProcessingVoice(false);
      setVoiceState("idle");
      try {
        await startRecording();
        await playback.init();
      } catch (error) {
        console.error("Microphone access denied:", error);
      }
      return;
    }

    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob.size === 0) return;

      setVoiceError(null);
      setLastFailedVoiceBlob(null);

      if (!activeConversationId) {
        try {
          const res = await apiRequest("POST", "/api/conversations", { title: "Voice Chat" });
          const conv = await res.json();
          setActiveConversationId(conv.id);
          setShowConversations(false);
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          await sendVoiceMessage(conv.id, audioBlob);
        } catch (error) {
          console.error("Failed to create conversation for voice:", error);
        }
        return;
      }

      await sendVoiceMessage(activeConversationId, audioBlob);
    } else {
      try {
        await playback.init();
        await startRecording();
      } catch (error) {
        console.error("Microphone access denied:", error);
      }
    }
  };

  const retryVoice = async () => {
    if (!lastFailedVoiceBlob || !activeConversationId) return;
    const blob = lastFailedVoiceBlob;
    setLastFailedVoiceBlob(null);
    setVoiceError(null);
    await sendVoiceMessage(activeConversationId, blob);
  };

  return {
    voiceState,
    voiceError,
    isRecording,
    isPlayingAudio,
    handleVoiceToggle,
    retryVoice,
    lastFailedVoiceBlob,
  };
}
