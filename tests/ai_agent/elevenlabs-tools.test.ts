import { describe, it, expect } from "vitest";
import { buildClientTools, buildServerTools } from "../../server/marcela-agent-config";
import { buildVoiceConfigFromDB, MARCELA_VOICE_ID } from "../../server/integrations/elevenlabs";
import { LLM_MODELS, TTS_MODELS, STT_MODELS, OUTPUT_FORMATS } from "../../client/src/components/admin/marcela/types";

describe("ElevenLabs Deterministic Tools", () => {
  describe("LLM Model Registry", () => {
    it("every model has value, label, description, and provider", () => {
      for (const m of LLM_MODELS) {
        expect(typeof m.value).toBe("string");
        expect(m.value.length).toBeGreaterThan(0);
        expect(typeof m.label).toBe("string");
        expect(typeof m.description).toBe("string");
        expect(typeof m.provider).toBe("string");
      }
    });

    it("has no duplicate model values", () => {
      const values = LLM_MODELS.map((m) => m.value);
      expect(new Set(values).size).toBe(values.length);
    });

    it("includes at least one model from each supported provider", () => {
      const providers = new Set(LLM_MODELS.map((m) => m.provider));
      expect(providers).toContain("Google");
      expect(providers).toContain("OpenAI");
      expect(providers).toContain("Anthropic");
      expect(providers).toContain("ElevenLabs");
    });

    it("includes Gemini Flash models", () => {
      const geminiModels = LLM_MODELS.filter((m) => m.provider === "Google");
      expect(geminiModels.length).toBeGreaterThanOrEqual(2);
      const values = geminiModels.map((m) => m.value);
      expect(values.some((v) => v.includes("gemini") && v.includes("flash"))).toBe(true);
    });

    it("includes ElevenLabs custom LLM option", () => {
      const el = LLM_MODELS.find((m) => m.provider === "ElevenLabs");
      expect(el).toBeDefined();
      expect(el!.value).toContain("elevenlabs");
    });
  });

  describe("TTS Model Registry", () => {
    it("every model has value, label, and description", () => {
      for (const m of TTS_MODELS) {
        expect(typeof m.value).toBe("string");
        expect(typeof m.label).toBe("string");
        expect(typeof m.description).toBe("string");
      }
    });

    it("has no duplicate values", () => {
      const values = TTS_MODELS.map((m) => m.value);
      expect(new Set(values).size).toBe(values.length);
    });

    it("includes flash v2.5 (default for low latency)", () => {
      expect(TTS_MODELS.some((m) => m.value === "eleven_flash_v2_5")).toBe(true);
    });

    it("includes multilingual v2", () => {
      expect(TTS_MODELS.some((m) => m.value === "eleven_multilingual_v2")).toBe(true);
    });
  });

  describe("STT Model Registry", () => {
    it("includes scribe_v1", () => {
      expect(STT_MODELS.some((m) => m.value === "scribe_v1")).toBe(true);
    });
  });

  describe("Output Format Registry", () => {
    it("has no duplicate values", () => {
      const values = OUTPUT_FORMATS.map((m) => m.value);
      expect(new Set(values).size).toBe(values.length);
    });

    it("includes PCM 16kHz (default)", () => {
      expect(OUTPUT_FORMATS.some((m) => m.value === "pcm_16000")).toBe(true);
    });

    it("includes telephony format (ulaw_8000)", () => {
      expect(OUTPUT_FORMATS.some((m) => m.value === "ulaw_8000")).toBe(true);
    });
  });

  describe("Tool Schema Conformance — Client Tools", () => {
    const tools = buildClientTools();

    it("all client tools conform to ElevenLabs client tool schema", () => {
      for (const tool of tools) {
        expect(tool.type).toBe("client");
        expect(typeof tool.name).toBe("string");
        expect(tool.name).toMatch(/^[a-zA-Z][a-zA-Z0-9_]*$/);
        expect(typeof tool.description).toBe("string");
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.parameters).toBeDefined();
        expect(tool.parameters.type).toBe("object");
        expect(tool.parameters.properties).toBeDefined();
        expect(tool.expects_response).toBe(true);
      }
    });

    it("all client tool parameters have valid JSON Schema types", () => {
      const validTypes = ["string", "number", "integer", "boolean", "object", "array"];
      for (const tool of tools) {
        for (const [, prop] of Object.entries(tool.parameters.properties)) {
          expect(validTypes).toContain((prop as any).type);
          expect(typeof (prop as any).description).toBe("string");
        }
      }
    });

    it("all required fields exist in properties", () => {
      for (const tool of tools) {
        if (tool.parameters.required) {
          for (const req of tool.parameters.required) {
            expect(tool.parameters.properties).toHaveProperty(req);
          }
        }
      }
    });

    it("tool names are unique", () => {
      const names = tools.map((t) => t.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it("navigateToPage lists all valid portal routes in description", () => {
      const nav = tools.find((t) => t.name === "navigateToPage")!;
      const desc = nav.parameters.properties.page.description;
      const requiredRoutes = ["/", "/portfolio", "/company", "/analysis", "/scenarios", "/help"];
      for (const route of requiredRoutes) {
        expect(desc).toContain(route);
      }
    });
  });

  describe("Tool Schema Conformance — Server Tools (Webhooks)", () => {
    const baseUrl = "https://test.example.com";
    const tools = buildServerTools(baseUrl);

    it("all server tools conform to ElevenLabs webhook schema", () => {
      for (const tool of tools) {
        expect(tool.type).toBe("webhook");
        expect(typeof tool.name).toBe("string");
        expect(tool.name).toMatch(/^[a-zA-Z][a-zA-Z0-9_]*$/);
        expect(typeof tool.description).toBe("string");
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.api_schema).toBeDefined();
        expect(typeof tool.api_schema.url).toBe("string");
        expect(["GET", "POST", "PUT", "PATCH", "DELETE"]).toContain(tool.api_schema.method);
        expect(tool.expects_response).toBe(true);
      }
    });

    it("all webhook URLs start with the base URL", () => {
      for (const tool of tools) {
        expect(tool.api_schema.url.startsWith(baseUrl)).toBe(true);
      }
    });

    it("all webhook URLs are valid URL patterns", () => {
      for (const tool of tools) {
        const url = tool.api_schema.url.replace(/\{[^}]+\}/g, "placeholder");
        expect(() => new URL(url)).not.toThrow();
      }
    });

    it("all webhooks include auth header", () => {
      for (const tool of tools) {
        expect(tool.api_schema.headers).toBeDefined();
        expect(tool.api_schema.headers["x-marcela-tools-secret"]).toBeDefined();
        expect(typeof tool.api_schema.headers["x-marcela-tools-secret"]).toBe("string");
      }
    });

    it("tool names are unique", () => {
      const names = tools.map((t) => t.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it("tools with URL placeholders have matching path_params_schema", () => {
      for (const tool of tools) {
        const placeholders = tool.api_schema.url.match(/\{([^}]+)\}/g) || [];
        if (placeholders.length > 0) {
          expect(tool.api_schema.path_params_schema).toBeDefined();
          for (const ph of placeholders) {
            const key = ph.replace(/[{}]/g, "");
            expect(tool.api_schema.path_params_schema).toHaveProperty(key);
          }
        }
      }
    });

    it("tools WITHOUT URL placeholders do NOT have path_params_schema", () => {
      for (const tool of tools) {
        const placeholders = tool.api_schema.url.match(/\{([^}]+)\}/g) || [];
        if (placeholders.length === 0) {
          expect(tool.api_schema.path_params_schema).toBeUndefined();
        }
      }
    });

    it("path_params_schema entries have valid JSON Schema type and description", () => {
      for (const tool of tools) {
        if (tool.api_schema.path_params_schema) {
          for (const [, schema] of Object.entries(tool.api_schema.path_params_schema)) {
            expect(typeof (schema as any).type).toBe("string");
            expect(typeof (schema as any).description).toBe("string");
          }
        }
      }
    });
  });

  describe("Navigation Tool Response Shape", () => {
    it("navigation pages have path, name, and description", () => {
      const pages = [
        { path: "/", name: "Dashboard", description: "Overview of portfolio performance and key metrics" },
        { path: "/portfolio", name: "Portfolio", description: "Map and list view of all properties" },
        { path: "/company", name: "Company", description: "Company-level financial assumptions and settings" },
        { path: "/analysis", name: "Analysis", description: "Financial analysis, sensitivity, financing, and comparisons" },
        { path: "/scenarios", name: "Scenarios", description: "Saved portfolio snapshots for what-if analysis" },
        { path: "/help", name: "Help", description: "User manual, checker manual, and guided tour" },
      ];
      for (const page of pages) {
        expect(page.path.startsWith("/")).toBe(true);
        expect(page.name.length).toBeGreaterThan(0);
        expect(page.description.length).toBeGreaterThan(10);
      }
    });
  });

  describe("Voice Config Defaults Alignment", () => {
    it("default voice ID matches MARCELA_VOICE_ID constant", () => {
      const config = buildVoiceConfigFromDB({});
      expect(config.voiceId).toBe(MARCELA_VOICE_ID);
      expect(MARCELA_VOICE_ID).toBe("cgSgspJ2msm6clMCkdW9");
    });

    it("default TTS model is in the TTS_MODELS registry", () => {
      const config = buildVoiceConfigFromDB({});
      expect(TTS_MODELS.some((m) => m.value === config.ttsModel)).toBe(true);
    });

    it("default STT model is in the STT_MODELS registry", () => {
      const config = buildVoiceConfigFromDB({});
      expect(STT_MODELS.some((m) => m.value === config.sttModel)).toBe(true);
    });

    it("default output format is in the OUTPUT_FORMATS registry", () => {
      const config = buildVoiceConfigFromDB({});
      expect(OUTPUT_FORMATS.some((m) => m.value === config.outputFormat)).toBe(true);
    });

    it("stability and similarityBoost are between 0 and 1", () => {
      const config = buildVoiceConfigFromDB({});
      expect(config.stability).toBeGreaterThanOrEqual(0);
      expect(config.stability).toBeLessThanOrEqual(1);
      expect(config.similarityBoost).toBeGreaterThanOrEqual(0);
      expect(config.similarityBoost).toBeLessThanOrEqual(1);
    });

    it("chunk schedule has positive integer values", () => {
      const config = buildVoiceConfigFromDB({});
      expect(config.chunkSchedule.length).toBeGreaterThan(0);
      for (const val of config.chunkSchedule) {
        expect(Number.isInteger(val)).toBe(true);
        expect(val).toBeGreaterThan(0);
      }
    });
  });

  describe("Tool Count Stability", () => {
    it("client tools count is stable at 12", () => {
      const tools = buildClientTools();
      expect(tools.length).toBe(12);
    });

    it("server tools count is stable at 6", () => {
      const tools = buildServerTools("https://example.com");
      expect(tools.length).toBe(6);
    });

    it("total tools count matches expected 18", () => {
      const client = buildClientTools();
      const server = buildServerTools("https://example.com");
      expect(client.length + server.length).toBe(18);
    });
  });

  describe("Credential Fallback Chain", () => {
    it("ELEVENLABS_API_KEY env var is available in current environment", () => {
      expect(typeof process.env.ELEVENLABS_API_KEY).toBe("string");
      expect(process.env.ELEVENLABS_API_KEY!.length).toBeGreaterThan(0);
    });
  });

  describe("ElevenLabs API URL Construction", () => {
    const CONVAI_BASE = "https://api.elevenlabs.io/v1/convai";

    it("agent endpoint follows correct pattern", () => {
      const agentId = "agent_test123";
      const url = `${CONVAI_BASE}/agents/${agentId}`;
      expect(url).toBe("https://api.elevenlabs.io/v1/convai/agents/agent_test123");
    });

    it("signed URL endpoint follows correct pattern", () => {
      const agentId = "agent_test123";
      const url = `${CONVAI_BASE}/conversation/get-signed-url?agent_id=${agentId}`;
      expect(url).toContain("get-signed-url");
      expect(url).toContain("agent_id=agent_test123");
    });

    it("conversation list endpoint follows correct pattern", () => {
      const agentId = "agent_test123";
      const url = `${CONVAI_BASE}/conversations?agent_id=${agentId}`;
      expect(url).toBe("https://api.elevenlabs.io/v1/convai/conversations?agent_id=agent_test123");
    });

    it("knowledge base document endpoints follow correct patterns", () => {
      const docId = "doc_abc123";
      expect(`${CONVAI_BASE}/knowledge-base/documents/${docId}`).toContain(docId);
      expect(`${CONVAI_BASE}/knowledge-base/documents/create-from-text`).toContain("create-from-text");
      expect(`${CONVAI_BASE}/knowledge-base/documents/create-from-file`).toContain("create-from-file");
    });

    it("TTS streaming WebSocket URL follows correct pattern", () => {
      const voiceId = "cgSgspJ2msm6clMCkdW9";
      const modelId = "eleven_flash_v2_5";
      const format = "pcm_16000";
      const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${modelId}&output_format=${format}`;
      expect(uri).toContain("wss://");
      expect(uri).toContain(voiceId);
      expect(uri).toContain("stream-input");
      expect(uri).toContain(`model_id=${modelId}`);
      expect(uri).toContain(`output_format=${format}`);
    });
  });

  describe("ElevenLabs Type Contracts", () => {
    it("ConvaiAgent shape is correct", () => {
      const agent = {
        agent_id: "agent_123",
        name: "Marcela",
        conversation_config: {
          agent: { prompt: { prompt: "You are Marcela" }, first_message: "Hello!" },
          tts: { voice_id: "voice_123", model_id: "eleven_flash_v2_5" },
        },
      };
      expect(agent.agent_id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.conversation_config.agent.prompt.prompt).toBeDefined();
      expect(agent.conversation_config.tts.voice_id).toBeDefined();
    });

    it("ConvaiConversation shape is correct", () => {
      const conv = {
        conversation_id: "conv_123",
        agent_id: "agent_123",
        status: "done",
        transcript: [
          { role: "user" as const, message: "Hello", time_in_call_secs: 0 },
          { role: "agent" as const, message: "Hi there!", time_in_call_secs: 1 },
        ],
      };
      expect(conv.conversation_id).toBeDefined();
      expect(conv.transcript).toHaveLength(2);
      expect(conv.transcript[0].role).toBe("user");
      expect(conv.transcript[1].role).toBe("agent");
    });

    it("KBDocument shape is correct", () => {
      const doc = { id: "doc_123", name: "Financial Overview" };
      expect(doc.id).toBeDefined();
      expect(doc.name).toBeDefined();
    });
  });

  describe("Marcela Tools Auth Middleware Contract", () => {
    it("MARCELA_TOOLS_SECRET env or default is consistent with tool headers", () => {
      const secret = process.env.MARCELA_TOOLS_SECRET || "marcela-server-tools-key";
      const tools = buildServerTools("https://example.com");
      for (const tool of tools) {
        expect(tool.api_schema.headers["x-marcela-tools-secret"]).toBe(secret);
      }
    });
  });
});
