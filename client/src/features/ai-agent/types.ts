export interface VoiceSettings {
  aiAgentName: string;
  marcelaAgentId: string;
  marcelaVoiceId: string;
  marcelaTtsModel: string;
  marcelaSttModel: string;
  marcelaOutputFormat: string;
  marcelaStability: number;
  marcelaSimilarityBoost: number;
  marcelaSpeakerBoost: boolean;
  marcelaChunkSchedule: string;
  marcelaLlmModel: string;
  marcelaMaxTokens: number;
  marcelaMaxTokensVoice: number;
  marcelaEnabled: boolean;
  showAiAssistant: boolean;
  marcelaTwilioEnabled: boolean;
  marcelaSmsEnabled: boolean;
  marcelaPhoneGreeting: string;
  marcelaLanguage: string;
  marcelaTurnTimeout: number;
  marcelaAvatarUrl: string;
  marcelaWidgetVariant: string;
  marcelaSpeed: number;
  marcelaStreamingLatency: number;
  marcelaTextNormalisation: string;
  marcelaAsrProvider: string;
  marcelaInputAudioFormat: string;
  marcelaBackgroundVoiceDetection: boolean;
  marcelaTurnEagerness: string;
  marcelaSpellingPatience: string;
  marcelaSpeculativeTurn: boolean;
  marcelaSilenceEndCallTimeout: number;
  marcelaMaxDuration: number;
  marcelaCascadeTimeout: number;
}

export interface TwilioStatus {
  connected: boolean;
  phoneNumber: string | null;
  error?: string;
}

export const TTS_MODEL_FAMILIES = [
  { value: "eleven_v3_conversational", label: "V3 Conversational", description: "Ultra-low latency, context-aware delivery, 70+ languages", badge: "Alpha" },
  { value: "eleven_flash_v2_5", label: "Flash v2.5", description: "Fastest model, optimized for real-time streaming" },
  { value: "eleven_multilingual_v2", label: "Multilingual v2", description: "High quality multilingual voice synthesis" },
] as const;

export const SUGGESTED_AUDIO_TAGS_OPTIONS = [
  "Patient", "Laughing", "US accent", "Sighs", "Concerned",
  "Excited", "Chuckles", "Coughs", "French accent", "Whispering",
  "Sad", "Angry", "Disappointed", "Enthusiastic", "Serious",
  "Singing", "Cheerful", "Nervous", "Hesitant", "Calm",
] as const;

export const OUTPUT_FORMATS = [
  { value: "pcm_16000", label: "PCM 16kHz", description: "16-bit PCM at 16kHz — optimal for real-time streaming" },
  { value: "pcm_22050", label: "PCM 22.05kHz", description: "16-bit PCM at 22.05kHz — higher quality" },
  { value: "pcm_24000", label: "PCM 24kHz", description: "16-bit PCM at 24kHz — studio quality" },
  { value: "pcm_44100", label: "PCM 44.1kHz", description: "16-bit PCM at 44.1kHz — CD quality" },
  { value: "mp3_44100_128", label: "MP3 128kbps", description: "Compressed audio, higher latency" },
  { value: "ulaw_8000", label: "u-law 8kHz", description: "Telephony standard" },
];

export const LLM_MODELS = [
  { value: "glm-45-air-fp8", label: "GLM-4.5-Air", description: "Great for agentic use cases", provider: "ElevenLabs" },
  { value: "qwen3-30b-a3b", label: "Qwen3-30B-A3B", description: "Ultra low latency", provider: "ElevenLabs" },

  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview", description: "Google's most capable model", provider: "Google" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview", description: "Fast next-gen model", provider: "Google" },
  { value: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite Preview", description: "Fastest next-gen model", provider: "Google" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Advanced reasoning model", provider: "Google" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Fast thinking model", provider: "Google" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", description: "Lightweight and fast", provider: "Google" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Fast multimodal model", provider: "Google" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", description: "Lightest 2.0 model", provider: "Google" },

  { value: "gpt-5.4", label: "GPT-5.4", description: "OpenAI's latest model", provider: "OpenAI" },
  { value: "gpt-5.4-pro", label: "GPT-5.4 Pro", description: "Most capable GPT-5", provider: "OpenAI" },
  { value: "gpt-5.3", label: "GPT-5.3", description: "Strong GPT-5 series", provider: "OpenAI" },
  { value: "gpt-5", label: "GPT-5", description: "OpenAI's flagship model", provider: "OpenAI" },
  { value: "gpt-5-mini", label: "GPT-5 Mini", description: "Compact GPT-5", provider: "OpenAI" },
  { value: "gpt-5-nano", label: "GPT-5 Nano", description: "Fastest GPT-5", provider: "OpenAI" },
  { value: "o3", label: "o3", description: "Advanced reasoning model", provider: "OpenAI" },
  { value: "o3-pro", label: "o3 Pro", description: "Most capable reasoning", provider: "OpenAI" },
  { value: "o4-mini", label: "o4 Mini", description: "Fast reasoning model", provider: "OpenAI" },

  { value: "claude-opus-4-6", label: "Claude Opus 4.6", description: "Most capable Anthropic model", provider: "Anthropic" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", description: "Latest Anthropic Sonnet", provider: "Anthropic" },
  { value: "claude-opus-4-5", label: "Claude Opus 4.5", description: "Strong reasoning", provider: "Anthropic" },
  { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", description: "Balanced performance", provider: "Anthropic" },
  { value: "claude-sonnet-4", label: "Claude Sonnet 4", description: "Efficient Sonnet", provider: "Anthropic" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5", description: "Fast and efficient", provider: "Anthropic" },

  { value: "grok-4.20-beta", label: "Grok 4.20 Beta", description: "xAI's latest model", provider: "xAI" },
  { value: "grok-4", label: "Grok 4", description: "xAI's flagship model", provider: "xAI" },
  { value: "grok-4-1-fast", label: "Grok 4.1 Fast", description: "Fast xAI model", provider: "xAI" },
  { value: "grok-4-fast", label: "Grok 4 Fast", description: "Fast Grok 4", provider: "xAI" },
  { value: "grok-3", label: "Grok 3", description: "Strong general model", provider: "xAI" },
  { value: "grok-3-mini", label: "Grok 3 Mini", description: "Compact Grok 3", provider: "xAI" },
  { value: "grok-code-fast-1", label: "Grok Code Fast 1", description: "Code-optimized model", provider: "xAI" },

  { value: "custom-llm", label: "Custom LLM", description: "Use your own LLM endpoint", provider: "Other" },
];

export const WIDGET_VARIANTS = [
  { value: "tiny", label: "Tiny", description: "Minimal interface" },
  { value: "compact", label: "Compact", description: "Standard interface" },
  { value: "full", label: "Full", description: "Expanded interface" },
] as const;

export const WIDGET_PLACEMENTS = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom", label: "Bottom Center" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
  { value: "top", label: "Top Center" },
] as const;
