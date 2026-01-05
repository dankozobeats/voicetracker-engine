# Voice Mobile Contract (X1)

This document defines the **mobile adapter contract** for the Voice Transaction module.

## Scope

- Mobile provides **raw text only** (no ASR / speech-to-text here).
- The adapter validates input strictly and forwards it into the existing voice pipeline:
  `text → parser → normalizer → TransactionCreateInput`
- No UI, DOM, browser, or mobile dependencies are allowed in the adapter.

## Input

```ts
export interface VoiceMobileInput {
  text: string;
  locale: 'fr-FR' | 'en-US';
  capturedAt: string; // ISO 8601 with timezone
}
```

## Adapter API

File: `src/voice/adapters/mobile.adapter.ts`

```ts
export function voiceMobileToTransactionCreateInput(
  input: VoiceMobileInput,
  context: VoiceTransactionContext
): TransactionCreateInput;
```

### Context forwarding

The adapter forwards the provided `VoiceTransactionContext` to the voice pipeline **as-is**.

The only derived value is:
- `defaultDate`: if `context.defaultDate` is not provided, the adapter derives it from `input.capturedAt` (YYYY-MM-DD).

No other defaults are invented or inferred by the adapter.

## Locale support

- `fr-FR`: supported for V1 (French transcripts).
- `en-US`: explicitly rejected with a typed adapter error (unsupported locale).

## Errors

The adapter throws **typed errors only**:

- `VoiceMobileAdapterError` for invalid mobile input:
  - invalid shape / empty text
  - invalid `capturedAt`
  - unsupported locale
- `VoiceTransactionError` may be rethrown when the underlying voice pipeline rejects input
  (e.g. missing required context, unsupported V1 format).

