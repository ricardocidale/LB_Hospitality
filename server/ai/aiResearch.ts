import Anthropic from "@anthropic-ai/sdk";
import { loadSkill, loadToolDefinitions, validateSkillFolders } from "./research-resources.js";
import { buildUserPrompt } from "./research-prompt-builders.js";
import { handleToolCall } from "./research-tool-prompts.js";

export type { ResearchParams } from "./research-prompt-builders.js";

validateSkillFolders();

// Main streaming research generation with tool use
export async function* generateResearchWithToolsStream(
  params: Parameters<typeof buildUserPrompt>[0],
  anthropic: Anthropic,
  model: string
): AsyncGenerator<{ type: "content" | "done" | "error"; data: string }> {
  const systemPrompt = loadSkill(params.type);
  const allTools = loadToolDefinitions();
  // Filter tools to admin-configured subset when specified; empty = all enabled
  const enabledTools = params.eventConfig?.enabledTools ?? [];
  const tools = enabledTools.length > 0
    ? allTools.filter((t) => enabledTools.includes(t.name))
    : allTools;
  const userPrompt = buildUserPrompt(params);

  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt }
  ];

  const maxIterations = 10;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    const response = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages,
      tools: params.type === "property" ? tools : undefined,
      tool_choice: params.type === "property" ? { type: "auto" } : undefined,
    });

    // Check if there are tool use blocks
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ContentBlock & { type: "tool_use" } =>
        block.type === "tool_use"
    );

    const textBlocks = response.content.filter(
      (block): block is Anthropic.ContentBlock & { type: "text" } =>
        block.type === "text"
    );

    // Stream any text content
    for (const block of textBlocks) {
      if (block.text) {
        yield { type: "content", data: block.text };
      }
    }

    // If no tool calls, we're done
    if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
      break;
    }

    // Process tool calls
    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (toolBlock) => ({
        type: "tool_result" as const,
        tool_use_id: toolBlock.id,
        content: await handleToolCall(toolBlock.name, toolBlock.input as Record<string, any>),
      }))
    );

    messages.push({ role: "user", content: toolResults });
  }

  yield { type: "done", data: "" };
}

// Non-streaming variant for seeding
export async function generateResearchWithTools(
  params: Parameters<typeof buildUserPrompt>[0],
  anthropic: Anthropic,
  model: string
): Promise<Record<string, any>> {
  let fullText = "";

  for await (const chunk of generateResearchWithToolsStream(params, anthropic, model)) {
    if (chunk.type === "content") {
      fullText += chunk.data;
    }
  }

  return parseResearchJSON(fullText);
}

/**
 * Parse raw LLM text into structured JSON, handling markdown code fences.
 * Returns `{ rawResponse }` if parsing fails.
 */
export function parseResearchJSON(fullText: string): Record<string, any> {
  try {
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/) ||
                      fullText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    return { rawResponse: fullText };
  } catch {
    return { rawResponse: fullText };
  }
}

export { loadSkill, loadToolDefinitions, buildUserPrompt, handleToolCall };
export { extractResearchValues } from "./research-value-extractor.js";
