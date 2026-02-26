import { ElevenLabsClient } from 'elevenlabs';
import WebSocket from 'ws';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=elevenlabs',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('ElevenLabs not connected');
  }
  return connectionSettings.settings.api_key;
}

export async function getUncachableElevenLabsClient() {
  const apiKey = await getCredentials();
  return new ElevenLabsClient({ apiKey });
}

export async function getElevenLabsApiKey() {
  return await getCredentials();
}

export const MARCELA_VOICE_ID = 'cgSgspJ2msm6clMCkdW9';

export interface VoiceConfig {
  voiceId: string;
  ttsModel: string;
  sttModel: string;
  outputFormat: string;
  stability: number;
  similarityBoost: number;
  speakerBoost: boolean;
  chunkSchedule: number[];
}

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voiceId: MARCELA_VOICE_ID,
  ttsModel: 'eleven_flash_v2_5',
  sttModel: 'scribe_v1',
  outputFormat: 'pcm_16000',
  stability: 0.5,
  similarityBoost: 0.8,
  speakerBoost: false,
  chunkSchedule: [120, 160, 250, 290],
};

export function buildVoiceConfigFromDB(ga: Record<string, unknown>): VoiceConfig {
  const chunkStr = (ga.marcelaChunkSchedule as string) || '120,160,250,290';
  return {
    voiceId: (ga.marcelaVoiceId as string) || DEFAULT_VOICE_CONFIG.voiceId,
    ttsModel: (ga.marcelaTtsModel as string) || DEFAULT_VOICE_CONFIG.ttsModel,
    sttModel: (ga.marcelaSttModel as string) || DEFAULT_VOICE_CONFIG.sttModel,
    outputFormat: (ga.marcelaOutputFormat as string) || DEFAULT_VOICE_CONFIG.outputFormat,
    stability: (ga.marcelaStability as number) ?? DEFAULT_VOICE_CONFIG.stability,
    similarityBoost: (ga.marcelaSimilarityBoost as number) ?? DEFAULT_VOICE_CONFIG.similarityBoost,
    speakerBoost: (ga.marcelaSpeakerBoost as boolean) ?? DEFAULT_VOICE_CONFIG.speakerBoost,
    chunkSchedule: chunkStr.split(',').map(Number).filter(n => !isNaN(n)),
  };
}

export async function createElevenLabsStreamingTTS(
  voiceId: string,
  onAudioChunk: (audioBase64: string) => void,
  options: { modelId?: string; outputFormat?: string; stability?: number; similarityBoost?: number; speakerBoost?: boolean; chunkSchedule?: number[] } = {}
) {
  const {
    modelId = DEFAULT_VOICE_CONFIG.ttsModel,
    outputFormat = DEFAULT_VOICE_CONFIG.outputFormat,
    stability = DEFAULT_VOICE_CONFIG.stability,
    similarityBoost = DEFAULT_VOICE_CONFIG.similarityBoost,
    speakerBoost = DEFAULT_VOICE_CONFIG.speakerBoost,
    chunkSchedule = DEFAULT_VOICE_CONFIG.chunkSchedule,
  } = options;
  const apiKey = await getCredentials();
  const uri = 'wss://api.elevenlabs.io/v1/text-to-speech/' + voiceId + '/stream-input?model_id=' + modelId + '&output_format=' + outputFormat;

  const websocket = new WebSocket(uri, {
    headers: { 'xi-api-key': apiKey },
  });

  return new Promise<{
    send: (text: string) => void;
    flush: () => void;
    close: () => void;
  }>((resolve, reject) => {
    websocket.on('error', reject);

    websocket.on('open', () => {
      websocket.send(JSON.stringify({
        text: ' ',
        voice_settings: { stability, similarity_boost: similarityBoost, use_speaker_boost: speakerBoost },
        generation_config: { chunk_length_schedule: chunkSchedule },
      }));

      resolve({
        send: (text: string) => {
          websocket.send(JSON.stringify({ text }));
        },
        flush: () => {
          websocket.send(JSON.stringify({ text: ' ', flush: true }));
        },
        close: () => {
          websocket.send(JSON.stringify({ text: '' }));
        },
      });
    });

    websocket.on('message', (event) => {
      const data = JSON.parse(event.toString());
      if (data.audio) {
        onAudioChunk(data.audio);
      }
    });
  });
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string, sttModel?: string): Promise<string> {
  const apiKey = await getCredentials();

  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer]), filename);
  formData.append('model_id', sttModel || DEFAULT_VOICE_CONFIG.sttModel);

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Transcription failed: ' + response.statusText);
  }

  const result = await response.json() as { text: string };
  return result.text;
}
