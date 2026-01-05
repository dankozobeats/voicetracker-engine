import type {
    SpeechRecognizer,
    VoiceASRInput,
    ASRResult,
    SupportedLocale,
  } from './asr.contract';
  
  import {
    ASRUnavailableError,
    UnsupportedLocaleError,
    InvalidCapturedAtError,
    EmptyTranscriptError,
    ASRRuntimeError,
  } from './asr.errors';
  
  const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['fr-FR', 'en-US'] as const;
  
  function isSupportedLocale(locale: string): locale is SupportedLocale {
    return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
  }
  
  function isValidISODate(value: string): boolean {
    const d = new Date(value);
    return !Number.isNaN(d.getTime()) && d.toISOString() === value;
  }
  
  export async function transcribeFromMicrophone(
    recognizer: SpeechRecognizer | undefined,
    input: VoiceASRInput,
  ): Promise<ASRResult> {
    if (!recognizer) {
      throw new ASRUnavailableError();
    }
  
    const { locale, capturedAt } = input;
  
    if (!isSupportedLocale(locale)) {
      throw new UnsupportedLocaleError(locale);
    }
  
    if (!isValidISODate(capturedAt)) {
      throw new InvalidCapturedAtError(capturedAt);
    }
  
    try {
      await recognizer.start();
      await recognizer.stop();
  
      const transcript = await recognizer.getTranscript();
  
      const text = transcript.text?.trim() ?? '';
  
      if (!text) {
        throw new EmptyTranscriptError();
      }
  
      return {
        text,
        locale,
        capturedAt,
        confidence: transcript.confidence,
      };
    } catch (error) {
      if (error instanceof EmptyTranscriptError) {
        throw error;
      }
  
      if (error instanceof Error) {
        throw new ASRRuntimeError(error.message, error);
      }
  
      throw new ASRRuntimeError('Unknown ASR runtime error', error);
    }
  }