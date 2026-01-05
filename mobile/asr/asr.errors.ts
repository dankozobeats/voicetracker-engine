export type ASRErrorCode =
  | 'ASR_UNAVAILABLE'
  | 'UNSUPPORTED_LOCALE'
  | 'INVALID_CAPTURED_AT'
  | 'EMPTY_TRANSCRIPT'
  | 'ASR_RUNTIME_ERROR';

export class ASRError extends Error {
  readonly code: ASRErrorCode;
  readonly cause?: unknown;

  constructor(code: ASRErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'ASRError';
    this.code = code;
    this.cause = cause;
  }
}

export class ASRUnavailableError extends ASRError {
  constructor() {
    super('ASR_UNAVAILABLE', 'Speech recognizer is not available (missing injection).');
    this.name = 'ASRUnavailableError';
  }
}

export class UnsupportedLocaleError extends ASRError {
  constructor(locale: string) {
    super('UNSUPPORTED_LOCALE', `Unsupported locale: ${locale}`);
    this.name = 'UnsupportedLocaleError';
  }
}

export class InvalidCapturedAtError extends ASRError {
  constructor(value: string) {
    super('INVALID_CAPTURED_AT', `capturedAt must be a valid ISO 8601 string: ${value}`);
    this.name = 'InvalidCapturedAtError';
  }
}

export class EmptyTranscriptError extends ASRError {
  constructor() {
    super('EMPTY_TRANSCRIPT', 'Transcript is empty.');
    this.name = 'EmptyTranscriptError';
  }
}

export class ASRRuntimeError extends ASRError {
  constructor(message: string, cause?: unknown) {
    super('ASR_RUNTIME_ERROR', message, cause);
    this.name = 'ASRRuntimeError';
  }
}