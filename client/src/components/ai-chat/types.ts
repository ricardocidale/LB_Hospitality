export interface Message {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  title: string;
  channel?: string;
  createdAt: string;
  messages?: Message[];
}

export interface PhoneInfo {
  enabled: boolean;
  phoneNumber: string | null;
}

export type VoiceState = "idle" | "recording" | "processing" | "thinking" | "speaking";
