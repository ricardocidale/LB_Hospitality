import { ElevenLabsClient } from "elevenlabs";

interface TransferRule {
  agentId: string;
  condition: string;
  delayMs?: number;
  transferMessage?: string;
  enableFirstMessage?: boolean;
}

interface OrchestratorConfig {
  name: string;
  prompt: string;
  firstMessage: string;
  transfers: TransferRule[];
  voice?: string;
  llm?: string;
}

interface SpecialistConfig {
  name: string;
  prompt: string;
  firstMessage: string;
  voice?: string;
  llm?: string;
  tools?: any[];
  knowledgeBaseIds?: string[];
}

export function buildTransferTool(transfers: TransferRule[]) {
  return {
    type: "system" as const,
    name: "transfer_to_agent",
    description: "Transfer to a specialist agent based on user needs",
    params: {
      transfers: transfers.map((t) => ({
        agent_id: t.agentId,
        condition: t.condition,
        delay_ms: t.delayMs ?? 0,
        transfer_message: t.transferMessage,
        enable_transferred_agent_first_message: t.enableFirstMessage ?? false,
      })),
    },
  };
}

export function buildEndCallTool(description?: string) {
  return {
    type: "system" as const,
    name: "end_call",
    description: description ?? "",
  };
}

export function buildLanguageDetectionTool(description?: string) {
  return {
    type: "system" as const,
    name: "language_detection",
    description: description ?? "",
  };
}

export function buildTransferToNumberTool(
  phoneNumbers: Array<{ phoneNumber: string; condition: string }>
) {
  return {
    type: "system" as const,
    name: "transfer_to_number",
    description: "Transfer to a human operator",
    params: {
      phone_numbers: phoneNumbers.map((p) => ({
        phone_number: p.phoneNumber,
        condition: p.condition,
      })),
    },
  };
}

export async function createOrchestrator(
  client: ElevenLabsClient,
  config: OrchestratorConfig
): Promise<string> {
  const agent = await client.conversationalAi.agents.create({
    name: config.name,
    conversation_config: {
      agent: {
        prompt: {
          prompt: config.prompt,
          first_message: config.firstMessage,
          tools: [
            buildTransferTool(config.transfers),
            buildEndCallTool(),
          ],
          llm: config.llm as any,
        },
      },
      tts: config.voice
        ? { voice_id: config.voice }
        : undefined,
    },
  });
  return agent.agent_id;
}

export async function createSpecialist(
  client: ElevenLabsClient,
  config: SpecialistConfig
): Promise<string> {
  const tools: any[] = [buildEndCallTool()];
  if (config.tools) {
    tools.push(...config.tools);
  }

  const agent = await client.conversationalAi.agents.create({
    name: config.name,
    conversation_config: {
      agent: {
        prompt: {
          prompt: config.prompt,
          first_message: config.firstMessage,
          tools,
          llm: config.llm as any,
        },
      },
      tts: config.voice
        ? { voice_id: config.voice }
        : undefined,
    },
  });
  return agent.agent_id;
}

export async function createMultiAgentSystem(
  client: ElevenLabsClient,
  orchestratorConfig: Omit<OrchestratorConfig, "transfers">,
  specialists: Array<
    SpecialistConfig & { transferCondition: string; transferMessage?: string }
  >
): Promise<{ orchestratorId: string; specialistIds: string[] }> {
  const specialistIds: string[] = [];
  for (const spec of specialists) {
    const id = await createSpecialist(client, spec);
    specialistIds.push(id);
  }

  const transfers: TransferRule[] = specialists.map((spec, i) => ({
    agentId: specialistIds[i],
    condition: spec.transferCondition,
    transferMessage: spec.transferMessage,
    enableFirstMessage: true,
  }));

  const orchestratorId = await createOrchestrator(client, {
    ...orchestratorConfig,
    transfers,
  });

  return { orchestratorId, specialistIds };
}

export function generateOrchestratorPrompt(
  companyName: string,
  departments: Array<{ name: string; description: string }>
): string {
  const intentList = departments
    .map((d) => `- **${d.name}**: ${d.description}`)
    .join("\n");

  return `# Role
You are the virtual receptionist for ${companyName}. Your job is to understand what the caller needs and connect them with the right specialist.

# Personality
- Warm, professional, and efficient
- Keep interactions brief — your job is to route, not resolve
- Never attempt to handle complex issues yourself

# Workflow
1. Greet the caller warmly
2. Listen to their request
3. Classify their intent into one of the categories below
4. If unclear, ask ONE clarifying question
5. Transfer to the appropriate specialist
6. If no category matches, offer general help or human escalation

# Intent Categories
${intentList}

# Guardrails
- Never attempt to resolve issues yourself — route only
- Never keep callers waiting unnecessarily
- Always confirm the transfer before initiating it
- Maximum one clarifying question before routing or escalating`;
}
