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
import {
  mulaw2linear,
  linear2mulaw,
  mulawBufferToWav,
  pcm16ToMulaw,
  downsample,
  escapeXml,
  buildSystemPrompt,
} from "../integrations/elevenlabs-audio";
import { getTwilioFromPhoneNumber, sendSMS } from "../integrations/twilio";
import type OpenAI from "openai";
import { getOpenAIClient } from "../ai/clients";
import { DEFAULT_OPENAI_MODEL } from "../ai/resolve-llm";
import { retrieveRelevantChunks, buildRAGContext } from "../ai/knowledge-base";
import { logger } from "../logger";
import twilio from "twilio";
import { logApiCost, estimateCost } from "../middleware/cost-logger";
import { UserRole } from "@shared/constants";

/**
 * Middleware to validate Twilio webhook request signatures.
 * Rejects requests that don't have a valid X-Twilio-Signature header.
 * Falls back to allowing requests if TWILIO_AUTH_TOKEN is not configured (dev mode).
 */
function validateTwilioSignature(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction): void {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    // No auth token configured — allow in development
    next();
    return;
  }

  const signature = req.headers["x-twilio-signature"] as string;
  if (!signature) {
    logger.error("Missing X-Twilio-Signature header", "twilio");
    res.status(403).type("text/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Unauthorized request.</Say><Hangup/></Response>`
    );
    return;
  }

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || req.hostname;
  const url = `${protocol}://${host}${req.originalUrl}`;
  const isValid = twilio.validateRequest(authToken, signature, url, req.body || {});

  if (!isValid) {
    logger.error("Invalid Twilio signature", "twilio");
    res.status(403).type("text/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Unauthorized request.</Say><Hangup/></Response>`
    );
    return;
  }

  next();
}

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
  } catch (err) {
    logger.warn(`Failed to build portfolio context: ${err instanceof Error ? err.message : err}`, "twilio");
    return "";
  }
}

// MARCELA ISOLATED: `as boolean` prevents TS from narrowing and flagging dead code.
const MARCELA_ISOLATED = true as boolean;

export function register(app: Express) {

  app.post("/api/twilio/voice/incoming", validateTwilioSignature, async (req, res) => {
    // MARCELA ISOLATED — always return unavailable TwiML
    // To restore: remove this block. See .claude/plans/MARCELA-ISOLATION.md
    if (MARCELA_ISOLATED) {
      res.type("text/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Our voice assistant is temporarily unavailable. Please contact us through the web portal. Thank you.</Say><Hangup/></Response>`);
      return;
    }

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

  app.post("/api/twilio/sms/incoming", validateTwilioSignature, async (req, res) => {
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
      const isAdmin = user?.role === UserRole.ADMIN;

      const conversation = await chatStorage.createConversation(
        `SMS: ${body.slice(0, 40)}${body.length > 40 ? "..." : ""}`,
        "sms",
        userId
      );

      await chatStorage.createMessage(conversation.id, "user", body.trim());

      const [contextPrompt, ragChunks] = await Promise.all([
        buildContextPrompt(userId),
        retrieveRelevantChunks(body.trim(), 4).catch(() => []),
      ]);
      const ragContext = buildRAGContext(ragChunks);
      const systemPrompt = buildSystemPrompt("sms", isAdmin);

      const llmModel = ga?.marcelaLlmModel || DEFAULT_OPENAI_MODEL;
      const maxTokens = ga?.marcelaMaxTokensVoice || 1024;

      const startTime = Date.now();
      const response = await getOpenAIClient().chat.completions.create({
        model: llmModel,
        messages: [
          { role: "system", content: systemPrompt + contextPrompt + ragContext },
          { role: "user", content: body.trim() },
        ],
        max_completion_tokens: maxTokens,
      });

      const reply = response.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";

      const inTok = response.usage?.prompt_tokens ?? Math.round(body.length / 4);
      const outTok = response.usage?.completion_tokens ?? Math.round(reply.length / 4);
      try { logApiCost({ timestamp: new Date().toISOString(), service: "openai", model: llmModel, operation: "sms-reply", inputTokens: inTok, outputTokens: outTok, estimatedCostUsd: estimateCost("openai", llmModel, inTok, outTok), durationMs: Date.now() - startTime, route: "/api/twilio/sms/incoming" }); } catch (e) { console.warn("[WARN] [cost-logger] Failed to log API cost", (e as Error).message); }

      await chatStorage.createMessage(conversation.id, "assistant", reply);

      const smsReply = reply.length > 1500 ? reply.slice(0, 1497) + "..." : reply;

      res.type("text/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(smsReply)}</Message></Response>`);
    } catch (error) {
      logger.error(`Twilio SMS incoming error: ${error}`, "twilio");
      res.type("text/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, I encountered an error. Please try again.</Message></Response>`);
    }
  });

  app.post("/api/twilio/voice/status", validateTwilioSignature, async (_req, res) => {
    res.status(200).send("OK");
  });
}

export function registerTwilioWebSocket(httpServer: import("http").Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    if (url.pathname === "/api/twilio/voice/stream") {
      // MARCELA ISOLATED — reject WebSocket upgrade
      if (MARCELA_ISOLATED) {
        socket.write("HTTP/1.1 503 Service Temporarily Unavailable\r\n\r\n");
        socket.destroy();
        return;
      }
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
            logger.info(`Stream started from ${callerNumber}, streamSid=${streamSid}`, "Twilio Voice");
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

                logger.info(`Caller said: "${userTranscript.trim()}"`, "Twilio Voice");

                const callerUser = callerNumber ? await storage.getUserByPhoneNumber(callerNumber) : undefined;
                const callerUserId = callerUser?.id;

                if (!conversationId) {
                  const conv = await chatStorage.createConversation(
                    `Phone: ${userTranscript.slice(0, 40)}${userTranscript.length > 40 ? "..." : ""}`,
                    "phone",
                    callerUserId
                  );
                  conversationId = conv.id;
                }

                await chatStorage.createMessage(conversationId, "user", userTranscript.trim());

                const userId = callerUserId;
                const isAdmin = callerUser?.role === UserRole.ADMIN;

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

                const llmModel = ga?.marcelaLlmModel || DEFAULT_OPENAI_MODEL;
                const maxTokens = ga?.marcelaMaxTokensVoice || 1024;

                const llmStream = await getOpenAIClient().chat.completions.create({
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
                      logger.error(`Error sending audio back: ${e}`, "Twilio Voice");
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
                logger.info(`Marcela responded: "${fullResponse.slice(0, 100)}..."`, "Twilio Voice");
              } catch (error) {
                logger.error(`Processing error: ${error}`, "Twilio Voice");
              } finally {
                isProcessing = false;
              }
            }, SILENCE_TIMEOUT_MS);
            break;

          case "stop":
            logger.info(`Stream stopped for ${callerNumber}`, "Twilio Voice");
            if (silenceTimer) clearTimeout(silenceTimer);
            break;
        }
      } catch (error) {
        logger.error(`WebSocket message error: ${error}`, "Twilio Voice");
      }
    });

    ws.on("close", () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      logger.info(`WebSocket closed for ${callerNumber}`, "Twilio Voice");
    });

    ws.on("error", (error) => {
      logger.error(`WebSocket error: ${error}`, "Twilio Voice");
    });
  });
}
