import type { ElevenLabsClient } from "elevenlabs";
import { getClient } from "./client";
import type { TTSOptions, TTSOutputFormat, TTSModel } from "./types";

export const DEFAULT_MODEL: TTSModel = "eleven_flash_v2_5";
export const DEFAULT_FORMAT: TTSOutputFormat = "mp3_44100_128";
export const TWILIO_FORMAT: TTSOutputFormat = "ulaw_8000";

export async function textToSpeech(
  options: TTSOptions,
  client?: ElevenLabsClient
): Promise<Buffer> {
  const c = client || getClient();
  const audio = await c.textToSpeech.convert(options.voiceId, {
    text: options.text,
    modelId: options.modelId || DEFAULT_MODEL,
    outputFormat: options.outputFormat || DEFAULT_FORMAT,
    languageCode: options.languageCode,
    voiceSettings: options.voiceSettings
      ? {
          stability: options.voiceSettings.stability,
          similarityBoost: options.voiceSettings.similarity_boost,
          style: options.voiceSettings.style,
          useSpeakerBoost: options.voiceSettings.use_speaker_boost,
        }
      : undefined,
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audio as AsyncIterable<Buffer>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function textToSpeechStream(
  options: TTSOptions,
  client?: ElevenLabsClient
): Promise<AsyncIterable<Buffer>> {
  const c = client || getClient();
  return c.textToSpeech.stream(options.voiceId, {
    text: options.text,
    modelId: options.modelId || DEFAULT_MODEL,
    outputFormat: options.outputFormat || DEFAULT_FORMAT,
    languageCode: options.languageCode,
  }) as Promise<AsyncIterable<Buffer>>;
}

export async function textToSpeechForTwilio(
  voiceId: string,
  text: string,
  client?: ElevenLabsClient
): Promise<Buffer> {
  return textToSpeech(
    { voiceId, text, outputFormat: TWILIO_FORMAT, modelId: DEFAULT_MODEL },
    client
  );
}

export async function textToSpeechWithTimestamps(
  options: TTSOptions,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.textToSpeech.convertWithTimestamps(options.voiceId, {
    text: options.text,
    modelId: options.modelId || DEFAULT_MODEL,
    outputFormat: options.outputFormat || DEFAULT_FORMAT,
  });
}

export function estimateCharacterCost(text: string): number {
  return text.length;
}

export function estimateDuration(text: string, wordsPerMinute = 150): number {
  const words = text.split(/\s+/).length;
  return (words / wordsPerMinute) * 60;
}
