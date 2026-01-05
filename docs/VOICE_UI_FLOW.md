# Voice UI Flow (Web) — X4

This document describes the web UI flow for creating a transaction from **raw voice text**.

## Inputs

- Raw text entered by the user.
- Explicit `VoiceTransactionContext` fields entered by the user:
  - `defaultDate` (required for relative dates and year inference)
  - `defaultAccount` (optional; required if not present in text)
  - `defaultType` (optional; required unless the pipeline can infer it)

No defaults are invented by the UI.

## Flow

1. User enters raw text.
2. User provides context fields (explicit).
3. UI calls the existing voice pipeline:
   - `voiceToTransactionCreateInput(text, context)`
4. UI renders a **read-only preview** of the resulting `TransactionCreateInput`.
5. User explicitly confirms.
6. UI submits the payload **as-is**:
   - `POST /api/transactions/voice`
7. UI shows either success or an explicit error message.

## Error handling

- Voice parsing/normalization errors are displayed explicitly (typed `VoiceTransactionError.code`).
- API errors are displayed explicitly (HTTP status + message).

