export type SupportedLocale = 'fr-FR' | 'en-US';

export interface VoiceASRInput {
  locale: SupportedLocale;
  capturedAt: string; // ISO 8601
}

export interface ASRResult {
  text: string;
  locale: SupportedLocale;
  capturedAt: string;
  confidence?: number;
}

export interface SpeechRecognizer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getTranscript(): Promise<{
    text: string;
    confidence?: number;
  }>;
}