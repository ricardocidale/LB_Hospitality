import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "../storage";
import { chatStorage } from "../replit_integrations/chat/storage";
import {
  transcribeAudio,
  createElevenLabsStreamingTTS,
  buildVoiceConfigFromDB,
  type VoiceConfig,
  MARCELA_VOICE_ID,
} from "../integrations/elevenlabs";
import { getTwilioFromPhoneNumber, sendSMS } from "../integrations/twilio";
import OpenAI from "openai";
import { retrieveRelevantChunks, buildRAGContext } from "../knowledge-base";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const PHONE_SYSTEM_PROMPT_ADDITION = `

## Phone Conversation Mode
You are currently speaking on a phone call via Twilio. Adjust your responses accordingly:
- Keep responses very concise — aim for 1-3 sentences maximum
- Speak naturally as if on a phone — no markdown, no formatting
- Numbers should be spoken naturally ("two hundred fifty thousand dollars" not "$250,000")
- Avoid lists or complex structures — summarize succinctly
- Use casual phone-friendly transitions: "Sure," "Absolutely," "Let me tell you,"
- If you need to give detailed info, offer to send it via text message instead`;

const SMS_SYSTEM_PROMPT_ADDITION = `

## SMS Conversation Mode
You are responding via text message (SMS). Adjust your responses accordingly:
- Keep responses under 300 characters when possible — SMS should be brief
- No markdown formatting — plain text only
- Be direct and actionable
- Use abbreviations sparingly but accept them from the user
- If the question requires a long answer, give the key point and offer to discuss on a call or the web portal`;

async function buildContextPrompt(userId?: number): Promise<string> {
  try {
    const [assumptions, properties] = await Promise.all([
      storage.getGlobalAssumptions(userId),
      storage.getAllProperties(userId),
    ]);

    const parts: string[] = [];
    if (assumptions) {
      parts.push(`## Current Portfolio Context`);
      parts.push(`- Company: ${assumptions.companyName || "Hospitality Business Company"}`);
      parts.push(`- Properties: ${properties?.length || 0} in portfolio`);
      parts.push(`- Projection Years: ${assumptions.projectionYears || 10}`);
    }

    if (properties && properties.length > 0) {
      parts.push(`\n## Properties`);
      for (const p of properties) {
        parts.push(`- ${p.name}: ${p.roomCount} rooms, ${p.location || "unknown location"}`);
      }
    }

    return parts.length > 0 ? "\n\n" + parts.join("\n") : "";
  } catch {
    return "";
  }
}

function buildSystemPrompt(channel: "phone" | "sms", isAdmin: boolean): string {
  const base = `You are Marcela, a brilliant hospitality business strategist for Hospitality Business Group. You are warm, confident, and sharp — a trusted advisor. You have deep expertise in hotel acquisitions, revenue management, financial projections, and market analysis.

## CRITICAL: No LLM Calculations
- NEVER perform financial calculations yourself
- ALL calculations must be performed by the platform's coded financial engine
- Direct users to the web portal for computed results`;

  let prompt = base;
  if (channel === "phone") prompt += PHONE_SYSTEM_PROMPT_ADDITION;
  if (channel === "sms") prompt += SMS_SYSTEM_PROMPT_ADDITION;
  if (isAdmin) {
    prompt += `\n\n## Admin Note\nThis user is an administrator with full system access. You can discuss user management, verification, and system configuration.`;
  }
  return prompt;
}

function mulaw2linear(mulawByte: number): number {
  mulawByte = ~mulawByte & 0xFF;
  const sign = mulawByte & 0x80;
  const exponent = (mulawByte >> 4) & 0x07;
  let mantissa = mulawByte & 0x0F;
  let sample = (mantissa << (exponent + 3)) + (1 << (exponent + 3)) - 132;
  if (sign !== 0) sample = -sample;
  return sample;
}

function linear2mulaw(sample: number): number {
  const BIAS = 132;
  const CLIP = 32635;
  const sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > CLIP) sample = CLIP;
  sample += BIAS;

  let exponent = 7;
  const expMask = 0x4000;
  for (let i = 0; i < 8; i++) {
    if ((sample & expMask) !== 0) break;
    exponent--;
    sample <<= 1;
  }

  const mantissa = (sample >> 10) & 0x0F;
  const mulawByte = ~(sign | (exponent << 4) | mantissa) & 0xFF;
  return mulawByte;
}

function mulawBufferToWav(mulawData: Buffer): Buffer {
  const numSamples = mulawData.length;
  const pcmData = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const sample = mulaw2linear(mulawData[i]);
    pcmData.writeInt16LE(sample, i * 2);
  }

  const headerSize = 44;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(headerSize);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(8000, 24);
  header.writeUInt32LE(16000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

function pcm16ToMulaw(pcmBase64: string): Buffer {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const numSamples = pcmBuffer.length / 2;
  const mulawBuffer = Buffer.alloc(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const sample = pcmBuffer.readInt16LE(i * 2);
    mulawBuffer[i] = linear2mulaw(sample);
  }
  return mulawBuffer;
}

function downsample(pcmBase64: string, fromRate: number, toRate: number): Buffer {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const ratio = fromRate / toRate;
  const inputSamples = pcmBuffer.length / 2;
  const outputSamples = Math.floor(inputSamples / ratio);
  const output = Buffer.alloc(outputSamples * 2);
  for (let i = 0; i < outputSamples; i++) {
    const srcIndex = Math.floor(i * ratio);
    const sample = pcmBuffer.readInt16LE(srcIndex * 2);
    output.writeInt16LE(sample, i * 2);
  }
  return output;
}

export function register(app: Express) {
  app.post("/api/twilio/voice/incoming", async (req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaTwilioEnabled) {
        res.type("text/xml");
        res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Phone calls are currently disabled. Please contact us through the web portal.</Say><Hangup/></Response>`);
        return;
      }

      const greeting = ga.marcelaPhoneGreeting || "Hello, this is Marcela from Hospitality Business Group. How can I help you today?";
      const host = req.headers.host || req.hostname;
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const wsProtocol = protocol === "https" ? "wss" : "ws";

      res.type("text/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${greeting}</Say>
  <Connect>
    <Stream url="${wsProtocol}://${host}/api/twilio/voice/stream">
      <Parameter name="callerNumber" value="${req.body?.From || ''}" />
    </Stream>
  </Connect>
</Response>`);
    } catch (error) {
      console.error("Twilio voice incoming error:", error);
      res.type("text/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Please try again later.</Say><Hangup/></Response>`);
    }
  });

  app.post("/api/twilio/sms/incoming", async (req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga?.marcelaSmsEnabled) {
        res.type("text/xml");
        res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>SMS is currently disabled. Please contact us through the web portal.</Message></Response>`);
        return;
      }

      const from = req.body?.From || "";
      const body = req.body?.Body || "";

      if (!body.trim()) {
        res.type("text/xml");
        res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
        return;
      }

      const user = from ? await storage.getUserByPhoneNumber(from) : undefined;
      const userId = user?.id;
      const isAdmin = user?.role === "admin";

      const conversation = await chatStorage.createConversation(
        `SMS: ${body.slice(0, 40)}${body.length > 40 ? "..." : ""}`,
        "sms"
      );

      await chatStorage.createMessage(conversation.id, "user", body.trim());

      const [contextPrompt, ragChunks] = await Promise.all([
        buildContextPrompt(userId),
        retrieveRelevantChunks(body.trim(), 4).catch(() => []),
      ]);
      const ragContext = buildRAGContext(ragChunks);
      const systemPrompt = buildSystemPrompt("sms", isAdmin);

      const llmModel = ga?.marcelaLlmModel || "gpt-4.1";
      const maxTokens = ga?.marcelaMaxTokensVoice || 1024;

      const response = await openai.chat.completions.create({
        model: llmModel,
        messages: [
          { role: "system", content: systemPrompt + contextPrompt + ragContext },
          { role: "user", content: body.trim() },
        ],
        max_completion_tokens: maxTokens,
      });

      const reply = response.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";

      await chatStorage.createMessage(conversation.id, "assistant", reply);

      const smsReply = reply.length > 1500 ? reply.slice(0, 1497) + "..." : reply;

      res.type("text/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(smsReply)}</Message></Response>`);
    } catch (error) {
      console.error("Twilio SMS incoming error:", error);
      res.type("text/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, I encountered an error. Please try again.</Message></Response>`);
    }
  });

  app.post("/api/twilio/voice/status", async (_req, res) => {
    res.status(200).send("OK");
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function registerTwilioWebSocket(httpServer: import("http").Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    if (url.pathname === "/api/twilio/voice/stream") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (ws) => {
    let streamSid: string | null = null;
    let callerNumber = "";
    let audioBuffer: Buffer[] = [];
    let silenceTimer: NodeJS.Timeout | null = null;
    let conversationId: number | null = null;
    let isProcessing = false;

    const SILENCE_TIMEOUT_MS = 2000;

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.event) {
          case "start":
            streamSid = msg.start?.streamSid || null;
            callerNumber = msg.start?.customParameters?.callerNumber || "";
            audioBuffer = [];
            console.log(`[Twilio Voice] Stream started from ${callerNumber}, streamSid=${streamSid}`);
            break;

          case "media":
            if (isProcessing) break;
            const chunk = Buffer.from(msg.media.payload, "base64");
            audioBuffer.push(chunk);

            if (silenceTimer) clearTimeout(silenceTimer);
            silenceTimer = setTimeout(async () => {
              if (audioBuffer.length === 0 || isProcessing) return;
              isProcessing = true;

              try {
                const fullAudio = Buffer.concat(audioBuffer);
                audioBuffer = [];

                if (fullAudio.length < 1600) {
                  isProcessing = false;
                  return;
                }

                const wavBuffer = mulawBufferToWav(fullAudio);

                const ga = await storage.getGlobalAssumptions();
                const voiceConfig: VoiceConfig = ga ? buildVoiceConfigFromDB(ga as unknown as Record<string, unknown>) : {
                  voiceId: MARCELA_VOICE_ID, ttsModel: 'eleven_flash_v2_5', sttModel: 'scribe_v1',
                  outputFormat: 'pcm_16000', stability: 0.5, similarityBoost: 0.8, speakerBoost: false,
                  chunkSchedule: [120, 160, 250, 290],
                };

                const userTranscript = await transcribeAudio(wavBuffer, "audio.wav", voiceConfig.sttModel);

                if (!userTranscript || !userTranscript.trim()) {
                  isProcessing = false;
                  return;
                }

                console.log(`[Twilio Voice] Caller said: "${userTranscript.trim()}"`);

                if (!conversationId) {
                  const conv = await chatStorage.createConversation(
                    `Phone: ${userTranscript.slice(0, 40)}${userTranscript.length > 40 ? "..." : ""}`,
                    "phone"
                  );
                  conversationId = conv.id;
                }

                await chatStorage.createMessage(conversationId, "user", userTranscript.trim());

                const user = callerNumber ? await storage.getUserByPhoneNumber(callerNumber) : undefined;
                const userId = user?.id;
                const isAdmin = user?.role === "admin";

                const [contextPrompt, allMessages, phoneRagChunks] = await Promise.all([
                  buildContextPrompt(userId),
                  chatStorage.getMessagesByConversation(conversationId),
                  retrieveRelevantChunks(userTranscript.trim(), 4).catch(() => []),
                ]);

                const phoneRagContext = buildRAGContext(phoneRagChunks);
                const systemPrompt = buildSystemPrompt("phone", isAdmin);
                const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                  { role: "system", content: systemPrompt + contextPrompt + phoneRagContext },
                  ...allMessages.map(m => ({
                    role: m.role as "user" | "assistant",
                    content: m.content,
                  })),
                ];

                const llmModel = ga?.marcelaLlmModel || "gpt-4.1";
                const maxTokens = ga?.marcelaMaxTokensVoice || 1024;

                const llmStream = await openai.chat.completions.create({
                  model: llmModel,
                  messages: chatMessages,
                  stream: true,
                  max_completion_tokens: maxTokens,
                });

                let fullResponse = "";
                const ttsStream = await createElevenLabsStreamingTTS(
                  voiceConfig.voiceId,
                  (audioBase64: string) => {
                    try {
                      const pcmRate = parseInt(voiceConfig.outputFormat.replace("pcm_", "")) || 16000;
                      const downsampled = downsample(audioBase64, pcmRate, 8000);
                      const mulawData = Buffer.alloc(downsampled.length / 2);
                      for (let i = 0; i < mulawData.length; i++) {
                        const sample = downsampled.readInt16LE(i * 2);
                        mulawData[i] = linear2mulaw(sample);
                      }

                      if (ws.readyState === WebSocket.OPEN && streamSid) {
                        ws.send(JSON.stringify({
                          event: "media",
                          streamSid,
                          media: {
                            payload: mulawData.toString("base64"),
                          },
                        }));
                      }
                    } catch (e) {
                      console.error("[Twilio Voice] Error sending audio back:", e);
                    }
                  },
                  {
                    outputFormat: voiceConfig.outputFormat,
                    modelId: voiceConfig.ttsModel,
                    stability: voiceConfig.stability,
                    similarityBoost: voiceConfig.similarityBoost,
                    speakerBoost: voiceConfig.speakerBoost,
                    chunkSchedule: voiceConfig.chunkSchedule,
                  }
                );

                for await (const chunk of llmStream) {
                  const delta = chunk.choices[0]?.delta?.content || "";
                  if (delta) {
                    fullResponse += delta;
                    ttsStream.send(delta);
                  }
                }

                ttsStream.flush();
                await new Promise(resolve => setTimeout(resolve, 500));
                ttsStream.close();
                await new Promise(resolve => setTimeout(resolve, 500));

                await chatStorage.createMessage(conversationId, "assistant", fullResponse);
                console.log(`[Twilio Voice] Marcela responded: "${fullResponse.slice(0, 100)}..."`);
              } catch (error) {
                console.error("[Twilio Voice] Processing error:", error);
              } finally {
                isProcessing = false;
              }
            }, SILENCE_TIMEOUT_MS);
            break;

          case "stop":
            console.log(`[Twilio Voice] Stream stopped for ${callerNumber}`);
            if (silenceTimer) clearTimeout(silenceTimer);
            break;
        }
      } catch (error) {
        console.error("[Twilio Voice] WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      console.log(`[Twilio Voice] WebSocket closed for ${callerNumber}`);
    });

    ws.on("error", (error) => {
      console.error("[Twilio Voice] WebSocket error:", error);
    });
  });
}
