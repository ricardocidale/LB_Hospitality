import type { ElevenLabsClient } from "elevenlabs";
import { getClient } from "./client";

export async function listPhoneNumbers(client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.conversationalAi.phoneNumbers.list();
}

export async function getPhoneNumber(
  phoneNumberId: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.phoneNumbers.get(phoneNumberId);
}

export async function registerPhoneNumber(
  config: {
    provider: "twilio" | "sip";
    phoneNumber: string;
    label?: string;
    agentId?: string;
  },
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.phoneNumbers.create({
    provider: config.provider,
    phoneNumber: config.phoneNumber,
    label: config.label,
    agentId: config.agentId,
  });
}

export async function assignAgentToNumber(
  phoneNumberId: string,
  agentId: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.phoneNumbers.update(phoneNumberId, {
    agentId,
  });
}

export async function removePhoneNumber(
  phoneNumberId: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.phoneNumbers.delete(phoneNumberId);
}

export async function scheduleBatchCalls(
  agentId: string,
  calls: Array<{
    phoneNumber: string;
    dynamicVariables?: Record<string, string>;
  }>,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.batchCalls.create({
    agentId,
    calls,
  });
}

export async function getBatchCallStatus(
  batchCallId: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.batchCalls.get(batchCallId);
}
