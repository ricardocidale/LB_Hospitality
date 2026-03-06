export interface VoiceSettings {
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
}

export interface TwilioStatus {
  connected: boolean;
  phoneNumber: string | null;
  error?: string;
}

export const TTS_MODELS = [
  { value: "eleven_flash_v2_5", label: "Flash v2.5", description: "Lowest latency, ideal for real-time streaming" },
  { value: "eleven_flash_v2", label: "Flash v2", description: "Low latency, good quality" },
  { value: "eleven_multilingual_v2", label: "Multilingual v2", description: "High quality, supports 29 languages" },
  { value: "eleven_turbo_v2_5", label: "Turbo v2.5", description: "Balanced latency and quality" },
  { value: "eleven_turbo_v2", label: "Turbo v2", description: "Fast generation with good quality" },
  { value: "eleven_monolingual_v1", label: "Monolingual v1", description: "English only, reliable quality" },
];

export const STT_MODELS = [
  { value: "scribe_v1", label: "Scribe v1", description: "ElevenLabs native transcription" },
];

export const OUTPUT_FORMATS = [
  { value: "pcm_16000", label: "PCM 16kHz", description: "16-bit PCM at 16kHz — optimal for real-time streaming" },
  { value: "pcm_22050", label: "PCM 22.05kHz", description: "16-bit PCM at 22.05kHz — higher quality" },
  { value: "pcm_24000", label: "PCM 24kHz", description: "16-bit PCM at 24kHz — studio quality" },
  { value: "pcm_44100", label: "PCM 44.1kHz", description: "16-bit PCM at 44.1kHz — CD quality" },
  { value: "mp3_44100_128", label: "MP3 128kbps", description: "Compressed audio, higher latency" },
  { value: "ulaw_8000", label: "μ-law 8kHz", description: "Telephony standard" },
];

export const LLM_MODELS = [
  { value: "gpt-4.1", label: "GPT-4.1", description: "Latest OpenAI model — best reasoning" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini", description: "Faster, more economical" },
  { value: "gpt-4.1-nano", label: "GPT-4.1 Nano", description: "Fastest, most economical" },
  { value: "gpt-4o", label: "GPT-4o", description: "Previous flagship model" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Compact but capable" },
];
