/**
 * Express routes for ElevenLabs integration.
 * Includes signed URL generation, TTS, STT, and webhook handling.
 */
import express from "express";
import { ElevenLabsClient } from "elevenlabs";

const router = express.Router();

function getClient(): ElevenLabsClient {
  return new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });
}

/**
 * GET /api/elevenlabs/signed-url?agent_id=xxx
 * Generate a signed URL for private agent connections.
 */
router.get("/signed-url", async (req, res) => {
  try {
    const agentId = (req.query.agent_id as string) || process.env.AGENT_ID;
    if (!agentId) {
      return res.status(400).json({ error: "agent_id required" });
    }

    const client = getClient();
    const response = await client.conversationalAi.conversations.getSignedUrl({
      agentId,
    });

    res.json({ signed_url: response.signedUrl });
  } catch (error: any) {
    console.error("Signed URL error:", error.message);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});

/**
 * POST /api/elevenlabs/tts
 * Convert text to speech.
 * Body: { text, voice_id, model_id?, output_format? }
 */
router.post("/tts", async (req, res) => {
  try {
    const { text, voice_id, model_id, output_format } = req.body;
    if (!text || !voice_id) {
      return res.status(400).json({ error: "text and voice_id required" });
    }

    const client = getClient();
    const audio = await client.textToSpeech.convert(voice_id, {
      text,
      modelId: model_id || "eleven_flash_v2_5",
      outputFormat: output_format || "mp3_44100_128",
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audio as AsyncIterable<Buffer>) {
      chunks.push(Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);
    res.set("Content-Type", "audio/mpeg");
    res.set("Content-Length", String(buffer.length));
    res.send(buffer);
  } catch (error: any) {
    console.error("TTS error:", error.message);
    res.status(500).json({ error: "TTS conversion failed" });
  }
});

/**
 * POST /api/elevenlabs/stt
 * Transcribe uploaded audio.
 * Expects multipart/form-data with 'file' field.
 */
router.post("/stt", async (req, res) => {
  try {
    const client = getClient();
    const result = await client.speechToText.convert({
      file: (req as any).file?.buffer,
      modelId: "scribe_v2",
    });

    res.json(result);
  } catch (error: any) {
    console.error("STT error:", error.message);
    res.status(500).json({ error: "Transcription failed" });
  }
});

/**
 * GET /api/elevenlabs/agents
 * List all agents.
 */
router.get("/agents", async (_req, res) => {
  try {
    const client = getClient();
    const result = await client.conversationalAi.agents.list({ pageSize: 50 });
    res.json(result);
  } catch (error: any) {
    console.error("List agents error:", error.message);
    res.status(500).json({ error: "Failed to list agents" });
  }
});

/**
 * GET /api/elevenlabs/agents/:id
 * Get agent configuration.
 */
router.get("/agents/:id", async (req, res) => {
  try {
    const client = getClient();
    const agent = await client.conversationalAi.agents.get(req.params.id);
    res.json(agent);
  } catch (error: any) {
    console.error("Get agent error:", error.message);
    res.status(500).json({ error: "Failed to get agent" });
  }
});

/**
 * GET /api/elevenlabs/voices
 * List available voices.
 */
router.get("/voices", async (req, res) => {
  try {
    const client = getClient();
    const search = req.query.search as string;

    if (search) {
      const result = await client.voices.search({ search, pageSize: 20 });
      res.json(result);
    } else {
      const result = await client.voices.getAll({ showLegacy: false });
      res.json(result);
    }
  } catch (error: any) {
    console.error("Voices error:", error.message);
    res.status(500).json({ error: "Failed to list voices" });
  }
});

/**
 * POST /api/elevenlabs/webhook/conversation-init
 * Conversation initiation webhook — returns dynamic variables.
 */
router.post("/webhook/conversation-init", async (req, res) => {
  const { dynamic_variables } = req.body;
  const callerId = dynamic_variables?.system__caller_id;

  // Look up caller info from your database
  // const user = await db.users.findByPhone(callerId);

  res.json({
    dynamic_variables: {
      caller_name: "Guest",
      caller_id: callerId || "unknown",
    },
  });
});

/**
 * POST /api/elevenlabs/webhook/conversation-end
 * Conversation end webhook — log conversation data.
 */
router.post("/webhook/conversation-end", async (req, res) => {
  const { conversation_id, agent_id, transcript, duration } = req.body;

  console.log(
    `Conversation ${conversation_id} ended. Duration: ${duration}s`
  );

  // Save to your database
  // await db.conversationLogs.create({ conversationId, agentId, transcript, duration });

  res.json({ status: "ok" });
});

export default router;
