export interface ElevenLabsConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  description?: string;
  preview_url?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface TTSOptions {
  voiceId: string;
  text: string;
  modelId?: string;
  outputFormat?: TTSOutputFormat;
  languageCode?: string;
  voiceSettings?: VoiceSettings;
}

export type TTSOutputFormat =
  | "mp3_22050_32"
  | "mp3_44100_128"
  | "mp3_44100_192"
  | "pcm_16000"
  | "pcm_22050"
  | "pcm_24000"
  | "pcm_44100"
  | "ulaw_8000";

export type TTSModel =
  | "eleven_flash_v2_5"
  | "eleven_multilingual_v2"
  | "eleven_turbo_v2_5"
  | "eleven_monolingual_v1";

export type STTModel = "scribe_v1" | "scribe_v2";

export interface STTOptions {
  file: Buffer | ReadableStream;
  modelId?: STTModel;
  languageCode?: string;
  diarize?: boolean;
  numSpeakers?: number;
  tagAudioEvents?: boolean;
  timestampsGranularity?: "word" | "character";
}

export interface TranscriptionResult {
  text: string;
  words?: TranscriptionWord[];
  language_code: string;
  language_probability: number;
}

export interface TranscriptionWord {
  text: string;
  start: number;
  end: number;
  type: "word" | "spacing" | "audio_event";
  speaker_id?: string;
}

export interface AgentConfig {
  name: string;
  conversationConfig: {
    agent: {
      prompt: {
        prompt: string;
        llm?: string;
        temperature?: number;
        maxTokens?: number;
        knowledgeBase?: KnowledgeBaseRef[];
      };
      firstMessage?: string;
      language?: string;
    };
    tts: {
      voiceId: string;
      modelId?: string;
      stability?: number;
      similarityBoost?: number;
      speed?: number;
    };
    stt?: {
      provider?: string;
      model?: string;
    };
  };
  platformSettings?: {
    auth?: { enableAuth?: boolean; allowedOrigins?: string[] };
    widget?: {
      variant?: "compact" | "expanded";
      avatar?: { type: string };
      color?: { primary: string };
    };
  };
}

export interface KnowledgeBaseRef {
  type: "text" | "url" | "file";
  name: string;
  id: string;
}

export interface KBDocument {
  id: string;
  name: string;
  type: "text" | "url" | "file";
  created_at: string;
  status: string;
}

export interface Conversation {
  conversation_id: string;
  agent_id: string;
  status: string;
  start_time: string;
  end_time?: string;
  transcript?: ConversationMessage[];
}

export interface ConversationMessage {
  role: "agent" | "user";
  message: string;
  timestamp: number;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  tool_name: string;
  parameters: Record<string, unknown>;
  result?: string;
}

export interface PhoneNumber {
  phone_number_id: string;
  phone_number: string;
  provider: "twilio" | "sip" | "whatsapp";
  agent_id?: string;
  label?: string;
}

export interface UsageMetrics {
  character_count: number;
  character_count_change: number;
  character_limit: number;
  voice_count: number;
}

export interface SignedUrlResponse {
  signed_url: string;
}

export interface ConversationTokenResponse {
  token: string;
}

export type ConnectionType = "webrtc" | "websocket";

export interface ClientTool {
  [name: string]: (params: Record<string, unknown>) => string | Promise<string>;
}

export interface ConversationOverrides {
  agent?: {
    prompt?: { prompt?: string; llm?: string };
    firstMessage?: string;
    language?: string;
  };
  tts?: {
    voiceId?: string;
    speed?: number;
    stability?: number;
    similarityBoost?: number;
  };
  conversation?: {
    textOnly?: boolean;
  };
}
