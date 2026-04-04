import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { SpeechToTextChunkResponseModel } from "@elevenlabs/elevenlabs-js/api/types/SpeechToTextChunkResponseModel";
import { getElevenLabsApiKey } from "./integrations/elevenlabs";
import { logger } from "./logger";

export interface TranscriptionResult {
  text?: string;
  error?: string;
  transcriptionTime?: number;
}
export type TranscribeAudioInput = {
  audio: File;
};

const MODEL_ID = "scribe_v1";

export async function transcribeAudio({
  audio,
}: TranscribeAudioInput): Promise<TranscriptionResult> {
  try {
    if (!audio) {
      return { error: "No audio file provided" };
    }

    const apiKey = await getElevenLabsApiKey();
    const client = new ElevenLabsClient({ apiKey });
    const audioBuffer = await audio.arrayBuffer();

    const file = new File([audioBuffer], audio.name || "audio.webm", {
      type: audio.type || "audio/webm",
    });

    const startTime = Date.now();
    const transcriptionResult = await client.speechToText.convert({
      file,
      modelId: MODEL_ID,
      languageCode: "en",
    });
    const transcriptionTime = Date.now() - startTime;

    const rawText = (transcriptionResult as SpeechToTextChunkResponseModel).text;

    if (!rawText) {
      return { error: "No transcription available" };
    }

    return { text: rawText, transcriptionTime };
  } catch (error) {
    logger.error(`Transcription error: ${error instanceof Error ? error.message : error}`, "transcribe");
    return {
      error:
        error instanceof Error ? error.message : "Failed to transcribe audio",
    };
  }
}
