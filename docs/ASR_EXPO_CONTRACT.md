# X5 — Mobile ASR Contract (DI-only)

## Goal
Provide a testable, platform-agnostic ASR adapter for mobile speech-to-text without adding Expo/RN dependencies.

## Non-goals
- No audio capture implementation
- No Expo / native modules imports
- No Web Speech API
- No defaults or silent fallback

## Input
```ts
interface VoiceASRInput {
  locale: 'fr-FR' | 'en-US';
  capturedAt: string; // ISO 8601
}