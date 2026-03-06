import type { ElevenLabsClient } from "elevenlabs";
import { getClient } from "./client";

export async function listAgents(
  pageSize = 20,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.agents.list({ pageSize });
}

export async function getAgent(agentId: string, client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.conversationalAi.agents.get(agentId);
}

export async function createAgent(
  config: {
    name: string;
    prompt: string;
    firstMessage?: string;
    voiceId: string;
    llm?: string;
    language?: string;
    ttsModel?: string;
    enableAuth?: boolean;
  },
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.agents.create({
    name: config.name,
    conversationConfig: {
      agent: {
        prompt: {
          prompt: config.prompt,
          llm: config.llm || "gpt-4o",
        },
        firstMessage: config.firstMessage || "Hello! How can I help you?",
        language: config.language || "en",
      },
      tts: {
        voiceId: config.voiceId,
        modelId: config.ttsModel || "eleven_flash_v2_5",
      },
    },
    platformSettings: {
      auth: {
        enableAuth: config.enableAuth ?? false,
      },
    },
  });
}

export async function updateAgentPrompt(
  agentId: string,
  prompt: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.agents.update(agentId, {
    conversationConfig: {
      agent: {
        prompt: { prompt },
      },
    },
  });
}

export async function updateAgentVoice(
  agentId: string,
  voiceId: string,
  ttsModel?: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.agents.update(agentId, {
    conversationConfig: {
      tts: {
        voiceId,
        modelId: ttsModel || "eleven_flash_v2_5",
      },
    },
  });
}

export async function updateAgentFirstMessage(
  agentId: string,
  firstMessage: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.agents.update(agentId, {
    conversationConfig: {
      agent: { firstMessage },
    },
  });
}

export async function updateAgentLLM(
  agentId: string,
  llm: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.agents.update(agentId, {
    conversationConfig: {
      agent: {
        prompt: { llm },
      },
    },
  });
}

export async function deleteAgent(agentId: string, client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.conversationalAi.agents.delete(agentId);
}

export async function getAgentWidgetConfig(agentId: string, client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.conversationalAi.agents.widget.get(agentId);
}

export async function getKnowledgeBaseSize(agentId: string, client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.conversationalAi.agents.knowledgeBase.size(agentId);
}

export async function getLiveConversationCount(client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.conversationalAi.analytics.liveCount.get();
}
