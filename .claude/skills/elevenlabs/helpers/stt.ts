import type { ElevenLabsClient } from "elevenlabs";
import { getClient } from "./client";
import type { STTOptions, STTModel, TranscriptionResult } from "./types";

export const DEFAULT_STT_MODEL: STTModel = "scribe_v2";

export async function speechToText(
  options: STTOptions,
  client?: ElevenLabsClient
): Promise<TranscriptionResult> {
  const c = client || getClient();
  const result = await c.speechToText.convert({
    file: options.file,
    modelId: options.modelId || DEFAULT_STT_MODEL,
    languageCode: options.languageCode,
    diarize: options.diarize,
    numSpeakers: options.numSpeakers,
    tagAudioEvents: options.tagAudioEvents,
    timestampsGranularity: options.timestampsGranularity,
  });
  return result as TranscriptionResult;
}

export async function transcribeFile(
  filePath: string,
  options?: Partial<STTOptions>,
  client?: ElevenLabsClient
): Promise<TranscriptionResult> {
  const fs = await import("fs");
  const file = fs.createReadStream(filePath);
  return speechToText(
    {
      file: file as any,
      modelId: options?.modelId || DEFAULT_STT_MODEL,
      languageCode: options?.languageCode,
      diarize: options?.diarize ?? true,
      tagAudioEvents: options?.tagAudioEvents ?? true,
      timestampsGranularity: options?.timestampsGranularity || "word",
    },
    client
  );
}

export async function transcribeWithDiarization(
  filePath: string,
  numSpeakers?: number,
  client?: ElevenLabsClient
): Promise<TranscriptionResult> {
  return transcribeFile(
    filePath,
    { diarize: true, numSpeakers, timestampsGranularity: "word" },
    client
  );
}

export function formatTranscript(result: TranscriptionResult): string {
  if (!result.words) return result.text;

  const lines: string[] = [];
  let currentSpeaker = "";
  let currentLine = "";

  for (const word of result.words) {
    if (word.type === "audio_event") {
      if (currentLine) {
        lines.push(`${currentSpeaker}: ${currentLine.trim()}`);
        currentLine = "";
      }
      lines.push(`[${word.text}]`);
      continue;
    }

    const speaker = word.speaker_id || "Speaker";
    if (speaker !== currentSpeaker) {
      if (currentLine) {
        lines.push(`${currentSpeaker}: ${currentLine.trim()}`);
      }
      currentSpeaker = speaker;
      currentLine = word.text;
    } else {
      currentLine += word.text;
    }
  }

  if (currentLine) {
    lines.push(`${currentSpeaker}: ${currentLine.trim()}`);
  }

  return lines.join("\n");
}
