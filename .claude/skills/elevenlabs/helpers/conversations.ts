import type { ElevenLabsClient } from "elevenlabs";
import { getClient } from "./client";

export async function listConversations(
  options?: {
    agentId?: string;
    pageSize?: number;
    status?: string;
    cursor?: string;
  },
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.conversations.list({
    agentId: options?.agentId,
    pageSize: options?.pageSize || 20,
    status: options?.status,
  });
}

export async function getConversation(
  conversationId: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.conversations.get(conversationId);
}

export async function deleteConversation(
  conversationId: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.conversations.delete(conversationId);
}

export async function getConversationAudio(
  conversationId: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.conversations.audio.get(conversationId);
}

export async function getConversationMessages(
  conversationId: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.conversations.messages.list(conversationId);
}

export async function submitFeedback(
  conversationId: string,
  rating: number,
  feedback?: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.conversations.feedback.post(conversationId, {
    rating,
    feedback,
  });
}

export async function getRecentConversations(
  agentId: string,
  limit = 10,
  client?: ElevenLabsClient
) {
  const result = await listConversations(
    { agentId, pageSize: limit },
    client
  );
  return result;
}

export function formatConversationTranscript(
  messages: Array<{ role: string; message: string; timestamp?: number }>
): string {
  return messages
    .map((msg) => {
      const time = msg.timestamp
        ? new Date(msg.timestamp * 1000).toLocaleTimeString()
        : "";
      const prefix = msg.role === "agent" ? "Agent" : "User";
      return `[${time}] ${prefix}: ${msg.message}`;
    })
    .join("\n");
}

export function calculateConversationStats(
  conversations: Array<{
    start_time?: string;
    end_time?: string;
    status?: string;
  }>
) {
  const total = conversations.length;
  const completed = conversations.filter((c) => c.status === "completed").length;
  const durations = conversations
    .filter((c) => c.start_time && c.end_time)
    .map((c) => {
      const start = new Date(c.start_time!).getTime();
      const end = new Date(c.end_time!).getTime();
      return (end - start) / 1000;
    });

  const avgDuration =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

  return {
    total,
    completed,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    avgDurationSeconds: Math.round(avgDuration),
    avgDurationFormatted: formatDuration(avgDuration),
  };
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}
