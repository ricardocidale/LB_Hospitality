/**
 * Full React conversation component using @elevenlabs/react.
 * Supports both public and private agents with voice and text modes.
 */
import React, { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";

interface ConversationUIProps {
  agentId: string;
  signedUrlEndpoint?: string;
  userName?: string;
}

export function ConversationUI({
  agentId,
  signedUrlEndpoint,
  userName,
}: ConversationUIProps) {
  const [messages, setMessages] = useState<
    Array<{ role: string; text: string }>
  >([]);
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      setError(null);
      console.log("Connected to agent");
    },
    onDisconnect: () => {
      console.log("Disconnected");
    },
    onMessage: (message) => {
      setMessages((prev) => [
        ...prev,
        { role: message.source, text: message.message },
      ]);
    },
    onError: (err) => {
      setError(err.message || "Connection error");
      console.error("Conversation error:", err);
    },
    onStatusChange: (status) => {
      console.log("Status:", status);
    },
    onModeChange: (mode) => {
      console.log("Mode:", mode);
    },
    clientTools: {
      getCurrentTime: async () => new Date().toISOString(),
      getPageContext: async () =>
        JSON.stringify({
          url: window.location.href,
          title: document.title,
          userName: userName || "Guest",
        }),
    },
  });

  const startConversation = useCallback(async () => {
    try {
      setMessages([]);
      setError(null);

      if (signedUrlEndpoint) {
        const response = await fetch(signedUrlEndpoint);
        const data = await response.json();
        await conversation.startSession({
          signedUrl: data.signed_url,
          connectionType: "websocket",
        });
      } else {
        await conversation.startSession({
          agentId,
          connectionType: "webrtc",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to start conversation");
    }
  }, [agentId, signedUrlEndpoint, conversation]);

  const sendMessage = useCallback(() => {
    if (!textInput.trim()) return;
    conversation.sendTextMessage(textInput);
    setMessages((prev) => [...prev, { role: "user", text: textInput }]);
    setTextInput("");
  }, [textInput, conversation]);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>AI Agent</h2>

      <div style={{ marginBottom: 16 }}>
        <strong>Status:</strong> {conversation.status}
        {conversation.isSpeaking && " (Speaking)"}
      </div>

      {error && (
        <div
          style={{ color: "red", padding: 8, border: "1px solid red", marginBottom: 16 }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        {conversation.status === "disconnected" ? (
          <button onClick={startConversation}>Start Conversation</button>
        ) : (
          <button onClick={() => conversation.endSession()}>
            End Conversation
          </button>
        )}
      </div>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 16,
          height: 400,
          overflowY: "auto",
          marginBottom: 16,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 8,
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 12,
                background: msg.role === "user" ? "#007bff" : "#e9ecef",
                color: msg.role === "user" ? "#fff" : "#000",
                maxWidth: "80%",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      {conversation.status === "connected" && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <label>
          Volume:{" "}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            defaultValue="1"
            onChange={(e) =>
              conversation.setVolume({ volume: parseFloat(e.target.value) })
            }
          />
        </label>
      </div>
    </div>
  );
}
